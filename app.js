let protocols = [];
let filteredProtocols = [];
const mainColumn = document.getElementById('main-column');
const postsList = document.getElementById('posts-list');
const navItems = document.getElementById('top-nav-items');

// History stack for better navigation
// CONFIGURACIÓN DE NUBE (OPCIÓN B)
const CLOUD_GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbzRRNwjwp86B33O5rUjOG-uCVXUzieMAHijuOCq08k6BQ1SNmWARHytwUDjUijywGze/exec';

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

    if (typeof protocols_data !== 'undefined' && Array.isArray(protocols_data)) {
        protocols = protocols_data.filter(p => p.title && p.title !== "No Title");
        window.protocols = protocols; // Make protocols globally accessible
        
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

        // Sort by date descending
        protocols.sort((a, b) => new Date(b.published) - new Date(a.published));
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
            const catProtocols = protocols.filter(p => p.section && (String(p.section) === id || String(p.section).startsWith(id + '.')));
            
            // 2. Build a map of all unique section IDs present in these protocols
            const subMap = new Map();
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
                    
                    if (item.children.length > 0) {
                        a.innerHTML += ` <i class="fas fa-caret-right" style="font-size: 0.7rem; margin-left: auto; opacity: 0.6; padding-left: 10px;"></i>`;
                        const nested = document.createElement('div');
                        nested.className = 'dropdown-content nested';
                        item.children.sort((a,b) => a.id.localeCompare(b.id, undefined, {numeric:true}))
                                     .forEach(child => renderNavItem(child, nested));
                        
                        a.onclick = (e) => {
                            e.preventDefault();
                            if (item.protocol) {
                                viewHistory.push({ type: 'protocol', payload: item.protocol });
                                loadProtocol(item.protocol);
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
                            a.onclick = (e) => e.preventDefault();
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
        
        let excerpt = stripHtml(p.content).substring(0, 180) + '...';
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
                    <div class="post-section-tag">${p.section ? `<i class="fas fa-hashtag"></i> ${p.section}` : '<i class="fas fa-file"></i> s/s'}</div>
                    ${statusBadge ? `<div class="post-status-pill ${statusBadge.class}">${statusBadge.emoji} ${statusBadge.text}</div>` : ''}
                    <div class="post-date"><i class="far fa-clock"></i> ${formatDate(bestDate)}</div>
                </div>
                
                <h3 class="post-title">${displayTitle}</h3>
                <p class="post-excerpt" style="line-clamp: 2; -webkit-line-clamp: 2;">${excerpt}</p>
                
                <div class="post-footer">
                    <div class="post-scope"><i class="fas fa-map-marker-alt"></i> ${scope}</div>
                    <div class="post-action">Leer documento <i class="fas fa-chevron-right"></i></div>
                </div>
            </div>
        `;
        
        item.addEventListener('click', () => {
            viewHistory.push({ type: 'protocol', payload: p });
            loadProtocol(p, highlightText);
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
        const parts = p.section.split('.');
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
    // Hide sidebar for reading
    document.querySelector('.app-wrapper').classList.add('reading-mode');

    let content = p.content;
    
    // Special Case: CANALES DE VENTA (Dynamic rendering from channels_config)
    const isChannelProtocol = p.section === '2.1.0' || p.section === '2.1' || (p.title && p.title.includes('Canales de venta'));
    if (isChannelProtocol && typeof channels_config !== 'undefined') {
        const cumbriaChannels = channels_config.filter(c => c.hotel === 'Cumbria Spa & Hotel' || c.hotel === 'Ambos hoteles');
        const guadianaChannels = channels_config.filter(c => c.hotel === 'Sercotel Guadiana' || c.hotel === 'Ambos hoteles');
        const allChannels = channels_config;

        content = `
            <div class="channel-explorer-container">
                <div class="hotel-selector-tabs" style="margin-bottom: 20px; display: flex; gap: 10px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                    <button class="hotel-tab-btn active" onclick="filterChannelsByHotel('todos', this)" style="padding: 8px 16px; border-radius: 20px; border: 1px solid #004a66; background: #004a66; color: white; cursor: pointer; font-weight: 600;">Todos los Canales</button>
                    <button class="hotel-tab-btn" onclick="filterChannelsByHotel('cumbria', this)" style="padding: 8px 16px; border-radius: 20px; border: 1px solid #ccc; background: white; color: #555; cursor: pointer;">Cumbria Spa</button>
                    <button class="hotel-tab-btn" onclick="filterChannelsByHotel('guadiana', this)" style="padding: 8px 16px; border-radius: 20px; border: 1px solid #ccc; background: white; color: #555; cursor: pointer;">Sercotel Guadiana</button>
                </div>

                <nav class="channel-nav-sticky">
                    ${channels_config.map(c => `<a href="#${c.id}" class="channel-tab" data-hotel="${c.hotel}">${c.name}</a>`).join('')}
                </nav>

                <div id="channels-render-list">
                    ${channels_config.map(c => `
                        <div id="${c.id}" class="channel-section" data-hotel="${c.hotel}">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #a58c5f; padding-bottom: 10px; margin-bottom: 20px;">
                                <h2 style="border:none; margin:0;">${c.icon} ${c.name}</h2>
                                <span class="hotel-badge" style="background: ${c.hotel === 'Ambos hoteles' ? '#004a66' : c.hotel === 'Sercotel Guadiana' ? '#a58c5f' : '#27ae60'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">
                                    ${c.hotel || 'Ambos hoteles'}
                                </span>
                            </div>
                            <div class="channel-card">
                                <p style="font-weight:600; color:var(--primary); margin-bottom:10px;">${c.summary || ''}</p>
                                <div class="channel-procedimiento">
                                    ${c.content ? `<p>${c.content.replace(/\n/g, '<br>')}</p>` : ''}
                                </div>
                                
                                ${c.htmlContent ? `<div class="channel-custom-html" style="margin-top:20px; border-top: 1px solid #eee; padding-top: 20px;">${c.htmlContent}</div>` : ''}

                                ${c.notes ? `
                                    <div class="channel-notes" style="margin-top:20px; padding:15px; background:#f9f9f9; border-left:4px solid var(--accent); border-radius:4px;">
                                        <h4 style="margin:0 0 10px 0; font-size:0.85rem; color:#555;"><i class="fas fa-info-circle"></i> PECULIARIDADES Y NOTAS:</h4>
                                        <p style="margin:0; font-size:0.9rem; font-style:italic;">${c.notes.replace(/\n/g, '<br>')}</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <script>
                function filterChannelsByHotel(hotel, btn) {
                    // Update buttons
                    document.querySelectorAll('.hotel-tab-btn').forEach(b => {
                        b.style.background = 'white';
                        b.style.color = '#555';
                        b.style.borderColor = '#ccc';
                    });
                    btn.style.background = '#004a66';
                    btn.style.color = 'white';
                    btn.style.borderColor = '#004a66';

                    // Filter sections
                    document.querySelectorAll('.channel-section').forEach(sec => {
                        const secHotel = sec.dataset.hotel;
                        if (hotel === 'todos' || secHotel === 'Ambos hoteles' || 
                           (hotel === 'cumbria' && secHotel === 'Cumbria Spa & Hotel') || 
                           (hotel === 'guadiana' && secHotel === 'Sercotel Guadiana')) {
                            sec.style.display = 'block';
                        } else {
                            sec.style.display = 'none';
                        }
                    });

                    // Filter tabs
                    document.querySelectorAll('.channel-tab').forEach(tab => {
                        const tabHotel = tab.dataset.hotel;
                        if (hotel === 'todos' || tabHotel === 'Ambos hoteles' || 
                           (hotel === 'cumbria' && tabHotel === 'Cumbria Spa & Hotel') || 
                           (hotel === 'guadiana' && tabHotel === 'Sercotel Guadiana')) {
                            tab.style.display = 'inline-flex';
                        } else {
                            tab.style.display = 'none';
                        }
                    });
                }
            </script>
            <style>
                .channel-explorer-container { position: relative; }
                .channel-nav-sticky {
                    position: sticky;
                    top: -20px;
                    z-index: 100;
                    display: flex;
                    gap: 10px;
                    background: #004a66;
                    padding: 15px;
                    border-radius: 10px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                    overflow-x: auto;
                    scrollbar-width: thin;
                }
                .channel-tab {
                    color: white;
                    text-decoration: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    background: rgba(255,255,255,0.1);
                    font-weight: bold;
                    font-size: 0.9rem;
                    transition: all 0.3s;
                    white-space: nowrap;
                }
                .channel-tab:hover { background: rgba(255,255,255,0.25); transform: translateY(-2px); }
                .channel-section { scroll-margin-top: 100px; margin-bottom: 50px; }
                .channel-section h2 { color: #004a66; border-bottom: 2px solid #a58c5f; padding-bottom: 10px; margin-bottom: 20px; }
                .channel-card { background: white; border-radius: 12px; padding: 25px; border: 1px solid #eee; box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
                .channel-procedimiento { color: #444; line-height: 1.6; }
                .channel-custom-html img, .channel-custom-html video { 
                    max-width: 100%; 
                    height: auto; 
                    display: block; 
                    margin: 15px auto; 
                    border-radius: 8px; 
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
                }
            </style>
        `;
    }

    let originalTitle = p.title;

    // Parse "{🟢}" status tags from title
    let cleanTitle = originalTitle;
    let estadoHtml = '⚪ Sin definir';
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
    } else if (p.status) {
       let emoji = '⚪';
       if (p.status === 'Activo') emoji = '🟢';
       else if (p.status === 'En redacción') emoji = '🟠';
       else if (p.status === 'En proceso') emoji = '🔴';
       estadoHtml = `${emoji} <span style="color: var(--text-muted); font-weight: normal;">${p.status}</span>`;
    }

    let displayTitle = cleanTitle;

    if (highlightText) {
        // Careful with highlighting HTML, we only want to highlight text nodes ideally, 
        // but for a simple implementation we use a regex that ignores HTML tags
        // A safer robust way:
        const regex = new RegExp(`(?<!<[^>]*>)(${highlightText})`, 'gi');
        content = content.replace(regex, '<span class="highlight">$1</span>');
        displayTitle = displayTitle.replace(new RegExp(`(${highlightText})`, 'gi'), '<span class="highlight">$1</span>');
    }

    const scope = p.source ? p.source : 'Ambos hoteles';

    mainColumn.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div class="back-btn" onclick="goBack()" id="go-back" style="margin-bottom: 0;"><i class="fas fa-arrow-left"></i> Volver</div>
            <div class="share-btn" onclick="copyProtocolLink('${pId.replace(/'/g, "\\'")}')" title="Copiar enlace directo">
                <i class="fas fa-share-alt"></i> Copiar Vínculo
            </div>
        </div>
        <article class="protocol-full">
            <header class="protocol-full-header" style="text-align: center; border-bottom: none; display: flex; flex-direction: column; align-items: center; padding-bottom: 0; margin-bottom: 2rem;">
                <h1 style="color: #032d4b; font-size: 2rem; margin-bottom: 1rem; margin-top: 1rem;">
                    ${displayTitle}
                </h1>
                <div class="protocol-meta-bar" style="display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 1rem; color: #555; font-size: 0.9rem; padding-bottom: 0.5rem;">
                    <span><i class="fas fa-calendar-alt"></i> <b>Última revisión:</b> ${formatDate(p.published)}</span>
                    <span style="color: #ccc;">|</span>
                    <span><b>Estado:</b> ${(() => {
                        let s = p.status || estadoHtml;
                        if (s === 'Activo') return '🟢 Activo';
                        if (s === 'En redacción') return '🟠 En redacción';
                        if (s === 'En proceso') return '🔴 En proceso';
                        return s;
                    })()}</span>
                    <span style="color: #ccc;">|</span>
                    <span><i class="fas fa-hotel"></i> <b>Destinatario:</b> <span style="font-weight: normal;">${scope}</span></span>
                    ${p.section ? `<span style="color: #ccc;">|</span><span><i class="fas fa-folder"></i> <b>Sección:</b> ${p.section}</span>` : ''}
                </div>
                <div style="width: 150px; height: 2px; background-color: #b8955c; margin-top: 0.5rem;"></div>
            </header>
            <div class="protocol-full-body">
                ${(() => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(content, 'text/html');
                    const links = Array.from(doc.querySelectorAll('a'));
                    
                    const cards = links.filter(a => {
                        const href = a.getAttribute('href') || '';
                        return href.startsWith('#section/') || href.includes('documentos/');
                    });
                    
                    if (cards.length === 0) return content;
                    
                    // Re-sort cards: #section first, then documentos
                    cards.sort((a,b) => {
                        const ha = a.getAttribute('href');
                        const hb = b.getAttribute('href');
                        if (ha.startsWith('#section/') && !hb.startsWith('#section/')) return -1;
                        if (!ha.startsWith('#section/') && hb.startsWith('#section/')) return 1;
                        return 0;
                    });
                    
                    // Remove from original content to avoid duplication
                    cards.forEach(c => c.remove());
                    
                    const mainContent = doc.body.innerHTML;
                    
                    // Footer with cards
                    let footer = `
                        <div class="protocol-footer-links" style="margin-top: 3rem; padding-top: 2rem; border-top: 2px dashed #eee;">
                            <h3 style="color: #666; font-size: 1rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-layer-group"></i> Recursos y Vínculos Relacionados
                            </h3>
                            <div class="cards-container" style="display: flex; flex-direction: column; gap: 4px;">
                                ${cards.map(c => c.outerHTML).join('')}
                            </div>
                        </div>
                    `;
                    
                    return mainContent + footer;
                })()}
            </div>
            
            <!-- Comments Section -->
            <div class="protocol-comments-section" style="margin-top: 4rem; padding: 2rem; background: #fafafa; border-radius: 12px; border: 1px solid #eee;">
                <h3 style="margin-top: 0; color: #333; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-comments" style="color: var(--accent-blue);"></i> Apartado de Comentarios
                </h3>
                <p style="color: #666; font-size: 0.9rem; margin-bottom: 1.5rem;">Deja tus observaciones o dudas sobre este protocolo para que el equipo pueda revisarlas.</p>
                
                <div id="comments-container-${pId}" class="comments-list" style="margin-bottom: 2rem;">
                    <!-- Placeholder for the actual comments logic -->
                    <div style="text-align: center; color: #999; padding: 1rem; font-style: italic; border: 1px dashed #ddd; border-radius: 8px;">
                        Actualmente no hay comentarios. Sé el primero en escribir.
                    </div>
                </div>
                
                <div class="comment-form" style="display: flex; flex-direction: column; gap: 1rem;">
                    <div style="display: flex; gap: 1rem;">
                        <input type="text" id="comment-author" placeholder="Tu nombre" style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
                    </div>
                    <textarea id="comment-text" placeholder="Escribe tu comentario aquí..." style="width: 100%; min-height: 100px; padding: 10px; border-radius: 8px; border: 1px solid #ddd; font-family: inherit; resize: vertical;"></textarea>
                    <button onclick="submitComment('${pId.replace(/'/g, "\\'")}')" style="align-self: flex-end; padding: 10px 24px; background: var(--accent-blue); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Publicar Comentario
                    </button>
                    <p style="font-size: 0.8rem; color: #888; text-align: right; margin-top: 0.5rem;"><i class="fas fa-lock"></i> Los comentarios requieren autorización de administración antes de ser públicos.</p>
                </div>
            </div>

            <!-- Footer Legal Notice -->
            <footer class="protocol-legal-footer" style="margin-top: 3rem; padding: 1.5rem; border-top: 1px solid #ddd; color: #999; font-size: 0.75rem; line-height: 1.5; text-align: justify; font-style: italic;">
                <p>
                    <i class="fas fa-balance-scale" style="margin-right: 5px;"></i>
                    Esta página es de uso exclusivo del personal autorizado de <strong>Sercotel Guadiana y Cumbria Spa & Hotel</strong>. 
                    Queda estrictamente prohibido el acceso, uso, reproducción o difusión de su contenido por parte de personas no autorizadas. 
                    El incumplimiento de esta norma podrá dar lugar a las responsabilidades legales correspondientes.
                </p>
            </footer>
        </article>
    `;
    
    // Evaluate dynamically injected scripts from the content
    const scripts = mainColumn.querySelectorAll('script');
    scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode.replaceChild(newScript, oldScript);
    });
    
    // Process all links inside the loaded content
    const articleLinks = mainColumn.querySelectorAll('.protocol-full-body a');
    articleLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        // Anchor links within the same protocol (e.g. #synxis)
        if (href.startsWith('#') && !href.includes('/') && href.length > 1) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = href.slice(1);
                const target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
            return;
        }

        // Vínculos internos entre apartados (e.g. #section/1.1)
        if (href.startsWith('#section/')) {
            link.classList.add('internal-link');
            // Añadir icono si no lo tiene
            if (!link.innerHTML.includes('fa-') && !link.innerHTML.includes('📊')) {
                link.innerHTML = `<i class="fas fa-external-link-alt" style="font-size: 0.8em; margin-right: 5px; opacity: 0.7;"></i> ${link.innerHTML}`;
            }

            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = href.split('/')[1];
                const targetProtocol = protocols.find(p => p.section === sectionId);
                if (targetProtocol) {
                    viewHistory.push({ type: 'protocol', payload: targetProtocol });
                    loadProtocol(targetProtocol);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    alert('El apartado vinculado no se encuentra disponible.');
                }
            });
            return;
        }

        // If it's a link to the old or new blog
        if (href.includes('operativarecepcion2024.blogspot.com') || href.includes('procedimientoshotelguadiana.blogspot.com')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Try to find if we have a protocol that matches a part of this URL (like the slug)
                // For a static site, we will just search by the text inside the link or a simple fallback
                const linkText = link.textContent.trim();
                if (linkText) {
                    handleSearch(linkText); // Use our search to find the referenced protocol
                } else {
                    window.open(href, '_blank'); // Fallback to new tab
                }
            });
        } else if (href.startsWith('http')) {
            // It's an external link (like an image or another site), always open in new tab
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Auto-render comments for this protocol
    setTimeout(() => renderComments(pId), 100);
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
            const statusMatch = p.title.match(/\{([\u0000-\uFFFF\uD800-\uDBFF\uDC00-\uDFFF]+?)\}/);
            let statusBadge = '';
            
            if (statusMatch) {
                const emoji = statusMatch[1];
                let className = 'guide-status-active';
                let text = 'Activo';
                
                if (emoji === '🟠' || emoji === '🟡') { className = 'guide-status-draft'; text = 'En redacción'; }
                else if (emoji === '🔴') { className = 'guide-status-process'; text = 'En proceso'; }
                
                statusBadge = `<span class="guide-status-badge ${className}">${emoji} ${text}</span>`;
            }

            const cleanTitle = p.title.replace(/\{.*?\}/, '').trim();
            const iconHtml = cat.icon.startsWith('http') || cat.icon.startsWith('assets/')
                ? `<img src="${cat.icon}" style="width: 16px; height: 16px; object-fit: contain;">`
                : `<i class="fas ${cat.icon}" style="font-size: 0.9rem; opacity: 0.7;"></i>`;

            protocolsHtml += `
                <div class="guide-item ${isSubItem ? 'sub-item' : ''}" onclick="window.loadProtocolById('${p.section}')">
                    <div class="guide-item-info">
                        ${iconHtml}
                        <span class="guide-number">${p.section}</span>
                        <span class="guide-protocol-title">${cleanTitle}</span>
                    </div>
                    ${statusBadge}
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

    renderHome(); // Go to home structure first
    const list = document.getElementById('posts-list');
    document.querySelector('.section-title').innerHTML = `<i class="fas fa-search"></i> Resultados de búsqueda: "${query}"`;
    
    const results = protocols.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) || 
        stripHtml(p.content).toLowerCase().includes(query.toLowerCase()) ||
        (p.section && p.section.toLowerCase().includes(query.toLowerCase()))
    );
    
    renderList(results, list, query);
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

    mainColumn.innerHTML = `
        <div class="back-btn" onclick="goBack()"><i class="fas fa-arrow-left"></i> Volver</div>
        <h2 class="section-title">${alertConfig.icon} ${alertConfig.title}</h2>
        <div id="posts-list" class="alerts-list"></div>
    `;

    const listContainer = document.getElementById('posts-list');
    
    if (!alertConfig.items || alertConfig.items.length === 0) {
        listContainer.innerHTML = '<div class="no-results">No hay alertas activas en este momento.</div>';
        return;
    }

    alertConfig.items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'post-item alert-item';
        itemEl.innerHTML = `
            <div class="post-meta">
                <span><i class="far fa-calendar-alt"></i> ${item.date}</span>
                ${item.id ? `<span><i class="fas fa-hashtag"></i> ID ${item.id}</span>` : ''}
            </div>
            <h3>${item.title}</h3>
        `;
        
        itemEl.addEventListener('click', () => {
            if (item.id) {
                // If there's an ID, try to find the matching protocol
                const protocol = protocols.find(p => p.section === item.id);
                if (protocol) {
                    viewHistory.push({ type: 'protocol', payload: protocol });
                    loadProtocol(protocol);
                } else {
                    // Search by title if ID match fails
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
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1);
    const year = d.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
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
            const cloudResponse = await fetch(CLOUD_GATEWAY_URL, {
                method: 'POST',
                mode: 'no-cors', // Google Apps Script requires no-cors for simple silent POSTs
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pId, pTitle, author, text })
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
    const filteredComments = comments_data.filter(c => 
        (c.pId && String(c.pId).trim() === normalizedId) || 
        (c.pTitle && String(c.pTitle).trim() === normalizedId)
    );
    
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
function initChatbot() {
    const trigger = document.getElementById('chatbot-trigger');
    const container = document.getElementById('chatbot-container');
    const closeBtn = document.getElementById('close-chatbot');
    const sendBtn = document.getElementById('send-chatbot-msg');
    const input = document.getElementById('chatbot-input');

    if (!trigger || !container) return;

    trigger.onclick = () => {
        container.style.display = container.style.display === 'flex' ? 'none' : 'flex';
        input.focus();
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
    
    // Don't add if already there
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
    
    // Natural delay logic
    const delay = Math.max(1000, Math.min(2500, text.length * 20));
    setTimeout(() => {
        generateBotResponse(text);
    }, delay);
}

function getExcerpt(html, maxLength = 120) {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const text = temp.textContent || temp.innerText || '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Extract key bullet points from protocol HTML for a meaningful summary
function getKeyPoints(html, maxPoints = 3) {
    if (!html) return null;
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
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

function generateBotResponse(userInput) {
    const input = userInput.toLowerCase();
    
    // SYNONYM ENHANCEMENT
    const synonymMap = {
        'wifi': ['internet', 'red', 'clave', 'conexion'],
        'pms': ['tesipro', 'sistema', 'programa'],
        'hab': ['habitacion', 'alojamiento', 'cuarto'],
        'copia': ['duplicado', 'clonar'],
        'qr': ['codigo', 'digital'],
        'factura': ['ticket', 'pago', 'cobro', 'invoice'],
        'menor': ['menores', 'niño', 'niña', 'hijo', '14'],
        'dni': ['documento', 'identidad', 'pasaporte']
    };

    // FILTER FILLER WORDS
    const fillers = ['de', 'el', 'la', 'los', 'las', 'un', 'una', 'con', 'para', 'por', 'que'];
    const words = input.split(/\s+/).filter(w => w.length > 1 && !fillers.includes(w));

    let searchTerms = [input, ...words];
    for (const [key, values] of Object.entries(synonymMap)) {
        if (input.includes(key)) {
            searchTerms = [...searchTerms, ...values];
        }
    }
    
    // GREETINGS
    const greetings = ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'ey', 'saludos', 'ayuda'];
    if (greetings.some(g => input.includes(g))) {
        appendChatMessage('bot', '¡Hola! Soy tu asistente inteligente. Puedo buscar procedimientos, protocolos y resolver dudas sobre la operativa del hotel.');
        renderQuickReplies();
        return;
    }

    // SEARCH IN PROTOCOLS
    const matches = (typeof protocols_data !== 'undefined' ? protocols_data : protocols).map(p => {
        let score = 0;
        const title = (p.title || '').toLowerCase();
        const section = (p.section || '').toLowerCase();
        const content = (p.content || '').toLowerCase();

        searchTerms.forEach(term => {
            if (title.includes(term)) score += 50;
            if (section.includes(term)) score += 100;
            if (content.includes(term)) score += 10;
        });

        return { protocol: p, score: score };
    }).filter(m => m.score > 0).sort((a,b) => b.score - a.score);

    if (matches.length > 0) {
        appendChatMessage('bot', 'He analizado los protocolos y esto es lo más relevante:');
        
        // Store protocols in a global index to avoid inline string escaping issues
        if (!window._chatProtocolIndex) window._chatProtocolIndex = {};
        
        matches.slice(0, 3).forEach((m, i) => {
            const p = m.protocol;
            const cleanTitle = p.title.replace(/\{.*?\}/, '').trim();
            const idxKey = 'p_' + Date.now() + '_' + i;
            window._chatProtocolIndex[idxKey] = p;
            
            // Resolve category name from section's top-level ID
            const CAT_MAP = getCatMap();
            const catId = p.section ? String(p.section).split('.')[0] : null;
            const catName = catId && CAT_MAP[catId] ? CAT_MAP[catId].name : null;
            
            // Build key-points summary
            const keyPoints = getKeyPoints(p.info_html || p.content);
            let summaryHtml = '';
            if (keyPoints && keyPoints.length > 0) {
                summaryHtml = `<ul style="margin:6px 0 0 4px; padding-left:16px; font-size:0.8rem; color:#555; line-height:1.5;">${
                    keyPoints.map(pt => `<li>${pt.length > 120 ? pt.substring(0, 120) + '…' : pt}</li>`).join('')
                }</ul>`;
            } else {
                const fallback = getExcerpt(p.info_html || p.content, 130);
                summaryHtml = `<div class="chat-excerpt">${fallback}</div>`;
            }
            
            const linkHtml = `
                <div style="margin-bottom: 12px;">
                    ${catName ? `<div style="font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#888; margin-bottom:4px;"><i class="fas fa-folder" style="margin-right:4px;"></i>${catName}</div>` : ''}
                    <a href="#" class="chat-link" onclick="event.preventDefault(); window.handleChatLinkByKey('${idxKey}')">
                        <i class="fas fa-file-alt"></i> ${p.section ? p.section + ' - ' : ''}${cleanTitle}
                    </a>
                    ${summaryHtml}
                </div>
            `;
            appendChatMessage('bot', linkHtml, true);
        });
        
        if (matches.length > 3) {
            appendChatMessage('bot', `También he encontrado otros ${matches.length - 3} resultados. ¿Necesitas algo más específico?`);
        }
    } else {
        appendChatMessage('bot', 'No he encontrado una coincidencia exacta en los manuales actuales. ¿Te refieres a algo de esto?');
        renderQuickReplies();
    }
}

function renderQuickReplies() {
    const options = [
        { label: 'Check-in', query: 'check-in' },
        { label: 'Check-out', query: 'check-out' },
        { label: 'Facturación', query: 'factura' },
        { label: 'Claves WiFi', query: 'wifi' }
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

// New index-based handler — avoids all escaping issues with title/section strings
window.handleChatLinkByKey = (idxKey) => {
    const p = window._chatProtocolIndex && window._chatProtocolIndex[idxKey];
    if (!p) return;
    if (typeof viewHistory !== 'undefined') {
        viewHistory.push({ type: 'protocol', payload: p });
    }
    loadProtocol(p);
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
