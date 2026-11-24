// Registro de tiempos del Sprint 6.
//
// Se mantiene como módulo y no como documento aparte: los bloques que exporta
// se insertan al final del documento de desarrollo del sprint. Los deltas, los
// totales y el resumen por historia se calculan aquí a partir de las sesiones,
// para que las sumas no dependan de una cuenta hecha a mano.
const { p, h1, h2, makeTable, spacer } = require("./template");

// Este sprint duró tres semanas y el trabajo no se repartió parejo: la semana
// de en medio fue casi toda de Harry, con el panel de cuentas y las
// notificaciones, que son trabajo sin pantalla. El margen admite ese tramo sin
// sesiones de Juan Gabriel, que es real y no un error de captura.
const MAXIMO_DIAS_SIN_TRABAJAR = 5;

// fecha, inicio, fin, interrupción (minutos), categoría, fase, comentario
const HARRY = {
  nombre: "Harry Daniel Méndez Mendoza",
  carne: "24089",
  sesiones: [
    [
      "2026-11-07",
      "09:30",
      "10:45",
      5,
      "HU-31",
      "Diseño y codificación",
      "AEUVG-242 Formatos, horas de reloj y esquemas de validación del módulo de tutorías.",
    ],
    [
      "2026-11-07",
      "14:30",
      "16:05",
      10,
      "HU-31",
      "Codificación",
      "AEUVG-243 Consultas de cursos, postulaciones y tutores. Columna de la fotografía de perfil y su migración.",
    ],
    [
      "2026-11-08",
      "10:00",
      "11:30",
      10,
      "HU-31",
      "Codificación",
      "AEUVG-244 Servicio de postulaciones con su revisión, endpoints y subida de imágenes del estudiante.",
    ],
    [
      "2026-11-09",
      "17:30",
      "18:50",
      10,
      "HU-31",
      "Pruebas",
      "AEUVG-247 Pruebas de la postulación, de su revisión y de los permisos. Integración de HU-31 a develop.",
    ],
    [
      "2026-11-10",
      "09:30",
      "10:50",
      10,
      "HU-32",
      "Codificación",
      "AEUVG-248 Ficha pública del tutor y sus franjas de disponibilidad, con la regla de que no se encimen.",
    ],
    [
      "2026-11-11",
      "10:20",
      "12:00",
      10,
      "HU-32",
      "Codificación",
      "AEUVG-250 Agenda de tutorías: franja que cubre el horario, modalidad compatible, traslapes y endpoints.",
    ],
    [
      "2026-11-13",
      "10:00",
      "11:40",
      10,
      "HU-32",
      "Pruebas",
      "AEUVG-253 Pruebas de la agenda, de los horarios y de la disponibilidad. Integración de HU-32 a develop.",
    ],
    [
      "2026-11-13",
      "11:55",
      "12:25",
      0,
      "Revisión y cierre",
      "Codificación",
      "AEUVG-254 Verificador del módulo contra la base. Aplicación de la migración de la fotografía en Railway.",
    ],
    [
      "2026-11-14",
      "09:40",
      "11:45",
      15,
      "HU-33",
      "Codificación y pruebas",
      "AEUVG-255 Panel de cuentas con sus filtros, su resumen y el cambio de estado. Integración de HU-33.",
    ],
    [
      "2026-11-16",
      "10:20",
      "12:40",
      15,
      "HU-34",
      "Codificación y pruebas",
      "AEUVG-256 Notificaciones y su enlace con las tutorías y la acreditación de horas. Integración de HU-34.",
    ],
    [
      "2026-11-17",
      "16:10",
      "17:20",
      5,
      "HU-35",
      "Pruebas",
      "AEUVG-258 Pruebas de la validación de la fotografía y de sus permisos. Integración de HU-35 a develop.",
    ],
    [
      "2026-11-18",
      "11:00",
      "11:35",
      5,
      "HU-36",
      "Integración",
      "Revisión del calendario del panel e integración de HU-36 a develop.",
    ],
    [
      "2026-11-19",
      "16:20",
      "16:55",
      5,
      "HU-37",
      "Integración",
      "Revisión de las recomendaciones del perfil e integración de HU-37 a develop.",
    ],
    [
      "2026-11-20",
      "09:40",
      "11:00",
      10,
      "Documentación",
      "Documentación",
      "AEUVG-261 Documentación técnica de las tutorías, las notificaciones y la fotografía de perfil.",
    ],
    [
      "2026-11-22",
      "09:30",
      "11:30",
      10,
      "Documentación",
      "Documentación",
      "Redacción del documento de desarrollo del Sprint 6.",
    ],
    [
      "2026-11-23",
      "10:00",
      "11:40",
      5,
      "Revisión y cierre",
      "Revisión",
      "Revisión conjunta del código del sprint con Juan Gabriel y verificación del incremento completo.",
    ],
    [
      "2026-11-24",
      "09:30",
      "10:50",
      10,
      "Documentación",
      "Documentación",
      "Registro de tiempos del equipo, revisión final de los documentos y publicación del sprint.",
    ],
  ],
};

