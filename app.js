let protocols = [];
let filteredProtocols = [];
const mainColumn = document.getElementById('main-column');
const postsList = document.getElementById('posts-list');
const navItems = document.getElementById('top-nav-items');

// History stack for better navigation
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
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (isLocalhost) {
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
            
            // Special handling for submenus (dynamic)
            const hasSubsections = cat.subsections && Object.keys(cat.subsections).length > 0;
            const hasLinks = cat.links && cat.links.length > 0;
            
            if (hasSubsections || hasLinks) {
                link.innerHTML += ` <i class="fas fa-caret-down"></i>`;
                
                const dropdown = document.createElement('div');
                dropdown.className = 'dropdown-content';
                
                // Add explicit links (External)
                if (hasLinks) {
                    cat.links.forEach(l => {
                        const a = document.createElement('a');
                        a.href = l.url;
                        a.target = "_blank";
                        const isImageIcon = l.icon && (l.icon.startsWith('http') || l.icon.startsWith('assets/'));
                        const iconHtml = isImageIcon 
                            ? `<img src="${l.icon}" style="width: 14px; height: 14px; margin-right: 8px; vertical-align: middle;">`
                            : `<i class="fas ${l.icon || 'fa-link'}"></i> `;
                        a.innerHTML = `${iconHtml}${l.text}`;
                        dropdown.appendChild(a);
                    });
                }

                // Add dynamic subsections with nesting support
                if (hasSubsections) {
                    const sortedSubs = Object.entries(cat.subsections).sort((a,b) => a[0].localeCompare(b[0], undefined, {numeric:true}));
                    
                    const subMap = new Map();
                    // First pass: identify parents and children
                    sortedSubs.forEach(([subId, subName]) => {
                        const parts = subId.split('.');
                        const parentId = parts.length > 2 ? parts.slice(0, parts.length - 1).join('.') : null;
                        subMap.set(subId, { id: subId, name: subName, parent: parentId, children: [] });
                    });
                    
                    // Second pass: build tree
                    const rootSubs = [];
                    subMap.forEach(item => {
                        if (item.parent && subMap.has(item.parent)) {
                            subMap.get(item.parent).children.push(item);
                        } else {
                            rootSubs.push(item);
                        }
                    });

                    // Helper function to render items recursively
                    const renderSubItem = (item, parentEl) => {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'sub-dropdown-wrapper';
                        
                        const a = document.createElement('a');
                        a.href = '#';
                        a.className = 'internal-nav';
                        a.dataset.search = item.id;
                        
                        // Handle icon/emoji from protocols data if possible, or just default
                        // In the menu we usually don't have the full protocol object here, 
                        // so we try to find it in the global protocols array for the icon
                        const pData = protocols.find(p => p.section === item.id);
                        let iconHtml = '<i class="fas fa-angle-right" style="opacity:0.3;"></i> ';
                        
                        if (pData) {
                            const emojiMatch = pData.title.match(/\{([\u0000-\uFFFF\uD800-\uDBFF\uDC00-\uDFFF]+?)\}/);
                            if (emojiMatch) {
                                iconHtml = `<span style="margin-right:8px; font-size:1.1rem;">${emojiMatch[1]}</span>`;
                            }
                        }
                        
                        const cleanName = item.name.replace(/\{.*?\}/, '').trim();
                        a.innerHTML = `<span style="display:flex; align-items:center;">${iconHtml}${cleanName}</span>`;
                        
                        if (item.children.length > 0) {
                            a.innerHTML += ` <i class="fas fa-caret-right" style="font-size: 0.7rem; margin-left: auto; opacity: 0.6;"></i>`;
                            const nestedDropdown = document.createElement('div');
                            nestedDropdown.className = 'dropdown-content nested';
                            item.children.forEach(child => renderSubItem(child, nestedDropdown));
                            wrapper.appendChild(a);
                            wrapper.appendChild(nestedDropdown);
                        } else {
                            wrapper.appendChild(a);
                        }
                        
                        parentEl.appendChild(wrapper);
                    };

                    rootSubs.forEach(item => renderSubItem(item, dropdown));
                }
                
                // Set up internal navigation links
                dropdown.querySelectorAll('.internal-nav').forEach(el => {
                    el.addEventListener('click', (e) => {
                        e.preventDefault();
                        const query = el.getAttribute('data-search');
                        handleSearch(query);
                    });
                });
                
                // General click handler for the top category dropdown link
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    setActiveNav(link);
                    viewHistory.push({ type: 'category', name: cat.name, id: id });
                    renderCategory(cat.name, id);
                });

                linkWrapper.appendChild(link);
                linkWrapper.appendChild(dropdown);
                navItems.appendChild(linkWrapper);
            } else {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    setActiveNav(link);
                    viewHistory.push({ type: 'category', name: cat.name, id: id });
                    renderCategory(cat.name, id);
                });
                navItems.appendChild(link);
            }
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
                <div class="quick-card" onclick="renderCategory('Turnos', '1')">
                    <div class="quick-icon"><i class="fas fa-clipboard-list"></i></div>
                    <div class="quick-info">
                        <h3>Turnos</h3>
                        <p>Gestión de cuadrantes y cambios</p>
                    </div>
                </div>
                <div class="quick-card" onclick="renderCategory('Reservas y Tarifas', '3')">
                    <div class="quick-icon"><i class="fas fa-file-invoice-dollar"></i></div>
                    <div class="quick-info">
                        <h3>Reservas</h3>
                        <p>Control de tarifas y canales</p>
                    </div>
                </div>
                <div class="quick-card" onclick="renderCategory('Estancia, Caja y Salidas', '4')">
                    <div class="quick-icon"><i class="fas fa-cash-register"></i></div>
                    <div class="quick-info">
                        <h3>Caja y Salidas</h3>
                        <p>Facturación y cierre de turno</p>
                    </div>
                </div>
                <div class="quick-card" onclick="renderCategory('Gestión de Grupos', '5')">
                    <div class="quick-icon"><i class="fas fa-users-cog"></i></div>
                    <div class="quick-info">
                        <h3>Grupos</h3>
                        <p>Eventos y reservas grupales</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="recent-updates-box">
            <h2 class="section-title"><i class="fas fa-clock"></i> Actualizaciones y Novedades</h2>
            <div id="home-updates-list"></div>
        </div>
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
    renderList(sorted.slice(0, 8), list);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    toggleHomeComponents(false);
    const CAT_MAP = getCatMap();
    document.querySelector('.app-wrapper').classList.add('reading-mode');

    mainColumn.innerHTML = `
        <div class="back-btn" onclick="goBack()"><i class="fas fa-arrow-left"></i> Volver</div>
        <h2 class="section-title"><i class="fas ${CAT_MAP[id] ? CAT_MAP[id].icon : 'fa-folder'}"></i> ${name}</h2>
        <div id="posts-list"></div>
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
    toggleHomeComponents(false);
    // Hide sidebar for reading
    document.querySelector('.app-wrapper').classList.add('reading-mode');

    let content = p.content;
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
        <div class="back-btn" onclick="goBack()" id="go-back"><i class="fas fa-arrow-left"></i> Volver</div>
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
                ${content}
            </div>
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
