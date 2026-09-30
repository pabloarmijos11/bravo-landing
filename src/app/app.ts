import { Component, signal } from '@angular/core';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { MotionProbe } from './components/motion-probe/motion-probe';

/**
 * Raíz de composición.
 *
 * Ahora mismo muestra una página temporal de verificación del sistema de
 * diseño (fase 1) y del patrón de animación (fase 2). En la fase 3 se
 * sustituye por las siete secciones apiladas — este proyecto no tiene routing
 * a propósito: las secciones son componentes, no rutas.
 */
@Component({
  selector: 'app-root',
  imports: [MotionProbe],
  templateUrl: './app.html',
})
export class App {
  // --- TEMPORAL: verificación del patrón de animación (fase 2) -------------

  /** Monta o desmonta las sondas, para comprobar que la limpieza funciona. */
  protected readonly probesVisible = signal(true);

  /** Último recuento de ScrollTriggers vivos. */
  protected readonly triggerCount = signal<number | null>(null);

  protected toggleProbes(): void {
    this.probesVisible.update((visible) => !visible);
  }

  /**
   * Cuenta los `ScrollTrigger` registrados globalmente.
   *
   * Es la prueba de que `mm.revert()` limpia de verdad: con las sondas
   * montadas debe haber 2, y al desmontarlas debe volver a 0. Si al
   * desmontarlas siguiera habiendo 2, cada navegación dejaría listeners vivos
   * sobre nodos muertos.
   */
  protected countTriggers(): void {
    this.triggerCount.set(ScrollTrigger.getAll().length);
  }

  // --- Sistema de diseño (fase 1) -----------------------------------------

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
