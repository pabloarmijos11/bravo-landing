import { Component } from '@angular/core';

import { HeatScale } from './components/heat-scale/heat-scale';
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
  imports: [Hero, HeatScale],
  templateUrl: './app.html',
})
export class App {}
