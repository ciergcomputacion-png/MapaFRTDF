/********************************************************************
 * app.js
 * Coordinador principal
 ********************************************************************/

class MapaColegio {

    constructor() {

        this.ui = new UI();

        this.bd = new BaseDatos();

        this.visor = new VisorSVG("visorSVG");

        this.admin = new AdministradorCursos(this);

        this.etiquetaPendiente = null;

        this.visor.onClickMapa(coordenadas => {
            this.colocarEtiqueta(coordenadas);
        });

        this.visor.onCambioEtiqueta((id, x, y) => {
            this.actualizarEtiqueta(id, x, y);
        });

        this.visor.onEliminarEtiqueta(id => {
            this.eliminarEtiqueta(id);
        });

        this.plantaActual = "";

        this.inicializar();

    }

    /************************************************************/

    async inicializar() {

        this.ui.setEstado("Cargando cursos...");

        await this.bd.cargarCursos();

        this.ui.cargarCursos(
            this.bd.cursos
        );

        await this.cargarPlanta("baja");

        this.registrarEventos();

        this.ui.setEstado("Listo.");

    }

    actualizarCursos(cursos) {

        this.bd.cursos = cursos;
        this.bd.crearIndiceCursos();
        this.ui.cargarCursos(this.bd.cursos);
        this.ui.setEstado("Cursos actualizados.");

    }

    /************************************************************/
    /* CARGAR PLANTA */
    /************************************************************/

    async cargarPlanta(planta) {

        this.plantaActual = planta;

        const archivo =
            planta === "baja"
                ? "svg/Planta_Baja.svg"
                : "svg/Planta_Alta.svg";

        await this.visor.cargarSVG(archivo);

        this.visor.cargarEtiquetasGuardadas(planta);

        this.bd.cargarAulasDesdeSVG(
            this.visor.svg
        );

        this.ui.cargarAulas(
            this.bd.aulas
        );

        this.ui.marcarPlanta(planta);

        this.visor.vistaCompleta();

    }

    prepararEtiqueta(nombre, tipo, planta) {

        this.etiquetaPendiente = { nombre, tipo, planta };

        if (planta !== this.plantaActual) {
            this.cargarPlanta(planta).then(() => {
                this.ui.setEstado("Haz clic en el mapa para colocar la etiqueta.");
            });
            return;
        }

        this.ui.setEstado("Haz clic en el mapa para colocar la etiqueta.");

    }

    cancelarEtiqueta() {

        if (!this.etiquetaPendiente)
            return;

        this.etiquetaPendiente = null;
        this.ui.setEstado("Edición de etiqueta cancelada.");

    }

    colocarEtiqueta(coordenadas) {

        if (!this.etiquetaPendiente)
            return;

        const etiqueta = {
            id: `ETIQUETA_${Date.now()}`,
            nombre: this.etiquetaPendiente.nombre,
            tipo: this.etiquetaPendiente.tipo,
            planta: this.etiquetaPendiente.planta,
            x: coordenadas.x,
            y: coordenadas.y
        };

        const etiquetas = JSON.parse(localStorage.getItem("mapaEtiquetas") || "[]");
        etiquetas.push(etiqueta);
        localStorage.setItem("mapaEtiquetas", JSON.stringify(etiquetas));
        this.visor.agregarEtiqueta(etiqueta);
        this.bd.cargarAulasDesdeSVG(this.visor.svg);
        this.ui.cargarAulas(this.bd.aulas);
        this.ui.setEstado(`${etiqueta.nombre} agregado al mapa.`);
        this.admin.guardarCSVAutomatico();
        this.etiquetaPendiente = null;
        this.admin.abrir();

    }

    actualizarEtiqueta(id, x, y) {

        const etiquetas = this.obtenerEtiquetas();
        const etiqueta = etiquetas.find(item => item.id === id);

        if (!etiqueta)
            return;

        etiqueta.x = x;
        etiqueta.y = y;
        localStorage.setItem("mapaEtiquetas", JSON.stringify(etiquetas));
        this.ui.setEstado(`${etiqueta.nombre} movido.`);
        this.admin.guardarCSVAutomatico();

    }

