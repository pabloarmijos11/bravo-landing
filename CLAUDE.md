# CLAUDE.md — bravo-landing

Instrucciones para trabajar en este proyecto. Este archivo dice **cómo trabajar**;
el vault (`../Vault Proyectos`) dice **qué se aprendió**. Si se contradicen, gana el vault.

---

## Qué es esto

Landing page de una sola página para **Bravo**, una marca **ficticia** de salsas
picantes artesanales hechas con ajíes ecuatorianos.

El objetivo real no es la landing: es **aprender GSAP con scroll cinematográfico**
(`pin` + `scrub`) y salir del diseño genérico. Los proyectos anteriores fueron
funcionales pero visualmente simples; `altura-landing` invirtió esa prioridad y
este la lleva más lejos, moviendo la capa de movimiento de CSS a GSAP.

**Referencia visual:** `royalbev.com`. Se conserva su *sistema*, no sus valores —
ni su HTML, ni sus imágenes, ni sus tipografías de pago. Ver «Qué se conserva de
la referencia» más abajo.

Sin backend. El formulario de suscripción no envía nada.

## Stack

| Pieza | Versión | Nota |
|---|---|---|
| Node | 24.14.1 | |
| npm | 11.11.0 | |
| Angular | 21.2 | CLI 21.2.20. **Zoneless** — sin `zone.js`. |
| Tailwind CSS | 4.1 | Configurado por `ng new --style=tailwind`: `@import 'tailwindcss'` + `.postcssrc.json`. **No crear `tailwind.config.js`** — eso es el modelo de v3. |
| GSAP | 3.15.0 | Licencia `Standard 'no charge'`. Todos los plugins incluidos. |

El CLI de Angular 21 nombra las clases **sin sufijo**: un servicio de tema sería
`Theme` en `services/theme.ts`, no `ThemeService` en `theme.service.ts`.

**Sin tests**, decidido al aprobar el plan (`--minimal`). **Sin routing** y **sin
modo oscuro**, ambos deliberados — ver «Decisiones registradas».

**Formularios: solo Signal Forms** (`@angular/forms/signals`, ya disponible en el
`@angular/forms` 21.2 instalado — no es dependencia nueva). Prohibido
`FormControl`/`FormGroup`/`FormArray`/`FormBuilder` del paquete clásico. Leer
`~/.claude/skills/angular-developer/references/signal-forms.md` antes de tocar
cualquier formulario.

## Comandos

```bash
npm start          # servidor de desarrollo (localhost:4200)
npm run build      # build de producción
py -3 scripts/contraste.py   # verificar contraste de la paleta
```

**Python se invoca con `py -3`**, nunca `python` ni `python3`: el alias de
ejecución de la Microsoft Store los intercepta y falla con "Python was not found".

## Idioma

- **Código en inglés** — identificadores, componentes, ficheros, comentarios.
- **Textos de la interfaz en español** — es una marca ecuatoriana.
- Conversación y documentación, en español.

---

## GSAP: el patrón obligatorio

Toda sección animada usa `createMotionScope()` de `src/app/animations/motion-scope.ts`.
No se llama a `gsap` directamente desde un componente.

```ts
constructor() {
  afterNextRender(() => {
    const ctx = gsap.context(() => {
      /* selectores relativos al scope */
    }, this.root().nativeElement);

    this.destroyRef.onDestroy(() => ctx.revert());
  });
}
```

Cuatro puntos, cada uno con su motivo:

1. **`afterNextRender`, no `ngAfterViewInit`.** Garantiza DOM pintado y no se
   ejecuta en SSR.
2. **`gsap.context()` con elemento de scope.** Los selectores se resuelven dentro
   del componente. Sin el segundo argumento, un selector barre el documento entero
   y alcanza a otros componentes: la encapsulación de Angular aísla el CSS, **no**
   los selectores de JS.
3. **`ctx.revert()` en `DestroyRef.onDestroy`.** Mata tweens y `ScrollTrigger`s del
   contexto. Omitirlo deja listeners globales vivos sobre nodos muertos — el bug
   número uno de GSAP en SPAs.
