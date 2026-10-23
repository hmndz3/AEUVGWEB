// Registro de tiempos del Sprint 4.
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
      "2026-10-08",
      "19:10",
      "20:05",
      5,
      "Gestión del sprint",
      "Planificación",
      "Planificación del Sprint 4 con Juan Gabriel: selección de historias, estimación y orden de ejecución.",
    ],
    [
      "2026-10-08",
      "20:35",
      "21:40",
      10,
      "Documentación",
      "Documentación",
      "Redacción del documento de planificación del Sprint 4.",
    ],
    [
      "2026-10-09",
      "01:00",
      "02:05",
      5,
      "HU-19",
      "Codificación",
      "AEUVG-140 Migración del carnet y del vínculo opcional con la cuenta. AEUVG-141 Consultas de listado y detalle de los registros.",
    ],
    [
      "2026-10-10",
      "16:10",
      "17:15",
      10,
      "HU-19",
      "Codificación",
      "AEUVG-143 Servicio de registro de horas con sus validaciones y la resolución del vínculo por carnet.",
    ],
    [
      "2026-10-10",
      "21:40",
      "22:35",
      5,
      "HU-19",
      "Codificación y pruebas",
      "AEUVG-144 Datos de prueba de horas beca. AEUVG-145 Pruebas de las consultas y del servicio. Integración de HU-19 a develop.",
    ],
    [
      "2026-10-11",
      "19:40",
      "20:45",
      10,
      "HU-20",
      "Codificación",
      "AEUVG-146 Validación de los parámetros del listado. AEUVG-147 Resumen de horas del periodo consultado.",
    ],
    [
      "2026-10-13",
      "21:50",
      "22:45",
      5,
      "HU-20",
      "Pruebas",
      "AEUVG-151 Verificación del panel en escritorio, tableta y teléfono, con las pruebas de los filtros. Integración de HU-20 a develop.",
    ],
    [
      "2026-10-14",
      "01:10",
      "02:15",
      5,
      "HU-21",
      "Codificación",
      "AEUVG-152 Esquema de validación del registro. AEUVG-153 Endpoints de creación, edición y eliminación protegidos por rol.",
    ],
    [
      "2026-10-16",
      "20:10",
      "21:15",
      5,
      "HU-21",
      "Pruebas",
      "AEUVG-157 Pruebas de las validaciones y de los permisos del registro de horas. Integración de HU-21 a develop.",
    ],
    [
      "2026-10-17",
      "01:05",
      "02:10",
      5,
      "HU-22",
      "Codificación",
      "AEUVG-158 Servicio de acreditación con su fecha y su responsable. AEUVG-159 Reversión. AEUVG-160 Endpoint de acreditación en lote.",
    ],
    [
      "2026-10-18",
      "19:40",
      "20:45",
      10,
      "HU-22",
      "Pruebas",
      "AEUVG-163 Pruebas de la acreditación y de las operaciones en lote. Integración de HU-22 a develop.",
    ],
    [
      "2026-10-19",
      "09:20",
      "10:20",
      5,
      "HU-23",
      "Codificación",
      "AEUVG-164 Búsqueda de la cuenta por carnet. AEUVG-165 Vinculación de los registros existentes al crearse la cuenta.",
    ],
    [
      "2026-10-19",
      "21:00",
      "21:55",
      5,
      "HU-23",
      "Codificación y pruebas",
      "AEUVG-168 Datos de prueba de un segundo carnet sin cuenta. AEUVG-169 Pruebas de la asociación por carnet. Integración de HU-23 a develop.",
    ],
    [
      "2026-10-20",
      "09:15",
      "10:15",
      10,
      "HU-24",
      "Codificación",
      "AEUVG-170 Consultas de las horas beca del estudiante de la sesión. AEUVG-171 Cálculo de los totales realizados, acreditados y pendientes.",
    ],
    [
      "2026-10-20",
      "19:20",
      "20:20",
      10,
      "Revisión y cierre",
      "Revisión",
      "Revisión conjunta del código del sprint con Juan Gabriel. AEUVG-175 Verificación final y documentación técnica del módulo.",
    ],
    [
      "2026-10-20",
      "22:40",
      "23:30",
      5,
      "Documentación",
      "Documentación",
      "Redacción del documento de desarrollo del Sprint 4.",
    ],
    [
      "2026-10-21",
      "09:15",
      "10:20",
      10,
      "Documentación",
      "Integración",
      "Registro de tiempos dentro del documento de desarrollo e integración de develop a main.",
    ],
    [
      "2026-10-22",
      "15:30",
      "17:00",
      15,
      "Revisión y cierre",
      "Codificación",
      "AEUVG-176 Fecha de actividad futura rechazada al registrar. AEUVG-178 Filtros del panel conservados al volver de guardar. Actualización del documento e integración de los ajustes a main.",
    ],
    [
      "2026-10-22",
      "17:30",
      "18:05",
      5,
      "Revisión y cierre",
      "Documentación",
      "Actualización del registro de tiempos con el cierre completo, verificación de la migración pendiente y publicación de la versión final del sprint.",
    ],
    [
      "2026-10-22",
      "19:10",
      "20:05",
      5,
      "Revisión y cierre",
      "Integración",
      "Integración de los ajustes finales del Sprint 3 publicados en main, verificación conjunta de los dos incrementos y corrección de la planificación.",
    ],
  ],
};

