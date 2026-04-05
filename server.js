const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const open = require('open').default;
const multer = require('multer');
const nodemailer = require('nodemailer');
const https = require('https');

const app = express();
const PORT = 3000;

// Configurar almacenamiento de documentos
const uploadDir = path.join(__dirname, 'documentos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'documentos/');
    },
    filename: (req, file, cb) => {
        // Limpiar el nombre del archivo para evitar problemas con espacios o tildes
        const safeName = file.originalname.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, Date.now() + '-' + safeName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

app.use(cors());
app.use(express.json({limit: '50mb'}));

// Define API routes FIRST, then static files to avoid path collisions
app.post('/api/save', (req, res) => {
    try {
        const data = req.body;
        
        // ====================================================================
        // CRITICAL: Read EXISTING data.js first to preserve data not being sent.
        // The browser only sends what it's updating (e.g. cloudConfig).
        // We must NOT replace other sections with empty defaults.
        // ====================================================================
        let existing = { channels: [], protocols: [], nav: {}, home: {}, cloud: { scriptUrl: '', sheetId: '', geminiApiKey: '' }, menus: [] };
        
        const dataFilePath = path.join(__dirname, 'data.js');
        if (fs.existsSync(dataFilePath)) {
            try {
                const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
                // Parse each variable from the existing file using regex
                const extractVar = (varName) => {
                    // Match: var/const varName = <JSON>;
                    const regex = new RegExp(`(?:var|const|let)\\s+${varName}\\s*=\\s*([\\s\\S]*?);\\s*(?:(?:var|const|let)\\s|$)`, 'm');
                    const match = fileContent.match(regex);
                    if (match && match[1]) {
                        try { return JSON.parse(match[1].trim()); } catch(e) { return null; }
                    }
                    return null;
                };
                existing.channels = extractVar('channels_config') || [];
                existing.protocols = extractVar('protocols_data') || [];
                existing.nav = extractVar('navigation_config') || {};
                existing.home = extractVar('home_config') || {};
                existing.cloud = extractVar('cloud_config') || { scriptUrl: '', sheetId: '', geminiApiKey: '' };
                existing.menus = extractVar('menus_data') || [];
                console.log(`📖 Datos existentes leídos: ${existing.protocols.length} protocolos, ${existing.channels.length} canales`);
            } catch (parseErr) {
                console.warn('⚠️ No se pudo parsear data.js existente, se usarán valores del request:', parseErr.message);
            }
        }
        
        // Merge: use request data if provided AND non-empty, otherwise keep existing
        const hasData = (val) => val !== undefined && val !== null && (Array.isArray(val) ? val.length > 0 : Object.keys(val).length > 0);
        
        const channels = hasData(data.channelsConfig) ? data.channelsConfig : existing.channels;
        const protocols = hasData(data.protocols) ? data.protocols : existing.protocols;
        const nav = hasData(data.navConfig) ? data.navConfig : existing.nav;
        const home = hasData(data.homeConfig) ? data.homeConfig : existing.home;
        const menus = hasData(data.menusConfig) ? data.menusConfig : existing.menus;
        
        // Cloud config is special: always merge field-by-field so we don't lose the API key
        const cloud = { ...existing.cloud };
        if (data.cloudConfig) {
            if (data.cloudConfig.scriptUrl !== undefined) cloud.scriptUrl = data.cloudConfig.scriptUrl;
            if (data.cloudConfig.sheetId !== undefined) cloud.sheetId = data.cloudConfig.sheetId;
            if (data.cloudConfig.geminiApiKey !== undefined) cloud.geminiApiKey = data.cloudConfig.geminiApiKey;
        }

        let jsContent = '';
        jsContent += 'var channels_config = ' + JSON.stringify(channels, null, 2) + ';\n\n';
        jsContent += 'const protocols_data = ' + JSON.stringify(protocols, null, 2) + ';\n\n';
        jsContent += 'const navigation_config = ' + JSON.stringify(nav, null, 2) + ';\n\n';
        jsContent += 'const home_config = ' + JSON.stringify(home, null, 2) + ';\n\n';
        jsContent += 'var cloud_config = ' + JSON.stringify(cloud, null, 2) + ';\n\n';
        jsContent += 'const menus_data = ' + JSON.stringify(menus, null, 2) + ';\n\n';

        if(!jsContent || jsContent.length < 50) {
           throw new Error("Contenido generado insuficiente o vacío");
        }

        fs.writeFileSync(dataFilePath, jsContent, 'utf-8');
        console.log(`✅ data.js actualizado correctamente (${(jsContent.length / 1024).toFixed(0)} KB, ${protocols.length} protocolos, ${channels.length} canales)`);
        res.json({ success: true, message: 'Datos guardados correctamente' });
    } catch (e) {
        console.error('❌ Error al guardar:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No se ha seleccionado ningún archivo' });
        }
        
        console.log(`📁 Archivo subido: ${req.file.filename}`);
        res.json({ 
            success: true, 
            url: `documentos/${req.file.filename}`,
            name: req.file.originalname 
        });
    } catch (e) {
        console.error('❌ Error en upload:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// Configure Email Transporter (Mock or real if credentials provided)
// For now, it will log to console if no credentials, but ready to use.
const transporter = nodemailer.createTransport({
    // Example: Gmail (needs App Password)
    /*
    service: 'gmail',
    auth: {
        user: 'tu-email@gmail.com',
        pass: 'tu-password'
    }
    */
    host: 'localhost', // Placeholder
    port: 1025,
    ignoreTLS: true
});

async function sendCommentNotification(comment, pTitle) {
    const mailOptions = {
        from: '"Protocolo Recep" <no-reply@hotelguadiana.es>',
        to: 'comunicaciones@hotelguadiana.es',
        subject: `Nuevo Comentario en: ${pTitle}`,
        text: `Hola,\n\nSe ha recibido un nuevo comentario para el protocolo "${pTitle}".\n\nAutor: ${comment.author}\nComentario: ${comment.text}\n\nPuedes moderarlo en el panel de administración.\n\nSaludos.`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #0a6aa1;">Nuevo Comentario Recibido</h2>
                <p>Se ha recibido un nuevo comentario para el protocolo: <strong>${pTitle}</strong></p>
                <hr style="border: none; border-top: 1px solid #eee;">
                <p><strong>Autor:</strong> ${comment.author}</p>
                <p><strong>Comentario:</strong></p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; font-style: italic;">
                    "${comment.text}"
                </div>
                <p style="margin-top: 20px;">
                    <a href="http://localhost:3000/admin.html" style="background: #0a6aa1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ir al Panel de Administración</a>
                </p>
            </div>
        `
    };

    try {
        // Since we don't have real SMTP yet, we'll log it but try to send
        console.log(`📧 Intentando enviar correo a comunicaciones@hotelguadiana.es...`);
        // await transporter.sendMail(mailOptions); // Uncomment when credentials are set
        console.log(`✅ Aviso de correo preparado para: ${comment.author}`);
    } catch (error) {
        console.error('❌ Error enviando email:', error);
    }
}

app.get('/api/comments/all', (req, res) => {
    try {
        const commentsFile = path.join(__dirname, 'comments_internal.json');
        if (!fs.existsSync(commentsFile)) {
            return res.json([]);
        }
        const data = JSON.parse(fs.readFileSync(commentsFile, 'utf-8'));
        res.json(data);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/comments/submit', (req, res) => {
    try {
        const { pId, pTitle, author, text } = req.body;
        const commentsFile = path.join(__dirname, 'comments_internal.json');
        let comments = [];
        if (fs.existsSync(commentsFile)) {
            comments = JSON.parse(fs.readFileSync(commentsFile, 'utf-8'));
        }

        const newComment = {
            id: Date.now(),
            pId,
            pTitle,
            author,
            text,
            date: req.body.date || new Date().toISOString(),
            status: 'pending', // Requires admin approval
            reply: null
        };

        comments.push(newComment);
        fs.writeFileSync(commentsFile, JSON.stringify(comments, null, 2), 'utf-8');
        
        // Notify by email
        sendCommentNotification(newComment, pTitle);

        res.json({ success: true, message: 'Comentario enviado y pendiente de revisión' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/comments/moderate', (req, res) => {
    try {
        const { commentId, action, replyText } = req.body;
        const commentsFile = path.join(__dirname, 'comments_internal.json');
        if (!fs.existsSync(commentsFile)) {
            return res.status(404).json({ success: false, message: 'No hay comentarios' });
        }

        let comments = JSON.parse(fs.readFileSync(commentsFile, 'utf-8'));
        const index = comments.findIndex(c => c.id === commentId);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Comentario no encontrado' });
        }

        if (action === 'approve') {
            comments[index].status = 'approved';
            if (replyText) comments[index].reply = replyText;
        } else if (action === 'delete') {
            comments.splice(index, 1);
        } else if (action === 'reply') {
            comments[index].reply = replyText;
        } else if (action === 'reject') {
            comments[index].status = 'rejected';
        }

        fs.writeFileSync(commentsFile, JSON.stringify(comments, null, 2), 'utf-8');

        // Update the public comments.js file with only approved comments
        const approvedComments = comments.filter(c => c.status === 'approved');
        const jsContent = `const comments_data = ${JSON.stringify(approvedComments, null, 2)};\n`;
        fs.writeFileSync(path.join(__dirname, 'comments.js'), jsContent, 'utf-8');

        res.json({ success: true, message: 'Operación realizada correctamente' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Manual Admin Entry for comments received via email
app.post('/api/comments/create-manual', (req, res) => {
    try {
        const { pId, pTitle, author, text, date } = req.body;
        const commentsFile = path.join(__dirname, 'comments_internal.json');
        let comments = [];
        if (fs.existsSync(commentsFile)) {
            comments = JSON.parse(fs.readFileSync(commentsFile, 'utf-8'));
        }

        const newComment = {
            id: Date.now(),
            pId,
            pTitle,
            author,
            text,
            date: date || new Date().toISOString(),
            status: 'approved', // Automatically approved because it's from manual admin entry
            reply: null
        };

        comments.push(newComment);
        fs.writeFileSync(commentsFile, JSON.stringify(comments, null, 2), 'utf-8');

        // Update public file
        const approvedComments = comments.filter(c => c.status === 'approved');
        const jsContent = `const comments_data = ${JSON.stringify(approvedComments, null, 2)};\n`;
        fs.writeFileSync(path.join(__dirname, 'comments.js'), jsContent, 'utf-8');

        res.json({ success: true, message: 'Comentario registrado manualmente y publicado' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

const { exec } = require('child_process');

app.post('/api/publish', (req, res) => {
    const commitMsg = `Update protocols: ${new Date().toLocaleString()}`;
    // Usamos comandos por separado para gestionar mejor los errores
    const add = 'git add .';
    const commit = `git commit -m "${commitMsg}"`;
    const push = 'git push origin main';
    
    console.log('🚀 Iniciando publicación en GitHub...');
    
    exec(add, { cwd: __dirname }, (err) => {
        // El commit puede fallar si no hay cambios, lo cual es normal
        exec(commit, { cwd: __dirname }, (commitErr, stdout) => {
            if (commitErr && !stdout.includes('nothing to commit')) {
                console.error(`❌ Error en Commit: ${commitErr.message}`);
                return res.status(500).json({ success: false, message: 'Error en commit: ' + commitErr.message });
            }
            
            // Intentar el push
            exec(push, { cwd: __dirname }, (pushErr, pushStdout, pushStderr) => {
                if (pushErr) {
                    console.error(`❌ Error en Push: ${pushStderr || pushErr.message}`);
                    return res.status(500).json({ success: false, message: 'Error en conexión con GitHub. Revisa tu internet: ' + (pushStderr || pushErr.message) });
                }
                console.log(`✅ GitHub actualizado correctamente.`);
                res.json({ success: true, message: 'Publicado en GitHub correctamente' });
            });
        });
    });
});

// Proxy para sincronización con Google Sheets (evita CORS desde localhost)
app.get('/api/sync-cloud', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).json({ success: false, message: 'Falta el parámetro url' });
    }
    // Only allow Google Apps Script URLs for security
    if (!targetUrl.startsWith('https://script.google.com/')) {
        return res.status(403).json({ success: false, message: 'URL no permitida' });
    }
    try {
        const fetchData = (url) => new Promise((resolve, reject) => {
            const client = url.startsWith('https') ? https : http;
            client.get(url, { headers: { 'Accept': 'application/json, text/csv, text/plain' } }, (response) => {
                // Follow redirects (Google Apps Script always redirects)
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    const redirectUrl = response.headers.location;
                    console.log(`📡 Siguiendo redirección a: ${redirectUrl.substring(0, 100)}...`);
                    return resolve(fetchData(redirectUrl));
                }
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    console.log(`🌐 Respuesta recibida (${response.statusCode}). Tamaño: ${data.length} chars.`);
                    
                    // Attempt JSON parse
                    try { 
                        return resolve(JSON.parse(data)); 
                    } catch(e) { 
                        // If JSON fails, check if it looks like CSV
                        if (data.includes(',') && data.includes('\n')) {
                            console.log('📄 Detectada posible respuesta CSV, par seando...');
                            return resolve(parseCSV(data));
                        }
                        
                        console.error('❌ Error parseando respuesta de Google.');
                        console.error(data.substring(0, 500)); 
                        reject(new Error('La respuesta no es JSON ni CSV válido. Revisa los permisos del documento.')); 
                    }
                });
            }).on('error', reject);
        });

        // Simple CSV Parser: Assumes headers: pId, pTitle, author, text, date
        function parseCSV(csv) {
            const lines = csv.split(/\r?\n/).filter(line => line.trim());
            if (lines.length < 2) return [];
            
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            return lines.slice(1).map(line => {
                // Simple split by comma (doesn't handle commas inside quotes, but better than nothing for now)
                // A better regex for CSV split: /,(?=(?:(?:[^"]*"){2})*[^"]*$)/
                const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
                const obj = {};
                headers.forEach((h, i) => {
                    obj[h === 'timestamp' ? 'date' : h] = values[i];
                });
                return obj;
            });
        }
        
        const cloudData = await fetchData(targetUrl);
        console.log(`☁️ Sync cloud: ${Array.isArray(cloudData) ? cloudData.length : '?'} registros obtenidos`);
        res.json(cloudData);
    } catch (e) {
        console.error('❌ Error en sync-cloud proxy:', e.message);
        res.status(502).json({ success: false, message: 'Error al conectar con la nube: ' + e.message });
    }
});

// Middleware para archivos estáticos al FINAL
app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`🚀 Servidor de desarrollo iniciado en http://localhost:${PORT}/admin.html`);
    console.log('Mantén esta ventana abierta mientras editas.');
    open(`http://localhost:${PORT}/admin.html`);
});
