let adminProtocols = [];
if (typeof channels_config === 'undefined') {
    window.channels_config = [];
}
let editingIndex = -1;
let quill;
let isHtmlMode = false;

// Cloud gateway URL (A)
let CLOUD_GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbytVnxql5WPL3eGZLjbLeE-ik2Ia6EAJP6O4DThs-A_H_pp4kad_oiv1NnEdwdoj-Oi/exec';
// Cloud Spreadsheet ID (B)
let CLOUD_SPREADSHEET_ID = '1bJF6nCVDKnsS6fTUdGNQ3bGncvP_6WKCudtP1lH2XIw'; 

// --- Comment module state ---
let _allComments = [];
let _commentFilter = 'all';
let _commentPage = 1;
const _commentsPerPage = 20;
let _replyTargetId = null;

// --- Environment detection ---
const IS_LOCAL_SERVER = (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:'
);

// Protección por contraseña
(function() {
    const isLocalhost = IS_LOCAL_SERVER;
    
    // Si es local, saltamos directamente la validación para mayor comodidad y evitar errores de CORS/Storage
    if (isLocalhost) {
        console.log("Acceso local detectado: Saltando validación de auth.");
        return;
    }

    let storedPass = null;
    try {
        storedPass = sessionStorage.getItem('adminAuth');
    } catch (e) {
        console.warn("Storage bloqueado por política de seguridad del navegador.");
    }

    if (storedPass !== 'Recp2026') {
        const pass = prompt('Introduce la clave de administrador:');
        if (pass === 'Recp2026') {
            try {
                sessionStorage.setItem('adminAuth', 'Recp2026');
            } catch(e) {}
        } else {
            alert('Acceso denegado');
            window.location.href = 'index.html';
        }
    }
})();

// Sorting state
let currentSortColumn = 'section';
let currentSortDirection = 'asc';

let currentIconInput = null;
const iconBank = [
    // --- Hotel & Front Desk ---
    'fa-hotel', 'fa-concierge-bell', 'fa-bed', 'fa-key', 'fa-door-open', 'fa-door-closed', 'fa-bell', 
    'fa-suitcase', 'fa-suitcase-rolling', 'fa-passport', 'fa-id-card', 'fa-credit-card', 'fa-money-bill-wave', 
    'fa-receipt', 'fa-file-invoice', 'fa-file-invoice-dollar', 'fa-calendar-check', 'fa-calendar-alt', 
    'fa-clock', 'fa-phone', 'fa-headset', 'fa-comments', 'fa-wheelchair', 'fa-baby-carriage', 'fa-paw',
    // --- Amenities & Facilities ---
    'fa-swimming-pool', 'fa-spa', 'fa-hot-tub', 'fa-dumbbell', 'fa-utensils', 'fa-coffee', 'fa-glass-martini', 
    'fa-wine-glass', 'fa-parking', 'fa-car', 'fa-shuttle-van', 'fa-wifi', 'fa-tv', 'fa-snowflake', 'fa-fire', 
    'fa-fan', 'fa-smoking-ban', 'fa-map-signs', 'fa-map-marker-alt',
    // --- Housekeeping & Maintenance ---
    'fa-broom', 'fa-spray-can', 'fa-pump-soap', 'fa-soap', 'fa-bath', 'fa-shower', 'fa-sink', 'fa-toilet', 
    'fa-tools', 'fa-wrench', 'fa-cogs', 'fa-cog', 'fa-paint-roller',
    // --- Training, Manuals & HR ---
    'fa-book', 'fa-book-open', 'fa-book-reader', 'fa-chalkboard-teacher', 'fa-user-graduate', 'fa-graduation-cap', 
    'fa-laptop', 'fa-file-alt', 'fa-file-pdf', 'fa-folder-open', 'fa-folder', 'fa-clipboard-list', 'fa-clipboard-check', 
    'fa-tasks', 'fa-list-ol', 'fa-list-ul', 'fa-sitemap', 'fa-network-wired', 'fa-project-diagram', 
    'fa-users', 'fa-user', 'fa-users-cog', 'fa-user-tie', 'fa-user-shield', 'fa-desktop', 'fa-laptop-code',
    // --- Safety & Health ---
    'fa-shield-alt', 'fa-hard-hat', 'fa-exclamation-triangle', 'fa-fire-extinguisher', 'fa-first-aid', 'fa-medkit', 
    'fa-heartbeat', 'fa-thermometer-half', 'fa-ambulance',
    // --- Business & Strategy ---
    'fa-lightbulb', 'fa-brain', 'fa-bullseye', 'fa-chart-line', 'fa-chart-pie', 'fa-chart-bar', 'fa-sync-alt', 
    'fa-handshake', 'fa-chart-area', 'fa-bullhorn', 'fa-newspaper',
    // --- Misc UI / Common ---
    'fa-star', 'fa-check', 'fa-times', 'fa-info-circle', 'fa-plus', 'fa-minus', 'fa-envelope', 'fa-camera', 
    'fa-video', 'fa-globe', 'fa-heart', 'fa-thumbs-up', 'fa-smile', 'fa-walking'
];

// --- Custom Quill Blots for HTML Safety ---
// Allows DIV, ARTICLE and SECTION tags and preserves their classes/styles
if (typeof Quill !== 'undefined') {
    const Block = Quill.import('blots/block');
    const Inline = Quill.import('blots/inline');

    class DivBlot extends Block {
        static create(value) {
            let node = super.create();
            if (value && typeof value === 'string') node.setAttribute('class', value);
            return node;
        }
        static formats(node) {
            return node.getAttribute('class');
        }
    }
    DivBlot.blotName = 'div';
    DivBlot.tagName = 'div';
    Quill.register(DivBlot);

    class ArticleBlot extends Block {}
    ArticleBlot.blotName = 'article';
    ArticleBlot.tagName = 'article';
    Quill.register(ArticleBlot);

    class SectionBlot extends Block {}
    SectionBlot.blotName = 'section';
    SectionBlot.tagName = 'section';
    Quill.register(SectionBlot);

    // Register Attributors to preserve styles and classes
    const StyleAttributor = Quill.import('attributors/style/size');
    const ClassAttributor = Quill.import('attributors/class/color');
    const DirectionAttributor = Quill.import('attributors/style/direction');
    
    // We register generic attributors for style/class on blocks
    const BlockAttribute = Quill.import('attributors/style/align'); // example base
}

function initQuill() {

    if (!quill) {
        // Register custom icons
        const Icons = Quill.import('ui/icons');
        Icons['attachment'] = '<i class="fas fa-paperclip" style="font-size: 15px;"></i>';

        quill = new Quill('#quill-editor', {
            theme: 'snow',
            modules: {
                toolbar: {
                    container: [
                        [{ 'font': [] }, { 'size': [] }],
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'script': 'sub'}, { 'script': 'super' }],
                        [{ 'header': 1 }, { 'header': 2 }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
                        [{ 'direction': 'rtl' }, { 'align': [] }],
                        ['link', 'image', 'video', 'attachment'],
                        ['blockquote', 'code-block'],
                        ['clean']
                    ],
                    handlers: {
                        'attachment': function() {
                            selectFileAndUpload();
                        }
                    }
                }
            }
        });
    }
}

function selectFileAndUpload() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar');
    
    input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;

        // Show a temporary tooltip or loading indicator if possible
        const range = quill.getSelection(true);
        const fileName = file.name;
        
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Determine API URL based on environment
            const uploadUrl = window.location.protocol === 'file:' ? 'http://localhost:3000/api/upload' : '/api/upload';
            
            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                const fileUrl = result.url;
                
                if (!isHtmlMode) {
                    // Visual/Quill mode
                    const range = quill.getSelection(true) || { index: 0 };
                    quill.insertText(range.index, fileName, 'link', fileUrl);
                    quill.setSelection(range.index + fileName.length);
                } else {
                    // Pure HTML mode
                    const htmlArea = document.getElementById('html-editor');
                    if (htmlArea) {
                        const linkHtml = `<a href="${fileUrl}">${fileName}</a>`;
                        const start = htmlArea.selectionStart;
                        const end = htmlArea.selectionEnd;
                        const text = htmlArea.value;
                        htmlArea.value = text.slice(0, start) + linkHtml + text.slice(end);
                        htmlArea.focus();
                        htmlArea.selectionStart = start + linkHtml.length;
                        htmlArea.selectionEnd = start + linkHtml.length;
                    }
                }
                showToast('📎 Documento adjuntado!');
                refreshAttachmentsSummary();
            } else {
                alert('Error al subir archivo: ' + result.message);
            }
        } catch (error) {
            console.error('Error subiendo archivo:', error);
            alert('Error conectando con el servidor para la subida.');
        }
    };

    input.click();
}

/**
 * Módulo para vincular apartados internos
 */
function openLinkModal() {
    const modal = document.getElementById('modal-links');
    modal.style.display = 'flex';
    document.getElementById('internal-link-search').value = '';
    renderLinkList('');
    document.getElementById('internal-link-search').focus();
}

function renderLinkList(filter = '') {
    const container = document.getElementById('internal-link-list');
    container.innerHTML = '';
    
    const filtered = adminProtocols.filter(p => 
        p.title.toLowerCase().includes(filter.toLowerCase()) || 
        (p.section && p.section.includes(filter))
    );

    if (filtered.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No se encontraron resultados.</div>';
        return;
    }

    filtered.forEach(p => {
        const item = document.createElement('div');
        item.style.padding = '12px 15px';
        item.style.borderBottom = '1px solid #eee';
        item.style.cursor = 'pointer';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.className = 'link-item-selectable';
        
        const cleanTitle = p.title.replace(/\{.*?\}/, '').trim();
        item.innerHTML = `
            <div>
                <div style="font-weight: 600;">${cleanTitle}</div>
                <div style="font-size: 0.8rem; color: #777;">Sección: ${p.section || 's/s'}</div>
            </div>
            <button class="btn-primary" style="padding: 5px 10px; font-size: 0.75rem;">Vincular</button>
        `;
        
        item.onclick = () => insertInternalLink(p);
        container.appendChild(item);
    });
}

function insertInternalLink(p) {
    const cleanTitle = p.title.replace(/\{.*?\}/, '').trim();
    const linkText = `Ver más información: ${cleanTitle}`;
    const sectionId = p.section;
    
    if (!isHtmlMode) {
        // En Quill, los atributos data- se pierden a veces si no hay un blot personalizado,
        // así que usaremos un formato de link reconocible para el app.js del frontal.
        // Formato: #section/1.1
        const range = quill.getSelection(true) || { index: 0 };
        quill.insertText(range.index, linkText, 'link', `#section/${sectionId}`);
        quill.setSelection(range.index + linkText.length);
    } else {
        const htmlArea = document.getElementById('html-editor');
        const linkHtml = `<a href="#section/${sectionId}" class="internal-link">📊 ${linkText}</a>`;
        const start = htmlArea.selectionStart;
        const end = htmlArea.selectionEnd;
        const text = htmlArea.value;
        htmlArea.value = text.slice(0, start) + linkHtml + text.slice(end);
    }
    
    document.getElementById('modal-links').style.display = 'none';
    showToast('🔗 Vínculo a apartado insertado');
    refreshAttachmentsSummary();
}

/**
 * Escanea el editor y muestra un resumen de archivos y vínculos internos
 */
function refreshAttachmentsSummary() {
    const summaryPanel = document.getElementById('attachments-management');
    if (!summaryPanel) return;
    
    const container = document.getElementById('attachments-list');
    container.innerHTML = '';
    
    const content = !isHtmlMode 
        ? quill.root.innerHTML 
        : document.getElementById('html-editor').value;
        
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const allLinks = doc.querySelectorAll('a');
    
    const docsFound = [];
    const internalFound = [];
    
    allLinks.forEach(a => {
        const href = a.getAttribute('href') || '';
        const text = a.innerText.trim() || 'Sin texto';
        
        if (href.includes('documentos/')) {
            docsFound.push({ href, text });
        } else if (href.startsWith('#section/')) {
            internalFound.push({ href, text });
        }
    });
    
    if (docsFound.length === 0 && internalFound.length === 0) {
        summaryPanel.style.display = 'none';
        return;
    }
    
    summaryPanel.style.display = 'block';
    
    // Render
    docsFound.forEach(d => renderSummaryItem(d, 'fa-file-pdf', '#c62828', container));
    internalFound.forEach(i => renderSummaryItem(i, 'fa-link', '#6c5ce7', container));
}

