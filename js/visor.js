/********************************************************************
 * visor.js
 * Motor de visualización SVG
 ********************************************************************/

class VisorSVG {

    constructor(idContenedor) {

        this.contenedor = document.getElementById(idContenedor);

        this.svg = null;

        this.viewBox = {

            x: 0,
            y: 0,
            width: 0,
            height: 0

        };

        this.viewBoxInicial = {};

        this.arrastrando = false;

        this.mouse = {

            x: 0,
            y: 0

        };

        this.callbackClickMapa = null;

    }

    /*************************************************************/
    /* CARGAR SVG */
    /*************************************************************/

    async cargarSVG(ruta) {

        const respuesta = await fetch(ruta);

        const texto = await respuesta.text();

        this.contenedor.innerHTML = texto;

        this.svg = this.contenedor.querySelector("svg");

                if (!this.svg) {

            throw "No se pudo cargar el SVG.";

        }
        this.cargarTextos();
        const vb = this.svg
            .getAttribute("viewBox")
            .split(" ")
            .map(Number);

        this.viewBox = {

            x: vb[0],
            y: vb[1],
            width: vb[2],
            height: vb[3]

        };

        this.viewBoxInicial = { ...this.viewBox };

        this.actualizarViewBox();

        this.inicializarEventos();

    }
/*************************************************************/
/* TEXTOS SVG */
/*************************************************************/

cargarTextos(){

    this.textos = 
        Array.from(
            this.svg.querySelectorAll("text")
        );

}

    onClickMapa(callback) {

        this.callbackClickMapa = callback;

    }

    agregarEtiqueta(etiqueta) {

        const texto = document.createElementNS("http://www.w3.org/2000/svg", "text");

        texto.setAttribute("x", etiqueta.x);
        texto.setAttribute("y", etiqueta.y);
        texto.setAttribute("class", "etiqueta-mapa");
        texto.setAttribute("data-etiqueta-id", etiqueta.id);
        texto.textContent = etiqueta.nombre;
        this.svg.appendChild(texto);
        this.cargarTextos();

    }

    cargarEtiquetasGuardadas(planta) {

        const etiquetas = JSON.parse(localStorage.getItem("mapaEtiquetas") || "[]");

        etiquetas
            .filter(etiqueta => etiqueta.planta === planta)
            .forEach(etiqueta => this.agregarEtiqueta(etiqueta));

    }

    obtenerCoordenadas(evento) {

        const punto = this.svg.createSVGPoint();
        punto.x = evento.clientX;
        punto.y = evento.clientY;
        return punto.matrixTransform(this.svg.getScreenCTM().inverse());

    }



/*************************************************************/
/* BUSCAR TEXTO */
/*************************************************************/

buscarTexto(nombre){

    if(!this.textos)
        this.cargarTextos();


    nombre = nombre
        .toUpperCase()
        .trim();


    return this.textos.find(t => {

        return t.textContent
            .toUpperCase()
            .includes(nombre);

    });

    }

    /*************************************************************/
    /* RESALTAR AULA */
    /*************************************************************/

    resaltarAula(nodo) {

        if (!this.svg)
            return;

        this.svg
            .querySelectorAll(".aula-destacada")
            .forEach(elemento => elemento.classList.remove("aula-destacada"));

        if (nodo)
            nodo.classList.add("aula-destacada");

    }

    /*************************************************************/
    /* ACTUALIZAR VIEWBOX */
    /*************************************************************/

    actualizarViewBox() {

        this.svg.setAttribute(

            "viewBox",

            `${this.viewBox.x}
             ${this.viewBox.y}
             ${this.viewBox.width}
             ${this.viewBox.height}`

        );

    }

    /*************************************************************/
    /* RESTABLECER VISTA */
    /*************************************************************/

    vistaCompleta() {

        this.viewBox = {

            ...this.viewBoxInicial

        };

        this.actualizarViewBox();

    }

    /*************************************************************/
    /* ZOOM */
    /*************************************************************/

    zoom(factor, centroX, centroY) {

        const nuevoAncho = this.viewBox.width * factor;
        const nuevoAlto = this.viewBox.height * factor;

        this.viewBox.x =

            centroX -

            (centroX - this.viewBox.x)

            * (nuevoAncho / this.viewBox.width);

        this.viewBox.y =

            centroY -

            (centroY - this.viewBox.y)

            * (nuevoAlto / this.viewBox.height);

        this.viewBox.width = nuevoAncho;
        this.viewBox.height = nuevoAlto;

        this.actualizarViewBox();

    }

    /*************************************************************/
    /* CENTRAR */
    /*************************************************************/

    centrar(x, y, nivelZoom = 4) {

        const ancho =

            this.viewBoxInicial.width / nivelZoom;

        const alto =

            this.viewBoxInicial.height / nivelZoom;

        this.viewBox.width = ancho;
        this.viewBox.height = alto;

        this.viewBox.x =

            x - (ancho / 2);

        this.viewBox.y =

            y - (alto / 2);

        this.actualizarViewBox();

    }

    /*************************************************************/
    /* EVENTOS */
    /*************************************************************/

    inicializarEventos() {

        this.svg.addEventListener(

            "wheel",

            this.mouseWheel.bind(this),

            { passive:false }

        );

        this.svg.addEventListener(

            "mousedown",

            this.mouseDown.bind(this)

        );

        this.svg.addEventListener("click", evento => {

            if (this.callbackClickMapa)
                this.callbackClickMapa(this.obtenerCoordenadas(evento));

        });

        window.addEventListener(

            "mousemove",

            this.mouseMove.bind(this)

        );

        window.addEventListener(

            "mouseup",

            this.mouseUp.bind(this)

        );

    }

    /*************************************************************/

    mouseWheel(e){

        e.preventDefault();

        const punto=this.svg.createSVGPoint();

        punto.x=e.clientX;
        punto.y=e.clientY;

        const svgPunto=punto.matrixTransform(

            this.svg.getScreenCTM().inverse()

        );

        if(e.deltaY<0)

            this.zoom(.90,svgPunto.x,svgPunto.y);

        else

            this.zoom(1.10,svgPunto.x,svgPunto.y);

    }

    /*************************************************************/

    mouseDown(e){

        this.arrastrando=true;

        this.mouse.x=e.clientX;

        this.mouse.y=e.clientY;

    }

    /*************************************************************/

    mouseMove(e){

        if(!this.arrastrando)
            return;

        const dx=e.clientX-this.mouse.x;
        const dy=e.clientY-this.mouse.y;

        const escala=

            this.viewBox.width/

            this.contenedor.clientWidth;

        this.viewBox.x-=dx*escala;
        this.viewBox.y-=dy*escala;

        this.actualizarViewBox();

        this.mouse.x=e.clientX;
        this.mouse.y=e.clientY;

    }

    /*************************************************************/

    mouseUp(){

        this.arrastrando=false;

    }

}