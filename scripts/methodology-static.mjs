/**
 * Editorial guide for GitHub Pages. No live API, report submission or telemetry.
 * All panels are labelled conceptual and have no fabricated report statistics.
 */
export const methodologyCss = [
'.method-page{max-width:1100px;margin:0 auto;padding:34px 18px 75px;color:#223d46}',
'.method-page h1,.method-page h2,.method-page h3{line-height:1.2;letter-spacing:-.025em}',
'.method-page h1{font-size:clamp(29px,4vw,45px);max-width:850px;margin:10px 0 18px}',
'.method-page h2{font-size:clamp(24px,3vw,31px);margin:9px 0 15px}',
'.method-page h3{font-size:19px;margin:0 0 12px}',
'.method-page p{line-height:1.65;margin:0 0 12px}',
'.method-page .intro{max-width:760px;color:#4d666f;font-size:16px}',
'.method-page .eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.16em;color:#078386;font-weight:800}',
'.method-page .guide-heading{margin-top:57px;margin-bottom:24px}',
'.method-page .guide{list-style:none;margin:0;padding:0;display:grid;gap:16px}',
'.method-page .guide-item{background:#fff;border-radius:15px;box-shadow:0 6px 20px rgba(17,51,57,.12);padding:20px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.07fr);align-items:center;gap:24px}',
'.method-page .guide-preview{background:#ecf3f2;border-radius:11px;padding:18px;color:#24434b;min-width:0}',
'.method-page .preview-tag{font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;color:#4c707a;margin:0 0 12px}',
'.method-page .mini-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
'.method-page .mini-box{background:#fff;border-radius:9px;padding:13px 10px;font-size:12px;color:#26434b}',
'.method-page .mini-box strong{display:block;margin-bottom:4px}',
'.method-page .mini-box small{font-size:11px;display:block;color:#527078}',
'.method-page .mini-box.amber{background:#fff0da;color:#714c15}',
'.method-page .mini-box.rose{background:#ffe5e6;color:#8d3237}',
'.method-page .mini-box.teal{background:#d8eeea;color:#18584e}',
'.method-page .one-line{font-size:12px;color:#42656d;background:#fff;padding:13px;border-radius:9px;margin-top:8px}',
'.method-page .guide-copy{display:flex;align-items:flex-start;gap:15px}',
'.method-page .step{width:42px;height:42px;flex:none;border-radius:50%;background:#0ca6b8;color:#fff;font-weight:800;font-size:20px;display:flex;justify-content:center;align-items:center}',
'.method-page .guide-copy p{font-size:14px;color:#4d646c}',
'.method-page .guide-copy .note{border-left:3px solid #159b83;padding-left:12px;font-size:12px;color:#60737b}',
'.method-page .diagram{display:block;width:100%;height:auto}',
'.method-page .regional{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}',
'.method-page .regional span{background:#cbe4e4;padding:10px 3px;border-radius:8px;text-align:center;font-size:11px;font-weight:700}',
'.method-page .regional span:nth-child(3n+2){background:#f6e9bf}',
'.method-page .fine-print{font-size:11px;color:#526e76;margin-top:12px!important}',
'.method-page .red-demo{display:inline-block;padding:10px 15px;border-radius:8px;background:#c62934;color:white;font-size:12px;font-weight:800}',
'.method-page .primary{display:inline-flex;margin-top:14px;background:#097d76;color:#fff;padding:11px 17px;border-radius:9px;font-weight:700}',
'.method-page .secondary{display:inline-flex;margin:14px 0 0 10px;border:1px solid #9bb9bd;padding:11px 17px;border-radius:9px;font-weight:700}',
'.method-page .process{list-style:none;margin:24px 0 14px;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}',
'.method-page .process li,.method-page .explain>div{background:#fff;padding:22px;border-radius:13px;box-shadow:0 4px 15px rgba(17,51,57,.08)}',
'.method-page .process strong{color:#078386;font-size:13px}',
'.method-page .process p,.method-page .explain p{font-size:13px;color:#4d666f}',
'.method-page .figures{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px}',
'.method-page .figures>div{padding:20px;border-radius:12px;background:#13515c;color:white}',
'.method-page .figures>div:nth-child(2){background:#315a7b}',
'.method-page .figures>div:nth-child(3){background:#74495b}',
'.method-page .figures strong{font-size:25px;display:block}',
'.method-page .figures p{font-size:12px;color:#ebf7f9;margin-top:4px}',
'.method-page .explain{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;margin-top:39px}',
'.method-page .cta{margin-top:35px;border-radius:15px;background:#133843;color:#fff;padding:27px}',
'.method-page .cta p{font-size:14px;color:#dae9e8;max-width:700px}',
'.method-page .cta .primary{background:#fff;color:#12343f}',
'body[data-theme="dark"] .method-page{color:#eaf9f7}',
'body[data-theme="dark"] .method-page .guide-item,body[data-theme="dark"] .method-page .process li,body[data-theme="dark"] .method-page .explain>div{background:#1e313b}',
'body[data-theme="dark"] .method-page .guide-preview{background:#263942}',
'body[data-theme="dark"] .method-page .guide-copy p,body[data-theme="dark"] .method-page .guide-copy .note,body[data-theme="dark"] .method-page .process p,body[data-theme="dark"] .method-page .explain p{color:#c5d9d9}',
'body[data-theme="dark"] .method-page .intro{color:#c5d9d9}',
'body[data-theme="dark"] .method-page .secondary{color:#eaf9f7}',
'@media(max-width:760px){.method-page .guide-item,.method-page .explain,.method-page .process,.method-page .figures{grid-template-columns:1fr}.method-page .guide-item{padding:13px;gap:16px}.method-page .guide-preview{padding:14px}.method-page .secondary{margin-left:0}.method-page{padding:25px 15px 60px}}'
].join('\n');