4. **`data-anim="..."` como selector**, nunca clases de Tailwind: declara la
   intención y no se rompe al cambiar el espaciado.

**No usar `NgZone.runOutsideAngular()`.** El proyecto es zoneless, así que
`requestAnimationFrame` no está parcheado y GSAP no dispara detección de cambios.
Casi todos los tutoriales dicen lo contrario porque asumen Zone.js.

### Nombres de import de GSAP

GSAP es **inconsistente** con el sufijo `Plugin`, y la documentación resumida da
nombres que no existen (`ScrollTriggerPlugin` es inventado). La regla observable,
verificada contra el paquete en `node_modules`:

| Sin sufijo (clases) | Con sufijo `Plugin` |
|---|---|
| `gsap/ScrollTrigger` | `gsap/DrawSVGPlugin` |
| `gsap/Draggable` | `gsap/InertiaPlugin` |
| `gsap/Observer` | `gsap/MorphSVGPlugin` |
| `gsap/SplitText` | `gsap/MotionPathPlugin` |
| `gsap/ScrollSmoother` | |
| `gsap/Flip` | |

**`Draggable` con `inertia: true` no hace nada si `InertiaPlugin` no está
registrado.** Falla en silencio, sin error ni aviso.

### `scrub: 0.5`, no `scrub: true`

El número añade medio segundo de inercia: la animación *persigue* al scroll en vez
de pegarse a él. Es la diferencia entre un efecto mecánico y uno con peso.

### Staggers cortos

**45–125 ms.** El instinto de poner 300 ms "para que se note" es justo lo que hace
que una animación parezca barata. La referencia usa `0.045`–`0.125`.

---

## Reglas de código no negociables

1. **Solo tokens semánticos, nunca hex crudos ni utilidades de color de Tailwind de
   fábrica** (`bg-red-600` está prohibido; va `bg-brand`).
2. **Animar solo `opacity` y `transform`.** Nunca `width`, `height`, `top` ni
   `margin`: disparan layout en cada frame. *Excepción documentada:* el
   `backgroundColor` de la escala de picante, que solo provoca repaint.
3. **`prefers-reduced-motion` desde el primer componente animado**, no como parche
   final. Va en JS con `gsap.matchMedia()`, no solo en CSS: GSAP anima con estilos
   inline y un `transition: none` de CSS no detiene un tween.
   Con `reduce`, el contenido se ve en su estado **final y legible** — nunca oculto
   ni a medio camino.
4. **El texto sobre un nivel de picante viene dado por su token emparejado**
   (`text-heat-3-ink` sobre `bg-heat-3`), nunca elegido a ojo. Ver abajo.
5. **Contraste ≥ 4,5:1 verificado por cálculo** con `scripts/contraste.py`.
   **Ningún `opacity-*` sobre texto.** Una utilidad de opacidad mezcla el color
   del texto con el del fondo y hunde el ratio real, mientras que el script mide
   colores sólidos: el texto queda por debajo de AA *aunque el script diga que
   pasa*. Si hace falta un texto secundario, va un token de color más suave, no
   opacidad. Se detectó en la fase 1, sobre `heat-3` y `heat-4`.
6. **Nada de emojis como iconos.** SVG de Heroicons o Lucide.
7. **Ningún enlace a `href="#"`.** Solo va lo que tenga destino real — hallazgo de
   la auditoría Rams de `altura-landing`, donde 15 enlaces del pie quedaron muertos.
8. **Copy verificable, sin superlativos.** Los ajíes son variedades reales con datos
   reales. La auditoría de `altura-landing` encontró 5 superlativos sin respaldo que
   hubo que reescribir.

---

## La trampa del color que este proyecto descubrió

`scripts/contraste.py` demostró que **ningún color de la escala de picante es
malo**; lo que pasa es que cada nivel exige su propio color de texto, y el punto de
cambio está entre `heat-3` y `heat-4`:

