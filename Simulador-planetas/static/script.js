document.addEventListener("DOMContentLoaded", () => {

    const formulario = document.getElementById("formulario");
    const errorBox = document.getElementById("error");

    const resultados = document.getElementById("resultados");
    const comparacion = document.getElementById("comparacion");
    const explicacion = document.getElementById("explicacion");
    const advertencias = document.getElementById("advertencias");

    const resPlaneta = document.getElementById("resPlaneta");
    const resRadio = document.getElementById("resRadio");
    const resDistancia = document.getElementById("resDistancia");
    const resAngular = document.getElementById("resAngular");

    const resComparacion = document.getElementById("resComparacion");
    const listaPasos = document.getElementById("listaPasos");
    const resInterpretacion = document.getElementById("resInterpretacion");
    const listaAdvertencias = document.getElementById("listaAdvertencias");

    const planetVisual = document.getElementById("planetVisual");
    const solVisual = document.getElementById("solVisual");
    const planetLabel = document.getElementById("planetLabel");
    const visualNote = document.getElementById("visualNote");

    const boton = formulario.querySelector("button");

    formulario.addEventListener("submit", async (event) => {
        event.preventDefault();

        ocultarError();
        boton.disabled = true;
        boton.textContent = "Calculando...";

        const datos = {
            enunciado: document.getElementById("enunciado").value,
            planeta: document.getElementById("planeta").value,
            tipo_distancia: document.getElementById("tipo_distancia").value,
            distancia: document.getElementById("distancia").value,
            unidad: document.getElementById("unidad").value
        };

        try {
            const respuesta = await fetch("/calcular", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(datos)
            });

            const data = await respuesta.json();

            if (!data.ok) {
                mostrarError(data.error);
                return;
            }

            mostrarResultados(data);
            mostrarVisualizacion(data);

        } catch (error) {
            mostrarError("No se pudo conectar con el servidor o hubo un error al calcular.");
        } finally {
            boton.disabled = false;
            boton.textContent = "Calcular y visualizar";
        }
    });

    function mostrarResultados(data) {
        resultados.classList.remove("hidden");
        comparacion.classList.remove("hidden");
        explicacion.classList.remove("hidden");

        resPlaneta.textContent = data.planeta;
        resRadio.textContent = `${formatearNumero(data.radio_km)} km`;
        resDistancia.textContent = `${formatearNumero(data.distancia_km)} km`;

        resAngular.innerHTML = `
            ${data.theta_radianes.toFixed(8)} rad<br>
            ${data.theta_grados.toFixed(6)}°
        `;

        resComparacion.textContent = data.comparacion_sol;

        listaPasos.innerHTML = "";

        data.pasos.forEach((paso) => {
            const li = document.createElement("li");
            li.textContent = paso;
            listaPasos.appendChild(li);
        });

        resInterpretacion.textContent = data.interpretacion;

        listaAdvertencias.innerHTML = "";

        if (data.advertencias && data.advertencias.length > 0) {
            advertencias.classList.remove("hidden");

            data.advertencias.forEach((advertencia) => {
                const li = document.createElement("li");
                li.textContent = advertencia;
                listaAdvertencias.appendChild(li);
            });
        } else {
            advertencias.classList.add("hidden");
        }
    }

    function mostrarVisualizacion(data) {
        solVisual.style.width = `${data.sol_px}px`;
        solVisual.style.height = `${data.sol_px}px`;

        planetVisual.className = "planet";
        planetVisual.innerHTML = "";

        const estilo = obtenerEstiloPlaneta(data.planeta);

        planetVisual.style.width = `${data.planeta_px}px`;
        planetVisual.style.height = `${data.planeta_px}px`;
        planetVisual.style.background = estilo.background;
        planetVisual.style.boxShadow = estilo.shadow;

        if (data.planeta === "Saturno") {
            const ring = document.createElement("div");
            ring.classList.add("saturn-ring");
            planetVisual.appendChild(ring);
        }

        if (data.planeta === "Tierra") {
            const land1 = document.createElement("div");
            land1.classList.add("earth-land", "land-1");

            const land2 = document.createElement("div");
            land2.classList.add("earth-land", "land-2");

            planetVisual.appendChild(land1);
            planetVisual.appendChild(land2);
        }

        planetLabel.textContent = data.planeta;

        visualNote.textContent =
            `El tamaño visual está comparado con el Sol como referencia. ` +
            `El resultado calculado fue ${data.theta_grados.toFixed(6)}°.`;
    }

    function obtenerEstiloPlaneta(nombre) {
        const estilos = {
            "Mercurio": {
                background: "radial-gradient(circle at 35% 30%, #d6d0c8, #8f8f8f 45%, #4f4f4f 100%)",
                shadow: "inset -14px -12px 0 rgba(0,0,0,0.25)"
            },
            "Venus": {
                background: "radial-gradient(circle at 35% 30%, #fff0a8, #d9b36c 50%, #9c6b2f 100%)",
                shadow: "0 0 25px rgba(255, 213, 117, 0.35), inset -14px -12px 0 rgba(0,0,0,0.15)"
            },
            "Tierra": {
                background: "radial-gradient(circle at 35% 30%, #b7f3ff, #4aa3df 45%, #1565a9 100%)",
                shadow: "0 0 25px rgba(98, 184, 255, 0.35), inset -14px -12px 0 rgba(0,0,0,0.18)"
            },
            "Marte": {
                background: "radial-gradient(circle at 35% 30%, #ffb188, #c75132 50%, #732819 100%)",
                shadow: "inset -14px -12px 0 rgba(0,0,0,0.22)"
            },
            "Júpiter": {
                background: "repeating-linear-gradient(0deg, #d8a56f 0px, #d8a56f 12px, #f2d6a5 12px, #f2d6a5 24px, #b8754f 24px, #b8754f 34px)",
                shadow: "0 0 30px rgba(230, 180, 120, 0.25), inset -18px -14px 0 rgba(0,0,0,0.16)"
            },
            "Saturno": {
                background: "radial-gradient(circle at 35% 30%, #fff3b0, #e3c878 50%, #a78335 100%)",
                shadow: "0 0 30px rgba(255, 219, 125, 0.25), inset -14px -12px 0 rgba(0,0,0,0.18)"
            },
            "Urano": {
                background: "radial-gradient(circle at 35% 30%, #d6ffff, #7ad7df 50%, #3e9faa 100%)",
                shadow: "0 0 25px rgba(122, 215, 223, 0.35), inset -14px -12px 0 rgba(0,0,0,0.15)"
            },
            "Neptuno": {
                background: "radial-gradient(circle at 35% 30%, #9ab4ff, #3154d4 50%, #14246e 100%)",
                shadow: "0 0 30px rgba(49, 84, 212, 0.45), inset -14px -12px 0 rgba(0,0,0,0.2)"
            },
            "Luna": {
                background: "radial-gradient(circle at 35% 30%, #ffffff, #d0d0d0 45%, #8c8c8c 100%)",
                shadow: "inset -14px -12px 0 rgba(0,0,0,0.2)"
            },
            "Sol": {
                background: "radial-gradient(circle at 35% 30%, #fff7a8, #ffcc33 45%, #ff7b00 100%)",
                shadow: "0 0 55px rgba(255, 190, 40, 0.85)"
            }
        };

        return estilos[nombre] || estilos["Tierra"];
    }

    function mostrarError(mensaje) {
        errorBox.textContent = mensaje;
        errorBox.classList.remove("hidden");
    }

    function ocultarError() {
        errorBox.textContent = "";
        errorBox.classList.add("hidden");
    }

    function formatearNumero(numero) {
        return Number(numero).toLocaleString("es-NI", {
            maximumFractionDigits: 2
        });
    }
});