import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Registro de los plugins de GSAP. Idempotente: se puede llamar desde cada
 * componente sin coste.
 *
 * GSAP es inconsistente con el sufijo `Plugin` en las rutas de import, y la
 * documentación resumida da nombres que no existen (`ScrollTriggerPlugin` es
 * inventado). La regla real, verificada contra el paquete en node_modules:
 *
 *   sin sufijo (clases):  ScrollTrigger, Draggable, Observer, SplitText,
 *                         ScrollSmoother, Flip
 *   con sufijo `Plugin`:  DrawSVGPlugin, InertiaPlugin, MorphSVGPlugin,
 *                         MotionPathPlugin
 *
 * Aquí solo se registra lo que ya se usa. Registrar un plugin lo mete en el
 * bundle, así que los demás se añaden en la fase que los necesite:
 *
 *   DrawSVGPlugin  -> AÑADIDO en la fase 5, para la línea del proceso.
 *   Draggable      -> fase 6 (el carrusel)
 *   InertiaPlugin  -> fase 6. OJO: sin registrarlo, `inertia: true` se ignora
 *                     en silencio, sin error ni aviso.
 */

let registered = false;

export function setupGsap(): void {
  if (registered) return;

  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

  /*
    ⚠️ DESACTIVADO A PROPÓSITO — ver abajo antes de reactivarlo.

    Fuerza que el scroll se procese en el hilo de JavaScript.

    POR QUÉ: los navegadores modernos gestionan el scroll en el hilo del
    compositor para que nunca se bloquee. Pero ScrollTrigger lee la posición y
    aplica los transforms en el hilo principal, así que ambos van ligeramente
    desacompasados. El resultado se percibe como que la animación "se arrastra"
    por detrás de la rueda.

    Firefox lo acusa mucho más que Chrome por cómo implementa su APZ
    (Asynchronous Panning and Zooming). En Chrome el hero se sentía bien y en
    Firefox no, con el mismo código.

    `normalizeScroll` intercepta el scroll y lo sincroniza con los transforms,
    que es justo lo que falta. Es una API pensada para esto; la documentación
    del paquete la describe como "forces scrolling to be done on the JavaScript
    thread, ensuring it is synchronized".

    POR QUÉ ESTÁ DESACTIVADO

    Rompe AvPág y RePág. Las flechas y Ctrl+Inicio siguen bien, pero el
    paginado no, y reimplementarlo a mano resultó peor que el problema: el
    handler peleaba con el `pin` del hero y el scroll acababa saltando hacia
    atrás.

    Pero sobre todo: se añadió ANTES de sustituir la textura del titular por un
    PNG. Esa sustitución bajó mucho el coste de rasterizado, y parte del
    arrastre que se le atribuía al desfase de hilos podía venir de ahí. Mantener
    una API que rompe navegación por teclado, para compensar un problema que
    quizá ya no existe, es acumular complejidad sin comprobar que hace falta.

    CUÁNDO REACTIVARLO: solo si se confirma que sin él Firefox vuelve a
    arrastrarse CON la textura ya en PNG. En ese caso habrá que resolver bien
    el paginado — probablemente con ScrollToPlugin en vez de a mano.
  */
  // ScrollTrigger.normalizeScroll(true);

  registered = true;
}
