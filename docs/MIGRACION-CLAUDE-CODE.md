# Migración del chat a Claude Code

Cómo llegó PulsoVE desde un chat de claude.ai a este repositorio, qué falta por
resolver y cómo seguir trabajando en Claude Code. Escrito el **10 de octubre de 2026**.

## 1. Qué se movió

- **Origen:** el proyecto del chat de claude.ai, en la Etapa 4c (17 servicios y 55
  pruebas), importado tal cual como primer commit.
- **Destino:** `medinacaj/web-downdetector-ve`, repositorio **público** en GitHub.
- **Historial en el repositorio**, en orden:
  1. Importación del proyecto del chat (Etapa 4c + Cashea).
  2. Catálogo ampliado: 71 servicios en 8 categorías y 25 tipos de problema
     (`docs/CATALOGO-SERVICIOS.md`).
  3. Meta descripciones de portada y directorio al día con las 8 categorías.
  4. `src/lib/nav.ts`: ningún enlace interno apunta a páginas que aún no existen.
  5. Menú principal visible también en móvil.
  6. Guía para Claude Code (`CLAUDE.md`, `AGENTS.md`, `.claude/rules/`,
     `scripts/dev-bootstrap.sh`, estos documentos).
- **No se movió, a propósito:** `.env` (secretos), `node_modules` y `.next`, la base de
  datos (se recrea con el bootstrap), el historial de la conversación y la memoria del chat.

## 2. Pregunta abierta: ¿existe una versión más avanzada?

El `CLAUDE.md` que la persona propietaria subió en su día describe una versión distinta
de la que había en el chat. **No he visto su código**, solo ese archivo:

| | Este repositorio | Según ese `CLAUDE.md` |
|---|---|---|
| Servicios | 71 (8 categorías) | 60 |
| Pruebas | 66 | 159 |
| SEO técnico base (`robots.ts`, `sitemap.ts`, `src/lib/seo/*`, script de auditoría, `docs/SEO-TECNICO.md`) | **No** (ver `docs/SEO-PENDIENTE.md`) | Sí |
| Reglas por área en `.claude/rules/` | Solo `seo-tecnico.md` | Sí |

Si esa versión existe (en Cowork o en la computadora de la persona propietaria), lo
sensato es **partir de ella** y reaplicar lo nuevo de este repositorio: categorías y
tipos de problema ampliados, semilla con upsert, `src/lib/nav.ts` con su prueba y
`scripts/dev-bootstrap.sh`. Antes de fusionar los catálogos hay que **comparar slug por
slug**: son URLs públicas y los dos catálogos pueden no coincidir. Para importarla hace
falta la carpeta o el zip (el chat donde se hizo esta migración no pudo acceder a la
computadora).

Si no existe, este repositorio es la fuente de verdad y el siguiente trabajo es la capa
de SEO técnico (`docs/SEO-PENDIENTE.md`).

## 3. Abrir el proyecto en Claude Code

Con una sesión de Claude Code (web, escritorio o terminal) sobre
`medinacaj/web-downdetector-ve`; en terminal:

```bash
git clone https://github.com/medinacaj/web-downdetector-ve.git
cd web-downdetector-ve
bash scripts/dev-bootstrap.sh   # dependencias, Postgres local, .env, migraciones, semillas
claude                          # abre Claude Code en esta carpeta
```

Qué carga Claude Code por su cuenta:

- `CLAUDE.md` al empezar la sesión. Su primera línea es `@AGENTS.md`, que trae el aviso
  de Next 16 (lo regenera `next dev`; no se edita a mano).
- `.claude/rules/seo-tecnico.md` cuando toca `src/app`, `src/components`, `src/lib/seo`,
  `next.config.mjs` o `public`: las instrucciones permanentes de SEO técnico e indexación
  de la persona propietaria.

`CLAUDE.md` incluye la hoja de ruta, así que un mensaje corto como "Continúa" retoma el
trabajo donde quedó. Resuelve antes la pregunta de la sección 2 si importa.

## 4. Entorno

- Node 22+, PostgreSQL 16+, Redis opcional (sin él, el rate limiting vive en memoria).
- `scripts/dev-bootstrap.sh` es idempotente: instala dependencias si faltan, crea `.env`
  desde `.env.example` con `JWT_SECRET` y `ANONYMIZATION_SALT` nuevos (nunca toca un
  `.env` existente), arranca Postgres si es local y no está en marcha, crea el rol y la
  base de `DATABASE_URL` si no existen, y corre migraciones y semillas.
- Está pensado para **Linux (Debian/Ubuntu)**. En macOS o Windows no sabe arrancar
  Postgres ni crear el rol: crea la base a mano, ajusta `DATABASE_URL` en `.env` y repite;
  el resto del script sí sirve.
- `npm run build` necesita internet (`next/font/google` descarga las tipografías). En un
  entorno sin acceso a `fonts.googleapis.com` falla; `npm run dev` degrada sin romperse.
- `npm run lint` no funciona (Next 16 eliminó `next lint` y no hay ESLint configurado).

## 5. Reglas de trabajo en el repositorio

- El repositorio es **público**: ningún secreto, token ni credencial en el código, en la
  documentación ni en `robots.txt`. `.env` está en `.gitignore`.
- `.env.example` trae `pulsove_dev_pw` como contraseña de **desarrollo local**; no es un
  secreto, pero si ese rol se reutiliza en un servidor accesible desde fuera, cámbiala.
- Archivos personales que no se versionan: `CLAUDE.local.md` y
  `.claude/settings.local.json` (ya en `.gitignore`).
- Antes de dar algo por terminado: `npm run typecheck`, `npm test` y probarlo con el
  servidor real. Las pruebas de API insertan filas en la base de desarrollo: límpialas
  (`CLAUDE.md`, "Trampas conocidas").
- Cada entrega web termina con el resumen de la persona propietaria: comprobaciones,
  problemas detectados y corregidos, pendientes y acciones en Google Search Console.

## 6. Qué se verificó en esta migración y qué no

**Verificado** (contra Postgres 16 y `next dev` reales):

- Bootstrap desde cero (sin `node_modules`, sin `.env`, base inexistente): entorno listo
  en unos 30 s; segunda ejecución sin cambios (0 servicios nuevos y `.env` intacto).
- `npm run typecheck` limpio y las 66 pruebas en verde.
- Páginas clave en Chromium a 390 y 1280 px: portada, directorio y servicios sin
  desbordes. Único error de consola: el favicon (404).
- Catálogo: 8 categorías, 24 estados, 25 tipos de problema y 71 servicios en la base.

**No verificado:**

- `npm run build` (Google Fonts bloqueado en el entorno donde se hizo).
- El bootstrap en macOS o Windows, con un Postgres remoto o en CI.
- Nada del SEO contra un dominio real ni contra Google Search Console (no se usó).
- La versión avanzada de la sección 2.

## 7. Pendientes de la migración

1. Resolver la sección 2 (¿versión avanzada? ¿importar?).
2. SEO técnico base y decisión de indexación: `docs/SEO-PENDIENTE.md`.
3. Etapa 4d (mapa, incidentes, estadísticas, metodología, gráfico histórico) y el resto de
   la hoja de ruta: `CLAUDE.md` y `docs/00-PLAN-MAESTRO.md`.
4. Etapa 10: CI (por ejemplo GitHub Actions con un servicio Postgres), ESLint y las 9
   vulnerabilidades de herramientas de desarrollo (`vitest`/`vite`/`esbuild`).
5. Revisión legal profesional de apuestas y loterías.
