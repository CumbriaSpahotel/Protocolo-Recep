let adminProtocols = [];
let editingIndex = -1;
let quill;
let isHtmlMode = false;

// Protección por contraseña
(function() {
    const storedPass = sessionStorage.getItem('adminAuth');
    if (storedPass !== 'Recp2026') {
        const pass = prompt('Introduce la clave de administrador:');
        if (pass === 'Recp2026') {
            sessionStorage.setItem('adminAuth', 'Recp2026');
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

function initQuill() {
    if (!quill) {
        quill = new Quill('#quill-editor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'font': [] }, { 'size': [] }],
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'script': 'sub'}, { 'script': 'super' }],
                    [{ 'header': 1 }, { 'header': 2 }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
                    [{ 'direction': 'rtl' }, { 'align': [] }],
                    ['link', 'image', 'video', 'formula'],
                    ['blockquote', 'code-block'],
                    ['clean']
                ]
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {

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


    // Sync
    document.getElementById('btn-sync').addEventListener('click', () => {
        location.reload();
    });
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
        const statusDisplay = selectedStatus || estadoHtml || '⚪ Sin definir';

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
        btnPublish.addEventListener('click', () => {
            if (!confirm('Esto subirá todos los cambios guardados a la web pública de GitHub. ¿Continuar?')) return;
            
            btnPublish.disabled = true;
            btnPublish.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';
            
            const publishUrl = window.location.protocol === 'file:' ? 'http://localhost:3000/api/publish' : '/api/publish';
            
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
                    alert('Error conectando al servidor para publicar.');
                })
                .finally(() => {
                    btnPublish.disabled = false;
                    btnPublish.innerHTML = '<i class="fab fa-github"></i> Publicar en GitHub';
                });
        });
    }
});

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

        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="background: #f1f3f5; color: #0a6aa1; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-family: monospace; font-size: 0.95rem; border: 1px solid #dee2e6; min-width: 45px; text-align: center;">${secVal}</span>
                    <strong style="font-size: 1rem; color: #333;">${p.title || 'Sin Título'}</strong>
                </div>
            </td>
            <td>
                <span class="badge" style="background: white; color: #455a64; border: 1px solid #dee2e6; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px;">
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

    // New: Handle Parent Sections based on Category
    select.addEventListener('input', () => {
        updateParentSections();
        generateNextId();
    });
    
    document.getElementById('edit-parent-section').addEventListener('input', () => {
        generateNextId();
    });
    
    // Also Keep change for select tags compatibility
    select.addEventListener('change', generateNextId);
    document.getElementById('edit-parent-section').addEventListener('change', generateNextId);
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

function generateNextId() {
    const categoryId = document.getElementById('edit-category').value.trim();
    const parentSection = document.getElementById('edit-parent-section').value.trim();
    const sectionInput = document.getElementById('edit-section');
    
    if (!categoryId) {
        sectionInput.value = '';
        return;
    }
    
    // Only auto-generate if it's a NEW protocol OR if the field is empty (to help fix errors)
    if (editingIndex !== -1 && sectionInput.value) return;

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
        addMenuRow(id, cat.name, cat.icon);
    });
}

function updateMenuOrder() {
    const rows = document.querySelectorAll('#menus-container .menu-row');
    rows.forEach((row, index) => {
        const idInput = row.querySelector('.menu-id');
        if (idInput) idInput.value = index + 1;
    });
}