function renderSummaryItem(item, icon, color, parent) {
    const div = document.createElement('div');
    div.style.background = '#fff';
    div.style.border = `1px solid ${color}33`; // low opacity border
    div.style.borderRadius = '6px';
    div.style.padding = '8px 12px';
    div.style.fontSize = '0.8rem';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.gap = '8px';
    
    div.innerHTML = `
        <i class="fas ${icon}" style="color:${color}"></i>
        <span style="font-weight:600; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.text}</span>
        <i class="fas fa-times" style="color: #999; cursor: pointer; padding: 2px 5px;" title="Eliminar del contenido"></i>
    `;
    
    // Deletion support (EXPERIMENTAL: simplistic regex remove - USE WITH CAUTION)
    div.querySelector('.fa-times').onclick = () => {
        if (!confirm('¿Seguro que quieres quitar este elemento del contenido?')) return;
        
        if (!isHtmlMode) {
             // In Quill, we just search for the link and remove it by finding the node
             const links = quill.root.querySelectorAll('a');
             links.forEach(l => {
                 if (l.getAttribute('href') === item.href) {
                     l.replaceWith(l.innerText); // keep text, remove link? Or just remove entirely?
                     // Let's remove link but keep text maybe? The user might prefer deleting entirely.
                     // l.remove(); 
                     l.replaceWith(''); // remove completely as it's an 'attachment' record
                 }
             });
        } else {
            const htmlArea = document.getElementById('html-editor');
            const currentHtml = htmlArea.value;
            // find exact <a href="...">text</a>? Hard to find perfectly with regex if same text exists
            // Since we know the href, we can try to find the full tag
            const parser = new DOMParser();
            const doc = parser.parseFromString(currentHtml, 'text/html');
            const links = doc.querySelectorAll('a');
            links.forEach(l => {
                if (l.getAttribute('href') === item.href) l.remove();
            });
            htmlArea.value = doc.body.innerHTML; 
        }
        refreshAttachmentsSummary();
    };
    
    parent.appendChild(div);
}

