# Catálogo de servicios

Qué servicios monitorea PulsoVE, por qué cada uno está aquí y cómo añadir o
retirar otros. Los datos viven en `src/lib/db/seed-data/` (categorías, tipos de
problema, servicios) y se cargan con `npm run db:seed`.

- **Estado actual:** 71 servicios en 8 categorías, 25 tipos de problema.
- **Última revisión de fuentes:** 10 de octubre de 2026.
- **Naturaleza de los datos:** todos los servicios son **demostrativos**
  (`is_demo = true`) y ninguno tiene `official_url` (queda `null` hasta que una
  persona la verifique). Estar en el catálogo **no** afirma que el servicio
  funcione, que esté autorizado ni que PulsoVE tenga relación con él.

## 1. Criterio de inclusión

Un servicio entra al catálogo si cumple las tres condiciones:

1. **Evidencia pública y fechada de uso o disponibilidad en Venezuela**: al menos
   una fuente (medio, estudio, informe de mercado) anotada en la sección 4. Un
   nombre que "suena conocido" no basta.
2. **Algo que un usuario pueda reportar**: depende de un servicio en línea
   (aplicación, portal, red, cuenta) cuya caída o degradación se nota. Si no se
   evaluó esa dependencia (p. ej. juegos que pueden funcionar sin conexión), el
   servicio queda como candidato (sección 5).
3. **Se puede describir sin inventar**: la descripción es genérica y neutra
   ("lo que hace", no "qué tan bueno es"), sin cifras, precios, cobertura,
   promociones ni afirmaciones legales.

Lo que las fuentes miden **no es cuota de mercado de cada servicio**: StatCounter
mide tráfico web, NapoleonCat audiencia publicitaria, Parrot Analytics demanda de
contenido, Ecoanalítica una encuesta. Sirven como indicio de uso, no como ranking.

## 2. Cómo añadir o retirar un servicio

**Añadir**

1. Reunir al menos una fuente pública fechada y anotarla en la sección 4 de este
   documento (con enlace). Si hay una cautela (bloqueos, legalidad), anotarla en
   la sección 6.
2. Agregarlo a `src/lib/db/seed-data/services.ts`: `slug` en minúsculas con
   guiones (único, hasta 96 caracteres), `name`, `categorySlug` existente y una
   descripción neutra de hasta 200 caracteres, sin enlaces. **Nunca** `officialUrl`.
3. Si hace falta una categoría nueva: `categories.ts` (con `sortOrder`
   consecutivo) y al menos dos tipos de problema propios en `issue-types.ts`
   (los `slug` son únicos en toda la tabla; sin ellos el formulario solo ofrecería
   "Otro").
4. `npm test` (`tests/seed-data.test.ts` falla si se rompe la integridad) y
   `npm run db:seed` **dos veces**: la segunda debe informar 0 servicios nuevos.
5. Revisar en `npm run dev` la página `/servicios?category=<slug>` y
   `/servicios/<slug>`.
6. Actualizar las cifras de `README.md` y `docs/00-PLAN-MAESTRO.md`.

**Retirar o cambiar**

- No borrar un servicio con reportes (los reportes dependen de él): marcarlo
  `active = false`. Las páginas de un servicio inactivo responden 404 y el
  directorio lo oculta. Si esa URL ya estaba indexada, evaluar una redirección
  antes de retirarla.
- El `slug` forma parte de la URL pública (`/servicios/<slug>`). Cambiarlo exige
  una redirección permanente (301/308); hoy no existe ese mecanismo, así que no
  se cambian slugs.
- `db:seed` **no** actualiza servicios ya sembrados (solo inserta los que faltan);
  sí sincroniza categorías y tipos de problema. Para corregir la descripción de un
  servicio existente hay que editarla en la base de datos (o desde el panel admin
  cuando exista, Etapa 6).

## 3. Resumen por categoría