const JUAN = {
  nombre: "Juan Gabriel Gualim Molina",
  carne: "24852",
  sesiones: [
    [
      "2026-10-08",
      "19:10",
      "20:05",
      5,
      "Gestión del sprint",
      "Planificación",
      "Planificación del Sprint 4 con Harry: selección de historias, estimación y orden de ejecución.",
    ],
    [
      "2026-10-10",
      "16:30",
      "17:25",
      5,
      "HU-19",
      "Codificación",
      "AEUVG-142 Normalización del carnet y texto de búsqueda de los registros de horas.",
    ],
    [
      "2026-10-12",
      "10:15",
      "11:15",
      5,
      "HU-20",
      "Diseño y codificación",
      "AEUVG-148 Tabla de registros del panel con sus columnas, su estado y su desplazamiento en móvil.",
    ],
    [
      "2026-10-12",
      "20:00",
      "21:00",
      5,
      "HU-20",
      "Codificación",
      "AEUVG-149 Buscador de estudiantes por nombre o carnet.",
    ],
    [
      "2026-10-13",
      "15:40",
      "16:50",
      10,
      "HU-20",
      "Codificación",
      "AEUVG-150 Filtros por estado, periodo de actividad y vínculo con la cuenta.",
    ],
    [
      "2026-10-14",
      "21:10",
      "22:10",
      5,
      "HU-21",
      "Diseño y codificación",
      "AEUVG-154 Formulario de registro de horas del panel, con sus mensajes por campo.",
    ],
    [
      "2026-10-15",
      "20:30",
      "21:30",
      10,
      "HU-21",
      "Codificación",
      "AEUVG-155 Corrección de un registro desde el listado.",
    ],
    [
      "2026-10-16",
      "16:00",
      "16:45",
      5,
      "HU-21",
      "Codificación",
      "AEUVG-156 Confirmación y aviso al eliminar un registro.",
    ],
    [
      "2026-10-17",
      "21:00",
      "22:00",
      5,
      "HU-22",
      "Codificación",
      "AEUVG-161 Selección múltiple de filas del listado, descartada al cambiar de filtro o de página.",
    ],
    [
      "2026-10-18",
      "15:50",
      "16:45",
      5,
      "HU-22",
      "Diseño y codificación",
      "AEUVG-162 Barra de acciones en lote con su resumen de selección y su aviso de resultado.",
    ],
    [
      "2026-10-19",
      "20:00",
      "20:45",
      5,
      "HU-23",
      "Codificación",
      "AEUVG-166 Registros sin cuenta señalados en el panel. AEUVG-167 Nombre de la cuenta cuando el registro está vinculado.",
    ],
    [
      "2026-10-20",
      "11:40",
      "12:35",
      5,
      "HU-24",
      "Diseño y codificación",
      "AEUVG-172 Sección “Mis horas beca” del perfil con sus totales.",
    ],
    [
      "2026-10-20",
      "15:30",
      "16:25",
      5,
      "HU-24",
      "Codificación",
      "AEUVG-173 Historial de actividades del estudiante. AEUVG-174 Enlace a las horas beca desde el menú de la cuenta.",
    ],
    [
      "2026-10-20",
      "19:20",
      "20:20",
      10,
      "Revisión y cierre",
      "Revisión",
      "Revisión conjunta del código del sprint con Harry y verificación final del incremento.",
    ],
    [
      "2026-10-22",
      "15:55",
      "16:40",
      5,
      "Revisión y cierre",
      "Codificación",
      "AEUVG-177 Administrador acreditador visible en el panel. AEUVG-179 Fecha de acreditación en el historial del perfil.",
    ],
  ],
};

