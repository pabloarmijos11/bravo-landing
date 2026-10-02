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

# Muestras por tramo al analizar la rampa animada de la fase 4. 40 por tramo
# da una resolucion de 2,5 % del recorrido: suficiente para localizar el punto
# de cruce sin que el informe sea ilegible.
PASOS_RAMPA = 40


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


def mezclar(a: str, b: str, t: float) -> str:
    """Interpola dos colores canal a canal en sRGB, igual que hace GSAP.

    IMPORTANTE que sea en sRGB bruto y no en luz lineal: GSAP interpola los
    canales 0-255 tal cual, asi que mezclar aqui de otra forma mediria colores
    que el navegador nunca llega a pintar.
    """
    ha, hb = a.lstrip("#"), b.lstrip("#")
    canales = []
    for i in (0, 2, 4):
        ca, cb = int(ha[i:i + 2], 16), int(hb[i:i + 2], 16)
        canales.append(round(ca + (cb - ca) * t))
    return "#{:02X}{:02X}{:02X}".format(*canales)


# --- Tokens del sistema -----------------------------------------------------

BONE = "#EDE9DF"
INK = "#1A1919"
BRAND = "#C4231F"
INK_SOFT = "#595754"   # texto atenuado SOLIDO; ver la nota en PARES_BASE

# (etiqueta, fondo, texto emparejado) -- el tercer valor es el token
# `--color-heat-N-ink` que acompana a cada nivel en styles.css.
ESCALA = [
    ("heat-1 aji dulce",   "#4E9B47", INK),
    ("heat-2 aji criollo", "#E8B31F", INK),
    ("heat-3 aji raton",   "#E2701A", INK),
    ("heat-4 rocoto",      "#C4231F", BONE),
    ("heat-5 habanero",    "#1A1010", BONE),
]

# (etiqueta, texto, fondo, umbral)
PARES_BASE = [
    ("ink sobre bone",          INK,  BONE,  UMBRAL_NORMAL),
    ("bone sobre ink",          BONE, INK,   UMBRAL_NORMAL),
    ("bone sobre brand",        BONE, BRAND, UMBRAL_NORMAL),
    ("ink sobre brand (titular)", INK, BRAND, UMBRAL_GRANDE),

    # Texto atenuado del formulario (el placeholder del CTA).
    #
    # Nacio de un error real: estaba escrito como `text-ink/60`, que PARECE lo
    # mismo y da 4,32:1 -- por debajo de AA. El script no lo habria cazado nunca
    # porque mide colores solidos y el par que conocia era "ink sobre bone",
    # que pasa de sobra. Es justo la trampa que describe la regla de no usar
    # opacidad sobre texto. Al 70 % en solido da 5,94 y entra por derecho.
    ("ink-soft sobre bone (placeholder)", INK_SOFT, BONE, UMBRAL_NORMAL),
]


def analizar_rampa(umbral: float, etiqueta: str) -> bool:
    """Comprueba la transicion animada de fondo de la escala de picante.

    EL PROBLEMA QUE RESUELVE
    ------------------------
    En la fase 4 el fondo no es uno de los cinco colores: es una interpolacion
    continua entre ellos, asi que durante la animacion el navegador pinta
    cientos de colores que NO estan en el sistema de diseno y que nadie ha
    verificado. Medir solo los cinco pares canonicos no dice nada de lo que se
    ve entre uno y otro.

    El texto tiene que cruzar de `ink` a `bone` en algun punto del recorrido.
    Esta funcion busca la VENTANA en la que los dos colores pasan el umbral a
    la vez: cualquier punto de esa ventana es un sitio seguro para cruzar. Si
    la ventana estuviera vacia existiria una zona muerta donde ningun color de
    texto cumple AA, y habria que cambiar los colores de la escala o cortar el
    fondo en vez de interpolarlo.

    Devuelve True si hay ventana.
    """
    # La rampa recorre los cinco niveles encadenados: 4 tramos.
    colores = [fondo for _, fondo, _ in ESCALA]
    muestras: list[tuple[float, str]] = []
    for i in range(len(colores) - 1):
        for paso in range(PASOS_RAMPA + 1):
            t = paso / PASOS_RAMPA
            # El ultimo paso de un tramo es el primero del siguiente.
            if paso == PASOS_RAMPA and i < len(colores) - 2:
                continue
            posicion = (i + t) / (len(colores) - 1)
            muestras.append((posicion, mezclar(colores[i], colores[i + 1], t)))

    ultimo_ink = max(
        (p for p, c in muestras if ratio(INK, c) >= umbral), default=None
    )
    primer_bone = min(
        (p for p, c in muestras if ratio(BONE, c) >= umbral), default=None
    )

    print(f"Rampa animada del fondo -- {etiqueta} (umbral {umbral:.1f}):")

    if ultimo_ink is None or primer_bone is None:
        print("  Uno de los dos colores de texto NO pasa el umbral en ningun punto.")
        return False

    if primer_bone > ultimo_ink:
        print(
            f"  ZONA MUERTA entre {ultimo_ink:>5.1%} y {primer_bone:>5.1%} "
            "del recorrido: ahi no sirve ni ink ni bone."
        )
        return False

    medio = (primer_bone + ultimo_ink) / 2
    peor = min(
        min(ratio(INK, c), ratio(BONE, c))
        for p, c in muestras
        if primer_bone <= p <= ultimo_ink
    )
    print(
        f"  Ventana segura para cruzar: {primer_bone:>5.1%} a {ultimo_ink:>5.1%} "
        f"del recorrido (los dos pasan)."
    )
    print(f"  Punto de cruce recomendado: {medio:.1%}  (peor ratio ahi dentro: {peor:.2f})")
    return True


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

    # Fase 4: el fondo se interpola entre los cinco niveles, asi que hay que
    # verificar tambien los colores intermedios, que no estan en el sistema.
    #
    # Esto NO suma a `fallos`: no es un par canonico mal elegido, es una
    # restriccion de la animacion. La conclusion esta debajo.
    print()
    analizar_rampa(UMBRAL_GRANDE, "titular y elementos graficos")
    print()
    analizar_rampa(UMBRAL_NORMAL, "texto de cuerpo")
    print()
    print("Consecuencia para la escala de picante (fase 4):")
    print("  - Elementos SIEMPRE visibles (medidor, eje): cruzan ink -> bone al 65 %")
    print("    del recorrido. A umbral 3.0 no hay ningun punto sin color valido.")
    print("  - Texto de cuerpo: NO puede estar visible mientras el fondo transiciona.")
    print("    Aparece con el fondo ya asentado en un color canonico y se desvanece")
    print("    antes del cruce al siguiente. La zona muerta deja de importar porque")
    print("    ahi no hay nada que leer.")

    print()
    if fallos:
        print(f"{fallos} par(es) canonico(s) por debajo de su umbral. Corregir antes de seguir.")
    else:
        print("Todos los pares canonicos cumplen WCAG AA.")
    return 1 if fallos else 0


if __name__ == "__main__":
    raise SystemExit(main())
