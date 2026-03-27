const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const open = require('open').default;
const multer = require('multer');

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
app.use(express.static(__dirname));
app.use(express.json({limit: '50mb'}));

app.post('/api/save', (req, res) => {
    try {
        const data = req.body;
        let jsContent = '';
        
        if (data.protocols) {
            jsContent += 'const protocols_data = ' + JSON.stringify(data.protocols, null, 2) + ';\n\n';
        }
        if (data.navConfig) {
            jsContent += 'const navigation_config = ' + JSON.stringify(data.navConfig, null, 2) + ';\n\n';
        }
        if (data.homeConfig) {
            jsContent += 'const home_config = ' + JSON.stringify(data.homeConfig, null, 2) + ';\n\n';
        }
        if (data.menusConfig) {
            jsContent += 'const menus_data = ' + JSON.stringify(data.menusConfig, null, 2) + ';\n\n';
        }

        if(!jsContent) {
           throw new Error("No hay datos para guardar");
        }

        fs.writeFileSync(path.join(__dirname, 'data.js'), jsContent, 'utf-8');
        res.json({ success: true, message: 'Datos guardados correctamente' });
    } catch (e) {
        console.error(e);
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

app.listen(PORT, () => {
    console.log(`🚀 Servidor de desarrollo iniciado en http://localhost:${PORT}/admin.html`);
    console.log('Mantén esta ventana abierta mientras editas.');
    open(`http://localhost:${PORT}/admin.html`);
});
