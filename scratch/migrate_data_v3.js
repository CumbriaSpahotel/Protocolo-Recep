const fs = require('fs');
const vm = require('vm');

console.log("=== INICIANDO ESCRITURA DE MIGRACIÓN AUTOMÁTICA ===");

const dataContent = fs.readFileSync('data.js', 'utf8');

// Load existing data in vm
const sandbox = {};
sandbox.global = sandbox;
vm.createContext(sandbox);
vm.runInNewContext(dataContent + `
;
if (typeof channels_config !== 'undefined') global.channels_config = channels_config;
if (typeof protocols_data !== 'undefined') global.protocols_data = protocols_data;
if (typeof home_config !== 'undefined') global.home_config = home_config;
if (typeof cloud_config !== 'undefined') global.cloud_config = cloud_config;
`, sandbox);

const channelsConfig = sandbox.channels_config;
const oldProtocols = sandbox.protocols_data;
const homeConfig = sandbox.home_config;
const cloudConfig = sandbox.cloud_config;

const MIGRATION_MAP = {
    // Turnos
    "📅Tareas Comunes a Todos los Turnos": "1.1",
    "🌅 Turno de Mañana Recepción": "1.2",
    "🌇 Turno de Tarde Recepción": "1.3",
    "🌙 Turno de Noche Recepción": "1.4",
    "🛎️ Procedimientos especiales Guadiana": "1.4.1",
    "🛎️ Procedimientos especiales Cumbria": "1.4.2",
    "👋 Bienvenida y Adaptación para Nuevas Incorporaciones": "1.5",
    "Claves para optimizar el tiempo en recepción sin perder la calma": "1.6",
    "🕗 Cuadrante original de turnos": "1.7",

    // Flujo
    "📝 Check-in y bienvenida": "2.1.1",
    "🔚 Check-out y cierre de cuenta": "2.1.2",
    "🕓 Late Check-Out (salida tardía)": "2.1.3",
    "Normativa de Visitas en Habitaciones": "2.1.4",
    "💵 Control de caja y depósitos": "2.2.1",
    "💳 TPV y medios de pago": "2.2.2",
    "🚨 Gestión de incidencias": "2.3.1",
    "📢 Registro de incidencias durante la estancia de los clientes": "2.3.2",
    "⭐ Prevención de Reseñas Negativas": "2.3.3",

    // Reservas y Sistemas
    "🏷️ Tarifas 2026 👤 Individuales": "3.1.1",
    "❌ Políticas de cancelación": "3.1.2",
    "📢 Nueva Política de Garantía": "3.1.3",
    "🎯 Tarifas Especiales CODE": "3.1.4",
    "📋 Revisión y control de reservas": "3.2.1",
    "🛏️ Supervisión de Ocupación e Inventory": "3.2.2",
    "📝 Cierre de inventory": "3.2.3",
    "✅ Siteminder-Guadiana": "3.3.1",
    "✅ RoomCloud-Cumbria": "3.3.2",
    "🔄 Uso synergy (Cumbria)": "3.3.3",
    "🔄 Uso SoulGuest (Guadiana)": "3.3.4",
    "🖥️ Presentación del PMS": "3.4.1",
    "🛑 Alta de Empresas y Agencias": "3.4.2",
    "🔐 Manual: Grabación de Tarjetas de Emergencia y Repuesto": "3.4.3",
    "📡Canales de Venta Online": "3.5",
    "👤 Gestión reservas individuales": "3.6",

    // Eventos y Grupos
    "👪 Gestión reservas grupos": "4.1.1",
    "🛎️ Registro y bienvenida de grupos": "4.1.2",
    "🔚 Gestión y cierre de grupos": "4.1.3",
    "Protocolo de Registro – Grupos de Menores": "4.1.4",
    "NEGLIGENCIA EN LA ASIGNACIÓN DE HABITACIONES DE GRUPOS - PROTOCOLO OBLIGATORIO": "4.1.5",
    "Tarifas y Condiciones 2026 👪 Grupos": "4.1.6",
    "🍽️ Menu Eventos": "4.2.1",
    "Menú Grupos Turisticos": "4.2.2",
    "Menú Deportivo": "4.2.3",

    // Seguridad
    "🛎️ Central de alarmas": "5.1.1",
    "🔥 Actuación ante incendios": "5.1.2",
    "👨‍⚕️ Primeros auxilios y emergencias varias": "5.1.3",
    "🆘 Protocolo de Situaciones Especiales": "5.1.4",
    "🛑 Protocolo de actuación 🛑 Posible intoxicación alimentaria": "5.1.5",
    "💧 Procedimientos Spa": "5.2.1",
    "Gestión de Bonos Regalo – Procedimiento obligatorio en Recepción de Spa": "5.2.2",
    "Groupon": "5.2.3",
    "Explicación del Video Cierre de Venta de Escapadas": "5.2.4",

    // Biblioteca
    "🤝Contratos Agencias y las condiciones": "6.1.1",
    "🤝Contratos Agencias y las condiciones Guadiana": "6.1.2",
    "📢 Prórroga Campaña Escapada Joven CLM": "6.1.3",
    "📝Otros Manuales Básicos de Recepción": "6.2.1",
    "Calidad en destino – Cumbria Spa&Hotel": "6.3.1",
    "INFORME ANUAL DE CALIDAD 2025": "6.3.2",
    "INFORME ANUAL DE CALIDAD 2025 Sercotel Guadiana - calidad en destino": "6.3.3",

    // Extras
    "🛏️ Asignación de habitaciones": "2.1.5"
};

