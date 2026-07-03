# Importa Flask para crear la página web.
from flask import Flask, render_template, request, jsonify

# Importa math para usar fórmulas matemáticas como raíz cuadrada y pi.
import math


# Crea la aplicación principal de Flask.
app = Flask(__name__)


# Constante de gravitación universal.
# Se usa en la fórmula de velocidad orbital: v = √(GM / r)
G = 6.67430e-11


# Masa aproximada del Sol en kilogramos.
# Se usa porque los planetas van a orbitar alrededor del Sol.
MASA_SOL_KG = 1.9885e30


# Diccionario con datos aproximados de los planetas.
# Cada planeta tiene radio, diámetro, distancia al Sol, período orbital y período de rotación.
PLANETAS = {
    "Mercurio": {
        "radio_km": 2439.7,
        "diametro_km": 4879.4,
        "distancia_sol_km": 57_900_000,
        "periodo_orbital_dias": 87.97,
        "periodo_rotacion_horas": 1407.6,
        "color": "#9a9a9a"
    },

    "Venus": {
        "radio_km": 6051.8,
        "diametro_km": 12103.6,
        "distancia_sol_km": 108_200_000,
        "periodo_orbital_dias": 224.7,
        "periodo_rotacion_horas": -5832.5,
        "color": "#d9b36c"
    },

    "Tierra": {
        "radio_km": 6371,
        "diametro_km": 12742,
        "distancia_sol_km": 149_600_000,
        "periodo_orbital_dias": 365.25,
        "periodo_rotacion_horas": 23.93,
        "color": "#4aa3df"
    },

    "Marte": {
        "radio_km": 3389.5,
        "diametro_km": 6779,
        "distancia_sol_km": 227_900_000,
        "periodo_orbital_dias": 687,
        "periodo_rotacion_horas": 24.6,
        "color": "#c75132"
    },

    "Júpiter": {
        "radio_km": 69911,
        "diametro_km": 139822,
        "distancia_sol_km": 778_500_000,
        "periodo_orbital_dias": 4332.59,
        "periodo_rotacion_horas": 9.93,
        "color": "#d8a56f"
    },

    "Saturno": {
        "radio_km": 58232,
        "diametro_km": 116464,
        "distancia_sol_km": 1_433_500_000,
        "periodo_orbital_dias": 10759,
        "periodo_rotacion_horas": 10.7,
        "color": "#e3c878"
    },

    "Urano": {
        "radio_km": 25362,
        "diametro_km": 50724,
        "distancia_sol_km": 2_872_500_000,
        "periodo_orbital_dias": 30687,
        "periodo_rotacion_horas": -17.2,
        "color": "#7ad7df"
    },

    "Neptuno": {
        "radio_km": 24622,
        "diametro_km": 49244,
        "distancia_sol_km": 4_495_100_000,
        "periodo_orbital_dias": 60190,
        "periodo_rotacion_horas": 16.1,
        "color": "#3154d4"
    }
}


def calcular_velocidad_orbital(distancia_sol_km):
    """
    Calcula la velocidad orbital aproximada de un planeta alrededor del Sol.

    Fórmula:
    v = √(GM / r)

    Donde:
    v = velocidad orbital
    G = constante gravitacional
    M = masa del Sol
    r = distancia del planeta al Sol en metros
    """

    # Convierte la distancia de kilómetros a metros.
    distancia_m = distancia_sol_km * 1000

    # Aplica la fórmula v = √(GM / r).
    velocidad_ms = math.sqrt((G * MASA_SOL_KG) / distancia_m)

    # Convierte la velocidad de m/s a km/s.
    velocidad_kms = velocidad_ms / 1000

    # Devuelve la velocidad en ambas unidades.
    return velocidad_ms, velocidad_kms


def calcular_periodo_orbital_teorico(distancia_sol_km):
    """
    Calcula el período orbital teórico usando la fórmula:

    T = 2π √(r³ / GM)

    Donde:
    T = período orbital
    r = distancia del planeta al Sol
    G = constante gravitacional
    M = masa del Sol
    """

    # Convierte la distancia de kilómetros a metros.
    distancia_m = distancia_sol_km * 1000

    # Aplica la fórmula del período orbital.
    periodo_segundos = 2 * math.pi * math.sqrt((distancia_m ** 3) / (G * MASA_SOL_KG))

    # Convierte el período de segundos a días.
    periodo_dias = periodo_segundos / 86400

    # Devuelve el período en segundos y días.
    return periodo_segundos, periodo_dias


