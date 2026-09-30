import { DestroyRef, ElementRef, Signal, afterNextRender, inject } from '@angular/core';
import { gsap } from 'gsap';

import { setupGsap } from './gsap-setup';

/**
 * Construye las animaciones de una sección. Recibe el `MatchMedia` al que hay
 * que añadirlas con `mm.add(condición, callback)`.
 */
export type MotionBuilder = (mm: gsap.MatchMedia) => void;

/** Se anima con normalidad. */
export const MOTION_OK = '(prefers-reduced-motion: no-preference)';

/** El usuario pidió menos movimiento: estado final, sin recorrido. */
export const MOTION_REDUCED = '(prefers-reduced-motion: reduce)';

/**
 * Registra las animaciones de un componente con el ciclo de vida ya resuelto.
 *
 * **Se llama desde el constructor del componente**, no desde un método: tanto
 * `afterNextRender` como `inject(DestroyRef)` necesitan contexto de inyección.
 *
 * ```ts
 * export class Hero {
 *   private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
 *
 *   constructor() {
 *     createMotionScope(this.root, (mm) => {
 *       mm.add(MOTION_OK, () => {
 *         gsap.to('[data-anim="title"]', { y: 0, opacity: 1, duration: 0.8 });
 *       });
 *       mm.add(MOTION_REDUCED, () => {
 *         gsap.set('[data-anim="title"]', { y: 0, opacity: 1 });
 *       });
 *     });
 *   }
 * }
 * ```
 *
 * Qué resuelve, y por qué cada pieza:
 *
 * 1. **`afterNextRender`** — GSAP necesita nodos reales en el DOM. Es además
 *    el único gancho que no se ejecuta en servidor; `ngAfterViewInit` sí corre
 *    bajo SSR, donde no hay `window` y GSAP revienta.
 *
 * 2. **El scope del `matchMedia`** — los selectores de dentro se resuelven
 *    SOLO dentro del elemento raíz del componente. Sin él, un selector como
 *    `'[data-anim="title"]'` barre el documento entero y alcanza a los demás
 *    componentes: la encapsulación de estilos de Angular aísla el CSS, no los
 *    selectores de JavaScript.
 *
 * 3. **`mm.revert()` al destruir** — mata las animaciones y, sobre todo, los
 *    `ScrollTrigger` que hayan creado. Omitirlo deja listeners globales vivos
 *    escuchando el scroll sobre nodos que ya no existen: es el bug número uno
 *    de GSAP en aplicaciones de una sola página.
 *
 * 4. **`matchMedia` en vez de `gsap.context()`** — `MatchMedia` mantiene su
 *    propio array de `contexts` y su propio `revert()`. Envolverlo además en
 *    un `gsap.context()` sería una capa redundante, y de fiabilidad dudosa:
 *    los callbacks de `mm.add()` se ejecutan cuando la media query pasa a
 *    coincidir, no cuando corre el contexto exterior, así que ese contexto no
 *    los captura de forma fiable.
 *
 * No hace falta `NgZone.runOutsideAngular()`: la aplicación es zoneless, así
 * que `requestAnimationFrame` no está parcheado y GSAP no dispara detección de
 * cambios en cada frame. Casi todos los tutoriales dicen lo contrario porque
 * dan por hecho Zone.js.
 */
export function createMotionScope(
  root: Signal<ElementRef<HTMLElement>>,
  build: MotionBuilder,
): void {
  const destroyRef = inject(DestroyRef);

  afterNextRender(() => {
    setupGsap();

    const mm = gsap.matchMedia(root().nativeElement);
    build(mm);

    destroyRef.onDestroy(() => mm.revert());
  });
}
