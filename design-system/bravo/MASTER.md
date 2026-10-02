# MASTER.md — sistema de diseño de Bravo

Fuente de verdad de color, tipografía, espaciado y motion.
**Leer antes de tocar cualquier cosa visual.**

Los valores vivos están en `src/styles.css` (`@theme`). Este archivo explica el
**porqué**; el CSS tiene el **qué**. Si se contradicen, gana el CSS y hay que
corregir este archivo.

---

## De dónde sale esta dirección visual

De un análisis de [royalbev.com](https://royalbev.com), no de un generador.

Es una diferencia importante respecto a `altura-landing`, donde `ui-ux-pro-max`
generó el `MASTER.md` y hubo que corregirlo con una tabla de overrides porque la
herramienta busca por palabras clave en vez de diseñar. Aquí la dirección la pone
una referencia real que ya resolvió sus problemas de diseño, y lo que se extrae son
**principios**, no valores.

### Los ocho principios que se conservan

1. **El fondo nunca es blanco plano.** Hueso con grano de papel. Es la decisión más
   barata y la que más aleja el resultado de "plantilla".
2. **Tres niveles tipográficos con roles opuestos.** El contraste entre ellos *es*
   la estética, no un adorno.
3. **El producto rompe el plano del titular.** Recortado y superpuesto, tapando
   letras. Hay capas y el producto gana.
4. **Inversión cromática por sección.** El esqueleto no cambia, solo el acento.
5. **Las secciones no se separan con bordes rectos**, sino con curvas orgánicas.
6. **Detalles dibujados a mano** por encima: flechas, círculos, subrayados.
7. **Nada perfectamente alineado.** Elementos rotados, tarjetas en abanico.
8. **La paleta real son tres colores** más un acento que cambia por producto.

### Lo que NO se copia

Su HTML, sus imágenes y sus tipografías (Veneer, Gellix y Monday son de pago).

Y su defecto técnico: carga **ScrollSmoother y Lenis a la vez**, dos motores de
smooth scroll compitiendo por el mismo scroll. Aquí va uno solo.

---

## Color

### Base — tres colores

| Token | Valor | Rol |
|---|---|---|
| `--color-bone` | `#EDE9DF` | fondo de página |
| `--color-ink` | `#1A1919` | texto y titulares sobre bone |
| `--color-brand` | `#C4231F` | rojo de marca: botones, eyebrows, acentos |

### Escala de picante — el acento que cambia

Cinco niveles, uno por ají. **Cada uno va emparejado con el color de texto que sí
contrasta encima**, y el par no se elige a ojo: está calculado.

| Nivel | Ají | Fondo | Texto | Ratio |
|---|---|---|---|---|
| `heat-1` | Ají criollo | `#4E9B47` | `ink` | 5,10 |
| `heat-2` | Ají amarillo | `#E8B31F` | `ink` | 9,11 |
| `heat-3` | Rocoto | `#E2701A` | `ink` | 5,49 |
| `heat-4` | Habanero | `#C4231F` | `bone` | 4,80 |
| `heat-5` | El extremo | `#1A1010` | `bone` | 15,39 |

**El punto de cambio de texto oscuro a claro está entre `heat-3` y `heat-4`.**

Usar el texto contrario al que dice el token rompe WCAG en los cinco casos, y en
`heat-5` da 1,06:1 — invisible. Por eso existe `--color-heat-N-ink` emparejado con
cada `--color-heat-N`: el texto viene dado por el token, no por criterio del momento.

Mismo razonamiento que los tokens `on-photo-*` de `altura-landing`: un token de rol
que no depende del tema, sino del fondo concreto sobre el que vive.

### Reglas de color

- **Nunca un hex crudo en un componente.** Solo utilidades derivadas de tokens.
- **Nunca una utilidad de color de Tailwind de fábrica.** `bg-red-600` está
  prohibido; va `bg-brand`.
- **Nunca `opacity-*` sobre texto.** Mezcla el color con el fondo y hunde el ratio
  real, mientras el script mide colores sólidos: el texto queda por debajo de AA
  aunque el script diga que pasa. Para texto secundario, un token más suave.
- Verificar siempre con `py -3 scripts/contraste.py` tras cambiar un token.

---

## Tipografía

Tres niveles, tres roles opuestos. Todas de Google Fonts.

| Token | Fuente | Rol | Sustituye a |
|---|---|---|---|
| `--font-display` | **Anton** | titulares, mayúsculas, tamaños grandes | Veneer |
| `--font-hand` | **Caveat** | eyebrows: la línea corta antes del titular | Monday |
| `--font-body` | **Outfit** | todo el texto corrido | Gellix / Outfit |

### Reglas tipográficas

- **Anton solo en mayúsculas y nunca por debajo de 32 px.** Es una condensada de
  titular; en tamaño pequeño se vuelve ilegible y agresiva.
- **Los titulares llevan `letter-spacing: -0.02em` y `line-height: 0.88`.** Anton ya
  viene muy apretada, y a tamaño grande el interlineado por defecto abre demasiado.
  Ya está aplicado a `h1`/`h2` en la capa base de `styles.css`.
- **Caveat solo para eyebrows**, nunca para texto corrido ni para datos. Una
  manuscrita anuncia y humaniza; no informa.
- **Outfit para absolutamente todo lo demás**, incluidos datos y cifras.
- El titular del hero **debe sangrar fuera del viewport**. Un titular que cabe
  entero no tiene el efecto de la referencia.

### La textura desgastada

Sustituye a la fuente grunge de pago. Es la utilidad `text-worn` de `styles.css`:
una máscara SVG de ruido recorta el texto, de modo que el color lo sigue poniendo
`color` y el token semántico sigue mandando.

Tres números la gobiernan, calibrados en navegador y en este orden:

| Parámetro | Valor | Qué pasa si se cambia |
|---|---|---|
| `baseFrequency` | `0.16` | a `0.6` parece ruido de televisión; a `0.08` la letra parece corroída |
| alfa del `feColorMatrix` | `-13 · ruido + 11.3` | **el número sensible**; bajar la pendiente come letra muy rápido |
| `mask-size` | `420px` | a `240px` el patrón se nota como azulejo dentro de una palabra |

El nivel se eligió **comparando cuatro variantes en paralelo en el navegador**, no
ajustando de una en una. Para un parámetro puramente visual como este, ver las
opciones juntas decide en un vistazo lo que iterando cuesta varias rondas.

**Solo en titulares grandes.** Sobre texto pequeño destruye la legibilidad.

---

## Motion

La capa de movimiento va con **GSAP**, no con CSS. El patrón de integración
obligatorio está en `CLAUDE.md`; aquí van las decisiones de diseño del movimiento.

### Los números

| Parámetro | Valor | Por qué |
|---|---|---|
| `scrub` | `0.5` | con `true` la animación se pega al scroll y se siente mecánica; medio segundo de inercia hace que la persiga, y eso da peso |
| `stagger` | **45–125 ms** | el instinto de poner 300 ms "para que se note" es justo lo que hace que parezca barato |
| `ease` | `power3.out` por defecto | salida rápida y frenado largo: se lee como algo con masa |

### Qué se anima y qué no

- **Solo `opacity` y `transform`.** Nunca `width`, `height`, `top` ni `margin`:
  disparan layout en cada frame.
- **Excepción documentada:** el `backgroundColor` de la escala de picante. Provoca
  repaint, no layout, y es el mecanismo central de esa sección. Si rindiera mal, la
  alternativa es cruzar capas con `opacity`.

### Reduced motion

`prefers-reduced-motion` desde el primer componente animado, **en JS con
`gsap.matchMedia()`**, no solo en CSS: GSAP anima con estilos inline y un
`transition: none` de CSS no detiene un tween.

**Con `reduce`, el contenido se ve en su estado final y legible.** Nunca oculto,
nunca a medio camino. Una animación desactivada que deja el contenido invisible es
peor que no haberla puesto.

---

## Anti-patrones

Cosas que este proyecto **no** hace, y por qué:

| Anti-patrón | Motivo |
|---|---|
| Sombras que crecen al pasar el ratón | Las tarjetas cambian de fondo, no se elevan. El papel no levita. |
| Emojis como iconos | SVG de Heroicons o Lucide. |
| Enlaces a `href="#"` | Un enlace sin destino es una promesa que la página no cumple. |
| Superlativos en el copy | Los ajíes tienen datos reales; "el más picante del mundo" no es verificable. |
| Blanco puro de fondo | Es la firma visual de la plantilla sin tocar. |
| Todo alineado a la retícula | La referencia rota tarjetas y desalinea a propósito. |
| Dos librerías de animación | El error que comete la propia referencia. |

---

## Tabla de overrides

Aquí van las decisiones en que se rechazó una propuesta generada, con el motivo.
Sin este registro, lo que propuso la herramienta parece una decisión del proyecto —
es la lección de `altura-landing`, donde `ui-ux-pro-max` inyectó una paleta de
fintech y Google Stitch metió tokens de Material Design 3 y un azul ajeno a la marca.

| Fecha | Qué se propuso | Qué se hizo | Por qué |
|---|---|---|---|
| 2026-09-30 | Textura del titular con alfa `-5 · ruido + 3.9` | Rechazado | Se comía media letra: parecía corroída, no desgastada |
| 2026-09-30 | Textura del titular con alfa `-7 · ruido + 5.6` | Rechazado | Pablo: «tiene muchos espacios blancos». Aún destruía demasiada superficie de letra |
| 2026-09-30 | Tres variantes en paralelo (`-7`, `-10`, `-13`) | Elegida `-13 · ruido + 11.3` | La letra se lee sólida y el desgaste solo se aprecia de cerca, que es lo que hace la referencia |

### Fase 7 — checklist `quick-reference.md` de `ui-ux-pro-max`

Lo que el checklist pedía y aquí **no** se hizo. Lo aceptado no se registra: está
en el código. Esto es solo lo rechazado, con su motivo.

| Regla del checklist | Qué pedía | Qué se hizo | Por qué |
|---|---|---|---|
| `disabled-states` | Opacidad reducida (0,38–0,5) en controles deshabilitados | Token sólido `ink-soft` + `cursor-not-allowed` + atributo `disabled` | La regla 5 del proyecto prohíbe `opacity-*` sobre texto: mezcla el color con el fondo y hunde el ratio real mientras el script, que mide sólidos, sigue diciendo que pasa. Un token sólido da el mismo efecto y es medible |
| `viewport-units` | Preferir `min-h-dvh` sobre `100vh` | Se mantiene `h-screen` | `dvh` cambia de valor cuando el navegador móvil oculta su barra, y cada cambio dispararía un `ScrollTrigger.refresh()` en mitad de un `pin`. Un alto estable vale más aquí que el ajuste al viewport dinámico |
| `stagger-sequence` | 30–50 ms por elemento | 60–70 ms | La banda del proyecto es 45–125 ms, tomada de la referencia. 30 ms en un reveal editorial se lee como un parpadeo |
| `duration-timing` | Micro-interacciones de 150–300 ms | Reveals de 500 ms | Son entradas de sección, no micro-interacciones. A 300 ms el contenido aparece antes de que el ojo llegue |
| `excessive-motion` | Animar 1–2 elementos clave por vista como máximo | El hero anima 4 capas | Las tres velocidades distintas **son** el efecto de profundidad; reducirlo a dos capas elimina el motivo de la sección |
| `skip-links` | Enlace de salto al contenido principal | No se añade | No hay navegación repetida que saltar: 15 elementos interactivos en toda la página y ningún menú antes del contenido. El problema real de recorrido está anotado en la auditoría (principio #2) y es otro |
