const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const open = require('open');

const app = express();
const PORT = 3000;

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
});
