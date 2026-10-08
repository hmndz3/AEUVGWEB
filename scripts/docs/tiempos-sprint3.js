// Registro de tiempos del Sprint 3.
//
// Se mantiene como módulo y no como documento aparte: los bloques que exporta
// se insertan al final del documento de desarrollo del sprint. Los deltas, los
// totales y el resumen por historia se calculan aquí a partir de las sesiones,
// para que las sumas no dependan de una cuenta hecha a mano. El módulo aborta
// si una sesión es inconsistente o si alguien deja pasar más de dos días.
const { p, h1, h2, makeTable, spacer } = require("./template");

const MAXIMO_DIAS_SIN_TRABAJAR = 2;

// fecha, inicio, fin, interrupción (minutos), categoría, fase, comentario
const HARRY = {
  nombre: "Harry Daniel Méndez Mendoza",
  carne: "24089",
  sesiones: [
    [
      "2026-09-24",
      "19:20",
      "20:15",
      5,
      "Gestión del sprint",
      "Planificación",
      "Planificación del Sprint 3 con Juan Gabriel: selección de historias, estimación y orden de ejecución.",
    ],
    [
      "2026-09-24",
      "20:45",
      "21:55",
      10,
      "Documentación",
      "Documentación",
      "Redacción del documento de planificación del Sprint 3.",
    ],
    [
      "2026-09-25",
      "01:05",
      "02:10",
      5,
      "HU-13",
      "Codificación",
      "AEUVG-99 Texto de búsqueda e índices de asociaciones y clubes. AEUVG-100 Consultas de listado y detalle de asociaciones.",
    ],
    [
      "2026-09-26",
      "16:10",
      "17:15",
      10,
      "HU-13",
      "Codificación y pruebas",
      "AEUVG-101 Consultas de clubes. AEUVG-103 Datos de prueba de asociaciones y clubes. AEUVG-104 Pruebas de las consultas.",
    ],
    [
      "2026-09-27",
      "20:05",
      "21:10",
      5,
      "HU-14",
      "Codificación",
      "Integración de HU-13 a develop. AEUVG-107 Página de detalle de la asociación con su descripción, misión y visión.",
    ],
    [
      "2026-09-29",
      "09:40",
      "10:45",
      5,
      "HU-14",
      "Pruebas",
      "AEUVG-110 Verificación del listado y del detalle de asociaciones en escritorio, tableta y teléfono.",
    ],
    [
      "2026-09-29",
      "21:40",
      "22:40",
      5,
      "HU-15",
      "Codificación",
      "Integración de HU-14 a develop. AEUVG-113 Actividades del organizador dentro de su página de detalle.",
    ],
    [
      "2026-09-30",
      "01:00",
      "02:05",
      5,
      "HU-15",
      "Codificación y pruebas",
      "AEUVG-114 Organizadores del evento enlazados a su página. AEUVG-116 Pruebas de las actividades del organizador.",
    ],
    [
      "2026-10-01",
      "19:50",
      "20:55",
      10,
      "HU-16",
      "Codificación",
      "AEUVG-117 Servicio de creación y edición de asociaciones con sus validaciones.",
    ],
    [
      "2026-10-02",
      "15:30",
      "16:35",
      5,
      "HU-16",
      "Codificación",
      "Integración de HU-15 a develop. AEUVG-118 Servicio de clubes y endpoints de administración protegidos por rol.",
    ],
    [
      "2026-10-03",
      "20:10",
      "21:15",
      5,
      "HU-16",
      "Codificación",
      "AEUVG-119 Administración de la junta directiva y de las redes sociales desde el panel.",
    ],
    [
      "2026-10-04",
      "01:15",
      "02:20",
      5,
      "HU-17",
      "Codificación",
      "AEUVG-123 Consultas del perfil. AEUVG-124 Servicio de edición con sus validaciones. AEUVG-125 Endpoint de actualización.",
    ],
    [
      "2026-10-05",
      "01:30",
      "02:20",
      5,
      "HU-16",
      "Pruebas",
      "AEUVG-122 Pruebas de las validaciones y de los permisos de administración. Integración de HU-16 a develop.",
    ],
    [
      "2026-10-05",
      "21:40",
      "22:45",
      10,
      "HU-18",
      "Codificación",
      "AEUVG-128 Pruebas del perfil e integración de HU-17 a develop. AEUVG-129 Servicio de guardar eventos. AEUVG-130 Endpoint de eventos guardados.",
    ],
    [
      "2026-10-06",
      "19:30",
      "20:35",
      10,
      "Revisión y cierre",
      "Revisión",
      "Revisión conjunta del código del sprint con Juan Gabriel. AEUVG-134 Verificación final y documentación técnica.",
    ],
    [
      "2026-10-06",
      "22:50",
      "23:55",
      5,
      "Documentación",
      "Documentación",
      "Redacción del documento de desarrollo del Sprint 3.",
    ],
    [
      "2026-10-07",
      "09:10",
      "10:25",
      10,
      "Documentación",
      "Integración",
      "Registro de tiempos dentro del documento de desarrollo e integración de develop a main.",
    ],
    [
      "2026-10-07",
      "15:40",
      "17:10",
      15,
      "Revisión y cierre",
      "Codificación",
      "AEUVG-136 Eliminación deshabilitada con su explicación. AEUVG-138 Teléfono entre los datos del perfil. Integración de los ajustes a main.",
    ],
    [
      "2026-10-07",
      "18:00",
      "18:35",
      5,
      "Revisión y cierre",
      "Codificación y pruebas",
      "AEUVG-139 Corrección de la carga inicial del texto de búsqueda al aplicar las migraciones en Railway, con su prueba de regresión.",
    ],
  ],
};

