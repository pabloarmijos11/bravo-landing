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

Tres cosas que costaron en la fase 5 y que la referencia menciona de pasada:

1. **Hay que importar la directiva `FormField`** en el componente. Sin ella el
   compilador dice `NG8002: Can't bind to 'formField' since it isn't a known
   property of 'input'`, que suena a atributo mal escrito y es un import que
   falta.
2. **Llamar al campo para llegar a su estado:** `form.email().valid()`, nunca
   `form.email.valid()`. Y en la raíz, `form().invalid()`.
3. **No es dependencia nueva, pero sí son ~19 kB** — ver la tabla de pesos.

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
| Escala de picante (fase 4) | 84,95 kB | +1,05 kB |
| Origen (fase 5) | 85,92 kB | +0,97 kB |
| `DrawSVGPlugin` (fase 5) | 87,27 kB | **+1,35 kB** |
| Signal Forms, el CTA (fase 5) | 106,14 kB | **+18,87 kB** |
| `Draggable` + el carrusel (fase 6) | 118,95 kB | **+12,73 kB** |
| `InertiaPlugin` (fase 6) | 121,30 kB | **+2,48 kB** |

**Signal Forms cuesta casi 19 kB, y eso el plan no lo había estimado.** Es, con
diferencia, lo más caro añadido después de GSAP: un único campo de correo trae
consigo `@angular/forms` entero. Era una decisión ya tomada —el proyecto quería
practicar Signal Forms— pero conviene saber el precio: si un día hiciera falta
recortar, ese formulario es el primer sitio donde mirar.

**El plan estimaba +34 kB para GSAP y se quedó corto en un 40 %**, y además no había
previsto los 19 kB de Signal Forms. Con la fase 6 cerrada el total es **121,30 kB**
contra un umbral de 130: quedan **8,70 kB**.

Dos consecuencias prácticas de ese margen tan estrecho:

- La fase 7 es pulido y **no debería añadir JavaScript**. Si lo añade, hay que medir
  antes de escribirlo, no después.
- `Draggable` cuesta cuatro veces más que `InertiaPlugin` (12,73 contra 2,48, y en
  los 12,73 va también el componente entero con su copy). La intuición de que el
  plugin «extra» de física sería el caro es al revés.

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

### El cambio de fuente mueve el titular un 19 %, y eso se paga una vez

Las tipografías van con `display=swap`, así que el navegador pinta primero con
la fuente de respaldo y cambia a Anton al recibirla. Con un titular normal eso
es un parpadeo; con **este** titular es un reflujo del elemento más grande de la
página, que además lleva una `mask-image` y hay que volver a rasterizar entero.

Medido: «Bravo» a 737 px ocupa **1998 px con Arial Narrow y 1677 px con Anton**
— un salto de 321 px, el 19,1 %. La altura no cambia (0 %).

Se corrige con un respaldo de métricas ajustadas, que no descarga nada:

```css
@font-face {
  font-family: 'Anton Fallback';
  src: local('Arial Narrow'), local('Liberation Sans Narrow'), local('Arial');
  size-adjust: 83.9%;          /* 1677 / 1998, exactamente lo medido */
}
```

Verificado después: el salto baja de **321 px a 12 px** (0,72 % de error
residual). El titular ya no se mueve al llegar Anton.

**Y falta el refresh que ScrollTrigger no hace solo.** Sus `autoRefreshEvents`
por defecto son `load`, `resize` y `visibilitychange`; **las fuentes web no están
en esa lista** y suelen llegar después de `load`, así que los `start` y `end`
quedan calculados con las métricas equivocadas. Medido forzando el respaldo en
todo el documento: 91 px de diferencia en el alto total y entre 32 y 58 px de
desplazamiento por sección.

```ts
document.fonts?.ready.then(() => ScrollTrigger.refresh());
```

El hero es el único que se libra, porque está en la posición 0 y su recorrido es
relativo al viewport. **El desfase crece hacia abajo**, así que lo sufren las
secciones del final.

### `will-change` es una sugerencia, y una capa grande la anula

Firefox se trababa en el **primer** movimiento de rueda del hero y después iba
fluido. Dos respuestas acotaron la causa antes de tocar nada:

| Pregunta | Respuesta | Qué descarta |
|---|---|---|
| ¿Cuándo se traba? | al girar la rueda por primera vez | no es la salida del pin |
| ¿Y si esperas 5 s antes de scrollear? | se traba igual | **no es trabajo de carga** |

Es decir: el coste se paga **la primera vez que algo se anima**, no antes. Eso es
la creación de la capa de composición — hasta que no hay un transform de verdad,
el navegador no tiene por qué rasterizar el titular en su propia capa, y
rasterizarlo cuesta: mide 1677 × 737 px y lleva una `mask-image` encima.

**El número que lo explica: 1677 × 737 × 4 bytes = 4,7 MB de textura.** Firefox
tiene un presupuesto para `will-change` (`layout.css.will-change.max-mb`) que por
defecto ronda los **3 MB**, y cuando se supera **ignora la propiedad**. Chrome es
más generoso, y de ahí que el síntoma fuera de un solo navegador.

La palanca es de GSAP, no de CSS:

```ts
gsap.set(selectores, { force3D: true, y: 0 });              // en la carga
const tl = gsap.timeline({ defaults: { force3D: true } });  // y durante
```

`force3D` escribe `translate3d(0,0,0)` desde el render inicial en vez de esperar
al movimiento. **El trabajo es el mismo; lo que cambia es que ocurre cuando nadie
está mirando.** Y mantenerlo durante la animación evita que GSAP vuelva a un
transform 2D y el navegador descarte la capa.

Verificado con `scrollY` en 0 y sin haber tocado la rueda: los cuatro elementos
animados del hero ya llevan `translate3d` en su estilo inline.

