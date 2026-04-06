let protocols = [];
let filteredProtocols = [];
const mainColumn = document.getElementById('main-column');
const postsList = document.getElementById('posts-list');
const navItems = document.getElementById('top-nav-items');

// Hotel Context Management
let currentHotel = localStorage.getItem('selectedHotel') || 'Ambos hoteles';

function setHotel(hotel) {
    currentHotel = hotel;
    localStorage.setItem('selectedHotel', hotel);
    // Refresh UI
    renderNavigation();
    updateHotelButtons();
    
    const currentView = viewHistory[viewHistory.length - 1];
    if (currentView.type === 'home') renderHome();
    else if (currentView.type === 'protocol') loadProtocol(currentView.payload);
    else if (currentView.type === 'category') renderCategory(currentView.name, currentView.id);
    
    // Update the chatbot context if it exists
    const botContext = document.querySelector('.chatbot-header span:last-child');
    if (botContext) {
        botContext.innerHTML = `<span style="width:6px; height:6px; background:#4ade80; border-radius:50%; display:inline-block;"></span> IA · ${currentHotel}`;
    }
}

function updateHotelButtons() {
    const btns = {
        'Sercotel Guadiana': document.getElementById('btn-h-guadiana'),
        'Cumbria Spa & Hotel': document.getElementById('btn-h-cumbria'),
        'Ambos hoteles': document.getElementById('btn-h-ambos')
    };
    
    Object.keys(btns).forEach(key => {
        const btn = btns[key];
        if (!btn) return;
        
        if (key === currentHotel) {
            btn.style.background = 'var(--accent-gold)';
            btn.style.color = '#000';
            btn.style.boxShadow = '0 0 10px rgba(165,140,95,0.3)';
        } else {
            btn.style.background = 'rgba(255,255,255,0.1)';
            btn.style.color = '#fff';
            btn.style.boxShadow = 'none';
        }
    });
}

// History stack for better navigation
// CONFIGURACIÓN DE NUBE (OPCIÓN B)
const CLOUD_GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbytVnxql5WPL3eGZLjbLeE-ik2Ia6EAJP6O4DThs-A_H_pp4kad_oiv1NnEdwdoj-Oi/exec';

let viewHistory = [{ type: 'home' }];

// Fallback configuration if not found in data.js
const DEFAULT_CAT_MAP = {
    '1': { name: 'Operativa Diaria', icon: 'fa-calendar-check', subsections: {} },
    '2': { name: 'Reservas y Tarifas', icon: 'fa-file-invoice-dollar', subsections: {} },
    '3': { name: 'Estancia, Caja y Salidas', icon: 'fa-walking', subsections: {} },
    '4': { name: 'Gestión de Grupos', icon: 'fa-users-cog', subsections: {} },
    '5': { name: 'Coordinación Interna', icon: 'fa-sync-alt', subsections: {} },
    '6': { name: 'Seguridad y Emergencias', icon: 'fa-shield-alt', subsections: {} },
    '7': { name: 'Sistemas y Plataformas', icon: 'fa-desktop', subsections: {} },
    '8': { name: 'Manuales Básicos', icon: 'fa-book', subsections: {} },
    '9': { 
        name: 'Gestión de Personal', icon: 'fa-user-tie', 
        subsections: {},
        links: [
            { icon: 'fa-cloud', text: 'Cuadrante Online', url: 'https://nataliogc.github.io/turnosweb/live.html' },
            { icon: 'fa-exchange-alt', text: 'Solicitud de Camb Turno', url: 'https://procedimientoshotelguadiana.blogspot.com/2025/11/112-solicitu-de-cambio-de-turnos.html' },
            { icon: 'fa-umbrella-beach', text: 'Vacaciones del Personal', url: 'https://1drv.ms/x/c/7cdc5f6b199a606e/EWBW8z40KJtLlTyY-y6rLzUBLMk2FZGVYBhZlDpC04lFCQ?e=dZ7txS' },
            { icon: 'far fa-clock', text: 'Cuadrante Original', url: 'https://procedimientoshotelguadiana.blogspot.com/2025/08/111-gestion-cuadrantes-de-turnos.html' },
            { icon: 'fa-lock', text: 'Selección de Personal', url: 'https://docs.google.com/spreadsheets/d/1J9bnXU3iw-vHemsgWOhOnpGhAPtsutbt6Y1UYRpAe74/edit?usp=sharing' }
        ]
    },
    '10': { name: 'Spa y Piscina', icon: 'fa-swimming-pool', subsections: {} },
    '11': { 
        name: 'Noticias', icon: 'fa-newspaper', 
        subsections: { 'Comunicados': 'Comunicados' },
        links: [
            { icon: 'fa-newspaper', text: 'Noticias', url: 'https://nataliogc.github.io/Noticias/' }
        ]
    },
    '12': { 
        name: 'Restaurante', icon: 'fa-utensils', 
        subsections: { 'Catálogo de Menús': 'Catálogo de Menús' },
        links: [
            { icon: 'fa-download', text: 'Descarga Menús', url: 'https://1drv.ms/f/c/7cdc5f6b199a606e/EspwQwoBy05Fu9q4XbKzGUsBNVdzDdnFam7JpqtDB7h1dg?e=we0DeU' },
            { icon: 'fa-file-invoice', text: 'Presupuesto Menú Eventos', url: 'https://nataliogc.github.io/menus-eventos/l' },
            { icon: 'fa-glass-martini-alt', text: 'Menú Cóctel', url: 'https://nataliogc.github.io/menus-cocteles/' }
        ]
    },
    '13': { name: 'Otros', icon: 'fa-plus', subsections: {} },
    '15': { 
        name: 'Calidad', icon: 'fa-trophy', 
        subsections: { 'calidad en destino': 'Calidad en destino' },
        links: [
            { icon: 'fa-lock', text: 'Acceso Restringido (Menú Cóctel)', url: 'https://nataliogc.github.io/menus-cocteles/' }
        ]
    }
};

const getCatMap = () => {
    return (typeof navigation_config !== 'undefined') ? navigation_config : DEFAULT_CAT_MAP;
};

function init() {
    // Initialize Theme
    const isDark = localStorage.getItem('darkMode') === 'true';
    const themeBtn = document.getElementById('theme-toggle');
    const icon = themeBtn ? themeBtn.querySelector('i') : null;

    if (isDark) {
        document.body.classList.add('dark-mode');
        if (themeBtn) {
            themeBtn.style.backgroundColor = '#34495e';
            themeBtn.style.color = '#f1c40f';
            if (icon) {
                icon.className = 'fas fa-moon';
            }
        }
    } else {
        if (themeBtn) {
            themeBtn.style.backgroundColor = '#f1c40f';
            themeBtn.style.color = '#2c3e50';
            if (icon) {
                icon.className = 'fas fa-sun';
            }
        }
    }
    updateHotelButtons();

    if (typeof protocols_data !== 'undefined' && Array.isArray(protocols_data)) {
        protocols = protocols_data.filter(p => p.title && p.title !== "No Title");
        window.protocols = protocols; // Make protocols globally accessible
        
        // If geminiApiKey is empty (e.g. on GitHub Pages), try to load it from localStorage
        try {
            if (typeof cloud_config !== 'undefined' && !cloud_config.geminiApiKey) {
                const storedKey = localStorage.getItem('geminiApiKey_override');
                if (storedKey) {
                    cloud_config.geminiApiKey = storedKey;
                    console.log('[Config] Clave Gemini cargada desde almacenamiento local del navegador.');
                }
            }
        } catch(e) { /* localStorage bloqueado */ }
        
        // Calculate and show last update date
        if (protocols.length > 0) {
            const latestDate = protocols.reduce((max, p) => {
                const date = new Date(p.updated || p.published || 0);
                return date > max ? date : max;
            }, new Date(0));
            
            const dateEl = document.getElementById('last-update-date');
            if (dateEl) {
                dateEl.textContent = formatDate(latestDate);
            }
        }

        // Hash-based routing initialization
        window.addEventListener('hashchange', handleHashRouting);
        // Delay routing slightly to ensure DOM is ready
        setTimeout(handleHashRouting, 100);

        // Sort by modification date descending (most recently updated first)
        protocols.sort((a, b) => {
            const dateA = new Date(a.updated || a.published || 0);
            const dateB = new Date(b.updated || b.published || 0);
            return dateB - dateA;
        });
        initApp();
    } else {
        const postsListEl = document.getElementById('posts-list');
        if (postsListEl) postsListEl.innerHTML = '<div class="error-msg">Error: data.js no encontrado.</div>';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function initApp() {
    renderNavigation();
    renderHome();
    renderSidebar();
    
    // Search listener
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch(e.target.value);
        }
    });

    // Logo click
    document.querySelector('.main-header h1').style.cursor = 'pointer';
    document.querySelector('.main-header h1').addEventListener('click', () => {
        viewHistory = [{ type: 'home' }];
        renderHome();
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelector('.nav-link[data-cat="inicio"]').classList.add('active');
        document.querySelector('.app-wrapper').classList.remove('reading-mode');
    });

    // Inicio link click
    const inicioLink = document.querySelector('.nav-link[data-cat="inicio"]');
    if (inicioLink) {
        inicioLink.addEventListener('click', (e) => {
            e.preventDefault();
            viewHistory = [{ type: 'home' }];
            renderHome();
            setActiveNav(inicioLink);
        });
    }

    // Theme toggle listener
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDark);
            
            const icon = themeBtn.querySelector('i');
            if (isDark) {
                themeBtn.style.backgroundColor = '#34495e';
                themeBtn.style.color = '#f1c40f';
                if (icon) {
                    icon.className = 'fas fa-moon';
                }
            } else {
                themeBtn.style.backgroundColor = '#f1c40f';
                themeBtn.style.color = '#2c3e50';
                if (icon) {
                    icon.className = 'fas fa-sun';
                }
            }
        });
    }

    // Alert Buttons Logic
    const btnCritical = document.getElementById('btn-critical-errors');
    const btnAnnouncements = document.getElementById('btn-announcements');

    if (btnCritical) {
        btnCritical.addEventListener('click', (e) => {
            e.preventDefault();
            renderAlertsList('critical_errors');
        });
    }

    if (btnAnnouncements) {
        btnAnnouncements.addEventListener('click', (e) => {
            e.preventDefault();
            renderAlertsList('announcements');
        });
    }

    // Admin Access Protection
    const adminBtn = document.getElementById('admin-access');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            const isLocal = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1' || 
                            window.location.protocol === 'file:';
            if (isLocal) {
                window.location.href = 'admin.html';
                return;
            }

            const pass = prompt('Introduce la clave de acceso:');
            if (pass === 'Recp2026') {
                window.location.href = 'admin.html';
            } else if (pass !== null) {
                alert('Clave incorrecta');
            }
        });
    }

    // Sticky Retractable Header Logic
    let lastScrollY = window.scrollY;
    const topNav = document.querySelector('.top-nav');
    
    if (topNav) {
        window.addEventListener('scroll', () => {
            // Check if any dropdown is being hovered
            const isHoveringDropdown = document.querySelector('.nav-item-wrapper:hover');
            
            if (isHoveringDropdown) {
                // Keep nav visible if user is interacting with it
                topNav.classList.remove('nav-hidden');
            } else if (window.scrollY > lastScrollY && window.scrollY > 100) {
                // Scroll down - hide
                topNav.classList.add('nav-hidden');
            } else {
                // Scroll up - show
                topNav.classList.remove('nav-hidden');
            }
            lastScrollY = window.scrollY;
        }, { passive: true });
    }

    // Initialize Chatbot
    initChatbot();
}

