import { Component, ElementRef, computed, signal, viewChild } from '@angular/core';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';

import { MOTION_OK, MOTION_REDUCED, createMotionScope } from '../../animations/motion-scope';
import { Bottle } from '../bottle/bottle';

/** Una salsa de la gama. Una por grado de la escala. */
interface Product {
  /** Nombre de la salsa. Es el de la variedad: la marca no adorna. */
  readonly name: string;
  /** Texto de la etiqueta de la botella. Caben unos 10 caracteres. */
  readonly label: string;
  /** Variedad de ají con la que se hace. */
  readonly pepper: string;
  readonly species: string;
  readonly scoville: string;
  /** Una línea verificable, sin superlativos. Regla del proyecto. */
  readonly note: string;

  /**
   * Color del contenido de la botella.
   *
   * Aquí SÍ va `var(--token)` escrito tal cual, al contrario que en la escala
   * de picante. La diferencia es quién lo consume: esto termina en un atributo
   * CSS (`--bottle-fill`), que el navegador resuelve sin problema. Lo que no
   * sabe resolver `var()` es un TWEEN de GSAP, porque interpola números y ahí
   * recibiría una cadena.
   */
  readonly fill: string;
}

/** Duración del desplazamiento al usar los botones o el teclado. */
const SLIDE = 0.5;

/**
 * Carrusel de las cinco salsas, arrastrable con `Draggable` + `InertiaPlugin`.
 *
 * Va sin `pin`: ya hay dos secciones pineadas (hero y escala) y una tercera
 * secuestrando el scroll sería agotador. Aquí el scroll de la página sigue
 * siendo vertical y el carrusel se mueve en horizontal por su cuenta.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ EL `Draggable` SE CREA EN LAS DOS RAMAS DE `matchMedia`
 * ---------------------------------------------------------------------------
 * En las demás secciones del proyecto, `MOTION_REDUCED` significa «deja el
 * contenido en su estado final y no animes». Aquí no vale: el arrastre no es
 * decoración, es **la forma de llegar al contenido**. Si el `Draggable` se
 * creara solo en `MOTION_OK`, con `prefers-reduced-motion: reduce` el carrusel
 * quedaría muerto y tres de las cinco salsas serían inalcanzables.
 *
 * Así que se crea en ambas y lo que cambia es el movimiento: con `reduce` no
 * hay inercia y los saltos son instantáneos. Es la distinción entre animación y
 * funcionalidad, y es la primera vez que aparece en este proyecto.
 *
 * ---------------------------------------------------------------------------
 * EL PROBLEMA DE ACCESIBILIDAD QUE TIENE TODO CARRUSEL CON `transform`
 * ---------------------------------------------------------------------------
 * `Draggable` mueve el carril con `transform: translateX`. No hay scroll
 * nativo, y eso tiene una consecuencia que no se ve hasta que se prueba con el
 * teclado: **el navegador no puede traer a la vista una tarjeta enfocada**.
 * Con un contenedor de scroll real, tabular a un elemento fuera de vista lo
 * desplaza solo; con un `transform`, el foco se va a una tarjeta que está
 * fuera de la pantalla y no pasa nada. El usuario pierde el foco de vista.
 *
 * Se resuelve a mano: cada tarjeta avisa al recibir el foco (`onCardFocus`) y
 * el carrusel se desplaza hasta ella.
 */
@Component({
  selector: 'app-products',
  templateUrl: './products.html',
  imports: [Bottle],
})
export class Products {
  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  /** La ventana que recorta. Es también el `bounds` del Draggable. */
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  /** El carril que se arrastra. */
  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');

  /** Primera tarjeta a la vista. */
  protected readonly index = signal(0);

  /**
   * Último índice que produce movimiento, y cuántas tarjetas se ven a la vez.
   *
   * ---------------------------------------------------------------------------
   * POR QUÉ EL ÍNDICE NO LLEGA HASTA LA ÚLTIMA TARJETA
   * ---------------------------------------------------------------------------
   * La versión inicial tenía cinco tarjetas y dejaba que el índice fuera de 0 a
   * 4. Es la cuenta evidente y está mal, porque **el número de tarjetas no es el
   * número de posiciones**: en cuanto caben varias a la vez, el carril llega a
   * su tope antes de agotar los índices.
   *
   * Medido en Chrome a 1536 px: ventana de 1024, carril de 1728, paso de 352.
   * El tope está en −704, o sea DOS pasos. Pulsar «siguiente» una tercera y una
   * cuarta vez subía el contador a «4 / 5» y «5 / 5» sin mover absolutamente
   * nada — dos pulsaciones muertas, y otras dos al volver.
   *
   * `maxIndex` es cuántos pasos caben de verdad en el recorrido; `perView`,
   * cuántas tarjetas se ven. Los dos salen de `measure()` y cambian con el
   * ancho de pantalla: en móvil se ve una sola y entonces sí hay cuatro pasos.
   */
  private readonly maxIndex = signal(0);
  private readonly perView = signal(1);

