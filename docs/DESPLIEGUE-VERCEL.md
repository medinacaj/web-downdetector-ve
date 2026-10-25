# Despliegue en Vercel + Neon

Guía para publicar PulsoVE con la cuenta de Vercel de la persona propietaria (plan
Hobby) y una base PostgreSQL en Neon. El código queda en GitHub y Vercel publica
`main` en cada `push`.

**Estado (2026-10-19):** preparado y probado en local con `npm run build` +
`npm start`. **Todavía no se ha desplegado.** El conector de Vercel de la sesión
puede leer la cuenta, pero no tiene permiso para crear proyectos (403), así que los
pasos de este documento los hace la persona propietaria desde los paneles.

## Qué se publica y qué no cambia

- **La web** (páginas, API, panel `/admin`) corre en funciones de Vercel.
- **La base** es Neon (PostgreSQL).
- **El motor** no lo programa Vercel: en el plan Hobby sus tareas programadas
  (Cron) se limitan a una ejecución al día (según su documentación; no pude
  reconfirmarlo en esta sesión porque la red bloquea vercel.com/docs), y el motor
  necesita una cada 15 minutos. Lo dispara GitHub Actions (`.github/workflows/engine-cron.yml`)
  llamando a `POST /api/cron/engine` con una clave.
- **La indexación sigue cerrada** (opción A): `SITE_INDEXING="false"`. Publicar no
  abre el sitio a Google.

## Paso 1 — Unir el PR a `main`

GitHub solo ejecuta tareas programadas desde la rama por defecto, y Vercel publica
producción desde `main`.

## Paso 2 — Crear el proyecto en Vercel

1. En vercel.com: **Add New → Project** → importa `medinacaj/web-downdetector-ve`.
   Si no aparece, autoriza a Vercel el acceso al repositorio en GitHub.
2. Vercel detecta Next.js; no cambies los comandos de build.
3. Antes del primer despliegue, en **Settings → Environment Variables** (entorno
   **Production**) añade:

   | Variable | Valor |
   |---|---|
   | `SITE_URL` | `https://<nombre-del-proyecto>.vercel.app` (la dirección que te dé Vercel, sin barra final) |
   | `SITE_INDEXING` | `false` |
   | `ANONYMIZATION_SALT` | resultado de `openssl rand -hex 32` |
   | `ADMIN_ENCRYPTION_KEY` | otro `openssl rand -hex 32` (64 caracteres hex). Si se pierde, cada administrador debe rehacer su segundo factor |
   | `CRON_SECRET` | otro `openssl rand -hex 32` |
   | `ENABLE_TURNSTILE` | `false` (hasta tener las claves de Cloudflare) |

   Genera cada valor por separado y guárdalos en un gestor de contraseñas. **Nunca**
   los pongas en el repositorio (es público). Si no tienes terminal, cualquier
   generador de contraseñas de 64 caracteres hexadecimales sirve.

## Paso 3 — Base de datos (Neon)

1. En el proyecto de Vercel: **Storage → Create Database → Neon** (Marketplace) y
   conéctala al proyecto. Elige una región en el este de EE. UU. (la más cercana a
   Venezuela y a las funciones de Vercel por defecto).
2. La integración añade `DATABASE_URL` (con `-pooler`, la que usa la web; el
   código desactiva las sentencias preparadas con esa URL) y una URL sin pooler
   (normalmente `DATABASE_URL_UNPOOLED`).
3. **Previsualizaciones:** si la integración ofrece crear una rama de base por cada
   *preview*, actívala; si no, los despliegues de prueba escribirían en la base de
   producción.

## Paso 4 — Migrar y sembrar (desde GitHub, sin computadora)

1. En GitHub: **Settings → Secrets and variables → Actions → New repository
   secret**:
   - `DATABASE_URL`: la URL **sin pooler** de Neon (las migraciones van mejor por
     conexión directa).
   - `ADMIN_EMAIL` y `ADMIN_PASSWORD` (mínimo 12 caracteres): la cuenta del panel.
2. **Actions → "Base de datos (migrar y sembrar)" → Run workflow**, con
   *Cuenta del panel* = `crear`.