function renderNavigation() {
    const CAT_MAP = getCatMap();
    navItems.innerHTML = ''; // Clear current
    
    // Initial categories from map
    const navOrder = Object.keys(CAT_MAP).sort((a,b) => parseInt(a) - parseInt(b));
    const seenNames = new Set(['Inicio']);

    // Re-inject the static Inicio link as a dropdown
    const inicioWrapper = document.createElement('div');
    inicioWrapper.className = 'nav-item-wrapper';
    
    const inicioItem = document.createElement('a');
    inicioItem.href = '#';
    inicioItem.className = 'nav-link active';
    inicioItem.setAttribute('data-cat', 'inicio');
    inicioItem.innerHTML = '<i class="fas fa-th-large"></i> Inicio <i class="fas fa-caret-down"></i>';
    inicioItem.onclick = (e) => {
        e.preventDefault();
        viewHistory = [{ type: 'home' }];
        renderHome();
        setActiveNav(inicioItem);
    };
    
    const inicioDropdown = document.createElement('div');
    inicioDropdown.className = 'dropdown-content';
    inicioDropdown.innerHTML = `
        <a href="#" id="link-guide"><i class="fas fa-book"></i> GUÍA OPERATIVA</a>
        <a href="https://nataliogc.github.io/Form.Recep/" target="_blank"><i class="fas fa-graduation-cap"></i> AUTOEVALUACIÓN RÁPIDA</a>
    `;

    // Operational Guide Link
    setTimeout(() => {
        const linkGuide = document.getElementById('link-guide');
        if (linkGuide) {
            linkGuide.onclick = (e) => {
                e.preventDefault();
                viewHistory.push({ type: 'guide' });
                renderOperationalGuide();
                setActiveNav(inicioItem);
            };
        }
    }, 0);
    
    inicioWrapper.appendChild(inicioItem);
    inicioWrapper.appendChild(inicioDropdown);
    navItems.appendChild(inicioWrapper);
    
    navOrder.forEach(id => {
        const cat = CAT_MAP[id];
        if (!seenNames.has(cat.name)) {
            const linkWrapper = document.createElement('div');
            linkWrapper.className = 'nav-item-wrapper';
            
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'nav-link';
            link.dataset.id = id;
            
            const isImageIcon = cat.icon.startsWith('http') || cat.icon.startsWith('assets/');
            const iconHtml = isImageIcon 
                ? `<img src="${cat.icon}" class="nav-icon-img" style="width: 18px; height: 18px; object-fit: contain; margin-right: 8px; vertical-align: middle;">`
                : `<i class="fas ${cat.icon}"></i>`;
            
            link.innerHTML = `${iconHtml} ${cat.name}`;
            
            // --- AUTOMATIC HIERARCHY DISCOVERY ---
            // 1. Find all relevant protocols for this category prefix (e.g., "1.")
            const catProtocols = protocols.filter(p => {
                const matchSection = p.section && (String(p.section) === id || String(p.section).startsWith(id + '.'));
                // Filter by hotel context
                const matchHotel = currentHotel === 'Ambos hoteles' || !p.source || p.source === 'Ambos hoteles' || p.source === 'General' || p.source === currentHotel;
                return matchSection && matchHotel;
            });
            
            // 2. Build a map of all unique section IDs present in these protocols
            const subMap = new Map();
            
            // 2a. First, seed the subMap with manually defined subsections from navigation_config
            if (cat.subsections && typeof cat.subsections === 'object') {
                Object.entries(cat.subsections).forEach(([subId, subData]) => {
                    // Only include numeric-style subsection IDs (e.g. "8.1", "14.1") not named ones
                    if (!subMap.has(subId) && /^\d+\.\d/.test(subId)) {
                        const matchedP = protocols.find(pr => String(pr.section) === subId);
                        const subName = typeof subData === 'string' ? subData : subData.name;
                        const subLinks = typeof subData === 'object' ? subData.links : [];
                        
                        subMap.set(subId, {
                            id: subId,
                            name: subName,
                            links: subLinks,
                            emoji: null,
                            protocol: matchedP || null,
                            children: []
                        });
                    }
                });
            }
            
            catProtocols.forEach(p => {
                const sId = String(p.section);
                if (sId === id) return; // Top-level handled by click on link itself or special entry
                
                const parts = sId.split('.');
                // Ensure all levels exist in map (e.g., if we have 1.5.1, ensure 1.5 exists)
                for (let i = 2; i <= parts.length; i++) {
                    const currentId = parts.slice(0, i).join('.');
                    if (!subMap.has(currentId)) {
                        const matchedP = protocols.find(pr => String(pr.section) === currentId);
                        const name = matchedP ? matchedP.title.replace(/\{.*?\}/, '').trim() : `Sección ${currentId}`;
                        const emoji = matchedP ? (matchedP.title.match(/\{([\u0000-\uFFFF\uD800-\uDBFF\uDC00-\uDFFF]+?)\}/)?.[1] || null) : null;
                        
                        subMap.set(currentId, { 
                            id: currentId, 
                            name, 
                            emoji,
                            protocol: matchedP,
                            children: [] 
                        });
                    }
                }
            });
            
            // 3. Construct the tree structure
            const rootSubItems = [];
            const allSubItems = Array.from(subMap.values()).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
            
            allSubItems.forEach(item => {
                const parts = item.id.split('.');
                if (parts.length > 2) {
                    const parentId = parts.slice(0, parts.length - 1).join('.');
                    if (subMap.has(parentId)) {
                        subMap.get(parentId).children.push(item);
                    } else {
                        rootSubItems.push(item);
                    }
                } else {
                    rootSubItems.push(item);
                }
            });

            const hasDynamicContent = rootSubItems.length > 0;
            const hasExternalLinks = cat.links && cat.links.length > 0;

            if (hasDynamicContent || hasExternalLinks) {
                link.innerHTML += ` <i class="fas fa-caret-down"></i>`;
                const dropdown = document.createElement('div');
                dropdown.className = 'dropdown-content';
                
                // Add External Links first (if any)
                if (hasExternalLinks) {
                    cat.links.forEach(l => {
                        const a = document.createElement('a');
                        a.href = l.url; a.target = "_blank";
                        const isImg = l.icon && (l.icon.startsWith('http') || l.icon.startsWith('assets/'));
                        const iconHtml = isImg 
                            ? `<img src="${l.icon}" style="width: 14px; height: 14px; margin-right: 8px; vertical-align: middle;">`
                            : `<i class="fas ${l.icon || 'fa-link'}"></i> `;
                        a.innerHTML = `${iconHtml}${l.text}`;
                        dropdown.appendChild(a);
                    });
                }

                // Recursive render function for subsections
                const renderNavItem = (item, parentEl) => {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'sub-dropdown-wrapper';
                    
                    const a = document.createElement('a');
                    a.href = '#';
                    a.className = 'nav-item-link';
                    
                    let iconHtml = item.emoji 
                        ? `<span style="margin-right:8px; font-size:1.1rem;">${item.emoji}</span>`
                        : '<i class="far fa-folder" style="margin-right:8px; opacity:0.3;"></i> ';
                    
                    a.innerHTML = `<span style="display:flex; align-items:center; flex:1;">${iconHtml}${item.name}</span>`;
                    
                    if (item.children.length > 0 || (item.links && item.links.length > 0)) {
                        a.innerHTML += ` <i class="fas fa-caret-right" style="font-size: 0.7rem; margin-left: auto; opacity: 0.6; padding-left: 10px;"></i>`;
                        const nested = document.createElement('div');
                        nested.className = 'dropdown-content nested';
                        
                        // Add sub-section links first (if any)
                        if (item.links && item.links.length > 0) {
                            item.links.forEach(l => {
                                const la = document.createElement('a');
                                la.href = l.url; la.target = "_blank";
                                const isImg = l.icon && (l.icon.startsWith('http') || l.icon.startsWith('assets/'));
                                const iconHtml = isImg 
                                    ? `<img src="${l.icon}" style="width: 14px; height: 14px; margin-right: 8px; vertical-align: middle;">`
                                    : `<i class="fas ${l.icon || 'fa-link'}"></i> `;
                                la.innerHTML = `${iconHtml}${l.text}`;
                                nested.appendChild(la);
                            });
                        }

                        // Add children subsections
                        item.children.sort((a,b) => a.id.localeCompare(b.id, undefined, {numeric:true}))
                                     .forEach(child => renderNavItem(child, nested));
                        
                        a.onclick = (e) => {
                            e.preventDefault();
                            if (item.protocol) {
                                viewHistory.push({ type: 'protocol', payload: item.protocol });
                                loadProtocol(item.protocol);
                            } else {
                                // Filter category by subsection prefix
                                viewHistory.push({ type: 'category', name: item.name, id: item.id });
                                renderCategory(item.name, item.id);
                            }
                        };
                        
                        wrapper.appendChild(a);
                        wrapper.appendChild(nested);
                    } else {
                        if (item.protocol) {
                            a.onclick = (e) => {
                                e.preventDefault();
                                viewHistory.push({ type: 'protocol', payload: item.protocol });
                                loadProtocol(item.protocol);
                            };
                        } else {
                            // No direct protocol: filter category by this subsection
                            a.onclick = (e) => {
                                e.preventDefault();
                                viewHistory.push({ type: 'category', name: item.name, id: item.id });
                                renderCategory(item.name, item.id);
                            };
                        }
                        wrapper.appendChild(a);
                    }
                    parentEl.appendChild(wrapper);
                };

                rootSubItems.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
                            .forEach(item => renderNavItem(item, dropdown));
                
                linkWrapper.appendChild(link);
                linkWrapper.appendChild(dropdown);
                navItems.appendChild(linkWrapper);
            } else {
                navItems.appendChild(link);
            }

            link.addEventListener('click', (e) => {
                e.preventDefault();
                setActiveNav(link);
                viewHistory.push({ type: 'category', name: cat.name, id: id });
                renderCategory(cat.name, id);
            });

            seenNames.add(cat.name);
        }
    });
}

function setActiveNav(el) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    el.classList.add('active');
}
function toggleHomeComponents(isHome) {
    const efficiencyWidget = document.getElementById('sidebar-efficiency-widget');
    if (efficiencyWidget) {
        efficiencyWidget.style.display = isHome ? 'block' : 'none';
    }
}