function initAdmin() {

    // Initialize Data
    if (typeof protocols_data !== 'undefined') {
        adminProtocols = Array.isArray(protocols_data) ? protocols_data : [];
        renderAdminTable(adminProtocols);
        updateCounters();
    } else {
        console.error("No protocols found in data.js");
        document.getElementById('protocol-table-body').innerHTML = '<tr><td colspan="5" class="text-center">Error: No se ha podido cargar data.js. Consulta la consola.</td></tr>';
    }

    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Search and Sort
    const applySearchAndSort = () => {
        const query = document.getElementById('admin-search').value.toLowerCase();
        let filtered = adminProtocols;
        if (query) {
            filtered = adminProtocols.filter(p => 
                (p.title && p.title.toLowerCase().includes(query)) || 
                (p.section && p.section.toLowerCase().includes(query))
            );
        }
        renderAdminTable(filtered);
    };

    document.getElementById('admin-search').addEventListener('input', applySearchAndSort);

    // Sorting Headers
    document.querySelectorAll('.sort-header').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-sort');
            if (currentSortColumn === column) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = column;
                currentSortDirection = 'asc';
            }
            applySearchAndSort();
        });
    });

    // New Protocol
    document.getElementById('btn-nuevo').addEventListener('click', () => {
        openEditor();
    });

    // Back to List
    document.getElementById('btn-back-to-list').addEventListener('click', () => {
        switchTab('listado');
    });

    // Comment Moderation Buttons
    const btnRefreshComments = document.getElementById('btn-refresh-comments');
    if (btnRefreshComments) {
        btnRefreshComments.addEventListener('click', loadAdminComments);
    }
    
    const btnSyncCloud = document.getElementById('btn-sync-cloud-comments');
    if (btnSyncCloud) {
        btnSyncCloud.addEventListener('click', syncCloudComments);
    }
    
    const btnAddManualComment = document.getElementById('btn-add-manual-comment');
    if (btnAddManualComment) {
        btnAddManualComment.addEventListener('click', openManualCommentModal);
    }

    // Periodically check for new comments to update badge (only in local server mode)
    if (IS_LOCAL_SERVER) {
        setInterval(updatePendingBadge, 30000);
        setTimeout(updatePendingBadge, 2000);
    } else {
        // On GitHub Pages: hide comments tab badge and disable server-only buttons
        const commentsTab = document.querySelector('.tab-btn[data-tab="comentarios"]');
        if (commentsTab) {
            commentsTab.title = 'Los comentarios están disponibles solo en el administrador local';
            commentsTab.style.opacity = '0.5';
        }
        // Disable sync/manual comment buttons
        ['btn-sync-cloud-comments','btn-add-manual-comment','btn-refresh-comments'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.disabled = true; el.style.opacity = '0.4'; el.style.cursor = 'not-allowed'; }
        });
        // Show informational message in comments table
        const tbody = document.getElementById('comments-table-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:40px; color:#999;"><i class="fas fa-server" style="font-size:2rem; display:block; margin-bottom:10px;"></i>Los comentarios solo se gestionan desde el <strong>administrador local</strong> (Abrir_Administrador.bat).</td></tr>';
    }

    // Save
    document.getElementById('btn-save').addEventListener('click', saveProtocol);

    // Delete in Editor
    const btnDeleteEditor = document.getElementById('btn-delete-editor');
    if (btnDeleteEditor) {
        btnDeleteEditor.addEventListener('click', () => {
            if (editingIndex >= 0) {
                deleteProtocol(editingIndex);
                switchTab('listado');
            }
        });
    }

    // Location/Section ID auto-generation listeners
    const editCategory = document.getElementById('edit-category');
    const editParent = document.getElementById('edit-parent-section');
    
    if (editCategory) {
        editCategory.addEventListener('change', () => {
            updateParentSections();
            generateNextId(true);
        });
    }
    
    if (editParent) {
        editParent.addEventListener('change', () => {
            generateNextId(true);
        });
    }
    // Sync
    document.getElementById('btn-sync').addEventListener('click', () => {
        location.reload();
    });

    // General Attach Button (Works in both modes)
    const btnAttachGeneral = document.getElementById('btn-attach-general');
    if (btnAttachGeneral) {
        btnAttachGeneral.addEventListener('click', selectFileAndUpload);
    }

    // Modal Link Events
    const btnLinkInternal = document.getElementById('btn-link-internal');
    if (btnLinkInternal) {
        btnLinkInternal.addEventListener('click', openLinkModal);
    }

    const btnCloseLinks = document.getElementById('btn-close-links-modal');
    if (btnCloseLinks) {
        btnCloseLinks.addEventListener('click', () => {
            document.getElementById('modal-links').style.display = 'none';
        });
    }

    const searchLinks = document.getElementById('internal-link-search');
    if (searchLinks) {
        searchLinks.addEventListener('input', (e) => {
            renderLinkList(e.target.value);
        });
    }

    // Toggle HTML Mode
    document.getElementById('btn-toggle-html').addEventListener('click', () => {
        const htmlEditor = document.getElementById('html-editor');
        const btn = document.getElementById('btn-toggle-html');

        if (!isHtmlMode) {
            // Switch to HTML mode
            // Only overwrite HTML editor if it's currently empty or we want to sync from visual
            let content = quill.root.innerHTML;
            content = content.replace(/></g, '>\n<');
            htmlEditor.value = content;
            
            isHtmlMode = true;
            document.querySelector('.ql-toolbar').style.display = 'none';
            document.getElementById('quill-editor').style.display = 'none';
            htmlEditor.style.display = 'block';

            btn.innerHTML = '<i class="fas fa-eye"></i> Editor Visual';
            btn.classList.add('btn-primary');
            btn.classList.remove('btn-secondary');
        } else {
            // Switch to Visual mode
            const currentHtml = htmlEditor.value;
            // Check if there is advanced HTML that Quill might strip
            if (currentHtml.includes('class=') || currentHtml.includes('style=') || currentHtml.includes('<div')) {
                if (!confirm('⚠️ PRECAUCIÓN: Este protocolo contiene código HTML avanzado (clases, bloques, estilos). Si cambias al editor visual, Quill eliminará estos formatos y romperá el diseño. ¿Estás absolutamente seguro de continuar y perder el formato avanzado?')) {
                    return; // user cancelled
                }
            }
            
            quill.clipboard.dangerouslyPasteHTML(currentHtml);
            
            isHtmlMode = false;
            htmlEditor.style.display = 'none';
            document.querySelector('.ql-toolbar').style.display = 'block';
            document.getElementById('quill-editor').style.display = 'block';

            btn.innerHTML = '<i class="fas fa-code"></i> Editar en HTML puro';
            btn.classList.add('btn-secondary');
            btn.classList.remove('btn-primary');
        }
    });

    // Preview
    document.getElementById('btn-preview').addEventListener('click', () => {
        const title = document.getElementById('edit-title').value || 'Sin Título';
        let originalTitle = title;
        let cleanTitle = originalTitle;
        let estadoHtml = '';
        const emojiRegex = /\{([\u0000-\uFFFF\uD800-\uDBFF\uDC00-\uDFFF]+?)\}/;
        const emojiMatch = originalTitle.match(emojiRegex);

        if (emojiMatch) {
            const emoji = emojiMatch[1];
            let statusText = 'Desconocido';
            if (emoji === '🟢') statusText = 'Activo';
            else if (emoji === '🟠' || emoji === '🟡') statusText = 'En redacción';
            else if (emoji === '🔴') statusText = 'En proceso';
            else statusText = emoji;
           
            estadoHtml = `${emoji} <span style="color: var(--text-muted); font-weight: normal;">${statusText}</span>`;
            cleanTitle = originalTitle.replace(emojiMatch[0], '').trim();
        }

        const selectedStatus = document.getElementById('edit-status').value;
        let statusDisplay = selectedStatus || '⚪ Sin definir';
        if (selectedStatus === 'Activo') statusDisplay = '🟢 Activo';
        if (selectedStatus === 'En redacción') statusDisplay = '🟠 En redacción';
        if (selectedStatus === 'En proceso') statusDisplay = '🔴 En proceso';
        
        if (!selectedStatus && estadoHtml) statusDisplay = estadoHtml;

        let content = '';
        if (isHtmlMode) {
            content = document.getElementById('html-editor').value;
        } else {
            content = quill.root.innerHTML;
        }

        const section = document.getElementById('edit-section').value;
        const source = document.getElementById('edit-source').value || 'Ambos hoteles';
        const displaySource = source === 'Ambos hoteles' ? 'Sercotel Guadiana y Cumbria Spa & Hotel' : source;
        const dateStr = document.getElementById('edit-date').value === 'Automática' ? new Date().toISOString() : document.getElementById('edit-date').value;

        document.getElementById('preview-title').innerHTML = cleanTitle;
        document.getElementById('preview-status').innerHTML = statusDisplay;
        document.getElementById('preview-source').textContent = displaySource;

        // format date properly for preview if possible, using standard formatAdminDate or similar
        document.getElementById('preview-date').textContent = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

        if (section) {
            document.getElementById('preview-section').textContent = section;
            document.getElementById('preview-section').style.display = 'inline';
            document.getElementById('preview-section-sep').style.display = 'inline';
        } else {
            document.getElementById('preview-section').style.display = 'none';
            document.getElementById('preview-section-sep').style.display = 'none';
        }

        document.getElementById('preview-content').innerHTML = content;
        document.getElementById('preview-modal').style.display = 'flex';
    });

    document.getElementById('btn-close-preview').addEventListener('click', () => {
        document.getElementById('preview-modal').style.display = 'none';
    });

    // Theme Toggle Logic
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        // Init theme
        const isDark = localStorage.getItem('darkMode') === 'true';
        if (isDark) {
            document.body.classList.add('dark-mode');
            const icon = themeBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        }

        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDark);
            
            const icon = themeBtn.querySelector('i');
            if (isDark) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });
    }

    // Admin Access Protection / Redirection (for consistency)
    const adminBtn = document.getElementById('admin-access');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            // Already in admin, maybe just scroll to top or alert
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // GitHub Publish Logic
    const btnPublish = document.getElementById('btn-publish');
    if (btnPublish) {
        if (!IS_LOCAL_SERVER) {
            // On GitHub Pages: show info instead of trying to call missing API
            btnPublish.title = 'Solo disponible desde el administrador local';
            btnPublish.style.opacity = '0.4';
            btnPublish.style.cursor = 'not-allowed';
            btnPublish.addEventListener('click', (e) => {
                e.preventDefault();
                alert('⚠️ La función "Publicar en GitHub" solo está disponible cuando abres el administrador desde tu PC con el servidor local en marcha (Abrir_Administrador.bat).');
            });
        } else {
            btnPublish.addEventListener('click', () => {
                if (!confirm('Esto subirá todos los cambios guardados a la web pública de GitHub. ¿Continuar?')) return;
                
                btnPublish.disabled = true;
                btnPublish.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';
                
                const publishUrl = window.location.protocol === 'file:'
                    ? 'http://localhost:3000/api/publish'
                    : `${window.location.origin}/api/publish`;
                
                fetch(publishUrl, { method: 'POST' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            showToast('✅ ¡Enviado a GitHub!');
                            alert('Los cambios se han enviado. GitHub tardará unos 2-3 minutos en actualizar la web pública. Por favor, espera un poco antes de refrescar la página pública.');
                        } else {
                            alert('Error al publicar: ' + data.message);
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        alert('Error conectando al servidor para publicar. Asegúrate de que el servidor local está en marcha.');
                    })
                    .finally(() => {
                        btnPublish.disabled = false;
                        btnPublish.innerHTML = '<i class="fab fa-github"></i> Publicar en GitHub';
                    });
            });
        }
    }

    // --- Unified Settings & UI Initializers ---
    if (typeof initSettingsEditors === 'function') initSettingsEditors();
    if (typeof setupDragAndDrop === 'function') setupDragAndDrop();
    
    // UI add buttons
    const btnAddMenu = document.getElementById('btn-add-menu');
    if (btnAddMenu) {
        btnAddMenu.addEventListener('click', () => {
            const currentRows = document.querySelectorAll('#menus-container .menu-row').length;
            if (typeof addMenuRow === 'function') addMenuRow(currentRows + 1, '', 'fa-folder', {}, '');
        });
    }
    const btnAddCritical = document.getElementById('btn-add-critical');
    if (btnAddCritical) {
        btnAddCritical.addEventListener('click', () => {
            if (typeof addAlertRow === 'function') addAlertRow(document.getElementById('alerts-critical-container'), '', 'Hoy', '');
        });
    }
    const btnAddAnnounce = document.getElementById('btn-add-announcement');
    if (btnAddAnnounce) {
        btnAddAnnounce.addEventListener('click', () => {
            if (typeof addAlertRow === 'function') addAlertRow(document.getElementById('alerts-announcements-container'), '', 'Hoy', '');
        });
    }
    const btnAddNews = document.getElementById('btn-add-news');
    if (btnAddNews) {
        btnAddNews.addEventListener('click', () => {
            if (typeof addNewsRow === 'function') addNewsRow(document.getElementById('featured-news-container'), '', '');
        });
    }
    const btnAddGraphic = document.getElementById('btn-add-graphic-line');
    if (btnAddGraphic) {
        btnAddGraphic.addEventListener('click', () => {
            if (typeof addGraphicLineRow === 'function') addGraphicLineRow(document.getElementById('graphic-lines-container'), '');
        });
    }
    
    // Save Menus Config
    const btnSaveMenus = document.getElementById('btn-save-menus');
    if (btnSaveMenus) {
        btnSaveMenus.addEventListener('click', () => {
            try {
                const { newNav, idMap } = collectMenus();

                // --- Safety check: warn if protocols would be renumbered ---
                if (Object.keys(idMap).length > 0) {
                    // Count affected protocols
                    const affectedProtocols = adminProtocols.filter(p => {
                        if (!p.section) return false;
                        const parts = p.section.split('.');
                        return idMap[p.section] || idMap[parts[0]];
                    });

                    const changesList = Object.entries(idMap)
                        .map(([old, nw]) => `Sección ${old} → ${nw}`)
                        .join('\n');

                    const confirmed = confirm(
                        `⚠️ ATENCIÓN: Este cambio de orden renumeraría ${affectedProtocols.length} protocolo(s).\n\n` +
                        `Cambios detectados:\n${changesList}\n\n` +
                        `❓ ¿Deseas aplicar la renumeración de protocolos?\n\n` +
                        `Pulsa ACEPTAR para renumerar. Pulsa CANCELAR para guardar solo los nombres/iconos/descripciones sin cambiar los números de sección.`
                    );

                    if (confirmed) {
                        syncProtocolsWithNewIds(idMap);
                    }
                }

                if (typeof navigation_config !== 'undefined') {
                    Object.keys(navigation_config).forEach(key => delete navigation_config[key]);
                    Object.assign(navigation_config, newNav);
                }
                saveToServer(adminProtocols, newNav, typeof home_config !== 'undefined' ? home_config : undefined);
                showToast('Configuración de menús guardada');
                populateCategories();
            } catch(e) {
                alert('Error al guardar menús: ' + e.message);
            }
        });
    }

    // Save Home Config
    const btnSaveInicio = document.getElementById('btn-save-inicio');
    if (btnSaveInicio) {
        btnSaveInicio.addEventListener('click', () => {
            try {
                const parsedHome = collectInicio();
                saveToServer(adminProtocols, typeof navigation_config !== 'undefined' ? navigation_config : undefined, parsedHome);
                showToast('Configuración de inicio guardada');
            } catch(e) {
                alert('Error al guardar inicio: ' + e.message);
            }
        });
    }

    // Icon Bank Listeners
    const btnCloseIconBank = document.getElementById('btn-close-icon-bank');
    if (btnCloseIconBank) {
        btnCloseIconBank.addEventListener('click', () => {
            document.getElementById('icon-bank-modal').style.display = 'none';
        });
    }

    const iconSearch = document.getElementById('icon-search');
    if (iconSearch) {
        iconSearch.addEventListener('input', (e) => {
            if (typeof renderIconBank === 'function') renderIconBank(e.target.value);
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
} else {
    initAdmin();
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    if (tabId === 'editor') {
        document.getElementById('tab-editor').classList.add('active');
    } else {
        const page = document.getElementById(`tab-${tabId}`);
        if (page) page.classList.add('active');
        
        const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        if (tabId === 'canales') {
            initCanalesTab();
        }
        
        if (tabId === 'comentarios') {
            if (IS_LOCAL_SERVER) {
                loadAdminComments();
            }
        }
    }
}

function renderAdminTable(data) {
    const tbody = document.getElementById('protocol-table-body');
    tbody.innerHTML = '';

    const safeData = Array.isArray(data) ? [...data] : [];

    if (safeData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron protocolos.</td></tr>';
        return;
    }

    // Sort dynamically based on state
    safeData.sort((a, b) => {
        let valA, valB;
        
        switch (currentSortColumn) {
            case 'id':
                // Section like "1.10" -> ID is "1", sub is "10"
                valA = parseInt((a.section || '0').split('.')[0]) || 0;
                valB = parseInt((b.section || '0').split('.')[0]) || 0;
                break;
            case 'section':
                valA = a.section || '';
                valB = b.section || '';
                break;
            case 'title':
                valA = a.title || '';
                valB = b.title || '';
                break;
            case 'date':
                valA = new Date(a.published || 0).getTime();
                valB = new Date(b.published || 0).getTime();
                break;
            case 'source':
                valA = a.source || 'Ambos';
                valB = b.source || 'Ambos';
                break;
            case 'category':
                const navC = typeof navigation_config !== 'undefined' ? navigation_config : {};
                const cIdA = (a.section || '0').split('.')[0];
                const cIdB = (b.section || '0').split('.')[0];
                valA = navC[cIdA] ? navC[cIdA].name : '';
                valB = navC[cIdB] ? navC[cIdB].name : '';
                break;
            default:
                valA = a.section || '';
                valB = b.section || '';
        }

        let comparison = 0;
        
        // Special natural string sort for section
        if (currentSortColumn === 'section') {
            const partsA = valA.split('.').map(n => parseInt(n) || 0);
            const partsB = valB.split('.').map(n => parseInt(n) || 0);
            for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
                const numA = partsA[i] || 0;
                const numB = partsB[i] || 0;
                if (numA !== numB) {
                    comparison = numA - numB;
                    break;
                }
            }
        } 
        // Number/Date compare
        else if (typeof valA === 'number' && typeof valB === 'number') {
            comparison = valA - valB;
        } 
        // String compare
        else {
            comparison = valA.toString().localeCompare(valB.toString());
        }

        // Apply direction
        return currentSortDirection === 'asc' ? comparison : -comparison;
    });

    // Update Header Icons
    document.querySelectorAll('.sort-header').forEach(th => {
        const icon = th.querySelector('i');
        if (th.getAttribute('data-sort') === currentSortColumn) {
            icon.className = currentSortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        } else {
            icon.className = 'fas fa-sort';
        }
    });

    safeData.forEach((p) => {
        // Find actual index in adminProtocols for editing/deleting since we sorted safeData
        const actualIndex = adminProtocols.indexOf(p);
        
        const tr = document.createElement('tr');
        
        const secVal = p.section || 'N/A';
        const dateVal = formatAdminDate(p.published);
        const sourceVal = p.source || 'Ambos';

        // Resolve category name from navigation_config
        const navConf = typeof navigation_config !== 'undefined' ? navigation_config : {};
        const catId = p.section ? String(p.section).split('.')[0] : null;
        const catName = catId && navConf[catId] ? navConf[catId].name : null;

        let statusIcon = '';
        if (p.status === 'Activo') statusIcon = '<span style="color: #28a745; margin-right: 5px;" title="Activo"><i class="fas fa-check-circle"></i></span>';
        else if (p.status === 'En redacción') statusIcon = '<span style="color: #fd7e14; margin-right: 5px;" title="En redacción"><i class="fas fa-edit"></i></span>';
        else if (p.status === 'En proceso') statusIcon = '<span style="color: #dc3545; margin-right: 5px;" title="En proceso"><i class="fas fa-spinner fa-spin"></i></span>';
        else if (p.title && p.title.includes('🟢')) statusIcon = '<span style="color: #28a745; margin-right: 5px;" title="Activo"><i class="fas fa-check-circle"></i></span>';

        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="section-number">${secVal}</span>
                    <strong style="font-size: 1rem; color: #333; display: flex; align-items: center;">${statusIcon} ${p.title || 'Sin Título'}</strong>
                </div>
            </td>
            <td>
                ${catName ? `
                    <span class="category-pill">
                        <i class="fas fa-folder-open" style="color: #0a6aa1; margin-right: 4px;"></i> ${catName}
                    </span>
                ` : '<span style="color:#ccc; font-size:0.8rem;">Sin categoría</span>'}
            </td>
            <td>
                <span class="hotel-badge">
                    <i class="fas fa-hotel" style="color: #0a6aa1; font-size: 0.8rem;"></i> ${sourceVal}
                </span>
            </td>
            <td style="color: #6c757d; font-size: 0.85rem; font-weight: 500;">${dateVal}</td>
            <td class="actions-cell">
                <button class="btn-icon" onclick="openEditor(${actualIndex})" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-delete" onclick="deleteProtocol(${actualIndex})" title="Eliminar"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

}

function populateCategories() {
    const select = document.getElementById('edit-category');
    select.innerHTML = '<option value="">Sin Sección</option>';
    
    let navConf = typeof navigation_config !== 'undefined' ? navigation_config : {};
    try {
        if (document.getElementById('edit-menus-json').value) {
            navConf = JSON.parse(document.getElementById('edit-menus-json').value);
        }
    } catch(e) {}
    
    if (navConf) {
        Object.entries(navConf).sort((a,b) => parseInt(a[0]) - parseInt(b[0])).forEach(([id, cat]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${id}. ${cat.name}`;
            select.appendChild(option);
        });
    }


}

function updateParentSections(selectedParent = '') {
    const categoryId = document.getElementById('edit-category').value;
    const parentSelect = document.getElementById('edit-parent-section');
    parentSelect.innerHTML = '<option value="">-- Es apartado principal --</option>';
    
    if (!categoryId) return;
    
    // Find all top-level protocols in this EXACT category (X.Y)
    const parents = adminProtocols.filter(p => {
        if (!p.section) return false;
        const parts = p.section.split('.');
        // Check if first segment matches EXACTLY and depth is 2 (X.Y)
        return parts.length === 2 && parts[0] === categoryId;
    });
    
    // Natural Sort
    parents.sort((a, b) => a.section.localeCompare(b.section, undefined, { numeric: true }));
    
    parents.forEach(p => {
        const option = document.createElement('option');
        option.value = p.section;
        const cleanTitle = p.title.replace(/\{.*?\}/, '').trim();
        option.textContent = `${p.section} ${cleanTitle}`;
        parentSelect.appendChild(option);
    });
    
    if (selectedParent) parentSelect.value = selectedParent;
}

function generateNextId(force = false) {
    const categoryId = document.getElementById('edit-category').value.trim();
    const parentSection = document.getElementById('edit-parent-section').value.trim();
    const sectionInput = document.getElementById('edit-section');
    
    if (!categoryId) {
        sectionInput.value = '';
        return;
    }
    
    // Only auto-generate if it's a NEW protocol OR if the field is empty OR if forced
    if (editingIndex !== -1 && sectionInput.value && !force) return;

    let highest = 0;

    if (parentSection) {
        // Creating a SUB-PROTOCOL (X.Y.Z)
        // Parent is X.Y
        const parentParts = parentSection.split('.');
        
        adminProtocols.forEach(p => {
            if (!p.section) return;
            const parts = p.section.split('.');
            // Match parent segments exactly (parts 0 and 1) and must be depth 3
            if (parts.length === 3 && parts[0] === parentParts[0] && parts[1] === parentParts[1]) {
                const num = parseInt(parts[2]);
                if (!isNaN(num) && num > highest) highest = num;
            }
        });
        sectionInput.value = `${parentSection}.${highest + 1}`;
    } else {
        // Creating a MAIN-PROTOCOL (X.Y)
        adminProtocols.forEach(p => {
            if (!p.section) return;
            const parts = p.section.split('.');
            // Match category segment exactly (part 0) and must be depth 2
            if (parts.length === 2 && parts[0] === categoryId) {
                const num = parseInt(parts[1]);
                if (!isNaN(num) && num > highest) highest = num;
            }
        });
        sectionInput.value = `${categoryId}.${highest + 1}`;
    }
}

function openEditor(index = -1) {
    editingIndex = index;
    const form = document.getElementById('protocol-form');
    const title = document.getElementById('editor-title');
    const btnDelete = document.getElementById('btn-delete-editor');
    const htmlEditor = document.getElementById('html-editor');
    const btnHtml = document.getElementById('btn-toggle-html');
    
    switchTab('editor');
    initQuill();
    populateCategories();

    if (index === -1) {
        // NEW PROTOCOL
        isHtmlMode = false;
        title.textContent = 'Nuevo Protocolo';
        if (btnDelete) btnDelete.style.display = 'none';
        form.reset();
        
        quill.root.innerHTML = '';
        htmlEditor.value = '';
        
        document.getElementById('edit-date').value = 'Automática';
        document.getElementById('edit-category').value = '';
        document.getElementById('edit-parent-section').value = '';
        document.getElementById('edit-section').value = '';
        updateParentSections();
        
        document.getElementById('edit-is-critical').checked = false;
        document.getElementById('edit-is-announcement').checked = false;
        
        // Ensure visual mode UI
        htmlEditor.style.display = 'none';
        document.querySelector('.ql-toolbar').style.display = 'block';
        document.getElementById('quill-editor').style.display = 'block';
        btnHtml.innerHTML = '<i class="fas fa-code"></i> Editar en HTML puro';
        btnHtml.classList.add('btn-secondary');
        btnHtml.classList.remove('btn-primary');
        
        // Final check to see if we can suggest an ID immediately if a category is selected
        generateNextId();
    } else {
        // EDIT EXISTING PROTOCOL
        title.textContent = 'Editar Protocolo';
        if (btnDelete) btnDelete.style.display = 'block';
        const p = adminProtocols[index];
        document.getElementById('edit-title').value = p.title || '';
        document.getElementById('edit-section').value = p.section || '';
        
        // Try to set category and parent from section
        if (p.section) {
            const parts = p.section.split('.');
            const catId = parts[0];
            document.getElementById('edit-category').value = catId;
            
            // If it's a sub-id (X.Y.Z), parent is X.Y
            if (parts.length > 2) {
                const parentId = `${parts[0]}.${parts[1]}`;
                updateParentSections(parentId);
            } else {
                updateParentSections('');
            }
        } else {
            document.getElementById('edit-category').value = '';
            updateParentSections('');
        }
        
        document.getElementById('edit-source').value = p.source || 'Ambos hoteles';
        document.getElementById('edit-status').value = p.status || '';
        document.getElementById('edit-date').value = 'Automática';

        // Check alerts
        let isCritical = false;
        let isAnnouncement = false;
        try {
            const hConf = JSON.parse(document.getElementById('edit-home-json').value || '{}');
            if (hConf.alerts && p.section) {
                if (hConf.alerts.critical_errors?.items) {
                    isCritical = hConf.alerts.critical_errors.items.some(i => i.id === p.section);
                }
                if (hConf.alerts.announcements?.items) {
                    isAnnouncement = hConf.alerts.announcements.items.some(i => i.id === p.section);
                }
            }
        } catch(e) {}
        document.getElementById('edit-is-critical').checked = isCritical;
        document.getElementById('edit-is-announcement').checked = isAnnouncement;
        
        // Preserve raw HTML to avoid stripping
        const rawContent = p.content || '';
        htmlEditor.value = rawContent;
        
        // Smart mode selection: if it contains complex HTML, default to HTML Mode
        const hasComplexHtml = rawContent.includes('class=') || rawContent.includes('style=') || rawContent.includes('<div') || rawContent.includes('<article');
        
        if (hasComplexHtml) {
            isHtmlMode = true;
            document.querySelector('.ql-toolbar').style.display = 'none';
            document.getElementById('quill-editor').style.display = 'none';
            htmlEditor.style.display = 'block';
            
            btnHtml.innerHTML = '<i class="fas fa-eye"></i> Editor Visual';
            btnHtml.classList.add('btn-primary');
            btnHtml.classList.remove('btn-secondary');
            
            // Only set innerHTML for quill secretly (might be discarded on switch), but do NOT dangerouslyPaste as it strips
            quill.root.innerHTML = rawContent;
            
        } else {
            isHtmlMode = false;
            htmlEditor.style.display = 'none';
            document.querySelector('.ql-toolbar').style.display = 'block';
            document.getElementById('quill-editor').style.display = 'block';
            
            btnHtml.innerHTML = '<i class="fas fa-code"></i> Editar en HTML puro';
            btnHtml.classList.add('btn-secondary');
            btnHtml.classList.remove('btn-primary');
            
            quill.clipboard.dangerouslyPasteHTML(rawContent);
        }
    }
    
    // Refresh attachments list if panel exists
    if (typeof refreshAttachmentsSummary === 'function') refreshAttachmentsSummary();
}

function initSettingsEditors() {
    const defaultNav = {
        '1': { name: 'Operativa Diaria', icon: 'fa-calendar-check' },
        '2': { name: 'Reservas y Tarifas', icon: 'fa-file-invoice-dollar' },
        '3': { name: 'Estancia, Caja y Salidas', icon: 'fa-walking' },
        '4': { name: 'Gestión de Grupos', icon: 'fa-users-cog' },
        '5': { name: 'Coordinación Interna', icon: 'fa-sync-alt' },
        '6': { name: 'Seguridad y Emergencias', icon: 'fa-shield-alt' },
        '7': { name: 'Sistemas y Plataformas', icon: 'fa-desktop' },
        '8': { name: 'Manuales Básicos', icon: 'fa-book' },
        '9': { name: 'Gestión de Personal', icon: 'fa-user-tie' },
        '10': { name: 'Spa y Piscina', icon: 'fa-swimming-pool' },
        '11': { name: 'Noticias', icon: 'fa-newspaper' },
        '12': { name: 'Restaurante', icon: 'fa-utensils' },
        '13': { name: 'Otros', icon: 'fa-plus' }
    };

    const defaultHome = {
        alerts: {
            critical_errors: {
                title: 'Errores Críticos',
                icon: '<i class="fas fa-exclamation-triangle"></i>',
                items: [
                   { title: 'Registro de No shows obligatorio', date: 'Hoy' }
                ]
            },
            announcements: {
                title: 'Avisos Importantes',
                icon: '<i class="fas fa-bullhorn"></i>',
                items: [
                   { title: 'Revisar cuadrante de turnos', date: 'Ayer' }
                ]
            }
        }
    };

    const currentNav = typeof navigation_config !== 'undefined' ? navigation_config : defaultNav;
    const currentHome = typeof home_config !== 'undefined' ? home_config : defaultHome;

    document.getElementById('edit-menus-json').value = JSON.stringify(currentNav, null, 2);
    document.getElementById('edit-home-json').value = JSON.stringify(currentHome, null, 2);

    renderMenuUI(currentNav);
    renderInicioUI(currentHome);
}

function renderMenuUI(navObj) {
    const container = document.getElementById('menus-container');
    container.innerHTML = '';
    
    // Convert currentNav to array to handle sort/indices
    const sortedEntries = Object.entries(navObj).sort((a,b) => parseInt(a[0]) - parseInt(b[0]));
    
    sortedEntries.forEach(([id, cat], index) => {
        addMenuRow(id, cat.name, cat.icon, cat.subsections || {}, cat.description || '');
    });
}

function updateMenuOrder() {
    const rows = document.querySelectorAll('#menus-container .menu-row');
    rows.forEach((row, index) => {
        const idInput = row.querySelector('.menu-id');
        const oldId = idInput?.value;
        const newId = (index + 1).toString();
        
        if (idInput) idInput.value = newId;
        
        // Update sub-ids if they changed
        if (oldId && oldId !== newId) {
            const subInputs = row.querySelectorAll('.sub-id');
            subInputs.forEach(subIn => {
                const subPart = subIn.value.split('.')[1] || '1';
                subIn.value = `${newId}.${subPart}`;
            });
        }
    });
}

function addMenuRow(id, name, icon, subsections = {}, description = '') {
    const container = document.getElementById('menus-container');
    const row = document.createElement('div');
    row.className = 'menu-row';
    row.draggable = true;
    row.style = 'display:flex; flex-direction:column; gap: 10px; background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 2px 8px rgba(0,0,0,0.05); cursor: grab; position: relative; margin-bottom: 15px;';
    
    row.innerHTML = `
        <div class="menu-row-main" style="display:grid; grid-template-columns: 30px 80px 1fr 200px 100px 40px; gap: 12px; align-items: end; width: 100%;">
            <div style="display: flex; align-items: center; justify-content: center; height: 38px; color: #ccc;">
                <i class="fas fa-grip-lines"></i>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 0.75rem; font-weight: 700; color: #666; text-transform:uppercase;">Sección</label>
                <input type="text" class="menu-id" value="${id}" data-original-id="${id}" readonly style="width:100%; padding:8px; border:1px solid #eee; border-radius:4px; background:#f9f9f9; text-align:center; font-weight:bold; cursor: default;">
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 0.75rem; font-weight: 700; color: #666; text-transform:uppercase;">Nombre de la Categoría</label>
                <input type="text" class="menu-name" value="${name}" placeholder="Ej: Operativa Diaria" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 0.75rem; font-weight: 700; color: #666; text-transform:uppercase;">Icono</label>
                <div style="display:flex; gap:8px; align-items:center;">
                    <span class="icon-preview-box" style="width: 38px; height: 38px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; font-size: 1.1rem; color: #0a6aa1;">${icon.startsWith('fa-') ? `<i class="fas ${icon}"></i>` : icon}</span>
                    <input type="text" class="menu-icon" value="${icon}" style="flex:1; width:0; padding:8px; border:1px solid #ccc; border-radius:4px;" oninput="this.previousElementSibling.innerHTML = this.value.startsWith('fa-') ? '<i class=\\'fas ' + this.value + '\\'></i>' : this.value">
                    <button type="button" class="btn-icon-picker" style="background:#f0f4f7; color:#0a6aa1; border:1px solid #0a6aa1; border-radius:4px; height:38px; width:38px; cursor:pointer; flex-shrink: 0;" onclick="openIconBank(this.previousElementSibling)" title="Buscar Icono"><i class="fas fa-icons"></i></button>
                </div>
            </div>
            <div style="display: flex; align-items: flex-end;">
                <button type="button" class="btn-delete-row" style="background:#fff2f2; color:#e74c3c; border:1px solid #ffcfca; border-radius:4px; height:38px; width:38px; cursor:pointer;" onclick="if(confirm('¿Eliminar toda la categoría y sus subsecciones?')) { this.closest('.menu-row').remove(); updateMenuOrder(); }" title="Eliminar Sección"><i class="fas fa-trash"></i></button>
            </div>
        </div>

        <div style="margin-left: 42px; margin-top: 6px;">
            <label style="font-size: 0.75rem; font-weight: 700; color: #888; text-transform:uppercase; margin-bottom: 5px; display: block;"><i class="fas fa-align-left" style="margin-right:4px;"></i>Descripción (Guía Operativa)</label>
            <textarea class="menu-description" rows="2" placeholder="Texto descriptivo que aparece bajo el título de la sección en la Guía Operativa..." style="width:100%; padding:8px 10px; border:1px solid #ccc; border-radius:6px; font-size:0.88rem; resize:vertical; font-family:inherit; color:#444;">${description}</textarea>
        </div>
        
        <div style="display: flex; gap: 20px; margin-left: 42px; margin-top: 10px;">
            <div style="flex: 1;">
                <label style="font-size: 0.75rem; font-weight: 700; color: #888; text-transform:uppercase; margin-bottom: 5px; display: block;">Subsecciones Internas (Protocolos)</label>
                <div class="subsections-container" style="border-left: 2px dashed #eee; padding-left: 15px; display: flex; flex-direction: column; gap: 8px;">
                    <!-- Subrows go here -->
                </div>
                <button type="button" class="btn-add-sub" style="background:none; border:none; color:var(--accent); cursor:pointer; font-size:0.8rem; margin-top:8px; display:flex; align-items:center; gap:5px;"><i class="fas fa-plus-circle"></i> Añadir Subsección Interna</button>
            </div>
            <div style="flex: 1;">
                <label style="font-size: 0.75rem; font-weight: 700; color: #888; text-transform:uppercase; margin-bottom: 5px; display: block;">Enlaces Externos (URLs)</label>
                <div class="links-container" style="border-left: 2px dashed #eee; padding-left: 15px; display: flex; flex-direction: column; gap: 8px;">
                    <!-- Link rows go here -->
                </div>
                <button type="button" class="btn-add-external" style="background:none; border:none; color:#27ae60; cursor:pointer; font-size:0.8rem; margin-top:8px; display:flex; align-items:center; gap:5px;"><i class="fas fa-external-link-alt"></i> Añadir Enlace Externo</button>
            </div>
        </div>
    `;

    const subContainer = row.querySelector('.subsections-container');
    const linksContainer = row.querySelector('.links-container');
    const btnAddSub = row.querySelector('.btn-add-sub');
    const btnAddExternal = row.querySelector('.btn-add-external');

    // Render existing subsections
    Object.entries(subsections).sort((a,b) => {
        const pA = parseInt(a[0].split('.')[1] || '0');
        const pB = parseInt(b[0].split('.')[1] || '0');
        return pA - pB;
    }).forEach(([subId, subName]) => {
        addSubRow(subContainer, subId, subName);
    });

    // Render existing external links if any
    const existingLinks = (typeof navigation_config !== 'undefined' && navigation_config[id]) ? navigation_config[id].links : [];
    if (existingLinks && Array.isArray(existingLinks)) {
        existingLinks.forEach(link => {
            addExternalLinkRow(linksContainer, link.icon, link.text, link.url);
        });
    }

    if (btnAddSub) {
        btnAddSub.onclick = (e) => {
            e.preventDefault();
            const parentId = row.querySelector('.menu-id').value;
            const count = subContainer.querySelectorAll('.sub-row').length + 1;
            addSubRow(subContainer, `${parentId}.${count}`, '');
        };
    }

    if (btnAddExternal) {
        btnAddExternal.onclick = (e) => {
            e.preventDefault();
            addExternalLinkRow(linksContainer, 'fa-link', '', '');
        };
    }


    // Drag and Drop Events
    row.addEventListener('dragstart', () => {
        row.style.opacity = '0.5';
        row.classList.add('dragging');
    });

    row.addEventListener('dragend', () => {
        row.style.opacity = '1';
        row.classList.remove('dragging');
        updateMenuOrder();
    });

    container.appendChild(row);
}

function addSubRow(container, id, name) {
    const row = document.createElement('div');
    row.className = 'sub-row';
    row.style = 'display: grid; grid-template-columns: 80px 1fr 40px; gap: 10px; align-items: center; background: #fdfdfd; padding: 5px 10px; border: 1px solid #f0f0f0; border-radius: 4px;';
    
    row.innerHTML = `
        <input type="text" class="sub-id" value="${id}" data-original-id="${id}" readonly style="width:100%; padding:5px; border:1px solid #eee; border-radius:4px; background:#f9f9f9; text-align:center; font-size:0.85rem; font-weight:bold; color:#888;">
        <input type="text" class="sub-name" value="${name}" placeholder="Nombre de la subsección (ej: Registro, Check-out...)" style="width:100%; padding:6px 10px; border:1px solid #ddd; border-radius:4px; font-size: 0.9rem;">
        <button type="button" style="background:none; border:none; color:#bbb; cursor:pointer; font-size:1rem;" onclick="this.parentElement.remove()" onmouseover="this.style.color='#e74c3c'" onmouseout="this.style.color='#bbb'"><i class="fas fa-times-circle"></i></button>
    `;
    container.appendChild(row);
}

function addExternalLinkRow(container, icon, text, url) {
    const row = document.createElement('div');
    row.className = 'external-link-row';
    row.style = 'display: grid; grid-template-columns: 80px 1fr 1fr 30px; gap: 5px; align-items: center; background: #fff; padding: 5px; border: 1px solid #eef2f5; border-radius: 4px; margin-bottom: 5px;';
    
    row.innerHTML = `
        <div style="display:flex; gap:3px;">
            <span class="icon-preview-box" style="width: 28px; height: 28px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; color: #27ae60;">${icon.startsWith('fa-') ? `<i class="fas ${icon}"></i>` : icon}</span>
            <input type="text" class="link-icon" value="${icon}" title="Icono FontAwesome" style="width:0; flex:1; padding:3px; border:1px solid #ccc; border-radius:4px; font-size: 0.75rem;" oninput="this.previousElementSibling.innerHTML = this.value.startsWith('fa-') ? '<i class=\\'fas ' + this.value + '\\'></i>' : this.value">
        </div>
        <input type="text" class="link-text" value="${text}" placeholder="Texto del enlace" style="width:100%; padding:5px 8px; border:1px solid #ddd; border-radius:4px; font-size: 0.85rem;">
        <input type="text" class="link-url" value="${url}" placeholder="URL (http...)" style="width:100%; padding:5px 8px; border:1px solid #ddd; border-radius:4px; font-size: 0.85rem;">
        <button type="button" style="background:none; border:none; color:#bbb; cursor:pointer;" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(row);
}


// Add global dragover listener to container
// Add global dragover listener to container
function setupDragAndDrop() {
    const container = document.getElementById('menus-container');
    if (container) {
        container.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(container, e.clientY);
            const dragging = document.querySelector('.dragging');
            if (dragging) {
                if (afterElement == null) {
                    container.appendChild(dragging);
                } else {
                    container.insertBefore(dragging, afterElement);
                }
            }
        });
    }
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.menu-row:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function renderInicioUI(homeObj) {
    // 1. Panel de Bienvenida
    if (homeObj?.welcome) {
        document.getElementById('home-welcome-title').value = homeObj.welcome.title || '';
        document.getElementById('home-welcome-text').value = homeObj.welcome.text || '';
    }

    // 2. Errores y Avisos
    const criticalContainer = document.getElementById('alerts-critical-container');
    const announcementsContainer = document.getElementById('alerts-announcements-container');
    
    if (criticalContainer) criticalContainer.innerHTML = '';
    if (announcementsContainer) announcementsContainer.innerHTML = '';
    
    if (criticalContainer && homeObj?.alerts?.critical_errors?.items) {
        homeObj.alerts.critical_errors.items.forEach(item => {
            addAlertRow(criticalContainer, item.title, item.date, item.id || '');
        });
    }
    
    if (announcementsContainer && homeObj?.alerts?.announcements?.items) {
        homeObj.alerts.announcements.items.forEach(item => {
            addAlertRow(announcementsContainer, item.title, item.date, item.id || '');
        });
    }

    // 3. Noticias Destacadas
    const newsContainer = document.getElementById('featured-news-container');
    if (newsContainer) {
        newsContainer.innerHTML = '';
        if (homeObj?.featured_news) {
            homeObj.featured_news.forEach(item => {
                addNewsRow(newsContainer, item.text, item.link || '');
            });
        }
    }

    // 4. Caja Gráfica
    if (homeObj?.graphic_box) {
        const homeGraphicTitle = document.getElementById('home-graphic-title');
        if (homeGraphicTitle) homeGraphicTitle.value = homeObj.graphic_box.title || '';
        
        const homeGraphicCustomHtml = document.getElementById('home-graphic-custom-html');
        if (homeGraphicCustomHtml) homeGraphicCustomHtml.value = homeObj.graphic_box.custom_html || '';
    }
    const graphicLinesContainer = document.getElementById('graphic-lines-container');
    if (graphicLinesContainer) {
        graphicLinesContainer.innerHTML = '';
        if (homeObj?.graphic_box?.lines) {
            homeObj.graphic_box.lines.forEach(line => {
                if (typeof line === 'string') {
                    addGraphicLineRow(graphicLinesContainer, line);
                } else {
                    addGraphicLineRow(graphicLinesContainer, line.text || '', line.highlight || false);
                }
            });
        }
    }
}

function addAlertRow(container, title, date, id = '') {
    const row = document.createElement('div');
    row.className = 'alert-row';
    row.style = 'display:flex; gap:10px; align-items:center; background:#fff; padding:10px; border-radius:4px; border:1px solid #ddd; margin-bottom: 5px;';
    row.innerHTML = `
        <input type="text" class="alert-title" value="${title}" placeholder="Mensaje de alerta" style="flex:1; padding:5px; border:1px solid #ccc; border-radius:4px;">
        <input type="text" class="alert-date" value="${date}" placeholder="Fecha/Dato" style="width:100px; padding:5px; border:1px solid #ccc; border-radius:4px;">
        <input type="text" class="alert-link-id" value="${id}" placeholder="ID Protocolo (opcional)" style="width:80px; padding:5px; border:1px solid #ccc; border-radius:4px;">
        <button type="button" class="btn-delete-row" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding:5px 10px; cursor:pointer;" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(row);
}

function addNewsRow(container, text, link) {
    const row = document.createElement('div');
    row.className = 'news-row';
    row.style = 'display:flex; gap:10px; align-items:center; background:#fff; padding:10px; border-radius:4px; border:1px solid #ddd;';
    row.innerHTML = `
        <input type="text" class="news-text" value="${text}" placeholder="Texto de la noticia" style="flex:1; padding:5px; border:1px solid #ccc; border-radius:4px;">
        <input type="text" class="news-link" value="${link}" placeholder="Enlace URL (Opcional)" style="flex:1; padding:5px; border:1px solid #ccc; border-radius:4px;">
        <button type="button" class="btn-delete-row" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding:5px 10px; cursor:pointer;" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(row);
}

function addGraphicLineRow(container, text, highlight = false) {
    const row = document.createElement('div');
    row.className = 'graphic-line-row';
    row.style = 'display:flex; gap:10px; align-items:center; background:#fff; padding:10px; border-radius:4px; border:1px solid #ddd; margin-bottom:5px;';
    row.innerHTML = `
        <input type="text" class="graphic-line-text" value="${text}" placeholder="Línea de texto para la caja gráfica" style="flex:1; padding:5px; border:1px solid #ccc; border-radius:4px;">
        <label style="font-size: 0.8rem; display:flex; align-items:center; gap:5px; white-space:nowrap;">
            <input type="checkbox" class="graphic-line-highlight" ${highlight ? 'checked' : ''}> Resaltar
        </label>
        <button type="button" class="btn-delete-row" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding:5px 10px; cursor:pointer;" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(row);
}

function collectMenus() {
    const rows = document.querySelectorAll('#menus-container .menu-row');
    const newNav = {};
    const idMap = {}; // Tracks Old ID -> New ID

    rows.forEach(row => {
        const idInput = row.querySelector('.menu-id');
        const id = idInput.value.trim();
        const originalId = idInput.getAttribute('data-original-id');
        const name = row.querySelector('.menu-name').value.trim();
        const icon = row.querySelector('.menu-icon').value.trim();
        
        if (originalId && id !== originalId) {
            idMap[originalId] = id;
        }

        if (id && name) {
            const subsectionsObj = {};
            const subRows = row.querySelectorAll('.sub-row');
            subRows.forEach(sub => {
                const subIdInput = sub.querySelector('.sub-id');
                const sId = subIdInput.value.trim();
                const sOriginalId = subIdInput.getAttribute('data-original-id');
                const sName = sub.querySelector('.sub-name').value.trim();
                
                if (sOriginalId && sId !== sOriginalId) {
                    idMap[sOriginalId] = sId;
                }

                if (sId && sName) {
                    subsectionsObj[sId] = sName;
                }
            });

            const linksArr = [];
            const linkRows = row.querySelectorAll('.external-link-row');
            linkRows.forEach(lrow => {
                const lIcon = lrow.querySelector('.link-icon').value.trim();
                const lText = lrow.querySelector('.link-text').value.trim();
                const lUrl = lrow.querySelector('.link-url').value.trim();
                if (lText && lUrl) {
                    linksArr.push({ icon: lIcon, text: lText, url: lUrl });
                }
            });
            
            const descInput = row.querySelector('.menu-description');
            const description = descInput ? descInput.value.trim() : '';

            newNav[id] = { 
                name, 
                icon,
                description: description || undefined,
                subsections: subsectionsObj,
                links: linksArr
            };
        }
    });

    document.getElementById('edit-menus-json').value = JSON.stringify(newNav, null, 2);
    // Update global config if present
    if (typeof navigation_config !== 'undefined') {
        Object.keys(navigation_config).forEach(k => delete navigation_config[k]);
        Object.assign(navigation_config, newNav);
    }
    return { newNav, idMap };
}

/**
 * Recalcula las secciones de los protocolos basándose en un mapa de traducción
 */
function syncProtocolsWithNewIds(idMap) {
    console.log("Sincronizando protocolos. Mapa de cambios:", idMap);
    let changesMade = 0;

    adminProtocols.forEach(p => {
        const oldSection = p.section;
        if (!oldSection) return;

        // 1. Verificar si la sección exacta ha cambiado (ej: 5.3 -> 4.3)
        if (idMap[oldSection]) {
            p.section = idMap[oldSection];
            changesMade++;
        } 
        // 2. Verificar si el prefijo ha cambiado (ej: categoría 5 -> categoría 4)
        // Esto cubre casos donde el sub-id no cambió explícitamente pero el padre sí
        else {
            const parts = oldSection.split('.');
            const parentId = parts[0];
            if (idMap[parentId]) {
                const newParentId = idMap[parentId];
                const rest = parts.slice(1).join('.');
                p.section = `${newParentId}${rest ? '.' + rest : ''}`;
                changesMade++;
            }
        }

        // 3. Actualizar etiquetas de categorías ("1ª Sección" -> "2ª Sección")
        if (p.section && p.categories) {
            const mainSectionNum = p.section.split('.')[0];
            const newCategoryLabel = `${mainSectionNum}ª Sección`;
            
            // Reemplazar etiqueta de sección antigua por la nueva
            p.categories = p.categories.map(cat => {
                if (cat.includes('ª Sección')) return newCategoryLabel;
                return cat;
            });
        }
        
        // 4. Actualizar enlaces internos en el contenido
        // Formato: #section/X.Y
        if (p.content && Object.keys(idMap).length > 0) {
            Object.entries(idMap).forEach(([oldId, newId]) => {
                const escapedOldId = oldId.replace(/\./g, '\\.');
                const regex = new RegExp(`#section/${escapedOldId}(?=["'\\s]|$)`, 'g');
                if (p.content.includes(`#section/${oldId}`)) {
                    p.content = p.content.replace(regex, `#section/${newId}`);
                }
            });
        }
    });

    if (changesMade > 0) {
        console.log(`Se han actualizado ${changesMade} protocolos por reordenación.`);
        renderAdminTable(adminProtocols);
        updateCounters();
    }
}


