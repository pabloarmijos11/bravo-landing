import { Component, input } from '@angular/core';

/**
 * Botella de salsa ilustrada en SVG.
 *
 * Una sola botella para los cinco niveles: el color del contenido entra por
 * `[style.--bottle-fill]` desde el componente que la usa, así que añadir una
 * salsa nueva no añade un archivo. Era la razón de elegir SVG sobre fotografía,
 * y cinco ficheros idénticos salvo un `fill` la habrían desperdiciado.
 *
 * Las partes van marcadas con `data-part` —`cap`, `glass`, `sauce`, `label`,
 * `shine`— como puntos de anclaje por si alguna vez hay que animarlas por
 * separado. **Hoy no las anima nadie**, y está dicho a propósito: el plan de la
 * fase 5 preveía dibujar el contorno con `DrawSVGPlugin` y no se hizo —el
 * plugin terminó usándose solo en la línea del proceso—, así que el
 * `data-anim="outline"` que había aquí se retiró. En este proyecto `data-anim`
 * significa «esto lo mueve GSAP», y un selector futuro que barra `[data-anim]`
 * no debe encontrar elementos que nadie anima.
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