function renderHome() {
    toggleHomeComponents(true);
    document.querySelector('.app-wrapper').classList.add('reading-mode');
    
    // Manual Operativo de Recepción - Centro de Procedimientos
    const welcomeTitle = (typeof home_config !== 'undefined' && home_config.welcome) ? home_config.welcome.title : 'Manual Operativo de Recepción';
    const welcomeText = (typeof home_config !== 'undefined' && home_config.welcome) ? home_config.welcome.text : 'Bienvenido al sistema centralizado de procedimientos y normativas de trabajo.';

    mainColumn.innerHTML = `
        <div class="welcome-card premium-shadow">
            <h1 class="welcome-title"><i class="fas fa-hotel"></i> ${welcomeTitle}</h1>
            <p class="welcome-desc">${welcomeText}</p>
        </div>

        <div class="dashboard-grid">
            <!-- Búsqueda Global -->
            <div class="dashboard-card search-card premium-shadow">
                <h3 class="dash-title"><i class="fas fa-search"></i> BÚSQUEDA GLOBAL</h3>
                <div class="dash-search-container">
                    <input type="text" id="dash-search-input" placeholder="Escriba aquí para buscar..." onkeyup="if(event.key === 'Enter') handleSearch(this.value)">
                    <button class="dash-search-btn" onclick="handleSearch(document.getElementById('dash-search-input').value)">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </div>

            <!-- Comunicados -->
            <div class="dashboard-card alerts-card premium-shadow">
                <h3 class="dash-title"><i class="fas fa-bell"></i> COMUNICADOS</h3>
                <div class="dash-alerts-grid">
                    <div class="dash-alert-btn red" onclick="renderAlertsList('critical_errors')">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>ERRORES</span>
                        <span class="dash-badge" id="dash-critical-count">0</span>
                    </div>
                    <div class="dash-alert-btn blue" onclick="renderAlertsList('announcements')">
                        <i class="fas fa-bullhorn"></i>
                        <span>COMUNICADOS</span>
                        <span class="dash-badge" id="dash-announcements-count">0</span>
                    </div>
                </div>
            </div>

            <!-- Destacados -->
            <div class="dashboard-card featured-card premium-shadow">
                <h3 class="dash-title"><i class="fas fa-star"></i> DESTACADOS</h3>
                <div id="dash-featured-content" class="dash-news-list">
                    <div class="loading-news">Cargando noticias...</div>
                </div>
            </div>
        </div>

        <div class="quick-access-section">
            <h2 class="section-title"><i class="fas fa-rocket"></i> Accesos Rápidos</h2>
            <div class="quick-access-grid">
                ${['1', '3', '4', '5'].map(id => {
                    const cat = getCatMap()[id];
                    if (!cat) return '';
                    
                    const catProtocols = protocols.filter(p => p.section === id || (p.section && p.section.startsWith(id + '.')));
                    const hasProtocols = catProtocols.length > 0;
                    
                    const isImageIcon = cat.icon.startsWith('http') || cat.icon.startsWith('assets/');
                    const iconHtml = isImageIcon 
                        ? `<img src="${cat.icon}" class="nav-icon-img" style="width: 32px; height: 32px; object-fit: contain;">`
                        : `<i class="fas ${cat.icon}"></i>`;

                    return `
                        <div class="quick-card-wrapper">
                            <div class="quick-card" onclick="renderCategory('${cat.name}', '${id}')">
                                <div class="quick-icon">${iconHtml}</div>
                                <div class="quick-info">
                                    <h3>${cat.name.replace('Estancia, ', '').replace(' y Salidas', '')}</h3>
                                    <p>${id === '1' ? 'Gestión de cuadrantes' : id === '3' ? 'Control de tarifas' : id === '4' ? 'Facturación y cierre' : 'Eventos y grupos'}</p>
                                </div>
                                ${hasProtocols ? '<i class="fas fa-chevron-right quick-arrow"></i>' : ''}
                            </div>
                            ${hasProtocols ? `
                                <div class="quick-dropdown">
                                    <div class="quick-dropdown-header">
                                        <i class="fas fa-list-ul"></i> PROTOCOLOS: ${cat.name.toUpperCase()}
                                    </div>
                                    <div class="quick-dropdown-items">
                                        ${catProtocols.map(p => {
                                            const pEmojiMatch = p.title.match(/\{([\u0000-\uFFFF\uD800-\uDBFF\uDC00-\uDFFF]+?)\}/);
                                            const pIcon = pEmojiMatch ? pEmojiMatch[1] : '📄';
                                            const pTitle = p.title.replace(/\{.*?\}/, '').trim();
                                            return `
                                                <a href="#" class="quick-drop-item" onclick="event.preventDefault(); event.stopPropagation(); viewHistory.push({ type: 'protocol', payload: ${JSON.stringify(p).replace(/"/g, '&quot;')} }); loadProtocol(window.protocols.find(pr => pr.title === '${p.title.replace(/'/g, "\\'")}'))">
                                                    <span class="q-icon">${pIcon}</span>
                                                    <span class="q-text">${pTitle}</span>
                                                </a>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <div class="recent-protocols-box" style="margin-top: 2rem;">
            <h2 class="section-title"><i class="fas fa-history"></i> Protocolos Actualizados Recientemente</h2>
            <div id="posts-list" class="recent-posts-grid"></div>
        </div>

        <div class="recent-updates-box">
            <h2 class="section-title"><i class="fas fa-clock"></i> Actualizaciones y Novedades</h2>
            <div id="home-updates-list"></div>
        </div>
        ${getLegalFooterHtml()}
    `;

    // Populate Dashboard Data from home_config
    if (typeof home_config !== 'undefined') {
        const critCount = home_config.alerts?.critical_errors?.items?.length || 0;
        const annCount = home_config.alerts?.announcements?.items?.length || 0;
        
        const critEl = document.getElementById('dash-critical-count');
        const annEl = document.getElementById('dash-announcements-count');
        
        if (critEl) critEl.textContent = critCount;
        if (annEl) annEl.textContent = annCount;
        
        // News list
        const newsListEl = document.getElementById('dash-featured-content');
        if (newsListEl) {
            if (home_config.featured_news && home_config.featured_news.length > 0) {
                let newsHtml = '<ul class="dash-news-items">';
                home_config.featured_news.forEach(item => {
                    newsHtml += `
                        <li class="dash-news-item">
                            <a href="${item.link || '#'}" ${item.link ? 'target="_blank"' : ''}>
                                <i class="fas fa-chevron-right"></i> ${item.text}
                            </a>
                        </li>`;
                });
                newsHtml += '</ul>';
                newsListEl.innerHTML = newsHtml;
            } else {
                newsListEl.innerHTML = '<div class="no-news">No hay destacados.</div>';
            }
        }
    }

    renderRecentUpdates();
    // Fill last update date if available
    const lastUpdateEl = document.getElementById('last-update-date');
    const homeDateEl = document.getElementById('home-last-date');
    if (lastUpdateEl && homeDateEl) {
        homeDateEl.textContent = lastUpdateEl.textContent;
    }

    const list = document.getElementById('posts-list');
    
    // Sort taking into account when it was last modified/updated
    const sorted = [...protocols].sort((a, b) => {
        const dateA = new Date(a.updated || a.published || 0);
        const dateB = new Date(b.updated || b.published || 0);
        return dateB - dateA;
    });
    
    // Show top 8 recent
    if (list) {
        renderList(sorted.slice(0, 8), list);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderRecentUpdates() {
    const listEl = document.getElementById('home-updates-list');
    if (!listEl) return;
    
    if (typeof home_config === 'undefined' || !home_config.recent_updates || home_config.recent_updates.length === 0) {
        listEl.innerHTML = '<div class="no-updates">No hay actualizaciones recientes registradas.</div>';
        return;
    }
    
    listEl.innerHTML = home_config.recent_updates.map(item => `
        <div class="update-item" style="padding: 1rem; border-bottom: 1px solid #f0f0f0; display: flex; align-items: flex-start; gap: 1rem;">
            <div class="update-badge" style="background: var(--accent-blue); color: white; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 800; white-space: nowrap;">
                ${item.date || 'Reciente'}
            </div>
            <div class="update-content" style="font-size: 0.95rem; color: #444; line-height: 1.4;">
                ${item.text}
            </div>
        </div>
    `).join('');
}

function renderList(items, container, options = {}) {
    const { highlightText = '', append = false } = options;
    if (!append) container.innerHTML = '';
    if (items.length === 0) {
        container.innerHTML = '<div class="no-results" style="padding: 2rem; text-align: center; color: var(--text-muted);">No se encontraron artículos con esos términos.</div>';
        return;
    }

    items.forEach(p => {
        const item = document.createElement('div');
        item.className = 'post-item';
        // Add a numeric data attribute for potential sorting/filtering
        item.dataset.section = p.section || '';
        
        // Generate a smart snippet around the search term
        const rawContent = stripHtml(p.content);
        let excerpt = '';
        if (highlightText) {
            const idx = rawContent.toLowerCase().indexOf(highlightText.toLowerCase());
            if (idx !== -1) {
                const start = Math.max(0, idx - 80);
                const end = Math.min(rawContent.length, start + 180);
                excerpt = (start > 0 ? '...' : '') + rawContent.substring(start, end) + (end < rawContent.length ? '...' : '');
            } else {
                excerpt = rawContent.substring(0, 180) + '...';
            }
        } else {
            excerpt = rawContent.substring(0, 180) + '...';
        }
        let originalTitle = p.title;
        let cleanTitle = originalTitle;
        let statusBadge = null;
        
        const emojiRegex = /\{([\u0000-\uFFFF\uD800-\uDBFF\uDC00-\uDFFF]+?)\}/;
        const emojiMatch = originalTitle.match(emojiRegex);

        if (emojiMatch) {
           const emoji = emojiMatch[1];
           let statusText = 'Desconocido';
           let statusClass = 'status-unknown';
           
           if (emoji === '🟢') { statusText = 'Activo'; statusClass = 'status-active'; }
           else if (emoji === '🟠' || emoji === '🟡') { statusText = 'En redacción'; statusClass = 'status-draft'; }
           else if (emoji === '🔴') { statusText = 'En proceso'; statusClass = 'status-process'; }
           
           statusBadge = { emoji, text: statusText, class: statusClass };
           cleanTitle = originalTitle.replace(emojiMatch[0], '').trim();
        } else if (p.status) {
           // Fallback to p.status field if no emoji in title
           let statusText = p.status;
           let statusClass = 'status-unknown';
           let emoji = '⚪';
           
           if (statusText === 'Activo') { emoji = '🟢'; statusClass = 'status-active'; }
           else if (statusText === 'En redacción') { emoji = '🟠'; statusClass = 'status-draft'; }
           else if (statusText === 'En proceso') { emoji = '🔴'; statusClass = 'status-process'; }
           
           statusBadge = { emoji, text: statusText, class: statusClass };
        }

        let displayTitle = cleanTitle;
        if (highlightText) {
            const regex = new RegExp(`(${highlightText})`, 'gi');
            displayTitle = displayTitle.replace(regex, '<span class="highlight">$1</span>');
            excerpt = excerpt.replace(regex, '<span class="highlight">$1</span>');
        }

        let scope = p.source ? p.source : 'Ambos hoteles';
        if (scope === 'Ambos hoteles') scope = 'Sercotel Guadiana y Cumbria Spa & Hotel';
        
        const bestDate = p.updated || p.published;
        
        item.innerHTML = `
            <div class="post-card-content">
                <div class="post-header-meta">
                    <div class="post-date"><i class="far fa-calendar-alt"></i> ${formatDate(bestDate)}</div>
                    <div class="post-meta-separator">|</div>
                    <div class="post-section-tag">${p.section ? `<i class="fas fa-hashtag"></i> ID ${p.section}` : '<i class="fas fa-file"></i> s/s'}</div>
                    ${statusBadge ? `<div class="post-status-pill ${statusBadge.class}">${statusBadge.emoji} ${statusBadge.text}</div>` : ''}
                </div>
                
                <h3 class="post-title">${p.isChannel ? '📢 ' : ''}${displayTitle}</h3>
                <p class="post-excerpt">${excerpt}</p>
                
                <div class="post-footer">
                    <div class="post-scope"><i class="fas fa-map-marker-alt"></i> ${scope}</div>
                    <div class="post-action-link">Leer más <i class="fas fa-long-arrow-alt-right"></i></div>
                </div>
            </div>
        `;
        
        item.addEventListener('click', () => {
            if (p.isChannel) {
                // Find the "Canales de Venta" protocol (usually 2.1 or similar)
                const channelProtocol = protocols.find(pr => pr.section === '2.1.0' || pr.section === '2.1');
                if (channelProtocol) {
                    viewHistory.push({ type: 'protocol', payload: channelProtocol });
                    loadProtocol(channelProtocol);
                    // Selection of the specific channel is handled by loadProtocol's logic if we pass the channel id
                    setTimeout(() => {
                        const tab = document.querySelector(`.channel-tab[data-id="${p.id}"]`);
                        if (tab) tab.click();
                    }, 100);
                }
            } else {
                viewHistory.push({ type: 'protocol', payload: p });
                loadProtocol(p, highlightText);
            }
        });
        container.appendChild(item);
    });
}

function renderCategory(name, id) {
    location.hash = `category/${id}`;
    toggleHomeComponents(false);
    const CAT_MAP = getCatMap();
    document.querySelector('.app-wrapper').classList.add('reading-mode');

    mainColumn.innerHTML = `
        <div class="back-btn" onclick="goBack()"><i class="fas fa-arrow-left"></i> Volver</div>
        <h2 class="section-title"><i class="fas ${CAT_MAP[id] ? CAT_MAP[id].icon : 'fa-folder'}"></i> ${name}</h2>
        <div id="posts-list"></div>
        ${getLegalFooterHtml()}
    `;
    
    const catProtocols = protocols.filter(p => {
        if (!p.section) return false;
        const sId = String(p.section);
        // If id contains a dot, it's a subsection – match exactly or prefix
        if (id.includes('.')) {
            return sId === id || sId.startsWith(id + '.');
        }
        const parts = sId.split('.');
        const pId = parts[0];
        // Match by ID if possible, otherwise fallback to name match
        return pId === id || (CAT_MAP[pId] && CAT_MAP[pId].name === name) || (p.categories && p.categories.includes(name));
    });

    // Sort numerically by section
    catProtocols.sort((a, b) => a.section.localeCompare(b.section, undefined, { numeric: true }));
    
    const postsList = document.getElementById('posts-list');
    postsList.innerHTML = ''; // Clear once

    // Grouping logic for better organization (e.g. 1.1, 1.2)
    const groups = {};
    catProtocols.forEach(p => {
        const parts = p.section.split('.');
        const groupKey = parts.slice(0, 2).join('.'); // e.g. "1.1"
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(p);
    });

    const sortedGroupKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    
    if (catProtocols.length === 0) {
        postsList.innerHTML = '<div class="no-results" style="padding: 2rem; text-align: center; color: var(--text-muted);"><i class="fas fa-folder-open fa-3x" style="opacity:0.2; margin-bottom:1rem;"></i><p>No se encontraron protocolos en esta categoría.</p></div>';
    } else {
        sortedGroupKeys.forEach(groupKey => {
            // Find if this group has a representative title (the shortest section number in the group)
            const shortest = groups[groupKey].sort((a,b) => a.section.length - b.section.length)[0];
            const groupTitle = shortest ? shortest.title.replace(/\{.*?\}/, '').trim() : `Sección ${groupKey}`;
            
            const groupHeader = document.createElement('div');
            groupHeader.className = 'category-group-header';
            groupHeader.innerHTML = `<h3><i class="fas fa-layer-group"></i> ${groupKey}. ${groupTitle}</h3>`;
            postsList.appendChild(groupHeader);
            
            renderList(groups[groupKey], postsList, { append: true });
        });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function loadProtocol(p, highlightText = '') {
    const pId = p.section || p.title;
    location.hash = `protocol/${encodeURIComponent(pId)}`;
    toggleHomeComponents(false);
    document.querySelector('.app-wrapper').classList.add('reading-mode');

    let content = p.content;
    const isChannelProtocol = p.section === '2.1.0' || p.section === '2.1' || (p.title && p.title.includes('Canales de venta'));
    
    // 1. Prepare Content (Special Channel Case)
    if (isChannelProtocol && typeof channels_config !== 'undefined') {
        const relevantChannels = channels_config.filter(c => 
            currentHotel === 'Ambos hoteles' || c.hotel === 'Ambos hoteles' || c.hotel === currentHotel
        );

        content = `
            <div class="channel-explorer-container">
                <div class="channel-info-banner" style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-left: 5px solid #2196f3; padding: 15px 20px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); display: flex; align-items: start; gap: 15px;">
                    <i class="fas fa-info-circle" style="color: #1976d2; font-size: 1.4rem; margin-top: 2px;"></i>
                    <div style="font-size: 0.95rem; color: #1565c0; line-height: 1.5;">
                        <p style="margin: 0; font-weight: 700; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px; margin-bottom: 4px;">Información para el Usuario:</p>
                        Este explorador te permite consultar la operativa específica de cada canal. 
                        <strong>1. Filtra por Hotel</strong> para reducir la lista a los canales activos en tu centro. 
                        <strong>2. Pulsa en un Canal</strong> de la cuadrícula para ver sus detalles, procedimientos y notas específicas sin tener que desplazarte.
                    </div>
                </div>

                <div class="channel-filter-bar" style="margin-bottom: 25px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; background: #f4f6f8; padding: 10px; border-radius: 12px; border: 1px solid #e0e4e8;">
                    <span style="font-size: 0.75rem; font-weight: 800; color: #5c7081; text-transform: uppercase; letter-spacing: 0.5px; margin-right: 5px;">📍 Hotel:</span>
                    ${['Sercotel Guadiana', 'Cumbria Spa & Hotel', 'Ambos hoteles'].map(h => `
                        <button onclick="setHotel('${h}')" style="padding: 6px 14px; border-radius: 8px; border: 1px solid ${currentHotel === h ? 'var(--accent-blue)' : '#ccc'}; background: ${currentHotel === h ? 'var(--accent-blue)' : 'white'}; color: ${currentHotel === h ? 'white' : '#555'}; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">
                            ${h.replace('Sercotel ', '').replace(' Spa & Hotel', '')}
                        </button>
                    `).join('')}
                </div>

                <nav class="channel-nav-sticky" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; position: sticky; top: -10px; z-index: 100; background: #004a66; padding: 15px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); overflow: visible;">
                    ${relevantChannels.map((c, idx) => `
                        <button onclick="selectChannelTab('${c.id}', this)" class="channel-tab ${idx === 0 ? 'active' : ''}" style="padding: 10px; font-size: 0.75rem; background: ${idx === 0 ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)'}; color: ${idx === 0 ? '#000' : 'white'}; border-radius: 8px; border: 1px solid ${c.isGift ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255,255,255,0.1)'}; font-weight: 700; text-align: center; cursor: pointer; transition: all 0.2s; min-height: 45px; position: relative;">
                            ${c.isGift ? '<span style="position: absolute; top: -5px; right: -5px; background: #a855f7; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">🎁</span>' : ''}
                            ${c.name}
                        </button>
                    `).join('')}
                </nav>

                <div id="channels-render-list" style="min-height: 400px; background: rgba(255,255,255,0.02); border-radius: 20px; padding: 5px;">
                    ${relevantChannels.length > 0 ? relevantChannels.map((c, idx) => `
                        <div id="panel-${c.id}" class="channel-pane" style="display: ${idx === 0 ? 'block' : 'none'}; animation: fadeIn 0.3s ease-out;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #a58c5f; padding-bottom: 10px; margin-bottom: 20px;">
                                <h2 style="border:none; margin:0; color: #004a66; font-size: 1.5rem; display: flex; align-items: center; gap: 10px;">
                                    ${c.icon} ${c.name}
                                    ${c.isGift ? '<span style="background: #f3e8ff; color: #7e22ce; padding: 4px 10px; border-radius: 6px; font-size: 0.65rem; border: 1px solid #e9d5ff; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Bono Regalo</span>' : ''}
                                </h2>
                                <span class="hotel-badge" style="background: ${c.hotel === 'Ambos hoteles' ? '#004a66' : c.hotel === 'Sercotel Guadiana' ? '#a58c5f' : '#27ae60'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">
                                    ${c.hotel || 'Ambos hoteles'}
                                </span>
                            </div>
                            <div class="channel-card" style="background: white; border-radius: 16px; padding: 30px; border: 1px solid #eee; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                                <h3 style="margin-top:0; color: var(--accent-blue); font-size: 1.2rem;">${c.summary || 'Resumen del Canal'}</h3>
                                <div class="channel-procedimiento" style="color: #444; line-height: 1.7; font-size: 1.05rem;">
                                    ${c.content ? `<p>${c.content.replace(/\n/g, '<br>')}</p>` : ''}
                                </div>
                                ${c.htmlContent ? `<div class="channel-custom-html" style="margin-top:25px; background: #fafafa; padding: 20px; border-radius: 12px; border: 1px solid #efefef;">${c.htmlContent}</div>` : ''}
                                ${c.notes ? `
                                    <div class="channel-notes" style="margin-top:25px; padding:20px; background:#fff9e6; border-left:5px solid var(--accent-gold); border-radius:8px;">
                                        <h4 style="margin:0 0 10px 0; font-size:0.9rem; color:#856404; text-transform: uppercase; letter-spacing: 1px;"><i class="fas fa-exclamation-circle"></i> Notas del Canal</h4>
                                        <p style="margin:0; font-size:0.95rem; color: #735e1d; font-style:italic;">${c.notes.replace(/\n/g, '<br>')}</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('') : '<div style="padding: 40px; text-align: center; color: #999;"><i class="fas fa-search fa-3x" style="margin-bottom: 10px; opacity: 0.3;"></i><p>No hay canales configurados para este hotel.</p></div>'}
                </div>
            </div>

            <script>
                function selectChannelTab(id, btn) {
                    // Hide all panes
                    document.querySelectorAll('.channel-pane').forEach(p => p.style.display = 'none');
                    // Show selected
                    const target = document.getElementById('panel-' + id);
                    if(target) target.style.display = 'block';
                    
                    // Update buttons
                    document.querySelectorAll('.channel-tab').forEach(b => {
                        b.style.background = 'rgba(255,255,255,0.1)';
                        b.style.color = 'white';
                        b.classList.remove('active');
                    });
                    btn.style.background = 'var(--accent-gold)';
                    btn.style.color = '#000';
                    btn.classList.add('active');

                    // Scroll to top of explorer if needed
                    document.querySelector('.channel-nav-sticky').scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            </script>

            <style>
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .channel-tab:hover:not(.active) { background: rgba(255,255,255,0.2) !important; }
                .channel-custom-html img, .channel-custom-html video { max-width: 100%; height: auto; display: block; margin: 15px auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            </style>
        `;
    }

    // 2. Metadata & Highlighting
    let cleanTitle = p.title.replace(/\{.*?\}/g, '').trim();
    let displayTitle = cleanTitle;
    let statusText = p.status || 'Activo';
    let statusEmoji = '🟢';
    
    if (p.title.includes('🟠') || p.title.includes('🟡')) { statusEmoji = '🟠'; statusText = 'En redacción'; }
    else if (p.title.includes('🔴')) { statusEmoji = '🔴'; statusText = 'En proceso'; }

    if (highlightText) {
        const regex = new RegExp(`(?<!<[^>]*>)(${highlightText})`, 'gi');
        content = content.replace(regex, '<span class="highlight">$1</span>');
        displayTitle = displayTitle.replace(new RegExp(`(${highlightText})`, 'gi'), '<span class="highlight">$1</span>');
    }

    // 3. Main Render Template
    mainColumn.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <div class="back-btn" onclick="goBack()" style="margin-bottom: 0;"><i class="fas fa-arrow-left"></i> Volver</div>
            <div class="share-btn" onclick="copyProtocolLink('${pId.replace(/'/g, "\\'")}')" style="cursor: pointer; font-size: 0.85rem; color: var(--accent-blue); font-weight: 600;">
                <i class="fas fa-share-alt"></i> Compartir
            </div>
        </div>

        <article class="protocol-full animate-fade-in" style="background: white; padding: 2rem; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
            <header style="text-align: center; margin-bottom: 3rem; border-bottom: 1px solid #eee; padding-bottom: 2rem;">
                <h1 style="color: #032d4b; font-size: 2.2rem; margin-bottom: 1rem;">${displayTitle}</h1>
                <div style="display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 1rem; color: #666; font-size: 0.85rem;">
                    <span><i class="fas fa-calendar-alt"></i> Última actualización: ${formatDate(p.updated || p.published)}</span>
                    <span style="color: #ddd;">|</span>
                    <span>${statusEmoji} ${statusText}</span>
                    <span style="color: #ddd;">|</span>
                    <span><i class="fas fa-hotel"></i> ${p.source || 'General'}</span>
                    ${p.section ? `<span style="color: #ddd;">|</span><span><i class="fas fa-folder"></i> Sección ${p.section}</span>` : ''}
                </div>
            </header>

            <div class="protocol-full-body" style="font-size: 1.05rem; line-height: 1.7; color: #333;">
                ${content}
            </div>

            <footer style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #eee; font-size: 0.8rem; color: #999; text-align: justify; font-style: italic;">
                <p><i class="fas fa-info-circle"></i> Documento de uso interno. Queda prohibida la reproducción o difusión no autorizada de este protocolo.</p>
            </footer>
        </article>
        
        <div id="comments-section-container"></div>
    `;

    // 4. Cleanup & Interactive Elements
    // Scripts evaluation - Wrapped in IIFE to avoid global namespace collisions (e.g. STORAGE_NS)
    mainColumn.querySelectorAll('script').forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        // Use an IIFE and a generic block scope to isolate constants/lets
        newScript.textContent = `(function(){\n${oldScript.textContent}\n})();`;
        oldScript.parentNode.replaceChild(newScript, oldScript);
    });

    // Remove floating navigation bars from content
    mainColumn.querySelectorAll('nav.fixed, .fixed.top-1\\/2, .floating-nav').forEach(el => el.remove());

    // Setup internal links
    mainColumn.querySelectorAll('.protocol-full-body a').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        if (href.startsWith('#') && !href.includes('/') && href.length > 1) {
            link.onclick = (e) => {
                e.preventDefault();
                const target = document.getElementById(href.slice(1));
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };
        } else if (href.startsWith('#section/')) {
            link.classList.add('internal-link');
            link.onclick = (e) => {
                e.preventDefault();
                const sId = href.split('/')[1];
                const target = protocols.find(pr => pr.section === sId);
                if (target) {
                    viewHistory.push({ type: 'protocol', payload: target });
                    loadProtocol(target);
                }
            };
        } else if (href.startsWith('http')) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });

    // 5. Final positioning
    if (highlightText) {
        setTimeout(() => {
            const firstHighlight = mainColumn.querySelector('.highlight');
            if (firstHighlight) {
                firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 500);
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    setTimeout(() => {
        if (typeof renderComments === 'function') renderComments(pId);
    }, 100);
}


function goBack() {
    // Pop current view
    if (viewHistory.length > 1) {
        viewHistory.pop(); 
    }
    
    // Get previous view
    const prevView = viewHistory[viewHistory.length - 1];
    
    if (prevView.type === 'home') {
        renderHome();
    } else if (prevView.type === 'guide') {
        renderOperationalGuide();
    } else if (prevView.type === 'category') {
        renderCategory(prevView.name, prevView.id);
    } else if (prevView.type === 'search') {
        handleSearch(prevView.query, false); // false to avoid stack push again
    } else if (prevView.type === 'alerts') {
        renderAlertsList(prevView.category);
    } else {
        renderHome();
    }
}

// Interactive Schema (Operational Guide)
function renderOperationalGuide() {
    toggleHomeComponents(false);
    document.querySelector('.app-wrapper').classList.add('reading-mode');
    const CAT_MAP = getCatMap();
    
    mainColumn.innerHTML = `
        <div class="back-btn" onclick="goBack()"><i class="fas fa-arrow-left"></i> Volver</div>
        <h2 class="section-title"><i class="fas fa-map-signs"></i> Esquema Interactivo - Guía Operativa</h2>
        <div class="guide-container" id="guide-container"></div>
        ${getLegalFooterHtml()}
    `;

    const container = document.getElementById('guide-container');
    const categories = Object.keys(CAT_MAP).sort((a, b) => parseInt(a) - parseInt(b));

    // Descriptions map (as seen in user screenshot)
    const SECTION_DESCS = {
        '1': 'Primeros pasos y acceso directo a los apartados esenciales del manual.',
        '2': 'Turnos, tareas comunes y operativa del día a día en recepción.',
        '3': 'Todo lo relacionado con la gestión de reservas, tarifas (individuales y grupos), canales online, revisión y control.',
        '4': 'Procedimientos específicos para la gestión de reservas de grupos y eventos.',
        '5': 'Protocolos de comunicación entre departamentos y coordinación interna.',
        '6': 'Manuales de seguridad, emergencias y evacuación del hotel.',
        '7': 'Guías de uso de sistemas, plataformas informáticas y herramientas digitales.',
        '8': 'Manuales básicos de consulta rápida para operativa general.',
        '9': 'Gestión de personal, cuadrantes, vacaciones y solicitudes.',
        '10': 'Protocolos de servicios de Spa, Piscina y Bienestar.',
        '11': 'Comunicados oficiales y noticias de interés para el equipo.',
        '12': 'Coordinación con el Restaurante y gestión de consumos.'
    };

    categories.forEach(catId => {
        const cat = CAT_MAP[catId];
        const sectionProtocols = protocols.filter(p => p.section && p.section.startsWith(catId + '.'));
        
        // Natural sort for protocols (e.g., 3.1 before 3.1.1)
        sectionProtocols.sort((a, b) => a.section.localeCompare(b.section, undefined, { numeric: true }));

        const sectionEl = document.createElement('div');
        sectionEl.className = 'guide-section';
        
        const description = cat.description || SECTION_DESCS[catId] || `Protocolos y procedimientos relativos a ${cat.name}.`;

        let protocolsHtml = '';
        sectionProtocols.forEach(p => {
            const isSubItem = p.section.split('.').length > 2;
            
            // 1. Check for Status
            let statusBadge = '';
            let emoji = '🟢';
            let className = 'guide-status-active';
            let text = 'Activo';

            if (p.status) {
                text = p.status;
                if (text === 'En redacción') { className = 'guide-status-draft'; emoji = '🟠'; }
                else if (text === 'En proceso') { className = 'guide-status-process'; emoji = '🔴'; }
                statusBadge = `<span class="guide-status-badge ${className}">${emoji} ${text}</span>`;
            } else if (p.title.match(/\{([\u0000-\uFFFF\uD800-\uDBFF\uDC00-\uDFFF]+?)\}/)) {
                // Legacy support for emoji brackets
                const statusMatch = p.title.match(/\{([\u0000-\uFFFF\uD800-\uDBFF\uDC00-\uDFFF]+?)\}/);
                emoji = statusMatch[1];
                if (emoji === '🟠' || emoji === '🟡') { className = 'guide-status-draft'; text = 'En redacción'; }
                else if (emoji === '🔴') { className = 'guide-status-process'; text = 'En proceso'; }
                statusBadge = `<span class="guide-status-badge ${className}">${emoji} ${text}</span>`;
            }

            // 2. Check for Source (Hotel)
            let sourceBadge = '';
            if (p.source && p.source !== 'Ambos hoteles' && p.source !== 'General') {
                let sColor = '#0a6aa1'; let sBg = '#eff6ff';
                if (p.source === 'Sercotel Guadiana') { sColor = '#c0392b'; sBg = '#fdf2e9'; }
                else if (p.source.includes('Cumbria')) { sColor = '#0b6623'; sBg = '#e9f7ef'; }
                
                sourceBadge = `<span style="margin-left: 10px; font-size: 0.65rem; padding: 3px 7px; border-radius: 6px; background: ${sBg}; color: ${sColor}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid ${sColor}40; display: inline-flex; align-items: center; gap: 4px; opacity: 0.9;">
                    <i class="fas fa-building"></i> ${p.source}
                </span>`;
            } else if (p.source === 'Ambos hoteles') {
                sourceBadge = `<span style="margin-left: 10px; font-size: 0.65rem; padding: 3px 7px; border-radius: 6px; background: #f3f4f6; color: #4b5563; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #d1d5db; display: inline-flex; align-items: center; gap: 4px; opacity: 0.8;">
                    <i class="fas fa-city"></i> Ambos Hoteles
                </span>`;
            }

            const cleanTitle = p.title.replace(/\{.*?\}/, '').trim();
            const iconHtml = cat.icon.startsWith('http') || cat.icon.startsWith('assets/')
                ? `<img src="${cat.icon}" style="width: 16px; height: 16px; object-fit: contain;">`
                : `<i class="fas ${cat.icon}" style="font-size: 0.9rem; opacity: 0.7;"></i>`;

            protocolsHtml += `
                <div class="guide-item ${isSubItem ? 'sub-item' : ''}" onclick="window.loadProtocolById('${p.section}')">
                    <div class="guide-item-info" style="display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
                        ${iconHtml}
                        <span class="guide-number">${p.section}</span>
                        <span class="guide-protocol-title" style="margin-right: 5px;">${cleanTitle}</span>
                        ${sourceBadge}
                    </div>
                    ${statusBadge ? `<div style="flex-shrink:0;">${statusBadge}</div>` : ''}
                </div>
            `;
        });

        sectionEl.innerHTML = `
            <div class="guide-section-header" onclick="this.parentElement.classList.toggle('collapsed')">
                <div class="guide-section-title">
                    <i class="fas ${cat.icon.startsWith('http') ? 'fa-folder' : cat.icon}"></i>
                    ${catId}. ${cat.name}
                </div>
                <i class="fas fa-chevron-down guide-chevron"></i>
            </div>
            <div class="guide-content">
                <div class="guide-section-desc">${description}</div>
                <div class="guide-items-list">
                    ${protocolsHtml || '<div style="padding: 1rem; color: #999; font-style: italic;">No hay protocolos registrados en esta sección.</div>'}
                </div>
            </div>
        `;

        container.appendChild(sectionEl);
    });

    // Handle clicks to open protocols
    window.loadProtocolById = (sectionId) => {
        const p = protocols.find(item => item.section === sectionId);
        if (p) {
            viewHistory.push({ type: 'protocol', payload: p });
            loadProtocol(p);
        }
    };
}

function handleSearch(query, pushHistory = true) {
    if (!query) return;
    
    document.querySelector('.app-wrapper').classList.remove('reading-mode');

    if (pushHistory) {
        viewHistory.push({ type: 'search', query: query });
    }

    // Instead of renderHome(), we clear and build a dedicated results view
    toggleHomeComponents(false);
    mainColumn.innerHTML = `
        <div class="back-btn" onclick="goBack()"><i class="fas fa-arrow-left"></i> Volver al Inicio</div>
        <h2 class="section-title"><i class="fas fa-search"></i> Resultados de búsqueda: "${query}"</h2>
        <div id="posts-list" class="recent-posts-grid"></div>
        ${getLegalFooterHtml()}
    `;
    
    const list = document.getElementById('posts-list');
    
    // Search in protocols
    const protocolResults = protocols.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) || 
        stripHtml(p.content).toLowerCase().includes(query.toLowerCase()) ||
        (p.section && p.section.toLowerCase().includes(query.toLowerCase()))
    );

    // Search in channels
    let channelResults = [];
    if (typeof channels_config !== 'undefined') {
        channelResults = channels_config.filter(c => 
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            (c.summary && c.summary.toLowerCase().includes(query.toLowerCase())) ||
            (c.content && c.content.toLowerCase().includes(query.toLowerCase()))
        ).map(c => ({
            ...c,
            title: `[Canal] ${c.name}`,
            section: 'Canales de Venta',
            isChannel: true
        }));
    }

    const allResults = [...protocolResults, ...channelResults];
    
    renderList(allResults, list, { highlightText: query });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function stripHtml(html) {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    
    // Remove style and script tags so their content doesn't appear in excerpts
    const styles = tmp.querySelectorAll('style, script');
    styles.forEach(s => s.remove());
    
    return tmp.textContent || tmp.innerText || "";
}

function renderSidebar() {
    if (typeof home_config === 'undefined') return;

    // 1. Update Alert Counts if elements exist
    const btnCritical = document.getElementById('btn-critical-errors');
    const btnAnnouncements = document.getElementById('btn-announcements');

    if (btnCritical && home_config.alerts?.critical_errors?.items) {
        const count = home_config.alerts.critical_errors.items.length;
        if (count > 0) {
            btnCritical.innerHTML = `<i class="fas fa-exclamation-circle"></i> Errores Críticos <span class="badge">${count}</span>`;
        }
    }

    if (btnAnnouncements && home_config.alerts?.announcements?.items) {
        const count = home_config.alerts.announcements.items.length;
        if (count > 0) {
            btnAnnouncements.innerHTML = `<i class="fas fa-bullhorn"></i> Comunicados <span class="badge">${count}</span>`;
        }
    }

    // 2. Featured News Widget (Check if we need to inject it)
    const sidebar = document.querySelector('.sidebar-col');
    if (sidebar && home_config.featured_news && home_config.featured_news.length > 0) {
        // Find or create news widget
        let newsWidget = document.getElementById('news-widget');
        if (!newsWidget) {
            newsWidget = document.createElement('div');
            newsWidget.id = 'news-widget';
            newsWidget.className = 'sidebar-widget';
            // Insert before graphic box if possible
            const graphicBox = sidebar.querySelector('.graphic-box');
            if (graphicBox) sidebar.insertBefore(newsWidget, graphicBox);
            else sidebar.appendChild(newsWidget);
        }

        let newsHtml = `<h3 class="widget-title"><i class="fas fa-newspaper"></i> NOTICIAS DESTACADAS</h3><ul class="news-list" style="list-style:none; padding:0; margin:0;">`;
        home_config.featured_news.forEach(news => {
            newsHtml += `
                <li style="margin-bottom:10px; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:8px;">
                    <a href="${news.link || '#'}" ${news.link ? 'target="_blank"' : ''} style="text-decoration:none; color:inherit; font-weight:500; font-size:0.9rem; display:block;">
                        <i class="fas fa-chevron-right" style="font-size:0.7rem; color:var(--accent); margin-right:5px;"></i> ${news.text}
                    </a>
                </li>`;
        });
        newsHtml += `</ul>`;
        newsWidget.innerHTML = newsHtml;
    }

    // 3. Graphic Box Widget
    const graphicBox = document.querySelector('.graphic-box');
    if (graphicBox && home_config.graphic_box) {
        let boxHtml = `<h5>${home_config.graphic_box.title || ''}</h5>`;
        if (home_config.graphic_box.lines) {
            home_config.graphic_box.lines.forEach(line => {
                const text = typeof line === 'string' ? line : line.text;
                const highlight = typeof line === 'string' ? false : line.highlight;
                boxHtml += `<p style="${highlight ? 'font-weight:bold; color:var(--primary);' : ''}">${text}</p>`;
            });
        }
        if (home_config.graphic_box.custom_html) {
            boxHtml += `<div class="custom-graphic-html" style="margin-top:10px; font-size: 0.85rem;">${home_config.graphic_box.custom_html}</div>`;
        }
        graphicBox.innerHTML = boxHtml;
    }
}

function renderAlertsList(type) {
    if (typeof home_config === 'undefined' || !home_config.alerts || !home_config.alerts[type]) {
        console.error('Alert configuration not found');
        return;
    }

    const alertConfig = home_config.alerts[type];
    document.querySelector('.app-wrapper').classList.add('reading-mode');

    // Premium header
    const accentColor = type === 'critical_errors' ? '#ef4444' : '#0ea5e9';
    const bgColor = type === 'critical_errors' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(14, 165, 233, 0.05)';

    mainColumn.innerHTML = `
        <div class="back-btn" onclick="goBack()" style="margin-bottom: 2rem;"><i class="fas fa-arrow-left"></i> Volver</div>
        
        <div style="background: ${bgColor}; border: 1px solid ${accentColor}33; padding: 2.5rem; border-radius: 24px; margin-bottom: 2.5rem; border-left: 8px solid ${accentColor};">
            <div style="color: ${accentColor}; font-size: 2.5rem; margin-bottom: 1rem;">
                <i class="fas ${alertConfig.icon || 'fa-bell'}"></i>
            </div>
            <h2 style="font-size: 2.2rem; color: #0f172a; margin: 0; font-family: 'Outfit', sans-serif; font-weight: 800;">${alertConfig.title || 'Comunicados'}</h2>
            <p style="color: #64748b; margin-top: 0.5rem; font-size: 1.1rem;">Últimas notificaciones y avisos importantes para la recepción.</p>
        </div>

        <div id="posts-list" class="alerts-list" style="display: grid; gap: 1.2rem;"></div>
    `;

    const listContainer = document.getElementById('posts-list');
    
    if (!alertConfig.items || alertConfig.items.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 4rem; background: #f8fafc; border-radius: 20px; border: 2px dashed #e2e8f0; color: #94a3b8;">
                <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <p style="font-size: 1.1rem; font-weight: 500;">No hay alertas activas en este momento.</p>
            </div>
        `;
        return;
    }

    alertConfig.items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'post-item alert-item premium-shadow';
        
        // Determinate hotel by text or ID (heuristic)
        let hotelTag = '';
        if (item.title.includes('Guadiana') || (item.id && item.id.startsWith('G'))) {
            hotelTag = '<span style="background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase;">Guadiana</span>';
        } else if (item.title.includes('Cumbria') || (item.id && item.id.startsWith('C'))) {
            hotelTag = '<span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase;">Cumbria</span>';
        }

        itemEl.style = `
            background: white; 
            padding: 1.5rem; 
            border-radius: 18px; 
            cursor: pointer; 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid #eef2f6;
            display: flex;
            flex-direction: column;
            gap: 12px;
            position: relative;
            overflow: hidden;
        `;
        
        itemEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="display: flex; align-items: center; gap: 10px; color: #94a3b8; font-size: 0.75rem; font-weight: 600;">
                    <span><i class="far fa-calendar-alt"></i> ${item.date}</span>
                    ${item.id ? `<span style="color: #e2e8f0;">|</span><span><i class="fas fa-hashtag"></i> ID ${item.id}</span>` : ''}
                </div>
                ${hotelTag}
            </div>
            <h3 style="margin: 0; font-size: 1.15rem; color: #1e293b; font-weight: 700; line-height: 1.4;">${item.title}</h3>
            <div style="margin-top: 4px; display: flex; align-items: center; color: ${accentColor}; font-size: 0.8rem; font-weight: 700; gap: 6px;">
                <span>Leer más</span> <i class="fas fa-arrow-right"></i>
            </div>
            <div style="position: absolute; right: -10px; bottom: -10px; font-size: 4rem; opacity: 0.03; color: ${accentColor}; transform: rotate(-15deg);">
                <i class="fas ${alertConfig.icon || 'fa-bell'}"></i>
            </div>
        `;
        
        itemEl.onmouseenter = () => {
            itemEl.style.transform = 'translateY(-4px) scale(1.01)';
            itemEl.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)';
            itemEl.style.borderColor = accentColor + '33';
        };
        itemEl.onmouseleave = () => {
            itemEl.style.transform = 'none';
            itemEl.style.boxShadow = 'none';
            itemEl.style.borderColor = '#eef2f6';
        };

        itemEl.addEventListener('click', () => {
            if (item.id) {
                const protocol = protocols.find(p => String(p.section) === String(item.id));
                if (protocol) {
                    viewHistory.push({ type: 'protocol', payload: protocol });
                    loadProtocol(protocol);
                } else {
                    handleSearch(item.title);
                }
            } else {
                handleSearch(item.title);
            }
        });
        
        listContainer.appendChild(itemEl);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    viewHistory.push({ type: 'alerts', category: type });
}

function formatDate(dateStr) {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}
// Helper for Hash-based routing
function handleHashRouting() {
    const hash = window.location.hash.slice(1);
    if (!hash) {
        if (viewHistory.length > 1 && viewHistory[viewHistory.length - 1].type !== 'home') {
            viewHistory = [{ type: 'home' }];
            renderHome();
        }
        return;
    }

    if (hash.startsWith('protocol/')) {
        const pId = decodeURIComponent(hash.replace('protocol/', ''));
        const p = protocols.find(item => item.section === pId || item.title === pId);
        if (p) {
            viewHistory.push({ type: 'protocol', payload: p });
            loadProtocol(p);
        }
    } else if (hash.startsWith('category/')) {
        const id = hash.replace('category/', '');
        const CAT_MAP = getCatMap();
        if (CAT_MAP[id]) {
            viewHistory.push({ type: 'category', id, name: CAT_MAP[id].name });
            renderCategory(CAT_MAP[id].name, id);
        }
    }
}

// Share function
function copyProtocolLink(pId) {
    const url = `${window.location.origin}${window.location.pathname}#protocol/${encodeURIComponent(pId)}`;
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.querySelector('.share-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> ¡Copiado!';
        btn.style.color = '#27ae60';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.color = '';
        }, 2000);
    });
}