const JUAN = {
  nombre: "Juan Gabriel Gualim Molina",
  carne: "24852",
  sesiones: [
    [
      "2026-09-24",
      "19:20",
      "20:15",
      5,
      "Gestión del sprint",
      "Planificación",
      "Planificación del Sprint 3 con Harry: selección de historias, estimación y orden de ejecución.",
    ],
    [
      "2026-09-25",
      "20:35",
      "21:25",
      5,
      "HU-13",
      "Codificación",
      "AEUVG-102 Consulta de las actividades que organiza cada asociación o club.",
    ],
    [
      "2026-09-27",
      "22:15",
      "23:05",
      5,
      "HU-14",
      "Diseño y codificación",
      "AEUVG-105 Tarjeta de organización reutilizable a partir del prototipo del Sprint 1.",
    ],
    [
      "2026-09-28",
      "16:20",
      "17:25",
      10,
      "HU-14",
      "Codificación",
      "AEUVG-106 Listado de asociaciones con su buscador y su paginación por enlaces.",
    ],
    [
      "2026-09-29",
      "01:10",
      "02:05",
      5,
      "HU-14",
      "Codificación",
      "AEUVG-108 Junta directiva en el detalle. AEUVG-109 Contacto y redes sociales de la asociación.",
    ],
    [
      "2026-09-30",
      "21:15",
      "22:10",
      5,
      "HU-15",
      "Codificación",
      "AEUVG-111 Listado de clubes reutilizando los componentes de la sección de asociaciones.",
    ],
    [
      "2026-10-01",
      "22:30",
      "23:25",
      5,
      "HU-15",
      "Codificación",
      "AEUVG-112 Detalle del club con sus actividades. AEUVG-115 Enlaces desde los accesos rápidos y el pie.",
    ],
    [
      "2026-10-03",
      "01:05",
      "02:00",
      5,
      "HU-16",
      "Codificación",
      "AEUVG-120 Listados del panel de asociaciones y clubes con su buscador y sus acciones.",
    ],
    [
      "2026-10-04",
      "16:10",
      "17:10",
      10,
      "HU-16",
      "Codificación",
      "AEUVG-121 Formularios del panel, con los editores de junta directiva y de redes sociales.",
    ],
    [
      "2026-10-05",
      "20:25",
      "21:20",
      5,
      "HU-17",
      "Codificación",
      "AEUVG-126 Pantalla del perfil con sus secciones. AEUVG-127 Formulario de edición del perfil.",
    ],
    [
      "2026-10-06",
      "15:40",
      "16:45",
      5,
      "HU-18",
      "Codificación",
      "AEUVG-131 Control de guardar evento. AEUVG-132 Eventos guardados en el perfil. AEUVG-133 Redes de AEUVG en el pie.",
    ],
    [
      "2026-10-06",
      "19:30",
      "20:35",
      10,
      "Revisión y cierre",
      "Revisión",
      "Revisión conjunta del código del sprint con Harry y verificación final del incremento.",
    ],
    [
      "2026-10-07",
      "15:50",
      "16:45",
      5,
      "Revisión y cierre",
      "Diseño y codificación",
      "AEUVG-135 Enlace a la ficha pública desde el panel. AEUVG-137 Total de eventos guardados en el perfil.",
    ],
  ],
};

