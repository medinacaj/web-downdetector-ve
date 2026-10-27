# Bases de la beta privada

Objetivo autorizado: preparar una beta privada sobre Next.js y PostgreSQL existentes. Este bloque implementa protección Turnstile y una entrada de cron para el motor; el despliegue necesita proveedor, dominio y acceso aún no suministrados.

Enfoque elegido por el implementador: integrar Turnstile sin dependencias nuevas y proporcionar un ejecutor Linux con bloqueo local, conservando el comando manual de agregación. Alternativas: CAPTCHA propio aumenta mantenimiento; scheduler específico de hosting exige elegir proveedor. No se instala un scheduler ni se publica nada automáticamente.

Cuando ENABLE_TURNSTILE=true, la API exige un token verificado por Cloudflare, action=report y hostname igual al de SITE_URL. Configuración incompleta, errores de red y respuestas inválidas impiden insertar reportes. El navegador carga el widget únicamente si se habilita, informa fallos y renueva el desafío después de cada envío fallido. No se envía la IP a Cloudflare desde el servidor, ni se registran tokens o secretos. El script de Cloudflare sí implica interacción del navegador con un tercero; debe explicarse antes de activar la beta con usuarios.

Cron procesa la última ventana completa de 15 minutos y usa flock para impedir solapamientos en un único host. No promete recuperación automática de ejecuciones omitidas ni coordinación entre hosts. El modo manual existente conserva --at. Pruebas usan únicamente pulsove_test y respuestas simuladas del servicio externo.

Aceptación: rechazar tokens ausentes/inválidos y fallos del proveedor sin escribir en la base; aceptar éxito solo para hostname/action esperados; mantener funcionamiento local sin Turnstile; verificar límites de ventana y ejecución real del motor en PostgreSQL. Tipos, suite completa y build deben pasar.

Pendientes externos: hosting, dominio, barrera de acceso privado, claves reales Turnstile, backups y validación desde navegador contra el proveedor. No se afirma disponibilidad pública ni cumplimiento legal.