// Unified Comment Submission: API if local, Email if static/public
async function submitComment(pId) {
    const authorEl = document.getElementById('comment-author');
    const textEl = document.getElementById('comment-text');
    const author = authorEl.value;
    const text = textEl.value;
    
    if (!author || !text) {
        alert('Por favor, completa tu nombre y el comentario.');
        return;
    }
    
    const p = protocols.find(item => (item.section || item.title) === pId);
    const pTitle = p ? p.title : pId;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocal) {
        // Try the server API
        try {
            const response = await fetch('/api/comments/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pId, pTitle, author, text })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    alert('¡Recibido! Tu comentario ha sido enviado al servidor local y se ha preparado un aviso para administración. Será visible tras ser autorizado.');
                    authorEl.value = '';
                    textEl.value = '';
                    return;
                }
            }
        } catch (e) {
            console.warn('API local no disponible, procediendo a modo email.');
        }
    }

    // Public/Static Mode: Send via Email to communications team
    const mailTo = 'comunicaciones@hotelguadiana.es';
    const subject = encodeURIComponent(`COMENTARIO: ${pTitle}`);
    const body = encodeURIComponent(
        `NUEVO COMENTARIO EN PROTOCOLO\n` +
        `---------------------------------\n` +
        `Protocolo: ${pTitle} (${pId})\n` +
        `Autor/Trabajador: ${author}\n\n` +
        `Comentario:\n${text}\n\n` +
        `---------------------------------\n` +
        `Nota: El administrador registrará este comentario manualmente.`
    );

    const confirmEmail = confirm('Estás en la versión online del manual. Para procesar este comentario, se abrirá tu gestor de correo para enviarlo a Administración. ¿Continuar?');
    
    if (confirmEmail) {
        // First try silent Cloud Posting (Option B)
        try {
            const targetUrl = new URL(CLOUD_GATEWAY_URL);
            targetUrl.searchParams.append('pId', "ID-" + String(pId));
            targetUrl.searchParams.append('pTitle', String(pTitle));
            targetUrl.searchParams.append('author', String(author));
            targetUrl.searchParams.append('text', String(text));

            const cloudResponse = await fetch(targetUrl.toString(), {
                method: 'GET',
                mode: 'no-cors'
            });
            alert('¡Enviado directamente! Tu comentario ha sido registrado en la base de datos de la nube y administración ha recibido un aviso. Aparecerá una vez autorizado.');
            authorEl.value = '';
            textEl.value = '';
            return;
        } catch (e) {
            console.error('Error en Cloud Gateway, usando mailto:', e);
            window.location.href = `mailto:${mailTo}?subject=${subject}&body=${body}`;
            authorEl.value = '';
            textEl.value = '';
            alert('Gracias. Por favor, asegúrate de enviar el correo que se ha generado.');
        }
    }
}

