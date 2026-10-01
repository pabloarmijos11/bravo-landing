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
| Angular | 21.2.24 | CLI 21.2.20. **Zoneless** — sin `zone.js`. |
| Tailwind CSS | 4.3.3 | Configurado por `ng new --style=tailwind`: `@import 'tailwindcss'` + `.postcssrc.json`. **No crear `tailwind.config.js`** — eso es el modelo de v3. |
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
**No se llama a `gsap` directamente desde el ciclo de vida de un componente** — el
wrapper existe para que nadie tenga que acordarse de limpiar ni de respetar
`prefers-reduced-motion`.

```ts
export class Hero {
  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');

  constructor() {
    createMotionScope(this.root, (mm) => {
      mm.add(MOTION_OK, () => {
        gsap.to('[data-anim="title"]', { y: 0, opacity: 1, duration: 0.8 });
      });
      mm.add(MOTION_REDUCED, () => {
        gsap.set('[data-anim="title"]', { y: 0, opacity: 1 });
      });
    });
  }
}
```

**Se llama desde el constructor**, no desde un método: `afterNextRender` e
`inject(DestroyRef)` necesitan contexto de inyección.

Cuatro puntos, cada uno con su motivo:

1. **`afterNextRender`, no `ngAfterViewInit`.** Garantiza DOM pintado y no se
   ejecuta en SSR, donde no hay `window` y GSAP revienta.
2. **El scope del `matchMedia`.** Los selectores se resuelven dentro del componente.
   Sin él, un selector barre el documento entero y alcanza a otros componentes: la
   encapsulación de Angular aísla el CSS, **no** los selectores de JS. Verificado en
   la fase 2: con dos sondas montadas, la primera animó solo sus propios elementos.
3. **`mm.revert()` en `DestroyRef.onDestroy`.** Mata tweens y `ScrollTrigger`s.
   Omitirlo deja listeners globales vivos sobre nodos muertos — el bug número uno de
   GSAP en SPAs. Verificado: 2 triggers montados → 0 al desmontar.
4. **`data-anim="..."` como selector**, nunca clases de Tailwind: declara la
   intención y no se rompe al cambiar el espaciado.

### Por qué `matchMedia` y no `gsap.context()`

`MatchMedia` mantiene su **propio** array de `contexts` y su propio `revert()`
(comprobado en los typings de `gsap/types/gsap-core.d.ts`). Envolverlo además en un
`gsap.context()` sería una capa redundante y de fiabilidad dudosa: los callbacks de
`mm.add()` se ejecutan cuando la media query pasa a coincidir, no cuando corre el
contexto exterior, así que ese contexto no los captura de forma fiable.

`gsap.matchMedia(scope)` acepta el elemento de scope directamente, que es la misma
función que el segundo argumento de `context()`. Una capa menos y un solo mecanismo
de limpieza.

**Y hay un beneficio que sale gratis:** con `prefers-reduced-motion: reduce`, la
rama `MOTION_OK` no se ejecuta nunca, así que los `ScrollTrigger` **ni siquiera se
crean**. Verificado en la fase 2: con las dos sondas montadas y `reduce` emulado, el
contador marca 0. No hay listeners de scroll ni cálculos por frame. Con un `if` a
mano dentro de un callback esto no pasaría: se crearían igual y solo se saltaría la
animación.

### El estado inicial va en CSS, no en `gsap.from()`

Usar `gsap.to()` con el elemento ya oculto por CSS, en lugar de `gsap.from()` con el
elemento visible. Con `from`, el elemento se pinta en su sitio y GSAP lo esconde un
frame después: se ve un destello. Es el mismo problema que `altura-landing` resolvió
añadiendo la clase `.reveal` en el constructor de su directiva.

**No usar `NgZone.runOutsideAngular()`.** El proyecto es zoneless, así que
`requestAnimationFrame` no está parcheado y GSAP no dispara detección de cambios.
Casi todos los tutoriales dicen lo contrario porque asumen Zone.js.

