from flask import Flask, render_template, request, jsonify
import math
import re

app = Flask(__name__)

# 1 Unidad Astronómica en kilómetros
UA_EN_KM = 149_597_870.7

# Datos aproximados de cuerpos celestes
CUERPOS_CELESTES = {
    "Mercurio": {
        "radio_km": 2439.7,
        "diametro_km": 4879.4,
        "color": "#8f8f8f",
        "distancia_tierra_km": 91_700_000,
        "distancia_sol_km": 57_900_000
    },
    "Venus": {
        "radio_km": 6051.8,
        "diametro_km": 12103.6,
        "color": "#d9b36c",
        "distancia_tierra_km": 41_400_000,
        "distancia_sol_km": 108_200_000
    },
    "Tierra": {
        "radio_km": 6371,
        "diametro_km": 12742,
        "color": "#4aa3df",
        "distancia_tierra_km": 0,
        "distancia_sol_km": 149_600_000
    },
    "Marte": {
        "radio_km": 3389.5,
        "diametro_km": 6779,
        "color": "#c75132",
        "distancia_tierra_km": 78_300_000,
        "distancia_sol_km": 227_900_000
    },
    "Júpiter": {
        "radio_km": 69911,
        "diametro_km": 139822,
        "color": "#d8a56f",
        "distancia_tierra_km": 628_700_000,
        "distancia_sol_km": 778_500_000
    },
    "Saturno": {
        "radio_km": 58232,
        "diametro_km": 116464,
        "color": "#e3c878",
        "distancia_tierra_km": 1_277_400_000,
        "distancia_sol_km": 1_433_500_000
    },
    "Urano": {
        "radio_km": 25362,
        "diametro_km": 50724,
        "color": "#7ad7df",
        "distancia_tierra_km": 2_721_400_000,
        "distancia_sol_km": 2_872_500_000
    },
    "Neptuno": {
        "radio_km": 24622,
        "diametro_km": 49244,
        "color": "#3154d4",
        "distancia_tierra_km": 4_350_400_000,
        "distancia_sol_km": 4_495_100_000
    },
    "Luna": {
        "radio_km": 1737.4,
        "diametro_km": 3474.8,
        "color": "#d9d9d9",
        "distancia_tierra_km": 384_400,
        "distancia_sol_km": 149_600_000
    },
    "Sol": {
        "radio_km": 696340,
        "diametro_km": 1_392_680,
        "color": "#ffcc33",
        "distancia_tierra_km": 149_600_000,
        "distancia_sol_km": 0
    }
}


def convertir_a_km(distancia, unidad):
    """Convierte la distancia ingresada a kilómetros."""
    unidad = unidad.lower().strip()

    if unidad == "km":
        return distancia
    elif unidad == "m":
        return distancia / 1000
    elif unidad == "ua":
        return distancia * UA_EN_KM
    else:
        raise ValueError("Unidad inválida. Use km, m o UA.")


def limpiar_numero(texto):
    """Permite usar números como 384400, 384,400 o 1.5."""
    texto = str(texto).strip()

    if "," in texto and len(texto.split(",")[-1]) == 3:
        texto = texto.replace(",", "")
    else:
        texto = texto.replace(",", ".")

    return float(texto)


def extraer_distancia_del_enunciado(enunciado):
    """Intenta detectar una distancia escrita en el enunciado."""
    patron = r"(\d+(?:[.,]\d+)*)\s*(km|kilómetros|kilometros|m|metros|ua|au)\b"
    coincidencia = re.search(patron, enunciado.lower())

    if not coincidencia:
        return None

    numero = limpiar_numero(coincidencia.group(1))
    unidad = coincidencia.group(2)

    if unidad in ["kilómetros", "kilometros"]:
        unidad = "km"
    elif unidad == "metros":
        unidad = "m"
    elif unidad == "au":
        unidad = "ua"

    return numero, unidad