// Normalize keys of map
const NORM_MAP = {};
for (const [title, section] of Object.entries(MIGRATION_MAP)) {
    NORM_MAP[title.trim().toLowerCase()] = section;
}

const DELETIONS = [
    "🔄 Uso RoomCloud (Cumbria)".trim().toLowerCase(),
    "🔄 Uso Siteminder (Guadiana)".trim().toLowerCase(),
    "Alta de Empresas y Agencias".trim().toLowerCase() // This removes the duplicate empty one (emoji-less one, at line 746)
];

const newProtocols = [];

oldProtocols.forEach((p, index) => {
    const title = p.title ? p.title.trim() : "";
    const titleNorm = title.toLowerCase();

    // Check if it should be deleted
    if (DELETIONS.includes(titleNorm)) {
        // Wait, "Alta de Empresas y Agencias" might match both. Let's make sure we only delete the one without the emoji "🛑"!
        if (titleNorm === "alta de empresas y agencias") {
            if (!p.title.includes("🛑")) {
                console.log(`Eliminando duplicado vacío: "${p.title}" (Línea original ~746)`);
                return;
            }
        } else {
            console.log(`Eliminando duplicado/borrador obsoleto: "${p.title}"`);
            return;
        }
    }

    const newSec = NORM_MAP[titleNorm];
    if (!newSec) {
        console.error(`ERROR: No se encontró mapeo para el protocolo: "${p.title}"`);
        process.exit(1);
    }

    // Clone and update
    const updatedProto = { ...p };
    updatedProto.section = newSec;
    
    // Auto-update categories array: eg. [ "3ª Sección" ]
    const firstDigit = newSec.split('.')[0];
    updatedProto.categories = [`${firstDigit}ª Sección`];

    newProtocols.push(updatedProto);
});

console.log(`Total de protocolos migrados: ${newProtocols.length} (esperado: 54)`);

