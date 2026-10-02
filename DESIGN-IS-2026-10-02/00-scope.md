# Alcance de la auditoría

**Fecha:** 2026-10-02
**Superficie auditada:** `http://localhost:4200` — landing de una sola página de Bravo.
**Fase del proyecto:** 7 (pulido y auditoría), con las fases 1 a 6 cerradas.

## Qué se audita

Las siete secciones, en orden de aparición:

| # | Sección | Componente | Mecanismo |
|---|---|---|---|
| 1 | Hero | `components/hero` | `pin` + `scrub`, 3 capas a distinta velocidad |
| 2 | Origen | `components/origin` | reveal con `toggleActions` |
| 3 | Escala de picante | `components/heat-scale` | `pin` + `scrub`, timeline única de 5 grados |
| 4 | Las cinco salsas | `components/products` | carrusel `Draggable` + `InertiaPlugin` |
| 5 | Proceso | `components/process` | `DrawSVGPlugin` con `scrub` + reveal |
| 6 | Suscripción | `components/cta` | Signal Forms, 4 estados |
| 7 | Pie | `components/site-footer` | sin animación, deliberado |

## Usuario y tarea principal

- **Usuario:** alguien que llega a la página sin conocer la marca.
- **Tarea principal:** entender qué es Bravo y dejar un correo para avisos.
- **Objetivo real del proyecto:** aprender GSAP con scroll cinematográfico. La
  landing es el vehículo, no el fin — y eso condiciona cómo leer varias notas.

## Restricciones

- Angular 21 zoneless, Tailwind v4, GSAP 3.15. Sin backend.
- Umbral de bundle autoimpuesto: **130 kB** de transferencia.
- Marca **ficticia**, declarada como tal en el pie.
- Sin modo oscuro y sin routing, ambos deliberados.
- Referencia visual: `royalbev.com` — se conserva su *sistema*, no sus valores.

## Método

La skill reparte la recolección de evidencia entre subagentes. **No se han
usado:** las instrucciones de la sesión piden no generar agentes salvo petición
explícita, y la evidencia ya se había recogido en esta misma sesión durante la
fase 7. Se sigue el resto del método — rúbrica, anclas por principio, regla de
veredicto mecánica.

## Materiales

- Código: `src/app/**`, `src/styles.css`, `src/index.html`
- Medición en navegador (Chrome) sobre el servidor de desarrollo
- Banco de pruebas responsive en iframe a 375 / 768 / 1024 / 1440 px
- `py -3 scripts/contraste.py` para los ratios WCAG
- `npm run build` para los pesos
