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

            // Cuánto scroll se pasa con la página visualmente detenida. Con
            // '+=100%' era una pantalla entera y se sentía atascado: el usuario
            // gira la rueda y la página no avanza. 70% mantiene el efecto y
            // acorta la espera.
            end: '+=70%',
            pin: true,

            // `true`, NO un número. Y esto costó dos rondas de entenderlo.
            //
            // Un `scrub` numérico no es un efecto: es LATENCIA deliberada. La
            // animación se queda N segundos por detrás del scroll, y esa
            // latencia se SUMA a la que ya mete el navegador por su cuenta.
            //
            // Firefox trae smooth scroll nativo activado y bastante agresivo,
            // así que allí se acumulaban las dos y el resultado era fluido pero
            // retrasado — «se arrastra». En Chrome, con menos suavizado propio,
            // el mismo valor se sentía bien. De ahí que el síntoma apareciera
            // en un navegador y no en el otro.
            //
            // Con `true` la animación va atada 1:1 a la posición del scroll y
            // el suavizado lo pone cada navegador a su manera, que es la que
            // sus usuarios ya esperan. Nosotros no añadimos retraso encima.
            //
            // Nota: esto NO era un problema de rendimiento. Medido: 59 FPS en
            // Chrome tanto antes como después. Optimizar el pintado no podía
            // arreglarlo, porque el problema nunca estuvo ahí.
            scrub: true,
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