def calcular_diametro_angular(radio_km, distancia_km):
    """
    Fórmula principal:
    θ = 2 * arctan(R / d)

    R = radio del cuerpo celeste
    d = distancia entre el observador y el cuerpo celeste
    """
    theta_radianes = 2 * math.atan(radio_km / distancia_km)
    theta_grados = theta_radianes * 180 / math.pi

    return theta_radianes, theta_grados


@app.route("/")
def index():
    """Ruta principal."""
    return render_template("index.html", cuerpos=CUERPOS_CELESTES.keys())


@app.route("/calcular", methods=["POST"])
def calcular():
    """Recibe datos desde JavaScript y devuelve el cálculo en JSON."""
    try:
        datos = request.get_json()

        enunciado = datos.get("enunciado", "")
        planeta = datos.get("planeta", "")
        comparado_con = datos.get("comparado_con", "")
        tipo_distancia = datos.get("tipo_distancia", "")
        distancia_usuario = datos.get("distancia", "")
        unidad = datos.get("unidad", "km").lower().strip()

        if not planeta or planeta not in CUERPOS_CELESTES:
            return jsonify({
                "ok": False,
                "error": "Debe seleccionar un planeta o cuerpo celeste válido."
            }), 400

        if not comparado_con or comparado_con not in CUERPOS_CELESTES:
            return jsonify({
                "ok": False,
                "error": "Debe seleccionar un cuerpo celeste válido para comparar."
            }), 400

        if unidad not in ["km", "m", "ua"]:
            return jsonify({
                "ok": False,
                "error": "Unidad inválida. Use km, m o UA."
            }), 400

        cuerpo = CUERPOS_CELESTES[planeta]
        cuerpo_comparado = CUERPOS_CELESTES[comparado_con]

        radio_km = cuerpo["radio_km"]
        radio_comparado_km = cuerpo_comparado["radio_km"]

        # Selección de distancia
        if tipo_distancia == "tierra":
            distancia_km = cuerpo["distancia_tierra_km"]
            descripcion_distancia = "distancia aproximada desde la Tierra"

        elif tipo_distancia == "sol":
            distancia_km = cuerpo["distancia_sol_km"]
            descripcion_distancia = "distancia media aproximada desde el Sol"

        elif tipo_distancia == "luna":
            distancia_km = 384_400
            descripcion_distancia = "distancia promedio de la Luna a la Tierra"

        elif tipo_distancia == "personalizada":
            if distancia_usuario:
                distancia_usuario = limpiar_numero(distancia_usuario)
            else:
                distancia_extraida = extraer_distancia_del_enunciado(enunciado)

                if not distancia_extraida:
                    return jsonify({
                        "ok": False,
                        "error": "Debe escribir una distancia personalizada o incluirla en el enunciado."
                    }), 400

                distancia_usuario, unidad = distancia_extraida

            distancia_km = convertir_a_km(float(distancia_usuario), unidad)
            descripcion_distancia = f"distancia personalizada ingresada en {unidad}"

        else:
            return jsonify({
                "ok": False,
                "error": "Debe seleccionar un tipo de distancia válido."
            }), 400

        if distancia_km <= 0:
            return jsonify({
                "ok": False,
                "error": "La distancia debe ser mayor que 0."
            }), 400

        # Cálculo del cuerpo observado
        theta_radianes, theta_grados = calcular_diametro_angular(radio_km, distancia_km)

        # Cálculo del cuerpo de comparación usando la misma distancia
        theta_comparado_radianes, theta_comparado_grados = calcular_diametro_angular(
            radio_comparado_km,
            distancia_km
        )

        relacion_comparacion = theta_grados / theta_comparado_grados

        if relacion_comparacion > 1:
            comparacion_texto = (
                f"{planeta} se vería aproximadamente {relacion_comparacion:.2f} veces "
                f"más grande que {comparado_con} a la misma distancia."
            )
        elif relacion_comparacion < 1:
            comparacion_texto = (
                f"{planeta} se vería aproximadamente {1 / relacion_comparacion:.2f} veces "
                f"más pequeño que {comparado_con} a la misma distancia."
            )
        else:
            comparacion_texto = (
                f"{planeta} y {comparado_con} se verían casi del mismo tamaño aparente "
                f"a esa distancia."
            )

        advertencias = []

        if theta_grados > 10:
            advertencias.append(
                "El resultado es muy grande. El cuerpo estaría extremadamente cerca "
                "y ocuparía una gran parte del cielo."
            )

        if distancia_km <= radio_km:
            advertencias.append(
                "La distancia ingresada es menor o igual al radio del cuerpo observado. "
                "Físicamente, el observador estaría dentro o sobre ese cuerpo celeste."
            )

        # Escalado visual: el objeto comparado se deja como referencia de 130 px
        referencia_px = 130
        planeta_px_real = referencia_px * relacion_comparacion

        planeta_px = max(18, min(planeta_px_real, 420))
        comparado_px = referencia_px

        if planeta_px_real < 18:
            advertencias.append(
                "El cuerpo observado se vería muy pequeño, por eso fue aumentado "
                "para que sea visible en pantalla."
            )

        if planeta_px_real > 420:
            advertencias.append(
                "El cuerpo observado se vería demasiado grande, por eso fue limitado "
                "visualmente en pantalla."
            )

        pasos = [
            f"Se seleccionó el cuerpo observado: {planeta}.",
            f"Se seleccionó el cuerpo de comparación: {comparado_con}.",
            f"El radio de {planeta} es R = {radio_km:,.2f} km.",
            f"El radio de {comparado_con} es R = {radio_comparado_km:,.2f} km.",
            f"La distancia usada fue d = {distancia_km:,.2f} km, correspondiente a {descripcion_distancia}.",
            "Para el cuerpo observado se aplicó la fórmula: θ = 2 × arctan(R / d).",
            f"Sustituyendo valores para {planeta}: θ = 2 × arctan({radio_km:,.2f} / {distancia_km:,.2f}).",
            f"El diámetro angular de {planeta} fue θ = {theta_radianes:.8f} rad = {theta_grados:.6f}°.",
            f"También se calculó el diámetro angular de {comparado_con} usando la misma distancia.",
            f"El diámetro angular de {comparado_con} fue θ = {theta_comparado_radianes:.8f} rad = {theta_comparado_grados:.6f}°.",
            "Finalmente, se dividió el tamaño angular del cuerpo observado entre el tamaño angular del cuerpo de comparación."
        ]

        interpretacion = (
            f"El diámetro angular indica qué tan grande se vería un cuerpo celeste en el cielo. "
            f"En este caso, {planeta} tendría un tamaño aparente de {theta_grados:.6f}°. "
            f"Comparado con {comparado_con}, el resultado indica que {comparacion_texto.lower()}"
        )

        return jsonify({
            "ok": True,
            "planeta": planeta,
            "comparado_con": comparado_con,

            "radio_km": radio_km,
            "diametro_km": cuerpo["diametro_km"],

            "radio_comparado_km": radio_comparado_km,
            "diametro_comparado_km": cuerpo_comparado["diametro_km"],

            "distancia_km": distancia_km,

            "theta_radianes": theta_radianes,
            "theta_grados": theta_grados,

            "theta_comparado_radianes": theta_comparado_radianes,
            "theta_comparado_grados": theta_comparado_grados,

            "relacion_comparacion": relacion_comparacion,
            "comparacion_texto": comparacion_texto,

            "pasos": pasos,
            "interpretacion": interpretacion,
            "advertencias": advertencias,

            "planeta_px": planeta_px,
            "comparado_px": comparado_px
        })

    except ValueError:
        return jsonify({
            "ok": False,
            "error": "Revise que la distancia esté escrita correctamente."
        }), 400

    except Exception:
        return jsonify({
            "ok": False,
            "error": "Ocurrió un error inesperado al calcular."
        }), 500


if __name__ == "__main__":
    app.run(host="localhost", port=5000, debug=False, use_reloader=False)