const parts = [
  ['Estado del servicio','Se presentan datos insuficientes, actividad habitual y distintos niveles de posible incidente, según la evidencia disponible. Ningún estado asegura que todos los usuarios tengan conexión.','No se debe interpretar ausencia de reportes como disponibilidad confirmada.','<div class="mini-grid"><div class="mini-box"><strong>Sin datos suficientes</strong><small>Sin conclusión</small></div><div class="mini-box amber"><strong>Posible interrupción</strong><small>Señal moderada</small></div><div class="mini-box rose"><strong>Detectada</strong><small>Mayor evidencia</small></div><div class="mini-box teal"><strong>Actividad habitual</strong><small>No certifica disponibilidad</small></div></div>'],
  ['Fuentes y comunicados','La información compartida por usuarios no equivale a un comunicado del proveedor. Las confirmaciones oficiales deben contar con una fuente verificada.','La maqueta estática no permite publicar comunicados empresariales.','<div class="mini-box"><strong>Reportes ciudadanos</strong><small>Experiencias compartidas por la comunidad</small></div><div class="mini-box teal" style="margin-top:9px"><strong>Confirmación del proveedor</strong><small>Solo cuando exista evidencia verificable</small></div>'],
  ['Botón para reportar','El formulario de la aplicación permite elegir tipo de problema y estado. Los campos ciudad, operador y comentario son opcionales.','En GitHub Pages el formulario es una demostración: no envía ni almacena reportes.','<div class="mini-grid"><div class="mini-box"><strong>Tipo de problema</strong><small>Seleccionar</small></div><div class="mini-box"><strong>Estado</strong><small>Seleccionar</small></div></div><p class="fine-print">Campos adicionales opcionales.</p><span class="red-demo">! &nbsp; Reportar falla</span>'],
  ['Reportes en 24 horas','La aplicación con backend permite revisar períodos de 24 horas, 7, 30 y 90 días, cambiar tipos de gráfica e inspeccionar fechas de incidentes registrados.','El trazo ilustrado es un concepto, no un dato actual ni un gráfico de disponibilidad.','<svg class="diagram" viewBox="0 0 300 114" role="img" aria-label="Esquema conceptual, sin datos reales"><path d="M7 92H294M7 54H294" stroke="#a0b1b8" stroke-dasharray="4 5"/><path d="M7 74H294" stroke="#109286" stroke-width="2" stroke-dasharray="7 5"/><path d="M7 84L33 82L59 86L85 79L111 82L137 46L163 14L189 42L215 71L241 83L267 85L294 81" stroke="#df5f60" stroke-width="3.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/></svg><p class="fine-print">Referencia y aumento: esquema conceptual, sin cifras.</p>'],
  ['Problemas más reportados','En las fichas con datos reales se agrupan las categorías de fallas según los reportes recibidos. El desglose describe experiencias, no confirma las causas.','La lista ilustrativa no representa un ranking actual ni porcentajes inventados.','<div class="one-line">01 · Acceso a la cuenta</div><div class="one-line">02 · Aplicación o sitio web</div><div class="one-line">03 · Conexión o red</div>'],
  ['Actividad por región','PulsoVE agrupa la información por el estado de Venezuela que el usuario selecciona. El mapa de la aplicación es esquemático, no un mapa de calor en vivo.','No se publican coordenadas personales. Los colores del ejemplo no indican fallas.','<div class="regional"><span>Zulia</span><span>Lara</span><span>Miranda</span><span>Carabobo</span><span>Aragua</span><span>Bolívar</span></div><p class="fine-print">Cuadrícula conceptual sin ubicación exacta.</p>'],
  ['Comentarios de la comunidad','La aplicación dispone de comentarios con moderación. Los testimonios ayudan a contextualizar lo que experimentan otras personas, no sustituyen las mediciones técnicas.','La versión estática no publica comentarios ni envía datos.','<div class="mini-box"><strong>Comentarios aprobados</strong><small>Espacio de participación moderada</small><p class="fine-print">▰▰▰▰▰▰▰ &nbsp; ▰▰▰▰</p></div>'],
];

