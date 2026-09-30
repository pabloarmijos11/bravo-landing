"""Verifica el contraste WCAG de los pares de color del sistema de diseno.

Uso:  py -3 scripts/contraste.py

`python` y `python3` no funcionan en esta maquina: el alias de ejecucion de la
Microsoft Store los intercepta. Siempre `py -3`.

Los valores se copian a mano desde src/styles.css. Si cambias un token alli,
cambialo aqui tambien -- este script no parsea el CSS a proposito, para que
actualizarlo obligue a mirar los dos sitios.

LO QUE ESTE SCRIPT DEMOSTRO
---------------------------
Ningun color de la escala de picante es "malo". Lo que pasa es que cada nivel
exige su propio color de texto encima, y el punto de cambio esta entre heat-3
(naranja) y heat-4 (rojo):

    heat-1, heat-2, heat-3  ->  texto  ink   (oscuro)
    heat-4, heat-5          ->  texto  bone  (claro)

Por eso cada `--color-heat-N` va emparejado con un `--color-heat-N-ink` en
styles.css. El texto que va encima de un nivel no se elige a ojo: viene dado
por el token. Mismo razonamiento que los tokens `on-photo-*` de altura-landing.
"""

UMBRAL_NORMAL = 4.5   # texto normal, WCAG AA
UMBRAL_GRANDE = 3.0   # texto grande (>=24px, o >=18.66px en negrita), WCAG AA


def luminancia(hex_color: str) -> float:
    """Luminancia relativa segun WCAG 2.x."""
    h = hex_color.lstrip("#")
    canales = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        canales.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    r, g, b = canales
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a: str, b: str) -> float:
    la, lb = luminancia(a), luminancia(b)
    claro, oscuro = max(la, lb), min(la, lb)
    return (claro + 0.05) / (oscuro + 0.05)


# --- Tokens del sistema -----------------------------------------------------

BONE = "#EDE9DF"
INK = "#1A1919"
BRAND = "#C4231F"

# (etiqueta, fondo, texto emparejado) -- el tercer valor es el token
# `--color-heat-N-ink` que acompana a cada nivel en styles.css.
ESCALA = [
    ("heat-1 aji criollo",  "#4E9B47", INK),
    ("heat-2 aji amarillo", "#E8B31F", INK),
    ("heat-3 rocoto",       "#E2701A", INK),
    ("heat-4 habanero",     "#C4231F", BONE),
    ("heat-5 el extremo",   "#1A1010", BONE),
]

# (etiqueta, texto, fondo, umbral)
PARES_BASE = [
    ("ink sobre bone",          INK,  BONE,  UMBRAL_NORMAL),
    ("bone sobre ink",          BONE, INK,   UMBRAL_NORMAL),
    ("bone sobre brand",        BONE, BRAND, UMBRAL_NORMAL),
    ("ink sobre brand (titular)", INK, BRAND, UMBRAL_GRANDE),
]


def main() -> int:
    pares = list(PARES_BASE)
    for etiqueta, fondo, texto in ESCALA:
        nombre_texto = "bone" if texto == BONE else "ink"
        pares.append((f"{nombre_texto} sobre {etiqueta}", texto, fondo, UMBRAL_NORMAL))

    ancho = max(len(p[0]) for p in pares)
    fallos = 0

    print(f"{'par canonico':<{ancho}}  {'ratio':>6}  {'minimo':>6}  estado")
    print("-" * (ancho + 26))

    for etiqueta, fg, bg, umbral in pares:
        r = ratio(fg, bg)
        ok = r >= umbral
        if not ok:
            fallos += 1
        print(f"{etiqueta:<{ancho}}  {r:>6.2f}  {umbral:>6.1f}  {'OK' if ok else 'FALLA'}")

    # Comprobacion extra: el texto contrario a cada nivel NO debe usarse.
    print()
    print("Combinaciones prohibidas (el texto contrario en cada nivel):")
    for etiqueta, fondo, texto in ESCALA:
        contrario = INK if texto == BONE else BONE
        nombre = "ink" if contrario == INK else "bone"
        r = ratio(contrario, fondo)
        print(f"  {nombre:<4} sobre {etiqueta:<20} {r:>6.2f}  <- no usar")

    print()
    if fallos:
        print(f"{fallos} par(es) canonico(s) por debajo de su umbral. Corregir antes de seguir.")
    else:
        print("Todos los pares canonicos cumplen WCAG AA.")
    return 1 if fallos else 0


if __name__ == "__main__":
    raise SystemExit(main())