### Lo que pesa GSAP de verdad

Medido en este proyecto, transferencia estimada del build de producción:

| Estado | Peso | Delta |
|---|---|---|
| Sin GSAP en el bundle (fase 1) | 36,00 kB | — |
| GSAP core + `ScrollTrigger` (fase 2) | 83,90 kB | **+47,90 kB** |

**El plan estimaba +34 kB y se quedó corto en un 40 %.** El umbral del proyecto es
130 kB, así que quedan unos 46 kB de margen para `DrawSVGPlugin` (fase 5),
`Draggable` e `InertiaPlugin` (fase 6). Debería entrar, pero hay que medir al añadir
cada uno y no darlo por hecho.

Por eso `gsap-setup.ts` registra **solo lo que ya se usa**: cada plugin registrado
entra en el bundle aunque no se ejecute.

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

### `scrub: true`, nunca un número

**Un `scrub` numérico no es un efecto: es latencia deliberada.** La animación se
queda N segundos por detrás del scroll, y esa latencia **se suma** a la que el
navegador ya mete por su cuenta.

Firefox trae smooth scroll nativo activado y agresivo. Con `scrub: 0.3` se acumulaban
los dos y el resultado era fluido pero retrasado — Pablo lo describió como «se
arrastra». En Chrome, con menos suavizado propio, el mismo valor se sentía bien. Por
eso el síntoma aparecía en un navegador y no en el otro.

Con `true`, la animación va atada 1:1 a la posición del scroll y el suavizado lo pone
cada navegador a su manera, que es la que sus usuarios ya esperan.

### Diagnóstico: distinguir latencia de falta de frames

Son dos problemas distintos y se arreglan en sitios opuestos. **La forma de
distinguirlos es preguntar cómo se siente, no mirar el código:**

| Síntoma | Causa | Dónde se arregla |
|---|---|---|
| «va a tirones», «da saltos» | faltan frames | coste de pintado: filtros SVG, máscaras, capas |
| «fluido pero llega tarde», «se arrastra» | **latencia** | `scrub`, y el suavizado del navegador |

En el hero se perdió una ronda entera optimizando pintado —grano del fondo a
pseudo-elemento fijo, `numOctaves` de 3 a 2, `translateZ(0)` en el enmascarado—
cuando el problema era latencia. Las optimizaciones valen por sí solas y se quedan,
pero no podían arreglar el síntoma: **59 FPS medidos antes y después.**

### El otro dial: cuánto dura el pin

`end: '+=N%'` es cuánto scroll transcurre con la página visualmente detenida. Con
`'+=100%'` era una pantalla entera y se sentía atascado: giras la rueda y no avanza.
Valor actual del hero: **`'+=70%'`**.

### Cómo medir FPS sin engañarse

**Contar frames de `requestAnimationFrame` sobre un intervalo largo NO sirve** con
scroll automatizado: el navegador pausa `rAF` cuando la pestaña está inactiva entre
acciones, así que se mide el tiempo muerto. Dio 1,3 FPS en una página que iba a 59.

Lo correcto es medir el **delta entre frames consecutivos** y quedarse con los que
ocurren en ráfaga (descartando los huecos > 400 ms):

```js
window.__d = [];
let last = performance.now();
const tick = (t) => { window.__d.push(Math.round(t - last)); last = t; requestAnimationFrame(tick); };
requestAnimationFrame(tick);
// ...hacer scroll real...
// mediana de window.__d.filter(x => x > 0 && x < 400)
```

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

**El hero no lleva copy descriptivo.** Solo eyebrow, titular, botella e
indicador de scroll. No es un olvido: el titular ocupa ~110 % del ancho y ~96 %
del alto de la pantalla, así que no queda ninguna zona libre. Se probó un copy a
la derecha, primero a media altura y luego en la franja superior, y en los dos
sitios caía sobre las letras negras con contraste 1:1. La referencia puede
permitírselo porque su titular va en dos líneas y deja aire lateral; con una
palabra de cinco letras ese hueco no existe. Lo descriptivo vive en la sección
Origen. **Si algún día el hero gana una segunda línea de titular, este es el
punto a reabrir.**

