"""Genera la imagen de previsualizacion social (Open Graph) del sitio.

Uso:  py -3 scripts/generar-og.py

POR QUE EXISTE ESTE SCRIPT
--------------------------
Las metas `og:image` necesitan un PNG de 1200x630 servido desde el propio
dominio. No se puede reutilizar nada del sitio: la textura del titular es una
mascara y el favicon mide 32 px.

Generarla con un script y no "a mano" en un editor tiene dos ventajas que
importan en este proyecto: los colores salen de `src/styles.css` —asi no hay un
tercer sitio donde los hex se dupliquen y se desincronicen— y si algun dia
cambia la paleta, la imagen se regenera con un comando.

POR QUE "BRAVO" CABE ENTERO, AL CONTRARIO QUE EN EL HERO
--------------------------------------------------------
En el hero el titular desborda 78 px por lado a proposito: ese recorte ES el
efecto de la referencia. Aqui no. Una previsualizacion social se ve como una
miniatura dentro de un chat o un timeline, y su unico trabajo es decir de quien
es el enlace. Un nombre de marca cortado por los lados a ese tamano no se lee
como una decision de diseno, se lee como una imagen mal recortada.

LA TIPOGRAFIA ES ARIAL NARROW BOLD, NO ANTON
--------------------------------------------
Anton viene de Google Fonts y no esta instalada en el sistema. Arial Narrow es
precisamente el respaldo que `styles.css` ya le asigna al titular con las
metricas ajustadas (`size-adjust: 83.9%`), asi que es la sustitucion coherente:
la misma condensada que vera cualquiera a quien le falle la descarga de Anton.

POR QUE JPEG Y NO PNG
---------------------
El grano es ruido pixel a pixel, que es justo lo que un PNG no puede comprimir:
la primera version pesaba 541 kB. En JPEG con calidad 88 son unas seis veces
menos, y el artefacto de compresion no se nota sobre un fondo con grano — ya hay
ruido ahi. `subsampling=0` conserva el canal de color a resolucion completa,
para que el borde del titular negro no sangre sobre el hueso.

La salida es `public/og.jpg`. Se sirve suelta, no entra en el bundle de
JavaScript ni de CSS: solo la descargan los rastreadores que generan la tarjeta.
"""

from __future__ import annotations

import random
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Falta Pillow. Instalalo con:  py -3 -m pip install Pillow")
    sys.exit(1)

RAIZ = Path(__file__).resolve().parent.parent
STYLES = RAIZ / "src" / "styles.css"
SALIDA = RAIZ / "public" / "og.jpg"

ANCHO, ALTO = 1200, 630

# Arial Narrow Bold para el titular, Arial para el resto. Las dos vienen con
# Windows; si alguna falta, el script lo dice en vez de caer en una fuente
# de mapa de bits ilegible.
FUENTE_TITULAR = Path("C:/Windows/Fonts/ARIALNB.TTF")
FUENTE_CUERPO = Path("C:/Windows/Fonts/arial.ttf")
FUENTE_CUERPO_CURSIVA = Path("C:/Windows/Fonts/ariali.ttf")

# Semilla fija: regenerar el PNG no debe cambiar el grano. Es la misma razon
# por la que generar-textura.py fija la suya.
SEMILLA = 11_09_2007


def leer_tokens() -> dict[str, str]:
    """Saca los `--color-*` del @theme de styles.css.

    Se parsea el CSS en vez de copiar los hex aqui porque este script no es la
    fuente de verdad del color: lo es styles.css. contraste.py los copia a mano
    y lo declara en su cabecera; esto es un paso mejor y cuesta tres lineas.
    """
    css = STYLES.read_text(encoding="utf-8")
    return {
        nombre: valor
        for nombre, valor in re.findall(r"--color-([\w-]+):\s*(#[0-9a-fA-F]{6})", css)
    }


def rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def cargar(ruta: Path, tamano: int) -> ImageFont.FreeTypeFont:
    if not ruta.exists():
        print(f"No encuentro la fuente {ruta}.")
        sys.exit(1)
    return ImageFont.truetype(str(ruta), tamano)


def ajustar_al_ancho(
    texto: str, ruta: Path, objetivo: int, maximo: int = 460
) -> ImageFont.FreeTypeFont:
    """Busca el cuerpo que hace que `texto` mida `objetivo` px de ancho.

    A mano saldria un numero magico que se rompe al cambiar una letra del
    texto. Asi el titular siempre ocupa la misma proporcion del lienzo.
    """
    for tamano in range(maximo, 10, -2):
        fuente = cargar(ruta, tamano)
        if fuente.getbbox(texto)[2] <= objetivo:
            return fuente
    return cargar(ruta, 12)


def grano(img: Image.Image, intensidad: int = 10) -> None:
    """Ruido monocromo sobre el fondo. El fondo del sitio nunca es plano.

    Se dibuja pixel a pixel con una semilla fija: 1200x630 son 756 000 puntos,
    lo que tarda un segundo y se ejecuta una vez.
    """
    random.seed(SEMILLA)
    pixeles = img.load()
    for y in range(ALTO):
        for x in range(ANCHO):
            d = random.randint(-intensidad, intensidad)
            r, g, b = pixeles[x, y][:3]
            pixeles[x, y] = (
                max(0, min(255, r + d)),
                max(0, min(255, g + d)),
                max(0, min(255, b + d)),
            )


def main() -> int:
    tokens = leer_tokens()
    faltan = [t for t in ("bone", "ink", "brand") if t not in tokens]
    if faltan:
        print(f"No encuentro estos tokens en styles.css: {', '.join(faltan)}")
        return 1

    bone, ink, brand = (rgb(tokens[t]) for t in ("bone", "ink", "brand"))
    niveles = [rgb(tokens[f"heat-{n}"]) for n in range(1, 6)]

    img = Image.new("RGB", (ANCHO, ALTO), bone)
    grano(img)
    dibujo = ImageDraw.Draw(img)

    # Eyebrow, arriba a la izquierda. En el sitio es manuscrita (Caveat); aqui
    # va en cursiva, que es lo mas parecido que da una fuente del sistema.
    eyebrow = cargar(FUENTE_CUERPO_CURSIVA, 34)
    dibujo.text((72, 62), "Salsas de ají, hechas a mano", font=eyebrow, fill=brand)

    # El titular, al 90 % del ancho del lienzo y centrado.
    titular = ajustar_al_ancho("BRAVO", FUENTE_TITULAR, int(ANCHO * 0.90))
    caja = dibujo.textbbox((0, 0), "BRAVO", font=titular)
    dibujo.text(
        ((ANCHO - (caja[2] - caja[0])) / 2 - caja[0], 150 - caja[1]),
        "BRAVO",
        font=titular,
        fill=ink,
    )

    # Los cinco grados, como cinco bloques de color a lo ancho. Es lo que
    # cuenta de que va el sitio sin tener que escribirlo.
    alto_barra, margen, hueco = 54, 72, 10
    util = ANCHO - margen * 2 - hueco * (len(niveles) - 1)
    ancho_barra = util / len(niveles)
    y_barra = ALTO - 72 - alto_barra

    for i, color in enumerate(niveles):
        x = margen + i * (ancho_barra + hueco)
        dibujo.rectangle(
            [x, y_barra, x + ancho_barra, y_barra + alto_barra],
            fill=color,
            outline=ink,
            width=2,
        )

    pie = cargar(FUENTE_CUERPO, 28)
    dibujo.text(
        (margen, y_barra - 48),
        "Cinco grados de calor · ajíes ecuatorianos",
        font=pie,
        fill=ink,
    )

    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    img.save(SALIDA, "JPEG", quality=88, subsampling=0, optimize=True)
    print(f"Escrito {SALIDA.relative_to(RAIZ)} ({SALIDA.stat().st_size / 1024:.1f} kB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
