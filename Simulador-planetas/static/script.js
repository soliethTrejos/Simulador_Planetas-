// Espera a que todo el HTML cargue antes de ejecutar JavaScript.
document.addEventListener("DOMContentLoaded", () => {

    // Obtiene el formulario principal.
    const formulario = document.getElementById("formulario");

    // Obtiene la caja donde se mostrarán errores.
    const errorBox = document.getElementById("error");

    // Obtiene el control de velocidad de simulación.
    const velocidadSimulacion = document.getElementById("velocidadSimulacion");

    // Obtiene el texto donde se muestra la velocidad actual.
    const speedLabel = document.getElementById("speedLabel");

    // Obtiene el selector de escala visual.
    const escalaVisual = document.getElementById("escalaVisual");

    // Obtiene el área donde se dibuja el sistema solar.
    const solarSystem = document.getElementById("solarSystem");

    // Obtiene el texto informativo de la simulación.
    const simulationInfo = document.getElementById("simulationInfo");

    // Obtiene la sección de resultados.
    const resultados = document.getElementById("resultados");

    // Obtiene el cuerpo de la tabla donde se insertarán datos.
    const tablaResultados = document.getElementById("tablaResultados");

    // Obtiene la sección de explicación.
    const explicacion = document.getElementById("explicacion");

    // Obtiene la lista donde se insertarán los pasos.
    const listaExplicacion = document.getElementById("listaExplicacion");

    // Botón para pausar la simulación.
    const btnPausar = document.getElementById("btnPausar");

    // Botón para reanudar la simulación.
    const btnReanudar = document.getElementById("btnReanudar");

    // Botón para reiniciar la simulación.
    const btnReiniciar = document.getElementById("btnReiniciar");

    // Guarda los planetas que se están simulando.
    let planetasSimulados = [];

    // Indica si la animación está activa.
    let animacionActiva = false;

    // Guarda el identificador de la animación.
    let idAnimacion = null;

    // Guarda el tiempo del frame anterior.
    let ultimoTiempo = null;

    // Guarda cuántos días han pasado en la simulación.
    let diasSimulados = 0;

    // Distancia mínima usada para escalar órbitas.
    const DISTANCIA_MIN_KM = 57_900_000;

    // Distancia máxima usada para escalar órbitas.
    const DISTANCIA_MAX_KM = 4_495_100_000;

    // Actualiza el texto cuando el usuario mueve la barra de velocidad.
    velocidadSimulacion.addEventListener("input", () => {
        speedLabel.textContent = `${velocidadSimulacion.value} días/segundo`;
    });

    // Evento que se ejecuta cuando el usuario presiona “Calcular y simular”.
    formulario.addEventListener("submit", async (event) => {

        // Evita que la página se recargue.
        event.preventDefault();

        // Oculta errores anteriores.
        ocultarError();

        // Obtiene los planetas seleccionados.
        const seleccionados = obtenerPlanetasSeleccionados();

        // Valida que se haya seleccionado al menos un planeta.
        if (seleccionados.length === 0) {
            mostrarError("Debe seleccionar al menos un planeta para simular.");
            return;
        }

        try {
            // Envía los planetas seleccionados al backend Flask.
            const respuesta = await fetch("/calcular", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    planetas: seleccionados
                })
            });

            // Convierte la respuesta JSON a objeto de JavaScript.
            const data = await respuesta.json();

            // Si Flask devuelve error, lo muestra.
            if (!data.ok) {
                mostrarError(data.error);
                return;
            }

            // Carga la simulación visual.
            cargarSimulacion(data.planetas);

            // Muestra la tabla con resultados físicos.
            mostrarTabla(data.planetas);

            // Muestra la explicación física.
            mostrarExplicacion(data.explicacion);

        } catch (error) {
            // Error si no se pudo conectar con Flask.
            mostrarError("No se pudo conectar con el servidor Flask.");
        }
    });

    // Pausa la animación.
    btnPausar.addEventListener("click", () => {
        animacionActiva = false;

        if (idAnimacion) {
            cancelAnimationFrame(idAnimacion);
        }

        simulationInfo.textContent = "Simulación pausada.";
    });

    // Reanuda la animación.
    btnReanudar.addEventListener("click", () => {
        if (planetasSimulados.length === 0) {
            mostrarError("Primero debe calcular una simulación.");
            return;
        }

        animacionActiva = true;
        ultimoTiempo = null;
        animar();

        simulationInfo.textContent = "Simulación en movimiento.";
    });

    // Reinicia la simulación al día cero.
    btnReiniciar.addEventListener("click", () => {
        diasSimulados = 0;
        ultimoTiempo = null;
        actualizarPosiciones();

        simulationInfo.textContent = "Simulación reiniciada al día 0.";
    });

    // Obtiene todos los planetas que el usuario marcó.
    function obtenerPlanetasSeleccionados() {

        // Busca todos los checkboxes seleccionados.
        const checks = document.querySelectorAll('input[name="planetas"]:checked');

        // Convierte los checkboxes a una lista de nombres.
        return Array.from(checks).map(check => check.value);
    }

    // Crea la simulación visual con los planetas recibidos.
    function cargarSimulacion(planetas) {

        // Borra planetas y órbitas anteriores.
        limpiarSistema();

        // Reinicia el tiempo.
        diasSimulados = 0;

        // Reinicia el control de tiempo.
        ultimoTiempo = null;

        // Crea los planetas visuales.
        planetasSimulados = planetas.map((planeta, index) => {

            // Calcula el tamaño visual de la órbita.
            const orbitRadius = calcularRadioOrbita(planeta.distancia_sol_km);

            // Calcula el tamaño visual del planeta.
            const planetSize = calcularTamanoPlaneta(planeta.diametro_km);

            // Crea la línea de órbita.
            const orbitElement = crearOrbita(orbitRadius);

            // Crea el planeta.
            const planetElement = crearPlaneta(planeta, planetSize);

            // Agrega la órbita al sistema solar.
            solarSystem.appendChild(orbitElement);

            // Agrega el planeta al sistema solar.
            solarSystem.appendChild(planetElement);

            // Devuelve un objeto con datos físicos y visuales.
            return {
                ...planeta,
                orbitRadius,
                planetSize,
                element: planetElement,
                initialAngle: (index * 2 * Math.PI) / planetas.length
            };
        });

        // Muestra la sección de resultados.
        resultados.classList.remove("hidden");

        // Muestra la explicación.
        explicacion.classList.remove("hidden");

        // Coloca los planetas en su posición inicial.
        actualizarPosiciones();

        // Activa la animación.
        animacionActiva = true;

        // Inicia el movimiento.
        animar();

        // Actualiza el texto informativo.
        simulationInfo.textContent =
            `Simulando ${planetas.length} planeta(s). Velocidad: ${velocidadSimulacion.value} días/segundo.`;
    }

    // Elimina órbitas y planetas anteriores, pero deja el Sol.
    function limpiarSistema() {

        // Busca órbitas y planetas creados por JavaScript.
        const elementos = solarSystem.querySelectorAll(".orbit-path, .planet-body");

        // Elimina cada elemento encontrado.
        elementos.forEach(elemento => elemento.remove());
    }

    // Crea visualmente una órbita.
    function crearOrbita(radio) {

        // Crea un div para la órbita.
        const orbit = document.createElement("div");

        // Le agrega la clase CSS de órbita.
        orbit.classList.add("orbit-path");

        // Define el ancho de la órbita.
        orbit.style.width = `${radio * 2}px`;

        // Define la altura, menor que el ancho para verse en perspectiva.
        orbit.style.height = `${radio * 2 * 0.55}px`;

        // Devuelve la órbita creada.
        return orbit;
    }

    // Crea visualmente un planeta.
    function crearPlaneta(planeta, size) {

        // Crea un div para el planeta.
        const element = document.createElement("div");

        // Le agrega la clase CSS de planeta.
        element.classList.add("planet-body");

        // Define el ancho visual del planeta.
        element.style.width = `${size}px`;

        // Define el alto visual del planeta.
        element.style.height = `${size}px`;

        // Define el color o textura del planeta.
        element.style.background = obtenerEstiloPlaneta(planeta.nombre);

        // Si el planeta es Saturno, se le agrega un anillo.
        if (planeta.nombre === "Saturno") {
            const ring = document.createElement("div");
            ring.classList.add("saturn-ring");
            element.appendChild(ring);
        }

        // Si el planeta es Tierra, se agregan continentes decorativos.
        if (planeta.nombre === "Tierra") {
            const land1 = document.createElement("div");
            land1.classList.add("earth-land", "land-1");

            const land2 = document.createElement("div");
            land2.classList.add("earth-land", "land-2");

            element.appendChild(land1);
            element.appendChild(land2);
        }

        // Crea la etiqueta del planeta.
        const label = document.createElement("span");

        // Le agrega la clase CSS de etiqueta.
        label.classList.add("planet-label");

        // Escribe el nombre del planeta.
        label.textContent = planeta.nombre;

        // Agrega la etiqueta al planeta.
        element.appendChild(label);

        // Devuelve el planeta creado.
        return element;
    }

    // Función principal de animación.
    function animar(timestamp) {

        // Si la animación no está activa, no hace nada.
        if (!animacionActiva) {
            return;
        }

        // Si no hay tiempo anterior, se usa el tiempo actual.
        if (!ultimoTiempo) {
            ultimoTiempo = timestamp;
        }

        // Calcula cuántos segundos pasaron entre un frame y otro.
        const segundosTranscurridos = (timestamp - ultimoTiempo) / 1000;

        // Actualiza el último tiempo.
        ultimoTiempo = timestamp;

        // Obtiene la velocidad de simulación elegida por el usuario.
        const diasPorSegundo = Number(velocidadSimulacion.value);

        // Aumenta los días simulados.
        diasSimulados += segundosTranscurridos * diasPorSegundo;

        // Actualiza las posiciones de los planetas.
        actualizarPosiciones();

        // Solicita al navegador el siguiente frame de animación.
        idAnimacion = requestAnimationFrame(animar);
    }

    // Actualiza la posición orbital y la rotación de cada planeta.
    function actualizarPosiciones() {

        // Obtiene el tamaño del contenedor del sistema solar.
        const rect = solarSystem.getBoundingClientRect();

        // Calcula el centro horizontal.
        const centroX = rect.width / 2;

        // Calcula el centro vertical.
        const centroY = rect.height / 2;

        // Recorre cada planeta simulado.
        planetasSimulados.forEach(planeta => {

            // Calcula el ángulo orbital actual.
            const anguloOrbital =
                planeta.initialAngle +
                (2 * Math.PI * diasSimulados) / planeta.periodo_orbital_dias;

            // Calcula la posición horizontal usando coseno.
            const x = centroX + planeta.orbitRadius * Math.cos(anguloOrbital);

            // Calcula la posición vertical usando seno.
            const y = centroY + planeta.orbitRadius * 0.55 * Math.sin(anguloOrbital);

            // Calcula la rotación propia del planeta.
            const gradosRotacion =
                (diasSimulados * 24 * 360) / planeta.periodo_rotacion_horas;

            // Mueve el planeta horizontalmente.
            planeta.element.style.left = `${x}px`;

            // Mueve el planeta verticalmente.
            planeta.element.style.top = `${y}px`;

            // Centra el planeta y lo rota sobre su propio eje.
            planeta.element.style.transform =
                `translate(-50%, -50%) rotate(${gradosRotacion}deg)`;
        });
    }

    // Calcula el radio visual de la órbita.
    function calcularRadioOrbita(distanciaKm) {

        // Obtiene el tamaño del sistema solar en pantalla.
        const rect = solarSystem.getBoundingClientRect();

        // Calcula el radio máximo permitido.
        const maxRadio = Math.min(rect.width, rect.height) * 0.43;

        // Define un radio mínimo.
        const minRadio = 55;

        // Si el usuario eligió escala compacta.
        if (escalaVisual.value === "compacta") {

            // Normaliza la distancia entre 0 y 1.
            const normal =
                (distanciaKm - DISTANCIA_MIN_KM) /
                (DISTANCIA_MAX_KM - DISTANCIA_MIN_KM);

            // Devuelve un radio proporcional.
            return minRadio + normal * (maxRadio - minRadio);
        }

        // Convierte la distancia mínima a logaritmo.
        const logMin = Math.log10(DISTANCIA_MIN_KM);

        // Convierte la distancia máxima a logaritmo.
        const logMax = Math.log10(DISTANCIA_MAX_KM);

        // Convierte la distancia del planeta a logaritmo.
        const logDist = Math.log10(distanciaKm);

        // Normaliza la distancia en escala logarítmica.
        const normal = (logDist - logMin) / (logMax - logMin);

        // Devuelve el radio visual.
        return minRadio + normal * (maxRadio - minRadio);
    }

    // Calcula el tamaño visual del planeta.
    function calcularTamanoPlaneta(diametroKm) {

        // Diámetro de la Tierra como referencia.
        const tierraDiametro = 12742;

        // Usa raíz cuadrada para que los tamaños no sean exagerados.
        const size = Math.sqrt(diametroKm / tierraDiametro) * 18;

        // Limita el tamaño mínimo y máximo.
        return Math.max(8, Math.min(size, 42));
    }

    // Devuelve el estilo visual aproximado de cada planeta.
    function obtenerEstiloPlaneta(nombre) {

        // Diccionario de estilos visuales.
        const estilos = {
            "Mercurio": "radial-gradient(circle at 35% 30%, #d6d0c8, #8f8f8f 45%, #4f4f4f 100%)",

            "Venus": "radial-gradient(circle at 35% 30%, #fff0a8, #d9b36c 50%, #9c6b2f 100%)",

            "Tierra": "radial-gradient(circle at 35% 30%, #b7f3ff, #4aa3df 45%, #1565a9 100%)",

            "Marte": "radial-gradient(circle at 35% 30%, #ffb188, #c75132 50%, #732819 100%)",

            "Júpiter": "repeating-linear-gradient(0deg, #d8a56f 0px, #d8a56f 8px, #f2d6a5 8px, #f2d6a5 16px, #b8754f 16px, #b8754f 24px)",

            "Saturno": "radial-gradient(circle at 35% 30%, #fff3b0, #e3c878 50%, #a78335 100%)",

            "Urano": "radial-gradient(circle at 35% 30%, #d6ffff, #7ad7df 50%, #3e9faa 100%)",

            "Neptuno": "radial-gradient(circle at 35% 30%, #9ab4ff, #3154d4 50%, #14246e 100%)"
        };

        // Devuelve el estilo del planeta o usa Tierra por defecto.
        return estilos[nombre] || estilos["Tierra"];
    }

    // Muestra la tabla con datos físicos.
    function mostrarTabla(planetas) {

        // Limpia datos anteriores.
        tablaResultados.innerHTML = "";

        // Recorre los planetas recibidos.
        planetas.forEach(planeta => {

            // Crea una fila de tabla.
            const fila = document.createElement("tr");

            // Inserta las celdas con datos.
            fila.innerHTML = `
                <td>${planeta.nombre}</td>
                <td>${formatearNumero(planeta.distancia_sol_km)} km</td>
                <td>${formatearNumero(planeta.periodo_orbital_dias)} días</td>
                <td>${planeta.velocidad_orbital_kms.toFixed(2)} km/s</td>
                <td>${formatearNumero(planeta.periodo_rotacion_horas)} h</td>
            `;

            // Agrega la fila a la tabla.
            tablaResultados.appendChild(fila);
        });
    }

    // Muestra la explicación física.
    function mostrarExplicacion(pasos) {

        // Limpia explicación anterior.
        listaExplicacion.innerHTML = "";

        // Recorre cada paso.
        pasos.forEach(paso => {

            // Crea un elemento de lista.
            const li = document.createElement("li");

            // Escribe el paso.
            li.textContent = paso;

            // Agrega el paso a la lista.
            listaExplicacion.appendChild(li);
        });
    }

    // Muestra errores en pantalla.
    function mostrarError(mensaje) {
        errorBox.textContent = mensaje;
        errorBox.classList.remove("hidden");
    }

    // Oculta errores.
    function ocultarError() {
        errorBox.textContent = "";
        errorBox.classList.add("hidden");
    }

    // Da formato a números grandes.
    function formatearNumero(numero) {
        return Number(numero).toLocaleString("es-NI", {
            maximumFractionDigits: 2
        });
    }
});