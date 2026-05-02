let aulas = [];
let svg;
let originalViewBox = null;
let currentViewBox = null;
let isPanning = false;
let panStart = { x: 0, y: 0 };

// Detectar la ruta base para GitHub Pages
const basePath = window.location.pathname.includes('/MapaFRTDF/') 
  ? '/MapaFRTDF/' 
  : './';

function logDebug(message, data = null) {
  const debugDiv = document.getElementById('debug-info');
  if (!debugDiv) return;
  const timestamp = new Date().toLocaleTimeString();
  let logMessage = `[${timestamp}] ${message}`;
  if (data) {
    logMessage += `: ${JSON.stringify(data, null, 2)}`;
  }
  debugDiv.innerHTML += logMessage + '<br>';
  debugDiv.scrollTop = debugDiv.scrollHeight;
}

function cargarSVG(url) {
  const fullUrl = basePath + url;
  fetch(fullUrl)
    .then(r => r.text())
    .then(data => {
      document.getElementById("contenedor").innerHTML = data;

      svg = document.querySelector("svg");
      if (!svg) throw new Error("SVG no encontrado en el contenido cargado.");

      fixViewBox();
      detectarAulas();
      initSvgInteracciones();
      limpiarBusqueda();
    })
    .catch(err => {
      console.error("Error cargando SVG:", err);
    });
}

function fixViewBox() {
  if (!svg.getAttribute("viewBox")) {
    const w = parseFloat(svg.getAttribute("width")) || 1000;
    const h = parseFloat(svg.getAttribute("height")) || 1000;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  }

  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  const [x, y, w, h] = svg.getAttribute("viewBox").split(" ").map(Number);
  originalViewBox = { x, y, w, h };
  currentViewBox = { ...originalViewBox };
}

function setViewBox(viewBox) {
  currentViewBox = { ...viewBox };
  svg.setAttribute(
    "viewBox",
    `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`
  );
}

function clampViewBox(viewBox) {
  const minW = originalViewBox.w * 0.15;
  const maxW = originalViewBox.w * 5;
  const minH = originalViewBox.h * 0.15;
  const maxH = originalViewBox.h * 5;

  viewBox.w = Math.min(Math.max(viewBox.w, minW), maxW);
  viewBox.h = Math.min(Math.max(viewBox.h, minH), maxH);

  if (viewBox.x < originalViewBox.x) viewBox.x = originalViewBox.x;
  if (viewBox.y < originalViewBox.y) viewBox.y = originalViewBox.y;
  if (viewBox.x + viewBox.w > originalViewBox.x + originalViewBox.w) {
    viewBox.x = originalViewBox.x + originalViewBox.w - viewBox.w;
  }
  if (viewBox.y + viewBox.h > originalViewBox.y + originalViewBox.h) {
    viewBox.y = originalViewBox.y + originalViewBox.h - viewBox.h;
  }

  return viewBox;
}

function initSvgInteracciones() {
  svg.addEventListener("wheel", e => {
    e.preventDefault();
    const rect = svg.getBoundingClientRect();
    const pointer = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    };

    const zoomFactor = e.deltaY > 0 ? 1.15 : 0.85;
    zoomSvg(zoomFactor, pointer);
  }, { passive: false });

  svg.addEventListener("pointerdown", e => {
    isPanning = true;
    panStart = { x: e.clientX, y: e.clientY };
    svg.classList.add("dragging");
    svg.setPointerCapture(e.pointerId);
  });

  svg.addEventListener("pointerup", e => {
    isPanning = false;
    svg.classList.remove("dragging");
    svg.releasePointerCapture(e.pointerId);
  });

  svg.addEventListener("pointercancel", () => {
    isPanning = false;
    svg.classList.remove("dragging");
  });

  svg.addEventListener("pointermove", e => {
    if (!isPanning) return;
    e.preventDefault();

    const rect = svg.getBoundingClientRect();
    const dx = (panStart.x - e.clientX) * (currentViewBox.w / rect.width);
    const dy = (panStart.y - e.clientY) * (currentViewBox.h / rect.height);

    panStart = { x: e.clientX, y: e.clientY };
    const next = {
      x: currentViewBox.x + dx,
      y: currentViewBox.y + dy,
      w: currentViewBox.w,
      h: currentViewBox.h
    };

    setViewBox(clampViewBox(next));
  });

  document.getElementById("zoom-in").onclick = () => zoomSvg(0.85);
  document.getElementById("zoom-out").onclick = () => zoomSvg(1.15);
  document.getElementById("zoom-reset").onclick = () => {
    document.getElementById("buscador").value = "";
    limpiarBusqueda();
    setViewBox(originalViewBox);
  };
  document.getElementById("debug-piso").onclick = () => {
    document.getElementById("piso").value = 'alta';
    document.getElementById("piso").dispatchEvent(new Event('change'));
  };
}

