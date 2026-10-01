import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { gsap } from 'gsap';

import {
  MOTION_OK,
  MOTION_REDUCED,
  createMotionScope,
} from '../../animations/motion-scope';

/** Un grado de la escala. */
interface HeatLevel {
  /** Nombre con el que se conoce en Ecuador. */
  readonly pepper: string;
  /** Especie, en cursiva en la plantilla. */
  readonly species: string;
  readonly scoville: string;
  readonly origin: string;
  /** Una línea verificable. Sin superlativos: es una regla del proyecto. */
  readonly note: string;

  /**
   * Token del color de fondo del nivel. Se resuelve en tiempo de ejecución
   * con `getComputedStyle`, no se escribe el hex aquí. Ver `resolveColor()`.
   */
  readonly token: string;

  /**
   * Clases de visibilidad y del layout alternativo de `reduce`.
   *
   * Van escritas ENTERAS, nunca compuestas: Tailwind escanea el fuente
   * buscando nombres de clase literales, y una clase concatenada no genera su
   * utilidad ni avisa de ello.
   */
  readonly classes: string;
}

/**
 * Duración del reposo de un nivel, en unidades de la timeline.
 *
 * El reparto entre `REST` y `CROSS` no es un detalle de gusto: define cuánto
 * scroll pasa el usuario leyendo y cuánto mirando una pantalla sin texto.
 * El primer intento (1,4 y 1) dejaba 36 vh de recorrido vacío por transición,
 * más de lo que duraba el texto plenamente visible. Medido en navegador y
 * corregido: ahora son 48 vh de lectura por cada 22 vh de cruce.
 */
const REST = 2.2;

/** Duración de la transición entre dos niveles. */
const CROSS = 0.8;

/** Duración de la entrada y la salida del texto, dentro del reposo. */
const FADE = 0.25;

/**
 * Punto del tramo 3→4 en el que el texto cruza de `ink` a `bone`.
 *
 * No es un valor elegido a ojo: sale de `py -3 scripts/contraste.py`, que
 * analiza la rampa interpolada y da la ventana donde los dos colores pasan el
 * umbral. Si se tocan los colores de la escala, hay que volver a ejecutarlo.
 */
const INK_CROSSOVER = 0.6;

/**
 * Escala de picante: el scroll recorre los cinco grados.
 *
 * El fondo transiciona de `heat-1` a `heat-5`, un medidor se llena y el nombre
 * de cada ají entra y sale. Es una SOLA timeline con los tramos colocados por
 * posición, nunca un `ScrollTrigger` por nivel: cinco triggers independientes
 * se desincronizan al hacer scroll rápido.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ EL TEXTO DESAPARECE ENTRE NIVEL Y NIVEL
 * ---------------------------------------------------------------------------
 * No es una floritura, es un requisito de accesibilidad medido.
 *
 * El fondo no es uno de los cinco colores del sistema: durante la animación es
 * una interpolación continua, así que el navegador pinta cientos de colores
 * que nadie verificó. `scripts/contraste.py` los recorre y encuentra una ZONA
 * MUERTA entre el 57,5 % y el 72,5 % del recorrido — el tramo naranja→rojo—,
 * donde NINGÚN color de texto llega a 4,5:1.
 *
 * La salida no es cambiar la paleta: es que ahí no haya nada que leer. El
 * texto aparece con el fondo ya asentado en un color canónico y se desvanece
 * antes de que empiece el cruce siguiente. Por eso los `FADE` caen dentro del
 * reposo y no durante la transición.
 *
 * Lo que sí está visible todo el rato —el medidor y el eyebrow— es gráfico o
 * de tamaño grande, umbral 3,0, y a ese umbral no hay ningún punto sin color
 * válido: basta con cruzar de `ink` a `bone` en el sitio que da el script.
 */
@Component({
  selector: 'app-heat-scale',
  templateUrl: './heat-scale.html',
  host: {
    // El host se pinta del MISMO color que la sección, y se anima con ella.
    //
    // Es lo que hay detrás del pin: ScrollTrigger envuelve la sección en un
    // `pin-spacer`, que vive aquí dentro y es transparente. Mientras la
    // sección está pineada, cualquier píxel que ella no llegue a cubrir deja
    // ver este fondo.
    //
    // POR QUÉ ESTO Y NO AJUSTAR EL ALTO. Chrome mostraba una línea del fondo
    // hueso de la sección siguiente por el borde inferior al bajar. Se probó
    // `pinType: 'fixed'` (no era el pin) y darle a la sección 12 px de más
    // (insuficiente: el desfase es del tamaño del salto de la rueda, no de
    // un par de píxeles). Pintar el fondo hace la causa irrelevante — por
    // mucho que la sección se desplace, detrás hay su mismo color, así que no
    // hay nada blanco que enseñar.
    //
    // `block` porque un elemento a medida es `inline` por defecto y así no
    // tendría caja que pintar.
    class: 'block bg-heat-1 motion-reduce:bg-transparent',
  },
})
export class HeatScale {
  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');