| Fondo | Texto correcto | Ratio | El contrario da |
|---|---|---|---|
| `heat-1` verde | `ink` | 5,10 | 2,84 ✗ |
| `heat-2` amarillo | `ink` | 9,11 | 1,59 ✗ |
| `heat-3` naranja | `ink` | 5,49 | 2,64 ✗ |
| `heat-4` rojo | `bone` | 4,80 | 3,01 ✗ |
| `heat-5` negro | `bone` | 15,39 | 1,06 ✗ |

Por eso cada `--color-heat-N` va emparejado con un `--color-heat-N-ink` en
`styles.css`. Es el mismo razonamiento que los tokens `on-photo-*` de
`altura-landing`: un token de rol que **no** depende del tema sino del fondo concreto.

**Consecuencia para la fase 4:** como el fondo transiciona de verde a negro de forma
continua, el color del texto tiene que **cruzar de `ink` a `bone` a mitad de la
animación**. No basta con fijarlo al principio.

## La trampa de Tailwind con clases compuestas

**Tailwind escanea el código fuente buscando nombres de clase literales.** Una clase
construida por concatenación —`[class]="'bg-' + level.token"`— nunca aparece escrita
en el fuente, así que su utilidad **no se genera** y el elemento sale sin estilo,
sin ningún error ni aviso.

Las clases van escritas enteras en el objeto (`classes: 'bg-heat-1 text-heat-1-ink'`)
y se aplican con `[class]="level.classes"`. Se detectó en la fase 1, en la página de
verificación de tokens.

---

## Arquitectura

- **Sin routing.** Una sola página; las secciones son componentes apilados en
  `app.html`, no rutas.
- **Sin servicios compartidos.** No hay tema que compartir ni datos que cruzar entre
  secciones. Un servicio para estado que nadie comparte es sobreingeniería — misma
  conclusión que en `prueba-landingpage`.
- **Standalone components** con signals.

```
src/
├─ index.html                     tipografías de Google Fonts con doble preconnect
├─ styles.css                     @theme con tokens + grano de papel + text-worn
└─ app/
   ├─ app.html                    apila las secciones en orden
   ├─ components/
   │  └─ hero/ origin/ heat-scale/ products/ process/ cta/ site-footer/
   ├─ animations/
   │  ├─ gsap-setup.ts            registro de plugins, una sola vez
   │  └─ motion-scope.ts          gsap.context + matchMedia + DestroyRef
   └─ assets/bottles/             los 5 SVG de botella
scripts/contraste.py              verificación WCAG de la paleta
```

## Qué se conserva de la referencia (`royalbev.com`)

El **sistema**, no los valores:

1. Fondo hueso texturizado, nunca blanco plano.
2. Tres niveles tipográficos con roles opuestos: eyebrow manuscrita → titular
   condensado con textura → cuerpo en sans limpia. El contraste entre los tres
   *es* la estética.
3. El producto rompe el plano del titular: recortado y superpuesto, con capas.
4. Inversión cromática por sección, con el titular adaptándose al fondo.
5. Transiciones entre secciones con curvas orgánicas, nunca bordes rectos.
6. Detalles dibujados a mano por encima (flechas, círculos, subrayados).
7. Elementos rotados: nada perfectamente alineado.
8. Paleta real de tres colores + un acento que cambia por producto.

**Su defecto que NO se copia:** carga `ScrollSmoother` **y** Lenis a la vez, dos
motores de smooth scroll compitiendo por el mismo scroll. Aquí va uno solo.

Sus tipografías (Veneer, Gellix, Monday) son de pago. Sustituidas por Anton, Caveat
y Outfit, todas de Google Fonts. La textura desgastada se recrea con una máscara SVG
(`@utility text-worn` en `styles.css`), que es el ejercicio que sustituye a Veneer.

## Decisiones registradas

