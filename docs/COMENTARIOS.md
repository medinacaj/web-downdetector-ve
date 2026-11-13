# Comentarios de la comunidad (PulsoVE)

Los **comentarios** son experiencias de visitantes; **no** son reportes de fallas ni entran en las estadísticas, gráficos, tendencias o decisiones del motor de incidentes.

## Experiencia pública

En `/servicios/[slug]#comentarios` se muestran hasta 20 comentarios aprobados del servicio, ordenados por fecha. No se publica ningún identificador de dispositivo, hash de red, información de moderación ni identidad personal. El formulario envía un texto de 15 a 500 caracteres, sin enlaces ni datos de contacto, y solicita aceptar la revisión previa. Las publicaciones son anónimas, sin registro.

Una respuesta HTTP 201 significa únicamente **recibido, pendiente de revisión**. El comentario enviado no aparece en la lista pública ni cuenta como reporte hasta que una persona autorizada lo revise y apruebe. Los comentarios se sirven como texto escapado por React; no se renderiza HTML del remitente.

## Prevención de abuso

- Límite de 3 envíos por identificador de dispositivo por hora y 60 por prefijo de red confiable por hora. Se usa el mismo mecanismo Redis compartido de los reportes; el modo en memoria solo es apropiado para una instancia.
- No se almacenan IP completas ni nombres/correos del autor; se conservan únicamente hashes HMAC y fecha para controlar abuso. `ANONYMIZATION_SALT` es imprescindible en producción.
- Los mensajes enviados dos veces al mismo servicio en los dos minutos siguientes se rechazan.
- Todas las publicaciones entran en estado `pending` de PostgreSQL; `approved` y `rejected` se registran explícitamente.
- El filtro automático de teléfonos, correos y enlaces es preventivo, **no sustituye** una revisión humana de datos personales, difamación, spam o material inapropiado.

## Moderación por operador autorizado

No existe una ruta pública para aprobar comentarios ni un administrador con credenciales client-side. **Solo un operador con acceso seguro a la base de datos** puede ejecutar:

```bash
npm run db:migrate:deploy
npm run comments:moderate -- list
npm run comments:moderate -- approve <UUID>
npm run comments:moderate -- reject <UUID>
```

Las aprobaciones y rechazos se registran en `audit_logs`. El comando solo modifica filas pendientes y admite un UUID exacto. Revisar el texto antes de aprobar, particularmente por posibles datos personales o declaraciones sobre terceros. No ejecutar el comando desde navegadores públicos. Si no hay personal disponible para moderar, no promover la publicación de los mensajes: permanecerán pendientes.

## Despliegue

La migración `drizzle/0002_service_comments.sql` se aplica **antes** de desplegar la nueva versión de la aplicación Next.js; se requiere una base PostgreSQL disponible. GitHub Pages continúa siendo una **vista previa estática** sin publicación de comentarios. No se considera activa en producción hasta verificar migración, credenciales, rate limits compartidos y moderación operativa.

## Limitaciones

Versión inicial: no incluye respuestas, votos, avatares ni notificaciones. No existe borrado autoservicio ni flujo público de apelación; deberán añadirse antes de ampliar la exposición de contenido. El control antiabuso puede ser eludido por actores sofisticados; la moderación previa sigue siendo obligatoria.
