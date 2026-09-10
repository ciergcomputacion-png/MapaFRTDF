/********************************************************************
 * datos.js
 * Administración de datos
 ********************************************************************/

class BaseDatos {

    constructor() {

        this.aulas = [];

        this.cursos = [];

        this.indiceAulas = new Map();

        this.indiceCursos = new Map();

    }

    /*************************************************************/
    /* CARGAR CURSOS */
    /*************************************************************/

    async cargarCursos() {

        try {

            const respuesta = await fetch("data/cursos.json");

            this.cursos = await respuesta.json();

            this.crearIndiceCursos();

        }

        catch(error){

            console.error(error);

        }

    }

    /*************************************************************/
    /* LEER AULAS DEL SVG */
    /*************************************************************/

    cargarAulasDesdeSVG(svg){

    this.aulas = [];
    this.indiceAulas.clear();

    const textos = svg.querySelectorAll("text");

    console.log("Cantidad de <text>:", textos.length);

    textos.forEach(texto => {

        const nombre = this.normalizar(texto.textContent);

        console.log("Texto:", `"${nombre}"`);

        if (nombre === "")
            return;

        const bbox = texto.getBBox();

        const aula = {

            nombre: nombre,
            x: bbox.x + (bbox.width / 2),
            y: bbox.y + (bbox.height / 2),
            nodo: texto

        };

        this.aulas.push(aula);
        this.indiceAulas.set(nombre, aula);

    });

    console.log("Aulas encontradas:", this.aulas.length);
}

    /*************************************************************/

    crearIndiceCursos(){

        this.indiceCursos.clear();

        this.cursos.forEach(curso=>{

            this.indiceCursos.set(

                this.normalizar(curso.curso),

                curso

            );

        });

    }

    /*************************************************************/

    buscarAula(nombre){

        const nombreNormalizado = this.normalizar(nombre);

        return this.indiceAulas.get(nombreNormalizado)
            || this.indiceAulas.get(`AULA ${nombreNormalizado}`);

    }

    /*************************************************************/

    buscarCurso(nombre){

        return this.indiceCursos.get(

            this.normalizar(nombre)

        );

    }

    /*************************************************************/

    normalizar(texto){

        return String(texto ?? "")

            .replace(/\s+/g," ")

            .trim()

            .toUpperCase();

    }

}