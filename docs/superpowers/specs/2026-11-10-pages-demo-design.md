# Vista previa estática para GitHub Pages

El usuario aprobó una demo navegable con datos ficticios para evaluar el diseño sin Docker, hosting propio ni dominio. Inicio, directorio con búsqueda/filtros, fichas, mapa, estadísticas, incidentes y metodología conservarán los componentes y estilos actuales. Un aviso persistente identificará la demo; los formularios no enviarán ni guardarán reportes y no mostrarán confirmaciones falsas.

Alternativas: mantener Docker impide el acceso que necesita el usuario; capturas no permiten navegar. Se seleccionó la exportación estática de Next.js con adaptadores de fixtures aislados, sin cambiar las consultas o endpoints de producción. El catálogo reutiliza semillas públicas; únicamente un servicio ficticio tendrá actividad. No se copian bases, variables privadas ni credenciales.

La construcción crea una carpeta temporal desde una lista explícita de archivos y superpone los adaptadores de demo. La exportación usa `/web-downdetector-ve` y directorios con `index.html`, compatibles con Pages. No indexar la demo. Publicar solo los archivos exportados en una rama `gh-pages`; nunca publicar código de servidor, `.env`, node_modules o bases en esa rama. La activación de Pages depende de permisos de GitHub: verificar disponibilidad y documentar el paso manual si la API rechaza la configuración.
