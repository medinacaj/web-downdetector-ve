# GitHub Pages Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** abrir una vista previa visual sin instalar dependencias en el equipo del usuario.
**Architecture:** exportación Next.js estática en staging, componentes existentes y adaptadores ficticios aislados. Rama gh-pages con artefacto verificado.
**Tech Stack:** Next.js, React, TypeScript, export estático; Chromium para verificación.
**Spec:** docs/superpowers/specs/2026-11-10-pages-demo-design.md

## Global Constraints
- Datos ficticios; ninguna petición de escritura ni confirmación de guardado.
- Mantener producción; ninguna conexión DB en construcción o visualización de la demo.
- basePath /web-downdetector-ve y trailingSlash; no indexar.
- Publicación autorizada por el usuario; no fusionar main.

## Review Focus
- Recarga directa de fichas y navegación bajo el prefijo de Pages.
- Búsqueda iniciada desde portada y navegación atrás.
- Formularios no deben enviar ni persistir datos.
- Móvil sin desbordamiento y cambio de tema.
- Ninguna credencial o archivo de servidor en el artefacto publicado.

### Task 1: Exportación y componentes
- [x] Añadir prueba de navegador de la exportación; observar fallo por exportación ausente.
- [x] Añadir fixtures, adaptadores y construcción por lista explícita.
- [x] Exportar sin DB; probar navegación, filtros, tema, recarga, formulario y móvil.
- [x] Ejecutar estándares y pruebas unitarias pertinentes; registrar resultados.

### Task 2: Publicación
- [x] Revisión independiente del cambio; corregir hallazgos demostrables.
- [x] Analizar secretos y publicar rama fuente y rama gh-pages con solo exportación.
- [x] Comprobar sitio público o identificar paso de activación faltante con evidencia.
