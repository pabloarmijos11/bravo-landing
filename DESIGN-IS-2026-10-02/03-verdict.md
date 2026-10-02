# Veredicto: REFINE

**24/30, sin ningún principio por debajo de 2: los cimientos están bien puestos
y lo que queda es ajuste, no reconstrucción.**

La regla es mecánica — total ≥ 20 y ningún 0 — y aquí se cumple con margen. Los
cuatro treses no están repartidos al azar: caen en *estético*, *comprensible*,
*honesto* y *minucioso*, que son precisamente los que no se arreglan al final.
Los seises que faltan están en dimensiones que o bien son consecuencia directa
del objetivo del proyecto (*innovador*, *duradero*) o bien tienen arreglo
acotado (*útil*, *discreto*, *sostenible*, *lo menos posible*).

## Una advertencia sobre cómo leer esto

Tres de las seis notas de 2 chocan con decisiones que el proyecto tomó **a
sabiendas y por escrito**:

- El pin largo de la escala *es* el ejercicio de GSAP que da nombre al proyecto.
- Los 18,87 kB de Signal Forms se pagaron para practicar Signal Forms.
- El scroll cinematográfico es un marcador de época porque el objetivo era
  aprender scroll cinematográfico.

La auditoría puntúa **lo que es, no lo que se pretendía** — esa es su regla. Pero
la decisión de actuar sobre estas notas es de Pablo, y rechazarlas es legítimo:
bajar el pin de la escala mejoraría el principio 5 y empeoraría el proyecto como
vehículo de aprendizaje. **Lo que no sería legítimo es no saberlo.**

## Movimientos de mayor palanca

En orden de relación valor/coste.

### 1. No hay forma rápida de llegar al formulario — principio #2

El documento mide 10 008 px y el CTA está al final. Los únicos atajos son los
cinco enlaces del pie, que están todavía más abajo que el propio formulario.
Quien llega decidido a dejar su correo tiene que recorrerlo todo.

**Evidencia:** E1 (10 008 px de documento), E5 (0 enlaces de salto).
**Movimiento:** un acceso persistente y discreto al CTA, o un enlace de salto al
inicio del documento. No una barra de navegación completa — eso rompería el
principio 5, que ahora mismo se sostiene porque no hay chrome.

### 2. El carrusel es redundante con la escala — principios #10 y #2

Las cinco salsas repiten, tarjeta a tarjeta, los mismos cinco ajíes con los
mismos rangos SHU y la misma especie que la escala de picante ya ha recorrido
con mucho más despliegue. Son dos secciones para un mismo contenido.

**Evidencia:** `products.ts:95-160` y `heat-scale.ts:129-179` — `scoville`,
`species` y variedad coinciden en los cinco.
**Movimiento:** diferenciar qué aporta cada una. La escala enseña *cuánto pica*;
el carrusel debería enseñar *qué comprarías* — formato, maridaje, cuándo usarla.
Es un cambio de copy, no de estructura.

### 3. 116,63 kB de JS, y 18,87 son un campo de correo — principio #9

**Evidencia:** E4, tabla de reparto del bundle.
**Movimiento:** si alguna vez hay que bajar de 100 kB, el formulario es el primer
sitio donde mirar — un `<input>` con validación nativa y un signal haría lo mismo
por ~0 kB. **Contraindicado hoy:** practicar Signal Forms era el objetivo. Queda
anotado para cuando deje de serlo.

### 4. Dos elementos que no se ganan su sitio — principio #10

**Evidencia:** `products.html` — el punto de color junto a «Grado N» repite en
color lo que el texto ya dice; y el `data-part="shine"` de la botella.
**Movimiento:** quitar el punto de color. Es la única de las cuatro que se puede
hacer en un minuto y sin discutir nada.

### 5. Nada que hacer en #1 y #7 sin cambiar la premisa

**Innovador** y **duradero** están donde están porque el proyecto eligió aprender
una técnica concreta y reconocible. Subirlos exigiría renunciar al objetivo.
Se dejan explícitamente fuera del siguiente paso.
