/**
 * Módulo de Seguridad y Control de Accesos por Sección (OAuth Google / Microsoft + Invitados con caducidad)
 * Gestionado desde admin.html -> Pestaña "Seguridad y Accesos" y guardado en data.js (security_config).
 */
(function () {
    const SESSION_KEY = 'protocolo_security_session_v1';

    function getDefaultSecurityConfig() {
        return {
            adminEmails: ['nataliohoteles@gmail.com'],
            rules: [
                {
                    section: '*',
                    label: 'Plataforma General (Recepción)',
                    accessKey: 'Recep2026!',
                    allowedEmails: [
                        'hcumbri@gmail.com',
                        'hotelguad@gmail.com',
                        'comunicaciones@hotelguadiana.es'
                    ]
                },
                {
                    section: '5.2',
                    label: 'Cumbria Bienestar (Spa)',
                    accessKey: 'Spa2026!',
                    allowedEmails: [
                        'cumbriaspa@gmail.com'
                    ]
                }
            ],
            googleClientId: '',
            microsoftClientId: '',
            guestPasses: []
        };
    }

    function ensureSecurityConfig() {
        if (typeof window.security_config === 'undefined' || !window.security_config) {
            window.security_config = getDefaultSecurityConfig();
        }
        const cfg = window.security_config;
        if (!Array.isArray(cfg.adminEmails)) {
            cfg.adminEmails = ['nataliohoteles@gmail.com'];
        }
        if (!Array.isArray(cfg.rules)) {
            cfg.rules = getDefaultSecurityConfig().rules;
        }
        if (!Array.isArray(cfg.guestPasses)) cfg.guestPasses = [];
        if (typeof cfg.googleClientId !== 'string') cfg.googleClientId = '';
        if (typeof cfg.microsoftClientId !== 'string') cfg.microsoftClientId = '';
        return cfg;
    }

    function getRuleForSection(sectionId) {
        if (!sectionId) return null;
        const cfg = ensureSecurityConfig();
        const s = String(sectionId).trim();
        // Buscar la regla más específica primero (mayor longitud de prefijo)
        const matches = cfg.rules
            .filter(r => {
                const prot = String(r.section || '').trim();
                return prot && prot !== '*' && (s === prot || s.startsWith(prot + '.'));
            })
            .sort((a, b) => String(b.section).length - String(a.section).length);
        if (matches[0]) return matches[0];
        return cfg.rules.find(r => String(r.section || '').trim() === '*') || null;
    }

    function getStoredSession() {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function saveSession(sessionObj) {
        try {
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionObj));
        } catch (e) {}
    }

    function clearSession() {
        try {
            localStorage.removeItem(SESSION_KEY);
        } catch (e) {}
    }

    function isAdminEmail(email) {
        if (!email) return false;
        const clean = String(email).trim().toLowerCase();
        return (ensureSecurityConfig().adminEmails || []).some(e => String(e).trim().toLowerCase() === clean);
    }

    function isEmailAuthorizedForRule(email, rule) {
        if (isAdminEmail(email)) return true;
        if (!rule) return false;
        const clean = String(email).trim().toLowerCase();
        return (rule.allowedEmails || []).some(e => String(e).trim().toLowerCase() === clean);
    }

    function isGuestAllowedForSection(pass, sectionId) {
        const target = String(pass.section || '*').trim();
        if (target === '*') return true;
        const s = String(sectionId || '').trim();
        return s === target || s.startsWith(target + '.');
    }

    function validateGuestCode(code, sectionId) {
        if (!code) return null;
        const cfg = ensureSecurityConfig();
        const clean = String(code).trim().toUpperCase();
        const pass = cfg.guestPasses.find(g => String(g.code || '').trim().toUpperCase() === clean);
        if (!pass || pass.revoked) return null;
        const exp = new Date(pass.expiresAt).getTime();
        if (isNaN(exp) || exp <= Date.now()) return null;
        if (sectionId && !isGuestAllowedForSection(pass, sectionId)) return null;
        return pass;
    }

    function getActiveValidSessionForRule(rule, sectionId) {
        // 1. Auto-validar si viene ?guest=CODIGO en la URL
        try {
            const params = new URLSearchParams(window.location.search);
            const urlGuest = params.get('guest');
            if (urlGuest) {
                const pass = validateGuestCode(urlGuest, sectionId);
                if (pass) {
                    const displayGuest = pass.guestName
                        ? `${pass.guestName}${pass.email ? ' (' + pass.email + ')' : ''}`
                        : (pass.label || 'Invitado');
                    const s = {
                        type: 'guest',
                        code: pass.code,
                        label: displayGuest,
                        section: pass.section || '*',
                        expiresAt: new Date(pass.expiresAt).getTime()
                    };
                    saveSession(s);
                    return { ok: true, session: s };
                }
            }
        } catch (e) {}

        const session = getStoredSession();
        if (!session) return { ok: false, reason: null };

        if (session.type === 'oauth') {
            if (!session.expiresAt || session.expiresAt <= Date.now()) {
                clearSession();
                return { ok: false, reason: null };
            }
            const email = String(session.email || '').trim().toLowerCase();
            if (!isEmailAuthorizedForRule(email, rule)) {
                return { ok: false, reason: `La cuenta "${email}" no tiene permiso para acceder a "${rule.label || rule.section}".` };
            }
            return { ok: true, session };
        }

        if (session.type === 'guest') {
            const pass = validateGuestCode(session.code, sectionId);
            if (!pass) {
                return { ok: false, reason: 'El pase de invitado ha caducado, está revocado o no es válido para esta sección.' };
            }
            return {
                ok: true,
                session: {
                    type: 'guest',
                    code: pass.code,
                    label: pass.label || 'Invitado',
                    section: pass.section || '*',
                    expiresAt: new Date(pass.expiresAt).getTime()
                }
            };
        }

        return { ok: false, reason: null };
    }

    function loadExternalScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('No se pudo cargar ' + src));
            document.head.appendChild(s);
        });
    }

    function showAuthError(msg) {
        const box = document.getElementById('sec-gate-error');
        if (box) {
            box.textContent = msg;
            box.style.display = 'block';
        } else {
            alert(msg);
        }
    }

    async function loginWithGoogle(protocolToReload) {
        const cfg = ensureSecurityConfig();
        const clientId = (cfg.googleClientId || '').trim();
        if (!clientId) {
            showAuthError('Falta configurar el "Google Client ID" en Panel de Administración > Seguridad y Accesos.');
            return;
        }
        const rule = getRuleForSection(protocolToReload && protocolToReload.section);
        try {
            await loadExternalScript('https://accounts.google.com/gsi/client');
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'openid email profile',
                callback: async (resp) => {
                    if (resp.error || !resp.access_token) {
                        showAuthError('Inicio de sesión con Google cancelado o con error.');
                        return;
                    }
                    try {
                        const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                            headers: { Authorization: 'Bearer ' + resp.access_token }
                        });
                        const user = await r.json();
                        const email = String(user.email || '').trim().toLowerCase();
                        if (!isEmailAuthorizedForRule(email, rule)) {
                            showAuthError(`La cuenta "${email}" no está autorizada para acceder a esta sección.`);
                            return;
                        }
                        saveSession({
                            type: 'oauth',
                            provider: 'Google',
                            email: email,
                            name: user.name || email,
                            expiresAt: Date.now() + 12 * 60 * 60 * 1000
                        });
                        if (window.__platformUnlockCallback) {
                            const cb = window.__platformUnlockCallback;
                            window.__platformUnlockCallback = null;
                            togglePlatformChrome(true);
                            cb();
                        } else if (typeof window.loadProtocol === 'function' && protocolToReload) {
                            window.loadProtocol(protocolToReload);
                        } else {
                            location.reload();
                        }
                    } catch (err) {
                        showAuthError('No se pudo verificar el usuario de Google.');
                    }
                }
            });
            tokenClient.requestAccessToken({ prompt: 'select_account' });
        } catch (err) {
            showAuthError('Error cargando Google Sign-In: ' + err.message);
        }
    }

    async function loginWithMicrosoft(protocolToReload) {
        const cfg = ensureSecurityConfig();
        const clientId = (cfg.microsoftClientId || '').trim();
        if (!clientId) {
            showAuthError('Falta configurar el "Microsoft Client ID" en Panel de Administración > Seguridad y Accesos.');
            return;
        }
        const rule = getRuleForSection(protocolToReload && protocolToReload.section);
        try {
            await loadExternalScript('https://alcdn.msauth.net/browser/2.38.3/js/msal-browser.min.js');
            const msalInstance = new window.msal.PublicClientApplication({
                auth: {
                    clientId: clientId,
                    authority: 'https://login.microsoftonline.com/common',
                    redirectUri: window.location.origin + window.location.pathname
                }
            });
            if (typeof msalInstance.initialize === 'function') {
                await msalInstance.initialize();
            }
            const loginResp = await msalInstance.loginPopup({
                scopes: ['User.Read'],
                prompt: 'select_account'
            });
            const account = loginResp.account || {};
            const email = String(account.username || '').trim().toLowerCase();
            if (!isEmailAuthorizedForRule(email, rule)) {
                showAuthError(`La cuenta Microsoft "${email}" no está autorizada para acceder a esta sección.`);
                return;
            }
            saveSession({
                type: 'oauth',
                provider: 'Microsoft',
                email: email,
                name: account.name || email,
                expiresAt: Date.now() + 12 * 60 * 60 * 1000
            });
            if (window.__platformUnlockCallback) {
                const cb = window.__platformUnlockCallback;
                window.__platformUnlockCallback = null;
                togglePlatformChrome(true);
                cb();
            } else if (typeof window.loadProtocol === 'function' && protocolToReload) {
                window.loadProtocol(protocolToReload);
            } else {
                location.reload();
            }
        } catch (err) {
            showAuthError('Inicio de sesión con Microsoft cancelado o no disponible: ' + (err.message || err));
        }
    }

    function loginWithGuestCode(code, protocolToReload) {
        const sectionId = protocolToReload ? protocolToReload.section : null;
        const pass = validateGuestCode(code, sectionId);
        if (!pass) {
            showAuthError('El código de invitado no es válido para esta sección, está revocado o ha caducado.');
            return;
        }
        saveSession({
            type: 'guest',
            code: pass.code,
            label: pass.label || 'Invitado',
            section: pass.section || '*',
            expiresAt: new Date(pass.expiresAt).getTime()
        });
        if (window.__platformUnlockCallback) {
            const cb = window.__platformUnlockCallback;
            window.__platformUnlockCallback = null;
            togglePlatformChrome(true);
            cb();
        } else if (typeof window.loadProtocol === 'function' && protocolToReload) {
            window.loadProtocol(protocolToReload);
        } else {
            location.reload();
        }
    }

    function togglePlatformChrome(visible) {
        const displayVal = visible ? '' : 'none';
        const nav = document.querySelector('.top-nav');
        const side = document.querySelector('.sidebar-col');
        const botBtn = document.getElementById('chatbot-toggle-btn');
        const botBox = document.getElementById('chatbot-container');
        if (nav) nav.style.display = displayVal;
        if (side) side.style.display = displayVal;
        if (botBtn) botBtn.style.display = displayVal;
        if (botBox && !visible) botBox.style.display = 'none';
    }

    function renderGateCardHtml(title, subtitle, reasonMsg) {
        const cfg = ensureSecurityConfig();
        const hasGoogle = !!(cfg.googleClientId && cfg.googleClientId.trim());
        const hasMs = !!(cfg.microsoftClientId && cfg.microsoftClientId.trim());

        const oauthHtml = (hasGoogle || hasMs) ? `
            <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:1.25rem;">
                ${hasGoogle ? `<button type="button" onclick="window.__secLoginGoogle()" style="display:flex; align-items:center; justify-content:center; gap:10px; width:100%; padding:0.8rem 1rem; border-radius:12px; border:1px solid var(--border, #cbd5e1); background:var(--bg-light, #f8fafc); color:var(--text-dark, #0f172a); font-weight:700; font-size:0.92rem; cursor:pointer;">
                    <i class="fab fa-google" style="color:#ea4335; font-size:1.05rem;"></i> Iniciar sesión con Google
                </button>` : ''}
                ${hasMs ? `<button type="button" onclick="window.__secLoginMicrosoft()" style="display:flex; align-items:center; justify-content:center; gap:10px; width:100%; padding:0.8rem 1rem; border-radius:12px; border:1px solid var(--border, #cbd5e1); background:var(--bg-light, #f8fafc); color:var(--text-dark, #0f172a); font-weight:700; font-size:0.92rem; cursor:pointer;">
                    <i class="fab fa-microsoft" style="color:#00a4ef; font-size:1.05rem;"></i> Iniciar sesión con Microsoft
                </button>` : ''}
            </div>
            <div style="text-align:center; font-size:0.78rem; color:var(--text-muted, #64748b); margin-bottom:1rem; font-weight:700;">— O ACCEDE CON TU CORREO Y CLAVE —</div>
        ` : '';

        return `
            <div style="max-width:540px; margin:2.5rem auto; background:var(--white, #fff); border:1px solid var(--border, #e2e8f0); border-radius:18px; box-shadow:var(--shadow, 0 12px 30px rgba(0,0,0,0.08)); overflow:hidden; color:var(--text-dark, #0f172a);">
                <div style="height:6px; background:linear-gradient(90deg, var(--accent-blue, #0a6aa1), #a58c5f, var(--accent-green, #27ae60));"></div>
                <div style="padding:2rem;">
                    <div style="display:flex; align-items:center; gap:14px; margin-bottom:1.15rem;">
                        <div style="width:50px; height:50px; border-radius:14px; background:rgba(10,106,161,0.12); color:var(--accent-blue, #0a6aa1); display:flex; align-items:center; justify-content:center; font-size:1.45rem; flex-shrink:0;">
                            <i class="fas fa-lock"></i>
                        </div>
                        <div>
                            <span style="font-size:0.74rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:var(--accent-blue, #0a6aa1);">${subtitle}</span>
                            <h2 style="margin:2px 0 0; font-size:1.3rem; font-weight:800;">${title}</h2>
                        </div>
                    </div>

                    <div id="sec-gate-error" style="${reasonMsg ? 'display:block;' : 'display:none;'} margin-bottom:1rem; padding:0.75rem 1rem; border-radius:10px; background:rgba(178,34,34,0.1); border-left:4px solid #b22222; color:#b22222; font-size:0.86rem; font-weight:600;">${reasonMsg || ''}</div>

                    ${oauthHtml}

                    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:1.35rem;">
                        <div>
                            <label style="display:block; font-size:0.76rem; font-weight:800; text-transform:uppercase; color:var(--text-muted, #475569); margin-bottom:5px;">Correo autorizado</label>
                            <input type="email" id="sec-email-input" placeholder="usuario@correo.com" style="width:100%; padding:0.7rem 0.9rem; border-radius:10px; border:1px solid var(--border, #cbd5e1); background:var(--bg-light, #f8fafc); color:var(--text-dark, #0f172a); font-size:0.92rem;" onkeydown="if(event.key==='Enter') document.getElementById('sec-key-input').focus();" />
                        </div>
                        <div>
                            <label style="display:block; font-size:0.76rem; font-weight:800; text-transform:uppercase; color:var(--text-muted, #475569); margin-bottom:5px;">Clave de acceso</label>
                            <input type="password" id="sec-key-input" placeholder="Introduce la clave..." style="width:100%; padding:0.7rem 0.9rem; border-radius:10px; border:1px solid var(--border, #cbd5e1); background:var(--bg-light, #f8fafc); color:var(--text-dark, #0f172a); font-size:0.92rem;" onkeydown="if(event.key==='Enter') window.__secLoginEmailKey();" />
                        </div>
                        <button type="button" onclick="window.__secLoginEmailKey()" style="width:100%; padding:0.8rem 1rem; border-radius:10px; border:none; background:var(--accent-blue, #0a6aa1); color:#fff; font-weight:700; font-size:0.95rem; cursor:pointer;">
                            <i class="fas fa-sign-in-alt" style="margin-right:6px;"></i> Entrar
                        </button>
                    </div>

                    <div style="border-top:1px dashed var(--border, #cbd5e1); padding-top:1.1rem;">
                        <label style="display:block; font-size:0.76rem; font-weight:800; text-transform:uppercase; color:var(--text-muted, #475569); margin-bottom:7px;">
                            <i class="fas fa-ticket-alt"></i> Acceso para Invitados (Pase Temporal)
                        </label>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            <input type="text" id="sec-guest-code-input" placeholder="Código (ej: INV-XXXXXX)" style="flex:1; min-width:170px; padding:0.65rem 0.85rem; border-radius:10px; border:1px solid var(--border, #cbd5e1); background:var(--bg-light, #f8fafc); color:var(--text-dark, #0f172a); font-size:0.9rem; text-transform:uppercase;" onkeydown="if(event.key==='Enter') window.__secLoginGuest();" />
                            <button type="button" onclick="window.__secLoginGuest()" style="padding:0.65rem 1.1rem; border-radius:10px; border:none; background:var(--accent-green, #27ae60); color:#fff; font-weight:700; cursor:pointer;">
                                Acceder
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function loginWithEmailAndKey(emailVal, keyVal, protocolToReload) {
        const email = String(emailVal || '').trim().toLowerCase();
        const key = String(keyVal || '').trim();
        if (!email || !email.includes('@')) {
            showAuthError('Introduce un correo electrónico válido.');
            return;
        }
        const sectionId = protocolToReload ? protocolToReload.section : '*';
        const rule = getRuleForSection(sectionId);
        if (!isEmailAuthorizedForRule(email, rule)) {
            showAuthError(`El correo "${email}" no está autorizado para acceder aquí.`);
            return;
        }
        const expectedKey = (rule && rule.accessKey) ? String(rule.accessKey).trim() : '';
        // El administrador puede entrar con la clave de la regla o con la clave maestra de admin (si existe)
        const cfg = ensureSecurityConfig();
        const adminKey = cfg.adminAccessKey ? String(cfg.adminAccessKey).trim() : '';
        const keyOk = !expectedKey || key === expectedKey || (isAdminEmail(email) && adminKey && key === adminKey);
        if (!keyOk) {
            showAuthError('La clave de acceso es incorrecta.');
            return;
        }
        saveSession({
            type: 'oauth',
            provider: 'Correo',
            email: email,
            name: email,
            expiresAt: Date.now() + 12 * 60 * 60 * 1000
        });
        if (window.__platformUnlockCallback) {
            const cb = window.__platformUnlockCallback;
            window.__platformUnlockCallback = null;
            togglePlatformChrome(true);
            cb();
        } else if (typeof window.loadProtocol === 'function' && protocolToReload) {
            window.loadProtocol(protocolToReload);
        } else {
            location.reload();
        }
    }

    window.checkPlatformSecurityGate = function (onSuccessCallback) {
        const rule = getRuleForSection('*');
        if (!rule) return true;

        const check = getActiveValidSessionForRule(rule, '*');
        if (check.ok) {
            window.__currentActiveSecuritySession = check.session;
            togglePlatformChrome(true);
            return true;
        }

        const mainColumn = document.querySelector('.main-col');
        if (!mainColumn) return false;

        togglePlatformChrome(false);
        window.__platformUnlockCallback = onSuccessCallback;
        window.__pendingProtectedProtocol = { section: '*', title: rule.label || 'Plataforma de Protocolos' };

        mainColumn.innerHTML = renderGateCardHtml(
            rule.label || 'Plataforma General (Recepción)',
            'Acceso Restringido',
            check.reason
        );
        return false;
    };

    window.checkProtocolSecurityGate = function (p) {
        if (!p) return true;
        const rule = getRuleForSection(p.section);
        if (!rule) return true;

        const check = getActiveValidSessionForRule(rule, p.section);
        if (check.ok) {
            window.__currentActiveSecuritySession = check.session;
            return true;
        }

        const mainColumn = document.querySelector('.main-col');
        if (!mainColumn) return false;

        window.__pendingProtectedProtocol = p;
        const cleanTitle = (p.title || 'Documento protegido').replace(/\{.*?\}/g, '').trim();

        mainColumn.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                <div class="back-btn" onclick="goBack()" style="margin-bottom:0;"><i class="fas fa-arrow-left"></i> Volver</div>
            </div>
            ${renderGateCardHtml(cleanTitle, 'Acceso Restringido · ' + (rule.label || 'Sección ' + p.section), check.reason)}
        `;
        return false;
    };

    window.__secLoginEmailKey = () => {
        const em = document.getElementById('sec-email-input');
        const ky = document.getElementById('sec-key-input');
        loginWithEmailAndKey(em ? em.value : '', ky ? ky.value : '', window.__pendingProtectedProtocol);
    };

    window.__secLoginGoogle = () => loginWithGoogle(window.__pendingProtectedProtocol);
    window.__secLoginMicrosoft = () => loginWithMicrosoft(window.__pendingProtectedProtocol);
    window.__secLoginGuest = () => {
        const inp = document.getElementById('sec-guest-code-input');
        loginWithGuestCode(inp ? inp.value : '', window.__pendingProtectedProtocol);
    };
    window.__secLogout = () => {
        clearSession();
        window.__currentActiveSecuritySession = null;
        if (window.__lastLoadedProtocol) {
            window.loadProtocol(window.__lastLoadedProtocol);
        } else {
            location.reload();
        }
    };

    window.getSecurityStatusBannerHtml = function (p) {
        if (!p || !getRuleForSection(p.section)) return '';
        const s = window.__currentActiveSecuritySession;
        if (!s) return '';
        window.__lastLoadedProtocol = p;
        const label = s.type === 'guest'
            ? `⏳ Pase Invitado (${s.label}) · Caduca: ${new Date(s.expiresAt).toLocaleString('es-ES')}`
            : (isAdminEmail(s.email)
                ? `👑 Administrador (${s.provider}): ${s.email}`
                : `🔓 Sesión autorizada (${s.provider}): ${s.email}`);
        return `
            <div style="display:flex; justify-content:flex-end; align-items:center; margin-bottom:0.65rem;">
                <div style="display:inline-flex; flex-wrap:wrap; align-items:center; gap:8px; padding:4px 12px; border-radius:999px; background:rgba(148,163,184,0.1); border:1px solid rgba(148,163,184,0.22); font-size:0.74rem; font-weight:500; color:var(--text-muted, #64748b);">
                    <span>${label}</span>
                    <span style="opacity:0.4;">·</span>
                    <button type="button" onclick="window.__secLogout()" style="padding:0; border:none; background:none; color:#94a3b8; font-weight:600; font-size:0.74rem; cursor:pointer; text-decoration:underline;" onmouseenter="this.style.color='#b22222'" onmouseleave="this.style.color='#94a3b8'">
                        Cerrar sesión
                    </button>
                </div>
            </div>
        `;
    };

    // ==================== PANEL DE ADMINISTRACIÓN ====================
    function generateGuestCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let out = 'INV-';
        for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
        return out;
    }

    function saveSecurityToAdminServer() {
        if (typeof window.saveToServer === 'function') {
            window.saveToServer(
                typeof window.adminProtocols !== 'undefined' ? window.adminProtocols : undefined
            );
        } else {
            alert('Configuración actualizada en memoria. Pulsa Sincronizar para guardar.');
        }
    }

    window.renderSecurityAdminTab = function () {
        const container = document.getElementById('security-admin-container');
        if (!container) return;
        const cfg = ensureSecurityConfig();
        const now = Date.now();
        const originHint = 'https://cumbriaspahotel.github.io';

        container.innerHTML = `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(420px, 1fr)); gap:20px; width:100%; box-sizing:border-box;">
                <!-- 1. REGLAS POR SECCIÓN -->
                <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
                    <h3 style="margin-top:0; color:#0a6aa1;"><i class="fas fa-shield-alt"></i> Reglas de Acceso por Sección</h3>
                    <p style="font-size:0.84rem; color:#64748b; margin-top:0;">Cada sección protegida tiene su propia clave de acceso y lista de correos autorizados.</p>

                    <div style="display:flex; flex-direction:column; gap:14px; margin-bottom:16px;">
                        ${cfg.rules.map((rule, rIdx) => `
                            <div style="border:1px solid #cbd5e1; border-radius:10px; padding:14px; background:#f8fafc;">
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:10px;">
                                    <div>
                                        <span style="background:#0a6aa1; color:white; padding:2px 8px; border-radius:6px; font-size:0.75rem; font-weight:800;">Sección ${rule.section}</span>
                                        <strong style="margin-left:6px; font-size:0.95rem; color:#0f172a;">${rule.label || ''}</strong>
                                    </div>
                                    <button type="button" onclick="window.__secAdminRemoveRule(${rIdx})" style="background:#fee2e2; color:#b91c1c; border:none; border-radius:6px; padding:4px 8px; cursor:pointer; font-size:0.75rem; font-weight:700;">Eliminar regla</button>
                                </div>
                                <div style="display:flex; gap:6px; align-items:center; margin-bottom:10px;">
                                    <label style="font-size:0.78rem; font-weight:700; color:#475569; white-space:nowrap;">🔑 Clave de acceso:</label>
                                    <input type="text" value="${rule.accessKey || ''}" placeholder="Sin clave" onchange="window.__secAdminUpdateKey(${rIdx}, this.value)" style="flex:1; padding:5px 8px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.84rem; font-family:monospace;">
                                </div>
                                <div style="display:flex; flex-direction:column; gap:5px; margin-bottom:8px;">
                                    ${(rule.allowedEmails || []).map((em, eIdx) => `
                                        <div style="display:flex; justify-content:space-between; align-items:center; background:white; border:1px solid #e2e8f0; border-radius:6px; padding:5px 10px; font-size:0.84rem;">
                                            <span><i class="fas fa-envelope" style="color:#0a6aa1; margin-right:6px;"></i> ${em}</span>
                                            <button type="button" onclick="window.__secAdminRemoveEmail(${rIdx}, ${eIdx})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:800;">×</button>
                                        </div>
                                    `).join('')}
                                </div>
                                <div style="display:flex; gap:6px;">
                                    <input type="email" id="sec-rule-email-${rIdx}" placeholder="Añadir correo autorizado..." style="flex:1; padding:6px 10px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.84rem;">
                                    <button type="button" class="btn-secondary" style="padding:6px 10px; font-size:0.82rem;" onclick="window.__secAdminAddEmail(${rIdx})">+ Añadir</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div style="border-top:1px dashed #cbd5e1; padding-top:12px;">
                        <label style="display:block; font-size:0.78rem; font-weight:700; color:#475569; margin-bottom:6px;">Añadir nueva sección protegida:</label>
                        <div style="display:flex; gap:6px; flex-wrap:wrap;">
                            <input type="text" id="sec-new-rule-section" placeholder="Sección (ej: 5.2 o 6.2.1)" style="width:140px; padding:7px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.84rem;">
                            <input type="text" id="sec-new-rule-label" placeholder="Nombre (ej: Manual Spa)" style="flex:1; min-width:140px; padding:7px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.84rem;">
                            <button type="button" class="btn-secondary" onclick="window.__secAdminAddRule()">+ Nueva Regla</button>
                        </div>
                    </div>
                </div>

                <!-- 2. ADMINISTRADORES Y CREDENCIALES OAUTH -->
                <div style="display:flex; flex-direction:column; gap:20px;">
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
                        <h3 style="margin-top:0; color:#b45309;"><i class="fas fa-crown"></i> Administradores (Acceso Total)</h3>
                        <p style="font-size:0.83rem; color:#64748b; margin-top:0;">Tienen acceso automático a todas las secciones protegidas (Recepción, Onity, Spa, etc.):</p>
                        <div style="display:flex; flex-direction:column; gap:5px; margin-bottom:10px;">
                            ${(cfg.adminEmails || []).map((em, aIdx) => `
                                <div style="display:flex; justify-content:space-between; align-items:center; background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:6px 10px; font-size:0.85rem;">
                                    <span><i class="fas fa-user-shield" style="color:#b45309; margin-right:6px;"></i> <strong>${em}</strong></span>
                                    <button type="button" onclick="window.__secAdminRemoveAdmin(${aIdx})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:800;">×</button>
                                </div>
                            `).join('')}
                        </div>
                        <div style="display:flex; gap:6px;">
                            <input type="email" id="sec-admin-new-admin" placeholder="Añadir correo administrador..." style="flex:1; padding:7px 10px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.84rem;">
                            <button type="button" class="btn-secondary" style="padding:7px 12px; font-size:0.82rem;" onclick="window.__secAdminAddAdmin()">+ Admin</button>
                        </div>
                    </div>

                    <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
                        <h3 style="margin-top:0; color:#0a6aa1;"><i class="fas fa-key"></i> OAuth Opcional (Google &amp; Microsoft)</h3>
                        <p style="font-size:0.82rem; color:#64748b; margin-top:0;">Solo necesario si en el futuro deseas activar inicio de sesión con botón de Google o Microsoft.</p>
                        <div style="margin-bottom:12px;">
                            <label style="display:block; font-size:0.8rem; font-weight:700; color:#475569; margin-bottom:4px;">Google OAuth Client ID</label>
                            <input type="text" id="sec-admin-google-id" value="${cfg.googleClientId}" placeholder="Opcional" style="width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.85rem; box-sizing:border-box;">
                        </div>
                        <div style="margin-bottom:14px;">
                            <label style="display:block; font-size:0.8rem; font-weight:700; color:#475569; margin-bottom:4px;">Microsoft Entra (Azure) Client ID</label>
                            <input type="text" id="sec-admin-ms-id" value="${cfg.microsoftClientId}" placeholder="Opcional" style="width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.85rem; box-sizing:border-box;">
                        </div>
                        <button type="button" class="btn-primary" style="width:100%;" onclick="window.__secAdminSaveOAuth()">
                            <i class="fas fa-save"></i> Guardar Toda la Configuración de Seguridad
                        </button>
                    </div>
                </div>
            </div>

            <!-- 3. GESTIÓN DE INVITADOS CON CADUCIDAD -->
            <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:24px; margin-top:20px; width:100%; box-sizing:border-box;">
                <h3 style="margin-top:0; color:#0a6aa1;"><i class="fas fa-user-clock"></i> Pases Temporales para Invitados (con Caducidad)</h3>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:12px; background:#f8fafc; padding:16px; border-radius:10px; border:1px solid #e2e8f0; margin-bottom:18px; align-items:end; width:100%; box-sizing:border-box;">
                    <div>
                        <label style="display:block; font-size:0.78rem; font-weight:700; color:#475569; margin-bottom:4px;">Nombre completo</label>
                        <input type="text" id="sec-guest-name" placeholder="Ej: Ana García" style="width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.85rem; box-sizing:border-box;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.78rem; font-weight:700; color:#475569; margin-bottom:4px;">Correo electrónico</label>
                        <input type="email" id="sec-guest-email" placeholder="Ej: invitado@empresa.com" style="width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.85rem; box-sizing:border-box;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.78rem; font-weight:700; color:#475569; margin-bottom:4px;">Motivo / Nota</label>
                        <input type="text" id="sec-guest-label" placeholder="Ej: Técnico / Apoyo Spa" style="width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.85rem; box-sizing:border-box;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.78rem; font-weight:700; color:#475569; margin-bottom:4px;">Acceso a Sección</label>
                        <select id="sec-guest-section" style="width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.85rem; box-sizing:border-box;">
                            ${cfg.rules.map(r => `<option value="${r.section}">${r.section} · ${r.label}</option>`).join('')}
                            <option value="*">Todas las secciones protegidas</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block; font-size:0.78rem; font-weight:700; color:#475569; margin-bottom:4px;">Duración</label>
                        <select id="sec-guest-duration" onchange="document.getElementById('sec-guest-custom-wrap').style.display = this.value==='custom' ? 'block' : 'none';" style="width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.85rem; box-sizing:border-box;">
                            <option value="2">2 horas</option>
                            <option value="24" selected>24 horas</option>
                            <option value="48">48 horas</option>
                            <option value="168">7 días</option>
                            <option value="720">30 días</option>
                            <option value="custom">Fecha y hora exacta...</option>
                        </select>
                    </div>
                    <div id="sec-guest-custom-wrap" style="display:none;">
                        <label style="display:block; font-size:0.78rem; font-weight:700; color:#475569; margin-bottom:4px;">Caduca el</label>
                        <input type="datetime-local" id="sec-guest-custom-date" style="width:100%; padding:7px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.85rem; box-sizing:border-box;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.78rem; font-weight:700; color:#475569; margin-bottom:4px;">Código</label>
                        <input type="text" id="sec-guest-code-new" value="${generateGuestCode()}" style="width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.85rem; text-transform:uppercase; box-sizing:border-box;">
                    </div>
                    <div>
                        <button type="button" class="btn-primary" style="width:100%; background:#27ae60; padding:9px 14px;" onclick="window.__secAdminCreateGuest()">
                            <i class="fas fa-plus"></i> Crear Pase
                        </button>
                    </div>
                </div>

                <div class="table-container" style="width:100%; overflow-x:auto;">
                    <table class="admin-table" style="width:100%;">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Correo</th>
                                <th>Motivo</th>
                                <th>Sección</th>
                                <th>Código</th>
                                <th>Caducidad</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cfg.guestPasses.length === 0 ? `
                                <tr><td colspan="8" style="text-align:center; color:#64748b; padding:18px;">No hay pases de invitado creados todavía.</td></tr>
                            ` : cfg.guestPasses.map((g, idx) => {
                                const expMs = new Date(g.expiresAt).getTime();
                                const isExpired = isNaN(expMs) || expMs <= now;
                                let statusBadge = '<span style="background:#dcfce7; color:#166534; padding:3px 8px; border-radius:999px; font-size:0.75rem; font-weight:700;">Activo</span>';
                                if (g.revoked) statusBadge = '<span style="background:#fee2e2; color:#991b1b; padding:3px 8px; border-radius:999px; font-size:0.75rem; font-weight:700;">Revocado</span>';
                                else if (isExpired) statusBadge = '<span style="background:#f1f5f9; color:#475569; padding:3px 8px; border-radius:999px; font-size:0.75rem; font-weight:700;">Caducado</span>';
                                return `
                                    <tr>
                                        <td><strong>${g.guestName || '—'}</strong></td>
                                        <td>${g.email ? `<a href="mailto:${g.email}" style="color:#0a6aa1; text-decoration:none;">${g.email}</a>` : '—'}</td>
                                        <td>${g.label || 'Invitado'}</td>
                                        <td><code>${g.section || '*'}</code></td>
                                        <td><code>${g.code}</code></td>
                                        <td>${new Date(g.expiresAt).toLocaleString('es-ES')}</td>
                                        <td>${statusBadge}</td>
                                        <td style="display:flex; gap:6px; flex-wrap:wrap;">
                                            <button type="button" class="btn-secondary" style="padding:4px 8px; font-size:0.78rem;" onclick="window.__secAdminCopyGuestLink('${g.code}', '${g.section || '6.2.1'}')"><i class="fas fa-link"></i> Copiar enlace</button>
                                            <button type="button" class="btn-secondary" style="padding:4px 8px; font-size:0.78rem;" onclick="window.__secAdminToggleRevoke(${idx})">${g.revoked ? 'Reactivar' : 'Revocar'}</button>
                                            <button type="button" class="btn-secondary" style="padding:4px 8px; font-size:0.78rem; background:#fee2e2; color:#b91c1c;" onclick="window.__secAdminDeleteGuest(${idx})"><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    };

    window.__secAdminAddAdmin = () => {
        const inp = document.getElementById('sec-admin-new-admin');
        const val = (inp ? inp.value : '').trim().toLowerCase();
        if (!val || !val.includes('@')) return;
        const cfg = ensureSecurityConfig();
        if (!cfg.adminEmails.includes(val)) cfg.adminEmails.push(val);
        window.renderSecurityAdminTab();
        saveSecurityToAdminServer();
    };
    window.__secAdminRemoveAdmin = (aIdx) => {
        ensureSecurityConfig().adminEmails.splice(aIdx, 1);
        window.renderSecurityAdminTab();
        saveSecurityToAdminServer();
    };
    window.__secAdminUpdateKey = (rIdx, newKey) => {
        const rule = ensureSecurityConfig().rules[rIdx];
        if (rule) rule.accessKey = String(newKey || '').trim();
        saveSecurityToAdminServer();
    };
    window.__secAdminAddRule = () => {
        const sec = (document.getElementById('sec-new-rule-section').value || '').trim();
        const label = (document.getElementById('sec-new-rule-label').value || '').trim() || ('Sección ' + sec);
        if (!sec) return;
        const cfg = ensureSecurityConfig();
        if (!cfg.rules.some(r => r.section === sec)) {
            cfg.rules.push({ section: sec, label, allowedEmails: [] });
        }
        window.renderSecurityAdminTab();
        saveSecurityToAdminServer();
    };
    window.__secAdminRemoveRule = (rIdx) => {
        ensureSecurityConfig().rules.splice(rIdx, 1);
        window.renderSecurityAdminTab();
        saveSecurityToAdminServer();
    };
    window.__secAdminAddEmail = (rIdx) => {
        const inp = document.getElementById(`sec-rule-email-${rIdx}`);
        const val = (inp ? inp.value : '').trim().toLowerCase();
        if (!val || !val.includes('@')) return;
        const rule = ensureSecurityConfig().rules[rIdx];
        if (rule && !rule.allowedEmails.includes(val)) rule.allowedEmails.push(val);
        window.renderSecurityAdminTab();
        saveSecurityToAdminServer();
    };
    window.__secAdminRemoveEmail = (rIdx, eIdx) => {
        const rule = ensureSecurityConfig().rules[rIdx];
        if (rule) rule.allowedEmails.splice(eIdx, 1);
        window.renderSecurityAdminTab();
        saveSecurityToAdminServer();
    };
    window.__secAdminSaveOAuth = () => {
        const cfg = ensureSecurityConfig();
        cfg.googleClientId = (document.getElementById('sec-admin-google-id').value || '').trim();
        cfg.microsoftClientId = (document.getElementById('sec-admin-ms-id').value || '').trim();
        saveSecurityToAdminServer();
    };
    window.__secAdminCreateGuest = () => {
        const cfg = ensureSecurityConfig();
        const guestName = (document.getElementById('sec-guest-name').value || '').trim();
        const email = (document.getElementById('sec-guest-email').value || '').trim().toLowerCase();
        const label = (document.getElementById('sec-guest-label').value || '').trim() || 'Invitado temporal';
        const section = document.getElementById('sec-guest-section').value || '6.2.1';
        const dur = document.getElementById('sec-guest-duration').value;
        const code = ((document.getElementById('sec-guest-code-new').value || '').trim() || generateGuestCode()).toUpperCase();
        let expiresAt;
        if (dur === 'custom') {
            const dt = document.getElementById('sec-guest-custom-date').value;
            if (!dt) { alert('Selecciona una fecha y hora de caducidad.'); return; }
            expiresAt = new Date(dt).toISOString();
        } else {
            expiresAt = new Date(Date.now() + Number(dur) * 3600 * 1000).toISOString();
        }
        cfg.guestPasses.unshift({
            id: 'g-' + Date.now(),
            guestName,
            email,
            label,
            section: section === '*' ? '*' : section,
            code,
            expiresAt,
            createdAt: new Date().toISOString(),
            revoked: false
        });
        window.renderSecurityAdminTab();
        saveSecurityToAdminServer();
    };
    window.__secAdminToggleRevoke = (idx) => {
        const g = ensureSecurityConfig().guestPasses[idx];
        if (g) g.revoked = !g.revoked;
        window.renderSecurityAdminTab();
        saveSecurityToAdminServer();
    };
    window.__secAdminDeleteGuest = (idx) => {
        ensureSecurityConfig().guestPasses.splice(idx, 1);
        window.renderSecurityAdminTab();
        saveSecurityToAdminServer();
    };
    window.__secAdminCopyGuestLink = (code, section) => {
        const targetSec = (!section || section === '*') ? '*' : section;
        const isSpa = targetSec === '5.2' || targetSec.startsWith('5.2.');
        const link = isSpa
            ? `https://cumbriaspahotel.github.io/Protocolo-Recep/spa.html?guest=${encodeURIComponent(code)}`
            : (targetSec === '*'
                ? `https://cumbriaspahotel.github.io/Protocolo-Recep/index.html?guest=${encodeURIComponent(code)}`
                : `https://cumbriaspahotel.github.io/Protocolo-Recep/index.html?guest=${encodeURIComponent(code)}#protocol/${encodeURIComponent(targetSec)}`);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link).then(() => {
                if (typeof window.showToast === 'function') window.showToast('🔗 Enlace de invitado copiado al portapapeles');
                else alert('Enlace copiado:\n' + link);
            });
        } else {
            prompt('Copia este enlace para el invitado:', link);
        }
    };
})();
