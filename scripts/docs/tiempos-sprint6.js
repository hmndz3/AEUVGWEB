// Registro de tiempos del Sprint 6.
//
// Se mantiene como módulo y no como documento aparte: los bloques que exporta
// se insertan al final del documento de desarrollo del sprint. Los deltas, los
// totales y el resumen por historia se calculan aquí a partir de las sesiones,
// para que las sumas no dependan de una cuenta hecha a mano.
const { p, h1, h2, makeTable, spacer } = require("./template");

// Este sprint duró tres semanas y media y el trabajo no se repartió parejo: la
// semana de en medio fue casi toda de Harry, con el panel de cuentas y las
// notificaciones, que son trabajo sin pantalla. El margen admite ese tramo sin
// sesiones de Juan Gabriel, que es real y no un error de captura.
const MAXIMO_DIAS_SIN_TRABAJAR = 5;

// fecha, inicio, fin, interrupción (minutos), categoría, fase, comentario
const HARRY = {
  nombre: "Harry Daniel Méndez Mendoza",
  carne: "24089",
  sesiones: [
    [
      "2026-11-04",
      "09:20",
      "10:10",
      5,
      "Ajustes del Sprint 5",
      "Codificación",
      "AEUVG-232 Retiro de las convocatorias para realizar horas del panel y del sitio: servicio, endpoints, pantallas y enlaces. Las tablas quedan en la base, vacías y sin uso.",
    ],
    [
      "2026-11-04",
      "15:10",
      "16:10",
      10,
      "Ajustes del Sprint 5",
      "Codificación",
      "AEUVG-233 Registro de la misma actividad para varios carnets a la vez, con la separación de la lista pegada y la resolución del nombre desde la cuenta.",
    ],
    [
      "2026-11-04",
      "20:00",
      "20:25",
      0,
      "Ajustes del Sprint 5",
      "Pruebas",
      "AEUVG-235 Pruebas de la separación de carnets y del registro en lote.",
    ],
    [
      "2026-11-05",
      "09:40",
      "10:40",
      10,
      "Ajustes del Sprint 5",
      "Codificación",
      "AEUVG-236 Lectura de la hoja de horas beca con los encabezados y el formato de horario que AEUVG ya usa. AEUVG-237 Pruebas de la lectura de la hoja real.",
    ],
    [
      "2026-11-05",
      "16:00",
      "16:30",
      5,
      "Ajustes del Sprint 5",
      "Pruebas",
      "AEUVG-239 Pruebas del filtro de facultad y de su combinación con los demás filtros del panel.",
    ],
    [
      "2026-11-05",
      "20:30",
      "21:10",
      5,
      "Documentación",
      "Documentación",
      "Rehechos los documentos del Sprint 5 con sus cuatro historias y sus horas, tras el retiro de las convocatorias.",
    ],
    [
      "2026-11-07",
      "09:30",
      "10:25",
      5,
      "HU-31",
      "Diseño y codificación",
      "AEUVG-242 Formatos, horas de reloj y esquemas de validación del módulo de tutorías.",
    ],
    [
      "2026-11-07",
      "14:30",
      "15:45",
      10,
      "HU-31",
      "Codificación",
      "AEUVG-243 Consultas de cursos, postulaciones y tutores. Columna de la fotografía de perfil y su migración.",
    ],
    [
      "2026-11-08",
      "10:00",
      "11:10",
      10,
      "HU-31",
      "Codificación",
      "AEUVG-244 Servicio de postulaciones con su revisión, endpoints y subida de imágenes del estudiante.",
    ],
    [
      "2026-11-09",
      "17:30",
      "18:30",
      10,
      "HU-31",
      "Pruebas",
      "AEUVG-247 Pruebas de la postulación, de su revisión y de los permisos. Integración de HU-31 a develop.",
    ],
    [
      "2026-11-10",
      "09:30",
      "10:30",
      10,
      "HU-32",
      "Codificación",
      "AEUVG-248 Ficha pública del tutor y sus franjas de disponibilidad, con la regla de que no se encimen.",
    ],
    [
      "2026-11-11",
      "10:20",
      "11:35",
      10,
      "HU-32",
      "Codificación",
      "AEUVG-250 Agenda de tutorías: franja que cubre el horario, modalidad compatible, traslapes y endpoints.",
    ],
    [
      "2026-11-13",
      "10:00",
      "11:15",
      10,
      "HU-32",
      "Pruebas",
      "AEUVG-253 Pruebas de la agenda, de los horarios y de la disponibilidad. Integración de HU-32 a develop.",
    ],
    [
      "2026-11-13",
      "11:55",
      "12:15",
      0,
      "Revisión y cierre",
      "Codificación",
      "AEUVG-254 Verificador del módulo contra la base. Aplicación de la migración de la fotografía en Railway.",
    ],
    [
      "2026-11-14",
      "09:40",
      "11:20",
      15,
      "HU-33",
      "Codificación y pruebas",
      "AEUVG-255 Panel de cuentas con sus filtros, su resumen y el cambio de estado. Integración de HU-33.",
    ],
    [
      "2026-11-16",
      "10:20",
      "12:15",
      15,
      "HU-34",
      "Codificación y pruebas",
      "AEUVG-256 Notificaciones y su enlace con las tutorías y la acreditación de horas. Integración de HU-34.",
    ],
    [
      "2026-11-17",
      "16:10",
      "17:05",
      5,
      "HU-35",
      "Pruebas",
      "AEUVG-258 Pruebas de la validación de la fotografía y de sus permisos. Integración de HU-35 a develop.",
    ],
    [
      "2026-11-18",
      "11:00",
      "11:25",
      5,
      "HU-36",
      "Integración",
      "Revisión del calendario del panel e integración de HU-36 a develop.",
    ],
    [
      "2026-11-19",
      "16:20",
      "16:45",
      5,
      "HU-37",
      "Integración",
      "Revisión de las recomendaciones del perfil e integración de HU-37 a develop.",
    ],
    [
      "2026-11-20",
      "09:40",
      "10:40",
      10,
      "Documentación",
      "Documentación",
      "AEUVG-261 Documentación técnica de las tutorías, las notificaciones y la fotografía de perfil.",
    ],
    [
      "2026-11-22",
      "09:30",
      "11:00",
      10,
      "Documentación",
      "Documentación",
      "Redacción del documento de desarrollo del Sprint 6.",
    ],
    [
      "2026-11-23",
      "10:00",
      "11:15",
      5,
      "Revisión y cierre",
      "Revisión",
      "Revisión conjunta del código del sprint con Juan Gabriel y verificación del incremento completo.",
    ],
    [
      "2026-11-24",
      "09:30",
      "10:30",
      10,
      "Documentación",
      "Documentación",
      "Registro de tiempos del equipo, revisión de los documentos y publicación del primer tramo del sprint.",
    ],
    [
      "2026-11-24",
      "15:00",
      "16:10",
      10,
      "HU-38",
      "Codificación",
      "Catálogo de cursos administrable con la opción de proponer otro curso desde la postulación, y separación de las postulaciones y los tutores en el panel.",
    ],
    [
      "2026-11-24",
      "20:00",
      "20:50",
      5,
      "HU-38",
      "Codificación",
      "Actividad de las horas beca vinculada a los eventos y notificación marcada como leída al abrirla.",
    ],
    [
      "2026-11-25",
      "09:15",
      "10:05",
      10,
      "HU-39",
      "Codificación",
      "Envío de los correos con Brevo y registro del motivo de cada fallo, para dejar de perder los avisos sin saber por qué.",
    ],
    [
      "2026-11-25",
      "11:30",
      "12:25",
      5,
      "HU-39",
      "Codificación",
      "Confirmación del correo con un botón, para que los filtros de correo que abren los enlaces dejen de activar cuentas solas.",
    ],
    [
      "2026-11-25",
      "16:00",
      "16:55",
      10,
      "HU-39",
      "Codificación",
      "Página Sobre AEUVG y su junta directiva administrables desde el panel, con la subida de los retratos.",
    ],
    [
      "2026-11-25",
      "21:00",
      "21:55",
      5,
      "HU-38",
      "Codificación",
      "Filtrado de eventos al escribir en la actividad de las horas beca, para no obligar a recordar el nombre exacto.",
    ],
    [
      "2026-11-26",
      "08:45",
      "10:20",
      15,
      "HU-41",
      "Codificación",
      "Importación de eventos desde Excel: plantilla con los catálogos, validación de las fechas pasadas y de los repetidos, y descarga de la imagen por enlace de Drive o OneDrive con su comprobación de formato.",
    ],
    [
      "2026-11-26",
      "11:30",
      "12:30",
      10,
      "HU-41",
      "Codificación",
      "Importación de asociaciones y clubes desde Excel con sus redes sociales, sobre la misma capa de lectura y reporte.",
    ],
    [
      "2026-11-26",
      "14:00",
      "16:10",
      20,
      "HU-42",
      "Codificación",
      "Módulo de préstamo de batas: inventario por tipo y talla, préstamos con su devolución, lista negra, turnos del salón y comprobantes de horas. Migración aplicada en Railway y verificada contra la base.",
    ],
    [
      "2026-11-26",
      "18:00",
      "19:10",
      10,
      "HU-42",
      "Codificación",
      "Postulación al voluntariado con tope de dos personas por turno y asignación desde el panel, con sus pruebas.",
    ],
    [
      "2026-11-26",
      "20:00",
      "20:30",
      0,
      "HU-41",
      "Codificación",
      "Importación del catálogo de cursos de tutorías desde Excel, sobre la misma capa de lectura y reporte que los eventos.",
    ],
    [
      "2026-11-26",
      "20:45",
      "21:30",
      5,
      "HU-43",
      "Codificación",
      "Reporte de eventos en el panel, con filtros por periodo, organizador, categoría, tipo y estado, el filtro propio de AEUVG y la descarga en Excel y CSV.",
    ],
    [
      "2026-11-26",
      "22:00",
      "23:00",
      10,
      "HU-44",
      "Codificación",
      "Doble validación de tutorías: el tutor acepta o rechaza, sube la prueba del inicio y la del final, el estudiante confirma con una foto y AEUVG revisa las horas, que entran al módulo de horas beca.",
    ],
    [
      "2026-11-27",
      "09:00",
      "10:00",
      10,
      "Seguridad",
      "Codificación",
      "Revisión del proyecto contra el OWASP Top 10 y actualización de las dependencias con avisos, incluida la crítica del marco.",
    ],
    [
      "2026-11-27",
      "10:40",
      "11:50",
      10,
      "Seguridad",
      "Codificación",
      "Cabeceras de seguridad en toda respuesta y política de contenidos con número de un solo uso, migrando el middleware al nuevo nombre del marco.",
    ],
    [
      "2026-11-27",
      "14:00",
      "15:10",
      10,
      "Seguridad",
      "Codificación",
      "Tope de intentos en todo el acceso, comprobación del origen en las peticiones que escriben y validación del contenido real de las imágenes que se suben.",
    ],
    [
      "2026-11-27",
      "16:00",
      "17:00",
      10,
      "Seguridad",
      "Codificación",
      "Registro de los hechos de seguridad y endurecimiento del hash de contraseñas, con el reemplazo de los hashes viejos al entrar.",
    ],
    [
      "2026-11-27",
      "18:00",
      "18:55",
      5,
      "Documentación",
      "Documentación",
      "Documento de seguridad de la plataforma, registro de tiempos del sprint y revisión final de los documentos.",
    ],
  ],
};