  protected readonly atStart = computed(() => this.index() === 0);
  protected readonly atEnd = computed(() => this.index() >= this.maxIndex());

  /**
   * Etiqueta del contador: «1–3 de 5».
   *
   * Un «3 / 5» a secas con el botón ya deshabilitado parecería que faltan dos
   * salsas por ver, cuando en realidad están las dos en pantalla. El rango dice
   * lo que de verdad se está viendo. Cuando solo cabe una tarjeta —móvil— el
   * rango sobra y se muestra el número suelto.
   */
  protected readonly rangeLabel = computed(() => {
    const from = this.index() + 1;
    const to = Math.min(this.index() + this.perView(), this.products.length);
    const total = this.products.length;

    return from === to ? `${from} de ${total}` : `${from}–${to} de ${total}`;
  });

  /**
   * Las cinco salsas, una por grado de la escala.
   *
   * El nombre de cada una es el de su variedad de ají, no un nombre comercial
   * inventado: la gama entera se entiende leyendo la sección anterior. Los
   * datos de picor y de especie son los mismos que en la escala, y por el mismo
   * motivo se dan en rangos amplios — ver los comentarios de `heat-scale.ts`.
   */
  protected readonly products: readonly Product[] = [
    {
      name: 'Dulce',
      label: 'DULCE',
      pepper: 'Ají dulce',
      species: 'Capsicum chinense',
      scoville: '0 – 500 SHU',
      note: 'Para sofreír, no para picar. Es la base sobre la que se montan las demás.',
      fill: 'var(--color-heat-1)',
    },
    {
      name: 'Criolla',
      label: 'CRIOLLA',
      pepper: 'Ají criollo',
      species: 'Capsicum baccatum',
      scoville: '30 000 – 50 000 SHU',
      note: 'La vaina larga de los mercados de la Sierra, fermentada tres semanas.',
      fill: 'var(--color-heat-2)',
    },
    {
      name: 'Ratón',
      label: 'RATÓN',
      pepper: 'Ají ratón',
      species: 'Capsicum frutescens',
      scoville: '50 000 – 100 000 SHU',
      note: 'El fruto va entero en la botella. Es pequeño y crece mirando hacia arriba.',
      fill: 'var(--color-heat-3)',
    },
    {
      name: 'Rocoto',
      label: 'ROCOTO',
      pepper: 'Rocoto',
      species: 'Capsicum pubescens',
      scoville: '50 000 – 250 000 SHU',
      note: 'Pared gruesa y semilla negra: la especie adaptada al frío de altura.',
      fill: 'var(--color-heat-4)',
    },
    {
      name: 'Habanera',
      label: 'HABANERA',
      pepper: 'Habanero',
      species: 'Capsicum chinense',
      scoville: '100 000 – 350 000 SHU',
      note: 'Viene del Caribe y se cultiva en Manabí. Cierra la gama por arriba.',
      fill: 'var(--color-heat-5)',
    },
  ];

  /**
   * Distancia entre el inicio de una tarjeta y el de la siguiente.
   *
   * Se MIDE del DOM en vez de calcularse: el ancho de la tarjeta y el hueco
   * entre ellas son utilidades de Tailwind (`w-[78vw] sm:w-80`, `gap-5 sm:gap-8`)
   * y cambian con el tamaño de pantalla. Duplicar esos números aquí los dejaría
   * desincronizados en cuanto alguien retoque el espaciado.
   */
  private step = 0;

  /** Desplazamiento máximo hacia la izquierda. Negativo, o 0 si todo cabe. */
  private minX = 0;

  /** `false` con `prefers-reduced-motion: reduce`: los saltos son secos. */
  private animated = true;

