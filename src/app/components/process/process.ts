import { Component, ElementRef, viewChild } from '@angular/core';
import { gsap } from 'gsap';

import {
  MOTION_OK,
  MOTION_REDUCED,
  createMotionScope,
} from '../../animations/motion-scope';

/** Un paso del proceso. */
interface Step {
  readonly name: string;
  /** Lo que de verdad pasa en ese paso. Dato comprobable, sin adornos. */
  readonly detail: string;
}

/**
 * Proceso: los cuatro pasos, cosidos por una línea que se dibuja al bajar.
 *
 * La línea usa `DrawSVGPlugin`, que anima `stroke-dasharray` para simular que
 * un trazo se dibuja. Es el único sitio del proyecto que lo necesita, y es la
 * razón de que el plugin entre en el bundle (+1,35 kB medidos).
 *
 * Va con `scrub` y no con `toggleActions`: aquí la animación SÍ representa un
 * recorrido —la línea avanza mientras el usuario baja por los pasos—, al revés
 * que en Origen, donde el texto solo tenía que aparecer. El criterio es ese:
 * `scrub` cuando el scroll recorre algo, `toggleActions` cuando solo lo revela.
 */
@Component({
  selector: 'app-process',
  templateUrl: './process.html',
})
export class Process {
  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');

  /**
   * Los cuatro pasos, con datos reales de elaboración de una salsa fermentada.
   *
   * El `3 %` de sal, las dos a cuatro semanas y el pH de 4,6 son valores reales
   * y comprobables, no cifras puestas para que suene técnico. El 4,6 en
   * concreto es el umbral por debajo del cual un alimento deja de considerarse
   * de baja acidez, que es exactamente lo que permite conservarlo sin frío.
   */
  protected readonly steps: readonly Step[] = [
    {
      name: 'Selección',
      detail:
        'Se aparta el fruto maduro. El verde tiene menos azúcar y la fermentación arranca peor.',
    },
    {
      name: 'Salmuera',
      detail:
        'De dos a cuatro semanas en salmuera al 3 %. Las bacterias lácticas que ya viven en la piel del ají hacen el trabajo.',
    },
    {
      name: 'Molienda',
      detail:
        'Se muele con el líquido de su propia fermentación, no con agua: ahí está la acidez que ha ganado.',
    },
    {
      name: 'Embotellado',
      detail:
        'Se corrige hasta dejar el pH por debajo de 4,6, el punto en que la conservación deja de depender del frío.',
    },
  ];

  constructor() {
    createMotionScope(this.root, (mm) => {
      mm.add(MOTION_OK, () => {
        // DOS TRIGGERS, Y NO ES UN DESCUIDO.
        //
        // El primer intento metió la línea y los pasos en una sola timeline con
        // `scrub`, repartiendo los pasos por posiciones fijas (0, 0,25, 0,5...).
        // Falla por una razón que solo se ve en el navegador: el reparto es por
        // PROGRESO DE LA TIMELINE, no por dónde está cada paso en la pantalla.
        // Medido, el cuarto paso ya estaba a 619 px de un viewport de 770 —es
        // decir, el usuario lo tenía delante— y su animación no entraba hasta el
        // 80 % del recorrido. El resultado era un hueco vacío donde debía haber
        // texto.
        //
        // La línea y los pasos hacen cosas distintas y por eso llevan triggers
        // distintos: la línea RECORRE (va con el scroll, `scrub`), los pasos solo
        // APARECEN (`toggleActions`). Es el mismo criterio que separa a Origen de
        // la escala de picante.
        //
        // Esto NO contradice el anti-patrón de «un ScrollTrigger por nivel» de la
        // escala: allí los cinco niveles son estados de UNA secuencia continua y
        // triggers separados se desincronizan al hacer scroll rápido. Aquí son
        // cuatro elementos independientes que solo tienen que hacerse visibles.

        // La línea: se dibuja a medida que se baja.
        gsap.to('[data-anim="thread"]', {
          drawSVG: '100%',
          ease: 'none',
          scrollTrigger: {
            trigger: this.root().nativeElement,
            start: 'top 70%',
            end: 'bottom 80%',
            // `true`, nunca un número, por lo de siempre: un scrub numérico es
            // latencia que se suma a la del navegador.
            scrub: true,
          },
        });

        // Los pasos: entran escalonados cuando la sección asoma, y ya están
        // puestos cuando el usuario llega a leerlos.
        gsap.to('[data-anim="step"]', {
          opacity: 1,
          x: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.07,
          scrollTrigger: {
            trigger: this.root().nativeElement,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      mm.add(MOTION_REDUCED, () => {
        // Con `reduce` la línea aparece entera y los pasos en su sitio. No
        // basta con no animar: el estado inicial del trazo lo pone el atributo
        // `stroke-dasharray` del HTML, así que hay que deshacerlo explícitamente.
        gsap.set('[data-anim="thread"]', { drawSVG: '100%' });
        gsap.set('[data-anim="step"]', { opacity: 1, x: 0 });
      });
    });
  }
}
