# Welcome Buenos Aires

La aplicación integrada está en `index.html`, `app.js`, `business.js`, `operations.js` y `styles.css`.

Por instrucción del usuario, los tres módulos adjuntos por separado son la referencia funcional más avanzada y tienen prioridad sobre las simplificaciones de la aplicación inicial:

- `sistema inicio fotografo wba.html`: inicio, stock recibido, equipos recibidos/faltantes, fondo propio, precios mínimos por medio de pago, monedas, vuelto en ARS, incidencias y liquidación de jornada.
- `sistema welcome modulo punto de venta.html`: datos, contactos, horarios semanales y turnos, excepciones, acuerdos porcentuales/por unidad/fijos/combinados y condiciones de liquidación.
- `Welcome_Usuarios_Roles_Permisos.html`: alcance por rol/punto, separación de acciones, solicitudes de ajuste, revisión administrativa y permisos temporales.

Conservar esos originales como referencia. `point-editor.html` es una versión derivada del editor avanzado conectada al estado compartido; no usa su base independiente. Si cambia el editor derivado, revisar también el contrato con `wbaPointBridge`.

Usar un único modelo persistente para todos los módulos integrados. No crear bases localStorage independientes para funciones nuevas. Conservar históricos y documentar migraciones. No reconstruir costos históricos usando precios actuales.

`business.js` contiene la matriz original y los comandos de negocio. Las validaciones deben ejecutarse en esos comandos además de los controles de interfaz. Los cambios deben mantener el alcance por punto y por fotógrafo. Los encargados solicitan anulaciones; Administración/Dirección las aprueba con motivo y auditoría.

Leer `docs/integracion.md` para entender alcance y límites. Es un prototipo frontend: las restricciones en el navegador no equivalen a seguridad de servidor.

Verificar cambios de negocio con `node --test tests/business.test.cjs`. Para el flujo de navegador, iniciar `python3 -m http.server 8000 --bind 127.0.0.1` y ejecutar `python3 tests/integrated_smoke.py` con Playwright y Chromium disponibles. Las pruebas deben usar contextos temporales, sin borrar datos del usuario.

Usar el checkout existente. Las tareas cloud ya están aisladas; no crear worktrees salvo pedido explícito del usuario.