function collectInicio() {
    const currHome = JSON.parse(document.getElementById('edit-home-json').value || '{}');

    // 1. Bienvenida
    currHome.welcome = {
        title: document.getElementById('home-welcome-title').value.trim(),
        text: document.getElementById('home-welcome-text').value.trim()
    };

    // 2. Errores y Avisos
    if (!currHome.alerts) currHome.alerts = { critical_errors: { title: 'Errores Críticos', icon: '<i class="fas fa-exclamation-triangle"></i>', items: [] }, announcements: { title: 'Avisos Importantes', icon: '<i class="fas fa-bullhorn"></i>', items: [] } };
    
    const criticalRows = document.querySelectorAll('#alerts-critical-container .alert-row');
    const criticalItems = [];
    criticalRows.forEach(row => {
        const title = row.querySelector('.alert-title').value.trim();
        const date = row.querySelector('.alert-date').value.trim();
        const id = row.querySelector('.alert-link-id').value.trim();
        if (title) criticalItems.push({ title, date, id });
    });
    currHome.alerts.critical_errors.items = criticalItems;
    
    const annRows = document.querySelectorAll('#alerts-announcements-container .alert-row');
    const annItems = [];
    annRows.forEach(row => {
        const title = row.querySelector('.alert-title').value.trim();
        const date = row.querySelector('.alert-date').value.trim();
        const id = row.querySelector('.alert-link-id').value.trim();
        if (title) annItems.push({ title, date, id });
    });
    currHome.alerts.announcements.items = annItems;
    
    // 3. Noticias Destacadas
    const newsRows = document.querySelectorAll('#featured-news-container .news-row');
    const newsItems = [];
    newsRows.forEach(row => {
        const text = row.querySelector('.news-text').value.trim();
        const link = row.querySelector('.news-link').value.trim();
        if (text) newsItems.push({ text, link });
    });
    currHome.featured_news = newsItems;

    // 4. Caja Gráfica
    currHome.graphic_box = {
        title: document.getElementById('home-graphic-title').value.trim(),
        custom_html: document.getElementById('home-graphic-custom-html').value.trim(),
        lines: []
    };
    const graphicRows = document.querySelectorAll('#graphic-lines-container .graphic-line-row');
    graphicRows.forEach(row => {
        const text = row.querySelector('.graphic-line-text').value.trim();
        const highlight = row.querySelector('.graphic-line-highlight').checked;
        if (text) currHome.graphic_box.lines.push({ text, highlight });
    });

    document.getElementById('edit-home-json').value = JSON.stringify(currHome, null, 2);
    return currHome;
}