| Categoría | Slug | Servicios | Tipos de problema propios |
|---|---|---:|---:|
| Telecomunicaciones | `telecomunicaciones` | 13 | 3 |
| Banca y pagos | `banca-y-pagos` | 18 | 3 |
| Servicios públicos | `servicios-publicos` | 6 | 3 |
| Plataformas digitales | `plataformas-digitales` | 9 | 3 |
| Streaming | `streaming` | 7 | 3 |
| Videojuegos | `videojuegos` | 6 | 3 |
| Delivery y movilidad | `delivery-y-movilidad` | 7 | 3 |
| Apuestas y loterías | `apuestas-y-loterias` | 5 | 3 |
| **Total** | | **71** | 24 (+ "Otro", transversal) |

Origen: los 16 servicios de la sección 4.2 del brief más Cashea (a pedido) son el
núcleo original; el resto se añadió después, a pedido de la persona propietaria
("streaming, juegos, plataformas, apuestas, etc.").

## 4. Evidencia por servicio

"Titular" significa que solo se pudo leer el título/resumen del resultado de
búsqueda y no el artículo completo (ver sección 7).

### Telecomunicaciones

| Servicio (`slug`) | Evidencia |
|---|---|
| CANTV, Digitel, Movistar, Movilnet, Inter, NetUno, Fibex, VNET, Thundernet | Lista inicial del brief (sección 4.2). Digitel, Movistar, Airtek, CANTV, NetUno y Thundernet también figuran como proveedores que levantaron parcialmente el bloqueo a X.com ([Finanzas Digital, 25-jun-2026](https://finanzasdigital.com/bloqueo-x-venezuela-desbloqueo-proveedores/)). |
| Simple TV (`simple-tv`) | Cableoperadora de televisión por suscripción con tarifas publicadas para febrero de 2026 ([Finanzas Digital, 4-feb-2026](https://finanzasdigital.com/planes-simpletv-febrero-2026/)); incluyó Paramount+ en su plan Tera HD ([SeñalNews, 18-ago-2022](https://senalnews.com/es/tv/simpletv-adiciona-paramount-para-sus-suscriptores-del-plan-tera-hd)). Titular: [alianza con Digitel, La Patilla, 29-may-2026](https://lapatilla.com/2026/05/29/simple-y-digitel-sellan-una-alianza-estrategica-para-transformar-el-entretenimiento-digital-en-venezuela/). |
| Supercable (`supercable`), Airtek (`airtek`), G-Network (`g-network`) | Nombrados como proveedores de internet en el reporte de VE Sin Filtro sobre el bloqueo de TikTok ([DPL News, 17-ene-2025](https://dplnews.com/?p=262446)); Airtek además en Finanzas Digital (25-jun-2026, arriba). La descripción ("Proveedor de servicios de internet") es lo único que esas fuentes permiten afirmar. |

### Banca y pagos

| Servicio (`slug`) | Evidencia |
|---|---|
| Banco de Venezuela, Banesco, Mercantil | Lista inicial del brief. Top 5 de la banca: Banco de Venezuela, Banesco, BBVA Provincial, Mercantil y BNC ([Finanzas Digital, informe de agosto 2026](https://finanzasdigital.com/informe-banca-venezolana-agosto-2026/)). |
| Cashea (`cashea`) | Añadido a pedido explícito de la persona propietaria; ver el registro de cambios del plan maestro. |
| BBVA Provincial (`bbva-provincial`), BNC (`bnc`) | Top 5 de agosto 2026 (arriba). |
| Banco Digital de los Trabajadores (`banco-digital-de-los-trabajadores`), Bancamiga (`bancamiga`), Banplus (`banplus`), Banco del Tesoro (`banco-del-tesoro`), Bancaribe (`bancaribe`) | Top 10 por cartera de créditos y captaciones a septiembre de 2024 ([Finanzas Digital, "La banca venezolana en cifras"](https://finanzasdigital.com/la-banca-venezolana-en-cifras/)). El informe de agosto 2026 solo detalla el top 5 (y dice que los 10 primeros concentran 90,93 % de los créditos y 90,70 % de los depósitos), así que la posición actual de estos cinco no está confirmada. |
| Ubii (`ubii`), Zinli (`zinli`), Reserve (`reserve`), Binance (`binance`), Creska (`creska`), Mony (`mony`), Wally (`wally`) | "Así funcionan las principales apps financieras y billeteras virtuales que operan en Venezuela" ([Crónica Uno, vía Diario de los Andes](https://diariodelosandes.com/asi-funcionan-las-principales-apps-financieras-y-billeteras-virtuales-que-operan-en-venezuela)). Contexto: el Pago Móvil concentra 94 % de la preferencia de los usuarios, frente a 67 % de las transferencias ([Atenas Grupo Consultor, vía Finanzas Digital](https://finanzasdigital.com/el-pago-movil-concentra-94-de-la-preferencia-de-los-usuarios/)). Fecha del artículo de Crónica Uno: no verificada. |

### Servicios públicos

| Servicio (`slug`) | Evidencia |
|---|---|
| Sistema Patria, Corpoelec | Lista inicial del brief. |
| Hidroven (`hidroven`) | Titular: [El Diario, 31-ene-2026](https://eldiario.com/2026/01/31/ordenan-centralizacion-sistemas-agua-venezuela-bajo-hidroven/), sobre la centralización del sistema nacional de agua bajo la autoridad única de Hidroven. |
| SENIAT (`seniat`) | Aplicación móvil SENIATVZLA ([DPL News](https://dplnews.com/venezuela-seniat-estrena-aplicacion-movil-seniatvzla-para-simplificar-tramites-tributarios/); [El Diario, 17-abr-2026](https://eldiario.com/2026/04/17/seniat-lanzo-aplicacion-movil/)) y opción web de orientación para trámites ([El Diario, 20-feb-2026](https://eldiario.com/2026/02/20/seniat-opcion-para-solicitar-orientacion-tramites/)). |
| SAIME (`saime`) | Titular: [Bloomberg Línea, 14-mar-2023](https://www.bloomberglinea.com/2023/03/14/portal-del-saime-paraliza-operaciones-mientras-implementa-un-nuevo-sistema-de-acceso/), "Portal del Saime paraliza operaciones mientras implementa un nuevo sistema de acceso". |
| Banco Central de Venezuela (`bcv`) | Su tipo de cambio oficial se reporta a diario en medios, por ejemplo [Finanzas Digital, 2-oct-2026](https://finanzasdigital.com/tasa-de-cambio-bcv-02-octubre-2026/) (titular). Sin fuente específica sobre el portal; la URL oficial queda pendiente de verificación humana como en todos los servicios. |

### Plataformas digitales

| Servicio (`slug`) | Evidencia |
|---|---|
| WhatsApp, Instagram | Lista inicial del brief. Instagram: 10 932 200 usuarios en Venezuela, septiembre 2026 ([NapoleonCat](https://napoleoncat.com/stats/social-media-users-in-venezuela/2025)). |
| Facebook (`facebook`) | 20 097 800 usuarios, septiembre 2026 (NapoleonCat); 57,93 % de los referidos de redes sociales, septiembre 2026 ([StatCounter](https://gs.statcounter.com/social-media-stats/all/venezuela)). |
| Messenger (`messenger`) | 16 066 000 usuarios, septiembre 2026 (NapoleonCat). |
| LinkedIn (`linkedin`) | 5 620 000 usuarios, septiembre 2026 (NapoleonCat); 1,76 % de los referidos, StatCounter. |
| X, antes Twitter (`x-twitter`) | 2,78 % de los referidos, septiembre 2026 (StatCounter); tercera en el [ranking de wmtips 2026](https://www.wmtips.com/technologies/social-media/country/ve). Ver la cautela sobre bloqueos (sección 6). |
| TikTok (`tiktok`) | Sexta en el ranking de wmtips 2026. Ver cautela sobre bloqueos. |
| Telegram (`telegram`) | Séptima en el ranking de wmtips 2026. Ver cautela sobre bloqueos. |
| Mercado Libre (`mercado-libre`) | Su CEO dijo que tiene "una operación pequeña" en Venezuela que "funciona con normalidad", solo marketplace y sin servicios fintech activos ([Reuters vía MarketScreener, 29-abr-2026](https://www.marketscreener.com/news/mercadolibre-ceo-flags-loan-book-sales-plays-down-venezuela-expansion-ce7f58dadb8cfe27)); descripción de su operación en [The Logistics World, 16-jul-2023](https://thelogisticsworld.com/logistica-comercio-electronico/mercado-libre-venezuela-la-plataforma-que-impulsa-el-comercio-electronico-en-el-pais). |

### Streaming

| Servicio (`slug`) | Evidencia |
|---|---|
| Netflix (`netflix`) | 55,6 % de la demanda de originales digitales en Venezuela, primer trimestre 2021 ([Parrot Analytics](https://www.parrotanalytics.com/insights/streaming-wars-who-is-winning-venezuela-q1-2021/)). |
| Disney+ (`disney-plus`) | 19,0 % de la misma demanda (Parrot Analytics); disponible para contratar en Venezuela ([MarcaSur](https://marcasur.com/en/noticia/disney-is-now-available-in-venezuela)). |
| HBO Max (`hbo-max`) | 5,4 % de la misma demanda (Parrot Analytics). La marca volvió de "Max" a "HBO Max" el 9-jul-2025 ([Xataka México](https://www.xataka.com.mx/streaming/hbo-max-regresa-a-mexico-warner-se-despide-max-confirma-su-tercer-cambio-nombre)); ese artículo **no** menciona Venezuela, así que la disponibilidad actual no está confirmada con fuente oficial. |
| Prime Video (`prime-video`) | 7,3 % de la demanda de dramas, primer trimestre 2021 (Parrot Analytics). |
| Paramount+ (`paramount-plus`) | Simple TV lo incluyó sin costo en su plan Tera HD ([SeñalNews, 18-ago-2022](https://senalnews.com/es/tv/simpletv-adiciona-paramount-para-sus-suscriptores-del-plan-tera-hd)). |
| Spotify (`spotify`) | Llegó a Venezuela en noviembre de 2021: titulares de [El Diario](https://eldiario.com/2021/11/17/spotify-disponible-en-venezuela/) y [La Patilla](https://lapatilla.com/2021/11/17/spotify-llega-por-primera-vez-a-venezuela-sin-vpn-todos-los-detalles/) (17-nov-2021) y de [Music Business Worldwide](https://www.musicbusinessworldwide.com/spotify-expands-into-six-new-countries-including-venezuela-and-iraq). |
| YouTube (`youtube`) | 24,24 % de los referidos de redes sociales, septiembre 2026 (StatCounter). Titular: [El Diario, 23-nov-2024](https://eldiario.com/2024/11/23/bloqueo-de-youtube-en-venezuela/), "¿Qué se sabe del bloqueo de YouTube en Venezuela?". |

### Videojuegos

| Servicio (`slug`) | Evidencia |
|---|---|
| Call of Duty: Mobile (`call-of-duty-mobile`), Free Fire (`free-fire`), Roblox (`roblox`) | Tres de los cinco juegos del top 5 de Venezuela del primer trimestre de 2024 ([Sensor Tower](https://sensortower.com/blog/2024-q1-unified-top-5-games-units-ve-6152eb03867b60444ad3f938)): Call of Duty: Mobile, Free Fire, Subway Surfers, Ludo Club y Roblox. El artículo no ordena los títulos por descargas totales; sí da cifras semanales (Free Fire llega a 101 mil descargas a inicios de enero y Roblox a 73 mil). |
| Steam (`steam`) | Desde el 20-nov-2023 Valve cobra solo en dólares en 13 países de Latinoamérica, entre ellos Venezuela ([LevelUp](https://www.levelup.com/noticias/steam-anuncia-medida-que-afectara-los-bolsillos-de-gamers-en-latinoamerica/)): la tienda opera allí. |
| PlayStation Network (`playstation-network`) | PlayStation ≈ 79 % de las visitas web desde consolas en Venezuela, septiembre 2026 ([StatCounter](https://gs.statcounter.com/os-market-share/console/venezuela)); mide visitas web, no consolas vendidas. Ver la cautela sobre disponibilidad (sección 6). |
| Xbox (`xbox`) | Xbox ≈ 21 % de esas visitas (StatCounter). Misma cautela. |

### Delivery y movilidad

Todas, del estudio de Ecoanalítica publicado por [Finanzas Digital (2026)](https://finanzasdigital.com/delivery-venezuela-2026-ecoanalitica/):

| Servicio (`slug`) | Dato del estudio |
|---|---|
| Yummy (`yummy`) | 94 % lo incluye entre sus tres apps de delivery más usadas. |
| Farmatodo (`farmatodo`) | "Farmatodo Delivery": 69,6 % de uso efectivo. |
| PedidosYa (`pedidosya`) | 60,7 % de uso. |
| Zupper (`zupper`) | 54,9 % de uso. |
| Yummy Rides (`yummy-rides`) | 56,8 % de uso en los últimos tres meses. |
| Ridery (`ridery`) | 32,8 % de recordación. |
| Yango (`yango`) | 7,7 % de recordación (el más bajo; incluido porque el estudio lo lista como opción de transporte). |

### Apuestas y loterías

| Servicio (`slug`) | Evidencia |
|---|---|
| Lotto Activo (`lotto-activo`) | Uno de los juegos de lotería más jugados, basado en animales ([FocusGN, 2023](https://focusgn.com/latinoamerica/loterias-de-venezuela)); resultados diarios publicados por [La República (Perú)](https://larepublica.pe/loterias-sorteos/2024/05/16/lotto-activo-y-la-granjita-en-vivo-resultados-de-hoy-17-de-mayo-2024-lrtmv-942816). |
| La Granjita (`la-granjita`) | Resultados diarios junto a Lotto Activo (La República). |
| Triple Táchira (`triple-tachira`), Kino Táchira (`kino-tachira`) | FocusGN, 2023: Triple Táchira son sorteos triples de 3 dígitos; Kino Táchira, creado en 1926 como "La Táchira". |
| 1xBet (`1xbet`) | Contrato de cooperación de dos años con el Caracas F.C., con publicidad en camisetas y estadio ([Extra.ec, 7-mar-2025](https://www.extra.ec/noticia/deportes/1xbet-patrocinador-principal-caracas-f-c-122615.html)). Prueba presencia comercial, **no** autorización. |

## 5. No incluidos y candidatos

Excluidos en esta ronda, con la razón; pueden añadirse si aparece evidencia.

| Servicio | Razón |
|---|---|
| Triple Gordo, Triple Zulia, Chance, Oriental Millonario | FocusGN los menciona como populares "sin más detalles": no alcanza para una descripción neutra. |
| Subway Surfers, Ludo Club | Están en el top 5 de Sensor Tower (T1 2024), pero no se evaluó su dependencia de servicios en línea. |
| Apple TV+ | 2,8 % de la demanda de dramas (Parrot Analytics), la cifra más baja de los mercados del informe. |
| Hulu | Aparece solo en las etiquetas del informe de Parrot Analytics, sin datos. |
| Fortnite, League of Legends, Twitch, Crunchyroll | Sin evidencia de uso en Venezuela en las fuentes consultadas. |
| Pinterest, Threads, WeChat | Figuran en el orden del ranking de wmtips (8.º a 10.º) sin porcentajes. |
| Banco Bicentenario | Fuera del top 10 por créditos y depósitos en las fuentes consultadas. |
| Hidrocapital y otras hidrológicas, gas, aseo urbano | No se revisaron; Hidroven quedó como autoridad única según el titular citado. |
| Otros operadores de apuestas extranjeros | Sin evidencia consultada, y la categoría tiene la cautela legal de abajo. |

## 6. Cautelas

**Apuestas y loterías (revisión legal profesional pendiente).** Las fuentes no
coinciden:

- FocusGN (2023) describe las apuestas virtuales como "reguladas por completo", con
  pocos titulares de licencia, y dice que las loterías locales en línea funcionan
  con permiso y venden por móvil desde 2012.
- Altenar (2025) afirma que el juego en línea está "legalmente indefinido, ni
  licenciado ni expresamente prohibido"; que CONALOT supervisa las loterías
  (Ley Nacional de Lotería, 2000), la CNC los casinos físicos y SUNAHIP las
  apuestas hípicas; y que los operadores no pueden anunciarse legalmente ni
  acceder a sistemas de pago integrados ([Altenar](https://altenar.com/blog/gambling-laws-and-regulations-in-venezuela/)).

PulsoVE no toma posición: no afirma que ningún servicio de esta categoría esté
autorizado ni lo promueve. Las páginas de estos servicios muestran el aviso
"PulsoVE solo informa la disponibilidad técnica de este servicio. Incluirlo aquí
no es una promoción ni confirma que esté autorizado", y la descripción de la
categoría lo repite. Antes de un despliegue real hace falta la revisión de una
persona profesional en la jurisdicción aplicable.

**Bloqueos de plataformas (X, TikTok, Telegram, YouTube).** Hay reportes de
bloqueos en proveedores venezolanos: X, tras casi dos años de restricciones,
tuvo un desbloqueo parcial el 25-jun-2026, con dominios de imágenes y video aún
filtrados en algunos proveedores (Finanzas Digital); TikTok, diez días de bloqueo
nocturno según VE Sin Filtro (DPL News, 17-ene-2025); Telegram y YouTube,
titulares de El Diario (10-ene-2025 y 23-nov-2024). Son informes de terceros:
**PulsoVE aún no mide bloqueos** (la señal técnica del motor todavía no tiene
fuente de datos) y el catálogo no afirma que ninguna de estas plataformas esté hoy
bloqueada o accesible. Una concentración de reportes ciudadanos puede reflejar un
bloqueo, una caída del servicio o un problema del proveedor del usuario; el motor
no distingue la causa.

**Consolas.** Sportskeeda lista a Venezuela entre los países donde PlayStation
Network **no** está disponible oficialmente ([Sportskeeda](https://www.sportskeeda.com/gaming-tech/all-countries-playstation-network-available-and-countries-it-s-not));
no se verificó lo mismo para Xbox. Se incluyen porque las visitas web desde consolas
en Venezuela son medibles (StatCounter) y quienes juegan pueden usar cuentas de
otras regiones. No se afirma disponibilidad oficial.

**Cripto y billeteras.** Binance y las billeteras se listan como servicios de los
que alguien puede reportar caídas. PulsoVE no ofrece asesoría financiera ni valida
a ninguna de ellas.

## 7. Límites de esta verificación

- Varios artículos (El Diario, La Patilla, Bloomberg Línea, DPL News) no se
  pudieron abrir desde el entorno de trabajo; esas entradas se marcan "titular" y
  solo respaldan lo que el título dice.
- Las cifras de terceros miden cosas distintas (sección 1) y corresponden a fechas
  distintas, desde 2021 hasta septiembre de 2026.
- No se probó técnicamente ningún servicio: nada de este catálogo afirma que un
  servicio esté caído, operativo o bloqueado más allá de lo que las fuentes dicen.
- Las descripciones salen de las fuentes citadas o de lo que el nombre del servicio
  ya dice; si alguna resulta imprecisa, se corrige en la base de datos y aquí.

## 8. Pendiente

- Verificar y cargar la `official_url` de cada servicio (una persona, con fuente).
- Revisión legal profesional de la categoría Apuestas y loterías.
- Revisar la vigencia de las entradas (servicios que cierran, cambian de marca o
  de disponibilidad; por ejemplo, HBO Max/Max) al menos una vez al año.
- Mecanismo de redirección de slugs (no existe hoy) antes de permitir editarlos.
- Páginas de categoría indexables y su SEO (hoy el filtro es `?category=`).
