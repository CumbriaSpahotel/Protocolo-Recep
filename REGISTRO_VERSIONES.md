# 📋 Registro Único de Versiones y Control de Cambios

Este documento mantiene el historial de versión unificada, fechas de actualización y registro de cambios de la plataforma **Protocolo-Recep** (Sercotel Guadiana & Cumbria Spa & Hotel).

> **Regla Operativa Obligatoria:**  
> Existe **una única versión global para todo el sistema**. Cada vez que se realice cualquier modificación en cualquier módulo (Visor, Administración, Backend, Datos, Estilos, etc.), se incrementará el número de versión global y se registrará la fecha y el resumen de cambios en este documento.

---

## 📌 Versión Actual del Sistema

| Versión Global | Fecha de Actualización | Estado General |
| :---: | :---: | :---: |
| **`v1.2.67`** | **16/11/2026** | En producción |

---

## 📝 Historial de Modificaciones del Sistema

### [v1.2.67] — 16/11/2026
- **Módulos Afectados:** Gestión de Bonos Regalo (data.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Sustituido el formato correo antiguo de Gestión de Bonos Regalo (5.2.2) por el manual estructurado sin firma de correo ni pasos 2-3

### [v1.2.66] — 16/11/2026
- **Módulos Afectados:** Portal Spa (spa.html), Datos (data.js), Backend (server.js), Panel Admin (admin.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Corregida la ubicación de los manuales de GEST-SPA (1 a 6) para que figuren exclusivamente bajo el menú Manuales y no en el desplegable de Procedimientos Spa.
  - Restaurada la estructura completa de navegación del Spa (`spa_navigation_config`) y las secciones de bonos externos (5.2.11 Smartbox, 5.2.12 Wonderbox, 5.2.13 Ego Experiencias) que habían sido eliminadas accidentalmente en data.js tras un guardado desde el panel de administración.
  - Blindado el backend (`server.js`) con parser seguro tolerante a comas finales (`vm.runInNewContext`), preservación automática de protocolos existentes y fallback íntegro de menús de Spa para evitar que futuros guardados borren `spa_navigation_config` o secciones no enviadas por el navegador.
  - Actualizado el fallback por defecto de `getSpaMenusConfig()` en `spa.html` y `admin.js` para asegurar que ningún manual quede nunca desasignado ni caiga en el desplegable de Procedimientos Spa.

### [v1.2.65] — 16/11/2026
- **Módulos Afectados:** Estilos Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Mejora visual global de todo el manual en spa.html: secciones en tarjeta, cabeceras con acento lateral, imágenes ajustadas sin franjas grises ni deformación, badges de código y alineación vertical centrada

### [v1.2.64] — 16/11/2026
- **Módulos Afectados:** Manuales Gest-Spa Bloques 1-5 (data.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Corregida la asignación de contenido entre 5.2.7 y 5.2.8 y eliminadas las alturas fijas (180px) en todo el manual Gest-Spa para que todas las imágenes se integren con su texto sin franjas grises ni bloques aislados

### [v1.2.63] — 16/11/2026
- **Módulos Afectados:** Manual Gest-Spa Bloque 4 Bonos (data.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Actualizada la sección 4.4 con la nueva regla de Gest-Spa: bloqueo de canje manual y campo Sesiones Usadas de solo lectura

### [v1.2.62] — 16/11/2026
- **Módulos Afectados:** Datos y Navegación Spa (data.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Restaurada la estructura completa de data.js (bloques 5.2.9-5.2.13 y spa_navigation_config) conservando todas las mejoras de Bonos (4.1-4.4) y Visión 15d (5.3) para que GEST-SPA / ZENITH aparezca únicamente bajo Manuales

### [v1.2.61] — 16/11/2026
- **Módulos Afectados:** Manual Gest-Spa Bloque 4 Bonos (data.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Reforzada la norma estricta en 4.4 sobre la trazabilidad obligatoria de canjes en el Historial de Reservas

### [v1.2.60] — 16/11/2026
- **Módulos Afectados:** Manual Gest-Spa Bloque 4 Bonos (data.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Añadida sección 4.4 Regla de Oro de canje de bonos con captura real de bono mal canjeado, explicando no editar Usadas manualmente y el flujo automático por reservas

### [v1.2.59] — 16/11/2026
- **Módulos Afectados:** Manual Gest-Spa Bloque 4 Bonos (data.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Añadida guía completa paso a paso de canje de bonos (4.3) con 8 capturas reales: búsqueda por código/teléfono/nombre, Alojamiento (PMS Hotel), Restaurante (Mesachef) y Spa (calendario pre-rellenado)

### [v1.2.58] — 16/11/2026
- **Módulos Afectados:** Manual Gest-Spa Bloque 4 Bonos (data.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Añadido el flujo paso a paso con 4 capturas reales de Nueva Venta Local en el Bloque 4 (5.2.8), diferencia entre Bono Regalo y Reserva Directa, validez de 1 año y sección 4.3 integrada

### [v1.2.57] — 16/11/2026
- **Módulos Afectados:** Manuales Gest-Spa Bloques 4 y 5 (data.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Integradas en 2 columnas las imágenes restantes de Bloque 4 (4.1 Panel de Bonos) y Bloque 5 (5.3 Visión 15d) junto a sus explicaciones

### [v1.2.56] — 16/11/2026
- **Módulos Afectados:** Manuales Gest-Spa Bloques 1, 2 y 3 (data.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Reordenado el Bloque 3 (Planning de Ocupación como 3.1 y Agenda de Cabinas como 3.2) e integradas todas las capturas junto al texto en cuadrículas de 2 columnas en los Bloques 1, 2 y 3

### [v1.2.55] — 16/11/2026
- **Módulos Afectados:** Manual Gest-Spa Bloque 3 (data.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Rediseñada la sección 3.1 Agenda de Cabinas con captura operativa legible y explicación clara en 4 pasos

### [v1.2.54] — 16/11/2026
- **Módulos Afectados:** Manual Gest-Spa Bloque 3 (data.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Mejorada la explicación del Planning de Ocupación (3.2) destacando la visión global para reservar Cabinas/Salas/Terapeutas y que el Circuito Spa se reserva desde su propio módulo

### [v1.2.53] — 16/11/2026
- **Módulos Afectados:** Manual Gest-Spa Bloque 1 (data.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Enlazadas las tarjetas de Bonos, Groupon, Smartbox, Wonderbox y Ego Experiencias del bloque 1 (5.2.5) a sus respectivas páginas explicativas

### [v1.2.52] — 16/11/2026
- **Módulos Afectados:** Gestión de Bonos Regalo (data.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Eliminados pasos 2 y 3 (Transferencia de llamada y Recepción del hotel) en Gestión de Bonos Regalo (5.2.2)

### [v1.2.51] — 16/11/2026
- **Módulos Afectados:** Portal Spa (spa.html), Datos (data.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Gestión de Bonos Regalo primero en el menú Bonos y título acortado para un menú más compacto

### [v1.2.50] — 16/11/2026
- **Módulos Afectados:** Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Posicionamiento inteligente de menús y submenús desplegables en spa.html para evitar recortes fuera de pantalla

### [v1.2.49] — 16/11/2026
- **Módulos Afectados:** Portal Spa (spa.html), Manuales Gest-Spa (data.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Eliminado submenú de GEST-SPA / ZENITH en Manuales, mejorada la cabecera de fichas en spa.html y eliminada la palabra Dashboard del apartado 1 de Gest-Spa

### [v1.2.48] — 16/11/2026
- **Módulos Afectados:** data.js
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Movida la subcarpeta BONOS EXTERNOS exclusivamente dentro del menú Bonos en spa_navigation_config

### [v1.2.47] — 16/11/2026
- **Módulos Afectados:** data.js
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Eliminada la duplicación de bonos externos en el menú Bonos (quedan en Manuales -> BONOS EXTERNOS)

### [v1.2.46] — 16/11/2026
- **Módulos Afectados:** data.js
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Convertido el protocolo 5.2.2 (Bonos Regalo) de formato correo a manual operativo estructurado

### [v1.2.45] — 16/11/2026
- **Módulos Afectados:** data.js
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Añadida subcarpeta BONOS EXTERNOS dentro del menú Manuales en spa_navigation_config

### [v1.2.44] — 16/11/2026
- **Módulos Afectados:** Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Al hacer clic en subcarpetas del menú (como GEST-SPA / ZENITH) abre directamente su primera sección

### [v1.2.43] — 16/11/2026
- **Módulos Afectados:** data.js
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Separados en páginas individuales 5.2.11 (Smartbox), 5.2.12 (Wonderbox) y 5.2.13 (Ego Experiencias) listas para ampliar

### [v1.2.42] — 16/11/2026
- **Módulos Afectados:** data.js
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Explicadas en detalle todas las capturas de Bonos (5.2.8) y Personal/Turnos/Visión 15d (5.2.9) usando el proyecto Gest-Spa real

### [v1.2.41] — 16/11/2026
- **Módulos Afectados:** data.js
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Ampliada la explicación paso a paso de cómo realizar y gestionar reservas desde Planning de Ocupación (5.2.7)

### [v1.2.40] — 16/11/2026
- **Módulos Afectados:** data.js
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Reducido el tamaño de las capturas y añadida explicación individual por cada captura en 5.2.7

### [v1.2.39] — 16/11/2026
- **Módulos Afectados:** data.js
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Creado manual específico 5.2.11 para Bonos Externos (Smartbox, Wonderbox, Ego Experiencias) y enlazado desde 5.2.6 y menú Bonos

### [v1.2.38] — 15/11/2026
- **Módulos Afectados:** data.js
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Añadida tarifa exacta de Hotel - NO Incluidos (12€ L-J / 18€ V-D por persona y hora)

### [v1.2.37] — 15/11/2026
- **Módulos Afectados:** data.js
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Aclarado que BONO / Bono Spa (Interno) corresponde a bonos internos de tienda online o venta en recepción

### [v1.2.36] — 15/11/2026
- **Módulos Afectados:** data.js, Imagenes/gest-spa
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Actualizado bloque 5.2.6 con capturas reales de franja horaria, listado del turno y los 8 orígenes con cambio de tarifa

### [v1.2.35] — 15/11/2026
- **Módulos Afectados:** data.js
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Usados los iconos exactos de Gest-Spa en las tarjetas de Acciones (5.2.5)

### [v1.2.34] — 15/11/2026
- **Módulos Afectados:** data.js, Imagenes/gest-spa
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Actualizada captura completa sin recortes del Dashboard en 5.2.5

### [v1.2.33] — 15/11/2026
- **Módulos Afectados:** data.js, Imagenes/gest-spa
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Completado bloque 5.2.5 con Dashboard real, todos los 13 estados/orígenes y las 4 acciones de fila

### [v1.2.32] — 15/11/2026
- **Módulos Afectados:** Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Fijada la barra de enlaces rápidos del manual con position sticky en spa.html

### [v1.2.31] — 15/11/2026
- **Módulos Afectados:** Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Eliminado el botón redundante Volver al inicio del Spa en spa.html

### [v1.2.30] — 15/11/2026
- **Módulos Afectados:** Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Movido el indicador de sesión y Cerrar sesión a formato discreto bajo el botón de la luna en spa.html

### [v1.2.29] — 15/11/2026
- **Módulos Afectados:** data.js, Imagenes/gest-spa
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Añadida explicación interactiva completa de Planning de Ocupación en 5.2.7

### [v1.2.28] — 15/11/2026
- **Módulos Afectados:** Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Reducido el espacio vertical en la cabecera y márgenes superiores del Portal Spa

### [v1.2.27] — 15/11/2026
- **Módulos Afectados:** Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Añadida barra de enlaces rápidos en la cabecera de protocolos y manuales del Portal Spa

### [v1.2.26] — 15/11/2026
- **Módulos Afectados:** data.js, Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Ajustado el tamaño compacto de las capturas en los manuales Gest-Spa con ampliación al hacer clic

### [v1.2.25] — 15/11/2026
- **Módulos Afectados:** data.js, Imagenes/gest-spa
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Manuales de Gest-Spa (5.2.5-5.2.10) actualizados con 20 capturas reales de la aplicación y explicación sencilla de todas las secciones y estados

### [v1.2.24] — 15/11/2026
- **Módulos Afectados:** data.js, Imagenes
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Eliminadas las imágenes ficticias generadas de los manuales Gest-Spa (5.2.5-5.2.10)

### [v1.2.23] — 15/11/2026
- **Módulos Afectados:** data.js, Portal Spa (spa.html), Imagenes/gest-spa
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Rediseñada Procedimientos Spa (5.2.1) a pantalla completa e integradas imágenes visuales en los 6 manuales de Gest-Spa (5.2.5-5.2.10)

### [v1.2.22] — 15/11/2026
- **Módulos Afectados:** data.js, Estilos (style.css), Visor Recepción (app.js), Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Unificados los 14 apartados de GEST-SPA / ZENITH en 6 manuales temáticos HTML (5.2.5 a 5.2.10) y mejorada la estabilidad del hover en submenús

### [v1.2.21] — 15/11/2026
- **Módulos Afectados:** data.js, Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Actualizados manuales GEST-SPA / ZENITH a la Guía Integral v2.3.46 (14 secciones HTML de la 5.2.5 a la 5.2.18)

### [v1.2.20] — 15/11/2026
- **Módulos Afectados:** data.js, Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Creados 8 manuales individuales en HTML para cada sección del manual GEST-SPA / ZENITH (5.2.5 a 5.2.12) y organizados en Manuales > GEST-SPA / ZENITH

### [v1.2.19] — 15/11/2026
- **Módulos Afectados:** Estilos (style.css), Visor Recepción (app.js), Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Posicionamiento automático hacia la izquierda para submenús que se salen por el borde derecho de la pantalla

### [v1.2.18] — 15/11/2026
- **Módulos Afectados:** data.js, Backend (server.js), Panel Admin (admin.html, admin.js), Visor Recepción (app.js), Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Separado Spa fuera de Recepción (sección Seguridad), y añadida gestión completa de menús y subcarpetas del Spa (spa_navigation_config)

### [v1.2.17] — 15/11/2026
- **Módulos Afectados:** Panel Admin (admin.html, admin.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Añadido filtro y etiquetas visuales para diferenciar Hoteles / Recepción y Solo Spa en Gestión de Menús

### [v1.2.16] — 15/11/2026
- **Módulos Afectados:** Panel Admin (admin.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Aplicado filtro de secciones síncrono directamente en openEditor al crear procedimientos de Spa sin depender de setTimeout

### [v1.2.15] — 15/11/2026
- **Módulos Afectados:** Panel Admin (admin.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Filtrado automático de secciones en el editor según Destinatario/Hotel (solo Spa muestra 5.2; hoteles muestran solo secciones de recepción)

### [v1.2.14] — 15/11/2026
- **Módulos Afectados:** Panel Admin (admin.js), Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Preseleccionado Destinatario/Hotel como Cumbria Bienestar (solo Spa) al crear procedimientos de Spa y sincronizado el filtro en Gestión Spa y spa.html

### [v1.2.13] — 15/11/2026
- **Módulos Afectados:** Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Añadidos menús desplegables separados Bonos y Manuales junto a Procedimientos Spa en spa.html sin duplicar archivos

### [v1.2.12] — 15/11/2026
- **Módulos Afectados:** Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Corregida tarjeta de bienvenida (.welcome-card), limpiados extractos de CSS en tarjetas y eliminado menú duplicado en spa.html

### [v1.2.11] — 15/11/2026
- **Módulos Afectados:** Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Corregido el ancho completo de los procedimientos en spa.html al ocultar la barra lateral y mejorado el botón de volver

### [v1.2.10] — 15/11/2026
- **Módulos Afectados:** Panel Admin (admin.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Corregida la preselección de Categoría Principal y apartado padre al crear un nuevo procedimiento desde Gestión Spa

### [v1.2.9] — 15/11/2026
- **Módulos Afectados:** Panel Admin (admin.html, admin.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Añadida pestaña dedicada Gestión Spa en admin.html para administrar procedimientos, accesos y enlaces del portal Spa

### [v1.2.8] — 15/11/2026
- **Módulos Afectados:** Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Ocultado el menú lateral izquierdo dentro de los procedimientos del Spa para mostrarlo solo en Inicio

### [v1.2.7] — 15/11/2026
- **Módulos Afectados:** Seguridad (security.js), Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Hecho más discreto el indicador de sesión y convertida la barra superior del Portal Spa en menús desplegables como en Recepción

### [v1.2.6] — 15/11/2026
- **Módulos Afectados:** Estilos Admin (admin.css), Seguridad (security.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Ajustado el panel de administración y Seguridad y Accesos para ocupar todo el ancho de la pantalla y equilibrar las columnas

### [v1.2.5] — 15/11/2026
- **Módulos Afectados:** Seguridad (security.js)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Añadidos campos de Nombre completo y Correo electrónico en Pases Temporales para Invitados y ajustado el contenedor al ancho completo de pantalla

### [v1.2.4] — 15/11/2026
- **Módulos Afectados:** Portal Spa (spa.html)
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Rediseñado spa.html con el mismo diseño, barra superior, sidebar y tarjetas de inicio que index.html (Recepción)

### [v1.2.3] — 15/11/2026
- **Módulos Afectados:** Seguridad, Backend, data.js
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Simplificado acceso con correo autorizado y clave de acceso sin requerir Google/Microsoft Client ID

### [v1.2.2] — 15/11/2026
- **Módulos Afectados:** Seguridad, Visor, data.js, Backend
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Cambiada la regla de seguridad de 6.2.1 a acceso general (*) para proteger toda la plataforma de Recepción al cargar index.html

### [v1.2.1] — 15/11/2026
- **Módulos Afectados:** Seguridad, Spa, Administración, data.js
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Añadido administrador nataliohoteles@gmail.com con acceso total e integrado el logo oficial de Cumbria Bienestar en spa.html

### [v1.2.0] — 15/11/2026
- **Módulos Afectados:** Spa, Seguridad, Visor
- **Tipo de Cambio:** Nueva Característica / Mejora
- **Detalle de Cambios:**
  - Creado portal exclusivo para Cumbria Bienestar (Spa) en spa.html sin menús ni elementos de recepción, protegido con cumbriaspa@gmail.com e invitados

### [v1.1.0] — 15/11/2026
- **Módulos Afectados:** Seguridad, Visor, Administración, Backend, data.js
- **Tipo de Cambio:** Nueva Característica / Mejora
- **Detalle de Cambios:**
  - Implementado sistema de seguridad por sección (Google/Microsoft OAuth + pases de invitado con caducidad) para Manual Onity (6.2.1) y Cumbria Bienestar Spa (5.2), gestionable desde admin.html

### [v1.0.5] — 15/11/2026
- **Módulos Afectados:** Manuales Oficiales, data.js, assets/onity
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Añadidas 25 ilustraciones y capturas oficiales de los PDFs de Onity con visor Lightbox al Manual Interactivo Onity

### [v1.0.4] — 15/11/2026
- **Módulos Afectados:** Administración
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Añadido distintivo visual de Panel de Administración en la cabecera de admin.html

### [v1.0.3] — 15/11/2026
- **Módulos Afectados:** Administración, Scripts
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Añadido indicador de versión en la cabecera de admin.html y sincronización automática en bump-version.js

### [v1.0.2] — 15/11/2026
- **Módulos Afectados:** Manuales Oficiales, data.js
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Añadido Manual Interactivo Onity (OnPortal & Cerraduras RFID) en sección 6.2 Manuales Oficiales a partir de los 11 PDFs oficiales

### [v1.0.1] — 27/10/2026
- **Módulos Afectados:** Sistema / Configuracion
- **Tipo de Cambio:** Mejora / Corrección
- **Detalle de Cambios:**
  - Sistema de versionado automatico integrado mediante GEMINI.md, AGENTS.md y script bump-version

### [v1.0.0] — 27/10/2026
- **Módulos Afectados:** General (todos los módulos: Visor, Administración, Servidor, Datos).
- **Tipo de Cambio:** Inicialización del versionado único global.
- **Detalle de Cambios:**
  - Establecimiento del sistema de versión única para todo el proyecto.
  - Creación del registro centralizado de control de versiones y actualizaciones (`REGISTRO_VERSIONES.md`).

---

### Formato para Próximos Cambios:
```markdown
### [vX.Y.Z] — DD/MM/AAAA
- **Módulos Afectados:** [Ej. Administración / Backend / Visor / Datos]
- **Archivos Modificados:** `app.js`, `server.js`, ...
- **Detalle de Cambios:**
  - Punto 1 de lo realizado.
  - Punto 2 de lo realizado.
```