function esc(x){return String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

export function methodologyBody(base){
  const list=parts.map(([name,description,note,preview],i)=>'<li class="guide-item"><div class="guide-preview"><div class="preview-tag">Vista explicativa</div>'+preview+'</div><div class="guide-copy"><span class="step">'+(i+1)+'</span><div><h3>'+esc(name)+'</h3><p>'+esc(description)+'</p><p class="note">'+esc(note)+'</p></div></div></li>').join('');
  const processes=[
    ['01','Recopilación','Se registra el servicio, el tipo de falla y el estado seleccionado, con limitaciones de frecuencia y controles contra duplicados.'],
    ['02','Comparación','El motor usa la mediana y dispersión de ventanas históricas del mismo servicio, día de semana y hora de Caracas.'],
    ['03','Corroboración','Considera reportantes distintos, persistencia y distribución regional. No inventa señales técnicas u oficiales ausentes.'],
    ['04','Interpretación','Por defecto se requieren al menos dos reportantes y dos ventanas consecutivas elevadas antes de abrir un incidente.'],
  ].map(([n,title,description])=>'<li><strong>'+esc(n)+'</strong><h3>'+esc(title)+'</h3><p>'+esc(description)+'</p></li>').join('');
  return '<div class="method-page">'+
    '<header><p class="eyebrow">Cómo funciona PulsoVE</p><h1>Examinamos reportes ciudadanos para identificar posibles problemas de servicio.</h1>'+
    '<p class="intro">Un aumento de reportes puede alertar sobre un incidente, pero no lo confirma por sí solo. Descubre cómo presentamos la evidencia y cuáles son sus límites.</p>'+
    '<a class="primary" href="'+base+'/servicios/">Explorar servicios</a>'+
    '<a class="secondary" href="#deteccion">Cómo interpretamos incidentes</a></header>'+
    '<section class="guide-heading" aria-labelledby="guide-heading"><p class="eyebrow">Guía de lectura</p><h2 id="guide-heading">Siete elementos de una ficha de servicio</h2>'+
    '<p class="intro">Estas ilustraciones explican funciones. No son mediciones actuales: este sitio es un catálogo demostrativo sin backend.</p></section>'+
    '<ol class="guide">'+list+'</ol>'+
    '<section id="deteccion" style="margin-top:55px" aria-labelledby="detect-heading"><p class="eyebrow">Detección de anomalías</p><h2 id="detect-heading">Cómo identificamos un posible incidente</h2>'+
    '<p class="intro">Una pequeña cantidad de reportes no es necesariamente una interrupción. Buscamos desviaciones relevantes y señales consistentes.</p>'+
    '<ol class="process">'+processes+'</ol><div class="figures"><div><strong>90 días</strong><p>Referencia histórica predeterminada; no seis meses.</p></div>'+
    '<div><strong>15 min</strong><p>Ventana predeterminada del motor, no frecuencia de publicación garantizada.</p></div>'+
    '<div><strong>2 + 2</strong><p>Mínimo configurable de reportantes distintos y ventanas elevadas.</p></div></div></section>'+
    '<section class="explain"><div><h3>Cómo entender los estados</h3><p>Sin datos suficientes no implica funcionamiento normal. Una posible interrupción o una interrupción detectada indican señales estadísticas, no confirmación oficial del proveedor.</p><p>Las etiquetas de alta confianza requieren evidencia, y no describen el estado de cada dispositivo.</p></div>'+
    '<div><h3>Privacidad y límites</h3><p>El estado se selecciona al reportar. No se publica la ubicación precisa de personas. Los duplicados sospechosos pueden conservarse y recibir menor peso: no afirmamos que desaparezcan de todos los contadores.</p><p>El motor requiere una ejecución externa programada; esta página de GitHub Pages no cuenta con datos de fallas en vivo.</p></div></section>'+
    '<section class="cta"><h2>¿Experimentas problemas con algún servicio?</h2><p>Consulta la ficha de tu plataforma. En este catálogo público, el formulario es una demostración y no transmite reportes.</p>'+
    '<a href="'+base+'/servicios/" class="primary">Buscar un servicio</a></section></div>';
}
