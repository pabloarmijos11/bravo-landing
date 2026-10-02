import { Component } from '@angular/core';

import { Cta } from './components/cta/cta';
import { HeatScale } from './components/heat-scale/heat-scale';
import { Hero } from './components/hero/hero';
import { Origin } from './components/origin/origin';
import { Process } from './components/process/process';
import { SiteFooter } from './components/site-footer/site-footer';

/**
 * Raíz de composición.
 *
 * Las secciones se apilan aquí en orden. Este proyecto no tiene routing a
 * propósito: es una sola página, y las secciones son componentes, no rutas.
 *
 * La página temporal de verificación del sistema de diseño, que vivió aquí
 * desde la fase 1, se retiró al entrar las secciones reales: ya dan de sobra el
 * recorrido de scroll que los `pin` necesitan para soltarse. Lo que verificaba
 * —los pares de color— lo sigue comprobando `py -3 scripts/contraste.py`, que
 * es además el sitio correcto: por cálculo y no a ojo.
 */
@Component({
  selector: 'app-root',
  imports: [Hero, Origin, HeatScale, Process, Cta, SiteFooter],
  templateUrl: './app.html',
})
export class App {}