// Define navigation_config
const newNavConfig = {
  "1": {
    "name": "Turnos y Personal",
    "icon": "fa-calendar-check",
    "subsections": {
      "1.1": "📅 Operativa Diaria",
      "1.2": "🌅 Turno de Mañana",
      "1.3": "🌇 Turno de Tarde",
      "1.4": "🌙 Turno de Noche",
      "1.5": "👋 Bienvenida y Adaptación",
      "1.6": "🕗 Gestión de Personal"
    },
    "links": [
      {
        "icon": "fa-cloud",
        "text": "Cuadrante Online",
        "url": "https://cumbriaspahotel.github.io/Turnos-new/"
      },
      {
        "icon": "fa-umbrella-beach",
        "text": "Vacaciones del Personal",
        "url": "https://1drv.ms/x/c/7cdc5f6b199a606e/EWBW8z40KJtLlTyY-y6rLzUBLMk2FZGVYBhZlDpC04lFCQ?e=dZ7txS"
      },
      {
        "icon": "fa-lock",
        "text": "Selección de Personal",
        "url": "https://docs.google.com/spreadsheets/d/1J9bnXU3iw-vHemsgWOhOnpGhAPtsutbt6Y1UYRpAe74/edit?usp=sharing"
      }
    ]
  },
  "2": {
    "name": "Flujo de Recepción",
    "icon": "fa-walking",
    "subsections": {
      "2.1": "🔑 El Ciclo del Huésped",
      "2.2": "💵 Finanzas y Caja",
      "2.3": "⭐ Calidad e Incidencias"
    },
    "links": []
  },
  "3": {
    "name": "Reservas y Sistemas",
    "icon": "fa-desktop",
    "subsections": {
      "3.1": "🏷️ Tarifas y Políticas",
      "3.2": "📋 Auditoría y Control",
      "3.3": "🔄 Conectividad",
      "3.4": "🖥️ Software PMS",
      "3.5": "📡 Canales Online",
      "3.6": "👤 Gestión Individual"
    },
    "links": []
  },
  "4": {
    "name": "Eventos y Grupos",
    "icon": "fa-users-cog",
    "subsections": {
      "4.1": "👥 Operativa de Grupos",
      "4.2": "🍽️ Coordinación y Menús"
    },
    "links": [
      {
        "icon": "fa-download",
        "text": "Descarga Menús",
        "url": "https://1drv.ms/f/c/7cdc5f6b199a606e/EspwQwoBy05Fu9q4XbKzGUsBNVdzDdnFam7JpqtDB7h1dg?e=we0DeU"
      },
      {
        "icon": "fa-file-invoice",
        "text": "Presupuesto Menú Eventos",
        "url": "https://nataliogc.github.io/menus-eventos/l"
      },
      {
        "icon": "fa-glass-martini-alt",
        "text": "Menú Cóctel",
        "url": "https://nataliogc.github.io/menus-cocteles/"
      }
    ]
  },
  "5": {
    "name": "Seguridad y Bienestar",
    "icon": "fa-shield-alt",
    "subsections": {
      "5.1": "🚨 Autoprotección y Emergencias",
      "5.2": "💧 Cumbria Bienestar (Spa)"
    },
    "links": []
  },
  "6": {
    "name": "Biblioteca y Enlaces",
    "icon": "fa-book-reader",
    "subsections": {
      "6.1": "📢 Comunicados y Noticias",
      "6.2": "📖 Manuales Oficiales",
      "6.3": "🏆 Reportes de Calidad",
      "6.4": "☁️ Enlaces Útiles (Nubes)"
    },
    "links": [
      {
        "icon": "fa-link",
        "text": "🗂️Archivos Guadiana →☁️",
        "url": "https://onedrive.live.com/?cid=7cdc5f6b199a606e&id=7CDC5F6B199A606E!s480cac55494b445d8cb4f87bff2b2c16&resid=7CDC5F6B199A606E!s480cac55494b445d8cb4f87bff2b2c16&ithint=folder&e=edtxgO&migratedtospo=true&redeem=aHR0cHM6Ly8xZHJ2Lm1zL2YvYy83Y2RjNWY2YjE5OWE2MDZlL0VsV3NERWhMU1YxRWpMVDRlXzhyTEJZQkdheERuNmNuRVZWRXM1QWdRSUZTdXc_ZT1lZHR4Z08="
      },
      {
        "icon": "fa-link",
        "text": "🗂️Archivos Cumbria →☁️",
        "url": "https://1drv.ms/f/c/7cdc5f6b199a606e/IgC2zNimWu27R5bEXKYkEjr1ARJwRIHuHL7FFZQO-EpPXBw?e=i9MRJB"
      },
      {
        "icon": "fa-link",
        "text": "🗂️Procedimientos Sercotel →☁️",
        "url": "https://drive.google.com/drive/folders/1KETvtJnPCuXuguPc6EP3WGNl5MYhJZn5"
      },
      {
        "icon": "fa-link",
        "text": "📷 Guadiana →☁️",
        "url": "https://onedrive.live.com/?cid=7cdc5f6b199a606e&id=7CDC5F6B199A606E!s0b80276d82dc46bfb9a7b4fd04ab7358&resid=7CDC5F6B199A606E!s0b80276d82dc46bfb9a7b4fd04ab7358&ithint=folder&e=HHXrIF&migratedtospo=true&redeem=aHR0cHM6Ly8xZHJ2Lm1zL2YvYy83Y2RjNWY2YjE5OWE2MDZlL0VtMG5nQXZjZ3I5R3VhZTBfUVNyYzFnQkFJQ2dXZnM4UVYyR0RmdTYzNzBDTWc_ZT1ISFhySUY="
      },
      {
        "icon": "fa-link",
        "text": "📷 Cumbria →☁️",
        "url": "https://onedrive.live.com/?cid=7cdc5f6b199a606e&id=7CDC5F6B199A606E%21s33321a5fa9ef4c26bccc1511d85168ad&resid=7CDC5F6B199A606E%21s33321a5fa9ef4c26bccc1511d85168ad&ithint=folder&e=9yGzl6&migratedtospo=true&redeem=aHR0cHM6Ly8xZHJ2Lm1zL2YvYy83Y2RjNWY2YjE5OWE2MDZlL0VsOGFNalB2cVNaTXZNd1ZFZGhSYUswQlhQRXBPZ1ZmWmpZMV9oQk1YSFlRRHc_ZT05eUd6bDY&v=validatepermission"
      },
      {
        "icon": "fa-link",
        "text": "🎥 Video manuales y tutoriales→☁️",
        "url": "https://onedrive.live.com/?redeem=aHR0cHM6Ly8xZHJ2Lm1zL2YvYy83Y2RjNWY2YjE5OWE2MDZlL0VoYlBLUm5XXzlSUHZCSDMyY3ZUZXRrQkgyYmpmYWZseTVaUXcyY2x2R3Z6WkE%5FZT1DTWdyYm4&id=7CDC5F6B199A606E%21s1929cf16ffd64fd4bc11f7d9cbd37ad9&cid=7CDC5F6B199A606E"
      },
      {
        "icon": "fa-lock",
        "text": "Acceso Restringido (Menú Cóctel)",
        "url": "https://nataliogc.github.io/menus-cocteles/"
      }
    ]
  }
};

// Now format the data.js file
let output = "";
output += "var channels_config = " + JSON.stringify(channelsConfig, null, 2) + ";\n\n";
output += "const protocols_data = " + JSON.stringify(newProtocols, null, 2) + ";\n\n";
output += "const navigation_config = " + JSON.stringify(newNavConfig, null, 2) + ";\n\n";
output += "const home_config = " + JSON.stringify(homeConfig, null, 2) + ";\n\n";
output += "var cloud_config = " + JSON.stringify(cloudConfig, null, 2) + ";\n\n";
output += "const menus_data = [];\n";

fs.writeFileSync('data.js', output, 'utf8');
console.log("✔ ESCRITURA DE MIGRACIÓN AUTOMÁTICA COMPLETADA EN data.js");
