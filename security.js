/**
 * Módulo de Seguridad y Control de Accesos por Sección (OAuth Google / Microsoft + Invitados con caducidad)
 * Gestionado desde admin.html -> Pestaña "Seguridad y Accesos" y guardado en data.js (security_config).
 */
(function () {
    const SESSION_KEY = 'protocolo_security_session_v1';

    function getDefaultSecurityConfig() {
        return {
            rules: [
                {
                    section: '6.2.1',
                    label: 'Manual Interactivo Onity',
                    allowedEmails: [
                        'hcumbri@gmail.com',
                        'hotelguad@gmail.com',
                        'comunicaciones@hotelguadiana.es'
                    ]
                },
                {
                    section: '5.2',
                    label: 'Cumbria Bienestar (Spa)',
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
                return prot && (s === prot || s.startsWith(prot + '.'));
            })
            .sort((a, b) => String(b.section).length - String(a.section).length);
        return matches[0] || null;
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
                    const s = {
                        type: 'guest',
                        code: pass.code,
                        label: pass.label || 'Invitado',
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
            const allowed = (rule.allowedEmails || []).some(e => String(e).trim().toLowerCase() === email);
            if (!allowed) {
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
                        const allowed = rule && (rule.allowedEmails || []).some(e => String(e).trim().toLowerCase() === email);
                        if (!allowed) {
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
                        if (typeof window.loadProtocol === 'function' && protocolToReload) {
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
            const allowed = rule && (rule.allowedEmails || []).some(e => String(e).trim().toLowerCase() === email);
            if (!allowed) {
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
            if (typeof window.loadProtocol === 'function' && protocolToReload) {
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
        if (typeof window.loadProtocol === 'function' && protocolToReload) {
            window.loadProtocol(protocolToReload);
        } else {
            location.reload();
        }
    }

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
            <div style="max-width:560px; margin:2rem auto; background:var(--white, #fff); border:1px solid var(--border, #e2e8f0); border-radius:18px; box-shadow:var(--shadow, 0 12px 30px rgba(0,0,0,0.08)); overflow:hidden; color:var(--text-dark, #0f172a);">
                <div style="height:6px; background:linear-gradient(90deg, var(--accent-blue, #0a6aa1), #a58c5f, var(--accent-green, #27ae60));"></div>
                <div style="padding:2rem;">
                    <div style="display:flex; align-items:center; gap:14px; margin-bottom:1.25rem;">
                        <div style="width:52px; height:52px; border-radius:14px; background:rgba(10,106,161,0.12); color:var(--accent-blue, #0a6aa1); display:flex; align-items:center; justify-content:center; font-size:1.5rem; flex-shrink:0;">
                            <i class="fas fa-lock"></i>
                        </div>
                        <div>
                            <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:var(--accent-blue, #0a6aa1);">Acceso Restringido · ${rule.label || 'Sección ' + p.section}</span>
                            <h2 style="margin:2px 0 0; font-size:1.35rem; font-weight:800;">${cleanTitle}</h2>
                        </div>
                    </div>

                    <p style="font-size:0.92rem; color:var(--text-muted, #475569); margin:0 0 1.25rem; line-height:1.55;">
                        Este contenido requiere iniciar sesión con una cuenta autorizada (<strong>Google</strong> o <strong>Microsoft</strong>) o introducir un <strong>pase temporal de invitado</strong>.
                    </p>

                    <div id="sec-gate-error" style="${check.reason ? 'display:block;' : 'display:none;'} margin-bottom:1rem; padding:0.8rem 1rem; border-radius:10px; background:rgba(178,34,34,0.1); border-left:4px solid #b22222; color:#b22222; font-size:0.88rem; font-weight:600;">${check.reason || ''}</div>

                    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:1.5rem;">
                        <button type="button" onclick="window.__secLoginGoogle()" style="display:flex; align-items:center; justify-content:center; gap:10px; width:100%; padding:0.85rem 1rem; border-radius:12px; border:1px solid var(--border, #cbd5e1); background:var(--bg-light, #f8fafc); color:var(--text-dark, #0f172a); font-weight:700; font-size:0.95rem; cursor:pointer;">
                            <i class="fab fa-google" style="color:#ea4335; font-size:1.1rem;"></i> Iniciar sesión con Google
                        </button>
                        <button type="button" onclick="window.__secLoginMicrosoft()" style="display:flex; align-items:center; justify-content:center; gap:10px; width:100%; padding:0.85rem 1rem; border-radius:12px; border:1px solid var(--border, #cbd5e1); background:var(--bg-light, #f8fafc); color:var(--text-dark, #0f172a); font-weight:700; font-size:0.95rem; cursor:pointer;">
                            <i class="fab fa-microsoft" style="color:#00a4ef; font-size:1.1rem;"></i> Iniciar sesión con Microsoft
                        </button>
                    </div>

                    <div style="border-top:1px dashed var(--border, #cbd5e1); padding-top:1.25rem;">
                        <label style="display:block; font-size:0.8rem; font-weight:800; text-transform:uppercase; color:var(--text-muted, #475569); margin-bottom:8px;">
                            <i class="fas fa-ticket-alt"></i> Acceso para Invitados (Pase Temporal)
                        </label>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            <input type="text" id="sec-guest-code-input" placeholder="Introduce código (ej: INV-XXXXXX)" style="flex:1; min-width:180px; padding:0.7rem 0.9rem; border-radius:10px; border:1px solid var(--border, #cbd5e1); background:var(--bg-light, #f8fafc); color:var(--text-dark, #0f172a); font-size:0.92rem; text-transform:uppercase;" onkeydown="if(event.key==='Enter') window.__secLoginGuest();" />
                            <button type="button" onclick="window.__secLoginGuest()" style="padding:0.7rem 1.2rem; border-radius:10px; border:none; background:var(--accent-blue, #0a6aa1); color:#fff; font-weight:700; cursor:pointer;">
                                Acceder
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return false;
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
            : `🔓 Sesión autorizada (${s.provider}): ${s.email}`;
        return `
            <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px; padding:0.65rem 1rem; margin-bottom:1rem; border-radius:10px; background:rgba(39,174,96,0.1); border:1px solid rgba(39,174,96,0.3); font-size:0.84rem; font-weight:600; color:var(--text-dark, #0f172a);">
                <span>${label}</span>
                <button type="button" onclick="window.__secLogout()" style="padding:4px 10px; border-radius:6px; border:1px solid rgba(178,34,34,0.35); background:rgba(178,34,34,0.08); color:#b22222; font-weight:700; font-size:0.78rem; cursor:pointer;">
                    Cerrar sesión
                </button>
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
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(360px, 1fr)); gap:20px;">
                <!-- 1. REGLAS POR SECCIÓN -->
                <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
                    <h3 style="margin-top:0; color:#0a6aa1;"><i class="fas fa-shield-alt"></i> Reglas de Acceso por Sección</h3>
                    <p style="font-size:0.84rem; color:#64748b; margin-top:0;">Cada sección protegida tiene su propia lista de correos autorizados (Google / Microsoft).</p>

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
                                <div style="display:flex; flex-direction:column; gap:5px; margin-bottom:8px;">
                                    ${(rule.allowedEmails || []).map((em, eIdx) => `
                                        <div style="display:flex; justify-content:space-between; align-items:center; background:white; border:1px solid #e2e8f0; border-radius:6px; padding:5px 10px; font-size:0.84rem;">
                                            <span><i class="fas fa-envelope" style="color:#0a6aa1; margin-right:6px;"></i> ${em}</span>
                                            <button type="button" onclick="window.__secAdminRemoveEmail(${rIdx}, ${eIdx})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:800;">×</button>
                                        </div>
                                    `).join('')}
                                </div>
                                <div style="display:flex; gap:6px;">
                                    <input type="email" id="sec-rule-email-${rIdx}" placeholder="Añadir correo (Google o Microsoft)..." style="flex:1; padding:6px 10px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.84rem;">
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

                <!-- 2. CREDENCIALES OAUTH -->
                <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
                    <h3 style="margin-top:0; color:#0a6aa1;"><i class="fas fa-key"></i> Credenciales OAuth (Google &amp; Microsoft)</h3>
                    <div style="margin-bottom:12px;">
                        <label style="display:block; font-size:0.8rem; font-weight:700; color:#475569; margin-bottom:4px;">Google OAuth Client ID</label>
                        <input type="text" id="sec-admin-google-id" value="${cfg.googleClientId}" placeholder="1234567890-xxxx.apps.googleusercontent.com" style="width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.85rem;">
                    </div>
                    <div style="margin-bottom:14px;">
                        <label style="display:block; font-size:0.8rem; font-weight:700; color:#475569; margin-bottom:4px;">Microsoft Entra (Azure) Client ID</label>
                        <input type="text" id="sec-admin-ms-id" value="${cfg.microsoftClientId}" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" style="width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.85rem;">
                    </div>
                    <details style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 12px; font-size:0.82rem; color:#475569; margin-bottom:16px;">
                        <summary style="cursor:pointer; font-weight:700; color:#0a6aa1;">¿Cómo obtener los Client IDs? (3 minutos)</summary>
                        <ul style="margin:8px 0 0; padding-left:18px; line-height:1.5;">
                            <li><strong>Google:</strong> Google Cloud Console &gt; APIs y servicios &gt; Credenciales &gt; ID de cliente OAuth (Aplicación web) &gt; Origen autorizado: <code>${originHint}</code></li>
                            <li><strong>Microsoft:</strong> Azure Portal (portal.azure.com) &gt; Microsoft Entra ID &gt; Registros de aplicaciones &gt; Nuevo registro &gt; URI de redirección SPA: <code>${originHint}/Protocolo-Recep/index.html</code></li>
                        </ul>
                    </details>
                    <button type="button" class="btn-primary" style="width:100%;" onclick="window.__secAdminSaveOAuth()">
                        <i class="fas fa-save"></i> Guardar Toda la Configuración de Seguridad
                    </button>
                </div>
            </div>

            <!-- 3. GESTIÓN DE INVITADOS CON CADUCIDAD -->
            <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin-top:20px;">
                <h3 style="margin-top:0; color:#0a6aa1;"><i class="fas fa-user-clock"></i> Pases Temporales para Invitados (con Caducidad)</h3>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:10px; background:#f8fafc; padding:14px; border-radius:10px; border:1px solid #e2e8f0; margin-bottom:16px; align-items:end;">
                    <div>
                        <label style="display:block; font-size:0.78rem; font-weight:700; color:#475569; margin-bottom:4px;">Motivo / Invitado</label>
                        <input type="text" id="sec-guest-label" placeholder="Ej: Técnico / Apoyo Spa" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.85rem;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.78rem; font-weight:700; color:#475569; margin-bottom:4px;">Acceso a Sección</label>
                        <select id="sec-guest-section" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.85rem;">
                            ${cfg.rules.map(r => `<option value="${r.section}">${r.section} · ${r.label}</option>`).join('')}
                            <option value="*">Todas las secciones protegidas</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block; font-size:0.78rem; font-weight:700; color:#475569; margin-bottom:4px;">Duración</label>
                        <select id="sec-guest-duration" onchange="document.getElementById('sec-guest-custom-wrap').style.display = this.value==='custom' ? 'block' : 'none';" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.85rem;">
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
                        <input type="datetime-local" id="sec-guest-custom-date" style="width:100%; padding:7px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.85rem;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.78rem; font-weight:700; color:#475569; margin-bottom:4px;">Código</label>
                        <input type="text" id="sec-guest-code-new" value="${generateGuestCode()}" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.85rem; text-transform:uppercase;">
                    </div>
                    <div>
                        <button type="button" class="btn-primary" style="width:100%; background:#27ae60;" onclick="window.__secAdminCreateGuest()">
                            <i class="fas fa-plus"></i> Crear Pase
                        </button>
                    </div>
                </div>

                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Invitado / Motivo</th>
                                <th>Sección</th>
                                <th>Código</th>
                                <th>Caducidad</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cfg.guestPasses.length === 0 ? `
                                <tr><td colspan="6" style="text-align:center; color:#64748b; padding:18px;">No hay pases de invitado creados todavía.</td></tr>
                            ` : cfg.guestPasses.map((g, idx) => {
                                const expMs = new Date(g.expiresAt).getTime();
                                const isExpired = isNaN(expMs) || expMs <= now;
                                let statusBadge = '<span style="background:#dcfce7; color:#166534; padding:3px 8px; border-radius:999px; font-size:0.75rem; font-weight:700;">Activo</span>';
                                if (g.revoked) statusBadge = '<span style="background:#fee2e2; color:#991b1b; padding:3px 8px; border-radius:999px; font-size:0.75rem; font-weight:700;">Revocado</span>';
                                else if (isExpired) statusBadge = '<span style="background:#f1f5f9; color:#475569; padding:3px 8px; border-radius:999px; font-size:0.75rem; font-weight:700;">Caducado</span>';
                                return `
                                    <tr>
                                        <td><strong>${g.label || 'Invitado'}</strong></td>
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
        const targetSec = (!section || section === '*') ? '6.2.1' : section;
        const hash = targetSec === '5.2' ? '#protocol/5.2.1' : `#protocol/${encodeURIComponent(targetSec)}`;
        const link = `https://cumbriaspahotel.github.io/Protocolo-Recep/index.html?guest=${encodeURIComponent(code)}${hash}`;
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