function deleteProtocol(index) {
    if (confirm('¿Estás seguro de que deseas eliminar este protocolo?')) {
        adminProtocols.splice(index, 1);
        renderAdminTable(adminProtocols);
        updateCounters();
        showToast('Protocolo eliminado permanentemente.');
        // Save deletion to server
        saveToServer(adminProtocols);
    }
}

function saveProtocol() {
    const title = document.getElementById('edit-title').value;
    const section = document.getElementById('edit-section').value;
    const source = document.getElementById('edit-source').value;
    const status = document.getElementById('edit-status').value;
    
    let content = '';
    let hasContent = false;
    
    if (isHtmlMode) {
        content = document.getElementById('html-editor').value;
        hasContent = content.trim().length > 0;
    } else {
        content = quill.root.innerHTML;
        // Check if there is actual content (text, image, or anything other than empty paragraphs)
        const plainText = quill.getText().trim();
        hasContent = plainText.length > 0 || content.includes('<img') || content.includes('<iframe') || content.includes('<video');
    }

    if (!title || !hasContent) {
        alert('El título y el contenido son obligatorios.');
        return;
    }

    const now = new Date().toISOString();
    let publishedDate = now;
    let updatedDate = now;

    if (editingIndex !== -1) {
        // preserve original published date, overwrite only updated
        publishedDate = adminProtocols[editingIndex].published || now;
    }

    const p = {
        title: title,
        section: section,
        source: source,
        status: status || undefined,
        published: publishedDate,
        updated: updatedDate,
        content: content,
        categories: [section ? `${section.split('.')[0]}ª Sección` : 'General']
    };

    if (editingIndex === -1) {
        adminProtocols.unshift(p);
    } else {
        adminProtocols[editingIndex] = p;
    }

    // Process alerts sync to home_config
    const isCritical = document.getElementById('edit-is-critical').checked;
    const isAnnouncement = document.getElementById('edit-is-announcement').checked;

    if (typeof home_config !== 'undefined') {
        const protocolId = section || ('new-' + Date.now()); 
        
        if (!home_config.alerts) home_config.alerts = {};
        if (!home_config.alerts.critical_errors) home_config.alerts.critical_errors = { title: 'Errores Críticos', icon: '<i class="fas fa-exclamation-triangle"></i>', items: [] };
        if (!home_config.alerts.critical_errors.items) home_config.alerts.critical_errors.items = [];
        if (!home_config.alerts.announcements) home_config.alerts.announcements = { title: 'Avisos Importantes', icon: '<i class="fas fa-bullhorn"></i>', items: [] };
        if (!home_config.alerts.announcements.items) home_config.alerts.announcements.items = [];
        
        // Remove existing references
        home_config.alerts.critical_errors.items = home_config.alerts.critical_errors.items.filter(i => i.id !== protocolId);
        home_config.alerts.announcements.items = home_config.alerts.announcements.items.filter(i => i.id !== protocolId);
        
        const friendlyDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).replace('.', '');
        
        if (isCritical) {
            home_config.alerts.critical_errors.items.unshift({ title: title, date: friendlyDate, id: protocolId });
        }
        if (isAnnouncement) {
            home_config.alerts.announcements.items.unshift({ title: title, date: friendlyDate, id: protocolId });
        }
        
        // Update DOM visual editors for UI consistency
        document.getElementById('edit-home-json').value = JSON.stringify(home_config, null, 2);
        renderInicioUI(home_config);
    }

    renderAdminTable(adminProtocols);
    updateCounters();
    switchTab('listado');
    // Ensure all configs are passed so we don't accidentally lose menus if we don't have them yet 
    saveToServer(adminProtocols, undefined, typeof home_config !== 'undefined' ? home_config : undefined);
}