**La lección general:** `will-change: transform` no garantiza nada. Si la capa es
grande —y en este proyecto los titulares son enormes por diseño— hay que forzar
la promoción con un transform 3D real y comprobar que está puesta, en vez de
suponer que la sugerencia se atendió.

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

### La duración de una timeline es la de su último tween

No la que uno tenga en la cabeza. Si el **último estado** de una secuencia no tiene
ningún tween detrás —porque no se desvanece ni transiciona a nada—, la timeline
termina antes de que ese estado llegue a reposar, y con `scrub` eso significa que
el pin se suelta justo cuando aparece.

En la escala de picante la timeline debía durar 14,2 unidades y duraba 12,25: el
quinto ají entraba y la sección se iba. **Se vio midiendo en el navegador, no
leyendo el código** — la aritmética parecía correcta porque el error estaba en lo
que GSAP hace, no en las cuentas.

```ts
// Reserva explícita del final. No anima nada; solo marca la duración.
tl.to({}, { duration: 0 }, total);
```

### GSAP no sabe interpolar `var(--token)`

Si a un tween se le pasa `backgroundColor: 'var(--color-heat-2)'`, GSAP escribe esa
cadena tal cual en el estilo inline: el color **salta de golpe** al final en vez de
transicionar, sin error ni aviso. Necesita un color real.

La salida que **no** rompe la regla de no escribir hex crudos es resolver el token
en tiempo de ejecución, de modo que `styles.css` siga siendo la única fuente de
verdad:

```ts
getComputedStyle(el).getPropertyValue('--color-heat-2').trim();   // '#e8b31f'
```

**Pero la restricción es del tween, no del token.** Lo que decide es quién consume el
valor: si acaba en una propiedad CSS que el navegador resuelve —un binding de estilo,
un atributo—, `var(--token)` escrito tal cual es correcto y es lo que se debe usar.
Solo hay que resolverlo a un color real cuando lo va a **interpolar** GSAP.

```html
<!-- correcto: lo resuelve el navegador -->
<app-bottle [fill]="'var(--color-heat-3)'" />
<span [style.background-color]="product.fill"></span>
```

### `scrub` o `toggleActions`: el criterio

No es cuestión de gusto, y las dos secciones de la fase 5 lo dejaron claro:

| La animación… | Va con | Ejemplo |
|---|---|---|
| **recorre** un estado que el scroll controla | `scrub: true` | el pin del hero, la escala, la línea del proceso |
| solo **aparece** una vez | `toggleActions` | el texto de Origen, los pasos, el CTA |

Atar un texto a `scrub` obliga a seguir moviendo la rueda para terminar de
verlo, que es lo contrario de lo que quiere alguien que ha llegado a leer.

**Y de ahí sale un error que solo se ve en el navegador:** en el proceso, los
cuatro pasos se repartieron por posiciones de una timeline con `scrub`
(0, 0,25, 0,5, 0,75). El reparto es por **progreso de la timeline**, no por dónde
está cada elemento en pantalla. Medido: el cuarto paso ya estaba a 619 px de un
viewport de 770 —el usuario lo tenía delante— y su animación no entraba hasta el
80 % del recorrido. Se veía un hueco vacío.

La línea (que recorre) y los pasos (que aparecen) acabaron con **un trigger cada
uno**. Esto no contradice el anti-patrón de «un `ScrollTrigger` por nivel» de la
escala: allí los cinco niveles son estados de una secuencia continua y triggers
separados se desincronizan; aquí son elementos independientes que solo tienen
que hacerse visibles.

### SVG que se estiran: dos atributos que van juntos

Para un SVG que debe adaptarse a un contenedor de alto o ancho variable:

- **`preserveAspectRatio="none"`** — deja que se deforme hasta llenar la caja.
  Sin él mantiene su proporción y se queda corto o se sale.
- **`vector-effect="non-scaling-stroke"`** — su acompañante obligatorio **cuando
  hay trazo**. Al estirar en un solo eje, el grosor se estira con él y la línea
  sale más gruesa en vertical que en horizontal.

El segundo **no hace falta si la forma es un relleno** y no un trazo: las curvas
entre secciones son siluetas rellenas y se deforman sin que se note.

### Staggers cortos

**45–125 ms.** El instinto de poner 300 ms "para que se note" es justo lo que hace
que una animación parezca barata. La referencia usa `0.045`–`0.125`.

### Cuando animar ES la funcionalidad, `reduce` no puede desactivarlo

La regla del proyecto es que con `prefers-reduced-motion: reduce` el contenido se ve
en su **estado final** y no se anima. El carrusel de la fase 6 es la primera
excepción, y el motivo es una distinción que conviene tener clara:

| El movimiento es… | Con `reduce` |
|---|---|
| decoración (un reveal, un pin) | no se crea nada; estado final y listo |
| **la forma de llegar al contenido** | se crea igual, sin inercia y con saltos secos |

Si el `Draggable` se creara solo en la rama `MOTION_OK`, con `reduce` el carrusel
quedaría inerte y **tres de las cinco salsas serían inalcanzables**. Así que se crea
en las dos ramas y lo que cambia es `inertia` y si los saltos llevan tween.

La pregunta para decidirlo no es «¿esto se mueve?» sino **«¿se puede llegar al
contenido sin esto?»**.

### Un carril movido por `transform` no es un contenedor de scroll

El fallo de accesibilidad que tiene casi todo carrusel hecho con GSAP, y que no se
ve hasta que se prueba con el teclado.

`Draggable` desplaza el carril con `translateX`. No hay scroll nativo, y por tanto
**el navegador no puede traer a la vista un elemento enfocado**: en un contenedor con
scroll real, tabular a algo fuera de vista lo desplaza solo; aquí el foco se va a una
tarjeta que está fuera de la pantalla y no ocurre nada. Quien navega con teclado
pierde el foco de vista por completo.

