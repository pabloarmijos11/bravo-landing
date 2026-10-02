import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { FormField, email, form, required, submit } from '@angular/forms/signals';
import { gsap } from 'gsap';

import {
  MOTION_OK,
  MOTION_REDUCED,
  createMotionScope,
} from '../../animations/motion-scope';

/**
 * CTA: suscripción al aviso de nuevas tandas.
 *
 * FORMULARIO CON SIGNAL FORMS, NO CON EL PAQUETE CLÁSICO.
 *
 * `FormControl`, `FormGroup`, `FormArray` y `FormBuilder` están prohibidos en
 * este proyecto. Signal Forms los sustituye por completo: la estructura del
 * formulario se deriva del modelo, y el modelo es una señal.
 *
 * Dos reglas de la API que es fácil equivocar y que el compilador no siempre
 * caza:
 *
 * 1. **Hay que LLAMAR al campo para llegar a su estado.** `form.email` es la
 *    estructura; `form.email()` es el estado con sus señales. `form.email.valid()`
 *    no existe — va `form.email().valid()`. Y en la raíz, `form().invalid()`,
 *    no `form.invalid()`.
 * 2. **El modelo nunca lleva `null` ni `undefined`.** Una cadena vacía para
 *    texto, `0` para números, `[]` para listas.
 *
 * NO HAY BACKEND. El envío simula una espera y termina en éxito; es una landing
 * de una marca ficticia. Lo que sí es real son los cuatro estados por los que
 * pasa la interfaz, que es lo que se estaba practicando.
 */
@Component({
  selector: 'app-cta',
  // `FormField` es la directiva que hace funcionar `[formField]` en la
  // plantilla. Sin ella el compilador falla con NG8002 diciendo que `formField`
  // no es una propiedad conocida de `input`, que despista bastante: el error
  // suena a atributo mal escrito y es una directiva sin importar.
  imports: [FormField],
  templateUrl: './cta.html',
})
export class Cta {
  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');

  /**
   * El modelo. Cadena vacía como valor inicial, nunca `null`: Signal Forms
   * deriva de aquí los tipos y un `null` rompe la inferencia.
   */
  protected readonly model = signal({ email: '' });

  protected readonly subscriptionForm = form(this.model, (path) => {
    required(path.email, { message: 'Escribe un correo para que podamos avisarte.' });
    email(path.email, { message: 'Ese correo no tiene forma de correo.' });
  });

  /** Estado 3 de 4: esperando. Deshabilita el botón y cambia su texto. */
  protected readonly sending = signal(false);

  /** Estado 4 de 4: enviado. Sustituye el formulario por la confirmación. */
  protected readonly done = signal(false);

  protected onSubmit(): void {
    // `submit()` marca todos los campos como tocados antes de ejecutar, que es
    // justo lo que hace que los errores aparezcan al intentar enviar en vacío.
    // El callback TIENE que ser `async` y devolver una promesa.
    submit(this.subscriptionForm, async () => {
      this.sending.set(true);

      // La espera simulada existe para que el estado de carga sea visible y
      // comprobable. Sin backend no hay nada que esperar de verdad.
      await new Promise((resolve) => setTimeout(resolve, 900));

      this.sending.set(false);
      this.done.set(true);
    });
  }

  constructor() {
    createMotionScope(this.root, (mm) => {
      mm.add(MOTION_OK, () => {
        gsap.to('[data-anim="reveal"]', {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.07,
          scrollTrigger: {
            trigger: this.root().nativeElement,
            start: 'top 70%',
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
