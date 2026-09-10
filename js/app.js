/********************************************************************
 * app.js
 * Coordinador principal
 ********************************************************************/

class MapaColegio {

    constructor() {

        this.ui = new UI();

        this.bd = new BaseDatos();

        this.visor = new VisorSVG("visorSVG");

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

        this.bd.cargarAulasDesdeSVG(
            this.visor.svg
        );

        this.ui.cargarAulas(
            this.bd.aulas
        );

        this.ui.marcarPlanta(planta);

        this.visor.vistaCompleta();

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

            this.bd.normalizar(c.aula) === aula.nombre

        );

        if (curso && curso.curso) {

            this.ui.seleccionarCurso(

                curso.curso

            );

        }

        this.ui.setEstado(

            aula.nombre

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