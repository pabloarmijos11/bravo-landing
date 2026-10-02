# Evidencia

Todo lo de aquí está medido, no estimado. Cada dato lleva su origen.

## E1 — Estructural

| Dato | Valor | Origen |
|---|---|---|
| Elementos interactivos | **15** | `document.querySelectorAll('a,button,input,[tabindex="0"]')` |
| Landmarks | 8 | `nav`, `footer`, `section[id]`, `[role="region"]` |
| Elementos totales en el DOM | 394 | medido en navegador |
| Profundidad máxima del árbol | 13 | medido en navegador |
| Líneas de TS + HTML | 2 554 | `wc -l` sobre `src/app` |
| Componentes | 8 | `src/app/components/` |
| `ScrollTrigger` activos | **7** | `ScrollTrigger.getAll().length` |
| `pin-spacer` en el DOM | 2 | hero y escala |

**Fugas:** ninguna. 7 triggers y 2 spacers constantes al inicio, tras recorrer
los 10 008 px del documento, al volver arriba y tras un `ScrollTrigger.refresh()`.

**Afordancias repetidas con el mismo propósito:** el carrusel ofrece arrastre,
botones y teclado para la misma acción. No es duplicación ociosa — es el
requisito de accesibilidad `gesture-alternative`, y sin los botones el arrastre
sería invisible para quien no usa ratón ni pantalla táctil.

## E2 — Visual

| Dato | Valor |
|---|---|
| Escala de espaciado observada (px) | 4, 8, 12, 16, 24, 32, 40, 56, 64, 80, 128, 144, 176 |
| Escala tipográfica observada (px) | 14, 16, 18, 20, 24, 30, 36, 60, 112, 128, 144, 169, 737 |
| Tokens de color definidos | 14 (`--color-*` en `styles.css`) |
| Colores distintos renderizados | 8 |
| Hex crudos fuera de `styles.css` | **0** |
| Utilidades de color de fábrica (`bg-red-600`…) | **0** |

El espaciado es íntegramente múltiplo de 4. La escala tipográfica tiene saltos
grandes en la zona alta (169 → 737 px) porque los titulares van en `vw`: es
intencional y coherente con la referencia.

**Contraste** — `py -3 scripts/contraste.py`, todos los pares canónicos ≥ 4,5:1:

| Par | Ratio |
|---|---|
| `ink` sobre `bone` | 14,47 |
| `ink-soft` sobre `bone` | 5,94 |
| `bone` sobre `brand` | 4,80 (el más justo) |
| `ink` sobre `heat-1` | 5,10 |
| `bone` sobre `heat-5` | 15,39 |

Además, la rampa interpolada del fondo animado se recorre entera: a umbral 4,5
hay una **zona muerta entre el 57,5 % y el 72,5 %** donde ningún color de texto
pasa, y por eso el texto de la escala entra y sale en vez de permanecer.

**Estados presentes:** vacío ✓ · carga ✓ · error ✓ · éxito ✓ · foco ✓ ·
deshabilitado ✓. Los seis verificados en navegador.

## E3 — Copy y honestidad

| Comprobación | Resultado |
|---|---|
| Superlativos sin respaldo | **0** |
| Patrones oscuros | **0** |
| Enlaces `href="#"` | **0** (los 5 del pie apuntan a `id` existentes) |
| Desajustes etiqueta→comportamiento | ninguno |

Tres decisiones de honestidad que van más allá de no mentir:

1. **El pie declara que la marca es ficticia** (`site-footer.html:60`). «Una
   landing bien hecha de una marca falsa es indistinguible de una real.»
2. **El habanero declara en su propia ficha que no es nativo del Ecuador**
   (`products.ts`, `heat-scale.ts`), porque no lo es.
3. **Los SHU van en rangos amplios** y no en cifras exactas, porque el dato por
   variedad ecuatoriana concreta no está documentado de forma fiable.

Único punto a mirar: «no hay stock permanente» (`cta.html:64`) podría leerse
como escasez. No lo es — es consecuencia declarada del proceso de fermentación
descrito en la sección anterior, y no hay nada que comprar.

## E4 — Peso y fricción

| Dato | Valor | Nota |
|---|---|---|
| JS inicial (transferencia) | **116,63 kB** | `main` |
| CSS inicial (transferencia) | 4,80 kB | |
| **Total inicial** | **121,55 kB** | umbral propio: 130 |
| Peticiones de red externas | 2 dominios | Google Fonts (`googleapis` + `gstatic`) |
| Animaciones CSS en reposo | **0** | nada se mueve sin scroll |
| Modales / banners / insignias al cargar | **0** | sin cookies, sin pop-ups |
| FPS medianos con scroll | 59 | medido en fase 4 |

Reparto del bundle, medido plugin a plugin:

| Pieza | Coste |
|---|---|
| GSAP core + `ScrollTrigger` | +47,90 kB |
| **Signal Forms** (un campo de correo) | **+18,87 kB** |
| `Draggable` + componente del carrusel | +12,73 kB |
| `InertiaPlugin` | +2,48 kB |
| `DrawSVGPlugin` | +1,35 kB |

## E5 — Accesibilidad

| Comprobación | Resultado |
|---|---|
| Jerarquía de encabezados | `1,2,2,2,2,2,2,2,3,3,3,3,3,2,3,3,3,3,2` — un `h1`, **sin saltos** |
| Objetivos táctiles < 44 px | **0** (tras corregir el pie: 23 → 52 px) |
| Separación entre objetivos contiguos | 8 px exactos en el pie |
| Elementos sin `cursor: pointer` | **0** (tras corregir los botones) |
| Texto por debajo de 14 px | **0** |
| Scroll horizontal a 375 / 768 / 1024 / 1440 | **0 en los cuatro** |
| Desbordes reales fuera del hero y del carrusel | **0 en los cuatro anchos** |
| `prefers-reduced-motion` | respetado en JS, no solo en CSS |
| Botones de solo icono con `aria-label` | sí (los dos del carrusel) |
| Etiqueta visible en el formulario | sí (`<label for="cta-email">`) |
| Errores anunciados | `aria-live="polite"` + `role="status"` en éxito |
| Recorrido completo por teclado | verificado: flechas, Inicio, Fin, tabulación |
| Enlace de salto al contenido | **no hay** |

**Hallazgo propio de esta auditoría, ya corregido:** con el carril del carrusel
movido por `transform` no hay scroll nativo, así que el navegador no podía traer
a la vista una tarjeta enfocada. Se resolvió desplazando el carrusel al recibir
foco una tarjeta; verificado con seis tabulaciones reales.

## Huecos conocidos

- **Arrastre e inercia del carrusel:** no verificables en la pestaña
  automatizada — `Draggable` aplica su transform por el ticker de GSAP y `rAF`
  está pausado. Confirmados por Pablo en Firefox.
- **Lectores de pantalla reales:** no se ha probado con NVDA ni VoiceOver. Lo
  verificado es el marcado, no la experiencia.
- **Dispositivo móvil real:** el responsive se midió en iframe de ancho
  controlado, no en hardware.
