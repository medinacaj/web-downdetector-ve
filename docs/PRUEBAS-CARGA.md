# Pruebas locales de carga, estrés, picos y resistencia

Estas pruebas miden HTTP en una instancia **aislada** con base de datos ficticia y compilación de producción. No autorizan pruebas contra servidores externos ni predicen por sí solas la capacidad de un hosting distinto.

## Preparación y seguridad

- Herramienta: autocannon 8.0.0, instalada fuera de las dependencias de la aplicación. Por ejemplo, `npm install --prefix /workspace/.cloud-setup/load-tools autocannon@8.0.0` y `NODE_PATH=/workspace/.cloud-setup/load-tools/node_modules`.
- Ejecutar `npm run build` antes del ensayo. No reconstruir, instalar dependencias, ejecutar otras pruebas o generar tráfico adicional durante la medición.
- `DATABASE_URL` debe ser una conexión local de pruebas terminada en `_test`, sin query ni fragmentos; se reutiliza la guardia del ensayo de migraciones. Requiere privilegio para crear bases temporales.
- El runner crea un nombre aleatorio nuevo, migra y siembra esa base. Nunca ejecuta las escrituras de carga en la base fuente. HTTP apunta exclusivamente al puerto loopback que el propio runner asigna al servidor temporal.
- Los resultados se guardan en `.runtime/load-tests/<run-id>/`, ignorado por Git. La limpieza elimina únicamente servidor, worker y base de fixtures creados por el ensayo. Una interrupción forzada del entorno puede requerir revisar recursos temporales remanentes.

Comando en este entorno, utilizando la conexión de pruebas existente:

```sh
NODE_PATH=/workspace/.cloud-setup/load-tools/node_modules \
LOAD_SOAK_SECONDS=600 \
npm run perf:local
```

Proporcionar `DATABASE_URL` por el entorno seguro del proceso, no guardar credenciales en el repositorio. El runner admite entre 60 y 14.400 segundos de resistencia. Una ejecución de diez minutos **no es una prueba de resistencia de varias horas**.

## Dataset y tráfico

Se cargan 71 servicios, 24 estados y 20.000 reportes ficticios repartidos en seis horas, con tipos de problema correspondientes a cada categoría. El dataset crece con los envíos efectuados durante las fases; los conteos antes/después se registran para no confundir crecimiento de datos con concurrencia como única causa de variación.

Cada conexión recorre diez solicitudes con pipelining 1:

1. Inicio `/` (HTML estático generado en build).
2. Directorio `/servicios`.
3. Directorio filtrado por telecomunicaciones.
4. Detalle de Movistar.
5. API de servicios paginada.
6. API de búsqueda de Movistar.
7. API de mapa agregado.
8. API de estadísticas.
9. API de estado de Movistar.
10. POST de reporte ficticio.

La secuencia prevista tiene 10% HTML estático, 30% HTML dinámico, 50% lectura API y 10% escritura. La mezcla **observada** figura por ruta: una fase puede terminar a mitad de una secuencia. Cada envío representa un nuevo reportante ficticio; no se modifican las cuotas del código, pero esta carga no prueba campañas con la misma identidad ni cuota por red confiable.

Turnstile, Redis, geolocalización técnica y sondeos externos permanecen deshabilitados en el fixture. No se cargan JS, CSS, imágenes ni fuentes del navegador; no se mide interacción humana, TLS, CDN, WAF, conexiones WAN ni Core Web Vitals. La concurrencia indicada son conexiones HTTP activas, no una estimación de usuarios humanos o sesiones con login.

## Fases del perfil inicial

| Fase | Conexiones | Duración configurada | Propósito |
| --- | --- | --- | --- |
| Calentamiento | 2 | 15 s | Comprobar los contratos de los flujos y calentar la instancia |
| Referencia | 5 | 30 s | Latencia y throughput a baja concurrencia |
| Carga | 20 | 60 s | Demanda sostenida inicial |
| Estrés gradual | 40, 80, 160, 256 | 30 s por escalón | Buscar degradación; detener aumentos ante errores o p95 observado >5 s |
| Recuperación tras estrés | 5 | 20 s | Comprobar respuesta después de retirar presión |
| Pico | 128 | 20 s | Salto repentino de concurrencia |
| Recuperación tras pico | 5 | 30 s | Observar retorno a la carga baja |
| Resistencia inicial | 20 | 600 s elegidos por el usuario | Tasa objetivo = 50% del RPS observado en carga, acotada a 5–50 req/s |
| Recuperación final | 5 | 20 s | Comprobar estado final |

El límite p95 de cinco segundos y el guardia de memoria de 24 GiB son límites preventivos del ensayo local, **no SLO comerciales ni criterios de conformidad universales**. Si se llega al tope de concurrencia sin degradación, el límite definitivo no queda establecido. Una parada preventiva no es un colapso demostrado.

Se inicia un ciclo del worker a mitad de la resistencia, y se registra su resultado por separado. El ensayo no implementa un scheduler de producción ni recuperación automática de ventanas omitidas.

## Métricas y lectura del informe

- Por fase: duración real, solicitudes recibidas, RPS, estados HTTP, errores de transporte, timeouts y cuerpos incompatibles con el contrato esperado.
- Latencia observada: percentiles de las respuestas que llegaron, incluidas las no exitosas; los timeouts y solicitudes sin respuesta se contabilizan aparte. No interpretar un percentil bajo como éxito si hay errores.
- El JSON original de autocannon conserva su histograma. Para la resistencia con tasa limitada, la herramienta aplica su corrección de omisión coordinada; el informe distingue ese histograma de los percentiles observados calculados sobre respuestas recibidas.
- Cada dos segundos se registra RSS/CPU del proceso web, memoria del cgroup y conexiones/actividad en la base de fixtures. CPU de generador se registra por fase. El generador, web y PostgreSQL comparten máquina: el cliente también consume los recursos cuya capacidad se evalúa.
- Se comprueban respuestas HTML/JSON válidas y contratos de los endpoints. El conteo de filas compatible con respuestas 201 es una comprobación agregada, no una demostración individual de persistencia ni de integridad transaccional de cada reporte.
- `completed` expresa que concluyó la secuencia, no que todas las fases aprobaron. Un estrés puede encontrar degradación esperada; errores de resistencia, recuperaciones o worker deben calificarse expresamente. Comprobar también el código de salida y el resultado de limpieza.

RSS creciente no demuestra una fuga: puede corresponder a calentamiento, cachés o GC. Comparar ventanas de tiempo a carga equivalente y confirmar durante horas antes de concluir que hay o no fuga de memoria. La prueba inicial de diez minutos sirve para descubrir problemas evidentes y preparar una prueba prolongada posterior.