3. Debe terminar en verde: migraciones aplicadas (0000 a 0004), 71 servicios sembrados y la cuenta
   creada. Después **borra** los secretos `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
   Puedes volver a ejecutarlo sin riesgo (es idempotente) cuando haya migraciones
   nuevas.

Los registros de Actions de un repositorio público los puede ver cualquiera: por eso
el correo y la contraseña van como secretos (GitHub los oculta) y no como campos
del formulario.

## Paso 5 — Desplegar y activar el motor

1. En Vercel: **Deployments → Redeploy** (o haz un `push` a `main`) para que la web
   arranque con la base ya preparada.
2. En GitHub, **Settings → Secrets and variables → Actions**:
   - pestaña **Variables**: `PULSOVE_URL` = `https://<nombre-del-proyecto>.vercel.app`
   - pestaña **Secrets**: `CRON_SECRET` = el mismo valor que en Vercel
3. **Actions → "Motor (cada 15 min)" → Run workflow**. Debe responder `200` con la
   ventana procesada. Desde ahí corre solo en los minutos 2, 17, 32 y 47 de cada hora.

## Paso 6 — Comprobar

- `https://<proyecto>.vercel.app/` → 200; `/api/services` → `meta.total = 71`.
- `/robots.txt` → `Allow: /`, `Disallow: /api/` y **sin** línea `Sitemap`;
  `/sitemap.xml` vacío; el HTML con `<meta name="robots" content="noindex, follow">`.
- La portada muestra «Último análisis …» con una hora de hace menos de 15–30 min y
  ningún aviso «Datos desactualizados» (si aparece, el motor no se está ejecutando).
- `/admin` → pide correo y contraseña; en el primer acceso, alta del segundo factor
  con el QR (app de autenticación).
- Envía un reporte desde una página de servicio: el formulario debería sugerir tu
  estado (cabecera `x-vercel-ip-country-region`). Es la primera prueba real de esa
  función.

## Limitaciones conocidas

- **Motor por GitHub Actions:** GitHub retrasa y **omite** ejecuciones programadas.
  Prueba en casa: el historial de Monitor Cashea (`medinacaj/monitor-cashea`, mismo
  intervalo de 15 min) guarda solo 44 comprobaciones entre el 18 y el 25/10/2026,
  donde se esperaban unas 670. Desde aquí no se ven sus registros de Actions, así que
  no se sabe si GitHub no las ejecutó o si fallaron al publicar. Para que eso no
  pierda datos:
  - el endpoint procesa ventanas *cerradas*, así que un retraso no deja ninguna a medias;
  - recupera en orden las ventanas pendientes desde la última procesada (hasta
    `ENGINE_MAX_CATCH_UP_WINDOWS` = 8, es decir 2 h);
  - si pasan 60 min sin un ciclo (`ENGINE_STALE_AFTER_MINUTES`), las páginas avisan
    «Datos desactualizados».

  GitHub además **desactiva** las tareas programadas tras 60 días sin actividad en un
  repositorio público (se reactivan desde la pestaña Actions). **Recomendado:** un
  servicio de cron externo gratuito (p. ej. cron-job.org) que haga el mismo `POST` a
  `/api/cron/engine` cada 15 min con la cabecera `Authorization: Bearer <CRON_SECRET>`,
  y dejar GitHub Actions como respaldo: llamarlo dos veces no duplica nada (la segunda
  llamada responde `processed: []`).
- **Límite de intentos en memoria:** sin `REDIS_URL`, cada instancia de función
  lleva su propia cuenta, así que el límite de reportes y de accesos al panel es
  más débil que con un solo servidor. Para endurecerlo: un Redis gestionado (por
  ejemplo Upstash, desde el Marketplace de Vercel) y su URL en `REDIS_URL`. No
  probado todavía.
- **Plan Hobby:** según las condiciones de Vercel, está pensado para uso personal y
  no comercial; revísalo si el proyecto cambia de naturaleza.
- **Dominio:** con `*.vercel.app` no hace falta comprar uno. Al tener dominio propio
  se cambia `SITE_URL` (y se redirige `*.vercel.app` al dominio), ver
  `docs/SEO-PENDIENTE.md` (S3).