function renderComments(pId) {
    const container = document.getElementById(`comments-container-${pId}`);
    if (!container) return;
    
    // Check if we have public comments loaded from comments.js
    if (typeof comments_data === 'undefined' || !Array.isArray(comments_data)) {
        return;
    }
    
    // Robust identifier matching (trimmed strings)
    const normalizedId = String(pId).trim();
    const safeId = "ID-" + normalizedId; // Check for our safe prefix
    
    const filteredComments = comments_data.filter(c => {
        const cId = c.pId ? String(c.pId).trim() : "";
        return cId === normalizedId || cId === safeId || (c.pTitle && String(c.pTitle).trim() === normalizedId);
    });
    
    if (filteredComments.length === 0) {
        // We keep the "No comments" placeholder
        return;
    }
    
    container.innerHTML = filteredComments.map(c => `
        <div class="comment-item" style="background: white; padding: 1.2rem; border-radius: 12px; border: 1px solid #eee; margin-bottom: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.03); animation: fadeIn 0.4s ease;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.8rem; align-items: center;">
                <strong style="color: var(--accent-blue); font-size: 1rem;"><i class="fas fa-user-circle"></i> ${c.author}</strong>
                <span style="font-size: 0.75rem; color: #999; background: #f8f9fa; padding: 2px 8px; border-radius: 4px;">${new Date(c.date).toLocaleString()}</span>
            </div>
            <div style="font-size: 0.95rem; color: #444; line-height: 1.5;">${c.text}</div>
            
            ${c.reply ? `
                <div class="admin-reply" style="margin-top: 15px; padding: 12px 15px; background: #f1f8ff; border-left: 4px solid #0a6aa1; border-radius: 0 8px 8px 0; font-size: 0.9rem;">
                    <div style="font-weight: 800; color: #032d4b; margin-bottom: 5px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                        <i class="fas fa-reply-all"></i> Respuesta de Administración:
                    </div>
                    <div style="color: #455a64; font-style: italic;">"${c.reply}"</div>
                </div>
            ` : ''}
        </div>
    `).join('');
}



