// Genera Documentos/AEUVG - Desarrollo Sprint 4.docx
// Uso: node scripts/docs/desarrollo-sprint4.js
const { Packer } = require("docx");
const fs = require("fs");
const path = require("path");
const { p, bullet, h1, h2, makeTable, spacer, cover, buildDocument } = require("./template");
const { bloquesRegistroTiempos } = require("./tiempos-sprint4");

const tiempos = bloquesRegistroTiempos(10);
const doc = buildDocument([
  ...cover({
    subtitle: "Documento de Desarrollo del Sprint 4",
    date: "Guatemala, 21 de octubre del 2026",
  }),

  // ---------- 1 ----------
  h1("1. Introducción"),
  p(
    "El presente documento registra el desarrollo del Sprint 4 - Gestión de horas beca (7 al 20 de octubre de 2026) del proyecto de la plataforma web de la Asociación General de Estudiantes de la Universidad del Valle de Guatemala (AEUVG). Complementa la planificación del Sprint 4, documentando por cada historia de usuario el trabajo realizado y las decisiones tomadas durante su implementación."
  ),
  p(
    "El Sprint 4 sustituye el control de horas beca que AEUVG llevaba en hojas de cálculo. Es el primer módulo del proyecto cuya información no nace en la plataforma: los registros existen desde antes, pertenecen a estudiantes que pueden no tener cuenta todavía y los administra AEUVG como responsable del programa. Esa condición es la que define el diseño del módulo y se explica en la sección 2."
  ),
  p(
    "Al cierre del sprint, AEUVG registra, corrige, busca, filtra y acredita las horas desde el panel administrativo, y cada estudiante consulta desde su perfil cuántas horas tiene realizadas, acreditadas y pendientes, junto con el historial de las actividades en las que apoyó."
  ),

  // ---------- 2. HU-19 ----------
  h1("2. HU-19 - Servicios de consulta y registro de horas beca"),
  p(
    "Las tablas de horas beca existían desde el Sprint 1, pero diseñadas para una información que naciera en la plataforma. Esta historia las adaptó a la realidad del programa y construyó la capa de consulta y de escritura sobre la que se apoyan el panel y el perfil."
  ),

  h2("2.1. El carnet como identificador del registro"),
  p(
    "Es la decisión que condiciona todo el módulo. Hasta este sprint, un registro de horas exigía un estudiante de la tabla de estudiantes, y buena parte de los carnets de las hojas de AEUVG no tiene cuenta ni ficha en la plataforma: no había forma de guardar esas filas, que son justamente las que el módulo viene a sustituir."
  ),
  p(
    "La migración del sprint dejó el carnet como dato obligatorio del registro y el vínculo con el estudiante como opcional. Se agregó también el nombre del estudiante al propio registro, porque un carnet sin cuenta no tiene de dónde tomarlo. La migración carga el carnet y el nombre de los registros ya existentes a partir del estudiante al que apuntaban, de modo que ninguna fila pierda información."
  ),
  p(
    "La alternativa era crear una ficha de estudiante al registrar las horas, pero habría obligado a inventar la carrera y el correo institucional de alguien que no se ha registrado, y esos datos identifican la cuenta. El vínculo opcional deja el registro completo con lo que AEUVG realmente sabe: un carnet, un nombre y unas horas."
  ),

  h2("2.2. Búsqueda compartida"),
  p(
    "Se agregó la columna de texto de búsqueda del registro, con el mismo criterio de los eventos y de las organizaciones: una copia en minúsculas y sin acentos que el servicio recalcula en cada guardado. Reúne el carnet, el nombre del estudiante y la descripción de la actividad, porque el panel tiene que encontrar un registro tanto por quién realizó las horas como por en qué apoyó."
  ),
  p(
    "En la misma migración se crearon los índices sobre el carnet, sobre carnet y estado, y sobre estado y fecha de actividad, que son las tres formas en que el panel consulta los registros. La carga inicial de la columna replica en SQL la misma normalización de la aplicación, con el juego de caracteres alineado que dejó la corrección del Sprint 3."
  ),

  h2("2.3. Servicio y validaciones"),
  p(
    "El servicio sigue la misma separación entre servicio y repositorio que el resto del proyecto, de modo que las reglas puedan probarse sin base de datos. Comprueba los campos obligatorios, la fecha de la actividad y que la cantidad de horas sea mayor que cero y no exceda las de un día: más de veinticuatro horas en un registro no es un apoyo, es un error de captura."
  ),
  p(
    "Las comprobaciones se repiten en el servicio aunque el esquema del endpoint ya haya validado el cuerpo. No es duplicación por descuido: el esquema protege la petición y el servicio protege la regla, que debe valer también para la importación de archivos del Sprint 5, que no pasa por ningún formulario."
  ),
  p(
    "Las horas se guardan en una columna decimal con dos decimales y el esquema rechaza más precisión que esa. Un 1.333 se redondearía en silencio y descuadraría el total del estudiante frente a lo que suma el panel."
  ),

  h2("2.4. Información de prueba"),
  p(
    "El conjunto de datos ficticios pasó de cuatro a siete registros de horas: pendientes y acreditados, manuales y provenientes de una importación, con cuenta vinculada y sin ella, repartidos entre dos carnets que no tienen ficha de estudiante. Con ellos se revisan sin información real el filtro de registros sin vincular, el resumen por estado y la presentación del nombre cargado frente al de la cuenta."
  ),

  // ---------- 3. HU-20 ----------
  h1("3. HU-20 - Panel administrativo de horas beca"),

  h2("3.1. Una tabla, no un listado de tarjetas"),
  p(
    "La sección del panel presenta todas las columnas de la hoja de cálculo que sustituye: carnet, estudiante, fecha, horario, actividad, horas y estado. Quien la usa compara filas entre sí, así que esconder columnas detrás de un detalle la haría inservible. En teléfono la tabla se desplaza en horizontal, como las demás del panel, en lugar de convertirse en tarjetas que impedirían esa comparación."
  ),
  p(
    "Los registros se presentan de veinticinco en veinticinco, bastantes más que las doce tarjetas de los listados públicos: la sección sustituye una hoja y quien la abre espera ver muchas filas a la vez. Se ordenan por fecha de actividad y no por fecha de creación, porque AEUVG trabaja por periodos y lo que busca es lo último que se realizó, aunque se haya cargado después; el identificador desempata para que dos registros del mismo día no cambien de orden entre páginas."
  ),

  h2("3.2. Buscador y filtros"),
  p(
    "El buscador y los filtros son un formulario común enviado por GET, sin JavaScript propio, igual que el de asociaciones: el resultado queda escrito en la dirección y puede compartirse o guardarse, y la página se vuelve a generar en el servidor, que es donde se calculan los totales. Se presentan desplegados y no detrás de un botón, al contrario que en la cartelera: aquí filtrar es la operación habitual y no la excepción."
  ),
  p(
    "Cada parámetro se valida por separado y el que no sea válido se descarta, con el mismo criterio que los filtros de eventos: una dirección mal escrita produce el listado sin ese filtro y no una pantalla de error. Un rango de fechas invertido conserva la fecha de inicio y descarta la de fin. El estado se acepta aunque venga en minúsculas, porque es el tipo de parámetro que alguien escribe a mano."
  ),
  p(
    "El filtro de registros sin cuenta vinculada no es un detalle técnico: es el que le dice a AEUVG a qué carnets les falta registrarse en la plataforma para que sus horas lleguen a un perfil."
  ),

  h2("3.3. Resumen del periodo"),
  p(
    "El panel presenta las horas registradas, las acreditadas, las pendientes y la cantidad de registros sin cuenta del periodo consultado. El resumen se calcula en la base y sobre la condición completa de los filtros, no sumando las filas de la página: AEUVG cierra periodos de cientos de registros y el dato que necesita es justamente el que no cabe en pantalla. La agrupación por estado devuelve las dos sumas en una sola consulta."
  ),

  h2("3.4. Fechas de día de calendario"),
  p(
    "La fecha de la actividad es un día sin hora, y PostgreSQL la compara contra la medianoche en UTC. Tanto el rango de los filtros como su presentación trabajan en UTC y no en la zona de Guatemala, al contrario que las fechas de los eventos: convertirla al desplazamiento del país la correría un día y una actividad del 9 de octubre se leería como del 8. La fecha de acreditación sí es un instante y se presenta en la hora de Guatemala, como el resto del sitio."
  ),
  p(
    "La verificación del panel en anchos de teléfono, tableta y escritorio dejó además un ajuste en la paginación: el componente que reutilizan la cartelera, las organizaciones y esta sección anunciaba “páginas de eventos” en el lector de pantalla, también sobre una tabla de horas. La etiqueta pasó a ser un parámetro con un valor general."
  ),

  // ---------- 4. HU-21 ----------
  h1("4. HU-21 - Creación, edición y eliminación de registros"),

  h2("4.1. El formulario pide un carnet, no una cuenta"),
  p(
    "El estudiante se identifica escribiendo su carnet y su nombre, y no eligiéndolo de una lista de cuentas. Un selector solo podría ofrecer a quienes ya se registraron, que es precisamente lo contrario de lo que el módulo necesita. Cuando el carnet ya tiene cuenta, el servicio guarda el nombre verificado de la cuenta en lugar del escrito, y la pantalla lo advierte."
  ),
  p(
    "El formato del carnet es más amplio que el del registro de cuentas, que exige cinco dígitos: las hojas con las que AEUVG lleva el control incluyen carnets de otras épocas, y rechazarlos dejaría fuera del sistema la información que hay que migrar. Lo que sí se garantiza es que se guarde normalizado, porque es el dato con el que el registro encuentra a su dueño."
  ),

  h2("4.2. Qué puede cambiar el formulario"),
  p(
    "El estado, la fecha de acreditación y el administrador que la aplicó no viajan en el cuerpo de la petición ni aparecen en el formulario: pertenecen a la acreditación, que tiene su propio recurso. Así corregir una descripción no puede devolver a pendiente lo que AEUVG ya acreditó, ni al revés. Un registro nuevo nace pendiente y la pantalla lo dice."
  ),
  p(
    "La corrección se abre desde la fila del listado, que es donde AEUVG detecta el dato equivocado al comparar un periodo completo. Los errores se presentan junto al campo que los origina, con un resumen arriba del formulario, igual que en los demás formularios del panel."
  ),

  h2("4.3. Eliminación definitiva"),
  p(
    "A diferencia de las organizaciones, aquí no hay baja lógica. Una fila de horas mal capturada no tiene historial que preservar, y dejarla oculta solo descuadraría los totales del estudiante, que es el dato que el módulo existe para dar. La confirmación explica en qué consiste la operación en lugar de preguntar si se está seguro, y tras aplicarla se refresca la ruta en lugar de quitar la fila en el cliente, porque los totales del periodo los calcula el servidor."
  ),

  // ---------- 5. HU-22 ----------
  h1("5. HU-22 - Acreditación de horas y operaciones en lote"),

  h2("5.1. La acreditación es una operación, no un campo"),
  p(
    "Acreditar cambia el estado del registro, guarda la fecha y deja constancia de quién lo hizo. La fecha la pone el servidor y el responsable sale de la sesión: el cuerpo de la petición no puede falsear ninguno de los dos. Por eso vive en un recurso aparte del registro y no como un campo más de la ficha."
  ),
  p(
    "La condición de la escritura exige que el registro siga pendiente, no solo que exista. Acreditar dos veces no reescribe la fecha ni el responsable de lo que ya estaba acreditado, y el conteo que devuelve la operación es el de los registros que realmente cambiaron."
  ),
  p(
    "La reversión devuelve el registro a pendiente y borra la fecha y el responsable, que es lo que exige la restricción de la tabla. Existe porque una selección en lote se puede equivocar: sin ella, corregirla obligaría a borrar los registros y volver a capturarlos."
  ),

  h2("5.2. Selección y lote"),
  p(
    "La selección vive en el cliente porque solo sirve para la operación que se está a punto de aplicar: no tiene sentido conservarla en la dirección ni en el servidor. La tabla se monta con una clave que incluye los filtros y la página, de modo que cambiar cualquiera de los dos la descarte. Sin eso, alguien podría marcar filas, cambiar de filtro y acreditar registros que ya no estaba viendo."
  ),
  p(
    "El lote admite hasta doscientos registros, que es la selección que cabe en pantalla con holgura; una petición con miles de identificadores no viene de alguien revisando filas. Los identificadores llegan como lista y no como filtro: el panel acredita exactamente lo que el administrador marcó, y traducir un filtro a registros en el servidor podría alcanzar filas distintas de las que vio. La selección se limpia de repetidos y de valores que no pueden ser un registro antes de llegar a la base."
  ),

  h2("5.3. Lo que se dice al terminar"),
  p(
    "La barra de acciones presenta cuántos registros hay seleccionados y cuántas horas suman antes de aplicar nada, porque quien acredita necesita ver sobre qué lo está haciendo. El resultado informa cuántos registros cambiaron además de cuántos se pidieron: una selección puede mezclar pendientes y acreditados, y un mensaje de “listo” sin cifras dejaría la duda de si se aplicó a todo."
  ),

  // ---------- 6. HU-23 ----------
  h1("6. HU-23 - Asociación de los registros con las cuentas"),

  h2("6.1. Dos mitades de la misma regla"),
  p(
    "La asociación por carnet se resuelve en dos momentos, y hacen falta los dos. Al guardar un registro, el servicio busca la ficha del carnet y la vincula si existe. Al crearse una cuenta, la misma transacción que crea el estudiante vincula los registros de ese carnet que no tenían dueño."
  ),
  p(
    "Sin la segunda mitad, las horas que AEUVG cargó antes de que el estudiante se registrara nunca aparecerían en su perfil, y son justamente las que ya tiene en sus hojas. La vinculación se ejecuta dentro de la transacción de la cuenta: si la creación falla, tampoco deben quedar registros apuntando a un estudiante que no existe."
  ),
  p(
    "Solo se alcanzan los registros sin vínculo. Uno ya vinculado pertenece a una cuenta y no debe cambiar de dueño porque alguien se registre con un carnet repetido."
  ),

  h2("6.2. Comparar carnets escritos en momentos distintos"),
  p(
    "Los dos lados del vínculo se escribieron por separado: el registro guarda el carnet normalizado y la ficha del estudiante conserva el que se capturó al crear la cuenta. La comparación ignora mayúsculas y espacios sobrantes en las dos mitades. Sin eso, un carnet con letras en minúscula quedaría sin vincular para siempre y nadie podría darse cuenta desde el panel."
  ),

  h2("6.3. Lo que el panel deja a la vista"),
  p(
    "Un registro sin cuenta se señala en su fila y puede listarse con el filtro correspondiente, porque son las horas que todavía no llegan a ningún perfil. Cuando el vínculo existe, el panel presenta el nombre de la cuenta, que es el verificado contra el correo institucional, y debajo el nombre con el que se cargó el registro cuando no coinciden: si el nombre de la hoja y el de la cuenta son distintos, lo más probable es que la fila se capturó con el carnet de otra persona, y eso tiene que poder verse."
  ),
  p(
    "El verificador de datos de prueba comprueba además que ningún registro quede sin vincular si su carnet sí tiene ficha de estudiante, que es la señal de que alguna de las dos mitades dejó de aplicarse."
  ),

  // ---------- 7. HU-24 ----------
  h1("7. HU-24 - Mis horas beca en el perfil del estudiante"),

  h2("7.1. Una sección de solo lectura"),
  p(
    "La sección responde la pregunta por la que el estudiantado escribía a AEUVG: cuántas horas lleva y cuántas le faltan por acreditar. Es de solo lectura porque las horas las registra y las acredita AEUVG a partir del apoyo efectivamente prestado; no hay nada que el estudiante pueda cambiar desde aquí, y la sección lo dice en lugar de ofrecer controles que no existirían."
  ),
  p(
    "Las horas se consultan siempre con el identificador del usuario de la sesión y nunca con un parámetro de la dirección, igual que el resto del perfil: no existe forma de pedir las horas de otra persona. Solo se presentan los registros vinculados a la cuenta; uno cargado a un carnet sin cuenta no pertenece a nadie en la plataforma hasta que su dueño se registra."
  ),

  h2("7.2. Totales e historial"),
  p(
    "Los totales se derivan del mismo historial que se presenta debajo, en lugar de consultarse por separado, para que no pueda ocurrir que la suma y la lista digan cosas distintas. El historial va de la actividad más reciente a la más antigua: lo que el estudiante viene a comprobar es si ya le acreditaron lo último que hizo."
  ),
  p(
    "Las horas se suman en centésimas y se dividen al final. Las cantidades vienen de una columna decimal y sumar treinta registros de media hora en coma flotante produce diferencias de milésimas que en pantalla se leen redondas pero no coinciden con lo que reporta el panel, que suma en la base. Un estudiante sin registros ve una explicación de cómo se acreditan las horas en lugar de una sección vacía."
  ),
  p(
    "La sección vive dentro del perfil, pero se alcanza en un clic desde el menú de la cuenta: es la consulta más frecuente del estudiantado y obligar a buscarla dentro de la pantalla la habría escondido."
  ),

  // ---------- 8 ----------
  h1("8. Pruebas y verificación"),
  p(
    "Las pruebas automatizadas del proyecto pasaron de 225 a 319. Las 94 nuevas corresponden a este sprint y se ejecutan sin base de datos, sustituyendo el acceso a datos por dobles de prueba, para que puedan correrse en cualquier momento del desarrollo."
  ),
  spacer(),
  makeTable(
    [3400, 1400, 4560],
    ["Área", "Pruebas", "Qué se verifica"],
    [
      [
        "Servicio de registro de horas",
        "26",
        "La normalización del carnet, el texto de búsqueda, la resolución del vínculo con la cuenta y las validaciones de horas, fecha y campos obligatorios.",
      ],
      [
        "Filtros y parámetros del panel",
        "17",
        "Que un parámetro inválido se descarte, el rango invertido, el filtro de vínculo, que las fechas se comparen como día de calendario en UTC y que el destino de regreso sea una ruta interna de la sección.",
      ],
      [
        "Validaciones y permisos del registro",
        "20",
        "Los formatos de carnet admitidos, la precisión de las horas, que el cuerpo no pueda indicar el estado y que las rutas respondan 401 sin sesión y 404 sin el rol.",
      ],
      [
        "Acreditación y operaciones en lote",
        "15",
        "La fecha y el responsable guardados, la selección sin repetidos, el límite del lote, la reversión y el conteo de una selección mixta.",
      ],
      [
        "Asociación por carnet",
        "7",
        "Que la vinculación normalice el carnet, ignore mayúsculas, alcance solo los registros sin dueño y no toque el resto del registro.",
      ],
      [
        "Totales del perfil",
        "9",
        "La separación entre horas acreditadas y pendientes, la suma sin error de coma flotante y que la fecha de la actividad no se corra de día.",
      ],
    ]
  ),
  spacer(),
  p(
    "Además de las pruebas automatizadas se verificó que el proyecto compile sin errores de tipos, que el análisis estático no reporte problemas y que la compilación de producción se complete, incluyendo las seis rutas nuevas del sprint: tres pantallas del panel y tres grupos de servicios. Las pantallas se revisaron en anchos de teléfono, tableta y escritorio."
  ),
  p(
    "La migración del sprint quedó lista para aplicarse en el ambiente de pruebas de Railway con el procedimiento por túnel cifrado del Sprint 2. Al cierre de este documento la aplicación quedó pendiente, porque la sesión del CLI de Railway caducó y su renovación requiere iniciar sesión desde el navegador. No afecta al incremento ya construido: la migración no modifica ninguna columna existente, agrega tres y relaja la obligatoriedad del vínculo con el estudiante, y su carga inicial recalcula el carnet, el nombre y el texto de búsqueda de los registros que ya estaban cargados."
  ),

  // ---------- 9 ----------
  h1("9. Estado del sprint"),
  p(
    `Las seis historias comprometidas para el Sprint 4 se encuentran completadas, con ${tiempos.enHoras(tiempos.totalEquipo)} horas de trabajo de equipo frente a las 30 estimadas. El detalle por sesión se encuentra en la sección 10. La plataforma cuenta ahora con:`
  ),
  bullet(
    "Registros de horas beca identificados por carnet, con su vínculo opcional con la cuenta del estudiante."
  ),
  bullet(
    "La sección de horas beca del panel administrativo, con su tabla, su buscador, sus filtros y su resumen del periodo."
  ),
  bullet("El registro, la corrección y la eliminación de registros desde el panel."),
  bullet(
    "La acreditación y la reversión de horas, individual y en lote, con su fecha y su responsable."
  ),
  bullet(
    "La asociación automática de los registros con las cuentas por carnet, en los dos sentidos."
  ),
  bullet(
    "La sección “Mis horas beca” del perfil, con los totales del estudiante y su historial de actividades."
  ),
  p(
    "Queda pendiente aplicar la migración del sprint en el ambiente de pruebas de Railway, por la razón explicada en la sección 8, y la carga de los registros históricos que AEUVG administra hoy en sus hojas, que corresponde al Sprint 5 junto con la importación desde Excel. Continúa también en gestión el trámite del dominio institucional iniciado en el Sprint 1."
  ),
  p(
    "Tras la revisión del sprint se incorporaron las observaciones recibidas, sin alcance nuevo: el registro rechaza una fecha de actividad posterior a hoy, que solo puede ser un error de captura y dejaba el registro fuera del periodo que se estuviera cerrando; el panel presenta quién acreditó cada registro y cuándo, dato que la tabla ya guardaba pero no mostraba y que con varios administradores era el único modo de rastrear una acreditación aplicada por error; el formulario vuelve al listado con los filtros que traía, porque guardar obligaba a escribir otra vez el periodo que se estaba revisando; y el historial del perfil indica desde cuándo está acreditada cada actividad, ya que saber que lo está no le servía al estudiante para reclamar lo que falta."
  ),
  p(
    "El desarrollo continúa en el Sprint 5 con la importación y la exportación de los registros de horas beca, los reportes para AEUVG y la publicación de oportunidades para realizar horas, que se apoyan en el modelo y los servicios entregados en este sprint."
  ),

  // ---------- 10. Registro de tiempos ----------
  ...tiempos.bloques,
]);

const out = path.join(__dirname, "..", "..", "Documentos", "AEUVG - Desarrollo Sprint 4.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("Documento generado:", out);
});