  constructor() {
    createMotionScope(this.root, (mm) => {
      mm.add(MOTION_OK, () => {
        this.animated = true;

        // Las tarjetas solo APARECEN, así que van con `toggleActions` y no con
        // `scrub`. Atarlas al scroll obligaría a seguir moviendo la rueda para
        // terminar de verlas, justo cuando el usuario ha llegado a mirarlas.
        //
        // Un solo tween para la cabecera y las tarjetas, con el selector
        // combinado, para que el escalonado sea continuo: el texto entra y las
        // botellas lo siguen sin un corte en medio.
        gsap.to('[data-anim="reveal"], [data-anim="card"]', {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.07,
          scrollTrigger: {
            trigger: this.root().nativeElement,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        });

        return this.createCarousel(true);
      });

      mm.add(MOTION_REDUCED, () => {
        this.animated = false;
        gsap.set('[data-anim="reveal"], [data-anim="card"]', { opacity: 1, y: 0 });

        return this.createCarousel(false);
      });
    });
  }

  /**
   * Monta el `Draggable` y devuelve su limpieza.
   *
   * **El `return` no es opcional.** El listener de `resize` de aquí abajo es un
   * `addEventListener` normal, y GSAP no puede saber de él: si la media query
   * cambia (o el componente muere), `mm.revert()` mata el Draggable pero el
   * listener seguiría vivo llamando a `measure()` sobre un carrusel que ya no
   * existe. Devolver una función de limpieza desde el callback de `mm.add()`
   * está soportado — verificado en el código de GSAP, que hace
   * `_isFunction(result) && self._r.push(result)` y las ejecuta en `revert()`.
   *
   * El `Draggable` en sí NO se mata aquí a mano: se registra solo en el
   * contexto activo al construirse (`_context(this)` en `Draggable.js`), así
   * que `mm.revert()` ya se encarga. Matarlo además sería la misma capa
   * redundante que se evitó al elegir `matchMedia` sobre `gsap.context()`.
   */
  private createCarousel(withInertia: boolean): VoidFunction {
    const viewport = this.viewport().nativeElement;
    const track = this.track().nativeElement;

    this.measure();

    const [drag] = Draggable.create(track, {
      type: 'x',
      bounds: viewport,
      inertia: withInertia,

      // Al llegar al borde el carril cede un poco en vez de topar en seco.
      // 0,85 es resistencia alta: se nota que hay un final, sin dar la
      // sensación de goma elástica.
      edgeResistance: 0.85,

      // `allowNativeTouchScrolling` se queda en su valor por defecto (`true`
      // para `type: 'x'`) a propósito: es lo que permite que un dedo que se
      // mueve en vertical sobre el carrusel haga scroll de la página en vez de
      // quedar atrapado. Un carrusel que secuestra el scroll vertical es el
      // defecto más molesto del patrón en móvil.

      // Al soltar, la inercia termina con una tarjeta alineada y no a medio
      // camino. El `snap` recibe el punto de reposo natural y lo redondea.
      snap: { x: (value) => this.snapX(value) },

      // El índice se sincroniza también DURANTE el movimiento, para que el
      // contador y los botones no esperen a que la inercia pare.
      //
      // Llamar a `set()` en cada frame no es un problema aquí: un signal
      // descarta el valor si es igual al que ya tiene, así que Angular solo se
      // entera cuando el número de tarjeta cambia de verdad, no 60 veces por
      // segundo.
      onDrag: () => this.syncIndex(drag.x),

      // `onDragEnd` con `endX` y no con `x`, y hace falta para los DOS modos:
      //
      //   - con inercia, `endX` es el punto donde el lanzamiento va a parar ya
      //     ajustado por el `snap`, así que el contador se adelanta al destino
      //     en vez de ir persiguiéndolo;
      //   - sin inercia (`reduce`), los callbacks `onThrow*` no se disparan
      //     nunca. Sin esta línea el `snap` recolocaba el carril y el contador
      //     se quedaba marcando la tarjeta anterior.
      onDragEnd: () => this.syncIndex(drag.endX),
      onThrowUpdate: () => this.syncIndex(drag.x),
      onThrowComplete: () => this.syncIndex(drag.x),
    });

    // Las tarjetas miden en `vw` y el hueco cambia en el breakpoint `sm`, así
    // que al redimensionar hay que volver a medir, recolocar la tarjeta actual
    // y recalcular los límites del arrastre.
    const onResize = () => {
      this.measure();
      drag.applyBounds(viewport);
      this.goTo(this.index(), false);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }

  /** Mide el paso entre tarjetas y el tope izquierdo. Ver `step`. */
  private measure(): void {
    const viewport = this.viewport().nativeElement;
    const track = this.track().nativeElement;
    const cards = Array.from(track.children) as HTMLElement[];

    this.step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 0;

    // `Math.min(0, ...)` para el caso en que todas las tarjetas caben: ahí el
    // carril no debe poder moverse, y sin esto `minX` saldría positivo.
    this.minX = Math.min(0, viewport.clientWidth - track.scrollWidth);

    // Pasos que caben en el recorrido, y tarjetas que se ven a la vez. Ver el
    // comentario de `maxIndex`: no son `products.length - 1` y `1`.
    this.maxIndex.set(this.step ? Math.ceil(-this.minX / this.step) : 0);
    this.perView.set(this.step ? Math.max(1, Math.round(viewport.clientWidth / this.step)) : 1);
  }

  /** Redondea un desplazamiento al múltiplo del paso, dentro de los límites. */
  private snapX(value: number): number {
    if (!this.step) return gsap.utils.clamp(this.minX, 0, value);
    return gsap.utils.clamp(this.minX, 0, Math.round(value / this.step) * this.step);
  }

  /** Deduce qué tarjeta está a la vista a partir del desplazamiento del carril. */
  private syncIndex(x: number): void {
    if (!this.step) return;

    const max = this.maxIndex();

    // Caso borde del final del recorrido: el último tramo casi nunca mide un
    // paso entero —sobra solo lo que la ventana no cubre— así que al topar con
    // `minX` el redondeo se queda corto y el contador marcaría una posición
    // antes. Si el carril está en su tope, estamos en el último paso y punto.
    if (x <= this.minX + 1) {
      this.index.set(max);
      return;
    }

    this.index.set(gsap.utils.clamp(0, max, Math.round(-x / this.step)));
  }

  /** Lleva el carrusel a una tarjeta. Lo usan los botones y el teclado. */
  protected goTo(target: number, animate = this.animated): void {
    const i = gsap.utils.clamp(0, this.maxIndex(), target);
    const track = this.track().nativeElement;
    const x = gsap.utils.clamp(this.minX, 0, -i * this.step);

    if (animate) {
      // `overwrite: true` mata cualquier tween anterior sobre el carril. Sin
      // esto, pulsar el botón dos veces rápido deja dos tweens peleándose por
      // la misma propiedad.
      gsap.to(track, { x, duration: SLIDE, ease: 'power3.out', overwrite: true });
    } else {
      gsap.set(track, { x });
    }

    // El índice se fija al pedido, no al que corresponda a `x`: en el último
    // paso el carril topa antes de completarlo, y aun así es ahí donde estamos.
    // Ver `syncIndex`.
    this.index.set(i);
  }

  /**
   * Flechas, inicio y fin dentro de la región del carrusel.
   *
   * `preventDefault()` porque sin él las flechas harían scroll de la página
   * ADEMÁS de mover el carrusel. Con el foco dentro de la región, moverse por
   * el carrusel es lo que el usuario está pidiendo.
   */
  protected onKeydown(event: KeyboardEvent): void {
    const actions: Record<string, number> = {
      ArrowRight: this.index() + 1,
      ArrowLeft: this.index() - 1,
      Home: 0,
      End: this.maxIndex(),
    };

    const target = actions[event.key];
    if (target === undefined) return;

    event.preventDefault();
    this.goTo(target);
  }

  /**
   * Trae a la vista la tarjeta que acaba de recibir el foco **del teclado**.
   *
   * Es la pieza que arregla el agujero descrito en la cabecera de la clase: con
   * el carril movido por `transform` no hay scroll nativo que el navegador
   * pueda ajustar, así que tabular hasta una tarjeta fuera de pantalla dejaría
   * el foco invisible.
   *
   * EL FILTRO DE `:focus-visible` NO ES ADORNO.
   *
   * Sin él, cualquier foco mueve el carril — incluido el que da un toque con el
   * dedo. En escritorio no se notaba porque `Draggable` llama a
   * `preventDefault()` en el press y así el clic nunca llega a enfocar la
   * tarjeta (su `_isClickable()` solo exceptúa `<a>`, `<input>`, `<button>` y
   * `data-clickable`, y esto es un `<li tabindex="0">`). Pero en táctil
   * `allowNativeTouchScrolling` impide ese `preventDefault` a propósito —es lo
   * que deja que el dedo haga scroll vertical— así que ahí el toque SÍ puede
   * enfocar, y el carrusel daría un salto justo cuando el usuario solo quería
   * mirar.
   *
   * `:focus-visible` es exactamente esa distinción, y la resuelve el navegador:
   * se aplica al tabular y no al pulsar con un puntero. El estilo del anillo ya
   * usaba el mismo criterio; esto lo lleva al comportamiento.
   */
  protected onCardFocus(i: number, event: FocusEvent): void {
    if (!(event.target as HTMLElement).matches(':focus-visible')) return;

    this.goTo(i);
  }
}
