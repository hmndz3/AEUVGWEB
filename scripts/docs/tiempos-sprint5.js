// Registro de tiempos del Sprint 5.
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
      "2026-10-22",
      "20:15",
      "21:00",
      5,
      "Ajustes del Sprint 4",
      "Codificación",
      "Tres cuentas de estudiante para la demostración con sus horas vinculadas y el verificador de la migración de horas beca contra la base. AEUVG-180 Enlace de horas beca de los accesos rápidos corregido.",
    ],
    [
      "2026-10-22",
      "23:05",
      "23:25",
      0,
      "Ajustes del Sprint 4",
      "Codificación",
      "AEUVG-186 Horario de apoyo exigido como dos horas de reloj, con su patrón compartido por el formulario y el servicio.",
    ],
    [
      "2026-10-23",
      "00:00",
      "00:25",
      0,
      "Ajustes del Sprint 4",
      "Codificación",
      "AEUVG-188 Búsqueda de estudiantes registrados expuesta para el panel, con su endpoint protegido por rol.",
    ],
    [
      "2026-10-23",
      "09:25",
      "10:05",
      5,
      "Ajustes del Sprint 4",
      "Codificación",
      "AEUVG-191 Teléfono de contacto en asociaciones y clubes, con su migración. AEUVG-192 Siglas y al menos un medio de contacto exigidos en las organizaciones.",
    ],
    [
      "2026-10-23",
      "11:00",
      "11:20",
      0,
      "Ajustes del Sprint 4",
      "Integración",
      "Integración y publicación de los ajustes de la revisión del Sprint 4, y sincronización de develop con la rama principal.",
    ],
    [
      "2026-10-23",
      "19:10",
      "19:45",
      5,
      "Gestión del sprint",
      "Planificación",
      "Planificación del Sprint 5 con Juan Gabriel: selección de historias, estimación y orden de ejecución. Instalación de las librerías de Excel y PDF, y actualización de zod por un aviso de seguridad.",
    ],
    [
      "2026-10-23",
      "21:05",
      "21:50",
      5,
      "Documentación",
      "Documentación",
      "Redacción del documento de planificación del Sprint 5.",
    ],
    [
      "2026-10-24",
      "10:05",
      "11:00",
      5,
      "HU-25",
      "Codificación",
      "AEUVG-195 Consulta de los registros de la exportación respetando los filtros del panel. AEUVG-196 Exportación en CSV con su escape y su codificación.",
    ],
    [
      "2026-10-24",
      "16:20",
      "17:30",
      15,
      "HU-25",
      "Codificación",
      "AEUVG-197 Exportación en Excel con sus columnas y su hoja de resumen. AEUVG-198 Exportación en PDF apaisado con su encabezado repetido en cada página.",
    ],
    [
      "2026-10-24",
      "18:05",
      "18:30",
      0,
      "HU-25",
      "Codificación",
      "AEUVG-199 Endpoint de exportación protegido por rol, con su límite de registros y su nombre de archivo.",
    ],
    [
      "2026-10-24",
      "20:55",
      "21:30",
      5,
      "HU-25",
      "Pruebas",
      "AEUVG-201 Pruebas de los tres formatos de exportación. Integración de HU-25 a develop.",
    ],
    [
      "2026-10-25",
      "10:15",
      "11:20",
      10,
      "HU-26",
      "Codificación",
      "AEUVG-202 Lectura del archivo de Excel con sus columnas localizadas por encabezado. AEUVG-203 Validación fila por fila sin escribir en la base.",
    ],
    [
      "2026-10-25",
      "16:00",
      "16:55",
      5,
      "HU-26",
      "Codificación",
      "AEUVG-204 Importación de las filas correctas con su constancia en la base. AEUVG-205 Endpoints de revisión previa e importación.",
    ],
    [
      "2026-10-26",
      "09:50",
      "10:10",
      0,
      "Documentación",
      "Documentación",
      "Corrección del estado de la migración en el documento del Sprint 4, ya aplicada en el ambiente de Railway.",
    ],
    [
      "2026-10-26",
      "12:15",
      "12:55",
      5,
      "HU-26",
      "Pruebas",
      "AEUVG-207 Pruebas de la lectura, la validación y el conteo de la importación. Integración de HU-26 a develop.",
    ],
    [
      "2026-10-27",
      "10:00",
      "10:30",
      0,
      "HU-27",
      "Codificación",
      "AEUVG-208 Plantilla de Excel generada a partir de las mismas columnas que usa el importador.",
    ],
    [
      "2026-10-27",
      "12:05",
      "12:45",
      5,
      "HU-27",
      "Documentación",
      "AEUVG-210 Procedimiento de migración de los históricos documentado. AEUVG-211 Comprobación de que la plantilla y el importador usen las mismas columnas.",
    ],
    [
      "2026-10-27",
      "13:50",
      "14:50",
      25,
      "HU-27",
      "Pruebas",
      "AEUVG-212 Datos de prueba ampliados con una importación de ejemplo. AEUVG-213 Pruebas de la plantilla contra el importador. Integración de HU-27 a develop.",
    ],
    [
      "2026-10-28",
      "10:05",
      "11:15",
      10,
      "HU-28",
      "Codificación",
      "AEUVG-214 Consultas del resumen general del programa. AEUVG-215 Desglose de las horas por mes y por estudiante.",
    ],
    [
      "2026-10-28",
      "18:00",
      "18:30",
      0,
      "HU-28",
      "Pruebas",
      "AEUVG-219 Pruebas de los cálculos del resumen, separándolos de las consultas. Integración de HU-28 a develop.",
    ],
    [
      "2026-10-29",
      "09:55",
      "10:40",
      5,
      "Revisión y cierre",
      "Revisión",
      "Revisión conjunta del código del sprint con Juan Gabriel, verificación del incremento completo y actualización de la documentación técnica del módulo.",
    ],
    [
      "2026-10-30",
      "10:00",
      "10:35",
      5,
      "Documentación",
      "Documentación",
      "Redacción del documento de desarrollo del Sprint 5.",
    ],
    [
      "2026-10-31",
      "09:30",
      "10:10",
      5,
      "Documentación",
      "Documentación",
      "Registro de tiempos del equipo y revisión final de los dos documentos del sprint.",
    ],
  ],
};