function getLegalFooterHtml() {
    return `
        <footer class="protocol-legal-footer" style="margin-top: 4rem; padding: 2rem 1rem; border-top: 1px solid #ddd; color: #999; font-size: 0.75rem; line-height: 1.6; text-align: center; font-style: italic; width: 100%; box-sizing: border-box;">
            <div style="max-width: 800px; margin: 0 auto;">
                <p>
                    <i class="fas fa-shield-alt" style="margin-right: 5px; opacity: 0.5;"></i>
                    Esta página es de uso exclusivo del personal autorizado de <strong>Sercotel Guadiana y Cumbria Spa & Hotel</strong>. 
                    Queda estrictamente prohibido el acceso, uso, reproducción o difusión de su contenido por parte de personas no autorizadas. 
                    El incumplimiento de esta norma podrá dar lugar a las responsabilidades legales correspondientes.
                </p>
                <p style="margin-top: 10px; opacity: 0.6; font-size: 0.7rem;">&copy; ${new Date().getFullYear()} Gestión Documental de Recepción</p>
            </div>
        </footer>
    `;
}

/* --- CHATBOT LOGIC --- */

// ============================================================
// CONVERSATION MEMORY — Allows the AI to remember context
// ============================================================
const chatMemory = {
    messages: [],  // {role: 'user'|'model', text: '...'}
    maxHistory: 8, // Keep last N exchanges
    
    add(role, text) {
        this.messages.push({ role, text: text.substring(0, 500) });
        if (this.messages.length > this.maxHistory * 2) {
            this.messages = this.messages.slice(-this.maxHistory * 2);
        }
    },
    
    getHistory() {
        return this.messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));
    },
    
    clear() { this.messages = []; }
};

function initChatbot() {
    const trigger = document.getElementById('chatbot-trigger');
    const container = document.getElementById('chatbot-container');
    const closeBtn = document.getElementById('close-chatbot');
    const sendBtn = document.getElementById('send-chatbot-msg');
    const input = document.getElementById('chatbot-input');

    if (!trigger || !container) return;

    trigger.onclick = () => {
        container.style.display = container.style.display === 'flex' ? 'none' : 'flex';
        if (container.style.display === 'flex') input.focus();
    };

    closeBtn.onclick = () => {
        container.style.display = 'none';
    };

    sendBtn.onclick = processChatInput;
    input.onkeypress = (e) => {
        if (e.key === 'Enter') processChatInput();
    };
}

