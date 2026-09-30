import { Component } from '@angular/core';

import { Hero } from './components/hero/hero';

/**
 * Raíz de composición.
 *
 * Las secciones se apilan aquí en orden. Este proyecto no tiene routing a
 * propósito: es una sola página, y las secciones son componentes, no rutas.
 *
 * Debajo del hero queda todavía la página temporal de verificación del sistema
 * de diseño (fase 1). Se va cayendo a medida que entran las secciones reales;
 * mientras tanto da recorrido de scroll, que el `pin` del hero necesita para
 * poder soltarse.
 */
@Component({
  selector: 'app-root',
  imports: [Hero],
  templateUrl: './app.html',
})
export class App {
  /**
   * Los cinco niveles de la escala, en orden de intensidad.
   *
   * Las clases van escritas ENTERAS, no compuestas (`'bg-' + token`). Tailwind
   * escanea el código fuente buscando nombres de clase literales: una clase
   * construida por concatenación nunca aparece en el fuente y su utilidad no
   * se genera, así que el bloque sale sin color y sin ningún error.
   */
  protected readonly heatLevels = [
    {
      pepper: 'Ají criollo',
      scoville: '500 – 2 500 SHU',
      classes: 'bg-heat-1 text-heat-1-ink',
    },
    {
      pepper: 'Ají amarillo',
      scoville: '30 000 – 50 000 SHU',
      classes: 'bg-heat-2 text-heat-2-ink',
    },
    {
      pepper: 'Rocoto',
      scoville: '50 000 – 100 000 SHU',
      classes: 'bg-heat-3 text-heat-3-ink',
    },
    {
      pepper: 'Habanero',
      scoville: '100 000 – 350 000 SHU',
      classes: 'bg-heat-4 text-heat-4-ink',
    },
    {
      pepper: 'El extremo',
      scoville: '+350 000 SHU',
      classes: 'bg-heat-5 text-heat-5-ink',
    },
  ];
}
