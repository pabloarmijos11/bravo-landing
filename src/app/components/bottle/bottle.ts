import { Component, input } from '@angular/core';

/**
 * Botella de salsa ilustrada en SVG.
 *
 * Una sola botella para los cinco niveles: el color del contenido entra por
 * `[style.--bottle-fill]` desde el componente que la usa, así que añadir una
 * salsa nueva no añade un archivo. Era la razón de elegir SVG sobre fotografía,
 * y cinco ficheros idénticos salvo un `fill` la habrían desperdiciado.
 *
 * Partes con `data-part` para poder animarlas por separado con GSAP:
 * `cap`, `glass`, `sauce`, `label`, `shine`.
 *
 * El trazo del contorno lleva `data-anim="outline"` para dibujarlo con
 * DrawSVGPlugin en la fase 5.
 */
@Component({
  selector: 'app-bottle',
  templateUrl: './bottle.html',
  host: {
    '[style.--bottle-fill]': 'fill()',
  },
})
export class Bottle {
  /** Color del contenido. Cualquier valor CSS válido. */
  readonly fill = input<string>('var(--color-brand)');

  /** Texto de la etiqueta. Corto: el espacio es de unos 10 caracteres. */
  readonly labelText = input<string>('BRAVO');
}