function saveToServer(protocolsData, navData, homeData) {
    // Collect all configs, falling back to editor values if not previously saved globally
    let finalNav = navData || (typeof navigation_config !== 'undefined' ? navigation_config : undefined);
    if (!finalNav) {
        try { finalNav = JSON.parse(document.getElementById('edit-menus-json').value); } catch(e) {}
    }

    let finalHome = homeData || (typeof home_config !== 'undefined' ? home_config : undefined);
    if (!finalHome) {
        try { finalHome = JSON.parse(document.getElementById('edit-home-json').value); } catch(e) {}
    }

    const payload = {
        protocols: protocolsData || (typeof protocols_data !== 'undefined' ? protocols_data : []),
        navConfig: finalNav,
        homeConfig: finalHome,
        channelsConfig: (typeof window.channels_config !== 'undefined') ? window.channels_config : undefined
    };

    // On GitHub Pages there is no server: offer direct download instead
    if (!IS_LOCAL_SERVER) {
        const proceed = confirm('⚠️ Estás en la versión pública (GitHub Pages). Los cambios no se pueden guardar aquí.\n\n¿Deseas descargar el archivo "data.js" actualizado para guardarlo manualmente en tu PC?');
        if (proceed) showDownloadPrompt(payload);
        return;
    }

    const saveUrl = window.location.protocol === 'file:' 
        ? 'http://localhost:3000/api/save'
        : `${window.location.origin}/api/save`;

    fetch(saveUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Guardado correctamente en data.js');
        } else {
            alert('Error guardando en el servidor: ' + data.message);
        }
    })
    .catch(err => {
        console.error(err);
        const proceed = confirm('Error conectando al servidor. ¿Deseas descargar el archivo "data.js" manualmente para guardar los cambios?');
        if (proceed) {
            showDownloadPrompt(payload);
        }
    });
}

