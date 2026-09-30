import { Component, ElementRef, viewChild } from '@angular/core';
import { gsap } from 'gsap';

import {
  MOTION_OK,
  MOTION_REDUCED,
  createMotionScope,
} from '../../animations/motion-scope';
import { Bottle } from '../bottle/bottle';

/**
 * Hero: titular colosal que sangra por los lados con la botella superpuesta.
 *
 * Es la primera sección con `pin` + `scrub`, el patrón que da nombre al
 * proyecto. La sección se queda fija mientras el scroll avanza la animación,
 * y como es `scrub`, el usuario la controla en los dos sentidos.
 *
 * Las tres capas se mueven a velocidades distintas — eso es lo que produce la
 * sensación de profundidad. El titular, que está detrás, se mueve menos que la
 * botella, que está delante: exactamente como el paisaje visto desde un coche.
 */
@Component({
  selector: 'app-hero',
  imports: [Bottle],
  templateUrl: './hero.html',
})
export class Hero {
  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');

  constructor() {
    createMotionScope(this.root, (mm) => {
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: this.root().nativeElement,
            start: 'top top',
            // Una pantalla entera de scroll para recorrer la animación.
            end: '+=100%',
            pin: true,
            // 0.5 y no `true`: medio segundo de inercia hace que la animación
            // persiga al scroll en vez de pegarse a él. Es la diferencia entre
            // un efecto mecánico y uno con peso.
            scrub: 0.5,
          },
        });

        // Todo arranca en 0 y va al valor final: las tres capas avanzan a la
        // vez pero distinta distancia, que es de donde sale la profundidad.
        tl.to('[data-anim="title"]', { yPercent: -14, scale: 1.06, ease: 'none' }, 0)
          .to('[data-anim="bottle"]', { yPercent: -46, ease: 'none' }, 0)
          .to('[data-anim="intro"]', { yPercent: -24, opacity: 0, ease: 'none' }, 0)
          .to('[data-anim="scroll-hint"]', { opacity: 0, ease: 'none' }, 0);
      });

      mm.add(MOTION_REDUCED, () => {
        // Sin pin y sin recorrido: la composición se ve entera y quieta.
        // No basta con no animar — hay que dejar explícito el estado final,
        // porque el estado inicial lo fija el CSS.
        gsap.set(
          '[data-anim="title"], [data-anim="bottle"], [data-anim="intro"], [data-anim="scroll-hint"]',
          { yPercent: 0, scale: 1, opacity: 1 },
        );
      });
    });
  }
}