@app.route("/")
def index():
    """
    Ruta principal del proyecto.
    Carga el archivo index.html y le manda la lista de planetas.
    """

    # render_template busca index.html dentro de la carpeta templates.
    # planetas=PLANETAS.keys() envía los nombres de los planetas al HTML.
    return render_template("index.html", planetas=PLANETAS.keys())


@app.route("/calcular", methods=["POST"])
def calcular():
    """
    Ruta que recibe los planetas seleccionados desde JavaScript.
    Calcula velocidad orbital, período orbital y devuelve los datos en JSON.
    """

    try:
        # Obtiene los datos enviados desde JavaScript en formato JSON.
        datos = request.get_json()

        # Obtiene la lista de planetas seleccionados.
        planetas_seleccionados = datos.get("planetas", [])

        # Valida que el usuario haya seleccionado al menos un planeta.
        if not planetas_seleccionados:
            return jsonify({
                "ok": False,
                "error": "Debe seleccionar al menos un planeta para simular."
            }), 400

        # Lista donde se guardarán los resultados calculados.
        resultados = []

        # Recorre cada planeta seleccionado.
        for nombre in planetas_seleccionados:

            # Valida que el planeta exista en el diccionario PLANETAS.
            if nombre not in PLANETAS:
                return jsonify({
                    "ok": False,
                    "error": f"El planeta {nombre} no existe en la base de datos."
                }), 400

            # Obtiene los datos del planeta seleccionado.
            planeta = PLANETAS[nombre]

            # Calcula la velocidad orbital del planeta.
            velocidad_ms, velocidad_kms = calcular_velocidad_orbital(
                planeta["distancia_sol_km"]
            )

            # Calcula el período orbital teórico.
            periodo_teorico_segundos, periodo_teorico_dias = calcular_periodo_orbital_teorico(
                planeta["distancia_sol_km"]
            )

            # Calcula cuántos grados avanza el planeta por día.
            velocidad_angular_grados_dia = 360 / planeta["periodo_orbital_dias"]

            # Guarda los datos originales y calculados del planeta.
            resultados.append({
                "nombre": nombre,
                "radio_km": planeta["radio_km"],
                "diametro_km": planeta["diametro_km"],
                "distancia_sol_km": planeta["distancia_sol_km"],
                "periodo_orbital_dias": planeta["periodo_orbital_dias"],
                "periodo_rotacion_horas": planeta["periodo_rotacion_horas"],
                "velocidad_orbital_ms": velocidad_ms,
                "velocidad_orbital_kms": velocidad_kms,
                "periodo_teorico_dias": periodo_teorico_dias,
                "velocidad_angular_grados_dia": velocidad_angular_grados_dia,
                "color": planeta["color"]
            })

        # Explicación que se mostrará en la página.
        explicacion = [
            "1. Se seleccionan uno o más planetas del sistema solar.",
            "2. Cada planeta tiene una distancia media aproximada al Sol.",
            "3. Para representar la traslación, se usa el período orbital del planeta.",
            "4. La posición del planeta cambia con el tiempo usando un ángulo orbital.",
            "5. La velocidad orbital se calcula con la fórmula v = √(GM / r).",
            "6. G es la constante gravitacional, M es la masa del Sol y r es la distancia al Sol.",
            "7. La rotación del planeta sobre su propio eje se representa usando su período de rotación.",
            "8. La simulación no está a escala real exacta, porque las distancias reales son demasiado grandes para una pantalla."
        ]

        # Devuelve los resultados a JavaScript.
        return jsonify({
            "ok": True,
            "planetas": resultados,
            "explicacion": explicacion
        })

    except Exception:
        # Si ocurre cualquier error inesperado, devuelve este mensaje.
        return jsonify({
            "ok": False,
            "error": "Ocurrió un error inesperado al calcular la simulación."
        }), 500


# Esta condición permite ejecutar Flask directamente con python app.py.
if __name__ == "__main__":

    # Inicia el servidor local en http://localhost:5000
    app.run(host="localhost", port=5000, debug=False, use_reloader=False)