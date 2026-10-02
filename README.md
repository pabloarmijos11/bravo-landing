# Bravo — landing de salsas picantes

Landing page de una sola página para **Bravo**, una marca **ficticia** de salsas
picantes artesanales hechas con ajíes ecuatorianos. No es un producto real y no
hay nada que comprar.

Es un proyecto de práctica. Su objetivo es aprender **animación de scroll con
GSAP** (`ScrollTrigger` con `pin` y `scrub`) y trabajar el diseño visual con más
ambición que en proyectos anteriores.

**Demo:** https://bravo-landing-nine.vercel.app

![Angular](https://img.shields.io/badge/Angular-21.2-dd0031)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.3-38bdf8)
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
├─ vercel.json                cabeceras de seguridad del despliegue
├─ DESIGN-IS-2026-10-02/      auditoría contra los principios de Dieter Rams
├─ design-system/bravo/
│  └─ MASTER.md               sistema de diseño: color, tipografía, motion
├─ scripts/
│  └─ contraste.py            verificación WCAG de la paleta
└─ src/
   ├─ index.html              tipografías de Google Fonts
   ├─ styles.css              tokens de diseño (@theme) y utilidades propias
   └─ app/
      ├─ app.html             composición de las secciones
      ├─ components/          una carpeta por sección, más bottle/
      └─ animations/          integración de GSAP y reduced-motion
```

Las siete secciones son `hero`, `origin`, `heat-scale`, `products`, `process`,
`cta` y `site-footer`. `bottle` no es una sección: es la ilustración SVG de la
botella, parametrizada por color, que usan el hero y el carrusel.

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

## Despliegue

El sitio es estático y se despliega solo en cada push a `master`. Se publican
únicamente los cinco archivos del build: el `CLAUDE.md`, la auditoría y el sistema
de diseño se quedan en el repositorio.

`vercel.json` lleva las cabeceras de seguridad (CSP, `X-Frame-Options`, `nosniff`,
`Referrer-Policy`, `Permissions-Policy`). **Si se añade una fuente externa, una
imagen remota o una llamada a una API, hay que tocar la CSP o fallará en silencio.**

Por lo mismo, `inlineCritical` está desactivado en `angular.json`: la optimización
de CSS crítico de Angular carga la hoja con `onload` inline, y la CSP lo bloquea
—la página sale entera sin estilos—. El porqué completo está en el `CLAUDE.md`.

## Licencia

Pendiente de decidir. Marca, textos y producto son ficticios.
