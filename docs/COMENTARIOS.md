# Comentarios de la comunidad (PulsoVE)

Los **comentarios** son experiencias de visitantes; **no** son reportes de fallas ni entran en las estadísticas, gráficos, tendencias o decisiones del motor de incidentes.

## Experiencia pública

En `/servicios/[slug]#comentarios` se muestran hasta 20 comentarios aprobados del servicio, ordenados por fecha. No se publica ningún identificador de dispositivo, hash de red, información de moderación ni identidad personal. El formulario envía un texto de 15 a 500 caracteres, sin enlaces ni datos de contacto, y solicita aceptar la revisión previa. Las publicaciones son anónimas, sin registro.

Una respuesta HTTP 201 significa únicamente **recibido, pendiente de revisión**. El comentario enviado no aparece en la lista pública ni cuenta como reporte hasta que una persona autorizada lo revise y apruebe. Los comentarios se sirven como texto escapado por React; no se renderiza HTML del remitente.

## Prevención de abuso

- Límite de 3 envíos por identificador de dispositivo por hora y 60 por prefijo de red confiable por hora. Si no se dispone de IP confiable, se usa además un cupo **compartido de 30 envíos por hora** para evitar eludir límites rotando identificadores. Se usa el mismo mecanismo Redis compartido de los reportes; el modo en memoria solo es apropiado para una instancia.
- No se almacenan IP completas ni nombres/correos del autor; se conservan únicamente hashes HMAC y fecha para controlar abuso. `ANONYMIZATION_SALT` es imprescindible en producción.
- Los mensajes enviados dos veces al mismo servicio en los dos minutos siguientes se rechazan.
- Todas las publicaciones entran en estado `pending` de PostgreSQL; `approved` y `rejected` se registran explícitamente.
- El filtro automático de teléfonos, correos y enlaces es preventivo, **no sustituye** una revisión humana de datos personales, difamación, spam o material inapropiado.

## Moderación por operador autorizado

No existe una ruta pública para aprobar comentarios ni un administrador con credenciales client-side. **Solo un operador con acceso seguro a la base de datos** puede ejecutar:

```bash
npm run db:migrate:deploy
npm run comments:moderate -- list
npm run comments:moderate -- list approved
npm run comments:moderate -- list rejected
npm run comments:moderate -- approve <UUID>
npm run comments:moderate -- reject <UUID>
npm run comments:moderate -- remove <UUID> --confirm
npm run comments:moderate -- prune
npm run comments:moderate -- prune --confirm
```

Las aprobaciones y rechazos se registran en `audit_logs`. El comando solo modifica filas pendientes y admite un UUID exacto. Revisar el texto antes de aprobar, particularmente por posibles datos personales o declaraciones sobre terceros. No ejecutar el comando desde navegadores públicos. Si no hay personal disponible para moderar, no promover la publicación de los mensajes: permanecerán pendientes.

### Retiro de publicaciones y retención de pendientes

Si un visitante solicita el retiro de un comentario o un moderador detecta contenido inapropiado, el operador debe identificar el UUID correcto con `list approved` y ejecutar **`remove <UUID> --confirm`**. El texto, el hash anónimo y el hash de red se eliminan de la tabla; el log de auditoría guarda únicamente el ID, servicio, estado previo y el hecho de la eliminación, **nunca el contenido del mensaje ni sus identificadores pseudónimos**. La operación es irreversible. No existe un endpoint público de borrado ni un sistema de cuentas para verificar automáticamente la autoría: una petición debe tramitarse y comprobarse manualmente por el equipo responsable.

Política de limpieza que se puede ejecutar desde el servidor:
- Los comentarios `pending` con más de **30 días** y `rejected` con más de **7 días** son candidatos a eliminación.
- Los comentarios `approved` **no se eliminan automáticamente**; pueden retirarse individualmente mediante `remove`.
- `prune` sin bandera **solo muestra** el total de candidatos, sin borrar datos. `prune --confirm` elimina hasta **100** comentarios antiguos por ejecución y registra cada eliminación en `audit_logs`, sin conservar texto ni hashes.
- La limpieza **no se ejecuta sola**: un operador debe programarla y revisarla en un entorno con acceso seguro a la base de datos. Repetir la ejecución si se alcanzó el límite de 100.
- No hay portal de solicitudes ni identidad verificada de autores; antes de abrir la función públicamente, definir un canal real de contacto para solicitudes de retiro y un procedimiento de comprobación de cada petición.

## Despliegue

La migración `drizzle/0002_service_comments.sql` se aplica **antes** de desplegar la nueva versión de la aplicación Next.js; se requiere una base PostgreSQL disponible. GitHub Pages continúa siendo una **vista previa estática** sin publicación de comentarios. No se considera activa en producción hasta verificar migración, credenciales, rate limits compartidos y moderación operativa.

## Limitaciones

Versión inicial: no incluye respuestas, votos, avatares ni notificaciones. No existe borrado autoservicio ni flujo público de apelación: el retiro ahora es posible mediante comando auditado del operador; antes de ampliar la exposición debe existir un canal de solicitudes atendido por responsables. El control antiabuso puede ser eludido por actores sofisticados; la moderación previa sigue siendo obligatoria.
