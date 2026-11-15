# 📋 Registro Único de Versiones y Control de Cambios

Este documento mantiene el historial de versión unificada, fechas de actualización y registro de cambios de la plataforma **Protocolo-Recep** (Sercotel Guadiana & Cumbria Spa & Hotel).

> **Regla Operativa Obligatoria:**  
> Existe **una única versión global para todo el sistema**. Cada vez que se realice cualquier modificación en cualquier módulo (Visor, Administración, Backend, Datos, Estilos, etc.), se incrementará el número de versión global y se registrará la fecha y el resumen de cambios en este documento.

---

## 📌 Versión Actual del Sistema

| Versión Global | Fecha de Actualización | Estado General |
| :---: | :---: | :---: |
| **`v1.0.5`** | **15/11/2026** | En producción |

---

## 📝 Historial de Modificaciones del Sistema

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