const JUAN = {
  nombre: "Juan Gabriel Gualim Alvarado",
  carne: "24852",
  sesiones: [
    [
      "2026-10-22",
      "21:00",
      "21:55",
      5,
      "Ajustes del Sprint 4",
      "Codificación",
      "AEUVG-181 Rótulo del carrusel de la portada hecho visible. AEUVG-182 Sección de próximos eventos retirada. AEUVG-183 Un solo acceso a las horas beca en el menú de la cuenta.",
    ],
    [
      "2026-10-22",
      "22:10",
      "22:30",
      0,
      "Ajustes del Sprint 4",
      "Codificación",
      "AEUVG-184 Tarjeta de Tutorías dejada sin enlace hasta que la sección exista, con su aviso.",
    ],
    [
      "2026-10-22",
      "22:35",
      "23:30",
      5,
      "Ajustes del Sprint 4",
      "Diseño y codificación",
      "AEUVG-185 Portada ajustada para que el carrusel quepa completo al entrar. AEUVG-187 Horario de apoyo con dos selectores de hora.",
    ],
    [
      "2026-10-23",
      "00:05",
      "01:00",
      5,
      "Ajustes del Sprint 4",
      "Diseño y codificación",
      "AEUVG-189 Sugerencias de estudiantes por carnet. AEUVG-190 Desplegable del carnet rehecho con el diseño del panel.",
    ],
    [
      "2026-10-23",
      "09:50",
      "10:35",
      5,
      "Ajustes del Sprint 4",
      "Codificación",
      "AEUVG-193 Correo y teléfono separados en el formulario y en la ficha pública. AEUVG-194 Campos obligatorios de horas beca marcados y carnet destacado.",
    ],
    [
      "2026-10-23",
      "19:10",
      "19:45",
      5,
      "Gestión del sprint",
      "Planificación",
      "Planificación del Sprint 5 con Harry: selección de historias, estimación y orden de ejecución.",
    ],
    [
      "2026-10-24",
      "19:55",
      "20:40",
      5,
      "HU-25",
      "Diseño y codificación",
      "AEUVG-200 Controles de exportación del panel de horas beca, como enlaces que arrastran los filtros de la dirección.",
    ],
    [
      "2026-10-26",
      "10:30",
      "11:20",
      5,
      "HU-26",
      "Diseño y codificación",
      "AEUVG-206 Pantalla de importación en dos pasos, con su reporte de filas con problemas.",
    ],
    [
      "2026-10-27",
      "10:35",
      "11:05",
      0,
      "HU-27",
      "Codificación",
      "AEUVG-209 Plantilla ofrecida desde la pantalla de importación.",
    ],
    [
      "2026-10-28",
      "11:55",
      "12:20",
      0,
      "HU-28",
      "Codificación",
      "Enlace de la plantilla dejado como descarga y no como navegación de la aplicación, que era lo que señalaba el análisis estático.",
    ],
    [
      "2026-10-28",
      "14:20",
      "15:30",
      10,
      "HU-28",
      "Diseño y codificación",
      "AEUVG-216 Pantalla de reportes con sus indicadores del programa y el desglose por mes.",
    ],
    [
      "2026-10-28",
      "16:20",
      "17:35",
      10,
      "HU-28",
      "Codificación",
      "AEUVG-217 Detalle por estudiante y acotación del reporte por periodo. AEUVG-218 Exportación del periodo enlazada desde la pantalla de reportes.",
    ],
    [
      "2026-10-29",
      "09:55",
      "10:40",
      5,
      "Revisión y cierre",
      "Revisión",
      "Revisión conjunta del código del sprint con Harry y verificación del incremento en teléfono, tableta y escritorio.",
    ],
  ],
};