function showDownloadPrompt(payload) {
    let newContent = '';
    if (payload.protocols) newContent += "const protocols_data = " + JSON.stringify(payload.protocols, null, 2) + ";\n\n";
    if (payload.navConfig) newContent += "const navigation_config = " + JSON.stringify(payload.navConfig, null, 2) + ";\n\n";
    if (payload.homeConfig) newContent += "const home_config = " + JSON.stringify(payload.homeConfig, null, 2) + ";\n\n";
    const blob = new Blob([newContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showToast('Archivo data.js generado. Reemplázalo en tu carpeta para guardar los cambios.');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

function updateCounters() {
    document.getElementById('protocol-count').textContent = adminProtocols.length;
}

function formatAdminDate(dateStr) {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

window.openEditor = openEditor;
window.deleteProtocol = deleteProtocol;

// Icon Bank Functions
function openIconBank(inputElement) {
    currentIconInput = inputElement;
    document.getElementById('icon-bank-modal').style.display = 'flex';
    renderIconBank('');
    document.getElementById('icon-search').value = '';
    document.getElementById('icon-search').focus();
}

function renderIconBank(filterText) {
    const grid = document.getElementById('icon-grid');
    grid.innerHTML = '';
    const filteredIcons = iconBank.filter(icon => icon.toLowerCase().includes(filterText.toLowerCase()));
    
    filteredIcons.forEach(icon => {
        const div = document.createElement('div');
        div.style = 'display:flex; flex-direction:column; align-items:center; justify-content:center; padding:10px; border:1px solid #eee; border-radius:6px; cursor:pointer; transition:all 0.2s;';
        div.onmouseover = () => div.style.backgroundColor = '#f0f8ff';
        div.onmouseout = () => div.style.backgroundColor = 'transparent';
        div.innerHTML = `<i class="fas ${icon}" style="font-size:1.5rem; color:#0a6aa1; margin-bottom:5px;"></i><span style="font-size:0.7rem; color:#666; text-align:center; word-break:break-all;">${icon.replace('fa-', '')}</span>`;
        div.onclick = () => {
            if (currentIconInput) {
                currentIconInput.value = icon;
                if (currentIconInput.previousElementSibling && currentIconInput.previousElementSibling.classList.contains('icon-preview-box')) {
                    currentIconInput.previousElementSibling.firstElementChild.className = 'fas ' + icon;
                }
                // fire an input/change event just in case
                currentIconInput.dispatchEvent(new Event('input', { bubbles: true }));
                currentIconInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
            document.getElementById('icon-bank-modal').style.display = 'none';
        };
        grid.appendChild(div);
    });
}


// --- COMMENT MODERATION LOGIC ---

// Comment Moderation logic moved or already integrated

async function updatePendingBadge() {
    try {
        const response = await fetch('/api/comments/all');
        if (!response.ok) return;
        const text = await response.text();
        if (!text.trim().startsWith('[') && !text.trim().startsWith('{')) return;
        
        const comments = JSON.parse(text);
        const pendingCount = comments.filter(c => c.status === 'pending').length;
        
        const badge = document.getElementById('pending-comments-badge');
        const tabBtn = document.querySelector('.tab-btn[data-tab="comentarios"]');
        
        if (badge) {
            if (pendingCount > 0) {
                badge.textContent = pendingCount;
                badge.style.display = 'inline-block';
                badge.classList.add('badge-ping');
                if (tabBtn) tabBtn.classList.add('pending-alert');
            } else {
                badge.textContent = '0';
                badge.style.display = 'none';
                badge.classList.remove('badge-ping');
                if (tabBtn) tabBtn.classList.remove('pending-alert');
            }
        }
    } catch (e) {
        console.error('Error updating badge:', e);
    }
}

async function loadAdminComments() {
    const tbody = document.getElementById('comments-table-body');
    if (!tbody) return;
    
    // On GitHub Pages: no server available
    if (!IS_LOCAL_SERVER) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:40px; color:#999;"><i class="fas fa-server" style="font-size:2rem; display:block; margin-bottom:10px;"></i>Los comentarios solo se gestionan desde el <strong>administrador local</strong> (Abrir_Administrador.bat).</td></tr>';
        return;
    }
    
    tbody.innerHTML = '<tr><td colspan="6" class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando comentarios...</td></tr>';
    
    try {
        const response = await fetch('/api/comments/all');
        if (!response.ok) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:red;">Error de servidor. Prueba a reiniciar el servidor y recargar.</td></tr>`;
            return;
        }
        const text = await response.text();
        if (!text.trim().startsWith('[') && !text.trim().startsWith('{')) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:red;">Respuesta no válida del servidor.</td></tr>`;
            return;
        }
        _allComments = JSON.parse(text);
        _allComments.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Populate datalist for manual comment modal
        const datalist = document.getElementById('protocol-sections-list');
        if (datalist && adminProtocols.length > 0) {
            datalist.innerHTML = adminProtocols.map(p => `<option value="${p.section}">${p.section} - ${(p.title || '').replace(/\{.*?\}/, '').trim()}</option>`).join('');
        }
        
        renderCommentStats(_allComments);
        renderCommentFilter();
    } catch (e) {
        const tbody2 = document.getElementById('comments-table-body');
        if (tbody2) tbody2.innerHTML = `<tr><td colspan="6" class="text-center" style="color:red;">Error cargando comentarios: ${e.message}</td></tr>`;
    }
}

function renderCommentStats(comments) {
    const statsRow = document.getElementById('comments-stats-row');
    if (!statsRow) return;
    
    const total = comments.length;
    const pending = comments.filter(c => c.status === 'pending').length;
    const approved = comments.filter(c => c.status === 'approved').length;
    const replied = comments.filter(c => c.reply && c.reply.trim()).length;
    
    const stat = (icon, label, value, color) => `
        <div style="display:flex; align-items:center; gap:10px; background:white; border-radius:10px; padding:10px 18px; box-shadow:0 2px 8px rgba(0,0,0,0.07); border-left:4px solid ${color};">
            <i class="fas ${icon}" style="color:${color}; font-size:1.2rem;"></i>
            <div>
                <div style="font-size:1.4rem; font-weight:800; color:#333; line-height:1;">${value}</div>
                <div style="font-size:0.72rem; color:#999; font-weight:600; text-transform:uppercase; letter-spacing:0.04em;">${label}</div>
            </div>
        </div>`;
    
    statsRow.innerHTML = 
        stat('fa-comments', 'Total', total, '#607d8b') +
        stat('fa-clock', 'Pendientes', pending, '#ffc107') +
        stat('fa-check-circle', 'Autorizados', approved, '#28a745') +
        stat('fa-reply', 'Respondidos', replied, '#6c5ce7');
}

function setCommentFilter(filter, btn) {
    _commentFilter = filter;
    _commentPage = 1;
    
    // Update button styles
    document.querySelectorAll('.comment-filter-btn').forEach(b => {
        const f = b.getAttribute('data-filter');
        const colors = { all: '#0a6aa1', pending: '#ffc107', approved: '#28a745', replied: '#6c5ce7' };
        const textColors = { all: 'white', pending: '#856404', approved: '#155724', replied: '#6c5ce7' };
        const col = colors[f] || '#0a6aa1';
        if (b === btn) {
            b.style.background = col;
            b.style.color = 'white';
            b.style.borderColor = col;
        } else {
            b.style.background = 'white';
            b.style.color = textColors[f] || '#333';
            b.style.borderColor = col;
        }
    });
    
    renderCommentFilter();
}

function renderCommentFilter() {
    let filtered = _allComments;
    if (_commentFilter === 'pending') filtered = _allComments.filter(c => c.status === 'pending');
    else if (_commentFilter === 'approved') filtered = _allComments.filter(c => c.status === 'approved');
    else if (_commentFilter === 'replied') filtered = _allComments.filter(c => c.reply && c.reply.trim());
    
    renderCommentPage(filtered);
    renderCommentPagination(filtered);
}

function renderCommentPage(filtered) {
    const tbody = document.getElementById('comments-table-body');
    if (!tbody) return;
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="color:#999; padding:30px;"><i class="fas fa-comment-slash" style="font-size:2rem; margin-bottom:10px; display:block;"></i>No hay comentarios en esta categoría.</td></tr>';
        return;
    }
    
    const start = (_commentPage - 1) * _commentsPerPage;
    const pageItems = filtered.slice(start, start + _commentsPerPage);
    
    tbody.innerHTML = '';
    pageItems.forEach(c => {
        const tr = document.createElement('tr');
        const isPending = c.status === 'pending';
        const statusClass = isPending ? 'badge-warning' : 'badge-success';
        const statusText = isPending ? '⏳ Pendiente' : '✅ Autorizado';
        
        tr.innerHTML = `
            <td style="font-size: 0.8rem; color: #666; white-space:nowrap;">${new Date(c.date).toLocaleDateString('es-ES', {day:'2-digit',month:'short',year:'numeric'})}<br><span style="font-size:0.72rem; color:#bbb;">${new Date(c.date).toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'})}</span></td>
            <td><span style="font-size:0.75rem; color:#0a6aa1; font-weight:700; font-family:monospace;">${c.pId}</span><br><strong style="font-size:0.85rem;">${c.pTitle || 'Protocolo'}</strong></td>
            <td><i class="fas fa-user-circle" style="color:#0a6aa1;"></i> <strong>${c.author}</strong></td>
            <td style="max-width: 280px;">
                <div style="font-size: 0.88rem; color:#333;">${c.text}</div>
                ${c.reply ? `<div style="margin-top: 8px; padding: 7px 10px; background: #eef7ff; border-left: 3px solid #0a6aa1; border-radius:4px; font-size: 0.82rem;"><strong style="color:#0a6aa1;"><i class="fas fa-reply"></i> Admin:</strong> ${c.reply}</div>` : ''}
            </td>
            <td><span class="badge ${statusClass}" style="white-space:nowrap;">${statusText}</span></td>
            <td class="actions-cell" style="display: flex; gap: 5px; flex-wrap: wrap; align-items:center;">
                ${isPending ? `<button class="btn-primary" style="padding: 4px 8px; font-size: 0.75rem; background: #28a745;" onclick="moderateComment(${c.id}, 'approve')"><i class="fas fa-check"></i> Autorizar</button>` : ''}
                ${!isPending ? `<button class="btn-primary" style="padding: 4px 8px; font-size: 0.75rem; background: #e67e22; border:none; color: white;" onclick="moderateComment(${c.id}, 'reject')" title="Ocultar de la vista pública"><i class="fas fa-eye-slash"></i> Ocultar</button>` : ''}
                <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.75rem; background: #0a6aa1; color: white;" onclick="openReplyModal(${c.id})"><i class="fas fa-reply"></i> ${c.reply ? 'Editar Rpta' : 'Contestar'}</button>
                <button class="btn-icon btn-delete" style="padding: 4px 8px;" onclick="moderateComment(${c.id}, 'delete')" title="Eliminar comentario"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCommentPagination(filtered) {
    const container = document.getElementById('comments-pagination');
    if (!container) return;
    
    const totalPages = Math.ceil(filtered.length / _commentsPerPage);
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    
    const btnStyle = (active) => `padding:6px 14px; border-radius:6px; border:1px solid ${active ? '#0a6aa1' : '#dee2e6'}; background:${active ? '#0a6aa1' : 'white'}; color:${active ? 'white' : '#333'}; cursor:pointer; font-weight:600; font-size:0.85rem;`;
    
    let html = `<span style="font-size:0.82rem; color:#999; margin-right:4px;">Página ${_commentPage} de ${totalPages}</span>`;
    if (_commentPage > 1) html += `<button style="${btnStyle(false)}" onclick="goCommentPage(${_commentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - _commentPage) <= 1) {
            html += `<button style="${btnStyle(i === _commentPage)}" onclick="goCommentPage(${i})">${i}</button>`;
        } else if (Math.abs(i - _commentPage) === 2) {
            html += `<span style="color:#ccc;">...</span>`;
        }
    }
    if (_commentPage < totalPages) html += `<button style="${btnStyle(false)}" onclick="goCommentPage(${_commentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
    
    container.innerHTML = html;
}

function goCommentPage(page) {
    _commentPage = page;
    renderCommentFilter();
    document.getElementById('comments-table-body')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- Reply Modal ---
function openReplyModal(commentId) {
    _replyTargetId = commentId;
    const c = _allComments.find(x => x.id === commentId);
    if (!c) return;
    
    const modal = document.getElementById('modal-reply-comment');
    const preview = document.getElementById('reply-modal-comment-preview');
    const textarea = document.getElementById('reply-text-input');
    const btnDelete = document.getElementById('btn-delete-reply');
    
    preview.innerHTML = `<strong>${c.author}</strong> sobre <em>${c.pTitle || c.pId}</em>:<br>${c.text}`;
    textarea.value = c.reply || '';
    
    btnDelete.style.display = c.reply ? 'inline-flex' : 'none';
    btnDelete.onclick = () => {
        if (confirm('¿Eliminar la respuesta de este comentario?')) {
            moderateComment(commentId, 'reply', '');
            closeReplyModal();
        }
    };
    
    document.getElementById('btn-submit-reply').onclick = () => {
        const reply = textarea.value.trim();
        if (!reply) { textarea.style.borderColor = '#e74c3c'; return; }
        moderateComment(commentId, 'reply', reply);
        closeReplyModal();
    };
    
    modal.style.display = 'flex';
    setTimeout(() => textarea.focus(), 100);
}

function closeReplyModal() {
    document.getElementById('modal-reply-comment').style.display = 'none';
    _replyTargetId = null;
}

// --- Manual Comment Modal ---
function openManualCommentModal() {
    const modal = document.getElementById('modal-manual-comment');
    document.getElementById('manual-comment-pid').value = '';
    document.getElementById('manual-comment-author').value = '';
    document.getElementById('manual-comment-text').value = '';
    modal.style.display = 'flex';
    setTimeout(() => document.getElementById('manual-comment-pid').focus(), 100);
    
    document.getElementById('btn-submit-manual-comment').onclick = submitManualComment;
}

function closeManualCommentModal() {
    document.getElementById('modal-manual-comment').style.display = 'none';
}

async function submitManualComment() {
    const pId = document.getElementById('manual-comment-pid').value.trim();
    const author = document.getElementById('manual-comment-author').value.trim();
    const text = document.getElementById('manual-comment-text').value.trim();
    
    if (!pId || !author || !text) {
        alert('Por favor rellena todos los campos.');
        return;
    }
    
    const p = adminProtocols.find(item => item.section === pId);
    if (!p && !confirm(`No se ha encontrado el protocolo "${pId}". ¿Continuar de todas formas?`)) return;
    
    const pTitle = p ? p.title.replace(/\{.*?\}/, '').trim() : pId;
    
    const btn = document.getElementById('btn-submit-manual-comment');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
    
    try {
        const response = await fetch('/api/comments/create-manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pId, pTitle, author, text })
        });
        const result = await response.json();
        if (result.success) {
            showToast('✅ Comentario registrado correctamente');
            closeManualCommentModal();
            loadAdminComments();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (e) {
        alert('Error conectando con el servidor: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Registrar Comentario';
    }
}

async function moderateComment(commentId, action, replyText = null) {
    if (action === 'delete' && !confirm('¿Estás seguro de que deseas eliminar este comentario?')) return;
    
    try {
        const response = await fetch('/api/comments/moderate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commentId, action, replyText })
        });
        
        const result = await response.json();
        if (result.success) {
            showToast(action === 'delete' ? 'Comentario eliminado' : action === 'reply' ? 'Respuesta guardada' : 'Operación exitosa');
            loadAdminComments();
            updatePendingBadge();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (e) {
        alert('Error conectando con el servidor: ' + e.message);
    }
}

async function createManualComment() {
    openManualCommentModal();
}

function promptReply(commentId) {
    openReplyModal(commentId);
}

// Direct CSV Fallback URL Builder
function getCloudCsvUrl() {
    return `https://docs.google.com/spreadsheets/d/${CLOUD_SPREADSHEET_ID}/export?format=csv&id=${CLOUD_SPREADSHEET_ID}&gid=0`;
}

// GUI for Cloud Config
window.toggleCloudConfig = () => {
    const panel = document.getElementById('cloud-config-panel');
    if (!panel) return;
    const isVisible = panel.style.display === 'block';
    panel.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
        document.getElementById('config-cloud-url').value = CLOUD_GATEWAY_URL;
        document.getElementById('config-spreadsheet-id').value = CLOUD_SPREADSHEET_ID;
    }
};