function addMenuRow(id, name, icon) {
    const container = document.getElementById('menus-container');
    const row = document.createElement('div');
    row.className = 'menu-row';
    row.draggable = true;
    row.style = 'display:grid; grid-template-columns: 50px 80px 1fr 280px 50px; gap: 15px; align-items: end; background: #fff; padding: 15px; border-radius: 6px; border: 1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.02); cursor: grab; position: relative;';
    
    row.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 38px; color: #ccc;">
            <i class="fas fa-grip-lines"></i>
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px;">
            <label style="font-size: 0.8rem; font-weight: 600; color: #555;">Sección</label>
            <input type="text" class="menu-id" value="${id}" readonly style="width:100%; padding:8px; border:1px solid #eee; border-radius:4px; background:#f9f9f9; text-align:center; font-weight:bold; cursor: default;">
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px;">
            <label style="font-size: 0.8rem; font-weight: 600; color: #555;">Nombre de la Sección</label>
            <input type="text" class="menu-name" value="${name}" placeholder="Ej: Operativa Diaria" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" title="Nombre visible en la pestaña">
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px;">
            <label style="font-size: 0.8rem; font-weight: 600; color: #555;">Icono (Emoji o Clase)</label>
            <div style="display:flex; gap:10px; align-items:center;">
                <span class="icon-preview-box" style="width: 40px; height: 38px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; font-size: 1.2rem; color: var(--accent-blue, #0a6aa1);">${icon.startsWith('fa-') ? `<i class="fas ${icon}"></i>` : icon}</span>
                <input type="text" class="menu-icon" value="${icon}" style="flex:1; min-width:60px; padding:8px; border:1px solid #ccc; border-radius:4px;" oninput="this.previousElementSibling.innerHTML = this.value.startsWith('fa-') ? '<i class=\\'fas ' + this.value + '\\'></i>' : this.value">
                <button type="button" class="btn-icon-picker" style="background:#0a6aa1; color:white; border:none; border-radius:4px; padding:8px 12px; cursor:pointer; flex-shrink: 0;" onclick="openIconBank(this.previousElementSibling)" title="Buscar Icono"><i class="fas fa-icons"></i></button>
            </div>
        </div>
        <div style="display: flex; align-items: flex-end; padding-bottom: 2px;">
            <button type="button" class="btn-delete-row" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding:8px 12px; cursor:pointer; width:100%;" onclick="this.closest('.menu-row').remove(); updateMenuOrder();" title="Eliminar Sección"><i class="fas fa-trash"></i></button>
        </div>
    `;

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
    rows.forEach(row => {
        const id = row.querySelector('.menu-id').value.trim();
        const name = row.querySelector('.menu-name').value.trim();
        const icon = row.querySelector('.menu-icon').value.trim();
        if (id && name) {
            newNav[id] = { name, icon };
        }
    });
    document.getElementById('edit-menus-json').value = JSON.stringify(newNav, null, 2);
    return newNav;
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

document.addEventListener('DOMContentLoaded', () => {
    initSettingsEditors();
    setupDragAndDrop();
    
    // UI add buttons
    const btnAddMenu = document.getElementById('btn-add-menu');
    if (btnAddMenu) {
        btnAddMenu.addEventListener('click', () => {
            const currentRows = document.querySelectorAll('#menus-container .menu-row').length;
            addMenuRow(currentRows + 1, '', 'fa-folder');
        });
    }
    const btnAddCritical = document.getElementById('btn-add-critical');
    if (btnAddCritical) {
        btnAddCritical.addEventListener('click', () => {
            addAlertRow(document.getElementById('alerts-critical-container'), '', 'Hoy', '');
        });
    }
    const btnAddAnnounce = document.getElementById('btn-add-announcement');
    if (btnAddAnnounce) {
        btnAddAnnounce.addEventListener('click', () => {
            addAlertRow(document.getElementById('alerts-announcements-container'), '', 'Hoy', '');
        });
    }
    const btnAddNews = document.getElementById('btn-add-news');
    if (btnAddNews) {
        btnAddNews.addEventListener('click', () => {
            addNewsRow(document.getElementById('featured-news-container'), '', '');
        });
    }
    const btnAddGraphic = document.getElementById('btn-add-graphic-line');
    if (btnAddGraphic) {
        btnAddGraphic.addEventListener('click', () => {
            addGraphicLineRow(document.getElementById('graphic-lines-container'), '');
        });
    }
    
    // Save Menus Config
    document.getElementById('btn-save-menus').addEventListener('click', () => {
        try {
            const parsedNav = collectMenus();
            // Update global navigation_config so the rest of the app sees the changes immediately
            if (typeof navigation_config !== 'undefined') {
                Object.keys(navigation_config).forEach(key => delete navigation_config[key]);
                Object.assign(navigation_config, parsedNav);
            }
            saveToServer(adminProtocols, parsedNav, typeof home_config !== 'undefined' ? home_config : undefined);
            showToast('Configuración de menús guardada');
            populateCategories(); // refresh active categories in new protocol UI
        } catch(e) {
            alert('Error al guardar menús: ' + e.message);
        }
    });

    // Save Home Config
    document.getElementById('btn-save-inicio').addEventListener('click', () => {
        try {
            const parsedHome = collectInicio();
            saveToServer(adminProtocols, typeof navigation_config !== 'undefined' ? navigation_config : undefined, parsedHome);
            showToast('Configuración de inicio guardada');
        } catch(e) {
            alert('Error al guardar inicio: ' + e.message);
        }
    });
});

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
        protocols: protocolsData,
        navConfig: finalNav,
        homeConfig: finalHome
    };

    const saveUrl = window.location.protocol === 'file:' 
        ? 'http://localhost:3000/api/save'
        : '/api/save';

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

document.addEventListener('DOMContentLoaded', () => {
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
            renderIconBank(e.target.value);
        });
    }
});
