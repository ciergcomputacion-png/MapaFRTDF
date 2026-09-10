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
        this.contenedorDependencias = document.getElementById("contenedorDependencias");

        this.btnVista = document.getElementById("btnVista");

        this.btnPlantaBaja = document.getElementById("btnPlantaBaja");
        this.btnPlantaAlta = document.getElementById("btnPlantaAlta");

        this.estado = document.getElementById("estado");

        //==========================================================
        // EVITA DISPARAR EVENTOS AL RECARGAR COMBOS
        //==========================================================

        this.actualizando = false;
        this.callbackSeleccionAula = null;

        this.contenedorDependencias.addEventListener("change", evento => {

            if (!this.actualizando && evento.target.matches("select"))
                this.callbackSeleccionAula?.(evento.target.value);

        });

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

        const aulasPrincipales = aulas.filter(aula =>
            !aula.esEtiqueta || aula.tipo.toLowerCase() === "aula"
        );

        aulasPrincipales.forEach(aula => {

            if (!aula.nombre)
                return;

            const op = document.createElement("option");

            op.value = aula.nombre;
            op.textContent = aula.etiquetaNombre || aula.nombre;

            this.cmbAulas.appendChild(op);

        });

        this.cmbAulas.selectedIndex = 0;

        this.contenedorDependencias.innerHTML = "";

        const dependencias = new Map();

        aulas
            .filter(aula => aula.esEtiqueta && aula.tipo.toLowerCase() !== "aula")
            .forEach(aula => {
                if (!dependencias.has(aula.tipo))
                    dependencias.set(aula.tipo, []);
                dependencias.get(aula.tipo).push(aula);
            });

        dependencias.forEach((elementos, tipo) => {

            const grupo = document.createElement("div");
            grupo.className = "grupo";

            const etiqueta = document.createElement("label");
            etiqueta.textContent = tipo;

            const select = document.createElement("select");
            select.dataset.tipoDependencia = tipo;

            const primeroDependencia = document.createElement("option");
            primeroDependencia.value = "";
            primeroDependencia.textContent = `Seleccione ${tipo.toLowerCase()}...`;
            select.appendChild(primeroDependencia);

            elementos.forEach(aula => {
                const op = document.createElement("option");
                op.value = aula.nombre;
                op.textContent = aula.etiquetaNombre || aula.nombre;
                select.appendChild(op);
            });

            grupo.appendChild(etiqueta);
            grupo.appendChild(select);
            this.contenedorDependencias.appendChild(grupo);

        });

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

        this.callbackSeleccionAula = callback;

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

        this.contenedorDependencias
            .querySelectorAll("select")
            .forEach(select => {
                select.value = nombre;
            });

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