function zoomSvg(factor, pointer = { x: 0.5, y: 0.5 }) {
  const next = {
    x: currentViewBox.x + (currentViewBox.w - currentViewBox.w * factor) * pointer.x,
    y: currentViewBox.y + (currentViewBox.h - currentViewBox.h * factor) * pointer.y,
    w: currentViewBox.w * factor,
    h: currentViewBox.h * factor
  };

  setViewBox(clampViewBox(next));
}

function detectarAulas() {
  aulas = [];
  const textos = Array.from(svg.querySelectorAll("text"));
  logDebug(`Encontrados ${textos.length} elementos de texto`);

  textos.forEach(t => {
    const nombre = t.textContent.trim();
    const target = t.closest("g") || t;
    const item = {
      nombre: nombre.toLowerCase(),
      el: t,
      target
    };

    if (nombre) {
      aulas.push(item);
      t.addEventListener("click", () => {
        logDebug(`Clic en aula: ${nombre}`);
        seleccionarAula(item);
      });
    }
  });
  logDebug(`Detectadas ${aulas.length} aulas`, aulas.map(a => a.nombre));
}

function getTargetBBox(el) {
  const element = el.closest("g") && el.closest("g") !== svg ? el.closest("g") : el;
  logDebug(`Calculando bbox para elemento`, element);

  try {
    const rect = element.getBoundingClientRect();
    const screenCTM = svg.getScreenCTM();
    if (!screenCTM) {
      throw new Error("No se pudo obtener screenCTM del SVG.");
    }

    const inverse = screenCTM.inverse();
    const point = svg.createSVGPoint();
    point.x = rect.left;
    point.y = rect.top;
    const topLeft = point.matrixTransform(inverse);

    point.x = rect.right;
    point.y = rect.bottom;
    const bottomRight = point.matrixTransform(inverse);

    const transformed = {
      x: Math.min(topLeft.x, bottomRight.x),
      y: Math.min(topLeft.y, bottomRight.y),
      width: Math.abs(bottomRight.x - topLeft.x),
      height: Math.abs(bottomRight.y - topLeft.y)
    };

    logDebug(`BBox transformado del rect`, transformed);
    return transformed;
  } catch (err) {
    console.warn("No se pudo obtener bbox desde getBoundingClientRect, usando getBBox()", err);
  }

  try {
    const bbox = element.getBBox();
    logDebug(`BBox fallback getBBox`, bbox);
    return bbox;
  } catch (err) {
    console.error("Error obteniendo bbox:", err);
    return { x: 0, y: 0, width: 100, height: 50 };
  }
}

function seleccionarAula(aula) {
  logDebug(`Seleccionando aula: ${aula.nombre}`);
  aulas.forEach(a => a.target.classList.remove("aula-activa"));
  aula.target.classList.add("aula-activa");

  const box = getTargetBBox(aula.target);
  logDebug(`Bounding box`, box);
  const padding = Math.max(40, Math.min(box.width, box.height) * 0.5);
  const next = {
    x: box.x - padding,
    y: box.y - padding,
    w: Math.max(box.width + padding * 2, originalViewBox.w * 0.15),
    h: Math.max(box.height + padding * 2, originalViewBox.h * 0.15)
  };
  logDebug(`Nuevo viewBox`, next);
  setViewBox(clampViewBox(next));
}

function limpiarBusqueda() {
  svg.querySelectorAll(".search-match").forEach(el => el.classList.remove("search-match"));
}

function buscarTexto(valor) {
  const texto = valor.trim().toLowerCase();
  console.log(`Buscando: "${texto}"`);
  limpiarBusqueda();

  if (!texto) return;

  // Buscar por el número del aula o por el texto completo
  const normalizedSearch = texto.replace(/\s+/g, " ");
  const coincidencias = aulas.filter(a => {
    const aulaMatch = a.nombre.includes(normalizedSearch) ||
                     a.nombre.includes(`aula ${normalizedSearch}`) ||
                     a.nombre.includes(`${normalizedSearch}`);
    return aulaMatch;
  });

  console.log(`Coincidencias encontradas: ${coincidencias.length}`, coincidencias.map(a => a.nombre));

  coincidencias.forEach(a => {
    a.target.classList.add("search-match");
    console.log(`Agregando clase search-match a:`, a.target);
  });

  if (coincidencias.length) {
    console.log(`Seleccionando primera coincidencia: ${coincidencias[0].nombre}`);
    seleccionarAula(coincidencias[0]);
  }
}

document.getElementById("buscador").addEventListener("input", e => {
  buscarTexto(e.target.value);
});

document.getElementById("piso").addEventListener("change", e => {
  const piso = e.target.value === "baja" ? "planta-baja.svg" : "planta-alta.svg";
  document.getElementById("buscador").value = "";
  cargarSVG(piso);
});

cargarSVG("planta-baja.svg");