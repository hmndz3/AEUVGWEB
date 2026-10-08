// Genera las imágenes del contenido de demostración (prisma/seed-demo.ts).
//
// Son ilustraciones vectoriales hechas con figuras simples: no dependen de
// fotografías con derechos de autor, pesan unos pocos kilobytes y se sirven
// como archivos estáticos desde public/demo, así que funcionan igual en local
// y en Railway sin pasar por el volumen de imágenes subidas.
//
// Uso: node scripts/demo/generar-imagenes.js
//
// Los SVG generados se versionan. Este script solo hace falta para cambiarlos.

const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..", "..", "public", "demo");
const ANCHO = 1200;
const ALTO = 800;
const FUENTE = "'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif";

/**
 * Lienzo común de los eventos: degradado diagonal entre dos colores, un brillo
 * suave, una trama de puntos y círculos decorativos. La ilustración va en la
 * franja central superior, que es la que queda visible en las tarjetas
 * verticales del carrusel y no la cubre el texto.
 */
function lienzoEvento(id, [colorA, colorB], ilustracion) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ANCHO} ${ALTO}" width="${ANCHO}" height="${ALTO}">
  <defs>
    <linearGradient id="${id}-fondo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${colorA}"/>
      <stop offset="1" stop-color="${colorB}"/>
    </linearGradient>
    <radialGradient id="${id}-brillo" cx="0.5" cy="0.35" r="0.55">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <pattern id="${id}-puntos" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="2" fill="#ffffff" fill-opacity="0.14"/>
    </pattern>
  </defs>
  <rect width="${ANCHO}" height="${ALTO}" fill="url(#${id}-fondo)"/>
  <rect width="${ANCHO}" height="${ALTO}" fill="url(#${id}-puntos)"/>
  <circle cx="1080" cy="120" r="220" fill="#ffffff" fill-opacity="0.08"/>
  <circle cx="110" cy="700" r="260" fill="#000000" fill-opacity="0.10"/>
  <rect width="${ANCHO}" height="${ALTO}" fill="url(#${id}-brillo)"/>
  ${ilustracion}
