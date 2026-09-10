/********************************************************************
 * ui.js
 * Manejo de la interfaz
 ********************************************************************/

class UI {

    constructor() {

        //==========================================================
        // CONTROLES
        //==========================================================

        this.cmbAulas = document.getElementById("cmbAulas");
        this.cmbCursos = document.getElementById("cmbCursos");

        this.btnVista = document.getElementById("btnVista");

        this.btnPlantaBaja = document.getElementById("btnPlantaBaja");
        this.btnPlantaAlta = document.getElementById("btnPlantaAlta");

        this.estado = document.getElementById("estado");

        //==========================================================
        // EVITA DISPARAR EVENTOS AL RECARGAR COMBOS
        //==========================================================

        this.actualizando = false;

    }

    /*************************************************************/
    /* CARGAR COMBO AULAS */
    /*************************************************************/

    cargarAulas(aulas) {

        this.actualizando = true;

        this.cmbAulas.innerHTML = "";

        const primero = document.createElement("option");

        primero.value = "";
        primero.textContent = "Seleccione un aula...";

        this.cmbAulas.appendChild(primero);

        aulas.forEach(aula => {

            if (!aula.nombre)
                return;

            const op = document.createElement("option");

            op.value = aula.nombre;
            op.textContent = aula.nombre;

            this.cmbAulas.appendChild(op);

        });

        this.cmbAulas.selectedIndex = 0;

        this.actualizando = false;

    }

    /*************************************************************/
    /* CARGAR COMBO CURSOS */
    /*************************************************************/

    cargarCursos(cursos) {

        this.actualizando = true;

        this.cmbCursos.innerHTML = "";

        const primero = document.createElement("option");

        primero.value = "";
        primero.textContent = "Seleccione un curso...";

        this.cmbCursos.appendChild(primero);

        cursos.forEach(curso => {

            if (!curso.curso)
                return;

            if (curso.curso.trim() === "")
                return;

            const op = document.createElement("option");

            op.value = curso.curso.trim();
            op.textContent = curso.curso.trim();

            this.cmbCursos.appendChild(op);

        });

        this.cmbCursos.selectedIndex = 0;

        this.actualizando = false;

    }

    /*************************************************************/
    /* EVENTOS */
    /*************************************************************/

    onSeleccionAula(callback) {

        this.cmbAulas.addEventListener("change", () => {

            if (this.actualizando)
                return;

            callback(this.cmbAulas.value);

        });

    }

    /*************************************************************/

    onSeleccionCurso(callback) {

        this.cmbCursos.addEventListener("change", () => {

            if (this.actualizando)
                return;

            callback(this.cmbCursos.value);

        });

    }

    /*************************************************************/

    onVistaCompleta(callback) {

        this.btnVista.addEventListener(

            "click",

            callback

        );

    }

    /*************************************************************/
    /* BOTONES DE PLANTA */
    /*************************************************************/

    onPlantaBaja(callback) {

        this.btnPlantaBaja.addEventListener(

            "click",

            callback

        );

    }

    /*************************************************************/

    onPlantaAlta(callback) {

        this.btnPlantaAlta.addEventListener(

            "click",

            callback

        );

    }

    /*************************************************************/
    /* MARCAR PLANTA ACTIVA */
    /*************************************************************/

    marcarPlanta(planta) {

        this.btnPlantaBaja.classList.remove("activo");
        this.btnPlantaAlta.classList.remove("activo");

        if (planta === "baja") {

            this.btnPlantaBaja.classList.add("activo");

        } else {

            this.btnPlantaAlta.classList.add("activo");

        }

    }

    /*************************************************************/
    /* SELECCIONAR */
    /*************************************************************/

    seleccionarAula(nombre) {

        this.actualizando = true;

        this.cmbAulas.value = nombre;

        this.actualizando = false;

    }

    /*************************************************************/

    seleccionarCurso(nombre) {

        this.actualizando = true;

        this.cmbCursos.value = nombre;

        this.actualizando = false;

    }

    /*************************************************************/
    /* ESTADO */
    /*************************************************************/

    setEstado(texto) {

        this.estado.textContent = texto;

    }

}