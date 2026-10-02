# Puntuación

Rúbrica 0–3 por principio, anclas aplicadas al pie de la letra. Dos reglas que
se han respetado y que explican varios 2: **ante la duda, se elige la nota más
baja**, y **se puntúa la peor instancia, no la media**.

---

**1. Good design is innovative — 2/3**
Evidencia: E1 (7 triggers, 2 pins), E2 (sistema de color de 14 tokens con pares
de rol por fondo).
Justificación: refresca patrones existentes —scroll pineado, carrusel
arrastrable— con una mejora clara y bien ejecutada, pero ninguno es un patrón
que no se vea en cinco productos comparables; el 3 exige un patrón nuevo.

**2. Good design makes a product useful — 2/3**
Evidencia: E1 (15 interactivos, sin acciones señuelo), E4 (0 modales al cargar).
Justificación: la tarea principal se completa y no hay distracciones, pero la
superficie añade pasos — el formulario está al final de ~10 000 px de documento,
el pin de la escala consume 4 pantallas de scroll y **no hay navegación superior**,
así que el único atajo son los enlaces del pie, que están todavía más abajo.

**3. Good design is aesthetic — 3/3**
Evidencia: E2 (espaciado íntegramente múltiplo de 4; 0 hex crudos; 0 utilidades
de color de fábrica; 8 colores renderizados de 14 tokens).
Justificación: un solo sistema visible gobierna espaciado, tipografía y color,
sin estilos huérfanos — no se detectó ninguna inconsistencia en la superficie
auditada.

**4. Good design makes a product understandable — 3/3**
Evidencia: E5 (jerarquía sin saltos, `aria-label` en botones de icono, etiqueta
visible en el formulario), E3 (0 desajustes etiqueta→comportamiento).
Justificación: cada control se nombra solo —incluido el carrusel, que lleva su
instrucción de uso escrita— y ninguno necesita explicación adicional.

**5. Good design is unobtrusive — 2/3**
Evidencia: E4 (0 animaciones en reposo, 0 banners), E1 (pin de la escala en
`+=400%`).
Justificación: no hay chrome que compita —ni barras, ni modales, ni cookies— pero
el recorrido pineado reclama cuatro pantallas de scroll para entregar cinco
datos, y ahí la puesta en escena pesa más que el contenido que transporta.

**6. Good design is honest — 3/3**
Evidencia: E3 (0 superlativos, 0 patrones oscuros, 0 enlaces muertos; la marca se
declara ficticia; el habanero declara que no es nativo; SHU en rangos).
Justificación: cada afirmación se corresponde con la realidad, y en tres puntos
el proyecto dice algo que le habría resultado más cómodo callar.

**7. Good design is long-lasting — 2/3**
Evidencia: E2 (tipografía condensada a gran tamaño, textura de papel, color
plano), E1 (2 secciones pineadas).
Justificación: el lenguaje gráfico es un revival de impresión que no caduca con
el año, pero el scroll cinematográfico con `pin` + `scrub` es un marcador de
época reconocible — un marcador datado, que es exactamente el ancla del 2.

**8. Good design is thorough down to the last detail — 3/3**
Evidencia: E2 (los seis estados presentes y verificados), E5 (0 objetivos
pequeños, 0 scroll horizontal en cuatro anchos, `reduced-motion` en JS).
Justificación: vacío, carga, error, éxito, foco y deshabilitado están todos
resueltos, y el cuidado llega a sitios que casi nadie mira — el contraste de los
colores *intermedios* de un fondo que se anima.

**9. Good design is environmentally friendly — 2/3**
Evidencia: E4 (116,63 kB de JS inicial; 0 animaciones en reposo;
`prefers-reduced-motion` respetado; sin modo oscuro).
Justificación: no llega al 3 por dos condiciones del ancla —el JS inicial supera
los 100 kB y no hay modo oscuro— aunque ambas sean decisiones conscientes;
cumple holgadamente el 2, con el movimiento condicionado y nada animándose en
reposo.

**10. Good design is as little design as possible — 2/3**
Evidencia: E1 (394 elementos, 15 interactivos, profundidad 13; el hero renunció
a su copy descriptivo).
Justificación: la disciplina es alta y el hero demuestra que se sabe quitar, pero
quedan un par de elementos cuya desaparición no rompería nada — el punto de color
de cada tarjeta, redundante con el «Grado N» que tiene al lado, y el brillo de la
botella SVG.

---

## Total: **24 / 30**

Ningún principio por debajo de 2.

| Principio | Nota |
|---|---|
| 1. Innovative | 2 |
| 2. Useful | 2 |
| 3. Aesthetic | **3** |
| 4. Understandable | **3** |
| 5. Unobtrusive | 2 |
| 6. Honest | **3** |
| 7. Long-lasting | 2 |
| 8. Thorough | **3** |
| 9. Environmentally friendly | 2 |
| 10. As little design as possible | 2 |
