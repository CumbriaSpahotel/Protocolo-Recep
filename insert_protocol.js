const fs = require('fs');

const filePath = 'c:\\Users\\comun\\Documents\\GitHub\\Operativa recepcion\\data.js';
const text = fs.readFileSync(filePath, 'utf-8');

const prefix = 'const protocols_data = ';
if (text.startsWith(prefix)) {
    let jsonText = text.substring(prefix.length).trim();
    if (jsonText.endsWith(';')) {
        jsonText = jsonText.substring(0, jsonText.length - 1);
    }
    
    const protocols = JSON.parse(jsonText);
    
    const newContent = `<section id="content-root" class="post-container">
  <header id="doc-header" data-doc-key="alta-empresas-agencias" data-status="activo" style="border-bottom: 2px solid #a58c5f; padding-bottom: 10px; margin-bottom: 20px;">
    <h1 style="color: #0F3A77; margin: 0; font-size: 1.8rem;">Operativa de Recepción – Alta de Empresas y Agencias 🛎️</h1>
    <div style="font-size: 0.9em; color: #5F6B80; margin-top: 10px; display: flex; gap: 15px; align-items: center;">
      <span>Última revisión: <span id="doc-date">—</span></span>
      <span>·</span>
      <span>Versión: <span id="doc-version">1.0</span></span>
      <span>·</span>
      <span style="display: flex; align-items: center; gap: 5px;">Estado: <span id="status-dot" class="dot green" style="width: 10px; height: 10px; border-radius: 50%; background: #28a745; display: inline-block;"></span> <span id="status-label">Activo</span></span>
      <span>·</span>
      <span>Ámbito: Ambos hoteles</span>
    </div>
  </header>
  
  <div style="margin-top: 20px;">
    <h2 style="color: #0F3A77; margin-bottom: 10px;">🎯 Objetivo</h2>
    <p>Este procedimiento evita la duplicación de fichas de empresas o agencias en el sistema, un error grave que afecta a facturación, contabilidad y seguimiento de clientes.</p>
    <p style="font-size: 0.85em; color: #666;">Consejo: Las imágenes se amplían al hacer clic para ver detalles.</p>

    <h2 style="color: #0F3A77; margin-top: 25px;">✅ 1. Verificación obligatoria antes de crear</h2>
    <ul style="line-height: 1.6;">
      <li><strong>Buscar por N.I.F. (dato más fiable)</strong>: Si el N.I.F. ya existe, no se crea nada nuevo.</li>
      <li><strong>Buscar por nombre (parcial o completo)</strong>: Considera variaciones: "S.L.", "S.A.", mayúsculas o pequeños errores tipográficos.</li>
      <li><strong>Revisar población o dirección</strong>: La coincidencia con otra ficha es una fuerte indicación de que ya está registrada.</li>
    </ul>

    <h2 style="color: #0F3A77; margin-top: 25px;">🔴 2. Atención a los avisos del sistema</h2>
    <p>Si se introduce un N.I.F. que ya existe, el sistema muestra:</p>
    <blockquote style="background: #fff3cd; border-left: 4px solid #ffecb5; padding: 10px; margin: 10px 0;">"Existe una Empresa/Agencia (cod. XXXXX) con el mismo NIF"</blockquote>
    <p><strong>Acción inmediata:</strong></p>
    <ul>
      <li>No continuar.</li>
      <li>No crear una nueva ficha.</li>
      <li>Usar la ficha existente o consultar con el responsable.</li>
    </ul>

    <h2 style="color: #0F3A77; margin-top: 25px;">🚫 3. Principio fundamental: Prioridad del N.I.F.</h2>
    <p>El N.I.F. es el identificador único. Si dos fichas comparten N.I.F., son la misma empresa, incluso con variaciones del nombre (p. ej., "S.L.").</p>

    <h2 style="color: #0F3A77; margin-top: 25px;">🧠 4. Actuación en caso de duda</h2>
    <ul>
      <li>Consultar con Administración o Contabilidad.</li>
      <li>No avanzar por intuición ni "por si acaso".</li>
      <li>Verificar siempre antes de actuar.</li>
    </ul>

    <h2 style="color: #0F3A77; margin-top: 25px;">📌 Resumen de puntos clave</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <tr style="background: #f8f9fa;">
        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Acción</th>
        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Detalle</th>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">✔️ ANTES de crear</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Buscar por N.I.F.</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">✔️ ANTES de crear</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Buscar por nombre parcial</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">✔️ ANTES de crear</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Revisar población/dirección</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; color: red;">❌ NO hacer</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Ignorar los avisos del sistema</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; color: #0056b3;">🗣️ SIEMPRE</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Consultar con el área responsable si hay dudas</td>
      </tr>
    </table>
  </div>
  
  <script>
    /* === Meta: estado + fecha corta (dd/Mmm/aa) + versión por cambios de contenido === */ 
    (function(){ 
      function fmtShort(d){ 
        var dd = String(d.getDate()).padStart(2,'0'); 
        var mmm = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][d.getMonth()]; 
        var yy = String(d.getFullYear()).slice(-2); 
        return dd + "/" + mmm + "/" + yy; 
      }
      var eld = document.getElementById('doc-date');
      if(eld) eld.textContent = fmtShort(new Date());
    })();
  </script>
</section>`;
    
    const newProtocol = {
        title: "Alta de Empresas y Agencias 🛎️",
        section: "15.1",
        content: newContent,
        published: new Date().toISOString(),
        categories: ["15ª Sección"],
        source: "Mínimos Recepción - Guadiana & Cumbria"
    };
    
    protocols.unshift(newProtocol);
    
    const newFileContent = "const protocols_data = " + JSON.stringify(protocols, null, 2) + ";\n";
    
    fs.writeFileSync(filePath, newFileContent, 'utf-8');
    console.log("Successfully added new protocol!");
} else {
    console.log("Could not parse protocols_data");
}
