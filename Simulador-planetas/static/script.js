// Espera a que todo el contenido HTML cargue antes de ejecutar el código JavaScript.
document.addEventListener("DOMContentLoaded", () => {

    // Guarda en una variable el formulario principal de la página.
    const formulario = document.getElementById("formulario");

    // Guarda en una variable la caja donde se mostrarán los mensajes de error.
    const errorBox = document.getElementById("error");

    // Guarda en una variable la barra que controla la velocidad de la simulación.
    const velocidadSimulacion = document.getElementById("velocidadSimulacion");

    // Guarda en una variable el texto que muestra la velocidad actual.
    const speedLabel = document.getElementById("speedLabel");

    // Guarda en una variable el selector de escala visual.
    const escalaVisual = document.getElementById("escalaVisual");

    // Guarda en una variable el contenedor donde se dibuja el sistema solar.
    const solarSystem = document.getElementById("solarSystem");

    // Guarda en una variable el párrafo donde se muestra información de la simulación.
    const simulationInfo = document.getElementById("simulationInfo");

    // Guarda en una variable la sección donde aparecen los resultados.
    const resultados = document.getElementById("resultados");

    // Guarda en una variable el cuerpo de la tabla donde se agregan los datos calculados.
    const tablaResultados = document.getElementById("tablaResultados");

    // Guarda en una variable la sección donde aparece la explicación del procedimiento.
    const explicacion = document.getElementById("explicacion");

    // Guarda en una variable la lista donde se agregan los pasos explicativos.
    const listaExplicacion = document.getElementById("listaExplicacion");

    // Guarda en una variable el botón para pausar la simulación.
    const btnPausar = document.getElementById("btnPausar");

    // Guarda en una variable el botón para reanudar la simulación.
    const btnReanudar = document.getElementById("btnReanudar");

    // Guarda en una variable el botón para reiniciar la simulación.
    const btnReiniciar = document.getElementById("btnReiniciar");

    // Lista donde se guardarán los planetas que se están simulando.
    let planetasSimulados = [];

    // Variable booleana que indica si la animación está activa o pausada.
    let animacionActiva = false;

    // Guarda el identificador de la animación para poder cancelarla después.
    let idAnimacion = null;

    // Guarda el tiempo del frame anterior para calcular cuánto tiempo pasó.
    let ultimoTiempo = null;

    // Guarda la cantidad de días que han pasado dentro de la simulación.
    let diasSimulados = 0;

    // Distancia mínima al Sol usada para calcular la escala visual de las órbitas.
    const DISTANCIA_MIN_KM = 57_900_000;

    // Distancia máxima al Sol usada para calcular la escala visual de las órbitas.
    const DISTANCIA_MAX_KM = 4_495_100_000;

    // Detecta cuando el usuario mueve la barra de velocidad.
    velocidadSimulacion.addEventListener("input", () => {

        // Actualiza el texto que muestra cuántos días pasan por segundo.
        speedLabel.textContent = `${velocidadSimulacion.value} días/segundo`;
    });

    // Detecta cuando el usuario presiona el botón “Calcular y simular”.
    formulario.addEventListener("submit", async (event) => {

        // Evita que el formulario recargue la página.
        event.preventDefault();

        // Oculta cualquier error anterior.
        ocultarError();

        // Obtiene la lista de planetas seleccionados.
        const seleccionados = obtenerPlanetasSeleccionados();

        // Verifica si no se seleccionó ningún planeta.
        if (seleccionados.length === 0) {

            // Muestra un mensaje de error.
            mostrarError("Debe seleccionar al menos un planeta para simular.");

            // Detiene la ejecución de esta función.
            return;
        }

        // Intenta enviar los datos al servidor Flask.
        try {

            // Envía una petición POST a la ruta /calcular del backend.
            const respuesta = await fetch("/calcular", {

                // Define que se enviarán datos mediante POST.
                method: "POST",

                // Indica que el contenido enviado será JSON.
                headers: {
                    "Content-Type": "application/json"
                },

                // Convierte la lista de planetas seleccionados a formato JSON.
                body: JSON.stringify({
                    planetas: seleccionados
                })
            });

            // Convierte la respuesta del backend a un objeto de JavaScript.
            const data = await respuesta.json();

            // Verifica si el backend respondió con error.
            if (!data.ok) {

                // Muestra el error enviado por Flask.
                mostrarError(data.error);

                // Detiene la función.
                return;
            }

            // Crea la simulación visual con los planetas recibidos.
            cargarSimulacion(data.planetas);

            // Muestra los datos físicos en la tabla.
            mostrarTabla(data.planetas);

            // Muestra los pasos del procedimiento físico.
            mostrarExplicacion(data.explicacion);

        } catch (error) {

            // Muestra este error si no se pudo conectar con Flask.
            mostrarError("No se pudo conectar con el servidor Flask.");
        }
    });

    // Detecta cuando el usuario presiona el botón de pausar.
    btnPausar.addEventListener("click", () => {

        // Cambia el estado de la animación a falso.
        animacionActiva = false;

        // Verifica si existe una animación activa.
        if (idAnimacion) {

            // Cancela la animación actual.
            cancelAnimationFrame(idAnimacion);
        }

        // Cambia el texto informativo.
        simulationInfo.textContent = "Simulación pausada.";
    });

    // Detecta cuando el usuario presiona el botón de reanudar.
    btnReanudar.addEventListener("click", () => {

        // Verifica si todavía no hay planetas simulados.
        if (planetasSimulados.length === 0) {

            // Muestra un error.
            mostrarError("Primero debe calcular una simulación.");

            // Detiene la función.
            return;
        }

        // Activa la animación.
        animacionActiva = true;

        // Reinicia el tiempo anterior para evitar saltos bruscos.
        ultimoTiempo = null;

        // Inicia nuevamente la animación.
        idAnimacion = requestAnimationFrame(animar);

        // Actualiza el texto informativo.
        simulationInfo.textContent = "Simulación en movimiento.";
    });

    // Detecta cuando el usuario presiona el botón de reiniciar.
    btnReiniciar.addEventListener("click", () => {

        // Reinicia el contador de días simulados.
        diasSimulados = 0;

        // Reinicia el tiempo anterior.
        ultimoTiempo = null;

        // Vuelve a colocar los planetas en su posición inicial.
        actualizarPosiciones();

        // Actualiza el texto informativo.
        simulationInfo.textContent = "Simulación reiniciada al día 0.";
    });

    // Función que obtiene los planetas marcados por el usuario.
    function obtenerPlanetasSeleccionados() {

        // Busca todos los checkboxes de planetas que estén seleccionados.
        const checks = document.querySelectorAll('input[name="planetas"]:checked');

        // Convierte los checkboxes seleccionados en una lista con sus nombres.
        return Array.from(checks).map(check => check.value);
    }

    // Función que crea y carga la simulación en pantalla.
    function cargarSimulacion(planetas) {

        // Borra planetas y órbitas anteriores.
        limpiarSistema();

        // Reinicia los días simulados.
        diasSimulados = 0;

        // Reinicia el tiempo del frame anterior.
        ultimoTiempo = null;

        // Verifica si ya había una animación activa.
        if (idAnimacion) {

            // Cancela la animación anterior.
            cancelAnimationFrame(idAnimacion);
        }

        // Recorre cada planeta recibido desde Flask y crea sus elementos visuales.
        planetasSimulados = planetas.map((planeta, index) => {

            // Calcula el radio visual de la órbita según la distancia real del planeta al Sol.
            const orbitRadius = calcularRadioOrbita(planeta.distancia_sol_km);

            // Calcula el tamaño visual del planeta según su diámetro.
            const planetSize = calcularTamanoPlaneta(planeta.diametro_km);

            // Crea el elemento HTML que representa la órbita.
            const orbitElement = crearOrbita(orbitRadius);

            // Crea el elemento HTML que representa el planeta.
            const planetElement = crearPlaneta(planeta, planetSize);

            // Agrega la órbita al contenedor del sistema solar.
            solarSystem.appendChild(orbitElement);

            // Agrega el planeta al contenedor del sistema solar.
            solarSystem.appendChild(planetElement);

            // Devuelve un objeto con los datos físicos y visuales del planeta.
            return {

                // Copia todos los datos originales del planeta.
                ...planeta,

                // Guarda el radio visual de la órbita.
                orbitRadius,

                // Guarda el tamaño visual del planeta.
                planetSize,

                // Guarda el elemento HTML del planeta.
                element: planetElement,

                // Guarda la superficie del planeta para poder rotarla.
                surface: planetElement.querySelector(".planet-surface"),

                // Define una posición inicial distinta para cada planeta.
                initialAngle: (index * 2 * Math.PI) / planetas.length
            };
        });

        // Muestra la sección de resultados.
        resultados.classList.remove("hidden");

        // Muestra la sección de explicación.
        explicacion.classList.remove("hidden");

        // Coloca los planetas en su posición inicial.
        actualizarPosiciones();

        // Activa la animación.
        animacionActiva = true;

        // Inicia la animación con requestAnimationFrame.
        idAnimacion = requestAnimationFrame(animar);

        // Muestra información sobre la simulación.
        simulationInfo.textContent =
            `Simulando ${planetas.length} planeta(s). Ahora tienen traslación alrededor del Sol y rotación propia visible.`;
    }

    // Función que borra planetas y órbitas anteriores.
    function limpiarSistema() {

        // Busca todos los elementos que sean órbitas o planetas.
        const elementos = solarSystem.querySelectorAll(".orbit-path, .planet-body");

        // Elimina cada elemento encontrado.
        elementos.forEach(elemento => elemento.remove());
    }

    // Función que crea una órbita visual.
    function crearOrbita(radio) {

        // Crea un div para representar la órbita.
        const orbit = document.createElement("div");

        // Agrega la clase CSS que le da forma de órbita.
        orbit.classList.add("orbit-path");

        // Define el ancho de la órbita.
        orbit.style.width = `${radio * 2}px`;

        // Define la altura de la órbita, reducida para dar perspectiva.
        orbit.style.height = `${radio * 2 * 0.55}px`;

        // Devuelve la órbita creada.
        return orbit;
    }

    // Función que crea visualmente un planeta.
    function crearPlaneta(planeta, size) {

        // Crea el contenedor principal del planeta.
        const element = document.createElement("div");

        // Agrega la clase CSS del planeta.
        element.classList.add("planet-body");

        // Define el ancho del planeta.
        element.style.width = `${size}px`;

        // Define la altura del planeta.
        element.style.height = `${size}px`;

        // Crea un eje visual para mostrar que el planeta rota.
        const eje = document.createElement("div");

        // Agrega la clase CSS del eje.
        eje.classList.add("planet-axis");

        // Crea la superficie del planeta.
        const surface = document.createElement("div");

        // Agrega la clase CSS de superficie.
        surface.classList.add("planet-surface");

        // Aplica el color o textura del planeta.
        surface.style.background = obtenerEstiloPlaneta(planeta.nombre);

        // Verifica si el planeta es Saturno.
        if (planeta.nombre === "Saturno") {

            // Crea el anillo de Saturno.
            const ring = document.createElement("div");

            // Agrega la clase CSS del anillo.
            ring.classList.add("saturn-ring");

            // Agrega el anillo al planeta.
            element.appendChild(ring);
        }

        // Verifica si el planeta es la Tierra.
        if (planeta.nombre === "Tierra") {

            // Crea el primer continente decorativo.
            const land1 = document.createElement("div");

            // Agrega clases CSS al primer continente.
            land1.classList.add("earth-land", "land-1");

            // Crea el segundo continente decorativo.
            const land2 = document.createElement("div");

            // Agrega clases CSS al segundo continente.
            land2.classList.add("earth-land", "land-2");

            // Agrega el primer continente a la superficie.
            surface.appendChild(land1);

            // Agrega el segundo continente a la superficie.
            surface.appendChild(land2);
        }

        // Crea una etiqueta para mostrar el nombre del planeta.
        const label = document.createElement("span");

        // Agrega la clase CSS de etiqueta.
        label.classList.add("planet-label");

        // Escribe el nombre del planeta en la etiqueta.
        label.textContent = planeta.nombre;

        // Agrega el eje al planeta.
        element.appendChild(eje);

        // Agrega la superficie al planeta.
        element.appendChild(surface);

        // Agrega la etiqueta al planeta.
        element.appendChild(label);

        // Devuelve el planeta completo.
        return element;
    }

    // Función principal de animación.
    function animar(timestamp) {

        // Si la animación está pausada, se detiene.
        if (!animacionActiva) {

            // Sale de la función.
            return;
        }

        // Si no hay tiempo anterior, se asigna el tiempo actual.
        if (ultimoTiempo === null) {

            // Guarda el tiempo actual como referencia.
            ultimoTiempo = timestamp;
        }

        // Calcula cuántos segundos pasaron desde el frame anterior.
        const segundosTranscurridos = (timestamp - ultimoTiempo) / 1000;

        // Actualiza el último tiempo registrado.
        ultimoTiempo = timestamp;

        // Lee la cantidad de días por segundo desde la barra de velocidad.
        const diasPorSegundo = Number(velocidadSimulacion.value);

        // Aumenta los días simulados según el tiempo transcurrido.
        diasSimulados += segundosTranscurridos * diasPorSegundo;

        // Actualiza la posición y rotación de los planetas.
        actualizarPosiciones();

        // Pide al navegador que vuelva a ejecutar esta función en el próximo frame.
        idAnimacion = requestAnimationFrame(animar);
    }

    // Función que actualiza la posición orbital y la rotación propia.
    function actualizarPosiciones() {

        // Obtiene el tamaño y posición del contenedor del sistema solar.
        const rect = solarSystem.getBoundingClientRect();

        // Calcula el centro horizontal del sistema solar.
        const centroX = rect.width / 2;

        // Calcula el centro vertical del sistema solar.
        const centroY = rect.height / 2;

        // Recorre cada planeta simulado.
        planetasSimulados.forEach(planeta => {

            // Calcula el ángulo actual de traslación orbital.
            const anguloOrbital =
                planeta.initialAngle +
                (2 * Math.PI * diasSimulados) / planeta.periodo_orbital_dias;

            // Calcula la posición X del planeta usando coseno.
            const x = centroX + planeta.orbitRadius * Math.cos(anguloOrbital);

            // Calcula la posición Y del planeta usando seno.
            const y = centroY + planeta.orbitRadius * 0.55 * Math.sin(anguloOrbital);

            // Mueve el planeta horizontalmente.
            planeta.element.style.left = `${x}px`;

            // Mueve el planeta verticalmente.
            planeta.element.style.top = `${y}px`;

            // Centra el planeta sin rotar todo su contenedor.
            planeta.element.style.transform = "translate(-50%, -50%)";

            // Calcula los grados de rotación propia del planeta.
            const gradosRotacion =
                (diasSimulados * 24 * 360) / planeta.periodo_rotacion_horas;

            // Rota solamente la superficie del planeta, no toda la órbita.
            planeta.surface.style.transform = `rotate(${gradosRotacion}deg)`;
        });
    }

    // Función que calcula el tamaño visual de la órbita.
    function calcularRadioOrbita(distanciaKm) {

        // Obtiene el tamaño del sistema solar en pantalla.
        const rect = solarSystem.getBoundingClientRect();

        // Calcula el radio máximo permitido dentro del contenedor.
        const maxRadio = Math.min(rect.width, rect.height) * 0.43;

        // Define un radio mínimo para que los planetas no queden pegados al Sol.
        const minRadio = 55;

        // Verifica si el usuario eligió la escala compacta.
        if (escalaVisual.value === "compacta") {

            // Normaliza la distancia real entre 0 y 1 usando escala lineal.
            const normal =
                (distanciaKm - DISTANCIA_MIN_KM) /
                (DISTANCIA_MAX_KM - DISTANCIA_MIN_KM);

            // Devuelve el radio visual calculado.
            return minRadio + normal * (maxRadio - minRadio);
        }

        // Calcula el logaritmo de la distancia mínima.
        const logMin = Math.log10(DISTANCIA_MIN_KM);

        // Calcula el logaritmo de la distancia máxima.
        const logMax = Math.log10(DISTANCIA_MAX_KM);

        // Calcula el logaritmo de la distancia del planeta.
        const logDist = Math.log10(distanciaKm);

        // Normaliza la distancia usando escala logarítmica.
        const normal = (logDist - logMin) / (logMax - logMin);

        // Devuelve el radio visual de la órbita.
        return minRadio + normal * (maxRadio - minRadio);
    }

    // Función que calcula el tamaño visual de cada planeta.
    function calcularTamanoPlaneta(diametroKm) {

        // Diámetro de la Tierra usado como referencia visual.
        const tierraDiametro = 12742;

        // Calcula el tamaño visual usando raíz cuadrada para evitar tamaños exagerados.
        const size = Math.sqrt(diametroKm / tierraDiametro) * 18;

        // Limita el tamaño mínimo a 8 px y el máximo a 42 px.
        return Math.max(8, Math.min(size, 42));
    }

    // Función que devuelve el estilo visual de cada planeta.
    function obtenerEstiloPlaneta(nombre) {

        // Diccionario de estilos visuales para cada planeta.
        const estilos = {

            // Estilo gris para Mercurio.
            "Mercurio":
                "radial-gradient(circle at 35% 30%, #d6d0c8, #8f8f8f 45%, #4f4f4f 100%)",

            // Estilo amarillo/naranja para Venus.
            "Venus":
                "radial-gradient(circle at 35% 30%, #fff0a8, #d9b36c 50%, #9c6b2f 100%)",

            // Estilo azul para Tierra.
            "Tierra":
                "radial-gradient(circle at 35% 30%, #b7f3ff, #4aa3df 45%, #1565a9 100%)",

            // Estilo rojizo para Marte.
            "Marte":
                "radial-gradient(circle at 35% 30%, #ffb188, #c75132 50%, #732819 100%)",

            // Estilo con bandas para Júpiter.
            "Júpiter":
                "repeating-linear-gradient(90deg, #d8a56f 0px, #d8a56f 7px, #f2d6a5 7px, #f2d6a5 14px, #b8754f 14px, #b8754f 21px)",

            // Estilo amarillo para Saturno.
            "Saturno":
                "radial-gradient(circle at 35% 30%, #fff3b0, #e3c878 50%, #a78335 100%)",

            // Estilo celeste para Urano.
            "Urano":
                "radial-gradient(circle at 35% 30%, #d6ffff, #7ad7df 50%, #3e9faa 100%)",

            // Estilo azul intenso para Neptuno.
            "Neptuno":
                "radial-gradient(circle at 35% 30%, #9ab4ff, #3154d4 50%, #14246e 100%)"
        };

        // Devuelve el estilo correspondiente o usa Tierra si no encuentra el planeta.
        return estilos[nombre] || estilos["Tierra"];
    }

    // Función que muestra la tabla de datos físicos.
    function mostrarTabla(planetas) {

        // Limpia la tabla anterior.
        tablaResultados.innerHTML = "";

        // Recorre cada planeta recibido.
        planetas.forEach(planeta => {

            // Crea una nueva fila de tabla.
            const fila = document.createElement("tr");

            // Inserta las celdas con los datos del planeta.
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

    // Función que muestra la explicación del procedimiento.
    function mostrarExplicacion(pasos) {

        // Limpia la explicación anterior.
        listaExplicacion.innerHTML = "";

        // Recorre cada paso recibido desde Flask.
        pasos.forEach(paso => {

            // Crea un elemento de lista.
            const li = document.createElement("li");

            // Escribe el texto del paso.
            li.textContent = paso;

            // Agrega el paso a la lista ordenada.
            listaExplicacion.appendChild(li);
        });
    }

    // Función que muestra un error en pantalla.
    function mostrarError(mensaje) {

        // Coloca el mensaje dentro de la caja de error.
        errorBox.textContent = mensaje;

        // Quita la clase hidden para hacer visible el error.
        errorBox.classList.remove("hidden");
    }

    // Función que oculta el error.
    function ocultarError() {

        // Borra el texto del error.
        errorBox.textContent = "";

        // Agrega la clase hidden para ocultar la caja.
        errorBox.classList.add("hidden");
    }

    // Función que da formato a números grandes.
    function formatearNumero(numero) {

        // Convierte el número al formato usado en Nicaragua y limita decimales.
        return Number(numero).toLocaleString("es-NI", {
            maximumFractionDigits: 2
        });
    }
});