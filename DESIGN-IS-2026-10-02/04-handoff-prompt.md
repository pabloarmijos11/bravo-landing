# Traspaso a `/make-plan`

Prompt autocontenido: la próxima sesión no verá esta auditoría salvo por lo que
está citado aquí dentro.

````
/make-plan Refinar la landing de bravo-landing a partir de una auditoría Dieter Rams (total 24/30).

Veredicto citado de 03-verdict.md:
> 24/30, sin ningún principio por debajo de 2: los cimientos están bien puestos y lo que queda es ajuste, no reconstrucción.

Contexto: landing de una sola página para Bravo, marca FICTICIA de salsas picantes ecuatorianas. Angular 21 zoneless + Tailwind v4 + GSAP 3.15, sin backend, sin routing, sin modo oscuro (deliberado). Umbral de bundle autoimpuesto: 130 kB; hoy está en 121,55. El objetivo real del proyecto es aprender GSAP con scroll cinematográfico, y eso condiciona qué notas tiene sentido subir.

Conservar (ya puntúan 3 — NO tocar en esta pasada):
- Principio #3 (estético) — Evidencia: espaciado íntegramente múltiplo de 4; 0 hex crudos y 0 utilidades de color de fábrica en src/app; 8 colores renderizados de 14 tokens. Comprobación de regresión: `grep -rnoE "\b(bg|text|border)-(red|blue|green|gray|slate)-[0-9]{2,3}" src/app/` debe seguir dando 0.
- Principio #4 (comprensible) — Evidencia: jerarquía de encabezados 1,2,2,…,3,3 sin saltos; aria-label en los dos botones de icono; label visible en el formulario. Regresión: volver a listar h1–h6 y confirmar que no hay saltos de nivel.
- Principio #6 (honesto) — Evidencia: 0 superlativos, 0 patrones oscuros, 0 href="#"; el pie declara que la marca es ficticia (site-footer.html:60); el habanero declara que no es nativo. Regresión: el grep de superlativos sigue en 0 y la nota del pie sigue ahí.
- Principio #8 (minucioso) — Evidencia: los seis estados presentes (vacío, carga, error, éxito, foco, deshabilitado); 0 objetivos táctiles < 44 px; 0 scroll horizontal a 375/768/1024/1440. Regresión: repetir la medición de los cuatro anchos y el recuento de objetivos pequeños.

Arreglar, en este orden:

1. Principio #2 (útil): dar una vía rápida al formulario. El documento mide 10 008 px, el CTA está al final y los únicos atajos son los cinco enlaces del pie, que están todavía más abajo que el propio formulario. Evidencia: 01-evidence.md E1 y E5 (0 enlaces de salto). Restricción: NO una barra de navegación completa — el principio #5 se sostiene hoy precisamente porque no hay chrome; busca un acceso persistente discreto o un enlace de salto al inicio del documento.

2. Principio #10 y #2 (redundancia): el carrusel repite el contenido de la escala de picante. Los cinco productos llevan la misma variedad, el mismo rango SHU y la misma especie que los cinco grados que la escala ya ha recorrido con más despliegue. Evidencia: products.ts:95-160 frente a heat-scale.ts:129-179. Movimiento: diferenciar qué aporta cada sección — la escala enseña cuánto pica, el carrusel debería enseñar qué comprarías (formato, maridaje, cuándo usarla). Es cambio de copy, no de estructura.

3. Principio #10 (sobra): quitar el punto de color que acompaña a «Grado N» en cada tarjeta del carrusel; repite en color lo que el texto dice al lado. Evidencia: products.html, el span con [style.background-color] y aria-hidden.

Fuera de alcance en esta pasada:
- Los principios #1 (innovador) y #7 (duradero), que puntúan 2 porque el proyecto eligió a propósito una técnica reconocible; subirlos exigiría renunciar al objetivo de aprendizaje.
- Sustituir Signal Forms por un input nativo. Cuesta 18,87 kB por un solo campo de correo y es el primer sitio donde mirar si alguna vez hay que bajar de 100 kB, pero practicar Signal Forms ERA el objetivo. Queda anotado, no se toca.
- Acortar el pin de la escala de picante. Mejoraría el principio #5 y empeoraría el proyecto como vehículo de aprendizaje.
- Añadir modo oscuro.

Entregables del plan:
- Por arreglo: ficheros objetivo, cambio exacto y paso de verificación.
- Lista de regresión para los cuatro principios de la sección «Conservar».
- Medición del bundle antes y después; el techo sigue siendo 130 kB.

Anti-patrones a vigilar:
- Añadir abstracciones donde basta un cambio directo.
- Reestilizar zonas que ya puntúan 3.
- Convertir el arreglo 1 en una barra de navegación y hundir el principio #5.
- Que el arreglo 2 se vuelva una reescritura de la sección en vez de un cambio de copy.
````
