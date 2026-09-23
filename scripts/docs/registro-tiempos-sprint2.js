// Genera Documentos/AEUVG - Registro de Tiempos Sprint 2.docx
// Uso: node scripts/docs/registro-tiempos-sprint2.js
//
// Los deltas, los totales y el resumen por historia se calculan aquí a partir
// de las sesiones, para que las sumas del documento no dependan de una cuenta
// hecha a mano. El script aborta si una sesión es inconsistente o si alguien
// deja pasar más de dos días entre sesiones.
const { Packer } = require("docx");
const fs = require("fs");
const path = require("path");
const { p, h1, h2, makeTable, spacer, cover, buildDocument } = require("./template");

const MAXIMO_DIAS_SIN_TRABAJAR = 2;

// fecha, inicio, fin, interrupción (minutos), categoría, fase, comentario
const HARRY = {
  nombre: "Harry Daniel Méndez Mendoza",
  carne: "24089",
  sesiones: [
    [
      "2026-09-10",
      "08:20",
      "08:55",
      0,
      "Gestión del sprint",
      "Integración",
      "Cierre del Sprint 1: integración de la rama de inicio de sesión a develop y publicación en main.",
    ],
    [
      "2026-09-10",
      "19:30",
      "20:30",
      5,
      "Gestión del sprint",
      "Planificación",
      "Planificación del Sprint 2 con Juan Gabriel: selección de historias, estimación y orden de ejecución.",
    ],
    [
      "2026-09-10",
      "21:00",
      "22:20",
      10,
      "Documentación",
      "Documentación",
      "Redacción del documento de planificación del Sprint 2.",
    ],
    [
      "2026-09-11",
      "01:05",
      "02:10",
      5,
      "HU-07",
      "Codificación",
      "AEUVG-45 Ampliación del catálogo de categorías y sus colores. AEUVG-46 Migración de los índices de búsqueda.",
    ],
    [
      "2026-09-12",
      "16:10",
      "17:35",
      15,
      "HU-07",
      "Codificación y pruebas",
      "AEUVG-47 Consultas de listado, detalle y rango. AEUVG-49 Datos de prueba. AEUVG-50 Pruebas de las consultas.",
    ],
    [
      "2026-09-13",
      "20:30",
      "21:20",
      5,
      "HU-08",
      "Codificación",
      "AEUVG-54 Vista de detalle del evento. AEUVG-55 Endpoint público de consulta de eventos.",
    ],
    [
      "2026-09-15",
      "00:10",
      "01:25",
      10,
      "HU-08",
      "Pruebas",
      "AEUVG-56 Verificación del listado y el detalle en escritorio y móvil. Integración de HU-08 a develop.",
    ],
    [
      "2026-09-16",
      "19:40",
      "20:40",
      5,
      "HU-10",
      "Codificación",
      "AEUVG-64 Traducción de los filtros de fecha, categoría, tipo y organizador a la consulta.",
    ],
    [
      "2026-09-17",
      "23:10",
      "23:58",
      5,
      "HU-10",
      "Codificación y pruebas",
      "AEUVG-65 Buscador sin acentos con columna normalizada. AEUVG-68 Pruebas de los filtros y del buscador.",
    ],
    [
      "2026-09-18",
      "01:00",
      "02:15",
      10,
      "HU-09",
      "Codificación",
      "Integración de HU-10 a develop. AEUVG-57 Construcción de la grilla mensual y de la vista semanal.",
    ],
    [
      "2026-09-19",
      "15:30",
      "16:40",
      10,
      "HU-11",
      "Codificación",
      "AEUVG-69 Servicio de creación y edición de eventos con sus validaciones.",
    ],
    [
      "2026-09-20",
      "19:10",
      "20:20",
      10,
      "HU-11",
      "Codificación",
      "AEUVG-70 Publicación, cancelación y eliminación de eventos, con sus reglas de transición.",
    ],
    [
      "2026-09-21",
      "00:40",
      "01:55",
      5,
      "HU-09",
      "Pruebas",
      "AEUVG-62 Pruebas de la grilla y de la navegación entre periodos. Integración de HU-09 a develop.",
    ],
    [
      "2026-09-21",
      "21:50",
      "22:45",
      5,
      "HU-11",
      "Codificación",
      "AEUVG-71 Endpoints de administración de eventos protegidos por rol.",
    ],
    [
      "2026-09-22",
      "01:20",
      "02:20",
      5,
      "HU-11",
      "Pruebas",
      "AEUVG-74 Pruebas de las validaciones y de los permisos. Integración de HU-11 a develop.",
    ],
    [
      "2026-09-22",
      "18:10",
      "19:15",
      10,
      "HU-12",
      "Codificación",
      "AEUVG-75 Proveedor de almacenamiento de imágenes. AEUVG-76 Validación de formato y tamaño.",
    ],
    [
      "2026-09-22",
      "22:30",
      "23:30",
      5,
      "Revisión y cierre",
      "Revisión",
      "Revisión conjunta del código del sprint con Juan Gabriel. AEUVG-80 Verificación final y documentación técnica.",
    ],
    [
      "2026-09-23",
      "00:15",
      "01:10",
      0,
      "Documentación",
      "Documentación",
      "Redacción del documento de desarrollo del Sprint 2.",
    ],
    [
      "2026-09-23",
      "09:10",
      "10:25",
      10,
      "Documentación",
      "Documentación",
      "Registro de tiempos del sprint e integración de develop a main.",
    ],
  ],
};

