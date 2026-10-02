import { Component } from '@angular/core';

/**
 * Pie del sitio.
 *
 * Es el único componente de la página sin animación: no hay nada que revelar
 * en un pie, y añadirle movimiento sería ruido. No lleva `createMotionScope`
 * a propósito, no por olvido.
 */
@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.html',
})
export class SiteFooter {
  /**
   * Los enlaces del pie.
   *
   * Cada `href` apunta a un `id` que existe de verdad en esta página:
   * `origen` y `proceso` en sus componentes, `escala` en heat-scale,
   * `salsas` en el carrusel y `suscripcion` en el CTA. Si se renombra o se
   * borra una sección, hay que tocar esta lista — un enlace roto aquí es el
   * mismo defecto que un `href="#"`, solo que más difícil de ver.
   */
  protected readonly links = [
    { href: '#origen', label: 'Origen' },
    { href: '#escala', label: 'Escala de picante' },
    { href: '#salsas', label: 'Las cinco salsas' },
    { href: '#proceso', label: 'Cómo se hace' },
    { href: '#suscripcion', label: 'Avisarme de la próxima tanda' },
  ];
}
