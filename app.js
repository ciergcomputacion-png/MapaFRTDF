let aulas = [];
let svgElement = null;
let shapeActiva = null;

async function cargarSVG(path) {
  const res = await fetch(path);
  const txt = await res.text();

  const cont = document.getElementById("contenedor");
  cont.innerHTML = txt;

  svgElement = cont.querySelector("svg");

  // FIX CRÍTICO
if (!svgElement.getAttribute("viewBox")) {
  const width = svgElement.getAttribute("width") || 1000;
  const height = svgElement.getAttribute("height") || 1000;

  svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
}
  prepararInteraccion();
}

function prepararInteraccion() {
  aulas = [];

  const textos = svgElement.querySelectorAll("text");

  textos.forEach(t => {
    const nombre = t.textContent.trim();

    // SOLO aulas con formato AULA #
    if (/^AULA\s*\d+/i.test(nombre)) {

      const bbox = t.getBBox();

      const aula = {
        nombre: nombre.toLowerCase(),
        elemento: t,
        x: bbox.x,
        y: bbox.y,
        shape: encontrarShapeCercano(bbox)
      };

      aulas.push(aula);

      t.style.cursor = "pointer";

      t.addEventListener("click", () => resaltarAula(aula));
    }
  });
}

function encontrarShapeCercano(bbox) {
  const paths = svgElement.querySelectorAll("path");

  let mejor = null;
  let minDist = Infinity;

  paths.forEach(p => {
    const b = p.getBBox();

    const dx = (b.x + b.width/2) - bbox.x;
    const dy = (b.y + b.height/2) - bbox.y;

    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < minDist) {
      minDist = dist;
      mejor = p;
    }
  });

  return mejor;
}

function resaltarAula(aula) {

  // reset textos
  aulas.forEach(a => {
    a.elemento.classList.remove("aula-activa");
  });

  // reset shape
  if (shapeActiva) {
    shapeActiva.classList.remove("shape-activa");
  }

  aula.elemento.classList.add("aula-activa");

  if (aula.shape) {
    aula.shape.classList.add("shape-activa");
    shapeActiva = aula.shape;
  }

  zoomAula(aula);
}

function zoomAula(aula) {
  const size = 350;

  svgElement.setAttribute(
    "viewBox",
    `${aula.x - size/2} ${aula.y - size/2} ${size} ${size}`
  );
}

// BUSCADOR
document.getElementById("buscador").addEventListener("input", e => {
  const valor = e.target.value.toLowerCase();

  const match = aulas.find(a => a.nombre.includes(valor));

  if (match) resaltarAula(match);
});

// CAMBIO DE PISO
document.getElementById("piso").addEventListener("change", e => {
  cargarSVG(
    e.target.value === "baja"
      ? "Planta BAJA.svg"
      : "Planta ALTA.svg"
  );
});

// INIT
cargarSVG("Planta BAJA.svg");