const JUAN = {
  nombre: "Juan Gabriel Gualim Alvarado",
  carne: "24852",
  sesiones: [
    [
      "2026-11-06",
      "09:40",
      "10:40",
      5,
      "Ajustes del Sprint 5",
      "Diseño y codificación",
      "AEUVG-240 Panel ensanchado y tabla de horas compactada para que quepa en pantalla sin desplazarla.",
    ],
    [
      "2026-11-06",
      "15:30",
      "16:50",
      5,
      "Ajustes del Sprint 5",
      "Diseño y codificación",
      "AEUVG-241 Estudiantes como burbujas en el formulario de horas y retiro de la pantalla aparte.",
    ],
    [
      "2026-11-08",
      "16:00",
      "17:35",
      10,
      "HU-31",
      "Diseño y codificación",
      "AEUVG-245 Pantalla de postulación a tutor, con sus cursos, sus notas y sus comprobantes.",
    ],
    [
      "2026-11-09",
      "13:30",
      "15:20",
      10,
      "HU-31",
      "Diseño y codificación",
      "AEUVG-246 Panel de tutorías con las postulaciones, su revisión y el listado de tutores.",
    ],
    [
      "2026-11-10",
      "15:00",
      "16:35",
      10,
      "HU-32",
      "Diseño y codificación",
      "AEUVG-249 Directorio público de tutores, con su filtro por curso y sus enlaces desde el menú y la portada.",
    ],
    [
      "2026-11-11",
      "16:00",
      "17:45",
      10,
      "HU-32",
      "Diseño y codificación",
      "AEUVG-251 Ficha del tutor y formulario para agendar, con la franja como punto de partida.",
    ],
    [
      "2026-11-12",
      "15:10",
      "17:00",
      10,
      "HU-32",
      "Diseño y codificación",
      "AEUVG-252 Panel del tutor con sus horarios y sus tutorías, y la sección de tutorías del perfil.",
    ],
    [
      "2026-11-17",
      "14:30",
      "16:05",
      10,
      "HU-35",
      "Diseño y codificación",
      "AEUVG-257 Fotografía de perfil, con el avatar unificado del sitio y su aviso de dónde se ve.",
    ],
    [
      "2026-11-18",
      "10:15",
      "11:20",
      5,
      "HU-36",
      "Diseño y codificación",
      "AEUVG-259 Calendario del panel, con los borradores y los cancelados que el público no ve.",
    ],
    [
      "2026-11-19",
      "15:20",
      "16:55",
      10,
      "HU-37",
      "Diseño y codificación",
      "AEUVG-260 Intereses del estudiante y recomendaciones del perfil.",
    ],
    [
      "2026-11-20",
      "11:15",
      "12:20",
      5,
      "Revisión y cierre",
      "Codificación",
      "AEUVG-262 Retiro del marcador de secciones pendientes y actualización de la barra del panel.",
    ],
    [
      "2026-11-23",
      "10:00",
      "11:40",
      5,
      "Revisión y cierre",
      "Revisión",
      "Revisión conjunta del código del sprint con Harry y verificación en teléfono, tableta y escritorio.",
    ],
  ],
};

const ORDEN_CATEGORIAS = [
  "Ajustes del Sprint 5",
  "HU-31",
  "HU-32",
  "HU-33",
  "HU-34",
  "HU-35",
  "HU-36",
  "HU-37",
  "Revisión y cierre",
  "Documentación",
];