</svg>
`;
}

/** Nota musical: cabeza ovalada, plica y banderín. */
function nota(x, y, escala, color) {
  return `<g transform="translate(${x} ${y}) scale(${escala})" fill="${color}">
    <ellipse cx="0" cy="60" rx="26" ry="19" transform="rotate(-20 0 60)"/>
    <rect x="20" y="-60" width="9" height="120" rx="4"/>
    <path d="M24 -60 q50 18 40 70 q-8 -34 -40 -40 z"/>
  </g>`;
}

/** Árbol de tres pisos con tronco. */
function arbol(x, y, escala, verde) {
  return `<g transform="translate(${x} ${y}) scale(${escala})">
    <rect x="-14" y="120" width="28" height="70" rx="6" fill="#6b3f1d"/>
    <path d="M0 -40 L80 70 L-80 70 Z" fill="${verde}"/>
    <path d="M0 10 L100 130 L-100 130 Z" fill="${verde}"/>
    <path d="M0 -90 L60 0 L-60 0 Z" fill="${verde}"/>
  </g>`;
}

/** Estrella de cinco puntas centrada en (x, y). */
function estrella(x, y, radio, color, opacidad = 1) {
  const puntos = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? radio : radio * 0.45;
    const angulo = (Math.PI / 5) * i - Math.PI / 2;
    return `${(x + r * Math.cos(angulo)).toFixed(1)},${(y + r * Math.sin(angulo)).toFixed(1)}`;
  }).join(" ");
  return `<polygon points="${puntos}" fill="${color}" fill-opacity="${opacidad}"/>`;
}

/** Engranaje: círculo con dientes rectangulares y un hueco central. */
function engranaje(x, y, radio, color, hueco) {
  const dientes = Array.from({ length: 10 }, (_, i) => {
    const angulo = i * 36;
    return `<rect x="${x - radio * 0.16}" y="${y - radio * 1.22}" width="${radio * 0.32}" height="${radio * 0.4}" rx="${radio * 0.06}" fill="${color}" transform="rotate(${angulo} ${x} ${y})"/>`;
  }).join("");
  return `${dientes}<circle cx="${x}" cy="${y}" r="${radio}" fill="${color}"/><circle cx="${x}" cy="${y}" r="${radio * 0.42}" fill="${hueco}"/>`;
}

const EVENTOS = {
  hackaton: lienzoEvento(
    "hackaton",
    ["#C4187A", "#5A35E8"],
    `<g>
      <rect x="380" y="150" width="440" height="280" rx="22" fill="#1c162b"/>
      <rect x="400" y="170" width="400" height="240" rx="12" fill="#2a2140"/>
      <rect x="430" y="205" width="150" height="16" rx="8" fill="#00C9A7"/>
      <rect x="600" y="205" width="90" height="16" rx="8" fill="#FFB627"/>
      <rect x="460" y="245" width="210" height="16" rx="8" fill="#B98AFF"/>
      <rect x="460" y="285" width="120" height="16" rx="8" fill="#FF5E5B"/>
      <rect x="600" y="285" width="140" height="16" rx="8" fill="#3EC1FF"/>
      <rect x="430" y="325" width="180" height="16" rx="8" fill="#7BC950"/>
      <rect x="430" y="365" width="60" height="16" rx="8" fill="#ffffff" fill-opacity="0.6"/>
      <path d="M330 430 H870 L900 470 H300 Z" fill="#e9e3f5"/>
      <text x="600" y="120" text-anchor="middle" font-family="monospace" font-size="96" font-weight="700" fill="#ffffff">&lt;/&gt;</text>
      <circle cx="300" cy="230" r="18" fill="#FFB627"/>
      <circle cx="905" cy="300" r="12" fill="#00C9A7"/>
    </g>`
  ),
  emprendimiento: lienzoEvento(
    "emprendimiento",
    ["#0B7FB5", "#00C9A7"],
    `<path d="M220 140 Q600 230 980 140" fill="none" stroke="#ffffff" stroke-width="5" stroke-opacity="0.8"/>
    ${[
      [280, 156, "#FFB627"],
      [380, 178, "#FF5E5B"],
      [480, 192, "#ffffff"],
      [580, 198, "#FF4FA3"],
      [680, 194, "#FFB627"],
      [780, 182, "#7BC950"],
      [880, 162, "#ffffff"],
    ]
      .map(
        ([x, y, c]) => `<path d="M${x - 28} ${y} L${x + 28} ${y} L${x} ${y + 52} Z" fill="${c}"/>`
      )
      .join("")}
    <g>
      <path d="M330 300 L460 250 L590 300 Z" fill="#FF5E5B"/>
      <rect x="345" y="300" width="230" height="170" fill="#ffffff"/>
      <rect x="345" y="300" width="230" height="34" fill="#FF5E5B"/>
      <rect x="380" y="370" width="70" height="100" fill="#0B7FB5" fill-opacity="0.25"/>
      <path d="M610 300 L740 250 L870 300 Z" fill="#FFB627"/>
      <rect x="625" y="300" width="230" height="170" fill="#ffffff"/>
      <rect x="625" y="300" width="230" height="34" fill="#FFB627"/>
      <circle cx="700" cy="400" r="26" fill="#00C9A7"/>
      <circle cx="780" cy="410" r="20" fill="#FF4FA3"/>
    </g>`
  ),
  cine: lienzoEvento(
    "cine",
    ["#00806B", "#1c162b"],
    `<rect x="340" y="120" width="520" height="290" rx="14" fill="#ffffff" fill-opacity="0.92"/>
    <rect x="365" y="145" width="470" height="240" rx="8" fill="#0E7490"/>
    <path d="M570 220 L660 265 L570 310 Z" fill="#ffffff"/>
    <g fill="#ffffff" fill-opacity="0.9">
      <circle cx="270" cy="250" r="80"/>
    </g>
    <g fill="#1c162b">
      <circle cx="270" cy="200" r="20"/><circle cx="220" cy="250" r="20"/>
      <circle cx="320" cy="250" r="20"/><circle cx="270" cy="300" r="20"/>
      <circle cx="270" cy="250" r="10"/>
    </g>
    <g>
      <path d="M860 330 L960 330 L940 470 L880 470 Z" fill="#ffffff"/>
      <path d="M880 330 L895 470 L905 470 L895 330 Z M920 330 L925 470 L935 470 L940 330 Z" fill="#FF5E5B"/>
      <circle cx="880" cy="320" r="22" fill="#FFF3D6"/><circle cx="912" cy="306" r="24" fill="#FFF3D6"/>
      <circle cx="945" cy="320" r="22" fill="#FFF3D6"/>
    </g>`
  ),
  futbol: lienzoEvento(
    "futbol",
    ["#0E7490", "#4A8C22"],
    `<g stroke="#ffffff" stroke-opacity="0.55" stroke-width="6" fill="none">
      <path d="M260 520 L420 160 L780 160 L940 520 Z"/>
      <path d="M340 340 L860 340"/>
      <ellipse cx="600" cy="340" rx="120" ry="48"/>
    </g>
    <g transform="translate(600 300)">
      <circle r="120" fill="#ffffff"/>
      <polygon points="0,-42 40,-13 25,34 -25,34 -40,-13" fill="#1c162b"/>
      <polygon points="0,-120 30,-100 18,-72 -18,-72 -30,-100" fill="#1c162b"/>
      <polygon points="114,-37 106,0 76,-8 70,-46 96,-64" fill="#1c162b"/>
      <polygon points="-114,-37 -106,0 -76,-8 -70,-46 -96,-64" fill="#1c162b"/>
      <polygon points="70,97 40,112 30,84 52,62 84,72" fill="#1c162b"/>
      <polygon points="-70,97 -40,112 -30,84 -52,62 -84,72" fill="#1c162b"/>
      <circle r="120" fill="none" stroke="#1c162b" stroke-width="4"/>
    </g>`
  ),
  festival: lienzoEvento(
    "festival",
    ["#5A35E8", "#FF4FA3"],
    `<path d="M300 0 L420 0 L520 520 L200 520 Z" fill="#ffffff" fill-opacity="0.12"/>
    <path d="M780 0 L900 0 L1000 520 L680 520 Z" fill="#ffffff" fill-opacity="0.12"/>
    ${[40, 90, 150, 110, 60, 130, 80, 170, 100, 50]
      .map(
        (h, i) =>
          `<rect x="${420 + i * 38}" y="${470 - h}" width="24" height="${h}" rx="8" fill="#ffffff" fill-opacity="${0.55 + (i % 3) * 0.15}"/>`
      )
      .join("")}
    ${nota(470, 170, 1.4, "#FFB627")}
    ${nota(640, 120, 1.7, "#ffffff")}
    ${nota(790, 200, 1.2, "#00C9A7")}
    ${estrella(360, 300, 26, "#ffffff", 0.8)}
    ${estrella(880, 330, 20, "#FFB627")}`
  ),
  diseno: lienzoEvento(
    "diseno",
    ["#C2410C", "#FFB627"],
    `<g stroke="#ffffff" stroke-opacity="0.18" stroke-width="2">
      ${Array.from({ length: 9 }, (_, i) => `<path d="M${300 + i * 75} 90 V520"/>`).join("")}
      ${Array.from({ length: 6 }, (_, i) => `<path d="M300 ${90 + i * 86} H900"/>`).join("")}
    </g>
    <path d="M420 200 C420 120 560 90 650 120 C760 150 800 230 760 300 C730 350 660 320 640 360 C620 410 680 440 620 470 C520 510 420 420 420 330 Z" fill="#ffffff"/>
    <circle cx="510" cy="200" r="30" fill="#FF5E5B"/>
    <circle cx="600" cy="170" r="30" fill="#00C9A7"/>
    <circle cx="690" cy="220" r="30" fill="#5A35E8"/>
    <circle cx="500" cy="300" r="30" fill="#FFB627"/>
    <circle cx="600" cy="420" r="26" fill="#C2410C" fill-opacity="0.2"/>
    <g transform="rotate(35 820 300)">
      <rect x="800" y="140" width="40" height="260" rx="6" fill="#1c162b"/>
      <rect x="800" y="140" width="40" height="40" rx="6" fill="#FF4FA3"/>
      <path d="M800 400 L840 400 L820 450 Z" fill="#FFF3D6"/>
    </g>`
  ),
  reforestacion: lienzoEvento(
    "reforestacion",
    ["#4A8C22", "#0E7490"],
    `<circle cx="820" cy="170" r="70" fill="#FFB627"/>
    <circle cx="820" cy="170" r="100" fill="#FFB627" fill-opacity="0.25"/>
    <path d="M0 520 Q300 380 600 470 T1200 430 V800 H0 Z" fill="#2f6b14"/>
    ${arbol(430, 250, 1.1, "#7BC950")}
    ${arbol(600, 200, 1.35, "#9be06d")}
    ${arbol(760, 280, 0.95, "#7BC950")}
    <g fill="#ffffff" fill-opacity="0.85">
      <ellipse cx="360" cy="150" rx="70" ry="26"/><ellipse cx="410" cy="135" rx="50" ry="30"/>
    </g>`
  ),
  bienestar: lienzoEvento(
    "bienestar",
    ["#7B4FD1", "#00C9A7"],
    `<path d="M370 150 h300 a30 30 0 0 1 30 30 v130 a30 30 0 0 1 -30 30 h-200 l-60 50 v-50 h-40 a30 30 0 0 1 -30 -30 v-130 a30 30 0 0 1 30 -30 z" fill="#ffffff"/>
    <path d="M560 260 h250 a30 30 0 0 1 30 30 v100 a30 30 0 0 1 -30 30 h-30 v46 l-56 -46 h-164 a30 30 0 0 1 -30 -30 v-100 a30 30 0 0 1 30 -30 z" fill="#1c162b" fill-opacity="0.85"/>
    <path d="M520 205 c-25 -30 -75 -10 -60 30 c10 25 60 55 60 55 c0 0 50 -30 60 -55 c15 -40 -35 -60 -60 -30 z" fill="#FF4FA3"/>
    <rect x="610" y="310" width="170" height="14" rx="7" fill="#00C9A7"/>
    <rect x="610" y="345" width="110" height="14" rx="7" fill="#B98AFF"/>
    <rect x="610" y="380" width="140" height="14" rx="7" fill="#ffffff" fill-opacity="0.6"/>`
  ),
  postres: lienzoEvento(
    "postres",
    ["#FF5E5B", "#FFB627"],
    `<g transform="translate(470 280)">
      <circle r="120" fill="#C68B59"/>
      <circle r="105" fill="#FF4FA3"/>
      <circle r="42" fill="#FF8A73"/>
      ${[
        [-60, -50, 20, "#ffffff"],
        [10, -80, -30, "#00C9A7"],
        [70, -30, 60, "#FFB627"],
        [-80, 20, -10, "#5A35E8"],
        [60, 60, 30, "#ffffff"],
        [-20, 80, 80, "#00C9A7"],
      ]
        .map(
          ([x, y, r, c]) =>
            `<rect x="${x}" y="${y}" width="26" height="9" rx="4" fill="${c}" transform="rotate(${r} ${x} ${y})"/>`
        )
        .join("")}
    </g>
    <g transform="translate(760 250)">
      <path d="M-90 60 L90 60 L65 210 L-65 210 Z" fill="#5A35E8"/>
      <path d="M-55 60 L-45 210 M-15 60 L-12 210 M25 60 L20 210 M60 60 L50 210" stroke="#ffffff" stroke-opacity="0.35" stroke-width="8"/>
      <circle cx="-50" cy="40" r="50" fill="#FFF3D6"/><circle cx="50" cy="40" r="50" fill="#FFF3D6"/>
      <circle cx="0" cy="0" r="62" fill="#FFF3D6"/>
      <circle cx="0" cy="-70" r="20" fill="#D93F3C"/>
    </g>`
  ),
  espiritu: lienzoEvento(
    "espiritu",
    ["#D93F3C", "#FFB627"],
    `<path d="M250 130 Q600 220 950 130" fill="none" stroke="#1c162b" stroke-opacity="0.35" stroke-width="4"/>
    ${[
      [310, 150, "#5A35E8"],
      [430, 175, "#ffffff"],
      [550, 186, "#00C9A7"],
      [670, 185, "#FF4FA3"],
      [790, 172, "#ffffff"],
      [900, 150, "#5A35E8"],
    ]
      .map(
        ([x, y, c]) => `<path d="M${x - 34} ${y} L${x + 34} ${y} L${x} ${y + 70} Z" fill="${c}"/>`
      )
      .join("")}
    <g transform="rotate(-14 600 360)">
      <path d="M470 330 L700 250 L700 470 L470 390 Z" fill="#ffffff"/>
      <rect x="430" y="325" width="50" height="70" rx="10" fill="#1c162b"/>
      <rect x="700" y="240" width="26" height="240" rx="12" fill="#1c162b"/>
      <rect x="480" y="390" width="40" height="80" rx="10" fill="#1c162b"/>
    </g>
    ${estrella(830, 360, 34, "#ffffff")}
    ${estrella(390, 270, 24, "#ffffff", 0.85)}
    ${estrella(880, 460, 18, "#1c162b", 0.5)}`
  ),
  matematica: lienzoEvento(
    "matematica",
    ["#A66A00", "#5A35E8"],
    `<text x="600" y="380" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="300" font-weight="700" fill="#ffffff">π</text>
    <text x="400" y="230" text-anchor="middle" font-family="Georgia, serif" font-size="120" font-weight="700" fill="#FFB627">∑</text>
    <text x="820" y="250" text-anchor="middle" font-family="Georgia, serif" font-size="110" font-weight="700" fill="#00C9A7">√</text>
    <text x="420" y="450" text-anchor="middle" font-family="Georgia, serif" font-size="90" font-weight="700" fill="#ffffff" fill-opacity="0.6">∞</text>
    <path d="M780 470 L860 330 L940 470 Z" fill="none" stroke="#ffffff" stroke-width="8"/>
    <circle cx="330" cy="330" r="34" fill="none" stroke="#FF5E5B" stroke-width="8"/>`
  ),
  ciencia: lienzoEvento(
    "ciencia",
    ["#0E7490", "#7B4FD1"],
    `<g transform="translate(520 290)" fill="none" stroke="#ffffff" stroke-width="10">
      <ellipse rx="170" ry="62"/>
      <ellipse rx="170" ry="62" transform="rotate(60)"/>
      <ellipse rx="170" ry="62" transform="rotate(-60)"/>
    </g>
    <circle cx="520" cy="290" r="34" fill="#FFB627"/>
    <circle cx="690" cy="290" r="14" fill="#00C9A7"/>
    <circle cx="435" cy="143" r="14" fill="#FF4FA3"/>
    <g transform="translate(800 230)">
      <path d="M-30 0 H30 V90 L95 220 Q100 240 80 240 H-80 Q-100 240 -95 220 L-30 90 Z" fill="#ffffff"/>
      <path d="M-58 160 H58 L84 220 Q86 228 78 228 H-78 Q-86 228 -84 220 Z" fill="#00C9A7"/>
      <circle cx="-15" cy="195" r="10" fill="#ffffff" fill-opacity="0.7"/>
      <circle cx="20" cy="180" r="7" fill="#ffffff" fill-opacity="0.7"/>
      <rect x="-40" y="-14" width="80" height="18" rx="6" fill="#1c162b"/>
    </g>`
  ),
};

/** Logotipo circular: anillo, emblema y siglas. */
function logo(id, color, acento, emblema, siglas) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="${id}-fondo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${color}"/>
      <stop offset="1" stop-color="${acento}"/>
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="248" fill="url(#${id}-fondo)"/>
  <circle cx="256" cy="256" r="222" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="6"/>
  ${emblema}
  <text x="256" y="400" text-anchor="middle" font-family="${FUENTE}" font-size="${siglas.length > 4 ? 70 : 84}" font-weight="800" letter-spacing="2" fill="#ffffff">${siglas}</text>
</svg>
`;
}