window.saveCloudConfig = async () => {
    const newUrl = document.getElementById('config-cloud-url').value.trim();
    const newId = document.getElementById('config-spreadsheet-id').value.trim();
    
    if (newUrl) CLOUD_GATEWAY_URL = newUrl;
    if (newId) CLOUD_SPREADSHEET_ID = newId;
    
    showToast('💾 Guardando configuración en el servidor...');
    
    try {
        const res = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                cloudConfig: {
                    scriptUrl: CLOUD_GATEWAY_URL,
                    sheetId: CLOUD_SPREADSHEET_ID
                }
            })
        });
        if (res.ok) {
            showToast('✅ Configuración guardada correctamente');
            toggleCloudConfig();
        }
    } catch (e) {
        showToast('❌ Error guardando configuración');
    }
};

async function syncCloudComments() {
    const btn = document.getElementById('btn-sync-cloud-comments');
    if (!btn) return;
    
    if (!IS_LOCAL_SERVER) {
        alert('⚠️ La sincronización con la nube solo está disponible desde el administrador local.');
        return;
    }
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
    btn.disabled = true;

    try {
        const baseUrl = window.location.protocol === 'file:' ? 'http://localhost:3000' : window.location.origin;
        
        let cloudData = null;
        let methodUsed = 'Proxy JSON';

        // --- Try Stage 1: Proxy JSON (App Script) ---
        try {
            console.log('📡 Intentando sincronización Modo A (Proxy JSON)...');
            const urlToUse = CLOUD_GATEWAY_URL;
            const proxyUrl = `${baseUrl}/api/sync-cloud?url=${encodeURIComponent(urlToUse)}`;
            const proxyRes = await fetch(proxyUrl);
            if (proxyRes.ok) {
                cloudData = await proxyRes.json();
            } else {
                throw new Error(`Proxy error ${proxyRes.status}`);
            }
        } catch (e) {
            console.warn('❌ Fallo Modo A, intentando Modo B (Direct CSV Fallback)...', e.message);
            // --- Try Stage 2: Direct CSV Fallback ---
            const csvUrl = getCloudCsvUrl();
            if (csvUrl) {
                methodUsed = 'CSV Fallback';
                const csvProxyUrl = `${baseUrl}/api/sync-cloud?url=${encodeURIComponent(csvUrl)}`;
                const csvRes = await fetch(csvProxyUrl);
                if (csvRes.ok) {
                    cloudData = await csvRes.json();
                } else {
                    throw new Error(`CSV Error ${csvRes.status}`);
                }
            } else {
                throw e; // No fallback configured
            }
        }
        
        if (cloudData && Array.isArray(cloudData)) {
            // Fetch existing to avoid duplicates
            let existingKeys = new Set();
            try {
                const existing = await fetch(`${baseUrl}/api/comments/all`);
                const existingComments = await existing.json();
                existingComments.forEach(c => existingKeys.add(`${c.author}|${c.text.substring(0,20)}|${c.date}`));
            } catch(e) {}
            
            let importedCount = 0;
            let skippedCount = 0;
            for (const item of cloudData) {
                // Check required fields for a valid comment
                if (!item.author || !item.text) continue;

                const itemKey = `${item.author}|${item.text.substring(0,20)}|${item.date}`;
                if (existingKeys.has(itemKey)) {
                    skippedCount++;
                    continue;
                }

                const res = await fetch(`${baseUrl}/api/comments/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        pId: item.pId || 's/s', 
                        pTitle: item.pTitle || 'Protocolo Importado', 
                        author: item.author, 
                        text: item.text,
                        date: item.date || new Date().toISOString()
                    })
                });
                if (res.ok) importedCount++;
            }
            
            showToast(`✅ Sincronizado (${methodUsed}): ${importedCount} nuevos, ${skippedCount} duplicados.`);
            loadAdminComments();
            updatePendingBadge();
        } else {
            throw new Error('No se recibieron datos válidos de la nube.');
        }
    } catch (e) {
        console.error('Error Sync:', e);
        alert(`❌ Error en la sincronización.\n\nDetalle: ${e.message}\n\nPosibles causas:\n1. El Script de Google no está publicado como "Anyone".\n2. La URL del Script ha cambiado.\n3. El documento de Google no es público para lectura.`);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Close modals on background click
document.addEventListener('click', (e) => {
    const replyModal = document.getElementById('modal-reply-comment');
    const manualModal = document.getElementById('modal-manual-comment');
    if (replyModal && e.target === replyModal) closeReplyModal();
    if (manualModal && e.target === manualModal) closeManualCommentModal();
});

// Wire comment filter buttons
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.comment-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => setCommentFilter(btn.getAttribute('data-filter'), btn));
    });
});



// --- GESTIÓN DE CANALES ---
function initCanalesTab() {
    console.log('Iniciando pestaña Canales...', typeof window.channels_config);
    
    // Ensure window.channels_config is initialized from global data.js if not already
    if (typeof window.channels_config === 'undefined') {
        window.channels_config = [];
    }

    renderCanales();
    
    const btnAdd = document.getElementById('btn-add-channel');
    if (btnAdd) {
        btnAdd.onclick = (e) => {
            e.preventDefault();
            window.channels_config.push({
                id: 'nuevo-' + Date.now(),
                name: 'NUEVO CANAL',
                icon: '🌍',
                hotel: 'Ambos hoteles',
                summary: 'Descripción corta',
                content: 'Normativa general...',
                notes: '',
                htmlContent: ''
            });
            renderCanales();
        };
    }
    
    const btnSave = document.getElementById('btn-save-canales');
    if (btnSave) btnSave.onclick = saveCanales;
}

function renderCanales() {
    const container = document.getElementById('canales-container');
    if (!container) return;
    
    container.innerHTML = window.channels_config.map((c, idx) => `
        <div class="channel-editor-card">
            <div class="channel-card-header">
                <h3><i class="fas fa-satellite-dish"></i> Canal #${idx + 1}: ${c.name || 'Sin nombre'}</h3>
                <button class="btn-link" style="color:#e74c3c; font-size: 0.85rem;" onclick="removeChannel(${idx})"><i class="fas fa-trash"></i> Eliminar</button>
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px; background: #f8faff; padding: 15px; border-radius: 8px;">
                <div class="channel-form-group">
                    <label><i class="fas fa-hotel"></i> Destinatario / Hotel</label>
                    <select class="channel-input" onchange="updateChannelData(${idx}, 'hotel', this.value)" style="font-weight: 600; background: white;">
                        <option value="Ambos hoteles" ${c.hotel === 'Ambos hoteles' ? 'selected' : ''}>Ambos hoteles</option>
                        <option value="Sercotel Guadiana" ${c.hotel === 'Sercotel Guadiana' ? 'selected' : ''}>Sercotel Guadiana</option>
                        <option value="Cumbria Spa & Hotel" ${c.hotel === 'Cumbria Spa & Hotel' ? 'selected' : ''}>Cumbria Spa & Hotel</option>
                    </select>
                </div>
                <div class="channel-form-group">
                    <label>Nombre del Canal</label>
                    <input type="text" class="channel-input" value="${c.name || ''}" onchange="updateChannelData(${idx}, 'name', this.value)" style="font-weight:bold;" placeholder="Ej: Booking.com">
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 100px 1fr; gap:15px; margin-bottom:15px;">
                <div class="channel-form-group">
                    <label>Icono / Emoji</label>
                    <input type="text" class="channel-input" value="${c.icon || ''}" onchange="updateChannelData(${idx}, 'icon', this.value)" style="text-align:center; font-size:1.2rem;" placeholder="🌍">
                </div>
                <div class="channel-form-group">
                    <label>Resumen / Subtítulo</label>
                    <input type="text" class="channel-input" value="${c.summary || ''}" onchange="updateChannelData(${idx}, 'summary', this.value)" placeholder="Peculiaridades breves...">
                </div>
            </div>

            <div class="channel-form-group" style="margin-bottom:15px;">
                <label>Contenido Principal (Procedimiento)</label>
                <textarea class="channel-input" rows="3" onchange="updateChannelData(${idx}, 'content', this.value)" placeholder="Escribe aquí el procedimiento estándar para este canal...">${c.content || ''}</textarea>
            </div>
            
            <div class="channel-form-group" style="margin-bottom:15px;">
                <label>Notas Adicionales / Peculiaridades</label>
                <textarea class="channel-input" rows="2" onchange="updateChannelData(${idx}, 'notes', this.value)" style="background:#f9f9f9; font-size: 0.85rem;" placeholder="Notas internas o avisos...">${c.notes || ''}</textarea>
            </div>

            <div class="channel-html-area">
                <div class="channel-html-label">
                    <label style="margin:0; font-size:0.75rem; font-weight:700; color:#0a6aa1;"><i class="fas fa-code"></i> HTML Personalizado</label>
                    <div style="display:flex; gap:8px;">
                        <button type="button" onclick="selectChannelMedia(${idx}, 'image')" class="btn-primary" style="font-size: 0.7rem; padding: 4px 10px; background: #27ae60 !important; border-radius: 20px;"><i class="fas fa-image"></i> + Imagen</button>
                        <button type="button" onclick="selectChannelMedia(${idx}, 'video')" class="btn-primary" style="font-size: 0.7rem; padding: 4px 10px; background: #f39c12 !important; border-radius: 20px;"><i class="fas fa-video"></i> + Video</button>
                    </div>
                </div>
                <textarea id="channel-html-${idx}" class="channel-input" rows="4" onchange="updateChannelData(${idx}, 'htmlContent', this.value)" style="font-family: monospace; font-size:0.85rem;" placeholder="Tablas, enlaces o diseños especiales...">${c.htmlContent || ''}</textarea>
            </div>
        </div>
    `).join('');
}

window.selectChannelMedia = (idx, type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : 'video/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadChannelMedia(file, idx, type);
        }
    };
    input.click();
};

async function uploadChannelMedia(file, idx, type) {
    const btn = event.target; // Note: This might be tricky if called from input.onchange
    showToast(`Subiendo ${type}...`);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const result = await res.json();
        
        if (result.success) {
            let mediaHtml = '';
            if (type === 'image') {
                mediaHtml = `\n<div style="text-align:center; margin:15px 0;"><img src="${result.url}" alt="Información canal" style="max-width:100%; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.1);"></div>`;
            } else {
                mediaHtml = `\n<div style="text-align:center; margin:15px 0;"><video controls style="max-width:100%; border-radius:8px;"><source src="${result.url}" type="${file.type}">Tu navegador no soporta video.</video></div>`;
            }
            
            const textarea = document.getElementById(`channel-html-${idx}`);
            if (textarea) {
                textarea.value += mediaHtml;
                window.updateChannelData(idx, 'htmlContent', textarea.value);
                showToast('✅ Media insertado correctamente');
            }
        } else {
            alert('Error al subir: ' + result.message);
        }
    } catch (e) {
        console.error(e);
        alert('Error en la subida al servidor.');
    }
}


window.updateChannelData = (idx, field, value) => {
    window.channels_config[idx][field] = value;
    // Update ID from name if it's default
    if (field === 'name') {
        window.channels_config[idx].id = value.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }
};

window.removeChannel = (idx) => {
    if (confirm('¿Eliminar este canal permanentemente?')) {
        window.channels_config.splice(idx, 1);
        renderCanales();
    }
};

async function saveCanales() {
    const btn = document.getElementById('btn-save-canales');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    btn.disabled = true;

    try {
        // Use the centralized save function which handles channels_config now
        saveToServer(adminProtocols);
    } catch (e) {
        console.error('Error al guardar canales:', e);
        alert('Configuración guardada en memoria. Para guardado permanente, copia el array channels_config al inicio de data.js');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Load cloud config from global window if it exists (from data.js)
if (typeof cloud_config !== 'undefined') {
    if (cloud_config.scriptUrl) CLOUD_GATEWAY_URL = cloud_config.scriptUrl;
    if (cloud_config.sheetId) CLOUD_SPREADSHEET_ID = cloud_config.sheetId;
}
