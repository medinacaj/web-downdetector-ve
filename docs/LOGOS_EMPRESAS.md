# Logotipos de servicios en la portada (referencias de terceros)

**Uso:** identificación editorial del servicio supervisado, no identidad gráfica de PulsoVE. Los logotipos y marcas pertenecen a sus respectivos titulares; **no existe patrocinio, afiliación ni aval** por aparecer en el catálogo. La disponibilidad del servicio se calcula mediante la metodología de PulsoVE, no mediante el logotipo.

Las imágenes descargadas se sirven desde `public/brands/` sin consultas de los visitantes a proveedores externos. Las imágenes obtenidas en Wikimedia se rasterizan localmente a PNG y se dimensionan con Sharp para reducir carga y evitar SVG activo de terceros. Los dos iconos de Simple Icons se sirven como SVG locales de rutas puras, sin scripts ni enlaces externos. El código solo presenta imágenes incluidas explícitamente en la lista `HOME_BRAND_LOGOS`.

| Servicio | Archivo local | Procedencia (fuente del recurso) | Condición indicada por la fuente |
|---|---|---|---|
| CANTV | `cantv.png` | [Wikimedia Commons: CANTV logo.svg](https://commons.wikimedia.org/wiki/File:CANTV_logo.svg) | PD Venezuela / texto-logo, marca protegible |
| Movistar | `movistar.png` | [Wikimedia Commons: Movistar 2020 logo.svg](https://commons.wikimedia.org/wiki/File:Movistar_2020_logo.svg) | PD forma/texto, marca protegible |
| Digitel | `digitel.png` | [Wikimedia Commons: Digitel (2014).svg](https://commons.wikimedia.org/wiki/File:Digitel_(2014).svg) | PD texto-logo, marca protegible |
| Movilnet | `movilnet.png` | [Wikimedia Commons: Movilnet-logo 0.png](https://commons.wikimedia.org/wiki/File:Movilnet-logo_0.png) | PD forma/texto, marca protegible |
| Corpoelec | `corpoelec.png` | [Wikimedia Commons: Logo CORPOELEC (Venezuela).jpg](https://commons.wikimedia.org/wiki/File:Logo_CORPOELEC_(Venezuela).jpg) | Revisar restricciones de insignias y marca |
| Banco de Venezuela | `banco-de-venezuela.png` | [Wikimedia Commons: Bdv2022logo.png](https://commons.wikimedia.org/wiki/File:Bdv2022logo.png) | PD texto-logo, marca protegible |
| Banesco | `banesco.png` | [Wikimedia Commons: Banesco Nuevo Logo.svg](https://commons.wikimedia.org/wiki/File:Banesco_Nuevo_Logo.svg) | **CC BY-SA 3.0**; autor Banesco; marca protegible |
| WhatsApp | `whatsapp.svg` | [Simple Icons: WhatsApp](https://github.com/simple-icons/simple-icons/blob/develop/icons/whatsapp.svg) | Simple Icons CC0 (trademark rights excluded) |
| Instagram | `instagram.svg` | [Simple Icons: Instagram](https://github.com/simple-icons/simple-icons/blob/develop/icons/instagram.svg) | Simple Icons CC0 (trademark rights excluded) |

Para Banesco: imagen adaptada solo de formato y resolución mediante rasterización de la marca sin alterar su diseño; atribución a **Banesco**, fuente Wikimedia Commons y licencia [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). El archivo derivado se publica con los términos de dicha licencia en la medida aplicable; esto **no** incluye el código de la aplicación ni concede derechos sobre la marca.

**Pendientes:** Mercantil, SENIAT y Sistema Patria conservan el identificador tipográfico cuando no se verificó un archivo e importación local. Los logos de otras marcas del catálogo aún no están incorporados; no cargar favicon genérico, logotipo de empresa distinta ni recursos obtenidos sin procedencia.

**Control editorial:** las marcas pueden actualizar su identidad sin previo aviso; revisar archivos y condiciones de uso antes de sustituciones. Si el titular solicita retirar su logo, retirar el archivo y su entrada de la lista; el componente utiliza el monograma seguro como reserva. No recoger datos privados ni añadir herramientas de analítica al cargar imágenes.

## Ampliación de iconografía global · noviembre de 2026

Se añaden 20 iconos vectoriales de marcas como Cloudflare, Gmail, Fortnite, Discord, GitHub, Google Cloud, Vercel, Epic Games, Steam, Roblox, VALORANT, Google Gemini, PayPal, Shopify, Stripe, Reddit, Twitch, Claude, Zoom y Google Drive. El código usa una lista fija en `src/lib/brand-logos.ts`; todos los SVG están alojados en el propio dominio bajo `public/brands/`, sin rastreadores o imágenes de terceros.

**Autoría de las representaciones SVG:** colaboradores de [Simple Icons](https://github.com/simple-icons/simple-icons), disponibles bajo [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) para los gráficos distribuidos en el proyecto. Las **marcas y logotipos pertenecen a sus titulares**: estar en PulsoVE no implica asociación, patrocinio o certificado de disponibilidad. Las referencias específicas de cada icono figuran en [la página pública de créditos](/creditos-marcas).

Las plataformas para las que no existe un recurso de uso verificable, como Outlook y Minecraft en esta ampliación, usan un identificador tipográfico propio, no una representación falsa del logo oficial. El catálogo es de interés internacional, pero el motor de reportes de PulsoVE continúa centrado en Venezuela.


## Incorporación adicional de 21 marcas · noviembre 2026

Se añadieron íconos locales de Signal, WeChat, Bluesky, Figma, Apple Music, Crunchyroll, Dota 2, Uber, Railway, Render, Fastly, MongoDB, SoundCloud, Deezer, Airbnb, Wise, Etsy, LINE, Mastodon, Trello y Asana. Se copiaron los SVG de rutas simples verificados en [Simple Icons](https://github.com/simple-icons/simple-icons), se comprobaron contra scripts, imágenes activas y referencias externas, y se añadieron a la lista permitida. En esa ampliación histórica se alcanzaron **50** archivos de marca autohospedados (antes de la siguiente incorporación).

Los gráficos distribuidos por Simple Icons usan licencia CC0 para la representación, pero **las marcas comerciales conservan sus derechos**. [La página de créditos](/creditos-marcas) contiene enlaces individuales. Las tarjetas muestran exclusivamente el logo disponible y un monograma solo si falla o no existe.


## Incorporación y auditoría de logos · 13 de noviembre de 2026

**Cobertura actual:** 164 recursos locales revisados / 211 servicios (**77,7 %**), frente a 50 / 211 antes de esta actualización. Se añadieron **114** iconos, SVG en la mayoría de los casos. La integridad de rutas, sanitización y compatibilidad de renderizado se comprueban en CI. La ausencia de un logo no se disfraza con una representación fabricada: se conserva el monograma accesible.

**Once casos prioritarios comunicados por el propietario:**

| Servicio | Procedencia del archivo local | Nota editorial |
| --- | --- | --- |
| AliExpress, eBay, Tumblr, YouTube Music | [Simple Icons](https://github.com/simple-icons/simple-icons) | Gráficos vectoriales CC0 de la biblioteca; las marcas siguen protegidas |
| Amazon, Minecraft, Overwatch 2 | [Dashboard Icons](https://github.com/homarr-labs/dashboard-icons) | Iconos de la biblioteca, licencia de repositorio Apache-2.0; marcas de sus titulares |
| Pokémon GO | [Material Design Icons](https://github.com/Templarian/MaterialDesign/blob/master/svg/pokemon-go.svg) | Icono identificativo del juego (no es necesariamente su wordmark corporativo) |
| GTA Online | [Repositorio de ejemplo GTA](https://github.com/devemdobro/projeto-gta/blob/main/src/imagens/logo-gta-online.svg) | Recurso del juego usado en un proyecto comunitario; derechos de la marca conservados |
| Brawl Stars | [Iconografía SVG](https://github.com/fakhrul62/free-awesome/blob/main/freeawesome/line/504182-Brawl-stars.svg) | Símbolo identificativo en trazo, no logo oficial garantizado |
| Among Us | [Tabler Icons](https://github.com/tabler/tabler-icons/blob/main/icons/outline/brand-among-us.svg) | Icono de marca de la biblioteca MIT |

**Otros recursos:** principalmente [Dashboard Icons](https://github.com/homarr-labs/dashboard-icons) y [Simple Icons](https://github.com/simple-icons/simple-icons); para recursos específicos también [CoreUI Icons](https://github.com/coreui/coreui-icons), [Lawnicons](https://github.com/LawnchairLauncher/lawnicons), [Papirus](https://github.com/PapirusDevelopmentTeam/papirus-icon-theme), [Arcticons](https://github.com/deathrashed/iconography), [SVG Repo](https://www.svgrepo.com/) y otros repositorios de iconografía mencionados en la [página de créditos](../src/app/creditos-marcas/page.tsx). Cada SVG nuevo incluye procedencia enlazada desde la página pública `/creditos-marcas/` mediante `brand-logo-sources.ts`. No se descargan imágenes desde el navegador del visitante.

**Licencias:** la licencia de un proyecto de iconos no equivale a autorización de uso de la marca comercial. Algunas representaciones comunitarias tienen licencias específicas, incluso GPL; conservar avisos, atribución, procedencia y condiciones de redistribución. Para dudas sobre un recurso, retirar su entrada del allowlist y usar el monograma hasta aclararlo. Se mantienen los términos particulares de Banesco (CC BY-SA 3.0).

**Sin archivo aprobado (47 servicios):** Inter, NetUno, Fibex, VNET, Thundernet, Simple TV, Supercable, Airtek, G-Network, Mercantil, BBVA Provincial, BNC, Banco Digital de los Trabajadores, Bancamiga, Banco del Tesoro, Bancaribe, Banplus, Cashea, Ubii, Zinli, Reserve, Creska, Mony, Wally, Sistema Patria, Hidroven, SENIAT, SAIME, BCV, Call of Duty: Mobile, Yummy, PedidosYa, Zupper, Farmatodo, Yummy Rides, Ridery, Yango, 1xBet, Lotto Activo, La Granjita, Triple Táchira, Kino Táchira, Call of Duty: Warzone, EA app, AOL Mail, Mobile Legends, EA Sports FC. Estos no deben recibir logotipos de empresas distintas, variantes no verificadas o supuestos iconos oficiales creados por IA.

**Normalización visual:** contenedor autocentrado y de contraste estable, `object-fit: contain` y medidas consistentes en portada, directorio y fichas. Las imágenes fallidas se reemplazan por un monograma, sin llamadas a terceros ni bloqueo de la página.


## Mejora incremental: EA app · 13 de noviembre de 2026

Se añadió el SVG original de **EA** obtenido de [Simple Icons (icono EA)](https://github.com/simple-icons/simple-icons/blob/develop/icons/ea.svg) como identificador del **editor de EA app**. La ilustración distribuida por Simple Icons se publica bajo CC0, sin transferir los derechos de marca de Electronic Arts. No se representa como logotipo específico de la aplicación ni se afirma asociación con EA.

La cobertura pasa de **164 a 165 recursos locales de 211 servicios (78,2 %)**; **46 servicios** siguen con monograma hasta contar con archivos y procedencia verificables. Las cifras históricas anteriores se conservan para trazabilidad.