const ASOCIACIONES = {
  adem: logo(
    "adem",
    "#C2410C",
    "#FF4FA3",
    `<circle cx="220" cy="180" r="62" fill="#FFB627" fill-opacity="0.9"/>
    <circle cx="292" cy="180" r="62" fill="#00C9A7" fill-opacity="0.8"/>
    <circle cx="256" cy="238" r="62" fill="#ffffff" fill-opacity="0.75"/>`,
    "ADEM"
  ),
  aebio: logo(
    "aebio",
    "#4A8C22",
    "#00806B",
    `<path d="M256 110 C350 150 360 260 256 320 C152 260 162 150 256 110 Z" fill="#ffffff"/>
    <path d="M256 140 V310" stroke="#4A8C22" stroke-width="10" stroke-linecap="round"/>
    <path d="M256 200 L300 170 M256 245 L305 215 M256 225 L210 195 M256 270 L205 240" stroke="#4A8C22" stroke-width="8" stroke-linecap="round"/>`,
    "AEBIO"
  ),
  aeind: logo(
    "aeind",
    "#0B7FB5",
    "#0E7490",
    engranaje(256, 215, 82, "#ffffff", "#0B7FB5"),
    "AEIND"
  ),
  aepsi: logo(
    "aepsi",
    "#7B4FD1",
    "#C4187A",
    `<text x="256" y="290" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="190" font-weight="700" fill="#ffffff">Ψ</text>`,
    "AEPSI"
  ),
  aemat: logo(
    "aemat",
    "#A66A00",
    "#5A35E8",
    `<text x="256" y="285" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="180" font-weight="700" fill="#ffffff">∑</text>`,
    "AEMAT"
  ),
};

function escribir(carpeta, archivos) {
  const destino = path.join(RAIZ, carpeta);
  fs.mkdirSync(destino, { recursive: true });

  for (const [nombre, contenido] of Object.entries(archivos)) {
    fs.writeFileSync(path.join(destino, `${nombre}.svg`), contenido);
    console.log(`public/demo/${carpeta}/${nombre}.svg`);
  }
}

escribir("eventos", EVENTOS);
escribir("asociaciones", ASOCIACIONES);
