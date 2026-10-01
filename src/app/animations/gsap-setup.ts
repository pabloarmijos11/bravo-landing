import { gsap } from 'gsap';
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
 *   DrawSVGPlugin  -> fase 5 (la línea del proceso)
 *   Draggable      -> fase 6 (el carrusel)
 *   InertiaPlugin  -> fase 6. OJO: sin registrarlo, `inertia: true` se ignora
 *                     en silencio, sin error ni aviso.
 */

let registered = false;

export function setupGsap(): void {
  if (registered) return;

  gsap.registerPlugin(ScrollTrigger);

  /*
    ⚠️ EXPERIMENTO EN EVALUACIÓN — NO DAR POR BUENO.

    Rompe AvPág: comprobado en Chrome, la tecla deja de hacer nada (Ctrl+Inicio
    y las flechas sí siguen funcionando). Eso es una regresión de accesibilidad
    real, así que esto SOLO se queda si demuestra que arregla Firefox, y aun
    entonces habrá que devolverle AvPág con un handler propio.

    Si al leer esto sigue aquí sin una nota diciendo que se confirmó, quítalo.

    ---

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

    COSTE A VIGILAR: al tomar el control del scroll, hay que comprobar que
    siguen funcionando el teclado (flechas, AvPág, inicio/fin) y el arrastre
    táctil. Si algo de eso se rompe, revisarlo antes que quitarlo del todo.
  */
  ScrollTrigger.normalizeScroll(true);

  registered = true;
}