const JUAN = {
  nombre: "Juan Gabriel Gualim Molina",
  carne: "24852",
  sesiones: [
    [
      "2026-11-04",
      "16:40",
      "17:40",
      5,
      "Ajustes del Sprint 5",
      "Diseño y codificación",
      "AEUVG-234 Pantalla de registro de horas para varios estudiantes, con la lista de carnets y su resumen antes de guardar.",
    ],
    [
      "2026-11-05",
      "11:15",
      "12:15",
      5,
      "Ajustes del Sprint 5",
      "Diseño y codificación",
      "AEUVG-238 Facultad del estudiante en la tabla del panel, en el filtro y en la exportación.",
    ],
    [
      "2026-11-06",
      "09:40",
      "10:35",
      5,
      "Ajustes del Sprint 5",
      "Diseño y codificación",
      "AEUVG-240 Panel ensanchado y tabla de horas compactada para que quepa en pantalla sin desplazarla.",
    ],
    [
      "2026-11-06",
      "15:30",
      "16:45",
      5,
      "Ajustes del Sprint 5",
      "Diseño y codificación",
      "AEUVG-241 Estudiantes como burbujas en el formulario de horas y retiro de la pantalla aparte.",
    ],
    [
      "2026-11-08",
      "16:00",
      "17:30",
      10,
      "HU-31",
      "Diseño y codificación",
      "AEUVG-245 Pantalla de postulación a tutor, con sus cursos, sus notas y sus comprobantes.",
    ],
    [
      "2026-11-09",
      "13:30",
      "15:15",
      10,
      "HU-31",
      "Diseño y codificación",
      "AEUVG-246 Panel de tutorías con las postulaciones, su revisión y el listado de tutores.",
    ],
    [
      "2026-11-10",
      "15:00",
      "16:30",
      10,
      "HU-32",
      "Diseño y codificación",
      "AEUVG-249 Directorio público de tutores, con su filtro por curso y sus enlaces desde el menú y la portada.",
    ],
    [
      "2026-11-11",
      "16:00",
      "17:40",
      10,
      "HU-32",
      "Diseño y codificación",
      "AEUVG-251 Ficha del tutor y formulario para agendar, con la franja como punto de partida.",
    ],
    [
      "2026-11-12",
      "15:10",
      "16:55",
      10,
      "HU-32",
      "Diseño y codificación",
      "AEUVG-252 Panel del tutor con sus horarios y sus tutorías, y la sección de tutorías del perfil.",
    ],
    [
      "2026-11-17",
      "14:30",
      "16:00",
      10,
      "HU-35",
      "Diseño y codificación",
      "AEUVG-257 Fotografía de perfil, con el avatar unificado del sitio y su aviso de dónde se ve.",
    ],
    [
      "2026-11-18",
      "10:15",
      "11:15",
      5,
      "HU-36",
      "Diseño y codificación",
      "AEUVG-259 Calendario del panel, con los borradores y los cancelados que el público no ve.",
    ],
    [
      "2026-11-19",
      "15:20",
      "16:50",
      10,
      "HU-37",
      "Diseño y codificación",
      "AEUVG-260 Intereses del estudiante y recomendaciones del perfil.",
    ],
    [
      "2026-11-20",
      "11:15",
      "12:15",
      5,
      "Revisión y cierre",
      "Codificación",
      "AEUVG-262 Retiro del marcador de secciones pendientes y actualización de la barra del panel.",
    ],
    [
      "2026-11-23",
      "10:00",
      "11:35",
      5,
      "Revisión y cierre",
      "Revisión",
      "Revisión conjunta del código del sprint con Harry y verificación en teléfono, tableta y escritorio.",
    ],
    [
      "2026-11-24",
      "16:00",
      "17:15",
      10,
      "HU-38",
      "Diseño y codificación",
      "Filtros de tutores en el panel y edición de los datos del perfil desde la tarjeta de la cuenta.",
    ],
    [
      "2026-11-25",
      "09:30",
      "11:00",
      15,
      "HU-40",
      "Diseño y codificación",
      "Modo oscuro elegible desde el perfil, con los colores de contraste que no cambian con el tema para el pie, la barra del panel y las fichas de eventos.",
    ],
    [
      "2026-11-25",
      "14:00",
      "15:30",
      10,
      "HU-40",
      "Diseño y codificación",
      "Selectores propios de fecha y hora en lugar de los del navegador, con su entrada en el catálogo del sistema de diseño.",
    ],
    [
      "2026-11-25",
      "19:00",
      "20:15",
      10,
      "HU-40",
      "Diseño y codificación",
      "Secciones del resumen del panel convertidas en accesos directos, botón de editar en los listados de asociaciones y clubes, y ficha de la tutoría rehecha con las solicitadas aparte.",
    ],
    [
      "2026-11-26",
      "09:00",
      "10:35",
      10,
      "HU-41",
      "Diseño y codificación",
      "Pantallas de importación en dos pasos para eventos, asociaciones y clubes, con sus contadores, su reporte de filas y los botones en los listados.",
    ],
    [
      "2026-11-26",
      "11:00",
      "12:25",
      10,
      "HU-45",
      "Diseño y codificación",
      "Rediseño de la sección Explora con iconos y dos columnas en teléfono, calendario del mes visible en teléfono y portada de Sobre AEUVG con los colores del sitio.",
    ],
    [
      "2026-11-26",
      "15:00",
      "16:20",
      10,
      "HU-42",
      "Diseño y codificación",
      "Panel del voluntario y página pública del salón: disponibilidad por tipo y talla, registro del préstamo, lista negra y envío del comprobante.",
    ],
    [
      "2026-11-26",
      "19:30",
      "20:40",
      10,
      "HU-42",
      "Diseño y codificación",
      "Turnos del salón presentados como horario semanal por bloques en la página pública, la postulación y el panel.",
    ],
    [
      "2026-11-26",
      "21:30",
      "22:35",
      5,
      "HU-45",
      "Diseño y codificación",
      "Horario del sábado separado del de entre semana y reloj de 24 horas en toda la plataforma, incluidos los selectores.",
    ],
    [
      "2026-11-27",
      "10:00",
      "11:25",
      10,
      "HU-42",
      "Diseño y codificación",
      "Fotos de entrada y salida al cerrar el turno, con el historial de la jornada del voluntario y el retiro del formulario una vez cerrado.",
    ],
    [
      "2026-11-27",
      "18:00",
      "19:05",
      5,
      "Revisión y cierre",
      "Revisión",
      "Revisión conjunta final con Harry, verificación del sitio publicado en teléfono y escritorio, y cierre de los documentos del sprint.",
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
  "HU-38",
  "HU-39",
  "HU-40",
  "HU-41",
  "HU-42",
  "HU-43",
  "HU-44",
  "HU-45",
  "Seguridad",
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
  "HU-38": "HU-38 - Catálogo de cursos y ajustes del módulo de tutorías",
  "HU-39": "HU-39 - Página institucional administrable y envío de correos",
  "HU-40": "HU-40 - Modo oscuro y selectores propios de fecha y hora",
  "HU-41": "HU-41 - Carga masiva desde Excel",
  "HU-42": "HU-42 - Préstamo de batas y voluntariado del salón",
  "HU-43": "HU-43 - Reporte de eventos",
  "HU-44": "HU-44 - Doble validación de las tutorías y sus horas beca",
  "HU-45": "HU-45 - Ajustes de presentación del sitio",
  Seguridad: "Endurecimiento de seguridad (OWASP Top 10)",
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
      "Esta sección registra el tiempo dedicado por cada integrante al Sprint 6, entre el 4 y el 27 de noviembre de 2026. Cada sesión indica la fecha, la hora de inicio y de finalización, el tiempo de interrupción, el tiempo neto trabajado, la fase de la actividad y una descripción del trabajo realizado."
    ),
    p(
      "El delta de tiempo corresponde a la hora de finalización menos la hora de inicio menos el tiempo de interrupción. Las interrupciones son pausas cortas dentro de una misma sesión. Las sesiones de revisión conjunta aparecen en ambos registros con el mismo horario, por tratarse de trabajo realizado en conjunto."
    ),
    p(
      `El sprint sumó ${enHoras(totalEquipo)} horas de equipo: ${enHoras(harry.total)} horas de Harry Méndez y ${enHoras(juan.total)} horas de Juan Gabriel Gualim. Es, con diferencia, el sprint más largo del proyecto, y por dos razones. La primera es su duración: tres semanas y media frente a las dos de los anteriores. La segunda es su alcance: a diferencia de los demás, este sprint no tuvo documento de planificación ni estimación previa, porque se acordó cerrar en un solo tramo todo lo que faltaba del producto, y el alcance se fue fijando historia por historia sobre el modelo de datos que el Sprint 1 ya había dejado completo. Las últimas tres jornadas, del 25 al 27 de noviembre, concentran la carga masiva desde Excel, el módulo de préstamo de batas, el reporte de eventos, la doble validación de las tutorías y el endurecimiento de seguridad: 26.3 horas de equipo en tres días.`
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
      "El reparto siguió las responsabilidades de siempre: Harry Méndez asumió las consultas, los servicios con sus reglas, los endpoints, las migraciones y las pruebas automatizadas; Juan Gabriel Gualim, las pantallas. La diferencia entre los dos registros es mayor que en sprints anteriores por el tipo de trabajo que trajo este tramo final: el panel de cuentas, las notificaciones, la carga masiva desde Excel y el endurecimiento de seguridad son casi todo trabajo sin pantalla. Las sesiones compartidas corresponden a las dos revisiones conjuntas del código. El resumen por historia asigna cada sesión a la historia predominante en ella."
    ),
  ];

  return { bloques, harry, juan, totalEquipo, enHoras };
}

module.exports = { bloquesRegistroTiempos };
