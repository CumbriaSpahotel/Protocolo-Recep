const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const open = require('open');
const multer = require('multer');
const nodemailer = require('nodemailer');
const https = require('https');

const app = express();
const PORT = 3001;

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

// Cargar variables de entorno desde .env si existe
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join('=').trim();
            }
        });
    }
}
loadEnv();

// Define API routes FIRST, then static files to avoid path collisions
app.post('/api/save', (req, res) => {
    try {
        const data = req.body;
        
        // ====================================================================
        // CRITICAL: Read EXISTING data.js first to preserve data not being sent.
        // ====================================================================
        let existing = { channels: [], protocols: [], nav: {}, home: {}, cloud: { scriptUrl: '', sheetId: '', geminiApiKey: '' }, menus: [] };
        
        const dataFilePath = path.join(__dirname, 'data.js');
        if (fs.existsSync(dataFilePath)) {
            try {
                // CRITICAL: Strip UTF-8 BOM if present to avoid JSON.parse failures
                let fileContent = fs.readFileSync(dataFilePath, 'utf-8');
                if (fileContent.charCodeAt(0) === 0xFEFF) {
                    fileContent = fileContent.slice(1);
                    console.warn('⚠️ BOM detectado en data.js y eliminado para lectura correcta');
                }
                const extractVar = (varName) => {
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
            } catch (parseErr) {
                console.warn('⚠️ Error parseando data.js:', parseErr.message);
            }
        }
        
        const isSet = (val) => val !== undefined && val !== null;
        const channels = isSet(data.channelsConfig) ? data.channelsConfig : existing.channels;
        const protocols = isSet(data.protocols) ? data.protocols : existing.protocols;
        const nav = isSet(data.navConfig) ? data.navConfig : existing.nav;
        const home = isSet(data.homeConfig) ? data.homeConfig : existing.home;
        const menus = isSet(data.menusConfig) ? data.menusConfig : existing.menus;
        
        // Cloud config merge
        const cloud = { ...existing.cloud };
        if (data.cloudConfig) {
            if (data.cloudConfig.scriptUrl !== undefined) cloud.scriptUrl = data.cloudConfig.scriptUrl;
            if (data.cloudConfig.sheetId !== undefined) cloud.sheetId = data.cloudConfig.sheetId;
            
            // SECURITY: If geminiApiKey is provided, save it to .env, NOT data.js
            if (data.cloudConfig.geminiApiKey !== undefined && data.cloudConfig.geminiApiKey.trim() !== "") {
                const newKey = data.cloudConfig.geminiApiKey.trim();
                const envPath = path.join(__dirname, '.env');
                let envLines = [];
                if (fs.existsSync(envPath)) {
                    envLines = fs.readFileSync(envPath, 'utf-8').split('\n');
                }
                
                let found = false;
                const newEnvLines = envLines.map(line => {
                    if (line.startsWith('GEMINI_API_KEY=')) {
                        found = true;
                        return `GEMINI_API_KEY=${newKey}`;
                    }
                    return line;
                });
                
                if (!found) {
                    newEnvLines.push(`GEMINI_API_KEY=${newKey}`);
                }
                
                fs.writeFileSync(envPath, newEnvLines.join('\n'), 'utf-8');
                process.env.GEMINI_API_KEY = newKey;
                console.log('🔐 Gemini API Key guardada de forma segura en .env');
            }
        }
        
        // ALWAYS keep geminiApiKey empty in data.js to prevent leaks
        cloud.geminiApiKey = "";

        let jsContent = '';
        jsContent += 'var channels_config = ' + JSON.stringify(channels, null, 2) + ';\n\n';
        jsContent += 'const protocols_data = ' + JSON.stringify(protocols, null, 2) + ';\n\n';
        jsContent += 'const navigation_config = ' + JSON.stringify(nav, null, 2) + ';\n\n';
        jsContent += 'const home_config = ' + JSON.stringify(home, null, 2) + ';\n\n';
        jsContent += 'var cloud_config = ' + JSON.stringify(cloud, null, 2) + ';\n\n';
        jsContent += 'const menus_data = ' + JSON.stringify(menus, null, 2) + ';\n\n';

        // Write without BOM - always use plain UTF-8
        fs.writeFileSync(dataFilePath, jsContent, { encoding: 'utf8' });

        // Compilar Tailwind CSS en segundo plano tras actualizar data.js
        try {
            const { exec } = require('child_process');
            exec('npx tailwindcss -i input.css -o tailwind.css', { cwd: __dirname }, (err, stdout, stderr) => {
                if (err) {
                    console.error('⚠️ Error al compilar Tailwind CSS:', err);
                } else {
                    console.log('⚡ Tailwind CSS compilado correctamente tras guardado');
                }
            });
        } catch (tailwindErr) {
            console.error('⚠️ Error iniciando compilación de Tailwind:', tailwindErr.message);
        }

        res.json({ success: true, message: 'Datos guardados correctamente (Secrets en .env)' });
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
    
    exec(add, { cwd: __dirname }, (addErr) => {
        if (addErr) {
            console.error(`❌ Error en Git Add: ${addErr.message}`);
            return res.status(500).json({ success: false, message: 'Error preparando archivos: ' + addErr.message });
        }

        exec(commit, { cwd: __dirname }, (commitErr, stdout) => {
            // El commit puede fallar si no hay cambios, lo cual es normal
            if (commitErr && !stdout.includes('nothing to commit') && !stdout.includes('nada para hacer')) {
                console.error(`❌ Error en Git Commit: ${commitErr.message}`);
                return res.status(500).json({ success: false, message: 'Error guardando cambios localmente: ' + commitErr.message });
            }
            
            // Intentar el pull primero para evitar conflictos de "fetch first"
            // Usamos --no-rebase o --rebase dependiendo de la preferencia, 
            // pero --rebase es más limpio si no hay conflictos reales.
            const pull = 'git pull origin main --rebase';
            exec(pull, { cwd: __dirname }, (pullErr, pullStdout, pullStderr) => {
                if (pullErr) {
                    console.error(`❌ Error en Git Pull: ${pullStderr || pullErr.message}`);
                    return res.status(500).json({ success: false, message: 'Error sincronizando con GitHub (Pull). Prueba de nuevo en unos segundos: ' + (pullStderr || pullErr.message) });
                }

                // Intentar el push
                exec(push, { cwd: __dirname }, (pushErr, pushStdout, pushStderr) => {
                    if (pushErr) {
                        console.error(`❌ Error en Git Push: ${pushStderr || pushErr.message}`);
                        return res.status(500).json({ success: false, message: 'Error subiendo a GitHub (Push). Revisa tu internet: ' + (pushStderr || pushErr.message) });
                    }
                    console.log(`✅ GitHub actualizado correctamente.`);
                    res.json({ success: true, message: 'Publicado en GitHub correctamente' });
                });
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
    if (!targetUrl.startsWith('https://script.google.com/')) {
        return res.status(403).json({ success: false, message: 'URL no permitida' });
    }
    try {
        const fetchData = (url) => new Promise((resolve, reject) => {
            const client = url.startsWith('https') ? https : http;
            client.get(url, { headers: { 'Accept': 'application/json, text/csv, text/plain' } }, (response) => {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    return resolve(fetchData(response.headers.location));
                }
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    try { resolve(JSON.parse(data)); } 
                    catch(e) { 
                        if (data.includes(',') && data.includes('\n')) resolve(parseCSV(data));
                        else reject(new Error('Formato no válido'));
                    }
                });
            }).on('error', reject);
        });

        function parseCSV(csv) {
            const lines = csv.split(/\r?\n/).filter(line => line.trim());
            if (lines.length < 2) return [];
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            return lines.slice(1).map(line => {
                const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
                const obj = {};
                headers.forEach((h, i) => { obj[h === 'timestamp' ? 'date' : h] = values[i]; });
                return obj;
            });
        }
        res.json(await fetchData(targetUrl));
    } catch (e) {
        res.status(502).json({ success: false, message: e.message });
    }
});

// Chatbot AI Proxy Endpoint (Hides API Key and follows Google's safety rules)
app.post('/api/chat', async (req, res) => {
    console.log(`[${new Date().toLocaleTimeString()}] 🤖 Chatbot Request Received`);
    try {
        const { contents, generationConfig, safetySettings } = req.body;
        
        // 1. Get API Key - Prioritize environment variable, then fallback to data.js
        let apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            const dataFilePath = path.join(__dirname, 'data.js');
            if (fs.existsSync(dataFilePath)) {
                const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
                const keyMatch = fileContent.match(/"geminiApiKey":\s*"([^"]+)"/);
                if (keyMatch) apiKey = keyMatch[1];
            }
        }

        if (!apiKey) {
            console.error('❌ No se encontró geminiApiKey en data.js');
            return res.status(401).json({ error: { message: "No se ha configurado ninguna Gemini API Key en el panel de administración." } });
        }

        // 2. Perform the request from the server side
        const apiUri = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const geminiRes = await fetch(apiUri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents, generationConfig, safetySettings })
        });

        const data = await geminiRes.json();
        
        if (!geminiRes.ok) {
            console.error('❌ Error de la API de Gemini:', data);
        }

        res.status(geminiRes.status).json(data);

    } catch (e) {
        console.error('❌ Error in AI Proxy:', e);
        res.status(500).json({ error: { message: 'Error interno en el servidor de IA: ' + e.message } });
    }
});

// Explicitly handle other methods for /api/chat to avoid generic 405s from proxy/static
app.all('/api/chat', (req, res) => {
    res.status(405).json({ error: { message: `Método ${req.method} no permitido en esta ruta.` } });
});

// Middleware para archivos estáticos al FINAL
app.use(express.static(__dirname));

const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor de desarrollo iniciado en http://localhost:${PORT}/admin.html`);
    console.log('Mantén esta ventana abierta mientras editas.');
    console.log('----------------------------------------------------------');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ ERROR: El puerto ${PORT} ya está siendo usado por otro programa.`);
    } else {
        console.error('❌ Error en el servidor:', err);
    }
});

// Manejadores de errores globales para depuración
process.on('uncaughtException', (err) => {
    console.error('❌ EXCEPCIÓN NO CAPTURADA:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ RECHAZO DE PROMESA NO CAPTURADO:', reason);
});
