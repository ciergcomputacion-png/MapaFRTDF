class AdministradorCursos {

    constructor(app) {

        this.clave = "admin123";
        this.autenticado = false;
        this.app = app;
        this.panel = document.getElementById("panelAdministrador");
        this.acceso = document.getElementById("accesoAdministrador");
        this.contenido = document.getElementById("contenidoAdministrador");
        this.formularioClave = document.getElementById("formularioClaveAdministrador");
        this.claveInput = document.getElementById("claveAdministrador");
        this.errorClave = document.getElementById("errorClaveAdministrador");
        this.tabla = document.querySelector("#tablaCursos tbody");
        this.estado = document.getElementById("estadoAdministrador");
        this.registros = [];

        document.getElementById("tipoEtiqueta").addEventListener("change", evento => {
            const personalizado = document.getElementById("tipoEtiquetaPersonalizado");
            personalizado.hidden = evento.target.value !== "Otro";
            personalizado.value = "";
        });

        document.getElementById("btnUbicarEtiqueta").addEventListener("click", () => {

            const nombre = document.getElementById("nombreEtiqueta").value.trim();
            const tipoSeleccionado = document.getElementById("tipoEtiqueta").value;
            const tipoPersonalizado = document.getElementById("tipoEtiquetaPersonalizado").value.trim();
            const tipo = tipoSeleccionado === "Otro" && tipoPersonalizado
                ? tipoPersonalizado
                : tipoSeleccionado;
            const planta = document.getElementById("plantaEtiqueta").value;

            if (!nombre) {
                this.mostrarEstado("Escribe un nombre para la etiqueta.");
                return;
            }

            this.app.prepararEtiqueta(nombre, tipo, planta);
            document.getElementById("nombreEtiqueta").value = "";
            this.cerrar(false, false);

        });

        document.getElementById("btnAdministrador").addEventListener("click", () => {
            this.abrir();
        });

        document.getElementById("btnCerrarAccesoAdministrador").addEventListener("click", () => {
            this.cerrar();
        });

        this.formularioClave.addEventListener("submit", evento => {
            evento.preventDefault();
            this.validarClave();
        });

        document.getElementById("btnCerrarAdministrador").addEventListener("click", () => {
            this.cerrar();
        });

        document.getElementById("btnAgregarCurso").addEventListener("click", () => {
            this.registros.push({ aula: "", curso: "", planta: "" });
            this.renderizar();
        });

        document.getElementById("btnGuardarCursos").addEventListener("click", () => {
            this.guardar();
        });

        document.getElementById("btnDescargarCursos").addEventListener("click", () => {
            this.descargar();
        });

        document.getElementById("archivoCursos").addEventListener("change", evento => {
            this.importar(evento.target.files[0]);
            evento.target.value = "";
        });

    }

    abrir() {

        this.panel.hidden = false;

        if (!this.autenticado) {
            this.acceso.hidden = false;
            this.claveInput.value = "";
            this.errorClave.textContent = "";
            this.claveInput.focus();
            return;
        }

        this.mostrarPanel();

    }

    validarClave() {

        if (this.claveInput.value !== this.clave) {
            this.errorClave.textContent = "La clave no es correcta.";
            this.claveInput.select();
            return;
        }

        this.autenticado = true;
        this.mostrarPanel();

    }

    mostrarPanel() {

        this.acceso.hidden = true;
        this.contenido.hidden = false;
        this.registros = this.app.bd.cursos.map(curso => ({ ...curso }));
        this.renderizar();

    }

    cerrar(cancelarEdicion = true, cerrarSesion = true) {

        if (cancelarEdicion)
            this.app.cancelarEtiqueta();

        this.panel.hidden = true;
        if (cerrarSesion)
            this.autenticado = false;
        this.acceso.hidden = false;
        this.contenido.hidden = true;
        this.claveInput.value = "";
        this.errorClave.textContent = "";

    }

    renderizar() {

        this.tabla.innerHTML = "";

        this.registros.forEach((registro, indice) => {

            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td><input data-campo="aula" data-indice="${indice}" value="${this.escapar(registro.aula)}"></td>
                <td><input data-campo="curso" data-indice="${indice}" value="${this.escapar(registro.curso)}"></td>
                <td><input data-campo="planta" data-indice="${indice}" value="${this.escapar(registro.planta)}" placeholder="baja o alta"></td>
                <td><button class="btnEliminarFila" data-indice="${indice}" type="button">Eliminar</button></td>
            `;
            this.tabla.appendChild(fila);

        });

        this.tabla.querySelectorAll("input").forEach(input => {
            input.addEventListener("input", evento => {
                const indice = Number(evento.target.dataset.indice);
                const campo = evento.target.dataset.campo;
                this.registros[indice][campo] = evento.target.value;
            });
        });

        this.tabla.querySelectorAll(".btnEliminarFila").forEach(boton => {
            boton.addEventListener("click", () => {
                this.registros.splice(Number(boton.dataset.indice), 1);
                this.renderizar();
            });
        });

    }

    guardar() {

        this.registros = this.registros
            .map(registro => ({
                ...registro,
                aula: String(registro.aula ?? "").trim(),
                curso: String(registro.curso ?? "").trim(),
                planta: String(registro.planta ?? "").trim().toLowerCase()
            }))
            .filter(registro => registro.aula !== "");

        localStorage.setItem("mapaCursos", JSON.stringify(this.registros));
        this.app.actualizarCursos(this.registros);
        this.renderizar();
        this.mostrarEstado("Cambios guardados en este navegador.");

    }

    async importar(archivo) {

        if (!archivo)
            return;

        const texto = await archivo.text();
        const datos = this.parsearCSV(texto);
        this.registros = datos.cursos;
        localStorage.setItem("mapaEtiquetas", JSON.stringify(datos.etiquetas));
        this.renderizar();
        this.mostrarEstado("CSV importado. Guarda los cambios para aplicarlos al mapa.");

    }

    parsearCSV(texto) {

        const lineas = texto.replace(/^\uFEFF/, "").split(/\r?\n/).filter(linea => linea.trim() !== "");
        const separador = lineas[0]?.includes(";") ? ";" : ",";

        const cursos = [];
        const etiquetas = [];

        lineas.slice(1).forEach(linea => {
            const columnas = linea.split(separador).map(valor => valor.trim().replace(/^"|"$/g, ""));
            const registro = (columnas[3] || "curso").toLowerCase();

            if (registro === "etiqueta") {
                const formatoNuevo = columnas.length >= 7;
                etiquetas.push({
                    id: `ETIQUETA_${Date.now()}_${etiquetas.length}`,
                    nombre: columnas[1] ?? "",
                    planta: columnas[2] ?? "baja",
                    tipo: formatoNuevo ? (columnas[4] || "Otro") : "Otro",
                    x: Number(columnas[formatoNuevo ? 5 : 4]) || 0,
                    y: Number(columnas[formatoNuevo ? 6 : 5]) || 0
                });
                return;
            }

            cursos.push({ aula: columnas[0] ?? "", curso: columnas[1] ?? "", planta: columnas[2] ?? "" });
        });

        return { cursos, etiquetas };

    }

    descargar(mostrarEstado = true) {

        const filas = ["Aula;Curso;Planta;Registro;Tipo;X;Y"];

        this.registros.forEach(registro => {
            filas.push(`${this.csv(registro.aula)};${this.csv(registro.curso)};${this.csv(registro.planta)};curso;;;`);
        });

        const etiquetas = JSON.parse(localStorage.getItem("mapaEtiquetas") || "[]");

        etiquetas.forEach(etiqueta => {
            filas.push(`;${this.csv(etiqueta.nombre)};${this.csv(etiqueta.planta)};etiqueta;${this.csv(etiqueta.tipo || "Otro")};${etiqueta.x};${etiqueta.y}`);
        });

        const enlace = document.createElement("a");
        enlace.href = URL.createObjectURL(new Blob([filas.join("\n")], { type: "text/csv;charset=utf-8" }));
        enlace.download = "Cursos-Aulas.csv";
        enlace.click();
        URL.revokeObjectURL(enlace.href);
        if (mostrarEstado)
            this.mostrarEstado("CSV descargado.");

    }

    guardarCSVAutomatico() {

        this.descargar(false);

    }

    csv(valor) {

        const texto = String(valor ?? "");
        return /[;"\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;

    }

    escapar(valor) {

        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

    }

    mostrarEstado(texto) {

        this.estado.textContent = texto;

    }

}