function appendChatMessage(sender, text, isLink = false) {
    const messagesContainer = document.getElementById('chatbot-messages');
    if (!messagesContainer) return;

    // Remove typing indicator if it exists
    const typing = messagesContainer.querySelector('.typing');
    if (typing) typing.remove();

    const msgDiv = document.createElement('div');
    msgDiv.className = sender === 'user' ? 'user-message' : 'bot-message';
    
    if (isLink) {
        msgDiv.innerHTML = text;
    } else {
        msgDiv.textContent = text;
    }
    
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatbot-messages');
    if (!messagesContainer) return;
    
    if (messagesContainer.querySelector('.typing')) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function processChatInput() {
    const input = document.getElementById('chatbot-input');
    const text = input.value.trim();
    if (!text) return;

    appendChatMessage('user', text);
    input.value = '';

    showTypingIndicator();
    
    // Shorter delay for AI mode — it already has network latency
    const hasKey = typeof cloud_config !== 'undefined' && cloud_config.geminiApiKey && cloud_config.geminiApiKey.length > 10;
    const delay = hasKey ? 300 : Math.max(800, Math.min(2000, text.length * 15));
    setTimeout(() => {
        generateBotResponse(text);
    }, delay);
}

function getExcerpt(html, maxLength = 120) {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove style and script tags to avoid garbage in snippets
    const styles = temp.querySelectorAll('style, script');
    styles.forEach(s => s.remove());
    
    const text = temp.textContent || temp.innerText || '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Extract key bullet points from protocol HTML for a meaningful summary
function getKeyPoints(html, maxPoints = 3) {
    if (!html) return null;
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Clean CSS/Scripts
    const styles = temp.querySelectorAll('style, script');
    styles.forEach(s => s.remove());
    
    // Try <li> items first
    const items = Array.from(temp.querySelectorAll('li'))
        .map(li => li.textContent.trim())
        .filter(t => t.length > 5 && t.length < 200)
        .slice(0, maxPoints);
    
    if (items.length > 0) return items;
    
    // Fallback: first non-empty paragraphs
    const paras = Array.from(temp.querySelectorAll('p'))
        .map(p => p.textContent.trim())
        .filter(t => t.length > 10)
        .slice(0, maxPoints);
    
    return paras.length > 0 ? paras : null;
}

// Extract sentences from protocol that contain the search terms, with highlights
function getContextSnippets(html, searchTerms, maxSnippets = 3) {
    if (!html || !searchTerms || searchTerms.length === 0) return null;
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Clean CSS/Scripts
    const styles = temp.querySelectorAll('style, script');
    styles.forEach(s => s.remove());
    
    const fullText = temp.textContent || temp.innerText || '';
    
    // Split into sentences (by . ; : or newline)
    const rawSentences = fullText
        .replace(/\n+/g, ' ')
        .split(/(?<=[.;:\n])\s+|\n/)
        .map(s => s.trim())
        .filter(s => s.length > 15 && s.length < 300);
    
    const results = [];
    const usedSentences = new Set();
    
    // For each search term, find sentences that contain it
    for (const term of searchTerms) {
        if (term.length < 3) continue;
        for (const sentence of rawSentences) {
            if (results.length >= maxSnippets) break;
            if (usedSentences.has(sentence)) continue;
            if (sentence.toLowerCase().includes(term.toLowerCase())) {
                // Highlight all matching terms within the sentence
                let highlighted = sentence;
                searchTerms.forEach(t => {
                    if (t.length < 3) return;
                    try {
                        const regex = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                        highlighted = highlighted.replace(regex, '<mark style="background:#fff3cd; color:#c67c00; border-radius:3px; padding:0 3px; font-weight:800; border-bottom:1px solid #f90;">$1</mark>');
                    } catch(e) {}
                });
                results.push(highlighted);
                usedSentences.add(sentence);
            }
        }
        if (results.length >= maxSnippets) break;
    }
    
    return results.length > 0 ? results : null;
}

async function generateBotResponse(userInput) {
    const input = userInput.toLowerCase();
    
    // ============================================================
    // EXPANDED SYNONYM MAP — Covers hotel-specific terminology
    // ============================================================
    const synonymMap = {
        'wifi': ['internet', 'red', 'clave', 'conexion', 'contraseña'],
        'pms': ['tesipro', 'sistema', 'programa', 'software'],
        'hab': ['habitacion', 'alojamiento', 'cuarto', 'room'],
        'copia': ['duplicado', 'clonar'],
        'qr': ['codigo', 'digital'],
        'factura': ['ticket', 'pago', 'cobro', 'invoice', 'facturacion', 'facturar'],
        'menor': ['menores', 'niño', 'niña', 'hijo', '14', 'grupo'],
        'dni': ['documento', 'identidad', 'pasaporte', 'ses', 'hospedajes'],
        'booking': ['vcc', 'booking.com'],
        'expedia': ['collect', 'hotel collect'],
        'ota': ['online travel agency', 'canal', 'canales'],
        'synxis': ['sercotel', 'motor', 'directas', 'roiback'],
        'agencia': ['credito', 'bono', 'comision', 'keytel', 'hotelbeds', 'avoris', 'nautalia'],
        'checkin': ['check-in', 'registro', 'llegada', 'entrada'],
        'checkout': ['check-out', 'salida', 'caja'],
        'caja': ['efectivo', 'deposito', 'cuadre', 'fondo', 'dinero'],
        'turno': ['noche', 'mañana', 'tarde', 'auditor'],
        'soulguest': ['soul', 'guest', 'enlace', 'link', 'precheckin', 'online'],
        'reserva': ['reservas', 'entran', 'entra', 'llegan', 'descarga'],
        'cancelacion': ['cancelar', 'anular', 'noshow', 'no-show'],
        'tarifa': ['precio', 'rate', 'nrf', 'bar', 'descuento']
    };

    // FILTER FILLER WORDS
    const fillers = ['de', 'el', 'la', 'los', 'las', 'un', 'una', 'con', 'para', 'por', 'que', 'como', 'en', 'es', 'se', 'del', 'al', 'hay', 'son', 'qué', 'cómo', 'cuál'];
    const words = input.split(/\s+/).filter(w => w.length > 1 && !fillers.includes(w));

    let searchTerms = [input, ...words];
    for (const [key, values] of Object.entries(synonymMap)) {
        if (words.some(w => w.includes(key) || key.includes(w))) {
            searchTerms = [...searchTerms, key, ...values];
        }
    }
    // Deduplicate
    searchTerms = [...new Set(searchTerms)];
    
    // ============================================================
    // GREETINGS — Friendly welcome
    // ============================================================
    const greetings = ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'ey', 'saludos', 'ayuda', 'buenas', 'hey'];
    const isGreeting = greetings.some(g => words.includes(g) || input === g);
    
    if (isGreeting && words.length <= 3) {
        const hour = new Date().getHours();
        const saludo = hour < 14 ? '¡Buenos días' : hour < 21 ? '¡Buenas tardes' : '¡Buenas noches';
        appendChatMessage('bot', `${saludo}! 👋 Soy tu formador virtual de recepción. Pregúntame lo que necesites: procedimientos de check-in, cómo funcionan los canales (Booking, Expedia...), facturación, gestión de caja, grupos, y mucho más. Estoy aquí para enseñarte paso a paso.`, true);
        renderQuickReplies();
        return;
    }

    // Thanks — Fixed false positive for 'booking' containing 'ok'
    const thanks = ['gracias', 'perfecto', 'genial', 'vale', 'ok', 'entendido', 'claro', 'guay', 'gracia', 'thanks'];
    const isThanks = thanks.some(t => words.includes(t) || input === t);
    
    if (isThanks && words.length <= 3) {
        appendChatMessage('bot', '¡De nada! 😊 Si tienes más dudas, aquí estoy. Recuerda que puedes preguntarme sobre cualquier procedimiento del manual.', true);
        return;
    }

    // Help / Capabilities
    const helpTerms = ['puedes hacer', 'como funcionas', 'quien eres', 'ayuda', 'ayudame', 'que haces', 'funciones'];
    if (helpTerms.some(h => input.includes(h))) {
        const helpMsg = `
            <div class="ai-response">
                <p>Soy tu <b>Formador IA</b> y puedo ayudarte con cualquier duda sobre los procedimientos del hotel. Estás son algunas cosas que puedes preguntarme:</p>
                <ul>
                    <li><b>Check-in / Check-out:</b> Cómo hacer registros, registros de menores, cierres de caja...</li>
                    <li><b>Canales de Venta:</b> Diferencias entre Booking, Expedia, Synxis, etc.</li>
                    <li><b>Facturación:</b> Cómo facturar a agencias, emitir tickets o gestionar duplicados.</li>
                    <li><b>Procedimientos Diarios:</b> Turnos, auditoría nocturna, arqueo de caja.</li>
                </ul>
                <p>💡 <i>Escribe tu duda y buscaré la respuesta paso a paso en el manual.</i></p>
            </div>
        `;
        appendChatMessage('bot', helpMsg, true);
        renderQuickReplies();
        return;
    }

    // ============================================================
    // SEARCH IN PROTOCOLS + CHANNELS
    // ============================================================
    const allProtocols = typeof protocols_data !== 'undefined' ? protocols_data : (typeof protocols !== 'undefined' ? protocols : []);
    const matches = allProtocols.map(p => {
        let score = 0;
        const title = (p.title || '').toLowerCase();
        const section = (p.section || '').toLowerCase();
        const content = (p.content || '').toLowerCase();
        const infoHtml = (p.info_html || '').toLowerCase();

        searchTerms.forEach(term => {
            if (term.length < 2) return;
            if (title.includes(term)) score += 500;
            if (section.includes(term)) score += 1000;
            if (content.includes(term)) score += 20;
            if (infoHtml.includes(term)) score += 10;
        });

        // Filter by hotel context
        const isMatchHotel = currentHotel === 'Ambos hoteles' || !p.source || p.source === 'Ambos hoteles' || p.source === 'General' || p.source === currentHotel;
        if (!isMatchHotel) score = 0;

        return { protocol: p, score, source: 'protocol' };
    }).filter(m => m.score > 0).sort((a,b) => b.score - a.score);

    const allChannels = typeof channels_config !== 'undefined' ? channels_config : [];
    const channelMatches = allChannels.map(ch => {
        let score = 0;
        const name = (ch.name || '').toLowerCase();
        const summary = (ch.summary || '').toLowerCase();
        const content = (ch.content || '').toLowerCase();
        const notes = (ch.notes || '').toLowerCase();
        const htmlContent = (ch.htmlContent || '').toLowerCase();

        searchTerms.forEach(term => {
            if (term.length < 2) return;
            if (name.includes(term)) score += 1000;
            if (summary.includes(term)) score += 200;
            if (content.includes(term)) score += 30;
            if (notes.includes(term)) score += 20;
            if (htmlContent.includes(term)) score += 10;
        });

        // Filter by hotel context
        const isMatchHotel = currentHotel === 'Ambos hoteles' || ch.hotel === 'Ambos hoteles' || ch.hotel === currentHotel;
        if (!isMatchHotel) score = 0;

        return {
            protocol: { title: ch.name, section: 'Canal: ' + ch.name, content: ch.content, info_html: ch.htmlContent },
            score, source: 'channel', channelData: ch
        };
    }).filter(m => m.score > 0).sort((a,b) => b.score - a.score);

    const allMatches = [...channelMatches, ...matches].sort((a,b) => b.score - a.score);

    console.log('[Chatbot] Pregunta:', userInput);
    console.log('[Chatbot] Top Matches:', allMatches.slice(0, 5).map(m => `${m.protocol.title} (${m.score})`));
    
    const hasGeminiKey = typeof cloud_config !== 'undefined' && cloud_config.geminiApiKey && cloud_config.geminiApiKey.length > 10;

    // ============================================================
    // GEMINI AI MODE — Professor-style intelligent answers
    // ============================================================
    if (hasGeminiKey) {
        try {
            // Build context from top documents
            let contextText = '';
            if (allMatches.length > 0) {
                const topScore = allMatches[0].score;
                // Only include documents that are relevant compared to the top result
                // (e.g. at least 15% of the top score) to avoid polluting the AI context
                const filteredMatches = allMatches.filter(m => m.score >= topScore * 0.15);
                
                filteredMatches.slice(0, 6).forEach((m, i) => {
                    const temp = document.createElement('div');
                    temp.innerHTML = m.protocol.info_html || m.protocol.content || '';
                    let text = temp.innerText || temp.textContent || '';
                    text = text.replace(/\s+/g, ' ').trim().substring(0, 3000);
                    const label = m.source === 'channel' ? '📡 CANAL DE VENTA' : '📋 PROTOCOLO';
                    contextText += `\n\n${label}: "${m.protocol.section || ''} - ${m.protocol.title || ''}"\n${text}`;
                });
            }

            // ============================================================
            // THE PROFESSOR SYSTEM PROMPT
            // ============================================================
            const systemPrompt = `Eres un FORMADOR EXPERTO de recepción hotelera para los hoteles Sercotel Guadiana y Cumbria Spa.
CONTEXTO ACTUAL: Estás enseñando en el hotel "${currentHotel}". Tus respuestas deben priorizar los procedimientos específicos de este hotel si existen.

REGLAS DE COMPORTAMIENTO:
1. EXPLICA como un profesor: no solo digas "qué hacer", explica "POR QUÉ" se hace así.
2. Usa un tono CERCANO pero PROFESIONAL. Tutea al recepcionista.
3. Estructura tus respuestas con claridad: usa títulos en negrita, listas numeradas para pasos, y viñetas para detalles.
4. Si la pregunta es sobre un procedimiento, da los PASOS CONCRETOS numerados (1, 2, 3...).
5. Añade CONSEJOS PRÁCTICOS al final cuando sea relevante (trucos, cosas que se olvidan, errores comunes).
6. Si la documentación no contiene la respuesta, dilo honestamente y sugiere a quién preguntar (recepción jefe, central Sercotel, etc).
7. NUNCA inventes procedimientos. Solo usa la documentación proporcionada.
8. Responde SIEMPRE en español.
9. Mantén las respuestas CONCISAS pero COMPLETAS (máximo 400 palabras).
10. Si tiene sentido, al final sugiere 1-2 preguntas relacionadas que el recepcionista podría querer hacer a continuación.

FORMATO DE RESPUESTA:
- Usa **negrita** para conceptos importantes
- Usa listas numeradas (1. 2. 3.) para pasos de procedimientos
- Usa viñetas (- ) para detalles o características
- Usa ⚠️ para advertencias críticas
- Usa 💡 para consejos prácticos
- Usa ✅ para confirmaciones

${contextText ? `DOCUMENTACIÓN INTERNA DISPONIBLE PARA ${currentHotel.toUpperCase()}:` + contextText : 'No he encontrado documentación interna relevante para esta consulta en este hotel.'}`;

            // Add to memory
            chatMemory.add('user', userInput);

            // Build conversation with history
            const contents = [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: 'Entendido. Soy el formador de recepción. Estoy listo para enseñar paso a paso usando la documentación oficial del hotel. ¿En qué puedo ayudarte?' }] },
                ...chatMemory.getHistory().slice(0, -1), // Previous history (exclude last user msg, we add it fresh)
                { role: 'user', parts: [{ text: userInput }] }
            ];

            console.log('[Chatbot] ➡️ Enviando a Gemini con', allMatches.length, 'docs de contexto y', chatMemory.messages.length, 'msgs de memoria');
            
            // Use the local server proxy to hide the API Key and avoid CORS/404 issues
            let response;
            let rawData;
            
            try {
                response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: contents,
                        generationConfig: {
                            temperature: 0.35,
                            maxOutputTokens: 1500,
                            topP: 0.9
                        },
                        safetySettings: [
                            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                        ]
                    })
                });

                const text = await response.text();
                try {
                    rawData = JSON.parse(text);
                } catch (e) {
                    console.error('[Chatbot] Servidor no devolvió JSON:', text.substring(0, 100));
                    if (response.status === 405 || response.status === 404) {
                        throw new Error('FALLBACK_TRIGGERED');
                    }
                    throw new Error('El servidor respondió con un error no válido.');
                }
                // Also trigger fallback if server returned 405/404
                if (response.status === 405 || response.status === 404) {
                    throw new Error('FALLBACK_TRIGGERED');
                }
            } catch (err) {
                if (err.message === 'FALLBACK_TRIGGERED' || err.message.includes('Failed to fetch')) {
                    // ============================================================
                    // FALLBACK: Google Apps Script Proxy (works from ANY browser)
                    // The API key is stored securely in Script Properties (never public)
                    // NOTE: Using text/plain to avoid CORS preflight (OPTIONS) which Apps Script blocks
                    // ============================================================
                    const scriptUrl = (typeof cloud_config !== 'undefined' && cloud_config.scriptUrl) ? cloud_config.scriptUrl : null;
                    if (scriptUrl) {
                        console.log('[Chatbot] Usando Google Apps Script como proxy de IA...');
                        const scriptRes = await fetch(scriptUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain' }, // text/plain avoids CORS preflight
                            body: JSON.stringify({
                                action: 'gemini_chat',
                                contents: contents,
                                generationConfig: { temperature: 0.35, maxOutputTokens: 1500, topP: 0.9 }
                            })
                        });
                        const scriptText = await scriptRes.text();
                        try {
                            rawData = JSON.parse(scriptText);
                        } catch(e) {
                            // Apps Script sometimes redirects to login — try direct as last resort
                            rawData = null;
                        }
                    }
                    
                    // Last resort: direct call if key is available in localStorage/cloud_config
                    if (!rawData && typeof cloud_config !== 'undefined' && cloud_config.geminiApiKey) {
                        console.warn('[Chatbot] Apps Script no disponible. Intentando llamada directa...');
                        const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${cloud_config.geminiApiKey}`;
                        const directRes = await fetch(directUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ contents: contents })
                        });
                        if (!directRes.ok) {
                            const errData = await directRes.json().catch(() => ({}));
                            throw new Error(errData.error?.message || `Error en llamada directa a Google (${directRes.status})`);
                        }
                        rawData = await directRes.json();
                    }
                    
                    if (!rawData) throw new Error('No hay conexión con el servicio de IA. Contacta al administrador.');
                } else {
                    throw err;
                }
            }
            
            if (rawData.error) throw new Error(rawData.error.message || 'Error en la API');
            if (!rawData.candidates || !rawData.candidates[0]) throw new Error('Respuesta vacía de la IA');
            
            let answerText = rawData.candidates[0].content.parts[0].text;
            
            // Save to memory
            chatMemory.add('model', answerText);

            // ============================================================
            // ENHANCED MARKDOWN → HTML CONVERSION
            // ============================================================
            let html = answerText;
            
            // Headers
            html = html.replace(/^### (.*?)$/gm, '<h4 style="font-size:0.88rem; font-weight:800; color:#0a6aa1; margin:12px 0 4px; text-transform:uppercase; letter-spacing:0.02em;">$1</h4>');
            html = html.replace(/^## (.*?)$/gm, '<h3 style="font-size:0.95rem; font-weight:800; color:#004a66; margin:14px 0 6px;">$1</h3>');
            
            // Bold and italic
            html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1a365d;">$1</strong>');
            html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
            
            // Numbered lists
            html = html.replace(/^(\d+)\.\s+(.*?)$/gm, '<div style="display:flex; gap:8px; margin:4px 0; align-items:flex-start;"><span style="background:#0a6aa1; color:white; min-width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:800; flex-shrink:0;">$1</span><span style="flex:1;">$2</span></div>');
            
            // Bullet points
            html = html.replace(/^[-•]\s+(.*?)$/gm, '<div style="display:flex; gap:8px; margin:3px 0 3px 8px; align-items:flex-start;"><span style="color:#0a6aa1; font-weight:800;">›</span><span style="flex:1;">$1</span></div>');
            
            // Warning/tip/check icons (already in text from the prompt)
            html = html.replace(/⚠️\s*(.*?)(?:\n|$)/g, '<div style="background:#fff8e1; border-left:3px solid #f59e0b; padding:6px 10px; border-radius:6px; margin:6px 0; font-size:0.82rem;">⚠️ $1</div>');
            html = html.replace(/💡\s*(.*?)(?:\n|$)/g, '<div style="background:#e8f5e9; border-left:3px solid #4caf50; padding:6px 10px; border-radius:6px; margin:6px 0; font-size:0.82rem;">💡 $1</div>');
            
            // Line breaks
            html = html.replace(/\n\n/g, '<br>');
            html = html.replace(/\n/g, '<br>');
            // Clean up excessive <br>
            html = html.replace(/(<br>){3,}/g, '<br><br>');

            // ============================================================
            // BUILD SOURCE LINKS
            // ============================================================
            if (!window._chatProtocolIndex) window._chatProtocolIndex = {};
            let sourcesHtml = '';
            
            if (allMatches.length > 0) {
                sourcesHtml = '<div style="margin-top:12px; padding-top:8px; border-top:1px dashed #ddd; font-size:0.72rem; color:#888;">';
                sourcesHtml += '<span style="font-weight:700;">📚 Basado en:</span> ';
                
                allMatches.slice(0, 3).forEach((m, i) => {
                    const p = m.protocol;
                    const cleanTitle = (p.title || '').replace(/\{.*?\}/, '').replace(/[^\w\s\-áéíóúñÁÉÍÓÚÑ.,()]/g, '').trim();
                    const idxKey = 'ai_' + Date.now() + '_' + i;
                    window._chatProtocolIndex[idxKey] = m;
                    
                    const icon = m.source === 'channel' ? '📡' : '📋';
                    sourcesHtml += `<a href="#" style="color:#0a6aa1; text-decoration:none; font-weight:600; margin-right:8px;" onclick="event.preventDefault(); window.handleChatLinkByKey('${idxKey}')">${icon} ${cleanTitle}</a>`;
                });
                sourcesHtml += '</div>';
            }

            // ============================================================
            // RENDER
            // ============================================================
            const fullHtml = `<div class="ai-response" style="line-height:1.55; font-size:0.87rem;">${html}</div>${sourcesHtml}`;
            appendChatMessage('bot', fullHtml, true);
            
        } catch (err) {
            console.error('[Chatbot] Error Gemini:', err);
            if (allMatches.length > 0) {
                appendChatMessage('bot', '⚠️ Error con la IA (' + err.message + '). Te muestro los protocolos relevantes:', true);
                showClassicResults(allMatches, searchTerms);
            } else {
                appendChatMessage('bot', '⚠️ Error: ' + err.message + '. Inténtalo de nuevo en unos segundos.', true);
            }
        }

    } else if (allMatches.length > 0) {
        // --- MODO CLÁSICO (sin API Key) ---
        showClassicResults(allMatches, searchTerms);
        
        // Final warning if Key is missing
        if (!hasGeminiKey) {
            console.warn('[Chatbot] Gemini API Key missing or too short.');
            const warningHtml = `<div style="margin-top:10px; font-size:0.7rem; color:#d97706; background:#fffdf2; padding:8px; border:1px solid #fef3c7; border-radius:6px; font-style:italic;">
                ⚠️ <b>Aviso:</b> El "Cerebro IA" está desactivado. Ve al Admin -> Configuración Cloud y añade tu Gemini API Key para que el bot pueda explicarte las cosas paso a paso como un profesor.
            </div>`;
            appendChatMessage('bot', warningHtml, true);
        }
    } else {
        appendChatMessage('bot', 'No he encontrado una coincidencia en los manuales. ¿Podrías reformular la pregunta? Por ejemplo:', true);
        renderQuickReplies();
    }
}

// ============================================================
// CLASSIC RESULTS (Fallback without AI)
// ============================================================
function showClassicResults(allMatches, searchTerms) {
    if (!window._chatProtocolIndex) window._chatProtocolIndex = {};
    let combinedLinksHtml = '<div style="margin-bottom: 8px; font-weight:600;">He encontrado estos protocolos relevantes:</div>';
    
    allMatches.slice(0, 3).forEach((m, i) => {
        const p = m.protocol;
        const cleanTitle = (p.title || '').replace(/\{.*?\}/, '').trim();
        const idxKey = 'p_' + Date.now() + '_' + i;
        window._chatProtocolIndex[idxKey] = m;
        
        const CAT_MAP = typeof getCatMap === 'function' ? getCatMap() : {};
        const sectionStr = String(p.section || '');
        const catId = sectionStr.split('.')[0];
        const catName = CAT_MAP[catId] ? CAT_MAP[catId].name : (m.source === 'channel' ? '📡 Canales de Venta' : null);
        
        const snippets = getContextSnippets(p.info_html || p.content, searchTerms);
        let summaryHtml = '';
        if (snippets && snippets.length > 0) {
            summaryHtml = `<ul class="chat-kwic-list">${snippets.map(s => `<li>${s}</li>`).join('')}</ul>`;
        } else {
            const keyPoints = typeof getKeyPoints === 'function' ? getKeyPoints(p.info_html || p.content) : null;
            if (keyPoints && keyPoints.length > 0) {
                summaryHtml = `<ul class="chat-kwic-list">${keyPoints.map(pt => `<li>${pt.length > 120 ? pt.substring(0, 120) + '…' : pt}</li>`).join('')}</ul>`;
            } else {
                const fallback = typeof getExcerpt === 'function' ? getExcerpt(p.info_html || p.content, 130) : '';
                summaryHtml = `<div class="chat-excerpt">${fallback}</div>`;
            }
        }
        
        combinedLinksHtml += `
            <div style="margin: 12px 0; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 8px;">
                ${catName ? `<div class="chat-category-tag"><i class="fas fa-folder"></i>${catName}</div>` : ''}
                <a href="#" class="chat-link" onclick="event.preventDefault(); window.handleChatLinkByKey('${idxKey}')">
                    <i class="fas fa-file-alt"></i> ${p.section ? p.section + ' - ' : ''}${cleanTitle}
                </a>
                ${summaryHtml}
            </div>
        `;
    });
    
    appendChatMessage('bot', combinedLinksHtml, true);
    if (allMatches.length > 3) {
        appendChatMessage('bot', `📎 También encontré otros ${allMatches.length - 3} resultados relacionados.`);
    }
}

// ============================================================
// QUICK REPLIES — Contextual suggestions
// ============================================================
function renderQuickReplies() {
    const options = [
        { label: '🏨 Check-in', query: '¿Cómo hago un check-in?' },
        { label: '🚪 Check-out', query: '¿Cómo se hace el check-out y cierre de caja?' },
        { label: '📡 Canales', query: '¿Qué canales de venta tenemos y cómo funcionan?' },
        { label: '💳 Facturación', query: '¿Cómo se factura según el tipo de reserva?' },
        { label: '🔑 WiFi', query: '¿Cuáles son las claves WiFi del hotel?' },
        { label: '👶 Menores', query: '¿Cómo registro un grupo de menores?' }
    ];
    
    const html = `
        <div class="quick-replies">
            ${options.map(opt => `
                <button class="quick-reply-btn" onclick="handleQuickReply('${opt.query}')">${opt.label}</button>
            `).join('')}
        </div>
    `;
    appendChatMessage('bot', html, true);
}

window.handleQuickReply = (query) => {
    const input = document.getElementById('chatbot-input');
    input.value = query;
    processChatInput();
};

window.handleChatLinkClick = (sectionId, title) => {
    const source = (typeof protocols_data !== 'undefined' ? protocols_data : protocols);
    const p = source.find(p => (sectionId && p.section === sectionId) || (p.title === title));
    
    if (p) {
        if (typeof viewHistory !== 'undefined') {
            viewHistory.push({ type: 'protocol', payload: p });
        }
        loadProtocol(p);
        if (window.innerWidth < 600) {
            const chatbotContainer = document.getElementById('chatbot-container');
            if (chatbotContainer) chatbotContainer.style.display = 'none';
        }
    }
};

window.handleChatLinkByKey = (idxKey) => {
    const m = window._chatProtocolIndex && window._chatProtocolIndex[idxKey];
    if (!m) return;
    
    // Determine if it's a channel or a protocol
    const p = m.protocol;
    
    if (typeof viewHistory !== 'undefined') {
        viewHistory.push({ type: 'protocol', payload: p });
    }

    if (m.source === 'channel' && m.channelData) {
        // If it's a channel, load the 2.1 view and scroll to the ID
        const baseProtocol = protocols.find(pr => pr.section === '2.1' || pr.section === '2.1.0');
        if (baseProtocol) {
            loadProtocol(baseProtocol);
            setTimeout(() => {
                const el = document.getElementById(m.channelData.id);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 500);
        } else {
            loadProtocol(p);
        }
    } else {
        loadProtocol(p);
    }

    const chatbotContainer = document.getElementById('chatbot-container');
    if (chatbotContainer && window.innerWidth < 768) {
        chatbotContainer.style.display = 'none';
    }
};

window.handleChatCategoryClick = (catId) => {
    const CAT_MAP = getCatMap();
    if (CAT_MAP[catId]) {
        renderFilteredProtocols(catId, CAT_MAP[catId].name);
        if (window.innerWidth < 600) {
            document.getElementById('chatbot-container').style.display = 'none';
        }
    }
};
