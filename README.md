# Welcome Buenos Aires — Web App de Gestión

Prototipo funcional responsive, sin dependencias externas y listo para abrir en navegador.

## Cómo usarlo

1. Abrir `index.html` directamente, o ejecutar un servidor local:
   - Python: `python3 -m http.server 8080`
   - Luego abrir `http://localhost:8080`
2. Usuarios demo:
   - Dirección: `admin@welcome.com`
   - Encargado: `jonatan@welcome.com`
   - Fotógrafo: `fotografo@welcome.com`
   - Auditor: `auditor@welcome.com`
   - Contraseña para todos: `welcome2026`

## Funciones incluidas

- Login y navegación según rol.
- Dashboard ejecutivo en tiempo real.
- Programación, inicio y cierre de jornadas.
- Registro y anulación auditada de ventas.
- Rendiciones con cálculo automático de diferencias.
- Movimientos de stock y alertas por mínimo.
- Gestión de dispositivos y equipamiento.
- Objetivos, ranking, premios y comisiones estimadas.
- Gastos, resultado mensual y cierre de período.
- Puntos de venta, productos, aliados, usuarios y permisos.
- Auditoría completa.
- Exportación CSV compatible con Excel.
- Persistencia local mediante `localStorage`.
- Diseño mobile first y soporte PWA básico.

## Alcance técnico

Este paquete es un prototipo frontend funcional. Guarda la información en el navegador del dispositivo. Para producción requiere un backend seguro, base de datos central, autenticación real, API, backups, control de concurrencia y despliegue HTTPS.

## Arquitectura recomendada para producción

- Frontend: React/Next.js o Vue/Nuxt.
- Backend: Laravel, NestJS o Django.
- Base de datos: PostgreSQL.
- Autenticación: sesiones seguras + MFA opcional.
- Archivos: almacenamiento S3 compatible.
- Reportes: colas de procesamiento y exportación XLSX/PDF.
- Infraestructura: Docker, backups automáticos, monitoreo y CI/CD.
