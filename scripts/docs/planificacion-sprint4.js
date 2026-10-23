// Genera Documentos/AEUVG - Planificacion Sprint 4.docx
// Uso: node scripts/docs/planificacion-sprint4.js
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
    subtitle: "Planificación del Sprint 4",
    date: "Guatemala, 8 de octubre del 2026",
  }),

  h1("1. Introducción"),
  p(
    "El presente documento describe la planificación detallada del Sprint 4 del proyecto de la plataforma web de la Asociación General de Estudiantes de la Universidad del Valle de Guatemala (AEUVG). Complementa el documento de planificación general de sprints, en el cual se define la distribución del trabajo a lo largo de los seis sprints del proyecto."
  ),
  p(
    "El Sprint 4 corresponde al módulo de horas beca, que sustituye el control que AEUVG realiza actualmente mediante hojas de cálculo. Es el primer módulo del proyecto cuya información no nace en la plataforma: los registros existen desde antes, pertenecen a estudiantes que pueden no tener cuenta todavía y los administra AEUVG como responsable del programa."
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
      ["Sprint", "Sprint 4 - Gestión de horas beca"],
      ["Fecha de inicio", "Miércoles 7 de octubre de 2026"],
      ["Fecha de finalización", "Martes 20 de octubre de 2026"],
      ["Duración", "2 semanas"],
      ["Equipo", "Harry Daniel Méndez Mendoza y Juan Gabriel Gualim Molina"],
      ["Historias de usuario", "6"],
      ["Tareas", "36"],
      ["Puntos de historia", "47"],
      ["Horas estimadas de equipo", "30 horas"],
      ["Revisión de sprint", "Martes 20 de octubre de 2026"],
    ]
  ),
  spacer(),
  p(
    "La reunión de planificación se realizó el jueves 8 de octubre por la noche y no el primer día del sprint. La revisión del Sprint 3 dejó una lista de ajustes finales que el equipo resolvió el miércoles 7 y el jueves 8 —el asterisco de los campos obligatorios, las siglas de las asociaciones con su migración, las tarjetas de asociaciones y clubes, la portada con su carrusel y el contenido de demostración—, y su documentación se cerró el sábado 10. Esos ajustes se registraron en el Sprint 3, al que pertenecen, de modo que las primeras horas de este sprint corresponden únicamente a la planificación. El sprint conserva su fecha de finalización."
  ),
  p(
    "La estimación de 30 horas de equipo se calculó con la velocidad medida en el Sprint 3. Aquel sprint cerró en 40.9 horas, pero 10.5 de ellas fueron los ajustes finales pedidos en su revisión, que no formaban parte de las historias comprometidas; las seis historias y su cierre consumieron 30.4 horas frente a las 28 estimadas, y es esa cifra la que sirve de referencia. Se estiman dos horas más que las comprometidas en el sprint anterior porque este módulo no reutiliza pantallas públicas ya resueltas: el panel de horas beca se comporta como una hoja de cálculo y no como los listados construidos hasta ahora, y la asociación de los registros con las cuentas obliga a modificar el modelo de datos y el registro de estudiantes."
  ),

  h1("3. Objetivo del sprint"),
  p(
    "Sustituir el control de horas beca que AEUVG realiza mediante hojas de cálculo: la asociación debe poder registrar, corregir, buscar, filtrar y acreditar las horas de servicio del estudiantado desde el panel administrativo, con la misma agilidad con la que hoy trabaja sobre una hoja, y cada estudiante debe poder consultar desde su perfil cuántas horas tiene realizadas, acreditadas y pendientes, junto con el historial de las actividades en las que apoyó."
  ),
  p(
    "Al finalizar el sprint, un registro cargado por AEUVG antes de que el estudiante tenga cuenta en la plataforma deberá aparecer en su perfil en el momento en que la cree, sin que nadie tenga que vincularlo a mano."
  ),

  h1("4. Alcance del sprint"),
  h2("4.1. Trabajo incluido"),
  bullet(
    "Ampliación del modelo de datos de los registros de horas beca con el carnet, el nombre del estudiante y el vínculo opcional con su cuenta."
  ),
  bullet("Servicios de consulta, creación, edición y eliminación de registros de horas beca."),
  bullet(
    "Panel administrativo de horas beca con una tabla densa, al estilo de una hoja de cálculo."
  ),
  bullet("Búsqueda de estudiantes por nombre o carnet dentro del panel."),
  bullet("Filtros por estado, por periodo de actividad y por vínculo con una cuenta."),
  bullet("Resumen de horas registradas, acreditadas y pendientes del periodo consultado."),
  bullet("Estados de las horas: pendiente y acreditada."),
  bullet(
    "Acreditación de horas con el registro de su fecha y del administrador que la aplicó, y reversión de una acreditación aplicada por error."
  ),
  bullet("Selección múltiple de registros para acreditar y revertir en lote."),
  bullet(
    "Asociación automática de los registros con las cuentas de los estudiantes mediante el carnet, incluyendo los registros creados antes de que el estudiante tenga cuenta."
  ),
  bullet(
    "Sección “Mis horas beca” en el perfil del estudiante, con sus totales y el historial de actividades."
  ),

  h2("4.2. Trabajo no incluido"),
  bullet(
    "Importación de registros desde archivos de Excel y migración de los registros históricos de AEUVG, correspondientes al Sprint 5."
  ),
  bullet("Exportación de registros en Excel, PDF y CSV, correspondiente al Sprint 5."),
  bullet(
    "Publicación de oportunidades y horarios para realizar horas beca, correspondiente al Sprint 5."
  ),
  bullet("Tutorías, tutores y postulaciones, correspondientes al Sprint 6."),
  bullet("Recomendaciones personalizadas y notificaciones, correspondientes al Sprint 6."),
  bullet(
    "Registro de horas por parte del estudiante: las horas las acredita AEUVG a partir del apoyo efectivamente prestado, conforme al requerimiento recibido."
  ),
  bullet(
    "Creación de cuentas de estudiante desde el panel: un registro de horas puede existir sin cuenta y la cuenta la crea cada estudiante."
  ),

  h1("5. Historias de usuario del Sprint 4"),
  p(
    "A continuación se presentan las 6 historias de usuario comprometidas para el Sprint 4, cada una con su descripción, criterios de aceptación y tareas correspondientes. En total, el sprint comprende 36 tareas. La numeración continúa la del Sprint 3."
  ),

  h2("5.1. HU-19 - Servicios de consulta y registro de horas beca"),
  p(
    "Historia: Como equipo de desarrollo, necesito el modelo de datos y los servicios de horas beca implementados, para que el panel administrativo y el perfil del estudiante lean y escriban la misma información con el mismo criterio."
  ),
  spacer(),
  ficha("Alta", 8, "5.5 h", "Harry Méndez"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "Un registro de horas conserva el carnet y el nombre del estudiante, y el vínculo con su cuenta es opcional."
  ),
  bullet(
    "La migración carga el carnet y el nombre de los registros ya existentes a partir del estudiante al que apuntan, sin perder información."
  ),
  bullet("Existen consultas de listado y de detalle de registros, con su paginación."),
  bullet(
    "El listado puede buscarse por carnet, por nombre del estudiante y por descripción de la actividad, sin distinguir mayúsculas ni acentos."
  ),
  bullet(
    "El servicio valida la cantidad de horas, la fecha de la actividad y los campos obligatorios antes de guardar."
  ),
  bullet(
    "Existe información de prueba con registros pendientes, acreditados, con cuenta vinculada y sin ella."
  ),
  spacer(),
  tareas([
    [
      "T-19.1",
      "Implementar la migración del carnet, el nombre del estudiante y el vínculo opcional con la cuenta.",
      "Harry",
      "1.25",
    ],
    [
      "T-19.2",
      "Implementar las consultas de listado y detalle de los registros de horas.",
      "Harry",
      "1.25",
    ],
    [
      "T-19.3",
      "Implementar la normalización del carnet y el texto de búsqueda de los registros.",
      "Juan Gabriel",
      "0.75",
    ],
    [
      "T-19.4",
      "Implementar el servicio de registro de horas con sus validaciones.",
      "Harry",
      "1.25",
    ],
    [
      "T-19.5",
      "Ampliar los datos de prueba con registros de horas de distintos casos.",
      "Harry",
      "0.5",
    ],
    ["T-19.6", "Realizar pruebas de las consultas y del servicio de horas beca.", "Ambos", "0.5"],
  ]),

  h2("5.2. HU-20 - Panel administrativo de horas beca"),
  p(
    "Historia: Como administrador de AEUVG, quiero consultar los registros de horas beca en una tabla que pueda buscar y filtrar, para trabajar sobre ellos con la misma agilidad con la que hoy uso una hoja de cálculo."
  ),
  spacer(),
  ficha("Alta", 8, "5.5 h", "Juan Gabriel Gualim"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "La tabla presenta el carnet, el nombre del estudiante, la fecha de la actividad, el horario de apoyo, la actividad, la cantidad de horas y el estado de cada registro."
  ),
  bullet("Los registros se presentan del más reciente al más antiguo y se recorren por páginas."),
  bullet("El buscador encuentra registros por nombre del estudiante y por carnet."),
  bullet(
    "Los filtros permiten limitar el listado por estado, por periodo de actividad y por registros con o sin cuenta vinculada."
  ),
  bullet(
    "El panel presenta el total de horas registradas, acreditadas y pendientes del periodo consultado, y no solo las de la página en pantalla."
  ),
  bullet(
    "Un parámetro mal escrito en la dirección se descarta y el panel presenta el listado sin ese filtro, en lugar de una pantalla de error."
  ),
  bullet(
    "Cuando ningún registro coincide, la pantalla explica la causa en lugar de presentar una tabla vacía."
  ),
  bullet("La tabla se puede consultar en computadora, tableta y teléfono."),
  spacer(),
  tareas([
    [
      "T-20.1",
      "Implementar la validación de los parámetros del listado del panel.",
      "Harry",
      "0.75",
    ],
    ["T-20.2", "Implementar el resumen de horas del periodo consultado.", "Harry", "1"],
    [
      "T-20.3",
      "Implementar la tabla de registros del panel con sus columnas y su estado.",
      "Juan Gabriel",
      "1.25",
    ],
    ["T-20.4", "Implementar el buscador de estudiantes por nombre o carnet.", "Juan Gabriel", "1"],
    [
      "T-20.5",
      "Implementar los filtros por estado, periodo y vínculo con la cuenta.",
      "Juan Gabriel",
      "1.25",
    ],
    ["T-20.6", "Verificar el panel en computadora y en dispositivos móviles.", "Ambos", "0.25"],
  ]),

  h2("5.3. HU-21 - Creación, edición y eliminación de registros"),
  p(
    "Historia: Como administrador de AEUVG, quiero crear, corregir y eliminar registros de horas beca desde el panel, para mantener el control del programa sin depender del equipo de desarrollo ni de una hoja aparte."
  ),
  spacer(),
  ficha("Alta", 13, "6 h", "Harry Méndez"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "El administrador puede registrar las horas de un estudiante indicando su carnet, su nombre, la fecha de la actividad, el horario de apoyo, la actividad realizada, la cantidad de horas y observaciones opcionales."
  ),
  bullet(
    "El sistema valida los campos obligatorios, el formato del carnet y que la cantidad de horas sea mayor que cero y no exceda las de un día."
  ),
  bullet("El administrador puede corregir cualquier campo de un registro ya guardado."),
  bullet(
    "El administrador puede eliminar un registro, con una confirmación previa que advierte que la operación es definitiva."
  ),
  bullet("Un registro nuevo se guarda como pendiente: la acreditación es una operación aparte."),
  bullet(
    "Las operaciones de registro solo están disponibles para el rol de administrador, tanto en la interfaz como en los servicios."
  ),
  bullet("Los mensajes de error se presentan junto al campo que los origina."),
  spacer(),
  tareas([
    ["T-21.1", "Implementar el esquema de validación del registro de horas.", "Harry", "1"],
    [
      "T-21.2",
      "Exponer los endpoints de creación, edición y eliminación protegidos por rol.",
      "Harry",
      "1.25",
    ],
    ["T-21.3", "Implementar el formulario de registro de horas del panel.", "Juan Gabriel", "1.5"],
    ["T-21.4", "Implementar la edición de un registro desde el listado.", "Juan Gabriel", "1"],
    [
      "T-21.5",
      "Implementar la confirmación y el aviso al eliminar un registro.",
      "Juan Gabriel",
      "0.5",
    ],
    [
      "T-21.6",
      "Realizar pruebas de las validaciones y de los permisos del registro de horas.",
      "Ambos",
      "0.75",
    ],
  ]),

  h2("5.4. HU-22 - Acreditación de horas y operaciones en lote"),
  p(
    "Historia: Como administrador de AEUVG, quiero acreditar las horas de varios registros a la vez y poder revertir una acreditación aplicada por error, para cerrar el control de un periodo sin repetir la misma operación decenas de veces."
  ),
  spacer(),
  ficha("Alta", 8, "5 h", "Harry Méndez"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "Acreditar un registro cambia su estado a acreditada y guarda la fecha de acreditación y el administrador que la aplicó."
  ),
  bullet("Acreditar un registro que ya estaba acreditado no modifica su fecha ni su responsable."),
  bullet(
    "Revertir una acreditación devuelve el registro a pendiente y borra su fecha de acreditación y su responsable."
  ),
  bullet(
    "El administrador puede seleccionar varios registros de la tabla, o todos los de la página, y aplicar la operación en lote."
  ),
  bullet("La barra de acciones indica cuántos registros hay seleccionados y cuántas horas suman."),
  bullet(
    "El resultado de la operación informa cuántos registros cambiaron, para que una selección mixta no deje dudas."
  ),
  bullet("La selección se descarta al cambiar de página o de filtro, para no acreditar a ciegas."),
  spacer(),
  tareas([
    [
      "T-22.1",
      "Implementar el servicio de acreditación con su fecha y su responsable.",
      "Harry",
      "1.25",
    ],
    ["T-22.2", "Implementar la reversión de una acreditación.", "Harry", "0.5"],
    ["T-22.3", "Exponer el endpoint de acreditación y reversión en lote.", "Harry", "0.75"],
    ["T-22.4", "Implementar la selección múltiple de filas del listado.", "Juan Gabriel", "1.25"],
    [
      "T-22.5",
      "Implementar la barra de acciones en lote con su resumen de selección.",
      "Juan Gabriel",
      "0.75",
    ],
    ["T-22.6", "Realizar pruebas de la acreditación y de las operaciones en lote.", "Ambos", "0.5"],
  ]),

  h2("5.5. HU-23 - Asociación de los registros con las cuentas"),
  p(
    "Historia: Como estudiante, quiero que las horas que AEUVG registró a mi carnet aparezcan en mi cuenta aunque se hayan cargado antes de que yo me registrara, para no tener que pedir que alguien las vincule."
  ),
  spacer(),
  ficha("Alta", 5, "4 h", "Harry Méndez"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "Al guardar un registro, el sistema busca la cuenta del carnet indicado y la vincula si existe."
  ),
  bullet(
    "Un carnet sin cuenta no impide guardar el registro: queda sin vínculo y conserva el nombre con el que AEUVG lo registró."
  ),
  bullet(
    "Al crearse la cuenta de un estudiante, los registros de su carnet quedan vinculados sin intervención de nadie."
  ),
  bullet(
    "El panel señala los registros sin cuenta vinculada y permite filtrarlos, para que AEUVG sepa a quién le falta registrarse."
  ),
  bullet(
    "Cuando el registro está vinculado, el panel presenta el nombre de la cuenta, que es el dato verificado."
  ),
  bullet("El carnet se compara sin distinguir mayúsculas ni espacios sobrantes."),
  spacer(),
  tareas([
    [
      "T-23.1",
      "Implementar la búsqueda de la cuenta por carnet al guardar un registro.",
      "Harry",
      "0.75",
    ],
    [
      "T-23.2",
      "Vincular los registros existentes al crearse la cuenta del estudiante.",
      "Harry",
      "1.25",
    ],
    ["T-23.3", "Señalar en el panel los registros sin cuenta vinculada.", "Juan Gabriel", "0.75"],
    [
      "T-23.4",
      "Presentar el nombre de la cuenta cuando el registro está vinculado.",
      "Juan Gabriel",
      "0.5",
    ],
    [
      "T-23.5",
      "Ampliar los datos de prueba con un carnet sin cuenta y sus registros.",
      "Harry",
      "0.25",
    ],
    ["T-23.6", "Realizar pruebas de la asociación por carnet.", "Ambos", "0.5"],
  ]),

  h2("5.6. HU-24 - Mis horas beca en el perfil del estudiante"),
  p(
    "Historia: Como estudiante, quiero consultar en mi perfil cuántas horas beca tengo realizadas, acreditadas y pendientes, junto con el historial de las actividades en las que apoyé, para saber cuánto me falta sin tener que preguntarle a AEUVG."
  ),
  spacer(),
  ficha("Media", 5, "4 h", "Juan Gabriel Gualim"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "El perfil presenta el total de horas realizadas, el de horas acreditadas y el de horas pendientes del estudiante."
  ),
  bullet(
    "El historial presenta cada actividad con su fecha, su horario, su descripción, sus horas y su estado, de la más reciente a la más antigua."
  ),
  bullet(
    "Un estudiante sin registros ve una explicación de cómo se acreditan las horas en lugar de una sección vacía."
  ),
  bullet(
    "La sección solo presenta los registros vinculados a la cuenta de la sesión, resueltos a partir de ella y no de un parámetro."
  ),
  bullet("La sección es alcanzable desde el menú de la cuenta."),
  bullet("La sección se visualiza correctamente en computadora, tableta y teléfono."),
  spacer(),
  tareas([
    [
      "T-24.1",
      "Implementar las consultas de las horas beca del estudiante de la sesión.",
      "Harry",
      "0.75",
    ],
    [
      "T-24.2",
      "Implementar el cálculo de los totales realizados, acreditados y pendientes.",
      "Harry",
      "0.75",
    ],
    [
      "T-24.3",
      "Implementar la sección “Mis horas beca” del perfil con sus totales.",
      "Juan Gabriel",
      "1",
    ],
    ["T-24.4", "Implementar el historial de actividades del estudiante.", "Juan Gabriel", "0.75"],
    ["T-24.5", "Enlazar las horas beca desde el menú de la cuenta.", "Juan Gabriel", "0.25"],
    [
      "T-24.6",
      "Verificar el sprint completo y actualizar la documentación técnica.",
      "Ambos",
      "0.5",
    ],
  ]),

  h1("6. Resumen del sprint"),
  h2("6.1. Resumen de historias"),
  spacer(),
  makeTable(
    [1100, 4860, 1100, 1100, 1200],
    ["ID", "Historia de usuario", "Tareas", "Puntos", "Horas"],
    [
      ["HU-19", "Servicios de consulta y registro de horas beca", "6", "8", "5.5"],
      ["HU-20", "Panel administrativo de horas beca", "6", "8", "5.5"],
      ["HU-21", "Creación, edición y eliminación de registros", "6", "13", "6"],
      ["HU-22", "Acreditación de horas y operaciones en lote", "6", "8", "5"],
      ["HU-23", "Asociación de los registros con las cuentas", "6", "5", "4"],
      ["HU-24", "Mis horas beca en el perfil del estudiante", "6", "5", "4"],
      ["", "Total", "36", "47", "30"],
    ]
  ),

  h2("6.2. Distribución del trabajo por integrante"),
  spacer(),
  makeTable(
    [3400, 2000, 2000, 1960],
    ["Integrante", "Tareas asignadas", "Horas estimadas", "Porcentaje"],
    [
      ["Harry Daniel Méndez Mendoza", "16", "14.5 h", "48%"],
      ["Juan Gabriel Gualim Molina", "14", "12.5 h", "42%"],
      ["Trabajo conjunto", "6", "3 h", "10%"],
      ["Total", "36", "30 h", "100%"],
    ]
  ),
  spacer(),
  p(
    "El trabajo conjunto corresponde a las tareas de prueba de cada historia y a la verificación final del sprint, que se realizan con ambos integrantes para que quien no escribió el código revise su comportamiento. Harry asume la migración, las consultas y los servicios, que es donde se concentra el trabajo de este sprint; Juan Gabriel, el panel y la sección del perfil."
  ),

  h2("6.3. Cronograma del sprint"),
  spacer(),
  makeTable(
    [1400, 1800, 3900, 2260],
    ["Semana", "Fechas", "Trabajo principal", "Hito"],
    [
      [
        "Semana 1",
        "07/10 - 13/10",
        "HU-19 completa. HU-20 completa: tabla, buscador, filtros y resumen de horas.",
        "Panel de horas beca consultando los registros en el ambiente de pruebas.",
      ],
      [
        "Semana 2",
        "14/10 - 20/10",
        "HU-21, HU-22, HU-23 y HU-24 completas.",
        "Módulo de horas beca operativo, con su acreditación en lote y su sección en el perfil.",
      ],
    ]
  ),

  h2("6.4. Carga de trabajo estimada"),
  p(
    "El Sprint 4 comprende 30 horas de trabajo de equipo, equivalentes a aproximadamente 15 horas por integrante durante las dos semanas. La carga es algo mayor que la del Sprint 3 porque el panel de horas beca no reutiliza los listados ya construidos: necesita una tabla densa, selección múltiple y operaciones en lote que ninguna pantalla anterior tenía. A cambio, el módulo reutiliza la protección de servicios por rol, la paginación por enlaces, la validación de parámetros de los filtros y la búsqueda sin acentos de los sprints anteriores."
  ),
  p(
    "El orden de ejecución sigue la numeración de las historias. La ampliación del modelo de datos va primero porque de ella dependen todas las demás, y la asociación por carnet se trabaja después del registro de horas, cuando ya existe el servicio en el que se aplica. En caso de que la carga académica no permita alcanzar las horas estimadas, la historia HU-24 es la de menor prioridad y puede trasladarse al Sprint 5, dado que la información del perfil se deriva de los mismos registros y no condiciona la administración."
  ),

  h1("7. Definición de terminado"),
  p(
    "Una historia de usuario del Sprint 4 se considerará terminada cuando cumpla con lo siguiente:"
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
  bullet(
    "Modelo de datos de los registros de horas beca ampliado con el carnet y el vínculo opcional con la cuenta."
  ),
  bullet("Servicios de consulta, registro, edición, eliminación y acreditación de horas beca."),
  bullet("Sección de horas beca del panel administrativo, con su buscador y sus filtros."),
  bullet("Resumen de horas registradas, acreditadas y pendientes del periodo consultado."),
  bullet("Acreditación y reversión de horas, individual y en lote."),
  bullet("Asociación automática de los registros con las cuentas mediante el carnet."),
  bullet("Sección “Mis horas beca” en el perfil del estudiante, con su historial de actividades."),
  bullet("Documento de desarrollo del Sprint 4 y registro de tiempos de ambos integrantes."),

  h1("9. Riesgos del sprint"),
  spacer(),
  makeTable(
    [3100, 3100, 3160],
    ["Riesgo", "Impacto", "Acción preventiva"],
    [
      [
        "Los carnets de las hojas de AEUVG no coinciden con los de las cuentas por espacios o formatos distintos.",
        "Registros que nunca llegarían al perfil de su dueño.",
        "Comparar el carnet normalizado y guardarlo en una sola forma, de modo que la vinculación no dependa de cómo se escribió.",
      ],
      [
        "Un estudiante con horas registradas todavía no tiene cuenta en la plataforma.",
        "El registro no podría guardarse o quedaría atado a una cuenta ajena.",
        "Dejar el vínculo con la cuenta como opcional y resolverlo por carnet cuando la cuenta se cree.",
      ],
      [
        "La acreditación en lote se aplica sobre una selección equivocada.",
        "Horas acreditadas sin corresponder, con su fecha y su responsable ya guardados.",
        "Confirmar la operación con el conteo a la vista, descartar la selección al cambiar de filtro y permitir revertir una acreditación.",
      ],
      [
        "El volumen de registros históricos de AEUVG es mayor al previsto.",
        "Un panel lento de usar justo en el módulo que debe reemplazar la hoja de cálculo.",
        "Paginar el listado, calcular el resumen en la base y apoyar la búsqueda en índices sobre el carnet y el estado.",
      ],
      [
        "Carga académica del equipo durante las dos semanas del sprint.",
        "No completar la totalidad de las historias comprometidas.",
        "Priorizar las historias HU-19 a HU-23 y trasladar la sección del perfil de la historia HU-24 al Sprint 5 de ser necesario.",
      ],
    ]
  ),
]);

const out = path.join(__dirname, "..", "..", "Documentos", "AEUVG - Planificacion Sprint 4.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("Documento generado:", out);
});
