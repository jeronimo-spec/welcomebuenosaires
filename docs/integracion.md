# Integración de los módulos avanzados

Los adjuntos originales son la referencia funcional. Esta integración modifica la aplicación principal y conserva los tres HTML originales y el documento Word.

## Reglas compartidas

| Referencia | Integración |
| --- | --- |
| Fotógrafo V7 | Confirmación de stock e indicaciones, ubicación verificada o excepción documentada, equipos recibidos/faltantes, fondo inicial, ventas bloqueadas hasta preparar jornada, precios mínimos, múltiples productos, cotización, vuelto ARS, incidencias, devolución de materiales, comisión y cierre por moneda. |
| Puntos avanzados | Editor derivado con sus secciones, contactos, calendario, uno/dos turnos, jornada completa, excepciones y acuerdos completos. Los datos se conectan a puntos, jornadas y aliados. Guardar un punto conserva los demás. Puntos con historial se pausan/finalizan. |
| Usuarios/roles | Matriz original en `business.js`, alcance por punto y fotógrafo, permisos separados por acción, solicitudes de anulación, revisión por otra persona, notificación interna a Dirección, auditoría y accesos temporales de consulta/exportación dentro del alcance asignado. |
| Resto del sistema | Ventas, catálogo, inventario de productos/materiales, equipos, objetivos, rendiciones, liquidaciones, acuerdos comerciales, finanzas y CSV consumen los mismos registros. |

La comisión del fotógrafo se toma del punto y se guarda en la venta. Cada venta nueva conserva nombre, precio, costo, receta, mínimo, cotización y comisión aplicados. Los cambios posteriores no modifican ese histórico. Los registros heredados sin costo/cotización completos se identifican como incompletos, sin inventar valores pasados.

Los precios iniciales de la foto impresa conservan el ejemplo V7: ARS 18.000, USD 12, BRL 50; cotizaciones de demostración USD 1.500 y BRL 300. Los mínimos generales son ARS 15.000 para efectivo/transferencia y ARS 16.000 para tarjeta. Los productos de menor precio usan un mínimo compatible con su precio base. Los parámetros, productos habilitados y precios por moneda se editan en **Puntos → Productos, caja y objetivos**. Son datos de demostración que deben revisarse con la empresa.

Los materiales iniciales de demostración son portarretratos, stickers, hojas y voligoma. El catálogo permite definir su consumo por producto; la asignación a jornada descuenta disponibilidad del punto. Una venta descuenta producto y materiales. El cierre devuelve las cantidades declaradas y conserva las diferencias.

## Caja y revisión

La caja física y el valor de venta son distintos. Si una venta vale USD 12 y se reciben USD 20, se entregan ARS 12.000 de vuelto a una cotización 1.500: la venta vale ARS 18.000, deben rendirse USD 20 físicos y la caja ARS baja ARS 12.000. El fondo propio se recupera primero. La comisión en efectivo solo puede pagarse con recaudación ARS del negocio, sin consumir el fondo del fotógrafo.

La rendición pasa por presentación, validación del encargado y aprobación administrativa. Una diferencia no se borra para hacerla coincidir: se observa, Administración/Dirección autoriza la diferencia documentada y se vuelve a validar. Los valores originales y la autorización quedan auditados. El pago de comisión exige aprobación previa.

Las solicitudes de anulación requieren otra persona para aprobar. Una venta que cambió desde la solicitud exige una nueva revisión. Las ventas de jornadas ya cerradas no se anulan por el flujo ordinario, pues también requerirían ajustar la rendición.

Los acuerdos comerciales guardan íntegros sus parámetros avanzados. Administración registra el importe revisado por aliado/período, moneda, cotización y referencia; ese costo se incorpora a finanzas. Los acuerdos por unidad pueden exigir tickets/pasajeros al cerrar. Los esquemas combinados, límites, comisiones de cobro, prorrateos y reglas expresadas en texto requieren cálculo documentado y revisión; no se interpretan automáticamente como fórmulas. Un cierre mensual exige jornadas aprobadas, cobros confirmados, solicitudes resueltas, comisiones pagadas y liquidaciones comerciales revisadas.

## Prueba reproducible

Desde la raíz del repositorio:

```sh
node --test tests/business.test.cjs
python3 -m http.server 8000 --bind 127.0.0.1
```

En otra sesión:

```sh
python3 tests/integrated_smoke.py
```

El test de navegador requiere Playwright y `/usr/bin/chromium`, disponibles en este entorno cloud. Crea un contexto aislado con datos temporales y prueba el editor avanzado, parámetros del punto, usuarios, equipo, jornada, stock, inicio móvil, caja, ventas ARS/USD, solicitud de anulación, aprobación, reversión, cierre, validación, comisión, CSV, alcance del encargado y costos de acuerdos. Los archivos CSV y la captura de diagnóstico se generan en `/tmp`.

## Límites de esta versión

Esta es una integración del prototipo frontend, sin servidor ni base compartida entre dispositivos. Las pestañas del mismo navegador reciben actualizaciones mediante `storage`; no se promete concurrencia transaccional entre equipos. Los comandos usan copia de estado para evitar escrituras parciales cuando falla una validación.

La autenticación demo, auditoría y permisos se guardan en el navegador y no ofrecen las garantías de un backend. Las notificaciones son internas a la aplicación; no se envían emails ni mensajes externos. Geolocalización solo se considera verificada cuando existen coordenadas/radio del punto y la precisión/distancia permiten confirmarla. Los permisos temporales no permiten saltarse la revisión de ventas confirmadas.

Siguen pendientes para producción: backend, base central, seguridad real, carga de datos empresariales, respaldos, despliegue HTTPS y conciliación con proveedores de cobro. También requieren etapas específicas los modelos de comisión escalonados/mínimos garantizados, reaperturas de períodos con ajustes compensatorios y automatización de contratos complejos. La vista financiera señala históricos incompletos y gastos extranjeros sin cotización; no presenta el resultado parcial como un cierre definitivo.
