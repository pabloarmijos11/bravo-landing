"""Genera la textura de desgaste del titular como PNG pre-rasterizado.

Uso:  py -3 scripts/generar-textura.py

POR QUE EXISTE ESTE SCRIPT
--------------------------
La textura se hacia con un filtro SVG (feTurbulence) aplicado como mask-image.
Funcionaba, pero un filtro se EVALUA cada vez que el navegador necesita
rasterizar la capa -- y el titular del hero mide 730 px de alto y ademas se
mueve con el scroll. Chrome lo aguantaba a 59 FPS; Firefox perdia frames de
forma muy visible. Se confirmo aislandolo: quitando la mascara, Firefox iba
fluido.

Un PNG ya rasterizado no se evalua: solo se compone. Mismo aspecto, una
fraccion del coste.

La salida es `public/textura-titular.png`, en gris + ALFA (PNG color type 4).

El canal que manda es el alfa, no el gris, y es a proposito: `mask-image` con
una imagen usa por defecto `mask-mode: match-source`, que para un PNG significa
ALFA. Si la textura fuera escala de grises pura habria que forzar
`mask-mode: luminance`, cuyo soporte entre navegadores es irregular -- y el
problema que estamos resolviendo es justamente de compatibilidad.

Con alfa funciona el comportamiento por defecto en todas partes:
alfa 255 = se ve la letra, alfa 0 = mota recortada.

No usa PIL ni ninguna dependencia: escribe el PNG a mano con zlib y struct.
La semilla es fija, asi que regenerar da exactamente el mismo archivo.
"""

import struct
import zlib
from random import Random

# --- Parametros ------------------------------------------------------------
# Equivalen a los del feTurbulence que sustituyen, calibrados en navegador.

SIZE = 420          # igual que el mask-size anterior: a 240 se notaba el azulejo
SEED = 7            # fija, para que regenerar no cambie el diseno

# CELL tiene que DIVIDIR a SIZE de forma exacta, y lo mismo cada octava. Si no,
# la ultima celda se queda sin punto de rejilla (IndexError) y, peor, el patron
# deja de repetir sin costura: se veria la union del mosaico.
# 420 = 7 x 60, y 420 = 3 x 140. Las dos octavas encajan.
CELL = 7
OCTAVES = 2         # dos pasadas, como numOctaves='2'
UMBRAL = 0.88       # por encima de esto se recorta
SUAVIZADO = 0.035   # ancho del borde entre opaco y recortado

SALIDA = "public/textura-titular.png"


def suavizar(t: float) -> float:
    """Curva de Hermite: hace que la interpolacion no tenga esquinas."""
    return t * t * (3 - 2 * t)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def value_noise(size: int, cell: int, rnd: Random) -> list[list[float]]:
    """Ruido de valor: rejilla aleatoria interpolada suavemente.

    Se genera con envoltura (la ultima columna/fila repite la primera) para
    que el PNG se pueda repetir en mosaico sin costura visible.
    """
    if size % cell:
        raise ValueError(
            f"cell={cell} no divide a size={size}: el mosaico tendria costura"
        )

    n = size // cell + 1
    rejilla = [[rnd.random() for _ in range(n)] for _ in range(n)]

    # Envoltura: el borde derecho e inferior copian el izquierdo y el superior.
    for i in range(n):
        rejilla[i][-1] = rejilla[i][0]
        rejilla[-1][i] = rejilla[0][i]
    rejilla[-1][-1] = rejilla[0][0]

    salida = []
    for y in range(size):
        fila = []
        gy, ty = divmod(y, cell)
        fy = suavizar(ty / cell)
        for x in range(size):
            gx, tx = divmod(x, cell)
            fx = suavizar(tx / cell)
            arriba = lerp(rejilla[gy][gx], rejilla[gy][gx + 1], fx)
            abajo = lerp(rejilla[gy + 1][gx], rejilla[gy + 1][gx + 1], fx)
            fila.append(lerp(arriba, abajo, fy))
        salida.append(fila)
    return salida


def generar() -> bytes:
    rnd = Random(SEED)

    # Suma de octavas: cada una con celda mas pequena y menos peso.
    acumulado = [[0.0] * SIZE for _ in range(SIZE)]
    amplitud, total = 1.0, 0.0
    for o in range(OCTAVES):
        cell = max(2, CELL // (2 ** o))
        capa = value_noise(SIZE, cell, rnd)
        for y in range(SIZE):
            fila_capa, fila_acum = capa[y], acumulado[y]
            for x in range(SIZE):
                fila_acum[x] += fila_capa[x] * amplitud
        total += amplitud
        amplitud *= 0.5

    # Normalizar y aplicar el umbral.
    # Cada pixel son DOS bytes: gris y alfa. El gris se deja en 0 porque no
    # pinta nada (la mascara solo mira el alfa) y ademas comprime a casi cero
    # al ser constante.
    filas = bytearray()
    for y in range(SIZE):
        filas.append(0)  # byte de filtro PNG: 0 = sin filtro
        fila = acumulado[y]
        for x in range(SIZE):
            n = fila[x] / total
            # Transicion suave alrededor del umbral: el borde de la mota no
            # queda dentado. Por debajo del umbral -> opaco (se ve la letra).
            if n <= UMBRAL - SUAVIZADO:
                a = 255
            elif n >= UMBRAL + SUAVIZADO:
                a = 0
            else:
                t = (n - (UMBRAL - SUAVIZADO)) / (2 * SUAVIZADO)
                a = int(255 * (1 - suavizar(t)))
            filas.append(0)  # gris, irrelevante
            filas.append(a)  # alfa, el que manda

    return bytes(filas)


def escribir_png(ruta: str, datos: bytes, size: int) -> int:
    def chunk(tipo: bytes, contenido: bytes) -> bytes:
        c = tipo + contenido
        return struct.pack(">I", len(contenido)) + c + struct.pack(">I", zlib.crc32(c))

    # IHDR: ancho, alto, profundidad 8, tipo 4 (gris + alfa), sin entrelazado.
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 4, 0, 0, 0)

    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(datos, 9))
        + chunk(b"IEND", b"")
    )

    with open(ruta, "wb") as f:
        f.write(png)
    return len(png)


if __name__ == "__main__":
    print(f"Generando ruido {SIZE}x{SIZE} (semilla {SEED}, {OCTAVES} octavas)...")
    datos = generar()
    peso = escribir_png(SALIDA, datos, SIZE)
    print(f"Escrito {SALIDA} — {peso / 1024:.1f} kB")
    print("Si pesa demasiado, bajar SIZE; el patron se repite en mosaico.")