Hay que hacerlo a mano: cada tarjeta avisa al recibir el foco y el carrusel se
desplaza hasta ella.

```html
<li tabindex="0" (focus)="onCardFocus(i)"> … </li>
```

Y por lo mismo, la ventana que recorta lleva `tabindex="0"` con `role="region"`: una
zona desplazable que no se puede enfocar no se puede recorrer con el teclado.

**No se mezcla con `overflow-x: auto`.** Serían dos mecanismos de desplazamiento
compitiendo por el mismo gesto — el defecto que el proyecto se negó a copiar de la
referencia con sus dos motores de smooth scroll.

### El callback de `mm.add()` puede devolver su limpieza

Verificado en el código de GSAP, no en la documentación: `Context.add` hace
`_isFunction(result) && self._r.push(result)`, y `_r` son las *returned/cleanup
functions* que se ejecutan en `revert()`.

Sirve para lo que GSAP **no** puede rastrear por su cuenta — un `addEventListener`
propio, por ejemplo el `resize` que el carrusel necesita para volver a medirse:

```ts
mm.add(MOTION_OK, () => {
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
});
```

Lo que sí rastrea solo: **`Draggable` se registra en el contexto activo al
construirse** (`_context(this)` en `Draggable.js`, línea 2623), igual que los
`ScrollTrigger`. Así que `mm.revert()` ya lo mata y llamar a `kill()` además sería la
misma capa redundante que se evitó al elegir `matchMedia` sobre `gsap.context()`.

### Draggable: tres cosas que fallan en silencio

1. **`inertia: true` sin `InertiaPlugin` registrado se ignora**, sin error ni aviso.
   El carrusel arrastra, frena en seco al soltar, y nada delata que falta un plugin.
2. **`onThrowUpdate` y `onThrowComplete` solo existen con inercia.** Con
   `inertia: false` el `snap` recoloca el carril y, si la sincronización del estado
   vive solo en esos callbacks, el contador se queda marcando la tarjeta anterior. La
   que vale para los dos modos es **`onDragEnd` leyendo `drag.endX`** — que además,
   con inercia, es el destino ya ajustado por el `snap`, así que el contador se
   adelanta en vez de perseguir al carril.
3. **`allowNativeTouchScrolling` vale `true` por defecto con `type: 'x'`**, y hay que
   dejarlo así: es lo que permite que un dedo moviéndose en vertical haga scroll de la
   página en vez de quedar atrapado. Un carrusel que secuestra el scroll vertical es
   el defecto más molesto del patrón en móvil.

### El número de tarjetas no es el número de posiciones

El error de diseño más fácil de cometer en un carrusel, y no se ve si solo se
prueba en una pantalla estrecha.

Con cinco tarjetas, lo evidente es dejar que el índice vaya de 0 a 4. Está mal en
cuanto caben varias a la vez: **el carril llega a su tope antes de agotar los
índices**. Medido en Chrome a 1536 px — ventana de 1024, carril de 1728, paso de
352: el tope está en −704, o sea DOS pasos. Pulsar «siguiente» una tercera y una
cuarta vez subía el contador a «4 / 5» y «5 / 5» **sin mover nada**, y al volver
había otras dos pulsaciones muertas.

Lo que manda es cuántos pasos caben en el recorrido:

```ts
maxIndex = Math.ceil(-minX / step);              // 2 aquí; 4 en móvil
perView  = Math.round(viewportWidth / step);     // 3 aquí; 1 en móvil
```

Y el contador entonces no puede ser «3 / 5», que con el botón ya deshabilitado
parece que faltan dos salsas por ver cuando están las dos en pantalla. Va un
**rango**: «1–3 de 5», «3–5 de 5». Cuando solo cabe una tarjeta, el rango sobra.

### Medir el paso del DOM, no duplicar los números de Tailwind

El desplazamiento de una tarjeta a la siguiente depende de su ancho y del hueco, que
son utilidades (`w-[78vw] sm:w-80`, `gap-5 sm:gap-8`) y cambian con el breakpoint.
Escribir esos números en el TypeScript los deja desincronizados en cuanto alguien
retoca el espaciado, **y sin ningún error que lo delate**.

```ts
this.step = cards[1].offsetLeft - cards[0].offsetLeft;
```

Hay que remedir al redimensionar, porque el ancho va en `vw`.

### Un signal descarta el valor repetido, así que `set()` por frame es seguro