**Sin modo oscuro, a propósito.** La estética depende del fondo hueso; un tema
oscuro duplicaría todo el sistema de color sin aportar al objetivo, que es visual.
Es una diferencia consciente respecto a `altura-landing`, que sí lo tiene.

**Carrusel con GSAP `Draggable`, no Swiper.** La referencia usa Swiper, pero meterlo
significaría una segunda librería haciendo lo que `Draggable` ya hace — el mismo
error que la referencia comete con ScrollSmoother + Lenis. Además, el objetivo del
proyecto es aprender GSAP.

**Botellas como ilustración SVG, no fotografía.** Tienen que superponerse al titular,
lo que exige recorte con transparencia. Con SVG el color de cada salsa es una
variable CSS, pesa casi nada, y se pueden animar con `DrawSVGPlugin`.

**Ninguna skill instalada para GSAP.** El hueco es central, pero el criterio del
vault (`Wiki/Conceptos/Trabajar con Skills.md`) es procedencia + adopción + cuán
estándar es la tarea, y una skill que no sirve no es neutra: mete instrucciones en
contexto que luego hay que detectar y contradecir. Se consulta la documentación
oficial.

---

## Referencias que hay que leer antes de tocar según qué

| Antes de… | Leer |
|---|---|
| formularios | `~/.claude/skills/angular-developer/references/signal-forms.md` |
| efectos y DOM de terceros | `.../angular-developer/references/effects.md` |
| configurar Tailwind | `.../angular-developer/references/tailwind-css.md` |
| estilos de componente | `.../angular-developer/references/component-styling.md` |
| accesibilidad y ARIA | `.../angular-developer/references/angular-aria.md` |
| dar por terminada la UI | `ui-ux-pro-max/references/quick-reference.md` |

**El checklist de entrega es `quick-reference.md`, no `pro-rules.md`.** El segundo
avisa en su segunda línea de que apunta a UI de app nativa —safe areas, notch,
gestos del sistema— y auditar una web contra él da falsos positivos. Se aprendió
en `altura-landing`, donde la auditoría arrancó contra el archivo equivocado.

**`ui-ux-pro-max` busca por palabras clave, no diseña.** En `altura-landing` dio tres
desvíos (paleta de fintech, fuentes infantiles, scroll horizontal). Aquí la dirección
visual la pone la referencia; su valor está en lo objetivo: espaciado, specs de
componentes, accesibilidad, anti-patrones. Lo que aporte se acepta como andamio, pero
**lo rechazado se escribe en una tabla de overrides** en `design-system/bravo/MASTER.md`
— sin ese registro, los restos de la herramienta parecen decisiones del proyecto.

`ui-ux-pro-max` es una skill de plugin: vive en
`~/.claude/plugins/cache/.../ui-ux-pro-max/<versión>/...`. La ruta lleva el número de
versión dentro, así que localízala con `find` en vez de copiarla.

## Regla transversal de verificación

**Verificar que el servidor se recuperó no es lo mismo que verificar que `ng build`
compila.** En `altura-landing` tres síntomas simultáneos —sin scroll, modo oscuro
roto, nav muerto— resultaron ser `ng serve` caído sirviendo un build anterior. Se
encontró revisando el log del proceso en segundo plano, no lanzando otro build.

## Estado del proyecto

- [x] **Fase 1** — proyecto base: Angular 21 + Tailwind v4 + GSAP 3.15, tokens en
      `@theme`, tipografías, grano de papel, `text-worn`, `scripts/contraste.py`
      (todos los pares canónicos pasan AA) y página temporal de verificación en
      `app.html`, que se reemplaza en la fase 3.
- [ ] **Fase 2** — patrón de animación (`gsap-setup.ts`, `motion-scope.ts`)
- [ ] **Fase 3** — hero
- [ ] **Fase 4** — escala de picante
- [ ] **Fase 5** — origen, proceso, CTA, footer
- [ ] **Fase 6** — carrusel de productos
- [ ] **Fase 7** — pulido y auditoría

Plan por fases completo en `~/.claude/plans/bravo-landing-fases.md`.
