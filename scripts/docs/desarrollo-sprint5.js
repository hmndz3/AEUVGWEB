// Genera Documentos/AEUVG - Desarrollo Sprint 5.docx
// Uso: node scripts/docs/desarrollo-sprint5.js
const { Packer } = require("docx");
const fs = require("fs");
const path = require("path");
const { p, bullet, h1, h2, makeTable, spacer, cover, buildDocument } = require("./template");
const { bloquesRegistroTiempos } = require("./tiempos-sprint5");

const tiempos = bloquesRegistroTiempos(8);
const doc = buildDocument([
  ...cover({
    subtitle: "Documento de Desarrollo del Sprint 5",
    date: "Guatemala, 3 de noviembre del 2026",
  }),

  // ---------- 1 ----------
  h1("1. Introducción"),
  p(
    "El presente documento registra el desarrollo del Sprint 5 - Importación, exportación y reportes de horas beca (21 de octubre al 3 de noviembre de 2026) del proyecto de la plataforma web de la Asociación General de Estudiantes de la Universidad del Valle de Guatemala (AEUVG). Complementa la planificación del Sprint 5, documentando por cada historia de usuario el trabajo realizado y las decisiones tomadas durante su implementación."
  ),
  p(
    "El Sprint 4 dejó el módulo de horas beca funcionando, pero con los registros capturándose uno por uno desde el panel. Este sprint completa el ciclo por los dos extremos: la entrada, con la importación de las hojas de cálculo con las que AEUVG lleva el control desde antes de que la plataforma existiera, y la salida, con la exportación de los registros y el reporte del programa completo."
  ),
  p(
    "Al cierre del sprint, AEUVG descarga los registros en tres formatos, carga sus históricos desde Excel con una revisión previa que no escribe nada y consulta cómo va el programa completo, por mes y por estudiante, sin armar el resumen a mano."
  ),
  p(
    "El sprint no requirió migración de base de datos. La tabla de importaciones existe desde el Sprint 1 y el carnet del registro se agregó en el Sprint 4, así que todo el incremento se apoya en el esquema ya desplegado. Es la primera vez en el proyecto que un sprint se publica sin tocar la estructura de la base."
  ),

  // ---------- 2. HU-25 ----------
  h1("2. HU-25 - Exportación de los registros de horas beca"),
  p(
    "AEUVG rinde cuentas del programa fuera de la plataforma: entrega cifras a la universidad y comparte periodos cerrados con quien los pide. La exportación es lo que permite hacerlo sin volver a capturar nada a mano."
  ),

  h2("2.1. Una sola conversión para tres formatos"),
  p(
    "El CSV, el Excel y el PDF salen de la misma conversión de registro a fila. No es una abstracción por gusto: si cada formato formateara por su cuenta, con el tiempo una columna acabaría distinta en un archivo y en otro, y la diferencia solo se notaría cuando alguien comparara dos descargas del mismo periodo."
  ),
  p(
    "Se exporta lo que el panel está mostrando, con los filtros que trae la dirección, y no la base completa. Los controles de descarga son enlaces corrientes y no botones con JavaScript: la descarga la resuelve el navegador con la respuesta del servidor, igual que cualquier otro archivo, y funciona aunque el guion de la página no haya cargado."
  ),

  h2("2.2. Lo que cada formato resuelve"),
  p(
    "El CSV se escribe con marca de orden de bytes y punto y coma como separador, que es lo que Excel en español abre sin preguntar nada; con coma, las columnas aparecerían todas en la primera celda. Los campos se escapan a mano y los saltos de línea son los de Windows, porque el archivo se abre casi siempre en Excel."
  ),
  p(
    "En el Excel las horas van como número y no como texto, con dos decimales de formato: AEUVG suma y filtra sobre el archivo descargado, y una columna de texto obligaría a convertirla a mano antes de poder usarla. El resumen del periodo va en su propia hoja, porque mezclarlo con el detalle impediría ordenar o filtrar la tabla sin arrastrarlo."
  ),
  p(
    "El PDF se genera apaisado, con los anchos de columna fijados y el encabezado repetido en cada página, para que un reporte de varias hojas siga leyéndose. Es el formato que se imprime o se adjunta sin que el destinatario pueda cambiar las cifras."
  ),

  h2("2.3. El límite de la descarga"),
  p(
    "El archivo se arma entero en memoria antes de enviarse, así que una exportación sin acotar con miles de registros tumbaría el servidor justo cuando AEUVG necesita el reporte. Por encima de cinco mil registros la descarga se rechaza con una explicación que dice cuántos abarca y pide acotar el periodo, en lugar de dejar la petición colgada."
  ),
  p(
    "Un formato que no se reconozca responde como no encontrado. No hay formato por omisión a propósito: descargar algo distinto de lo que se pidió confunde más que un error."
  ),

  // ---------- 3. HU-26 ----------
  h1("3. HU-26 - Importación de registros desde Excel"),
  p(
    "Es la historia que cierra el problema que originó el módulo. AEUVG tiene años de registros en hojas de cálculo y capturarlos uno por uno desde el panel no era una opción realista."
  ),

  h2("3.1. Dos pasos, no uno"),
  p(
    "La importación está partida en dos operaciones. La revisión lee el archivo y lo valida sin escribir nada, y devuelve cuántas filas están bien, cuántas no y qué le pasa a cada una. Solo después de ver ese reporte se confirma la carga."
  ),
  p(
    "La diferencia es la que hay entre descubrir los errores antes o después de haber guardado medio archivo. La revisión se puede repetir cuantas veces haga falta: se corrige el archivo, se vuelve a revisar y se importa cuando el reporte está limpio. El archivo no se guarda en el servidor entre los dos pasos; el navegador lo conserva y lo vuelve a enviar al confirmar, lo que evita tener que limpiar archivos a medio procesar."
  ),

  h2("3.2. Columnas por nombre y no por posición"),
  p(
    "Las columnas se localizan por su encabezado. AEUVG puede reordenarlas o traer columnas propias de más, y exigir un orden exacto convertiría cualquier hoja ligeramente distinta en un archivo ilegible. Lo único que no se admite es renombrar un encabezado, y en ese caso la respuesta dice cuáles faltan y cuáles se esperaban."
  ),
  p(
    "La lectura tolera las dos formas en que llega cada dato. Una fecha puede venir como fecha real de Excel o como texto en tres formatos distintos; una hora, como celda con formato de hora o escrita a mano sin el cero de delante. Las fechas reales se interpretan en UTC, que es como las guarda el archivo: convertirlas a la zona local correría el día. Las filas enteramente vacías —el relleno que deja Excel al final de la hoja— se descartan sin contarlas como error, porque llenarían el reporte de ruido."
  ),

  h2("3.3. Las mismas reglas que el formulario"),
  p(
    "La validación reutiliza el esquema del formulario del panel en lugar de repetir las reglas. Si mañana cambia el máximo de horas de un registro, cambia en los dos sitios a la vez. Lo único que agrega el importador es armar el horario a partir de las dos columnas de hora de la hoja, porque quien captura escribe la entrada y la salida por separado."
  ),
  p(
    "Una fila con varios problemas se reporta una sola vez, con el primero. El objetivo del reporte es que AEUVG sepa qué filas revisar, no abrumarla con cinco mensajes de la misma línea. El número de fila que se presenta es el que muestra Excel, de modo que se pueda corregir el mismo archivo y volver a cargarlo."
  ),

  h2("3.4. Constancia de cada carga"),
  p(
    "Cada importación queda registrada con el nombre del archivo, quién la hizo, sus conteos y el detalle de lo que falló. El estado distingue la que entró entera de la que entró a medias, que es lo que permite saber después si un archivo hay que volver a cargarlo. Los registros importados quedan apuntando a su importación."
  ),
  p(
    "Los carnets se consultan de una sola vez y no fila por fila: un histórico repite al mismo estudiante decenas de veces, y preguntar por fila convertiría la carga en cientos de viajes a la base. Una fila cuyo carnet ya tiene cuenta se guarda con el nombre verificado de la cuenta; una cuyo carnet no la tiene se guarda igual, sin vínculo, y lo recibe cuando esa persona se registre, por el mecanismo del Sprint 4."
  ),
  p(
    "El archivo admite hasta dos mil filas y cinco megabytes. Un histórico más grande se divide en varios archivos, que es además la forma de cargarlo que permite revisar cada parte antes de seguir."
  ),

  // ---------- 4. HU-27 ----------
  h1("4. HU-27 - Plantilla de carga y migración de los históricos"),

  h2("4.1. La plantilla se genera, no se guarda"),
  p(
    "La plantilla de Excel no es un archivo del proyecto: se genera en cada descarga a partir de la misma lista de columnas que usa el importador. Así no puede quedarse desalineada, que es exactamente lo que le pasa a una plantilla guardada en cuanto alguien agrega una columna al lector y olvida actualizar el archivo."
  ),
  p(
    "Lleva una sola fila de ejemplo, con datos evidentemente ficticios, cuyo único trabajo es mostrar el formato de la fecha y del horario. Una segunda hoja explica qué se escribe en cada columna, los límites del archivo y que hay que borrar la fila de ejemplo antes de cargarlo. Se descarga desde la propia pantalla de importación, que es donde se necesita."
  ),

  h2("4.2. Comprobar que las dos mitades sigan hablando"),
  p(
    "Compartir una constante no garantiza que el archivo que sale sea legible para el que entra. Se agregó una comprobación que genera la plantilla, se la pasa al lector y verifica ocho cosas: que la hoja de datos sea la primera, que sus encabezados sean los que el importador espera leídos del propio archivo y no de la constante, que no reporte columnas faltantes, que traiga una sola fila de ejemplo, que esa fila pase la validación tal como viene, que el horario se arme con las dos columnas de hora, que la cantidad de horas se interprete como número y que la hoja de instrucciones explique todas las columnas."
  ),
  p(
    "Es la comprobación que conviene correr después de tocar cualquiera de las dos mitades, y está disponible como una orden del proyecto."
  ),

  h2("4.3. El procedimiento documentado"),
  p(
    "La migración de los históricos quedó documentada como procedimiento y no como código: lo que hacía falta no era una herramienta más, sino saber en qué orden se hacen las cosas y qué revisar en cada paso. El documento explica qué valida el importador columna por columna, por qué el formato del carnet es más amplio que el del registro de cuentas, qué pasa con los carnets que todavía no tienen cuenta y qué revisar al terminar."
  ),
  p(
    "Recomienda además empezar con un archivo de veinte o treinta filas para ver cómo responde la validación antes de cargar años completos, y conservar los archivos originales fuera de la plataforma hasta haber comprobado los totales por estudiante: la constancia de la importación guarda el nombre del archivo y sus conteos, no su contenido."
  ),

  h2("4.4. Información de prueba"),
  p(
    "El conjunto de datos ficticios pasó de siete a nueve registros de horas y de una importación a dos. La que ya existía entró a medias; la nueva entró completa, con sus dos filas vinculadas a su importación, una acreditada y una pendiente. El detalle de errores de la importación parcial pasó a tener la misma forma que produce el importador real, de modo que la pantalla de importación y el reporte lean en pruebas lo que leerán en producción."
  ),

  // ---------- 5. HU-28 ----------
  h1("5. HU-28 - Reportes y resumen general de horas"),

  h2("5.1. Qué cuenta el resumen"),
  p(
    "La pantalla presenta las horas registradas, las acreditadas y las pendientes del programa completo, cuántos estudiantes lo recorrieron y a cuántos carnets les falta cuenta en la plataforma. Los estudiantes se cuentan por carnet distinto y no por registro: el dato que AEUVG informa es a cuánta gente alcanzó el programa, no cuántas veces se capturó una fila."
  ),
  p(
    "El reporte admite acotarse por periodo y nada más. Los filtros del listado —búsqueda, estado y vínculo— no entran a propósito: un resumen con el estado ya filtrado dejaría la columna de pendientes en cero y se leería como un dato en lugar de como un filtro. El periodo queda escrito en la dirección, así que el reporte de un semestre se puede guardar o compartir como un enlace."
  ),

  h2("5.2. Dónde se hace cada cálculo"),
  p(
    "La base suma y cuenta agrupando por día y por carnet, y el pliegue a meses y a estudiantes se hace en la aplicación, en un módulo separado de las consultas. La alternativa era truncar fechas en SQL, que habría obligado a escribir la consulta a mano y a repetir la traducción de los filtros; los días distintos de un periodo son unos cuantos cientos como máximo, muy lejos del volumen de registros que se evita traer."
  ),
  p(
    "Esa separación es además lo que permite probar el cálculo con grupos escritos a mano, sin base de datos. Es la parte donde un error pasaría inadvertido, porque un total equivocado se sigue leyendo como un total."
  ),
  p(
    "El detalle por estudiante se agrupa por carnet y no por nombre. Un mismo carnet puede traer el nombre escrito de dos maneras en hojas de distintos años, y agruparlo por nombre lo partiría en dos filas con la mitad de las horas cada una. Los nombres se resuelven después: el de la cuenta cuando existe, que es el verificado, y el del registro más reciente cuando el carnet todavía no tiene cuenta."
  ),

  h2("5.3. Lo que la pantalla deja hacer a continuación"),
  p(
    "El detalle se ordena de más horas a menos y presenta a los cien estudiantes con más horas; para el listado completo está la exportación, que es la herramienta hecha para eso y que se enlaza desde la misma pantalla arrastrando el periodo consultado. Cada fila enlaza al listado filtrado por ese carnet, que es lo que AEUVG hace cuando un total no cuadra: ir a ver los registros que lo componen."
  ),
  p(
    "El mes se calcula en UTC, por el mismo motivo que la fecha de la actividad: convertirlo a la zona del país mandaría al mes anterior los apoyos del primero de mes."
  ),

  // ---------- 6. HU-29 ----------
  h1("6. Pruebas y verificación"),
  p(
    "Las pruebas automatizadas del proyecto pasaron de 339 a 383. Las 44 nuevas corresponden a este sprint y se ejecutan sin base de datos, sustituyendo el acceso a datos por dobles de prueba, para que puedan correrse en cualquier momento del desarrollo."
  ),
  spacer(),
  makeTable(
    [3400, 1400, 4560],
    ["Área", "Pruebas", "Qué se verifica"],
    [
      [
        "Exportación en tres formatos",
        "12",
        "El escape y la codificación del CSV, que los tres formatos produzcan archivos válidos, el nombre del archivo con su fecha, el límite de registros y que un formato desconocido se rechace.",
      ],
      [
        "Lectura y validación del Excel",
        "13",
        "Las fechas y las horas en todas sus formas, las columnas localizadas por encabezado en cualquier orden, el archivo sin columnas obligatorias, las filas vacías descartadas, un archivo ilegible y que la revisión no escriba nada.",
      ],
      [
        "Plantilla contra el importador",
        "5",
        "Que la plantilla sea un Excel válido, que sus encabezados sean los que el importador espera, que se lea sin columnas faltantes, que su fila de ejemplo pase la validación y que la hoja de instrucciones explique todas las columnas.",
      ],
      [
        "Cálculos del reporte",
        "14",
        "La suma por mes y por estudiante, el mes calculado en UTC, el orden por horas con el carnet como desempate, el corte del detalle, la resolución de los nombres y que el reporte solo admita el periodo.",
      ],
    ]
  ),
  spacer(),
  p(
    "Además de las pruebas automatizadas se verificó que el proyecto compile sin errores de tipos, que el análisis estático no reporte problemas y que la compilación de producción se complete, incluyendo las cuatro rutas nuevas del sprint —la pantalla de importación y los tres servicios de exportación, importación y plantilla— y la pantalla de reportes, que dejó de ser un marcador para presentar el resumen del programa. Las pantallas se revisaron en anchos de teléfono, tableta y escritorio. Se comprobó también que todos los enlaces internos del sitio resuelvan a una ruta existente."
  ),
  p(
    "La comprobación de la plantilla contra el importador se ejecutó al cierre y sus ocho verificaciones pasaron. Por tratarse de un sprint sin migración, no hubo cambios que aplicar en el ambiente de Railway: el incremento se apoya en el esquema desplegado desde el Sprint 4."
  ),
  p(
    "Durante el sprint se corrigieron además dos defectos que no pertenecían a ninguna historia. El enlace a tutorías del menú principal apuntaba a una ruta que no existe —la sección se entrega en el Sprint 6— y devolvía un error de página no encontrada desde cualquier pantalla del sitio; se retiró del menú, con el mismo criterio con el que la tarjeta de la portada ya estaba sin enlace. El otro fue el enlace de descarga de la plantilla, que el análisis estático señalaba como navegación de la aplicación cuando es una descarga que resuelve el servidor."
  ),

  // ---------- 9 ----------
  h1("7. Estado del sprint"),
  p(
    `Las cuatro historias comprometidas para el Sprint 5 se encuentran completadas, con ${tiempos.enHoras(tiempos.totalEquipo)} horas de trabajo de equipo frente a las 17.75 estimadas. El detalle por sesión se encuentra en la sección 8. La plataforma cuenta ahora con:`
  ),
  bullet(
    "La exportación de los registros de horas beca en CSV, Excel y PDF, con los filtros del panel y su resumen del periodo."
  ),
  bullet(
    "La importación desde Excel en dos pasos, con la revisión previa que no escribe nada y el reporte de las filas con problemas."
  ),
  bullet(
    "La plantilla de carga generada a partir de las columnas del importador y el procedimiento de migración de los históricos documentado."
  ),
  bullet(
    "La pantalla de reportes, con el resumen del programa, el desglose por mes y el detalle por estudiante, acotables por periodo."
  ),
  p(
    "Queda pendiente la carga efectiva de los históricos de AEUVG, que no es trabajo de desarrollo: el importador quedó listo y documentado, y la carga la realiza AEUVG con sus propias hojas cuando decida hacerlo. Continúa también en gestión el trámite del dominio institucional iniciado en el Sprint 1."
  ),
  p(
    "Los ajustes posteriores a la revisión del Sprint 4 se trabajaron los días 22 y 23 de octubre, ya dentro de la ventana de este sprint, y por eso aparecen en su registro de tiempos: el rótulo del carrusel de la portada, el retiro de la sección de próximos eventos, el acceso único a las horas beca, el selector de horario con dos relojes, el buscador de estudiantes por carnet, el teléfono de contacto de las organizaciones con las siglas obligatorias y la marca de los campos obligatorios. Suman 5.8 horas de equipo y explican por completo la diferencia frente a la estimación, que solo contemplaba las cuatro historias comprometidas: descontadas, el sprint consumió 17 horas frente a las 17.75 previstas."
  ),
  p(
    "El desarrollo continúa en el Sprint 6 con el módulo de tutorías —el directorio de tutores, las postulaciones y los horarios— y las fotografías de perfil. Se le suman las tres mejoras que AEUVG pidió al revisar este incremento: el registro de las mismas horas para varios estudiantes a la vez, la lectura del archivo de horas con los encabezados que la asociación ya usa y la facultad del estudiante visible y filtrable en el panel."
  ),

  // ---------- 10. Registro de tiempos ----------
  ...tiempos.bloques,
]);

const out = path.join(__dirname, "..", "..", "Documentos", "AEUVG - Desarrollo Sprint 5.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("Documento generado:", out);
});