El índice del carrusel se actualiza desde `onDrag`, es decir, en cada frame del
arrastre. No hace falta protegerlo con un `if`: un signal compara con lo que ya tiene
y no notifica si es igual, así que Angular se entera cuando cambia el **número de
tarjeta**, no sesenta veces por segundo.

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

   **Confirmado con números en la fase 5**, donde el placeholder del CTA se
   escribió como `placeholder:text-ink/60`: da **4,32:1**, por debajo de AA. El
   script no lo habría cazado jamás, porque el par que conoce es «ink sobre
   bone» y ese pasa con 14,47. Por eso existe ahora **`--color-ink-soft`**
   (#595754, el mismo gris al 70 % en sólido, 5,94:1) y está en los pares
   canónicos del script. Texto atenuado = token propio, nunca una barra.

   **Única excepción, y es de la norma, no del proyecto:** un control
   **deshabilitado** puede bajar de 4,5:1. WCAG excluye explícitamente los
   componentes de interfaz inactivos del requisito (SC 1.4.3), y ahí lo que hace
   falta es justo lo contrario de destacar. Los botones del carrusel en sus topes
   usan `disabled:text-ink-soft disabled:border-ink-soft` sobre `heat-5`. Vale
   solo con el atributo `disabled` de verdad puesto — no para algo que *parezca*
   inactivo.
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

### Un fondo animado tiene una zona muerta de contraste

Verificar los cinco pares canónicos **no dice nada de lo que se ve entre uno y
otro**. Durante la animación el fondo no es ninguno de los cinco colores: es una
interpolación, y el navegador pinta cientos de tonos que nadie comprobó.

`scripts/contraste.py` los recorre ahora (`analizar_rampa`, interpolando en sRGB
canal a canal, que es como interpola GSAP) y encuentra esto:

| Umbral | Resultado sobre la rampa |
|---|---|
| **3,0** — titular y elementos gráficos | ventana segura 55 %–75 %; cruzar al **65 %** |
| **4,5** — texto de cuerpo | **zona muerta 57,5 %–72,5 %**: ni `ink` ni `bone` llegan |

En el tramo naranja→rojo **ningún** color de texto cumple AA. La salida no fue
cambiar la paleta sino **que ahí no haya nada que leer**: el texto aparece con el
fondo ya asentado en un color canónico y se desvanece antes del cruce siguiente.
Lo que sí está visible todo el rato (medidor, eyebrow) es gráfico o grande, umbral
3,0, y a ese umbral no hay ningún punto sin color válido.

Es decir: **el «entra y sale» del texto no es una floritura, es la condición que
hace accesible un fondo que transiciona.** Aplica a cualquier sección futura que
anime el color de fondo bajo texto.

**Y el cruce es un salto, no una interpolación.** Pasar de `ink` a `bone` de forma
continua atraviesa grises de contraste pésimo sobre el naranja. Va con `tl.set()`
en una posición, que con `scrub` es reversible y vuelve solo al subir.

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
   │     products/                carrusel arrastrable; bottle/ es su ilustración
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

**Un pin posicionado por JavaScript tiembla, y el contenido quieto lo delata.**

Síntoma en la escala, en Chrome y no en Firefox: primero una franja del fondo hueso
de la sección siguiente asomando por el borde inferior al bajar; luego, tapada esa
franja, el texto «rebotando» — saltando unos píxeles y volviendo.

Eran **el mismo problema**. `pinType: 'transform'` y `anticipatePin` posicionan la
sección desde JS: el primero con un translateY que GSAP recalcula en cada evento de
scroll, el segundo adelantando el pin según la velocidad. Chrome compone el scroll
de forma asíncrona, así que durante un frame la sección está donde la dejó el
compositor y no donde el JS la quiere. Eso se ve como franja si detrás hay otro
color, y como temblor si hay texto.

**La solución es `pinType: 'fixed'` y quitar `anticipatePin`**: ancla el navegador
y no queda ningún valor que el JS pueda tener desactualizado. Cuesta un recálculo
de layout al entrar y otro al salir — dos en todo el recorrido, no uno por frame.

**Por qué el hero parecía no sufrirlo:** su contenido se mueve con el scroll
(`yPercent`), y el temblor continuo queda enmascarado dentro de ese movimiento. En la
escala el texto está quieto durante el reposo de cada nivel, así que cualquier
oscilación se ve desnuda. **Un pin con contenido quieto es un detector de temblor;
uno con contenido en movimiento lo esconde.**

> ⚠️ **Corregido en la fase 7: esa frase era cierta a medias y llevó a mantener el
> hero con `transform` + `anticipatePin: 1` tres fases de más.**
>
> El enmascaramiento vale para el temblor **continuo** del recorrido, no para el
> **salto del instante en que el pin se activa**. El hero arranca en `top top`, así
> que ese instante es el primer movimiento de rueda — y ahí no hay movimiento previo
> que esconda nada. En Firefox se veía como un brinco al empezar, y después todo
> bien.
>
> **Las dos secciones pineadas usan ahora `pinType: 'fixed'` y ninguna lleva
> `anticipatePin`.** No hay un «ajuste para contenido en movimiento» y otro para
> contenido quieto: hay uno que posiciona desde JavaScript y otro que ancla el
> navegador, y el segundo gana en los dos casos.
>
> El motivo por el que el hero llevaba `transform` —evitar el recálculo de layout al
> soltar el pin, que daba un tirón al entrar en Origen— sigue siendo real. Lo que
> estaba mal era el precio: se pagaba un salto al principio para ahorrar uno al
> final, y el del principio lo ve todo el mundo. Verificado comparando las cuatro
> combinaciones en Firefox, mirando también la salida.

El camino hasta aquí, porque los dos desvíos son instructivos:

| Intento | Resultado |
|---|---|
| `h-[calc(100vh+12px)]` para que la sección sobresalga | Insuficiente: el desfase es del tamaño del salto de la rueda, no de dos píxeles. Revertido. |
| Teñir el host del color de la sección | Tapó la franja pero **no la causa** — el temblor seguía, solo que ya no se veía en el fondo. Se mantiene igualmente: es barato y protege de cualquier costura residual. |

El tinte del host se queda, entonces, como cinturón además de los tirantes:

```ts
host: { class: 'block bg-heat-1 motion-reduce:bg-transparent' }
tl.to([section, this.hostEl.nativeElement], { backgroundColor: ... }, pos);
```

`block` es necesario: un elemento a medida es `inline` por defecto y no tendría caja
que pintar. Y tiene que animarse **con** la sección: si se quedara en su color
inicial, enseñaría verde en mitad de la escala, igual de malo que el hueso.

**Lección de método:** este bug no se puede medir desde JS. `getBoundingClientRect`
lee *después* de que GSAP corrija, así que devuelve la posición perfecta mientras el
usuario ve el temblor. Dio rango 0,00 px en el mismo scroll en que el síntoma era
evidente. Lo que lo resolvió fue **preguntar si el texto se movía de sitio o
parpadeaba** — dos causas opuestas, dos arreglos opuestos. Es la misma lección que
la tabla de latencia contra frames perdidos: la descripción cualitativa gana a la
medición cuando el instrumento no alcanza.

**El titular del hero va a `48vw`, y el número importa.** Con `28vw` la palabra
cabía entera y el efecto de la referencia —el titular cortado por los lados— no
se producía en **ningún** tamaño de pantalla: al escalar con `vw`, la proporción
texto/viewport es constante, así que agrandar la ventana nunca lo arregla. Medido:
`42vw` daba 1467 px en un viewport de 1521 (aún sin cortar); `48vw` da 1677 px, con
78 px de desborde por lado. El `overflow-hidden` del `<section>` es lo que hace que
eso no genere scroll horizontal — sin él, el hero rompe la página entera.

**Los cinco ajíes son variedades, no especies, y el quinto declara que no es
nativo.** Se valoró montar la escala sobre las cinco especies domesticadas de
*Capsicum* —todas cultivadas en Ecuador, dato real y poco conocido—, pero
*C. annuum* es la más suave de las cinco y rompía el orden ascendente justo en el
nivel 5. Van entonces cinco variedades por picor: ají dulce, ají criollo, ají
ratón, rocoto y habanero.

Dos consecuencias de la regla de copy verificable:
- **Los SHU por variedad ecuatoriana concreta apenas están documentados.** Las
  fuentes dan el picor por especie, y solo del rocoto hay cifra fiable
  (50 000–250 000 SHU). Se usan rangos amplios y citables en vez de inventar una
  cifra exacta que sonaría más precisa y sería falsa.
- **El habanero dice en su propia ficha que no es nativo del Ecuador**, porque no
  lo es: se cultiva en la costa pero viene del Caribe. Omitirlo habría sido más
  cómodo y menos cierto.
- El **neapia** amazónico quedó fuera aunque encajaba con el nivel negro: no es
  una variedad de ají sino una salsa de yuca fermentada de los Siekopai, y
  colarla en una escala Scoville habría sido un dato mal puesto.

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

## Despliegue y cabeceras

El sitio es **estático**: `ng build` sin `outputMode`, salida en
`dist/bravo-landing/browser`, que es justo lo que espera el preset de Angular en
Vercel. No hay SSR, ni backend, ni variables de entorno.

**Lo que se publica son cinco archivos** —`index.html`, el JS, el CSS, el favicon y
la textura—: el `CLAUDE.md`, la auditoría, los scripts y el sistema de diseño se
quedan en el repositorio. Verificado además que el build **no emite source maps** y
que los comentarios largos del código **no sobreviven al minificado**, así que todo
el razonamiento documentado aquí no viaja al navegador de nadie.

`vercel.json` lleva las cabeceras de seguridad. JSON no admite comentarios, así que
el porqué de cada directiva va aquí:

| Directiva | Por qué ese valor |
|---|---|
| `script-src 'self'` | el build **no genera ningún script inline**; comprobado antes de escribir la política |
| `style-src` con `'unsafe-inline'` | Angular inyecta los estilos de componente como `<style>` en el `head`. No es evitable sin nonces, y con un sitio estático no hay quien los genere |
| `font-src … fonts.gstatic.com` | las tipografías vienen de Google Fonts; sin esto el titular cae al respaldo |
| `img-src 'self' data:` | el grano del papel es un SVG en `data:` URI dentro del CSS |
| `frame-ancestors 'none'` + `X-Frame-Options: DENY` | impide que la página se embeba en un iframe ajeno. Los dos, porque navegadores viejos ignoran el primero |
| `form-action 'self'` | el formulario no envía a ninguna parte, pero si algún día lo hiciera, que no sea a un tercero |

**Si se añade una fuente externa, una imagen remota o una llamada a una API, hay que
tocar esta política o fallará en silencio** — el navegador bloquea y lo dice solo en
consola. Es el precio de tener CSP, y es un precio que vale la pena.

### El CSS crítico de Angular es incompatible con esta CSP

**La página salió en producción sin ningún estilo de Tailwind**, y el diagnóstico
costó porque todas las comprobaciones de red daban bien: el CSS respondía 200, con
`Content-Type: text/css`, 23 553 bytes, y el navegador lo tenía parseado con sus 198
utilidades dentro de `@layer utilities`. Simplemente no las aplicaba.

La causa estaba en una sola palabra del HTML:

```html
<!-- lo que genera Angular con inlineCritical (por defecto) -->
<link rel="stylesheet" href="styles-….css" media="print" onload="this.media='all'">
```

Es la optimización de **CSS crítico**: Angular inyecta el CSS del primer pantallazo
en un `<style>` y carga el resto con `media="print"` para que no bloquee el render,
devolviéndolo a `all` desde un `onload`. **Ese `onload` es un manejador inline, y
`script-src 'self'` lo bloquea.** El CSS se queda en «solo para imprimir» para
siempre, y el `<link>` de respaldo del `<noscript>` tampoco entra, porque JavaScript
sí está activo.

Se arregla **desactivando la optimización, no relajando la política**:

```jsonc
// angular.json → configurations.production
"optimization": { "styles": { "minify": true, "inlineCritical": false } }
```

El coste es que la hoja vuelve a bloquear el render. Son **4,80 kB** transferidos:
irrelevante, y a cambio desaparece el destello de contenido sin estilo. La
alternativa —añadir `'unsafe-inline'` a `script-src`— habría permitido *cualquier*
manejador inline de toda la página para salvar uno.

**La lección de método:** el síntoma era visual y todas las métricas de red decían
que estaba bien. Lo que lo resolvió fue mirar `document.styleSheets` y leer el
`media` de la hoja — tres pasos después de empezar a buscar en el sitio equivocado.
Cuando un recurso carga pero no surte efecto, **el problema no está en si llegó sino
en cómo se declaró**.

**Lo que NO se hizo, y es decisión tomada:** auto-hospedar las tipografías. Las sigue
sirviendo Google, así que el navegador de cada visitante le revela su IP. No
compromete al proyecto; es privacidad de quien visita. Si algún día importa —por
ejemplo con tráfico europeo— la salida es descargar los `woff2` y servirlos desde
`public/`, a cambio de ~100 kB en el repositorio y perder el CDN.

## Reglas transversales de verificación

**Verificar que el servidor se recuperó no es lo mismo que verificar que `ng build`
compila.** En `altura-landing` tres síntomas simultáneos —sin scroll, modo oscuro
roto, nav muerto— resultaron ser `ng serve` caído sirviendo un build anterior. Se
encontró revisando el log del proceso en segundo plano, no lanzando otro build.

**La pestaña automatizada congela las animaciones por tiempo.** Al verificar con
el navegador controlado, `document.visibilityState` es `"hidden"` y el navegador
**pausa `requestAnimationFrame` del todo** — medido: 0 frames en 600 ms. La
consecuencia práctica divide las animaciones en dos grupos:

| Tipo | ¿Se puede verificar ahí? | Por qué |
|---|---|---|
| `scrub` | **Sí** | las actualiza el evento de scroll |
| por tiempo (`duration`, `stagger`) | **No** | necesitan el ticker de `rAF`, que está parado |
| **arrastre con `Draggable`** | **No** | aplica su `transform` por el mismo ticker |

Un stagger se queda congelado a mitad y parece un bug del código cuando no lo
es. Pasó en la fase 5 con Origen, el proceso y el CTA, con los mismos valores de
opacidad leídos con 1,2 s de diferencia. **Antes de diagnosticar un reveal
«roto», comprobar si `rAF` corre.** Lo que sí se puede verificar siempre es el
estado final y la lógica: validaciones, clases generadas, enlaces, contraste.

**Tres precisiones que costaron una ronda entera en la fase 6**, porque la regla
de arriba parece más simple de lo que es:

1. **El estado de `rAF` cambia durante la sesión, así que hay que comprobarlo
   junto a cada medición, no una vez al principio.** Al abrir la pestaña dio
   `visible` y 36 frames en 600 ms; un rato después, `hidden` con `hasFocus()`
   en `true` — una combinación que no parece posible y lo es. **Cada acción real
   del `computer` (un clic, un scroll, una tecla) despierta el ticker un
   instante**, y eso explica por qué una medición funciona y la siguiente no.
2. **Un `Draggable` que no se mueve no significa que esté roto.** Se verificó
   que estaba bien montado por sus huellas en el elemento —`cursor: grab`,
   `user-select: none` y `touch-action: pan-y`— y no por verlo arrastrar. Esas
   huellas son síncronas; el movimiento no.
3. **`.focus()` no dispara el evento `focus` si el documento no tiene el foco.**
   Una batería de pruebas de foco programáticas dio cinco falsos negativos
   seguidos. Lo que sí vale es **tabular de verdad** con el `computer`.

De ahí la táctica que sí funcionó: **verificar la lógica por la ruta síncrona.**
`goTo(i, false)` usa `gsap.set` en vez de `gsap.to`, así que se aplica en el
acto y permite comprobar toda la aritmética —topes, redondeo, acotado— sin
depender del ticker. Y de paso es exactamente la ruta que recorre `reduce`.

### Un elemento posicionado en absoluto no reserva su sitio

Obvio dicho así, y aun así se escapó hasta que se vio en un iPhone real: el
medidor de la escala va en `absolute`, así que **el contenido no sabe que está
ahí**. En pantallas anchas sobra espacio y no se nota; a 390 px, la segunda
columna del `dl` («Dónde crece / Sierra alta») se metía justo debajo de la vara.

La regla que queda: **cuando algo flota sobre el contenido, el contenido
necesita un padding que reserve esa banda, y ese padding se calcula desde las
medidas del elemento flotante**, no a ojo. Aquí: `right-5` (20 px) + marcas
`w-4` (16) + `gap-3` (12) + barra `w-2.5` (10) = 58 px, y `pr-20` (80 px) los
cubre con aire. Está escrito en `heat-scale.html` junto a la clase, para que
quien toque el medidor vea que hay un número que va con él.

Verificado con carga limpia a 320 / 360 / 390 / 430 px: 0 choques, 0 texto
recortado y 0 scroll horizontal en los cinco niveles.

### El banco de pruebas en iframe miente al redimensionarlo en caliente

El iframe de ancho controlado sigue siendo la forma de probar anchos de móvil
—`resize_window` nunca ha cambiado el viewport en este proyecto—, pero hay que
**recargar el `src` después de cambiar el tamaño**, no solo cambiarlo.

Medido: redimensionando en caliente, los `pin-spacer` conservaban el ancho
anterior y daban un falso positivo de scroll horizontal a 320 y 360 px. Con
carga limpia al ancho final, cero desborde. Y ojo con `innerWidth`, que incluye
la barra de scroll del iframe: lo que hay que comparar es
`documentElement.scrollWidth` contra `clientWidth`.

**Para comprobar un `ScrollTrigger`, usar scroll real, no `window.scrollTo`.** Un
salto programático justo después de montar el componente da un falso negativo: la
animación parece no dispararse porque los triggers recién creados todavía no han
asentado sus posiciones. Pasó en la fase 2 y costó un rato de diagnóstico creyendo
que el patrón estaba roto. Si hace falta scroll programático, hay que dejar pasar
tiempo o forzar `ScrollTrigger.refresh()`.

## Un fallo de iOS que no se ha podido reproducir (2026-10-05)

Queda abierto. Está aquí para que, si reaparece, se arranque desde lo ya
descartado y no desde cero.

**El síntoma, tal y como se vio** en un iPhone con iOS 18.7.7 / Safari, en la
URL de producción, en lo que era la **primera visita de ese dispositivo**: la
escala de picante se quedaba clavada, el fondo no salía del verde del nivel 1 y
**los cinco bloques de texto se veían superpuestos a la vez**. El hero y el
carrusel funcionaban con normalidad en la misma sesión. En escritorio, perfecto.

**Lo descartado, por medición y no por cansancio:**

| Hipótesis | Qué la descarta |
|---|---|
| El ancho de pantalla | Reproducido a 390×844: los cinco niveles se turnan y el fondo transiciona, en ambos sentidos |
| `prefers-reduced-motion` | `reduce:no` en el dispositivo; y con `reduce` el pin del hero ni se crearía, y sí funcionaba |
| El layout de `reduce` (nunca verificado hasta aquí) | Desenvueltas sus 22 reglas: apila bien los cinco niveles en vertical |
| CSS que Safari no entienda | El bundle exige Safari ≥ 16.4 y el dispositivo va por 18.7 — ver abajo |
| GSAP caído | Hero pineado y carrusel arrastrable en el mismo iPhone |
| `pinType: 'fixed'` roto en iOS | `sec pos:fixed` + `trig act:SI` en las tres capturas del dispositivo |
| Cascada de `refresh()` por la barra de Safari | 7 `resize` → 2 `refresh`. La altura osciló 82 px (`vh663/745`) sin provocar recálculos en cadena |
| Restauración de scroll de Safari al recargar | Recargando a media página devuelve a `scrollY:0`; no restaura |
| Un despliegue antiguo | El que se vio es el último de producción, commit `fe1f65f` |

**Dónde NO se reproduce:** Chrome de escritorio, iframe a 390 px, iOS Safari
contra el dev server, y iOS Safari contra el **build de producción con la CSP
real, caché vacía y pestaña privada**, bajando deprisa. Cuatro entornos.

**Por qué no se añadieron «defensas por si acaso».** Lo evidente sería poner
`ScrollTrigger.config({ ignoreMobileResize: true })` y dejar de forzar
`pinType: 'fixed'` en táctil. No se hizo porque la medición dice que ninguna de
las dos cosas está fallando, y el proyecto ya tomó esta decisión una vez: ver el
bloque de `normalizeScroll` en `gsap-setup.ts`, desactivado con el argumento de
que mantener una API para compensar un problema que quizá ya no existe es
acumular complejidad sin comprobar que hace falta.

**La hipótesis que sigue viva** es una condición de carrera de la primera carga:
el `ScrollTrigger.refresh()` colgado de `document.fonts.ready` cayendo justo
mientras la escala ya está pineada. Un refresh con un pin activo lo revierte,
remide y lo reaplica. No se ha logrado provocar.

### El instrumento, que es lo más reutilizable de todo esto

Cuando el fallo solo ocurre en un dispositivo al que no se llega con
herramientas, la salida es **llevar el instrumento al dispositivo**:

1. **Servir el build de producción en la red local**, no el dev server. Se
   diferencian en tres cosas que importan: minificado, CSS que bloquea el
   render y la CSP. Un servidor estático de Node sin dependencias, con las
   cabeceras copiadas de `vercel.json` y `Cache-Control: no-store` para que
   cada carga sea una primera visita.
2. **Un panel fijo en pantalla** que se lea en una captura: viewport, `reduce`,
   nº de triggers y spacers, `position` y `backgroundColor` de la sección,
   `isActive`/`progress`/`start`/`end` del trigger, y las opacidades calculadas
   e inline de los cinco niveles.
3. **Contadores que NO se reinicien.** Es la pieza clave: un fallo que dura
   medio segundo y se corrige solo no sale en ninguna captura del estado
   actual. Los dos que se usaron: cuántas veces el scroll estuvo dentro de
   `[start, end]` con el trigger inactivo, y cuántos niveles llegaron a verse a
   la vez (dos o más es imposible salvo fallo, porque los fades de entrada y
   salida no se solapan por construcción).

El panel escribe con `textContent` y no con un signal: un signal a 5 Hz
dispararía detección de cambios durante el scroll, que es justo el momento que
se está midiendo. **El instrumento no debe alterar lo que observa.**

Para que un iPhone alcance el servidor hacen falta dos cosas en Windows, y la
segunda es la que no es obvia: una regla que permita el puerto, **y comprobar
que no haya una regla de bloqueo para Node**, porque en el firewall de Windows
las reglas de bloqueo ganan siempre a las de permitir. Había dos, creadas solas
al cerrar el diálogo de permiso en su día, y anulaban la regla nueva.

### Tailwind v4 exige Safari ≥ 16.4

No fue la causa de nada aquí, pero conviene tenerlo escrito: el CSS que genera
no es transpilable a navegadores viejos. Contado en el bundle: **28 `@property`,
17 `color-mix()`, 2 media queries de rango (`@media(width>=40rem)`) y
`opacity: 0%`** — todo ello Safari 16.4+ salvo `color-mix()`, que es 16.2.

Y el detalle que más engaña: `.opacity-0` compila a `opacity: 0%`, **con
porcentaje**. En un Safari anterior la declaración es inválida y se descarta
entera, así que el elemento se queda a opacidad 1. En casi todo el proyecto eso
sería inocuo —`opacity-0` es el estado inicial de los reveals, y el contenido
simplemente aparecería sin animarse—, pero **en la escala sería catastrófico**:
ahí `opacity-0` no decora, es lo que apila cinco bloques en el mismo sitio y
deja ver uno.

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
- [x] **Fase 4** — escala de picante: una sola timeline con los cinco grados
      colocados por posición, fondo interpolado, medidor con `scaleY` y el texto
      entrando y saliendo por obligación de contraste (ver arriba).

      Verificado en Chrome: los cinco estados en orden con su color canónico
      exacto y su color de texto emparejado; pin cubriendo el viewport; **sin
      scroll horizontal a 372 px** y los titulares cabiendo; las **18 utilidades
      `motion-reduce:` generadas** por Tailwind; **59 FPS de mediana** (p90 17 ms,
      2 frames largos), el mismo perfil que la fase 3 pese a las cinco máscaras;
      y **84,92 kB** de transferencia, +1,02 kB sobre la fase 3.

      Verificado además por Pablo en navegador real: **Firefox** limpio desde el
      principio, y **Chrome** tras tres intentos — la franja blanca del borde y
      el «rebote» del texto eran el mismo pin posicionado por JS (ver arriba).

      Pendiente de comprobar: `reduce` emulado de verdad y móvil real.
- [x] **Fase 5** — origen, proceso, CTA y pie, más las curvas orgánicas entre
      secciones. Entra `DrawSVGPlugin` (la línea del proceso) y Signal Forms.
      Cae la página temporal de verificación de la fase 1: ya hay secciones
      reales de sobra para dar recorrido a los `pin`.

      Verificado: los cuatro estados del formulario (vacío, error con sus dos
      mensajes, carga con el botón deshabilitado, éxito con `role="status"`);
      los 4 enlaces del pie apuntando a `id` que existen y **cero `href="#"`**;
      sin scroll horizontal; contraste en verde incluido el token nuevo
      `ink-soft`; **106,18 kB**.

      Pendiente de comprobar fuera de este entorno, porque la pestaña
      automatizada congela las animaciones por tiempo (ver arriba): los reveals
      con stagger de Origen, proceso y CTA. Y `reduce` y móvil real, que siguen
      pendientes desde la fase 4.
- [~] **Fase 6** — carrusel de las cinco salsas con `Draggable` + `InertiaPlugin`,
      entre la escala y el proceso. Sin `pin`: ya hay dos secciones pineadas y una
      tercera secuestrando el scroll sería agotador.

      La sección arranca en `bg-heat-5`, el mismo negro en el que termina la
      escala, así que la costura no se ve; las tarjetas invierten a `bone`
      porque la botella del habanero es negra y sobre fondo negro desaparecía.

      Verificado sin navegador: **121,30 kB** (+15,21 sobre la fase 5, desglosado
      en la tabla de pesos); `ng build` limpio; la paleta en verde con el par
      `bone` sobre `heat-5` (15,39:1) y `ink-soft` sobre `bone` (5,94:1); las
      utilidades nuevas generadas por Tailwind —incluidas `w-[78vw]`,
      `focus:ring-brand` y las tres `disabled:*`— y **21 variantes
      `motion-reduce:`** frente a 18 en la fase 4; los 5 enlaces del pie
      apuntando a `id` existentes, con `#salsas` ya incluido, y cero `href="#"`.

      Verificado después **en Chrome**, con la extensión ya conectada:

      - El **teclado entero**: flechas 0→1→2 con tope, `Inicio` y `Fin`,
        `preventDefault` sobre las flechas para que no hagan scroll de página, y
        las demás teclas sin interceptar.
      - **El desplazamiento por foco**, que es el arreglo de accesibilidad de
        esta fase: seis tabulaciones reales desde el botón «siguiente» llevan el
        foco a «5 de 5: Habanera» y el carrusel pasa solo al índice 2.
      - **`Draggable` montado y bien configurado**, comprobado por sus huellas en
        el elemento: `cursor: grab`, `user-select: none` y **`touch-action: pan-y`**
        — esta última es la prueba de que el gesto vertical del dedo sigue
        haciendo scroll de la página.
      - **La aritmética completa** por la ruta síncrona `goTo(i, false)`, que es
        además la de `reduce`: topes, acotado y vuelta al inicio.
      - Sin errores en consola. (Hay un *warning* de `DrawSVGPlugin` sobre medir
        un `path` con `non-scaling-stroke`, pero es de la línea del proceso y
        viene de la fase 5.)

      **Y ahí apareció el defecto de diseño del índice** descrito arriba, que no
      se habría visto nunca en una pantalla estrecha.

      **Pendiente de verificar en navegador real:** el arrastre y la inercia
      —`Draggable` aplica su transform por el ticker de GSAP, que está pausado en
      la pestaña automatizada—, el responsive (`resize_window` no llegó a
      cambiar el viewport) y la costura con la escala. Más `reduce` emulado y
      móvil real, que siguen pendientes desde la fase 4.

- [x] **Fase 7** — pulido y auditoría.

      Medido: **121,55 kB** de 130; contraste en verde; **0 scroll horizontal y
      0 desbordes** reales a 375 / 768 / 1024 / 1440 (banco de pruebas en iframe
      de ancho controlado, porque `resize_window` no cambiaba el viewport); y
      **7 `ScrollTrigger` y 2 `pin-spacer` constantes** antes de recorrer la
      página, después, al volver y tras un `refresh()` — sin fugas.

      Del checklist `quick-reference.md` salieron tres defectos reales, los tres
      corregidos: los botones tenían **`cursor: default`** (el preflight de
      Tailwind v4 lo pone así, al revés que v3), los cinco enlaces del pie
      median **23 px de alto** —por debajo del mínimo táctil de 44— y ahora
      miden 52 con 8 px de separación. Lo rechazado del checklist está en la
      tabla de overrides de `design-system/bravo/MASTER.md`, con su motivo.

      Auditoría Rams en `DESIGN-IS-2026-10-02/`: **24/30, veredicto REFINE**,
      sin ningún principio por debajo de 2. Los cuatro treses caen en estético,
      comprensible, honesto y minucioso. El traspaso a `/make-plan` está escrito
      en `04-handoff-prompt.md`.

      **Lo que la auditoría encontró y conviene no perder:** el carrusel y la
      escala cuentan el mismo contenido —misma variedad, mismo rango SHU, misma
      especie en los cinco— y no hay ninguna vía rápida al formulario en un
      documento de 10 008 px. Tres de las seis notas de 2 chocan con decisiones
      deliberadas del proyecto (el pin largo, los 18,87 kB de Signal Forms, el
      scroll cinematográfico como marcador de época); están anotadas como tales
      y la decisión de actuar sobre ellas es de Pablo.

Plan por fases completo en `~/.claude/plans/bravo-landing-fases.md`.
