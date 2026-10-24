// Genera Documentos/AEUVG - Planificacion Sprint 5.docx
// Uso: node scripts/docs/planificacion-sprint5.js
const { Packer } = require("docx");
const fs = require("fs");
const path = require("path");
const { p, bullet, h1, h2, makeTable, spacer, cover, buildDocument } = require("./template");

// Ficha de la historia: prioridad, puntos, horas y responsable.
const ficha = (prioridad, puntos, horas, responsable) =>
  makeTable(
    [2340, 2340, 2340, 2340],
    ["Prioridad", "Puntos de historia", "Horas estimadas", "Responsable principal"],
    [[prioridad, String(puntos), horas, responsable]]
  );

// Tabla de tareas de una historia.
const tareas = (filas) =>
  makeTable([1100, 5560, 1600, 1100], ["ID", "Tarea", "Responsable", "Horas"], filas);

const doc = buildDocument([
  ...cover({
    subtitle: "Planificación del Sprint 5",
    date: "Guatemala, 23 de octubre del 2026",
  }),

  h1("1. Introducción"),
  p(
    "El presente documento describe la planificación detallada del Sprint 5 del proyecto de la plataforma web de la Asociación General de Estudiantes de la Universidad del Valle de Guatemala (AEUVG). Complementa el documento de planificación general de sprints, en el cual se define la distribución del trabajo a lo largo de los seis sprints del proyecto."
  ),
  p(
    "El Sprint 5 completa el módulo de horas beca y abre el de oportunidades. Por un lado, permite que la información entre y salga de la plataforma: importar las hojas de cálculo con las que AEUVG lleva el control hoy, y exportar los registros en los formatos que la asociación necesita para rendir cuentas. Por otro, publica las convocatorias para realizar horas, de modo que el estudiantado pueda enterarse de dónde apoyar en lugar de preguntarlo."
  ),
  p(
    "En este documento se presentan el objetivo del sprint, su alcance, las historias de usuario comprometidas con sus criterios de aceptación y tareas, la distribución del trabajo por semana y los entregables esperados al finalizar el sprint."
  ),

  h1("2. Información general del sprint"),
  spacer(),
  makeTable(
    [3200, 6160],
    ["Campo", "Detalle"],
    [
      ["Proyecto", "Página web AEUVG"],
      ["Sprint", "Sprint 5 - Reportes y oportunidades para realizar horas"],
      ["Fecha de inicio", "Miércoles 21 de octubre de 2026"],
      ["Fecha de finalización", "Martes 3 de noviembre de 2026"],
      ["Duración", "2 semanas"],
      ["Equipo", "Harry Daniel Méndez Mendoza y Juan Gabriel Gualim Molina"],
      ["Historias de usuario", "6"],
      ["Tareas", "37"],
      ["Puntos de historia", "52"],
      ["Horas estimadas de equipo", "26.5 horas"],
      ["Revisión de sprint", "Martes 3 de noviembre de 2026"],
    ]
  ),
  spacer(),
  p(
    "La reunión de planificación se realizó el viernes 23 de octubre y no el primer día del sprint. Los días 22 y 23 se dedicaron a resolver las observaciones que dejó la revisión del Sprint 4 y a aplicar su migración en el ambiente de Railway, trabajo que se registra en este sprint por haberse realizado dentro de sus fechas aunque pertenezca al anterior. El sprint conserva su fecha de finalización."
  ),
  p(
    "La estimación de 26.5 horas de equipo corresponde únicamente a las seis historias de este sprint y es menor que las 30 del anterior por una razón concreta: las tablas de oportunidades, inscripciones e importaciones existen en el modelo de datos desde el Sprint 1, de modo que este sprint no necesita ninguna migración. El módulo reutiliza además los filtros, la tabla del panel, la protección de servicios por rol y los patrones de validación construidos en el Sprint 4."
  ),

  h1("3. Objetivo del sprint"),
  p(
    "Lograr que la información de horas beca entre y salga de la plataforma sin trabajo manual, y publicar las oportunidades para realizarlas. AEUVG debe poder cargar sus hojas de cálculo históricas con una validación previa que señale fila por fila lo que no cuadra, exportar los registros filtrados en Excel, PDF y CSV, y consultar un resumen general del programa. El estudiantado, por su parte, debe poder ver qué convocatorias hay abiertas, cuándo, dónde y cuánta gente se necesita."
  ),
  p(
    "Al finalizar el sprint, el control de horas beca que hoy vive en hojas de cálculo podrá trasladarse por completo a la plataforma, y AEUVG dejará de ser el único canal por el que el estudiantado se entera de dónde hacer horas."
  ),

  h1("4. Alcance del sprint"),
  h2("4.1. Trabajo incluido"),
  bullet(
    "Exportación de los registros de horas beca en CSV, Excel y PDF, aplicando los filtros seleccionados en el panel."
  ),
  bullet(
    "Importación de registros desde archivos de Excel, con una validación previa que no escribe nada y un reporte de errores fila por fila."
  ),
  bullet("Registro de cada importación con sus conteos de filas correctas y fallidas."),
  bullet(
    "Plantilla de Excel con el formato esperado y procedimiento documentado para migrar los registros históricos de AEUVG."
  ),
  bullet(
    "Pantalla de reportes con el resumen general del programa: totales por estado, desglose por mes y detalle por estudiante."
  ),
  bullet(
    "Administración de las oportunidades para realizar horas desde el panel: actividad, fecha, horario, lugar, cantidad de personas e información adicional."
  ),
  bullet("Estados de la oportunidad: borrador, publicada, cerrada y cancelada."),
  bullet(
    "Sección pública de oportunidades, con las convocatorias publicadas y su información completa."
  ),

  h2("4.2. Trabajo no incluido"),
  bullet(
    "La carga de los datos históricos reales de AEUVG: se entrega la plantilla y el procedimiento, y la carga la realiza la asociación con su propia información."
  ),
  bullet(
    "Inscripción del estudiantado a las oportunidades: en esta etapa las convocatorias se consultan y el apoyo se coordina con AEUVG por los medios de contacto publicados."
  ),
  bullet("Tutorías, tutores y postulaciones, correspondientes al Sprint 6."),
  bullet("Recomendaciones personalizadas y notificaciones, correspondientes al Sprint 6."),
  bullet("Fotografía de perfil del estudiante, trasladada al Sprint 6."),
  bullet(
    "Exportación de otros módulos: la del Sprint 5 cubre los registros de horas beca, que es la que AEUVG necesita para rendir cuentas."
  ),

  h1("5. Historias de usuario del Sprint 5"),
  p(
    "A continuación se presentan las 6 historias de usuario comprometidas para el Sprint 5, cada una con su descripción, criterios de aceptación y tareas correspondientes. En total, el sprint comprende 37 tareas. La numeración continúa la del Sprint 4."
  ),

  h2("5.1. HU-25 - Exportación de los registros de horas beca"),
  p(
    "Historia: Como administrador de AEUVG, quiero descargar los registros de horas beca en Excel, PDF o CSV respetando los filtros que tengo aplicados, para poder rendir cuentas y compartir la información sin copiarla a mano."
  ),
  spacer(),
  ficha("Alta", 8, "5 h", "Harry Méndez"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "La exportación incluye exactamente los registros que el panel está mostrando con los filtros aplicados, no todos los de la base."
  ),
  bullet(
    "Los tres formatos contienen las mismas columnas: carnet, estudiante, fecha, horario, actividad, horas, estado, fecha de acreditación y quién acreditó."
  ),
  bullet(
    "El archivo descargado lleva en su nombre la fecha en que se generó, para distinguir una descarga de otra."
  ),
  bullet(
    "El archivo CSV se abre correctamente en Excel con los acentos intactos, y los campos con comas o comillas no rompen las columnas."
  ),
  bullet("El PDF incluye el resumen de horas del periodo además del detalle de los registros."),
  bullet(
    "Una exportación demasiado grande se rechaza con una explicación en lugar de agotar la memoria del servidor."
  ),
  bullet("La exportación solo está disponible para el rol de administrador."),
  spacer(),
  tareas([
    [
      "T-25.1",
      "Implementar la consulta de exportación que respeta los filtros aplicados.",
      "Harry",
      "0.75",
    ],
    ["T-25.2", "Implementar la salida en CSV con su escape y su codificación.", "Harry", "0.75"],
    ["T-25.3", "Implementar la salida en Excel con sus columnas y anchos.", "Harry", "1"],
    ["T-25.4", "Implementar la salida en PDF con su resumen y su detalle.", "Harry", "1"],
    ["T-25.5", "Exponer el endpoint de exportación protegido por rol.", "Harry", "0.5"],
    [
      "T-25.6",
      "Agregar los controles de exportación al panel de horas beca.",
      "Juan Gabriel",
      "0.5",
    ],
    ["T-25.7", "Realizar pruebas de los tres formatos de exportación.", "Ambos", "0.5"],
  ]),

  h2("5.2. HU-26 - Importación de registros desde Excel"),
  p(
    "Historia: Como administrador de AEUVG, quiero cargar un archivo de Excel con los registros de horas y ver antes de guardar qué filas tienen problemas, para no tener que capturar cientos de registros a mano ni descubrir los errores después."
  ),
  spacer(),
  ficha("Alta", 13, "5.5 h", "Harry Méndez"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "El administrador sube un archivo de Excel y la plataforma le muestra, antes de guardar nada, cuántas filas son correctas y cuántas tienen problemas."
  ),
  bullet(
    "El reporte de errores indica el número de fila y qué campo está mal, de modo que se pueda corregir el archivo y volver a intentarlo."
  ),
  bullet(
    "La validación previa no escribe en la base: el administrador decide después si continúa o corrige el archivo."
  ),
  bullet(
    "Al confirmar, se guardan únicamente las filas correctas y queda constancia de la importación con sus conteos y el detalle de lo que falló."
  ),
  bullet(
    "Los registros importados se vinculan con las cuentas por carnet, con la misma regla del Sprint 4."
  ),
  bullet(
    "Un archivo que no sea de Excel, o que no tenga las columnas esperadas, se rechaza con un mensaje que explica qué se esperaba."
  ),
  bullet("La importación solo está disponible para el rol de administrador."),
  spacer(),
  tareas([
    [
      "T-26.1",
      "Implementar la lectura del archivo de Excel y el mapeo de sus columnas.",
      "Harry",
      "1",
    ],
    [
      "T-26.2",
      "Implementar la validación previa fila por fila con su reporte de errores.",
      "Harry",
      "1",
    ],
    [
      "T-26.3",
      "Implementar el servicio de importación con su registro de resultados.",
      "Harry",
      "1",
    ],
    ["T-26.4", "Exponer los endpoints de validación previa e importación.", "Harry", "0.5"],
    [
      "T-26.5",
      "Implementar la pantalla de importación en dos pasos, con su reporte.",
      "Juan Gabriel",
      "1.5",
    ],
    [
      "T-26.6",
      "Realizar pruebas de la lectura, la validación y el conteo de resultados.",
      "Ambos",
      "0.5",
    ],
  ]),

  h2("5.3. HU-27 - Plantilla y migración de los registros históricos"),
  p(
    "Historia: Como AEUVG, necesito saber exactamente con qué formato debo entregar mis hojas de cálculo y cómo se cargan, para poder trasladar a la plataforma los registros históricos que hoy administro por fuera."
  ),
  spacer(),
  ficha("Media", 5, "3 h", "Harry Méndez"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "Existe una plantilla de Excel descargable con las columnas que espera el importador y una fila de ejemplo."
  ),
  bullet("La plantilla se descarga desde la misma pantalla en la que se importa."),
  bullet(
    "Las columnas de la plantilla y las que lee el importador son las mismas, comprobado de forma automática."
  ),
  bullet(
    "El procedimiento de migración queda documentado: cómo preparar el archivo, cómo validarlo y qué hacer con las filas que fallan."
  ),
  bullet(
    "La información de prueba incluye una importación de ejemplo con filas correctas y filas fallidas."
  ),
  spacer(),
  tareas([
    ["T-27.1", "Generar la plantilla de Excel con el formato esperado.", "Harry", "0.75"],
    ["T-27.2", "Ofrecer la plantilla desde la pantalla de importación.", "Juan Gabriel", "0.5"],
    ["T-27.3", "Documentar el procedimiento de migración de los históricos.", "Harry", "0.5"],
    [
      "T-27.4",
      "Comprobar que la plantilla y el importador usen las mismas columnas.",
      "Harry",
      "0.5",
    ],
    ["T-27.5", "Ampliar los datos de prueba con una importación de ejemplo.", "Harry", "0.25"],
    ["T-27.6", "Realizar pruebas de la plantilla contra el importador.", "Ambos", "0.5"],
  ]),

  h2("5.4. HU-28 - Reportes y resumen general de horas"),
  p(
    "Historia: Como AEUVG, quiero una pantalla que me diga cómo va el programa de horas beca en conjunto, para poder informar a la universidad sin armar el resumen a mano cada vez que me lo piden."
  ),
  spacer(),
  ficha("Alta", 8, "4 h", "Juan Gabriel Gualim"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "La pantalla presenta el total de horas registradas, acreditadas y pendientes del programa completo."
  ),
  bullet("Presenta el desglose por mes, de modo que se vea en qué periodos se concentró el apoyo."),
  bullet(
    "Presenta el detalle por estudiante, con sus horas realizadas, acreditadas y pendientes, ordenado de mayor a menor."
  ),
  bullet(
    "Indica cuántos registros siguen sin cuenta vinculada, que es el dato que señala a quién le falta registrarse."
  ),
  bullet("El resumen puede acotarse a un periodo de fechas."),
  bullet("Desde la misma pantalla se pueden exportar los registros del periodo consultado."),
  bullet("La pantalla solo está disponible para el rol de administrador."),
  spacer(),
  tareas([
    ["T-28.1", "Implementar las consultas del resumen general del programa.", "Harry", "1"],
    ["T-28.2", "Implementar el desglose por mes y el detalle por estudiante.", "Harry", "0.75"],
    ["T-28.3", "Implementar la pantalla de reportes con sus indicadores.", "Juan Gabriel", "1.25"],
    [
      "T-28.4",
      "Presentar el detalle por estudiante y su acotación por periodo.",
      "Juan Gabriel",
      "0.75",
    ],
    ["T-28.5", "Enlazar la exportación desde la pantalla de reportes.", "Juan Gabriel", "0.25"],
    ["T-28.6", "Realizar pruebas de los cálculos del resumen general.", "Ambos", "0.25"],
  ]),

  h2("5.5. HU-29 - Administración de oportunidades para realizar horas"),
  p(
    "Historia: Como administrador de AEUVG, quiero publicar las convocatorias para realizar horas beca desde el panel, para que el estudiantado se entere de dónde apoyar sin que yo tenga que avisar uno por uno."
  ),
  spacer(),
  ficha("Alta", 13, "5 h", "Harry Méndez"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "El administrador puede crear y editar una oportunidad indicando actividad, descripción, fecha, horario, lugar, cantidad de personas e información adicional."
  ),
  bullet(
    "El sistema valida que la hora de fin sea posterior a la de inicio y que la cantidad de personas sea mayor que cero."
  ),
  bullet("Una oportunidad nace como borrador y solo se ve en el sitio cuando se publica."),
  bullet(
    "El administrador puede cerrarla cuando ya no admite más gente y cancelarla si no se va a realizar."
  ),
  bullet(
    "El listado del panel presenta las oportunidades con su fecha, su estado y su cupo, e incluye las que no están publicadas."
  ),
  bullet(
    "Una oportunidad que ya tiene horas registradas no se puede eliminar; se cancela para conservar el historial."
  ),
  bullet("Las operaciones solo están disponibles para el rol de administrador."),
  spacer(),
  tareas([
    ["T-29.1", "Implementar las consultas de oportunidades del panel.", "Harry", "0.75"],
    ["T-29.2", "Implementar el esquema de validación de la oportunidad.", "Harry", "0.75"],
    ["T-29.3", "Implementar el servicio y los endpoints protegidos por rol.", "Harry", "1.25"],
    [
      "T-29.4",
      "Implementar el listado de oportunidades del panel con sus acciones.",
      "Juan Gabriel",
      "1",
    ],
    ["T-29.5", "Implementar el formulario de la oportunidad.", "Juan Gabriel", "1"],
    ["T-29.6", "Realizar pruebas de las validaciones y de los permisos.", "Ambos", "0.25"],
  ]),

  h2("5.6. HU-30 - Consulta de oportunidades por el estudiantado"),
  p(
    "Historia: Como estudiante, quiero ver qué convocatorias hay abiertas para hacer horas beca, con su fecha, su horario y su lugar, para decidir a cuál presentarme sin tener que preguntarle a AEUVG."
  ),
  spacer(),
  ficha("Media", 5, "3.75 h", "Juan Gabriel Gualim"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "La sección presenta únicamente las oportunidades publicadas, de la más próxima a la más lejana."
  ),
  bullet(
    "Cada oportunidad muestra su actividad, su descripción, su fecha, su horario, su lugar, cuánta gente se necesita y la información adicional cuando la hay."
  ),
  bullet("Una oportunidad cuya fecha ya pasó deja de aparecer, sin que nadie tenga que retirarla."),
  bullet("Cuando no hay convocatorias abiertas, la pantalla lo explica en lugar de quedar vacía."),
  bullet("La sección es alcanzable desde la portada y desde la sección de horas beca del perfil."),
  bullet("La sección se visualiza correctamente en computadora, tableta y teléfono."),
  spacer(),
  tareas([
    ["T-30.1", "Implementar la consulta pública de oportunidades publicadas.", "Harry", "0.75"],
    ["T-30.2", "Implementar la página de oportunidades.", "Juan Gabriel", "1.5"],
    [
      "T-30.3",
      "Presentar el cupo y la información adicional de cada oportunidad.",
      "Juan Gabriel",
      "0.5",
    ],
    [
      "T-30.4",
      "Enlazar las oportunidades desde la portada y desde el perfil.",
      "Juan Gabriel",
      "0.5",
    ],
    [
      "T-30.5",
      "Verificar el sprint completo y actualizar la documentación técnica.",
      "Ambos",
      "0.25",
    ],
    ["T-30.6", "Realizar pruebas de la consulta pública de oportunidades.", "Ambos", "0.25"],
  ]),

  h1("6. Resumen del sprint"),
  h2("6.1. Resumen de historias"),
  spacer(),
  makeTable(
    [1100, 4860, 1100, 1100, 1200],
    ["ID", "Historia de usuario", "Tareas", "Puntos", "Horas"],
    [
      ["HU-25", "Exportación de los registros de horas beca", "7", "8", "5"],
      ["HU-26", "Importación de registros desde Excel", "6", "13", "5.5"],
      ["HU-27", "Plantilla y migración de los registros históricos", "6", "5", "3"],
      ["HU-28", "Reportes y resumen general de horas", "6", "8", "4.25"],
      ["HU-29", "Administración de oportunidades", "6", "13", "5"],
      ["HU-30", "Consulta de oportunidades por el estudiantado", "6", "5", "3.75"],
      ["", "Total", "37", "52", "26.5"],
    ]
  ),

  h2("6.2. Distribución del trabajo por integrante"),
  spacer(),
  makeTable(
    [3400, 2000, 2000, 1960],
    ["Integrante", "Tareas asignadas", "Horas estimadas", "Porcentaje"],
    [
      ["Harry Daniel Méndez Mendoza", "19", "14.75 h", "56%"],
      ["Juan Gabriel Gualim Molina", "11", "9.25 h", "35%"],
      ["Trabajo conjunto", "7", "2.5 h", "9%"],
      ["Total", "37", "26.5 h", "100%"],
    ]
  ),
  spacer(),
  p(
    "El reparto se inclina hacia Harry más que en sprints anteriores porque la mitad del sprint es trabajo que no tiene pantalla: leer y escribir archivos de Excel y de PDF, validar fila por fila y calcular los resúmenes. Juan Gabriel asume las cuatro pantallas nuevas, que son la importación en dos pasos, los reportes, la administración de oportunidades y la sección pública. El trabajo conjunto corresponde a las tareas de prueba de cada historia y a la verificación final."
  ),

  h2("6.3. Cronograma del sprint"),
  spacer(),
  makeTable(
    [1400, 1800, 3900, 2260],
    ["Semana", "Fechas", "Trabajo principal", "Hito"],
    [
      [
        "Semana 1",
        "21/10 - 27/10",
        "Cierre de los ajustes del Sprint 4 y su migración. Planificación. HU-25 y HU-26 completas.",
        "Los registros de horas beca entran y salen de la plataforma.",
      ],
      [
        "Semana 2",
        "28/10 - 03/11",
        "HU-27, HU-28, HU-29 y HU-30 completas.",
        "Reportes publicados y oportunidades visibles para el estudiantado.",
      ],
    ]
  ),

  h2("6.4. Carga de trabajo estimada"),
  p(
    "El Sprint 5 comprende 26.5 horas de trabajo de equipo para sus seis historias, equivalentes a unas 13 horas por integrante durante las dos semanas. A esa cifra hay que sumar el arrastre del Sprint 4: las observaciones de su revisión y la aplicación de su migración se resolvieron el 22 y el 23 de octubre, ya dentro de las fechas de este sprint, y se registran aquí aunque pertenezcan al anterior."
  ),
  p(
    "La carga propia del sprint es menor que las 30 horas del anterior porque el modelo de datos ya contempla las oportunidades, las inscripciones y las importaciones desde el Sprint 1: este sprint no necesita ninguna migración y reutiliza los filtros, la tabla del panel y la protección por rol construidos en el Sprint 4. En caso de que la carga académica no permita alcanzar las horas estimadas, la historia HU-30 es la de menor prioridad y su sección pública puede trasladarse al Sprint 6, dado que no condiciona la administración del programa."
  ),

  h1("7. Definición de terminado"),
  p(
    "Una historia de usuario del Sprint 5 se considerará terminada cuando cumpla con lo siguiente:"
  ),
  bullet("El código se encuentra integrado a la rama principal del repositorio."),
  bullet("La funcionalidad cumple con todos los criterios de aceptación definidos."),
  bullet("El código fue revisado por el otro integrante del equipo antes de su integración."),
  bullet("Las pruebas automatizadas del proyecto se ejecutan sin fallos."),
  bullet("La interfaz es funcional tanto en computadora como en dispositivos móviles."),
  bullet("Se validaron los permisos según el rol del usuario, cuando corresponda."),
  bullet(
    "La funcionalidad se encuentra desplegada y verificada en el ambiente de pruebas de Railway."
  ),
  bullet("No existen errores conocidos que impidan el uso de la funcionalidad."),

  h1("8. Entregables del sprint"),
  bullet("Exportación de los registros de horas beca en CSV, Excel y PDF, con sus filtros."),
  bullet("Importación desde Excel con validación previa y reporte de errores por fila."),
  bullet("Plantilla de Excel y procedimiento documentado de migración de los históricos."),
  bullet(
    "Pantalla de reportes con el resumen general, el desglose por mes y el detalle por estudiante."
  ),
  bullet("Administración de oportunidades para realizar horas, con sus estados."),
  bullet("Sección pública de oportunidades para el estudiantado."),
  bullet("Documento de desarrollo del Sprint 5 y registro de tiempos de ambos integrantes."),

  h1("9. Riesgos del sprint"),
  spacer(),
  makeTable(
    [3100, 3100, 3160],
    ["Riesgo", "Impacto", "Acción preventiva"],
    [
      [
        "Las hojas de cálculo de AEUVG no tienen un formato uniforme.",
        "La importación fallaría fila tras fila y el traslado de los históricos se detendría.",
        "Entregar una plantilla con el formato esperado y una validación previa que señale cada fila problemática sin escribir nada en la base.",
      ],
      [
        "AEUVG no entrega sus hojas históricas durante el sprint.",
        "La migración real quedaría sin hacer.",
        "Separar la capacidad del dato: el importador y la plantilla se entregan probados con información de prueba, y la carga real queda como procedimiento documentado.",
      ],
      [
        "Una exportación de miles de registros agota la memoria del servidor.",
        "El panel dejaría de responder justo cuando se necesita el reporte.",
        "Limitar la cantidad de registros por exportación y rechazar con una explicación la que exceda el límite.",
      ],
      [
        "Las librerías de Excel y PDF aumentan el tamaño de la imagen de Railway.",
        "Despliegues más lentos y mayor consumo dentro de un presupuesto ajustado.",
        "Usar una sola librería para leer y escribir Excel, y comprobar el tamaño de la imagen tras el primer despliegue.",
      ],
      [
        "Carga académica del equipo durante las dos semanas del sprint.",
        "No completar la totalidad de las historias comprometidas.",
        "Priorizar las historias HU-25 a HU-29 y trasladar la sección pública de la historia HU-30 al Sprint 6 de ser necesario.",
      ],
    ]
  ),
]);

const out = path.join(__dirname, "..", "..", "Documentos", "AEUVG - Planificacion Sprint 5.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("Documento generado:", out);
});