const ORDEN_CATEGORIAS = [
  "Gestión del sprint",
  "Ajustes del Sprint 4",
  "HU-25",
  "HU-26",
  "HU-27",
  "HU-28",
  "Revisión y cierre",
  "Documentación",
];

const NOMBRE_CATEGORIA = {
  "Gestión del sprint": "Gestión del sprint",
  "Ajustes del Sprint 4": "Ajustes posteriores a la revisión del Sprint 4",
  "HU-25": "HU-25 - Exportación de los registros de horas beca",
  "HU-26": "HU-26 - Importación de registros desde Excel",
  "HU-27": "HU-27 - Plantilla y migración de los históricos",
  "HU-28": "HU-28 - Reportes y resumen general de horas",
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
const HORAS_ESTIMADAS = 17.75;

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
      "Esta sección registra el tiempo dedicado por cada integrante al Sprint 5, entre el 22 de octubre y el 3 de noviembre de 2026. Cada sesión indica la fecha, la hora de inicio y de finalización, el tiempo de interrupción, el tiempo neto trabajado, la fase de la actividad y una descripción del trabajo realizado."
    ),
    p(
      "El delta de tiempo corresponde a la hora de finalización menos la hora de inicio menos el tiempo de interrupción. Las interrupciones son pausas cortas dentro de una misma sesión. Las sesiones de planificación y de revisión conjunta aparecen en ambos registros con el mismo horario, por tratarse de trabajo realizado en conjunto."
    ),
    p(
      `El sprint sumó ${enHoras(totalEquipo)} horas de equipo: ${enHoras(harry.total)} horas de Harry Méndez y ${enHoras(juan.total)} horas de Juan Gabriel Gualim, frente a las ${HORAS_ESTIMADAS} horas estimadas en la planificación, es decir, un ${desviacion(totalEquipo)} de lo previsto. La diferencia la explican por completo los ajustes posteriores a la revisión del Sprint 4, que se trabajaron los días 22 y 23 de octubre, ya dentro de este sprint: suman 5.8 horas de equipo y la estimación no las contemplaba, por no corresponder a ninguna de las cuatro historias comprometidas. Descontadas esas horas, el sprint consumió 17 horas frente a las 17.75 previstas.`
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
      "El reparto del trabajo siguió las responsabilidades acordadas: Harry Méndez asumió la generación de los archivos de salida, la lectura y la validación del Excel, el servicio de importación con sus endpoints, las consultas del reporte y las pruebas automatizadas; Juan Gabriel Gualim, los controles de exportación, la pantalla de importación en dos pasos y la pantalla de reportes con su detalle por estudiante. Las sesiones en las que participaron ambos corresponden a la planificación del sprint y a la revisión final del código. El resumen por historia asigna cada sesión a la historia predominante en ella."
    ),
  ];

  return { bloques, harry, juan, totalEquipo, enHoras };
}

module.exports = { bloquesRegistroTiempos };