  /** El host, que se tiñe con el mismo color que la sección. Ver `host` arriba. */
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * Los cinco grados, de menos a más picante.
   *
   * Variedades reales cultivadas en Ecuador. Los rangos Scoville son los
   * aceptados para cada variedad, y donde el dato no es nítido se usa el rango
   * amplio en vez de inventar una cifra exacta. El habanero declara que no es
   * nativo porque no lo es: el copy de este proyecto no adorna.
   */
  protected readonly levels: readonly HeatLevel[] = [
    {
      pepper: 'Ají dulce',
      species: 'Capsicum chinense',
      scoville: '0 – 500 SHU',
      origin: 'Costa',
      note: 'La misma especie que el habanero, sin su picor. Se usa por aroma.',
      token: '--color-heat-1',
      classes: 'opacity-100 motion-reduce:bg-heat-1 motion-reduce:text-heat-1-ink',
    },
    {
      pepper: 'Ají criollo',
      species: 'Capsicum baccatum',
      scoville: '30 000 – 50 000 SHU',
      origin: 'Sierra',
      note: 'El de los mercados y el del ají de tomate de árbol. Vaina larga.',
      token: '--color-heat-2',
      classes:
        'opacity-0 motion-reduce:opacity-100 motion-reduce:bg-heat-2 motion-reduce:text-heat-2-ink',
    },
    {
      pepper: 'Ají ratón',
      species: 'Capsicum frutescens',
      scoville: '50 000 – 100 000 SHU',
      origin: 'Costa y Amazonía',
      note: 'Fruto diminuto y erguido. Se usa entero, fresco o encurtido.',
      token: '--color-heat-3',
      classes:
        'opacity-0 motion-reduce:opacity-100 motion-reduce:bg-heat-3 motion-reduce:text-heat-3-ink',
    },
    {
      pepper: 'Rocoto',
      species: 'Capsicum pubescens',
      scoville: '50 000 – 250 000 SHU',
      origin: 'Sierra alta',
      note: 'Semillas negras y pared gruesa. Es la especie que aguanta el frío andino.',
      token: '--color-heat-4',
      classes:
        'opacity-0 motion-reduce:opacity-100 motion-reduce:bg-heat-4 motion-reduce:text-heat-4-ink',
    },
    {
      pepper: 'Habanero',
      species: 'Capsicum chinense',
      scoville: '100 000 – 350 000 SHU',
      origin: 'Manabí',
      note: 'No es nativo del Ecuador. Se cultiva en la costa y cierra la escala.',
      token: '--color-heat-5',
      classes:
        'opacity-0 motion-reduce:opacity-100 motion-reduce:bg-heat-5 motion-reduce:text-heat-5-ink',
    },
  ];

  constructor() {
    createMotionScope(this.root, (mm) => {
      const host = this.root().nativeElement;
      const levelNodes = Array.from(
        host.querySelectorAll<HTMLElement>('[data-anim="level"]'),
      );

      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: host,
            start: 'top top',

            // Cinco estados que hay que poder leer, así que el recorrido es
            // bastante mayor que el del hero. El número se afina con el sitio
            // delante: demasiado corto atropella, demasiado largo aburre.
            end: '+=400%',
            pin: true,

            // AQUÍ ESTA SECCIÓN SE SEPARA DEL HERO, Y EL MOTIVO ES EL CONTENIDO
            // QUIETO.
            //
            // El hero usa `pinType: 'transform'` y `anticipatePin: 1`. Los dos
            // posicionan la sección desde JavaScript:
            //
            //   - `transform` mantiene la sección en su sitio con un translateY
            //     que GSAP recalcula en cada evento de scroll. Chrome compone
            //     el scroll de forma asíncrona, así que durante un frame la
            //     sección está donde el compositor la dejó, no donde el JS la
            //     quiere.
            //   - `anticipatePin` adelanta el pin según la velocidad del
            //     scroll. Es una predicción, y cuando falla hay que corregirla.
            //
            // Las dos cosas producen el mismo artefacto: la sección salta unos
            // píxeles y vuelve. En el hero no se nota porque su contenido se
            // mueve con el scroll (`yPercent`) y el temblor queda enmascarado
            // dentro del movimiento. Aquí el texto está QUIETO durante todo el
            // reposo de cada nivel, así que cualquier oscilación se ve desnuda:
            // Pablo lo describió como que «el texto rebota».
            //
            // Con `fixed` ancla el navegador y no hay ningún valor que el JS
            // pueda tener desactualizado. Se paga un recálculo de layout al
            // entrar y al salir del pin — DOS veces en todo el recorrido, no
            // una por frame.
            //
            // CONTRAINDICACIÓN de `fixed`: no funciona dentro de un ancestro
            // transformado. Aquí el host no lleva transform, así que no aplica.
            //
            // `scrub: true` sigue siendo `true` y nunca un número, por lo de
            // siempre: un scrub numérico es latencia que se suma a la del
            // navegador. Ver los comentarios de hero.ts.
            pinType: 'fixed',
            scrub: true,
          },
        });