const JUAN = {
  nombre: "Juan Gabriel Gualim Molina",
  carne: "24852",
  sesiones: [
    [
      "2026-09-10",
      "19:30",
      "20:30",
      5,
      "Gestión del sprint",
      "Planificación",
      "Planificación del Sprint 2 con Harry: selección de historias, estimación y orden de ejecución.",
    ],
    [
      "2026-09-11",
      "20:20",
      "21:20",
      5,
      "HU-07",
      "Codificación",
      "AEUVG-48 Estado visible del evento y formato de sus fechas en hora de Guatemala.",
    ],
    [
      "2026-09-12",
      "22:45",
      "23:30",
      5,
      "HU-08",
      "Diseño y codificación",
      "AEUVG-51 Tarjeta de evento reutilizable a partir del prototipo del Sprint 1.",
    ],
    [
      "2026-09-13",
      "16:10",
      "17:15",
      10,
      "HU-08",
      "Codificación",
      "AEUVG-52 Pantalla de listado de próximos eventos con su paginación por enlaces.",
    ],
    [
      "2026-09-14",
      "23:05",
      "23:50",
      5,
      "HU-08",
      "Codificación",
      "AEUVG-53 Estado vacío del listado de eventos.",
    ],
    [
      "2026-09-16",
      "21:35",
      "22:15",
      0,
      "HU-10",
      "Codificación",
      "AEUVG-66 Barra de filtros de la pantalla de eventos.",
    ],
    [
      "2026-09-17",
      "19:10",
      "20:25",
      10,
      "HU-10",
      "Codificación",
      "AEUVG-67 Resumen de los filtros aplicados, con la opción de quitarlos uno a uno.",
    ],
    [
      "2026-09-18",
      "21:05",
      "22:00",
      5,
      "HU-09",
      "Codificación",
      "AEUVG-58 Pantalla del calendario con el cambio entre vista mensual y semanal.",
    ],
    [
      "2026-09-19",
      "17:05",
      "17:55",
      5,
      "HU-09",
      "Codificación",
      "AEUVG-59 Navegación entre periodos conservando el estado en la dirección.",
    ],
    [
      "2026-09-20",
      "01:15",
      "01:55",
      0,
      "HU-09",
      "Codificación",
      "AEUVG-60 Eventos dentro de cada día del calendario, enlazados a su detalle.",
    ],
    [
      "2026-09-20",
      "21:35",
      "22:20",
      5,
      "HU-09",
      "Diseño y codificación",
      "AEUVG-61 Versión de agenda del calendario para teléfono.",
    ],
    [
      "2026-09-21",
      "19:45",
      "20:30",
      5,
      "HU-11",
      "Codificación",
      "AEUVG-72 Listado administrativo de eventos con sus filtros y acciones.",
    ],
    [
      "2026-09-22",
      "00:15",
      "01:15",
      5,
      "HU-11",
      "Codificación",
      "AEUVG-73 Formulario de creación y edición de eventos.",
    ],
    [
      "2026-09-22",
      "16:05",
      "16:50",
      5,
      "HU-12",
      "Codificación",
      "AEUVG-79 Enlace de eventos y calendario desde los accesos rápidos y el menú principal.",
    ],
    [
      "2026-09-22",
      "20:20",
      "21:05",
      5,
      "HU-12",
      "Codificación",
      "AEUVG-77 Carga de la imagen desde el formulario. AEUVG-78 Eventos destacados y próximos en la portada.",
    ],
    [
      "2026-09-22",
      "22:30",
      "23:30",
      5,
      "Revisión y cierre",
      "Revisión",
      "Revisión conjunta del código del sprint con Harry y verificación final del incremento.",
    ],
    [
      "2026-09-23",
      "08:05",
      "08:50",
      5,
      "Revisión y cierre",
      "Pruebas",
      "Verificación de las pantallas del módulo en escritorio, tableta y teléfono antes de la publicación.",
    ],
  ],
};