**Una sección con `pin` necesita fondo opaco propio (`bg-bone`).** Al pinearse pasa a
`position: fixed` y deja de ocupar sitio en el flujo: sin fondo, el contenido que
viene detrás se ve a través de ella. En el hero se manifestó como que «los colores de
abajo se ponen detrás de la botella». Aplica a **todas** las secciones pineadas que
vengan — la escala de picante de la fase 4 incluida.

**El titular del hero va a `48vw`, y el número importa.** Con `28vw` la palabra
cabía entera y el efecto de la referencia —el titular cortado por los lados— no
se producía en **ningún** tamaño de pantalla: al escalar con `vw`, la proporción
texto/viewport es constante, así que agrandar la ventana nunca lo arregla. Medido:
`42vw` daba 1467 px en un viewport de 1521 (aún sin cortar); `48vw` da 1677 px, con
78 px de desborde por lado. El `overflow-hidden` del `<section>` es lo que hace que
eso no genere scroll horizontal — sin él, el hero rompe la página entera.

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

## Reglas transversales de verificación

**Verificar que el servidor se recuperó no es lo mismo que verificar que `ng build`
compila.** En `altura-landing` tres síntomas simultáneos —sin scroll, modo oscuro
roto, nav muerto— resultaron ser `ng serve` caído sirviendo un build anterior. Se
encontró revisando el log del proceso en segundo plano, no lanzando otro build.

**Para comprobar un `ScrollTrigger`, usar scroll real, no `window.scrollTo`.** Un
salto programático justo después de montar el componente da un falso negativo: la
animación parece no dispararse porque los triggers recién creados todavía no han
asentado sus posiciones. Pasó en la fase 2 y costó un rato de diagnóstico creyendo
que el patrón estaba roto. Si hace falta scroll programático, hay que dejar pasar
tiempo o forzar `ScrollTrigger.refresh()`.

## Estado del proyecto

- [x] **Fase 1** — proyecto base: Angular 21 + Tailwind v4 + GSAP 3.15, tokens en
      `@theme`, tipografías, grano de papel, `text-worn`, `scripts/contraste.py`
      (todos los pares canónicos pasan AA) y página temporal de verificación en
      `app.html`, que se reemplaza en la fase 3.
- [x] **Fase 2** — patrón de animación: `gsap-setup.ts` (registro idempotente) y
      `motion-scope.ts` (`createMotionScope`). Los cuatro puntos verificados en
      navegador con la sonda temporal `app-motion-probe`:
      (1) la animación corre y responde al scroll;
      (2) los `ScrollTrigger` pasan de 2 a 0 al desmontar;
      (3) con `reduce` emulado, las 12 barras quedan en opacidad 1 y
          desplazamiento 0, y se crean **0** `ScrollTrigger`;
      (4) el scope aísla los selectores — la sonda A llegó a opacidad 1
          mientras la B seguía intacta en 0.
      La sonda se borra en la fase 3.
- [x] **Fase 3** — hero con `pin` + `scrub`, y componente `app-bottle` (una sola
      botella SVG; el color entra por `[fill]`, así que añadir una salsa no añade
      un archivo). Tres capas a distinta velocidad.

      Verificado: titular sangrando 78 px por lado sin scroll horizontal; `scrub`
      respondiendo en ambos sentidos; **375 px**; **paginado por teclado**;
      y fluidez **en Chrome y en Firefox**, que costó cuatro iteraciones y dejó
      la mitad de lo aprendido de esta fase.
- [ ] **Fase 4** — escala de picante
- [ ] **Fase 5** — origen, proceso, CTA, footer
- [ ] **Fase 6** — carrusel de productos
- [ ] **Fase 7** — pulido y auditoría

Plan por fases completo en `~/.claude/plans/bravo-landing-fases.md`.