        this.levels.forEach((level, i) => {
          const restStart = i * (REST + CROSS);

          // Entrada: todos menos el primero, que ya llega visible desde CSS.
          // El estado inicial va en CSS y no en un `from()`: con `from`, el
          // elemento se pinta en su sitio y GSAP lo esconde un frame después,
          // lo que produce un destello.
          if (i > 0) {
            tl.to(levelNodes[i], { opacity: 1, duration: FADE, ease: 'none' }, restStart);
          }

          // Salida: todos menos el último, que se queda puesto al final.
          if (i < this.levels.length - 1) {
            tl.to(
              levelNodes[i],
              { opacity: 0, duration: FADE, ease: 'none' },
              restStart + REST - FADE,
            );
          }

          // Transición al nivel siguiente: fondo y medidor a la vez.
          if (i < this.levels.length - 1) {
            const crossStart = restStart + REST;

            tl.to(
              // La sección Y el host, con el mismo color y a la vez. El host
              // es lo que queda detrás del pin; si se quedara en su color
              // inicial, cualquier desfase de la sección enseñaría verde en
              // mitad de la escala en vez de hueso, que es igual de malo.
              [host, this.hostEl.nativeElement],
              {
                // `backgroundColor` es la excepción documentada a la regla de
                // animar solo `opacity` y `transform`: no dispara layout, solo
                // repaint. Si rindiera mal, la alternativa es cruzar dos capas
                // con `opacity`.
                backgroundColor: this.resolveColor(this.levels[i + 1].token),
                duration: CROSS,
                ease: 'none',
              },
              crossStart,
            );

            tl.to(
              '[data-anim="meter-fill"]',
              { scaleY: (i + 2) / this.levels.length, duration: CROSS, ease: 'none' },
              crossStart,
            );
          }
        });

        // Reserva el reposo del ÚLTIMO nivel.
        //
        // La duración de una timeline de GSAP es la de su último tween, no la
        // que uno tenga en la cabeza. El quinto nivel no tiene fade de salida
        // ni transición detrás, así que sin esto la timeline acababa en 12,25
        // unidades en vez de 14,2: el último ají aparecía y el pin se soltaba
        // encima, sin que llegara a reposar. Se vio midiendo en el navegador,
        // no leyendo el código.
        //
        // Un tween de duración 0 sobre un objeto vacío solo sirve para marcar
        // el final; no anima nada.
        const total = this.levels.length * REST + (this.levels.length - 1) * CROSS;
        tl.to({}, { duration: 0 }, total);

        // El cruce del color de texto va DENTRO del tramo 3→4 y es un salto,
        // no una interpolación: interpolar de `ink` a `bone` pasaría por grises
        // de contraste bajísimo sobre el naranja. Un `set` en una timeline con
        // `scrub` es reversible, así que al subir vuelve solo.
        const inkCrossAt = 2 * (REST + CROSS) + REST + INK_CROSSOVER * CROSS;
        tl.set(host, { color: this.resolveColor('--color-heat-5-ink') }, inkCrossAt);
      });

      mm.add(MOTION_REDUCED, () => {
        // Sin pin y sin recorrido. El layout alternativo lo pone Tailwind con
        // la variante `motion-reduce:` (los cinco niveles pasan a flujo
        // vertical, cada uno con su propio fondo); esto es solo la red de
        // seguridad para lo que anima GSAP con estilos inline.
        gsap.set(levelNodes, { opacity: 1 });
        gsap.set('[data-anim="meter-fill"]', { scaleY: 1 });
      });
    });
  }

  /**
   * Resuelve un token de color a su valor real.
   *
   * **GSAP no sabe interpolar `var(--color-heat-1)`.** Necesita un color de
   * verdad: si se le pasa la función `var()`, la escribe tal cual como string
   * y el fondo salta de golpe en vez de transicionar, sin ningún error.
   *
   * Leerlo con `getComputedStyle` mantiene la regla de no escribir hex crudos
   * en el código: la única fuente de verdad del color sigue siendo el `@theme`
   * de styles.css.
   */
  private resolveColor(token: string): string {
    return getComputedStyle(this.root().nativeElement).getPropertyValue(token).trim();
  }
}
