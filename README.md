# Bravo — landing de salsas picantes

Landing page de una sola página para **Bravo**, una marca **ficticia** de salsas
picantes artesanales hechas con ajíes ecuatorianos. No es un producto real y no
hay nada que comprar.

Es un proyecto de práctica. Su objetivo es aprender **animación de scroll con
GSAP** (`ScrollTrigger` con `pin` y `scrub`) y trabajar el diseño visual con más
ambición que en proyectos anteriores.

![Angular](https://img.shields.io/badge/Angular-21.2-dd0031)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.1-38bdf8)
![GSAP](https://img.shields.io/badge/GSAP-3.15-88ce02)

---

## Requisitos

- Node 24.14.1 o superior
- npm 11.11.0 o superior
- Python 3 (opcional, solo para el script de contraste)

## Cómo ejecutarlo

```bash
npm install
npm start
```

La aplicación queda en `http://localhost:4200/`.

Para el build de producción:

```bash
npm run build
```

La salida va a `dist/bravo-landing/`.

## Verificar la paleta

El proyecto no confía en el ojo para el contraste. Los pares de color se calculan:

```bash
py -3 scripts/contraste.py
```

En Windows hay que invocar Python con `py -3`: `python` y `python3` los intercepta
el alias de ejecución de la Microsoft Store.

## Estructura

```
bravo-landing/
├─ CLAUDE.md                  convenciones y reglas del proyecto
├─ design-system/bravo/
│  └─ MASTER.md               sistema de diseño: color, tipografía, motion
├─ scripts/
│  └─ contraste.py            verificación WCAG de la paleta
└─ src/
   ├─ index.html              tipografías de Google Fonts
   ├─ styles.css              tokens de diseño (@theme) y utilidades propias
   └─ app/
      ├─ app.html             composición de las secciones
      ├─ components/          una carpeta por sección de la página
      ├─ animations/          integración de GSAP y reduced-motion
      └─ assets/bottles/      ilustraciones SVG de las botellas
```

## Decisiones de diseño

**Sin routing.** Es una sola página: las secciones son componentes apilados, no
rutas.

**Sin modo oscuro.** La identidad visual depende del fondo color hueso; un tema
oscuro duplicaría el sistema de color sin aportar nada al objetivo del proyecto.

**Las botellas son SVG, no fotos.** Tienen que superponerse a los titulares, lo que
exige transparencia. Además así el color de cada salsa es una variable CSS.

**Una sola librería de animación.** Todo el movimiento va con GSAP. El carrusel usa
`Draggable` en vez de añadir una segunda librería solo para eso.

## Accesibilidad

- Contraste verificado por cálculo en todos los pares de color, mínimo WCAG AA.
- `prefers-reduced-motion` respetado desde el primer componente animado: con la
  preferencia activada el contenido se muestra en su estado final, nunca oculto ni
  a medio camino.
- El carrusel de productos es navegable por teclado, no solo arrastrable.

## Inspiración

La dirección visual se estudió a partir de [royalbev.com](https://royalbev.com).
Se tomaron principios —el fondo texturizado, la jerarquía de tres tipografías, el
producto superpuesto al titular, la inversión cromática por sección— **no** su
código, sus imágenes ni sus tipografías.

## Licencia

Pendiente de decidir. Marca, textos y producto son ficticios.
