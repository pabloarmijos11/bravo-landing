import { Component, ElementRef, viewChild } from '@angular/core';
import { gsap } from 'gsap';

import { MOTION_OK, MOTION_REDUCED, createMotionScope } from '../../animations/motion-scope';

/**
 * Origen: de dónde viene el ají, con los datos que el hero no puede dar.
 *
 * Es la sección donde vive lo descriptivo. El hero se quedó sin copy porque su
 * titular ocupa la pantalla entera y no quedaba sitio legible; esto es su
 * contrapartida, y por eso va inmediatamente después.
 *
 * ANIMACIÓN: ES UN REVEAL, NO UN SCRUB.
 *
 * Las dos secciones anteriores atan la animación al scroll (`scrub`), que sirve
 * cuando el usuario recorre un estado. Aquí no hay estados: hay un bloque de
 * texto que aparece una vez. Un `scrub` obligaría a seguir moviendo la rueda
 * para terminar de leerlo, que es exactamente lo contrario de lo que quiere
 * alguien que ha llegado a leer.
 *
 * Por eso `toggleActions` en vez de `scrub`, y sin `pin`.
 */
@Component({
  selector: 'app-origin',
  templateUrl: './origin.html',
})
export class Origin {
  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');

  /**
   * Los tres datos que resumen la sección.
   *
   * Reales y comprobables, como manda la regla de copy del proyecto: unas
   * veinte variedades cultivadas en Ecuador, repartidas en las cinco especies
   * domesticadas del género, presentes en diecisiete provincias. Ningún
   * superlativo: son cifras, y las cifras no necesitan adjetivos.
   */
  protected readonly facts = [
    { value: '20', label: 'variedades cultivadas en el país' },
    { value: '5', label: 'especies distintas del género Capsicum' },
    { value: '17', label: 'provincias donde da fruto' },
  ];

  constructor() {
    createMotionScope(this.root, (mm) => {
      mm.add(MOTION_OK, () => {
        gsap.to('[data-anim="reveal"]', {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: 'power2.out',

          // 60 ms entre elementos. El rango de la referencia es 45–125 ms, y el
          // instinto de poner 300 "para que se note" es justo lo que hace que
          // una animación parezca barata: a 300 ms el último elemento entra casi
          // dos segundos después del primero y se percibe como lentitud, no
          // como ritmo.
          stagger: 0.06,

          scrollTrigger: {
            trigger: this.root().nativeElement,

            // 'top 75%' = cuando el borde superior de la sección llega al 75 %
            // del viewport, es decir con la sección ya entrando pero antes de
            // que el texto esté a la altura de lectura. Dispararlo en 'top top'
            // llegaría tarde: el usuario ya estaría mirando el texto cuando
            // empieza a aparecer.
            start: 'top 75%',

            // Reproduce al entrar y revierte al salir hacia arriba, de modo que
            // al volver a subir la animación está lista otra vez. Sin esto, el
            // reveal se queda gastado tras la primera pasada.
            toggleActions: 'play none none reverse',
          },
        });
      });

      mm.add(MOTION_REDUCED, () => {
        gsap.set('[data-anim="reveal"]', { opacity: 1, y: 0 });
      });
    });
  }
}
