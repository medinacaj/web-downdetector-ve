# Canarios privados fuera del cliente — 09-11-2026

La comprobación local terminó con salida **0**, sin encontrar los siete marcadores privados en los archivos o respuestas públicas revisadas. La clave pública ficticia de Turnstile sí llegó al HTML y al payload RSC, y el detector rechazó una fuga simulada. Este resultado verifica esos escenarios, no la ausencia universal de secretos.

## Alcance y resultado

- Código y herramienta: `d796f5b0e7cd804e4ddd3dd15a01ee07963e3172`; ejecución `61c1535c7b24f365`.
- Inicio 09-11-2026 08:52:11; fin 09-11-2026 08:52:24, hora de Santiago. Evidencias con instantes UTC.
- Snapshot de 159 archivos versionados del directorio de trabajo, con SHA-256 agregado `d48e89ef12426b73691cb53de8da0f0b1af7553019840c16d00ed040448efee9`. Se rechazaron enlaces en esos archivos y variantes `.env*` distintas de `.env.example`.
- Se creó una copia independiente del proyecto y sus dependencias en una carpeta temporal, sin modificar el config, `.next` ni `.env` del proyecto original. Se migró y sembró otra base local de fixtures (71 servicios y 24 estados); nunca se escribió en la base fuente.
- Build de producción con Next.js 16.4.4, bundler predeterminado y salida standalone; sin modificar opciones de compilación para hacer aprobar el ensayo. Las fuentes externas del build usan la red permitida y la confianza TLS del entorno.
- Cinco variables de aplicación sustituidas: `DATABASE_URL`, `ANONYMIZATION_SALT`, `JWT_SECRET`, `TURNSTILE_SECRET_KEY` y `REDIS_URL`. Se revisaron además el nombre de la base temporal y la contraseña Redis ficticia: siete valores en total. La URL DB utiliza únicamente las credenciales locales de pruebas para acceder a la base recién creada.
- Representaciones buscadas: literal, componente URI, cadena JSON escapada y base64 del valor completo. El detector no imprime los valores al fallar.

| Comprobación | Resultado |
| --- | --- |
| Artefactos de `.next/static` y `public` | 30 archivos; 984186 bytes; sin canarios privados detectados |
| Entrega HTTP de esos artefactos | 30 respuestas coinciden byte por byte con los archivos revisados |
| HTML | Siete páginas: inicio, directorio, Movistar, mapa, estadísticas, incidentes y metodología |
| RSC separado | Movistar con `RSC: 1` y `?_rsc=`; `text/x-component` comprobado |
| Lectura API | Nueve respuestas 200 con contrato JSON público, incluyendo salud, servicios, reportes, incidentes, mapa y estadísticas |
| Envío sin desafío | 422 con cuerpo de reporte ficticio válido y sin token Turnstile |
| Archivos internos | Siete rutas 404: `.env`, `.env.local`, `.env.production`, `.git/config`, `package.json`, `next.config.mjs` y `/_next/server/app/page.js` |
| Respuestas verificadas | 55, incluidos cuerpos y cabeceras |
| Controles positivos | Clave pública presente en HTML/RSC; marcador privado simulado rechazado |
| Limpieza | Servidor detenido, DB ausente, proyecto temporal eliminado; cero errores |

No se hizo una verificación real contra Cloudflare ni se inició una conexión a Redis: el POST carece de token y se rechaza antes de llegar a cuotas. La site key es pública y ficticia; el secret de Turnstile es otro valor reservado al servidor. No se ejecutó un navegador ni se contactaron los proveedores del catálogo.

Se comprobó por separado que la base no existiera y el puerto del servidor estuviera cerrado. La eliminación del directorio se verificó dentro del runner. El proceso terminó con código 0. Metadatos portables sin los valores: [canarios-cliente-2026-11-09.json](evidencias/canarios-cliente-2026-11-09.json).

## Pruebas y revisión

- Detector: seis pruebas, con cinco fallos esperados frente a la implementación vacía y seis aprobadas al implementar el control; incluyen omisión de valores del mensaje de error y rechazo de configuración vacía.
- Suite completa: **167 pruebas en 23 archivos**, aprobadas. Estándares, tipos y sintaxis Node aprobados; snapshot de los nuevos archivos sin coincidencias de Gitleaks.
- Revisión independiente del script, pruebas y paso CI: sin hallazgos. La última ejecución se repitió desde el commit de la herramienta para incluir también sus archivos versionados en el snapshot.
- Dos ejecuciones iniciales quedaron incompletas en HTTP: el probe RSC no incluía `_rsc`. Se contrastó con la validación de headers en Next 16 y se corrigió la solicitud. No se deshabilitó esa validación ni se cambió el código del sitio. Se conservan sus resultados fallidos y limpieza en `.runtime/client-secrets/`.

Harness ejecutado SHA-256 `3e883cdd393b9549b2d0f6a2df7cd04e01cf258e545054ca1e3d8f02dbf5b4e3`. Snapshot del harness, resultados, logs y respuestas de control quedan en `.runtime/client-secrets/61c1535c7b24f365/`, ignorado por Git. No se publican respuestas ni valores como artefactos de CI.

## Repetición

Con dependencias instaladas y `DATABASE_URL` local terminada en `_test`, sin parámetros/fragmentos y con permiso para crear bases:

```sh
npm run smoke:client-secrets
```

No pasar credenciales por la línea de comandos ni usar producción. El runner realiza su propio build, migra y siembra una base nueva, escucha solo en loopback y elimina únicamente sus recursos. El copiado de dependencias necesita espacio temporal; una terminación forzada del proceso o del entorno puede exigir revisar recursos remanentes.

El paso se añadió a `.github/workflows/p1-quality.yml`. Está configurado, **no ejecutado en GitHub**; tampoco acredita una protección de rama ni un despliegue.

## Límites pendientes

Es una inspección de archivos y respuestas HTTP seleccionadas, sin ejecutar JavaScript en navegador, hidratación ni interacción humana. No detecta necesariamente fragmentos, otras codificaciones, transformaciones criptográficas, secretos desconocidos o dependencias/configuraciones diferentes. No es un análisis completo de XSS, autorización, privacidad, suministro ni todas las rutas o combinaciones de datos.

No sustituye revisar los secretos reales y variables públicas del hosting, sus reglas de entrega de archivos, CDN, logs, mapas de fuentes, TLS y permisos. Un build con canarios puede comportarse de forma distinta de otra configuración. Volver a comprobar las salidas y barreras de acceso del entorno elegido antes de aceptar usuarios.