    eliminarEtiqueta(id) {

        const etiquetas = this.obtenerEtiquetas();
        const etiqueta = etiquetas.find(item => item.id === id);
        const restantes = etiquetas.filter(item => item.id !== id);

        localStorage.setItem("mapaEtiquetas", JSON.stringify(restantes));

        if (etiqueta)
            this.ui.setEstado(`${etiqueta.nombre} eliminado.`);

        this.bd.cargarAulasDesdeSVG(this.visor.svg);
        this.ui.cargarAulas(this.bd.aulas);
        this.admin.guardarCSVAutomatico();

    }

    obtenerEtiquetas() {

        return JSON.parse(localStorage.getItem("mapaEtiquetas") || "[]");

    }

    /************************************************************/
    /* EVENTOS */
    /************************************************************/

    registrarEventos() {

        //==========================================
        // AULA
        //==========================================

        this.ui.onSeleccionAula(

            nombre => {

                if (nombre === "")
                    return;

                this.irAAula(nombre);

            }

        );

        //==========================================
        // CURSO
        //==========================================

        this.ui.onSeleccionCurso(

            nombre => {

                if (nombre === "")
                    return;

                this.irACurso(nombre);

            }

        );

        //==========================================
        // PLANTA BAJA
        //==========================================

        this.ui.onPlantaBaja(async () => {

            await this.cargarPlanta("baja");

            this.ui.setEstado(
                "Planta Baja"
            );

        });

        //==========================================
        // PLANTA ALTA
        //==========================================

        this.ui.onPlantaAlta(async () => {

            await this.cargarPlanta("alta");

            this.ui.setEstado(
                "Planta Alta"
            );

        });

        //==========================================
        // VISTA COMPLETA
        //==========================================

        this.ui.onVistaCompleta(() => {

            this.visor.vistaCompleta();

            this.ui.setEstado(
                "Vista completa."
            );

        });

    }

    /************************************************************/
    /* IR A UN AULA */
    /************************************************************/

    irAAula(nombreAula) {

        const aula = this.bd.buscarAula(
            nombreAula
        );

        if (!aula) {

            this.ui.setEstado(
                "No se encontró el aula."
            );

            return;

        }

        this.visor.centrar(

            aula.x,

            aula.y,

            5

        );

        this.visor.resaltarAula(aula.nodo);

        const curso = this.bd.cursos.find(c =>

            this.bd.buscarAula(c.aula) === aula

        );

        if (curso && curso.curso) {

            this.ui.seleccionarCurso(

                curso.curso

            );

        }

        this.ui.setEstado(

            curso && curso.curso
                ? `${aula.nombre} - ${curso.curso}`
                : `${aula.nombre} - Sin curso asignado.`

        );

    }

    /************************************************************/
    /* IR A CURSO */
    /************************************************************/

    async irACurso(nombreCurso) {

        const curso = this.bd.buscarCurso(
            nombreCurso
        );

        if (!curso)
            return;

        const plantaIndicada = String(curso.planta ?? "")
            .trim()
            .toLowerCase();

        if (plantaIndicada && plantaIndicada !== this.plantaActual) {

            await this.cargarPlanta(

                plantaIndicada

            );

        }

        let aula = this.bd.buscarAula(curso.aula);

        if (!aula && !plantaIndicada) {

            await this.cargarPlanta(

                this.plantaActual === "baja" ? "alta" : "baja"

            );

            aula = this.bd.buscarAula(curso.aula);

        }

        if (!aula) {

            this.ui.setEstado("No se encontró el aula del curso.");

            return;

        }

        this.ui.seleccionarAula(

            aula.nombre

        );

        this.irAAula(

            aula.nombre

        );

    }

}

/****************************************************************/
/* INICIO */
/****************************************************************/

window.addEventListener(

    "DOMContentLoaded",

    () => {

        window.app =

            new MapaColegio();

    }

);