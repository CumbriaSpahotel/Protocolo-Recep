// ============================================================
// PROXY SEGURO PARA GEMINI AI — Protocolo-Recep
// ============================================================
// INSTRUCCIONES DE INSTALACIÓN:
// 1. Abre script.google.com y edita el script existente de este proyecto
// 2. Pega TODO este código (reemplazando el existente)
// 3. Ve a Proyecto > Propiedades del proyecto > Propiedades del script
// 4. Añade la propiedad: Nombre = "GEMINI_API_KEY", Valor = tu_clave_de_gemini
// 5. Despliega > Nueva implementación > Aplicación web
//    - Ejecutar como: Yo
//    - Quién tiene acceso: Cualquier usuario
// 6. Copia la URL del despliegue y actualízala en data.js > cloud_config.scriptUrl
// ============================================================

// ---- EXISTENTES: Manejo de Comentarios/Sheets ----
// (Mantén aquí el resto de tu código doGet/doPost existente)

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    
    // ---- NUEVO: Proxy de Gemini AI Chat ----
    if (body.action === 'gemini_chat') {
      return handleGeminiChat(body);
    }
    
    // ---- EXISTENTE: Guardar comentarios ----
    if (body.action === 'save_comment' || body.comment) {
      return handleSaveComment(body);
    }

    // ---- EXISTENTE: Guardar datos data.js ----
    if (body.cloudConfig || body.protocols) {
      return handleSaveData(body);
    }

    return ContentService.createTextOutput(JSON.stringify({ error: 'Acción desconocida' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleGeminiChat(body) {
  // Recupera la clave de las propiedades privadas del script (NUNCA expuesta públicamente)
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  
  if (!apiKey) {
    return ContentService.createTextOutput(JSON.stringify({
      error: { message: 'API Key no configurada. Ve a Propiedades del Script y añade GEMINI_API_KEY.' }
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: body.contents,
    generationConfig: body.generationConfig || {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(apiUrl, options);
  const responseData = response.getContentText();
  
  return ContentService.createTextOutput(responseData)
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- FUNCIÓN AUXILIAR: Guardar comentarios (si la tenías) ----
function handleSaveComment(body) {
  // Tu código existente de guardado de comentarios aquí
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- FUNCIÓN AUXILIAR: Guardar datos ----
function handleSaveData(body) {
  // Tu código existente de guardado de data.js aquí
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