const ORDEN_CATEGORIAS = [
  "Gestión del sprint",
  "HU-19",
  "HU-20",
  "HU-21",
  "HU-22",
  "HU-23",
  "HU-24",
  "Revisión y cierre",
  "Documentación",
];

const NOMBRE_CATEGORIA = {
  "Gestión del sprint": "Gestión del sprint",
  "HU-19": "HU-19 - Consultas y servicios de horas beca",
  "HU-20": "HU-20 - Panel administrativo de horas beca",
  "HU-21": "HU-21 - Registro, edición y eliminación",
  "HU-22": "HU-22 - Acreditación y operaciones en lote",
  "HU-23": "HU-23 - Asociación de registros por carnet",
  "HU-24": "HU-24 - Mis horas beca en el perfil",
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
const HORAS_ESTIMADAS = 30;

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
      "Esta sección registra el tiempo dedicado por cada integrante al Sprint 4, entre el 8 y el 22 de octubre de 2026. Cada sesión indica la fecha, la hora de inicio y de finalización, el tiempo de interrupción, el tiempo neto trabajado, la fase de la actividad y una descripción del trabajo realizado."
    ),
    p(
      "El delta de tiempo corresponde a la hora de finalización menos la hora de inicio menos el tiempo de interrupción. Las interrupciones son pausas cortas dentro de una misma sesión. Las sesiones de planificación y de revisión conjunta aparecen en ambos registros con el mismo horario, por tratarse de trabajo realizado en conjunto."
    ),
    p(
      `El sprint sumó ${enHoras(totalEquipo)} horas de equipo: ${enHoras(harry.total)} horas de Harry Méndez y ${enHoras(juan.total)} horas de Juan Gabriel Gualim, frente a las ${HORAS_ESTIMADAS} horas estimadas en la planificación, es decir, un ${desviacion(totalEquipo)} de lo previsto. La estimación se calculó con las 30.4 horas que consumieron las historias comprometidas del Sprint 3 y resultó acertada: el módulo no reutilizó pantallas ya resueltas, pero sí la protección por rol, la paginación, la validación de parámetros y la búsqueda sin acentos de los sprints anteriores. La última sesión corresponde a la integración de los ajustes finales del Sprint 3, que se publicaron en la rama principal mientras este sprint estaba en curso.`
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
      "El reparto del trabajo siguió las responsabilidades acordadas: Harry Méndez asumió la migración, las consultas, los servicios de registro y acreditación, la asociación por carnet y las pruebas automatizadas; Juan Gabriel Gualim, la tabla del panel, el buscador, los filtros, el formulario, la selección en lote y la sección del perfil. Las sesiones en las que participaron ambos corresponden a la planificación del sprint y a la revisión final del código. El resumen por historia asigna cada sesión a la historia predominante en ella."
    ),
  ];

  return { bloques, harry, juan, totalEquipo, enHoras };
}

module.exports = { bloquesRegistroTiempos };
