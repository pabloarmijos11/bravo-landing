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
        // ---------------------------------------------------------------
        // PRECALENTAR LAS CAPAS, ANTES DE CREAR LA TIMELINE
        // ---------------------------------------------------------------
        // Firefox se trababa en el PRIMER movimiento de rueda y después iba
        // fluido. Dos datos acotaron la causa: esperar cinco segundos antes de
        // tocar nada no cambiaba nada —así que no era trabajo de carga— y el
        // tirón caía siempre en el primer frame animado.
        //
        // Eso es la creación de las capas de composición. Mientras no hay un
        // transform de verdad, el navegador no tiene por qué rasterizar el
        // titular en su propia capa; y rasterizarlo cuesta, porque mide
        // 1677 × 1106 px y lleva una `mask-image` encima. Al llegar el primer
        // frame hace ese trabajo entero de golpe. Después queda cacheado, y de
        // ahí que solo se note una vez. `will-change: transform` lo pide, pero
        // es una sugerencia que los navegadores ignoran cuando el área es muy
        // grande, y Firefox es bastante más conservador que Chrome.
        //
        // `force3D: true` hace que GSAP escriba `translate3d(0,0,0)` AHORA, en
        // la carga, en vez de esperar al primer movimiento. El trabajo es el
        // mismo; lo que cambia es que ocurre cuando nadie está mirando.
        gsap.set(
          '[data-anim="title"], [data-anim="bottle"], [data-anim="intro"], [data-anim="scroll-hint"]',
          { force3D: true, y: 0 },
        );

        const tl = gsap.timeline({
          // `force3D` también en la timeline: si GSAP volviera a un transform
          // 2D al animar, el navegador podría descartar la capa y habría que
          // rehacerla. Mantenerlo en 3D la conserva todo el recorrido.
          defaults: { ease: 'none', force3D: true },
          scrollTrigger: {
            trigger: this.root().nativeElement,
            start: 'top top',

            // Cuánto scroll se pasa con la página visualmente detenida. Con
            // '+=100%' era una pantalla entera y se sentía atascado: el usuario
            // gira la rueda y la página no avanza. 70% mantiene el efecto y
            // acorta la espera.
            end: '+=70%',
            pin: true,

            // Pinea con `transform`, no con `position: fixed`.
            //
            // Por defecto ScrollTrigger cambia el elemento a `position: fixed`
            // mientras dura el pin y lo devuelve al flujo al soltarlo. Cambiar
            // el modelo de posicionamiento de un elemento de pantalla completa
            // obliga al navegador a recalcular el layout, y eso produce un
            // frame largo justo en la transición — el tirón que se notaba al
            // entrar en la sección siguiente.
            //
            // Con `transform` no hay cambio de posicionamiento: es un
            // translateY que se aplica y se deja de aplicar, resuelto en el
            // compositor.
            //
            // CONTRAINDICACIÓN: un elemento `position: fixed` DENTRO de algo
            // transformado deja de ser fijo respecto al viewport. Aquí no hay
            // ninguno (el grano del fondo es `body::before`, fuera del hero),
            // pero hay que recordarlo si alguna sección futura mete uno.
            pinType: 'transform',

            // Adelanta la preparación del pin en función de la velocidad del
            // scroll. Pensado justo para secciones grandes, donde el cambio se
            // nota si se hace exactamente en el píxel del umbral.
            anticipatePin: 1,

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
        // El `ease: 'none'` ya no se repite en cada tween: va en los `defaults`
        // de la timeline, junto con `force3D`.
        tl.to('[data-anim="title"]', { yPercent: -14, scale: 1.06 }, 0)
          .to('[data-anim="bottle"]', { yPercent: -46 }, 0)
          .to('[data-anim="intro"]', { yPercent: -24, opacity: 0 }, 0)
          .to('[data-anim="scroll-hint"]', { opacity: 0 }, 0);
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
