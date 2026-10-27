# Reglas y Directrices de Desarrollo - Protocolo-Recep

## 🚨 REGLA OBLIGATORIA: Control Automático de Versiones

Cada vez que se realice cualquier modificación, mejora, corrección de errores o nueva funcionalidad en cualquier archivo o módulo del sistema (Visor, Administración, Backend, Estilos, Scripts, etc.):

1. **Incremento de Versión Única**:
   - Se debe incrementar automáticamente el número de versión global del sistema (`patch` para correcciones y mejoras estándar, `minor` para nuevas funcionalidades grandes).
2. **Actualización de Archivos de Registro**:
   - Actualizar el campo `"version"` en [package.json](file:///c:/Users/comun/Documents/GitHub/Protocolo-Recep/package.json).
   - Agregar inmediatamente la nueva entrada en [REGISTRO_VERSIONES.md](file:///c:/Users/comun/Documents/GitHub/Protocolo-Recep/REGISTRO_VERSIONES.md) indicando:
     - Versión nueva (`[vX.Y.Z]`)
     - Fecha actual (`DD/MM/AAAA`)
     - Módulos afectados
     - Tipo de cambio
     - Resumen detallado de los cambios aplicados
   - También se puede ejecutar el script auxiliar automatizado:
     ```bash
     node scripts/bump-version.js "Descripción del cambio" --modules "Módulo Afectado"
     ```
3. **Comunicación al Usuario**:
   - En cada respuesta en la que se apliquen cambios de código, confirmar al usuario la nueva versión generada (ej. `v1.0.1`) y su registro correspondiente.