const NOMBRE_CATEGORIA = {
  "Ajustes del Sprint 5": "Ajustes posteriores a la revisión del Sprint 5",
  "HU-31": "HU-31 - Postulación para ser tutor y su revisión",
  "HU-32": "HU-32 - Directorio de tutores y agenda de tutorías",
  "HU-33": "HU-33 - Panel de cuentas del estudiantado",
  "HU-34": "HU-34 - Notificaciones de la cuenta",
  "HU-35": "HU-35 - Fotografía de perfil",
  "HU-36": "HU-36 - Calendario del panel",
  "HU-37": "HU-37 - Intereses y recomendaciones",
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

const enHoras = (minutos) => (Math.round((minutos / 60) * 10) / 10).toFixed(1);

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
        if (dias < 0) throw new Error(`${persona.nombre}: las sesiones no están en orden.`);
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

const tablaResumen = (persona) =>
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

/**
 * Bloques del registro de tiempos, listos para insertarse al final del
 * documento de desarrollo. `seccion` es el número que le corresponde dentro de
 * ese documento.
 */
function bloquesRegistroTiempos(seccion) {
  const harry = calcular(HARRY);
  const juan = calcular(JUAN);
  const totalEquipo = harry.total + juan.total;

  const bloques = [
    h1(`${seccion}. Registro de tiempos`),
    p(
      "Esta sección registra el tiempo dedicado por cada integrante al Sprint 6, entre el 6 y el 24 de noviembre de 2026. Cada sesión indica la fecha, la hora de inicio y de finalización, el tiempo de interrupción, el tiempo neto trabajado, la fase de la actividad y una descripción del trabajo realizado."
    ),
    p(
      "El delta de tiempo corresponde a la hora de finalización menos la hora de inicio menos el tiempo de interrupción. Las interrupciones son pausas cortas dentro de una misma sesión. La sesión de revisión conjunta aparece en ambos registros con el mismo horario, por tratarse de trabajo realizado en conjunto."
    ),
    p(
      `El sprint sumó ${enHoras(totalEquipo)} horas de equipo: ${enHoras(harry.total)} horas de Harry Méndez y ${enHoras(juan.total)} horas de Juan Gabriel Gualim. A diferencia de los anteriores, este sprint no tuvo documento de planificación ni estimación previa: se acordó cerrar en un solo tramo de tres semanas todo lo que faltaba del proyecto, y el alcance se fue fijando historia por historia sobre el modelo de datos que el Sprint 1 ya había dejado completo.`
    ),

    h2(`${seccion}.1. ${HARRY.nombre} - ${HARRY.carne}`),
    spacer(),
    tablaRegistro(harry),
    spacer(),
    p("Resumen por historia de usuario:"),
    spacer(),
    tablaResumen(harry),

    h2(`${seccion}.2. ${JUAN.nombre} - ${JUAN.carne}`),
    spacer(),
    tablaRegistro(juan),
    spacer(),
    p("Resumen por historia de usuario:"),
    spacer(),
    tablaResumen(juan),

    h2(`${seccion}.3. Resumen del equipo`),
    spacer(),
    makeTable(
      [4560, 1600, 1600, 1600],
      ["Integrante", "Sesiones", "Tiempo", "Horas"],
      [
        [
          HARRY.nombre,
          String(harry.filas.length),
          comoHoraMinuto(harry.total),
          enHoras(harry.total),
        ],
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
      "El reparto siguió las responsabilidades de siempre: Harry Méndez asumió las consultas, los servicios con sus reglas, los endpoints y las pruebas automatizadas; Juan Gabriel Gualim, las pantallas. La semana de en medio del sprint fue casi toda de Harry, porque el panel de cuentas y las notificaciones son sobre todo trabajo sin pantalla, y por eso su registro tiene más horas que en sprints anteriores. Las sesiones compartidas corresponden a la revisión final del código. El resumen por historia asigna cada sesión a la historia predominante en ella."
    ),
  ];

  return { bloques, harry, juan, totalEquipo, enHoras };
}

module.exports = { bloquesRegistroTiempos };
