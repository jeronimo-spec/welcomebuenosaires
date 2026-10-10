# Cómo probar Welcome Buenos Aires

El código integrado está en la rama `main`. Para tener un enlace que puedas abrir desde la computadora o el celular, habilitá GitHub Pages en el repositorio. Esta guía no confirma que el sitio ya esté publicado.

## Publicar la versión de prueba sin instalar herramientas

1. Ingresá a GitHub con la cuenta que administra el repositorio.
2. Abrí [Settings → Pages](https://github.com/jeronimo-spec/welcomebuenosaires/settings/pages).
3. En **Build and deployment**, seleccioná **Deploy from a branch** como **Source**.
4. En **Branch**, elegí **main** y **/ (root)**. Presioná **Save**.
5. Esperá a que GitHub muestre el enlace del sitio y usá **Visit site**. Si conserva el nombre actual y no usa un dominio personalizado, la dirección esperada es `https://jeronimo-spec.github.io/welcomebuenosaires/`.

Si la opción Pages no aparece o GitHub pide un cambio de plan o de visibilidad, no cambies la privacidad del repositorio para seguir esta guía. La alternativa es ejecutar la prueba local que figura en el README.

GitHub Pages publica el prototipo en Internet. Usá datos ficticios en la prueba. La información cargada se guarda en ese navegador; no se sincroniza entre dispositivos ni usuarios remotos. Las credenciales incluidas son de demostración.

## Entrar y recorrer la versión

La contraseña para todos estos usuarios es **welcome2026**.

| Vista | Usuario |
| --- | --- |
| Dirección / dashboard | `admin@welcome.com` |
| Fotógrafo | `fotografo@welcome.com` |
| Encargado | `jonatan@welcome.com` |
| Auditor | `auditor@welcome.com` |

1. Ingresá como Dirección para ver el dashboard y revisar puntos de venta, productos, usuarios y jornadas.
2. Cerrá sesión y entrá como Fotógrafo para ver **Mi jornada**. Probá registrar una venta y revisá **Mis ventas**. Si no tiene jornada activa, programá una desde Dirección y completá los pasos de inicio como Fotógrafo.
3. Cerrá sesión y volvé a entrar como Dirección, en el mismo navegador, para comprobar el cambio en ventas y stock.
4. Para probar el cierre completo, entrá como Fotógrafo y usá **Cerrar y rendir**; después entrá como Encargado para validar y como Dirección para revisar la aprobación y el pago.

Los registros de las capturas provienen de una prueba automatizada aislada. Los nombres, fechas y totales pueden diferir de los datos iniciales de tu navegador.

## Ver las capturas

- [Dashboard integrado](capturas/dashboard.png)
- [Vista del fotógrafo](capturas/fotografo.png)

Estas capturas muestran la interfaz; para interactuar con los módulos abrí el sitio publicado o el servidor local.
