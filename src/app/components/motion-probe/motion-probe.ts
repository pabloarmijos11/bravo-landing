import { Component, ElementRef, input, viewChild } from '@angular/core';
import { gsap } from 'gsap';

import {
  MOTION_OK,
  MOTION_REDUCED,
  createMotionScope,
} from '../../animations/motion-scope';

/**
 * TEMPORAL — sonda de verificación del patrón de animación (fase 2).
 *
 * No forma parte de la landing. Existe para demostrar cuatro cosas antes de
 * construir siete secciones sobre `createMotionScope`, y se borra en la fase 3:
 *
 *   1. La animación corre y responde al scroll.
 *   2. Al destruir el componente no queda ningún `ScrollTrigger` huérfano.
 *   3. Con `prefers-reduced-motion: reduce` el contenido se ve en su estado
 *      final y legible, no oculto ni a medio camino.
 *   4. Dos instancias no se pisan: el scope del selector funciona.
 *
 * El punto 4 se demuestra visualmente con `direction`: una sonda entra desde
 * la izquierda y la otra desde la derecha. Si el scope no aislara los
 * selectores, la segunda instancia sobrescribiría a la primera y las dos
 * entrarían del mismo lado.
 */
@Component({
  selector: 'app-motion-probe',
  templateUrl: './motion-probe.html',
})
export class MotionProbe {
  readonly label = input.required<string>();

  /** -1 entra desde la izquierda, 1 desde la derecha. */
  readonly direction = input.required<-1 | 1>();

  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');

  protected readonly bars = [1, 2, 3, 4, 5, 6];

  constructor() {
    createMotionScope(this.root, (mm) => {
      mm.add(MOTION_OK, () => {
        // `to` y no `from`: el estado inicial lo fija el CSS, así no hay
        // destello de un frame con el contenido ya visible antes de esconderse.
        gsap.to('[data-anim="bar"]', {
          x: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out',
          // 60 ms: dentro del rango 45-125 del sistema. Con 300 ms parecería
          // barato, que es el error que comete casi todo el mundo.
          stagger: 0.06,
          scrollTrigger: {
            trigger: this.root().nativeElement,
            start: 'top 85%',
            // Sin `scrub` a propósito: esta sonda comprueba el ciclo de vida,
            // no el scroll cinematográfico. El `scrub` llega en la fase 3.
            toggleActions: 'play none none reverse',
          },
        });
      });

      mm.add(MOTION_REDUCED, () => {
        // Estado final, sin recorrido. Nunca dejar el contenido oculto.
        gsap.set('[data-anim="bar"]', { x: 0, opacity: 1 });
      });
    });
  }

  /** Desplazamiento inicial en píxeles, según el lado de entrada. */
  protected offset(): string {
    return `${this.direction() * 60}px`;
  }
}
