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
  registered = true;
}