const ORDEN_CATEGORIAS = [
  "Gestión del sprint",
  "HU-13",
  "HU-14",
  "HU-15",
  "HU-16",
  "HU-17",
  "HU-18",
  "Revisión y cierre",
  "Documentación",
];

const NOMBRE_CATEGORIA = {
  "Gestión del sprint": "Gestión del sprint",
  "HU-13": "HU-13 - Consultas de asociaciones y clubes",
  "HU-14": "HU-14 - Sección de asociaciones",
  "HU-15": "HU-15 - Sección de clubes y vinculación",
  "HU-16": "HU-16 - Administración de asociaciones y clubes",
  "HU-17": "HU-17 - Perfil del estudiante",
  "HU-18": "HU-18 - Eventos guardados y redes de AEUVG",
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

/** Horas de equipo estimadas en la planificación del sprint. */
const HORAS_ESTIMADAS = 28;

/** Desviación del tiempo real frente al estimado, redactada para el documento. */
function desviacion(totalMinutos) {
  const porcentaje = Math.round((totalMinutos / 60 / HORAS_ESTIMADAS - 1) * 100);

  if (porcentaje === 0) return "ajuste exacto";

  return `${Math.abs(porcentaje)}% ${porcentaje > 0 ? "por encima" : "por debajo"}`;
}

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
      "Esta sección registra el tiempo dedicado por cada integrante al Sprint 3, entre el 24 de septiembre y el 7 de octubre de 2026. Cada sesión indica la fecha, la hora de inicio y de finalización, el tiempo de interrupción, el tiempo neto trabajado, la fase de la actividad y una descripción del trabajo realizado."
    ),
    p(
      "El delta de tiempo corresponde a la hora de finalización menos la hora de inicio menos el tiempo de interrupción. Las interrupciones son pausas cortas dentro de una misma sesión. Las sesiones de planificación y de revisión conjunta aparecen en ambos registros con el mismo horario, por tratarse de trabajo realizado en conjunto."
    ),
    p(
      `El sprint sumó ${enHoras(totalEquipo)} horas de equipo: ${enHoras(harry.total)} horas de Harry Méndez y ${enHoras(juan.total)} horas de Juan Gabriel Gualim, frente a las ${HORAS_ESTIMADAS} horas estimadas en la planificación, es decir, un ${desviacion(totalEquipo)} de lo previsto. La estimación se calculó con la velocidad medida en el Sprint 2 y este sprint reutilizó los componentes de listado, paginación, estado vacío y carga de imágenes construidos en aquel, lo que mantuvo el tiempo real cerca de lo previsto. La diferencia corresponde al día de cierre: la revisión con AEUVG dejó observaciones que se resolvieron el mismo 7 de octubre, antes de publicar la versión final del sprint.`
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
      "El reparto del trabajo siguió las responsabilidades acordadas: Harry Méndez asumió la migración, las consultas, los servicios de administración, el perfil y las pruebas automatizadas; Juan Gabriel Gualim, las pantallas públicas, los componentes compartidos de las dos secciones y los formularios del panel. Las sesiones en las que participaron ambos corresponden a la planificación del sprint y a la revisión final del código. El resumen por historia asigna cada sesión a la historia predominante en ella."
    ),
  ];

  return { bloques, harry, juan, totalEquipo, enHoras };
}

module.exports = { bloquesRegistroTiempos };
