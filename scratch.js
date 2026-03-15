const text1 = "8.3. 📝 Cierre de inventory {🟢}";
const text2 = "Asignación de Habitaciones {🟠}";

function parseTitle(title) {
    let cleanTitle = title;
    let estadoHtml = '⚪ Sin definir';
    const regex = /\{([\u0000-\uFFFF\uD800-\uDBFF\uDC00-\uDFFF]+?)\}/; // catch anything in {}
    
    const emojiMatch = title.match(regex);

    if (emojiMatch) {
       const emoji = emojiMatch[1];
       let statusText = 'Desconocido';
       if (emoji === '🟢') statusText = 'Activo';
       else if (emoji === '🟠') statusText = 'En redacción';
       else if (emoji === '🔴') statusText = 'Obsoleto';
       else statusText = emoji;
       
       estadoHtml = `${emoji} ${statusText}`;
       cleanTitle = title.replace(emojiMatch[0], '').trim();
    }
    return { cleanTitle, estadoHtml };
}

console.log(parseTitle(text1));
console.log(parseTitle(text2));
