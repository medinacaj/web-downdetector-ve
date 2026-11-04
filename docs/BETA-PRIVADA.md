# Preparar la beta privada

El entorno cloud de desarrollo no es el alojamiento público. Esta entrega prepara Turnstile y un trabajo programado; no crea infraestructura ni publica el sitio.

## Web, acceso y datos

Usar Node.js 22.12+ de la serie 22 o 24 LTS, PostgreSQL >=16 persistente y una base separada para pruebas. Elegir proveedor, región y dominio HTTPS. Antes de invitar usuarios, colocar una barrera de acceso del proveedor o proxy autenticado delante de **todas las páginas y API**. `PUBLIC_INDEXABLE=false` impide indexación, pero no restringe acceso.

Configurar `DATABASE_URL`, `JWT_SECRET` y `ANONYMIZATION_SALT` mediante el almacén de secretos del hosting. No reutilizar valores de desarrollo. Configurar `SITE_URL=https://dominio-aprobado` y mantener `PUBLIC_INDEXABLE=false`. Los servicios semilla son demostrativos: no presentarlos como mediciones reales ni cambiar su marca sin verificar las fuentes.

Para una sola instancia puede usarse rate limiting en memoria; para varias, configurar Redis. `TRUSTED_CLIENT_IP_HEADER` debe permanecer vacío hasta verificar que el proxy sobrescribe la cabecera y elimina valores del cliente.

## Turnstile

Crear un widget para el dominio elegido en Cloudflare y configurar en el **servidor**:

```dotenv
ENABLE_TURNSTILE=true
TURNSTILE_SITE_KEY=<clave pública del widget>
TURNSTILE_SECRET_KEY=<secreto del widget>
SITE_URL=https://dominio-aprobado
```

No guardar esas asignaciones con valores reales en Git. La página entrega únicamente la clave pública al navegador. Permitir HTTPS a `challenges.cloudflare.com` desde el servidor y el navegador (también en CSP si el despliegue la establece). Verificación en servidor: timeout de 5 segundos, `success=true`, `action=report`, hostname igual al de `SITE_URL`. Un fallo de verificación nunca inserta un reporte. Falta de configuración o proveedor inaccesible: 503. Token ausente/inválido: 422. El modo local conserva `ENABLE_TURNSTILE=false` y no carga el widget.

Explicar la interacción del navegador con Cloudflare en la información de privacidad antes de activar el servicio. El verificador del servidor no envía `remoteip`, ni guarda tokens o secretos en reportes/logs. Esto no constituye una certificación de anonimato o cumplimiento legal: identificadores seudónimos y texto libre requieren revisión, plazos de retención y un contacto responsable.

Validar en un navegador con claves reales: desafío correcto, expiración, bloqueo del script, rechazo, reintento tras fallo de API y envío de otro reporte. Verificar que una petición directa sin token tampoco inserta datos. Las respuestas simuladas de las pruebas no sustituyen esta comprobación.

## Motor periódico en Linux: un único host

El hosting debe ofrecer cron o un worker programado. En un host persistente, instalar `deploy/aggregate.cron.example` en el crontab del usuario de la aplicación, ajustando la ruta `/srv/pulsove` y su PATH. Requiere Bash y `flock` de util-linux. El usuario necesita lectura del `.env` (permisos 600), acceso a PostgreSQL y escritura en `.runtime/` y al archivo de log.

```sh
cd /srv/pulsove
bash scripts/aggregate-scheduled.sh
```

El ejemplo corre a los minutos 2, 17, 32 y 47 y procesa la última ventana completa de 15 minutos. Por ejemplo, a las 12:17 UTC procesa 12:00–12:15, evitando contar solo parte de la ventana actual. Devuelve el código de error del motor; omite el intento si otro proceso del mismo host conserva el bloqueo. No borrar `.runtime/aggregate.lock` mientras haya trabajos activos. Ejecutar siempre desde el mismo checkout y usuario. El comando manual `npm run aggregate:run -- --at=ISO --window=15` conserva su comportamiento anterior.

Limitaciones: el bloqueo es local, no coordina hosts ni invocaciones manuales; no instalar múltiples programadores. Una caída del host puede omitir ventanas. No hay recuperación automática ni garantía de ejecución exactamente una vez. Revisar logs, configurar alerta por ausencia de ciclos y planificar recuperación antes de operar con tráfico real. No ejecutar recuperación histórica sobre incidentes activos sin revisar el motor y respaldar la base.

## Instalación y pruebas

La migración `0002_integrity_constraints` requiere la transacción del flujo
`npm run db:migrate:deploy`. No aplicar ese archivo con `psql -f` en autocommit:
su preflight y los cambios de restricciones deben ejecutarse como una unidad.

```sh
npm ci
npm run db:migrate:deploy
npm run db:seed
npm run build
```

Para producción standalone, copiar `.next/static` a `.next/standalone/.next/static` y, si existe, `public` a `.next/standalone/public`; iniciar `node .next/standalone/server.js` con las variables del hosting. El proceso del motor también necesita los scripts TypeScript y `tsx`, actualmente dependencia de desarrollo: conservarlos en el worker; no usar una imagen standalone mínima como worker sin prepararla.

Preparar **pulsove_test**, migrarla y sembrarla antes de:

```sh
DATABASE_URL=postgresql://<usuario>:<clave>@<host>/pulsove_test npm test
npm run typecheck
```

Nunca ejecutar esa suite contra producción. Incluye inserciones de reportes ficticios y simulaciones del proveedor externo.

La prueba de navegador reproducible está en `scripts/smoke-turnstile.cjs`.
Requiere Chromium y `playwright-core` instalado fuera del checkout (o resoluble mediante `NODE_PATH`), sin añadir dependencias a la aplicación.
Iniciar previamente el servidor de pruebas con `ENABLE_TURNSTILE=true`, una `TURNSTILE_SITE_KEY` ficticia y `SITE_URL=https://beta.example.test`; luego ejecutar el script con `SMOKE_BASE_URL` apuntando a ese servidor (por defecto puerto 3002) y `CHROMIUM_PATH` si Chromium no está en `/usr/bin/chromium`.
El script simula el widget y la respuesta del POST únicamente en el navegador: comprueba consentimiento, bloqueo sin token, expiración, reintento, error de API y segundo reporte. No verifica claves ni comunicación real con Cloudflare.

## Pendientes para activar

- Hosting, región, dominio y autorización de acceso al proveedor.
- Protección efectiva de beta privada en páginas y API.
- Claves Turnstile reales y comprobación desde navegador en el dominio aprobado.
- Backup automático cifrado, retención y prueba de restauración.
- Programador instalado y alerta por fallos/ausencia de ciclos.
- Monitores configurados usando `/api/health/live` para vida y `/api/health` para lectura mínima de DB; no confundirlos con una prueba completa del servicio (ver `OPERACION-ITIL.md`).
- Revisión de privacidad, contacto responsable y catálogo; no hay certificación legal.
- Pruebas de despliegue: HTTPS, reportes, vistas, aislamiento de pruebas, recuperación y límites detrás del proxy.

El panel administrativo, moderación, detección avanzada de campañas, gráfico histórico y tiempo real siguen siendo trabajo posterior. Los logs actuales no equivalen a una plataforma de observabilidad completa.