const ORDEN_CATEGORIAS = [
  "Gestión del sprint",
  "HU-07",
  "HU-08",
  "HU-09",
  "HU-10",
  "HU-11",
  "HU-12",
  "Revisión y cierre",
  "Documentación",
];

const NOMBRE_CATEGORIA = {
  "Gestión del sprint": "Gestión del sprint",
  "HU-07": "HU-07 - Catálogo y servicios de consulta",
  "HU-08": "HU-08 - Listado y detalle de eventos",
  "HU-09": "HU-09 - Calendario de eventos",
  "HU-10": "HU-10 - Filtros y buscador",
  "HU-11": "HU-11 - Administración de eventos",
  "HU-12": "HU-12 - Imágenes e integración en la portada",
  "Revisión y cierre": "Revisión y verificación final",
  Documentación: "Documentación del sprint",
};

const minutosDe = (hhmm) => {
  const [horas, minutos] = hhmm.split(":").map(Number);
  return horas * 60 + minutos;
};

const comoHoraMinuto = (minutos) =>
  `${Math.floor(minutos / 60)}:${String(minutos % 60).padStart(2, "0")}`;

const comoFecha = (iso) => {
  const [anio, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${anio}`;
};

function calcular(persona) {
  let anterior = null;

  const filas = persona.sesiones.map(
    ([fecha, inicio, fin, interrupcion, categoria, fase, comentario], indice) => {
      const delta = minutosDe(fin) - minutosDe(inicio) - interrupcion;

      if (delta <= 0) {
        throw new Error(
          `${persona.nombre}: la sesión ${indice + 1} del ${fecha} no deja tiempo neto.`
        );
      }

      if (anterior) {
        const dias =
          (Date.parse(`${fecha}T00:00:00Z`) - Date.parse(`${anterior}T00:00:00Z`)) / 86400000;
        if (dias < 0)
          throw new Error(`${persona.nombre}: las sesiones no están en orden cronológico.`);
        if (dias > MAXIMO_DIAS_SIN_TRABAJAR) {
          throw new Error(`${persona.nombre}: hay ${dias} días sin trabajar antes del ${fecha}.`);
        }
      }
      anterior = fecha;

      return { fecha, inicio, fin, interrupcion, delta, categoria, fase, comentario };
    }
  );

  const total = filas.reduce((suma, fila) => suma + fila.delta, 0);
  const porCategoria = new Map();
  for (const fila of filas) {
    porCategoria.set(fila.categoria, (porCategoria.get(fila.categoria) ?? 0) + fila.delta);
  }

  return { ...persona, filas, total, porCategoria };
}

/**
 * Reparte el residuo del redondeo para que las horas por categoría sumen
 * exactamente el total de la persona. Sin esto, redondear cada fila por
 * separado deja diferencias de una décima en la tabla de resumen.
 */
function horasPorCategoria(porCategoria, totalMinutos) {
  const categorias = ORDEN_CATEGORIAS.filter((clave) => porCategoria.has(clave));
  const horas = categorias.map((clave) => Math.round((porCategoria.get(clave) / 60) * 10) / 10);
  const objetivo = Math.round((totalMinutos / 60) * 10) / 10;

  let diferencia = Math.round((objetivo - horas.reduce((a, b) => a + b, 0)) * 10);
  let mayor = horas.indexOf(Math.max(...horas));

  while (diferencia !== 0) {
    horas[mayor] = Math.round((horas[mayor] + Math.sign(diferencia) * 0.1) * 10) / 10;
    diferencia -= Math.sign(diferencia);
    mayor = horas.indexOf(Math.max(...horas));
  }

  return categorias.map((clave, indice) => [clave, horas[indice]]);
}

const tablaRegistro = (persona) =>
  makeTable(
    [900, 680, 680, 1120, 900, 1280, 3800],
    ["Fecha", "Inicio", "Fin", "Interrupción", "Delta", "Fase", "Comentarios"],
    persona.filas.map((fila) => [
      comoFecha(fila.fecha),
      fila.inicio,
      fila.fin,
      comoHoraMinuto(fila.interrupcion),
      comoHoraMinuto(fila.delta),
      fila.fase,
      fila.comentario,
    ])
  );

const harry = calcular(HARRY);
const juan = calcular(JUAN);
const totalEquipo = harry.total + juan.total;
const enHoras = (minutos) => (Math.round((minutos / 60) * 10) / 10).toFixed(1);

const resumen = (persona) =>
  makeTable(
    [5560, 1900, 1900],
    ["Historia o actividad", "Tiempo", "Horas"],
    [
      ...horasPorCategoria(persona.porCategoria, persona.total).map(([clave, horas]) => [
        NOMBRE_CATEGORIA[clave],
        comoHoraMinuto(persona.porCategoria.get(clave)),
        horas.toFixed(1),
      ]),
      ["Total", comoHoraMinuto(persona.total), enHoras(persona.total)],
    ]
  );

const doc = buildDocument([
  ...cover({
    subtitle: "Registro de Tiempos del Sprint 2",
    date: "Guatemala, 23 de septiembre del 2026",
  }),

  h1("1. Alcance del registro"),
  p(
    "Este documento registra el tiempo dedicado por cada integrante del equipo al Sprint 2 - Eventos y calendario, entre el 10 y el 23 de septiembre de 2026. Cada sesión indica la fecha, la hora de inicio y de finalización, el tiempo de interrupción, el tiempo neto trabajado, la fase de la actividad y una descripción del trabajo realizado."
  ),
  p(
    "El delta de tiempo corresponde a la hora de finalización menos la hora de inicio menos el tiempo de interrupción. Las interrupciones son pausas cortas dentro de una misma sesión. Las sesiones de planificación y de revisión conjunta aparecen en ambos registros con el mismo horario, por tratarse de trabajo realizado en conjunto."
  ),
  p(
    `Los tiempos del sprint suman ${enHoras(totalEquipo)} horas de equipo: ${enHoras(harry.total)} horas de Harry Méndez y ${enHoras(juan.total)} horas de Juan Gabriel Gualim. La estimación de la planificación fue de 34 horas, por lo que el trabajo real se ubicó un 8% por debajo de lo estimado, una desviación considerablemente menor a la del Sprint 1.`
  ),

  h1(`2. ${HARRY.nombre}`),
  p(`Carné: ${HARRY.carne}`),
  spacer(),
  tablaRegistro(harry),
  spacer(),
  h2("2.1. Resumen por historia de usuario"),
  spacer(),
  resumen(harry),

  h1(`3. ${JUAN.nombre}`),
  p(`Carné: ${JUAN.carne}`),
  spacer(),
  tablaRegistro(juan),
  spacer(),
  h2("3.1. Resumen por historia de usuario"),
  spacer(),
  resumen(juan),

  h1("4. Resumen del equipo"),
  spacer(),
  makeTable(
    [4560, 1600, 1600, 1600],
    ["Integrante", "Sesiones", "Tiempo", "Horas"],
    [
      [HARRY.nombre, String(harry.filas.length), comoHoraMinuto(harry.total), enHoras(harry.total)],
      [JUAN.nombre, String(juan.filas.length), comoHoraMinuto(juan.total), enHoras(juan.total)],
      [
        "Total del equipo",
        String(harry.filas.length + juan.filas.length),
        comoHoraMinuto(totalEquipo),
        enHoras(totalEquipo),
      ],
    ]
  ),
  spacer(),
  p(
    "El reparto del trabajo siguió las responsabilidades acordadas: Harry Méndez asumió el modelo de datos, las consultas, los servicios de administración y las pruebas automatizadas; Juan Gabriel Gualim, las pantallas del módulo, el calendario y la integración con el sistema de diseño. Las sesiones en las que participaron ambos corresponden a la planificación del sprint y a la revisión final del código."
  ),
]);

const out = path.join(
  __dirname,
  "..",
  "..",
  "Documentos",
  "AEUVG - Registro de Tiempos Sprint 2.docx"
);
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("Documento generado:", out);
  console.log(
    `Harry ${enHoras(harry.total)} h en ${harry.filas.length} sesiones; ` +
      `Juan Gabriel ${enHoras(juan.total)} h en ${juan.filas.length} sesiones; ` +
      `equipo ${enHoras(totalEquipo)} h.`
  );
});
