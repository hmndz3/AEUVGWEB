// Genera Documentos/AEUVG - Planificacion Sprint 3.docx
// Uso: node scripts/docs/planificacion-sprint3.js
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
    subtitle: "Planificación del Sprint 3",
    date: "Guatemala, 24 de septiembre del 2026",
  }),

  h1("1. Introducción"),
  p(
    "El presente documento describe la planificación detallada del Sprint 3 del proyecto de la plataforma web de la Asociación General de Estudiantes de la Universidad del Valle de Guatemala (AEUVG). Complementa el documento de planificación general de sprints, en el cual se define la distribución del trabajo a lo largo de los seis sprints del proyecto."
  ),
  p(
    "El Sprint 3 corresponde a las secciones de asociaciones y clubes estudiantiles y al perfil personal del estudiante. Es el primer sprint que incorpora funcionalidad asociada a la cuenta del usuario, ya que hasta ahora la sesión servía únicamente para acceder al panel administrativo."
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
      ["Sprint", "Sprint 3 - Asociaciones, clubes y perfil de usuario"],
      ["Fecha de inicio", "Miércoles 23 de septiembre de 2026"],
      ["Fecha de finalización", "Martes 6 de octubre de 2026"],
      ["Duración", "2 semanas"],
      ["Equipo", "Harry Daniel Méndez Mendoza y Juan Gabriel Gualim Molina"],
      ["Historias de usuario", "6"],
      ["Tareas", "36"],
      ["Puntos de historia", "44"],
      ["Horas estimadas de equipo", "28 horas"],
      ["Revisión de sprint", "Martes 6 de octubre de 2026"],
    ]
  ),
  spacer(),
  p(
    "La reunión de planificación se realizó el jueves 24 de septiembre y no el primer día del sprint, porque el miércoles 23 se dedicó por completo a resolver las observaciones de la revisión del Sprint 2 y a publicar su versión. El sprint conserva su fecha de finalización."
  ),
  p(
    "La estimación de 28 horas de equipo se calculó con la velocidad medida en el Sprint 2, que cerró en 36.9 horas frente a las 34 estimadas. Se estiman menos horas que en el sprint anterior porque el módulo de eventos dejó resueltos los componentes de listado, paginación, estado vacío, carga de imágenes y protección de servicios por rol, que este sprint reutiliza en lugar de volver a construir."
  ),

  h1("3. Objetivo del sprint"),
  p(
    "Dar visibilidad a las asociaciones y clubes estudiantiles y habilitar el perfil personal del estudiante: el estudiantado debe poder consultar el listado y el detalle de cada asociación y de cada club, con su descripción, su junta directiva, sus medios de contacto, sus redes sociales y las actividades que organizan; AEUVG debe poder administrar esa información desde el panel; y cada estudiante debe poder revisar y editar sus datos personales y guardar los eventos que le interesan."
  ),
  p(
    "Al finalizar el sprint, los organizadores que hoy aparecen como texto en la tarjeta de un evento serán enlaces a su propia página, de modo que el módulo de eventos del Sprint 2 y las secciones de este sprint queden conectados en ambos sentidos."
  ),

  h1("4. Alcance del sprint"),
  h2("4.1. Trabajo incluido"),
  bullet("Servicios de consulta de asociaciones y clubes, con búsqueda por nombre y descripción."),
  bullet(
    "Sección de asociaciones: listado y página de detalle con descripción, misión, visión, junta directiva, contacto y redes sociales."
  ),
  bullet(
    "Sección de clubes: listado y página de detalle con descripción, actividades, contacto y redes sociales."
  ),
  bullet("Actividades organizadas por cada asociación y club dentro de su página de detalle."),
  bullet("Enlace de los organizadores de un evento a su página correspondiente."),
  bullet(
    "Administración de asociaciones y clubes desde el panel, incluyendo la junta directiva y las redes sociales."
  ),
  bullet("Perfil del estudiante con sus datos personales, carnet, carrera y facultad."),
  bullet("Edición de los datos editables del perfil."),
  bullet("Guardar y quitar eventos, y consultarlos desde el perfil."),
  bullet("Redes sociales oficiales de AEUVG en el pie de página y en la página institucional."),

  h2("4.2. Trabajo no incluido"),
  bullet("Módulo de horas beca, correspondiente a los sprints 4 y 5."),
  bullet("Tutorías, tutores y postulaciones, correspondientes al Sprint 6."),
  bullet("Recomendaciones personalizadas y notificaciones, correspondientes al Sprint 6."),
  bullet(
    "Cuentas propias para las asociaciones y los clubes: su información la administra AEUVG, conforme al requerimiento recibido."
  ),
  bullet(
    "Cambio del carnet, del nombre y del correo institucional desde el perfil: identifican la cuenta y su corrección corresponde a AEUVG."
  ),
  bullet("Fotografía de perfil del estudiante, que no forma parte del requerimiento."),

  h1("5. Historias de usuario del Sprint 3"),
  p(
    "A continuación se presentan las 6 historias de usuario comprometidas para el Sprint 3, cada una con su descripción, criterios de aceptación y tareas correspondientes. En total, el sprint comprende 36 tareas. La numeración continúa la del Sprint 2."
  ),

  h2("5.1. HU-13 - Servicios de consulta de asociaciones y clubes"),
  p(
    "Historia: Como equipo de desarrollo, necesito los servicios de consulta de asociaciones y clubes implementados sobre el modelo de datos existente, para que las pantallas públicas y las del panel lean la misma información y con el mismo criterio."
  ),
  spacer(),
  ficha("Alta", 5, "4.5 h", "Harry Méndez"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "Existen consultas de listado y de detalle de asociaciones y de clubes que únicamente devuelven los registros activos al público general."
  ),
  bullet(
    "El listado puede buscarse por nombre y descripción, sin distinguir mayúsculas ni acentos."
  ),
  bullet(
    "Las consultas devuelven la junta directiva, los medios de contacto y las redes sociales asociadas a cada registro."
  ),
  bullet(
    "Existe una consulta de las actividades publicadas que organiza una asociación o un club, separadas en próximas y pasadas."
  ),
  bullet(
    "La asociación general AEUVG no aparece en el listado de asociaciones, porque cuenta con su propia página institucional."
  ),
  bullet(
    "Existe información de prueba con varias asociaciones y clubes, con y sin junta directiva, contacto y redes sociales."
  ),
  spacer(),
  tareas([
    [
      "T-13.1",
      "Implementar la migración del texto de búsqueda y de los índices de asociaciones y clubes.",
      "Harry",
      "1",
    ],
    ["T-13.2", "Implementar las consultas de listado y detalle de asociaciones.", "Harry", "1"],
    ["T-13.3", "Implementar las consultas de listado y detalle de clubes.", "Harry", "0.75"],
    [
      "T-13.4",
      "Implementar la consulta de las actividades que organiza cada asociación o club.",
      "Juan Gabriel",
      "0.75",
    ],
    [
      "T-13.5",
      "Ampliar los datos de prueba con asociaciones y clubes de distintos casos.",
      "Harry",
      "0.5",
    ],
    ["T-13.6", "Realizar pruebas de las consultas de asociaciones y clubes.", "Ambos", "0.5"],
  ]),

  h2("5.2. HU-14 - Sección de asociaciones"),
  p(
    "Historia: Como estudiante, quiero consultar las asociaciones estudiantiles y abrir el detalle de cada una, para conocer qué hacen, quiénes las integran y cómo contactarlas."
  ),
  spacer(),
  ficha("Alta", 8, "5.25 h", "Juan Gabriel Gualim"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "El listado presenta las asociaciones activas en orden alfabético, con su nombre, su imagen y un resumen de su descripción."
  ),
  bullet("El listado puede buscarse y se recorre por páginas cuando hay más de las que caben."),
  bullet(
    "Cuando no hay asociaciones que mostrar, la pantalla presenta un estado vacío con una explicación."
  ),
  bullet(
    "El detalle presenta la descripción, la misión y la visión de la asociación, omitiendo los bloques que no tengan información registrada."
  ),
  bullet(
    "El detalle presenta la junta directiva con el nombre, el cargo y el periodo de cada integrante, y sus iniciales cuando no hay fotografía."
  ),
  bullet(
    "El detalle presenta el correo y la información de contacto, y las redes sociales como enlaces externos seguros."
  ),
  bullet("Una asociación que no existe o que está inactiva no es accesible desde su dirección."),
  bullet("El listado y el detalle se visualizan correctamente en computadora, tableta y teléfono."),
  spacer(),
  tareas([
    [
      "T-14.1",
      "Implementar la tarjeta de organización reutilizable a partir del prototipo.",
      "Juan Gabriel",
      "1",
    ],
    [
      "T-14.2",
      "Implementar la pantalla de listado de asociaciones con su buscador y su paginación.",
      "Juan Gabriel",
      "1.5",
    ],
    [
      "T-14.3",
      "Implementar la página de detalle de la asociación con su descripción, misión y visión.",
      "Harry",
      "1",
    ],
    [
      "T-14.4",
      "Implementar la presentación de la junta directiva y sus integrantes.",
      "Juan Gabriel",
      "1",
    ],
    [
      "T-14.5",
      "Implementar el bloque de contacto y de redes sociales del detalle.",
      "Juan Gabriel",
      "0.5",
    ],
    [
      "T-14.6",
      "Verificar el listado y el detalle en computadora y en dispositivos móviles.",
      "Ambos",
      "0.25",
    ],
  ]),

  h2("5.3. HU-15 - Sección de clubes y vinculación con sus actividades"),
  p(
    "Historia: Como estudiante, quiero consultar los clubes estudiantiles y ver qué actividades organiza cada asociación y cada club, para decidir a cuál acercarme según lo que hacen."
  ),
  spacer(),
  ficha("Alta", 5, "4 h", "Juan Gabriel Gualim"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "El listado de clubes y el detalle de cada club reutilizan los componentes de la sección de asociaciones."
  ),
  bullet(
    "El detalle del club presenta sus actividades habituales, su contacto y sus redes sociales."
  ),
  bullet(
    "La página de una asociación o de un club presenta las actividades publicadas que organiza, separadas en próximas y pasadas."
  ),
  bullet(
    "Cuando el organizador no tiene actividades publicadas, la sección lo indica en lugar de quedar vacía."
  ),
  bullet(
    "Los organizadores de un evento enlazan a su página de detalle, tanto en la tarjeta como en la vista del evento."
  ),
  bullet(
    "Un organizador que es una unidad de la universidad y no una asociación ni un club se presenta como texto, sin enlace."
  ),
  bullet(
    "Las secciones de asociaciones y clubes son alcanzables desde el menú principal, los accesos rápidos y el pie de página."
  ),
  spacer(),
  tareas([
    ["T-15.1", "Implementar la pantalla de listado de clubes.", "Juan Gabriel", "1"],
    [
      "T-15.2",
      "Implementar la página de detalle del club con sus actividades habituales.",
      "Juan Gabriel",
      "1",
    ],
    ["T-15.3", "Integrar las actividades del organizador en su página de detalle.", "Harry", "1"],
    ["T-15.4", "Enlazar los organizadores del evento a su página correspondiente.", "Harry", "0.5"],
    [
      "T-15.5",
      "Enlazar asociaciones y clubes desde el menú, los accesos rápidos y el pie.",
      "Juan Gabriel",
      "0.25",
    ],
    [
      "T-15.6",
      "Realizar pruebas de las actividades vinculadas a cada organizador.",
      "Ambos",
      "0.25",
    ],
  ]),

  h2("5.4. HU-16 - Administración de asociaciones y clubes"),
  p(
    "Historia: Como administrador de AEUVG, quiero crear, editar y dar de baja las asociaciones y los clubes desde el panel administrativo, para mantener actualizada su información sin depender del equipo de desarrollo."
  ),
  spacer(),
  ficha("Alta", 13, "6.5 h", "Harry Méndez"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "El panel presenta el listado de asociaciones y de clubes, incluyendo los inactivos, y permite buscarlos."
  ),
  bullet(
    "El administrador puede crear y editar una asociación indicando nombre, descripción, misión, visión, correo, información de contacto e imagen."
  ),
  bullet(
    "El administrador puede crear y editar un club indicando nombre, descripción, actividades, correo, información de contacto e imagen."
  ),
  bullet(
    "El sistema valida los campos obligatorios y rechaza un nombre repetido con un mensaje claro."
  ),
  bullet(
    "El administrador puede registrar, editar y quitar integrantes de la junta directiva, con su cargo, su periodo, su fotografía y su orden de presentación."
  ),
  bullet(
    "El administrador puede registrar y quitar las redes sociales de una asociación o de un club, y solo se aceptan enlaces http y https."
  ),
  bullet(
    "Dar de baja una asociación o un club la retira de las pantallas públicas sin borrar su historial, y la eliminación definitiva solo se permite cuando no organiza ningún evento."
  ),
  bullet(
    "Las operaciones de administración solo están disponibles para el rol de administrador, tanto en la interfaz como en los servicios."
  ),
  spacer(),
  tareas([
    [
      "T-16.1",
      "Implementar el servicio de creación y edición de asociaciones con sus validaciones.",
      "Harry",
      "1.5",
    ],
    [
      "T-16.2",
      "Implementar el servicio de clubes y los endpoints de administración protegidos por rol.",
      "Harry",
      "1.25",
    ],
    [
      "T-16.3",
      "Implementar la administración de la junta directiva y de las redes sociales.",
      "Harry",
      "1.25",
    ],
    [
      "T-16.4",
      "Implementar los listados del panel de asociaciones y clubes con sus acciones.",
      "Juan Gabriel",
      "0.75",
    ],
    [
      "T-16.5",
      "Implementar los formularios de creación y edición de asociaciones y clubes.",
      "Juan Gabriel",
      "1.25",
    ],
    [
      "T-16.6",
      "Realizar pruebas de las validaciones y de los permisos de administración.",
      "Ambos",
      "0.5",
    ],
  ]),

  h2("5.5. HU-17 - Perfil del estudiante"),
  p(
    "Historia: Como estudiante, quiero consultar y editar mi perfil, para revisar los datos con los que la plataforma me identifica y mantener actualizada mi información de contacto."
  ),
  spacer(),
  ficha("Alta", 8, "4.25 h", "Harry Méndez"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "El perfil presenta el nombre, el carnet, el correo institucional, la carrera, la facultad y el teléfono del estudiante."
  ),
  bullet("El perfil indica el estado de la cuenta y si el correo se encuentra verificado."),
  bullet("El estudiante puede editar su teléfono y su carrera."),
  bullet(
    "El carnet, el nombre y el correo institucional se presentan como información de solo lectura, con una nota que explica a quién corresponde corregirlos."
  ),
  bullet(
    "El sistema valida el formato del teléfono y que la carrera seleccionada exista y esté activa."
  ),
  bullet("El perfil solo es accesible con sesión iniciada y cada quien solo alcanza el propio."),
  bullet("El perfil se visualiza correctamente en computadora, tableta y teléfono."),
  spacer(),
  tareas([
    [
      "T-17.1",
      "Implementar las consultas del perfil: datos personales, carnet, carrera y facultad.",
      "Harry",
      "0.75",
    ],
    ["T-17.2", "Implementar el servicio de edición del perfil con sus validaciones.", "Harry", "1"],
    ["T-17.3", "Exponer el endpoint de actualización del perfil.", "Harry", "0.5"],
    ["T-17.4", "Implementar la pantalla del perfil con sus secciones.", "Juan Gabriel", "1"],
    [
      "T-17.5",
      "Implementar el formulario de edición de los datos del perfil.",
      "Juan Gabriel",
      "0.75",
    ],
    ["T-17.6", "Realizar pruebas de las validaciones del perfil.", "Ambos", "0.25"],
  ]),

  h2("5.6. HU-18 - Eventos guardados y redes sociales de AEUVG"),
  p(
    "Historia: Como estudiante, quiero guardar los eventos que me interesan y consultarlos desde mi perfil, para no perder de vista las actividades a las que pienso asistir."
  ),
  spacer(),
  ficha("Media", 5, "3.5 h", "Juan Gabriel Gualim"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet("El estudiante puede guardar y quitar un evento desde la tarjeta y desde su detalle."),
  bullet("El control indica si el evento ya está guardado y no exige recargar la página."),
  bullet(
    "Guardar un evento sin sesión iniciada lleva al inicio de sesión y, al volver, el estudiante regresa a la pantalla en la que estaba."
  ),
  bullet("Guardar dos veces el mismo evento no produce un registro duplicado ni un error."),
  bullet(
    "El perfil presenta los eventos guardados, con los próximos antes que los ya finalizados."
  ),
  bullet(
    "Un evento cancelado o retirado deja de aparecer entre los guardados, sin que el estudiante tenga que quitarlo."
  ),
  bullet(
    "Las redes sociales oficiales de AEUVG están accesibles desde el pie de página y desde la página institucional."
  ),
  spacer(),
  tareas([
    ["T-18.1", "Implementar el servicio de guardar y quitar eventos del perfil.", "Harry", "0.75"],
    ["T-18.2", "Exponer el endpoint de eventos guardados protegido por sesión.", "Harry", "0.5"],
    [
      "T-18.3",
      "Implementar el control de guardar evento en la tarjeta y en el detalle.",
      "Juan Gabriel",
      "0.75",
    ],
    [
      "T-18.4",
      "Implementar la sección de eventos guardados dentro del perfil.",
      "Juan Gabriel",
      "0.75",
    ],
    [
      "T-18.5",
      "Integrar las redes sociales de AEUVG en el pie y en la página institucional.",
      "Juan Gabriel",
      "0.5",
    ],
    [
      "T-18.6",
      "Verificar el sprint completo y actualizar la documentación técnica.",
      "Ambos",
      "0.25",
    ],
  ]),

  h1("6. Resumen del sprint"),
  h2("6.1. Resumen de historias"),
  spacer(),
  makeTable(
    [1100, 4860, 1100, 1100, 1200],
    ["ID", "Historia de usuario", "Tareas", "Puntos", "Horas"],
    [
      ["HU-13", "Servicios de consulta de asociaciones y clubes", "6", "5", "4.5"],
      ["HU-14", "Sección de asociaciones", "6", "8", "5.25"],
      ["HU-15", "Sección de clubes y vinculación con sus actividades", "6", "5", "4"],
      ["HU-16", "Administración de asociaciones y clubes", "6", "13", "6.5"],
      ["HU-17", "Perfil del estudiante", "6", "8", "4.25"],
      ["HU-18", "Eventos guardados y redes sociales de AEUVG", "6", "5", "3.5"],
      ["", "Total", "36", "44", "28"],
    ]
  ),

  h2("6.2. Distribución del trabajo por integrante"),
  spacer(),
  makeTable(
    [3400, 2000, 2000, 1960],
    ["Integrante", "Tareas asignadas", "Horas estimadas", "Porcentaje"],
    [
      ["Harry Daniel Méndez Mendoza", "15", "13.25 h", "47%"],
      ["Juan Gabriel Gualim Molina", "15", "12.75 h", "46%"],
      ["Trabajo conjunto", "6", "2 h", "7%"],
      ["Total", "36", "28 h", "100%"],
    ]
  ),
  spacer(),
  p(
    "El trabajo conjunto corresponde a las tareas de prueba de cada historia y a la verificación final del sprint, que se realizan con ambos integrantes para que quien no escribió el código revise su comportamiento. El reparto queda más parejo que en el Sprint 2 porque este sprint tiene menos trabajo de base de datos y más pantallas públicas."
  ),

  h2("6.3. Cronograma del sprint"),
  spacer(),
  makeTable(
    [1400, 1800, 3900, 2260],
    ["Semana", "Fechas", "Trabajo principal", "Hito"],
    [
      [
        "Semana 1",
        "23/09 - 29/09",
        "HU-13 completa. HU-14: tarjeta de organización, listado, detalle, junta directiva y redes sociales.",
        "Sección de asociaciones publicada en el ambiente de pruebas.",
      ],
      [
        "Semana 2",
        "30/09 - 06/10",
        "HU-15, HU-16, HU-17 y HU-18 completas.",
        "Secciones de clubes y perfil publicadas, con la administración de asociaciones y clubes en el panel.",
      ],
    ]
  ),

  h2("6.4. Carga de trabajo estimada"),
  p(
    "El Sprint 3 comprende 28 horas de trabajo de equipo, equivalentes a aproximadamente 14 horas por integrante durante las dos semanas. La carga es menor que la del Sprint 2 porque el módulo de eventos dejó resueltos los componentes de listado, paginación, estado vacío, carga de imágenes y protección de servicios por rol, de modo que este sprint los reutiliza en lugar de volver a construirlos."
  ),
  p(
    "El orden de ejecución sigue la numeración de las historias. La sección de clubes se construye después de la de asociaciones, y no en paralelo, porque reutiliza sus mismos componentes: adelantarla obligaría a escribirlos dos veces. En caso de que la carga académica no permita alcanzar las horas estimadas, la historia HU-18 es la de menor prioridad y la parte de eventos guardados puede trasladarse al Sprint 4, dado que no condiciona ninguna otra funcionalidad del proyecto."
  ),

  h1("7. Definición de terminado"),
  p(
    "Una historia de usuario del Sprint 3 se considerará terminada cuando cumpla con lo siguiente:"
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
  bullet("Servicios de consulta de asociaciones y clubes, con su búsqueda sin acentos."),
  bullet("Sección de asociaciones con su listado y su página de detalle."),
  bullet("Sección de clubes con su listado y su página de detalle."),
  bullet(
    "Actividades de cada organizador dentro de su página, y organizadores enlazados desde los eventos."
  ),
  bullet(
    "Secciones de asociaciones y clubes del panel administrativo, con la junta directiva y las redes sociales."
  ),
  bullet("Perfil del estudiante con la edición de sus datos editables."),
  bullet("Eventos guardados, con su control en la tarjeta y su sección en el perfil."),
  bullet("Redes sociales oficiales de AEUVG en el pie de página y en la página institucional."),
  bullet("Documento de desarrollo del Sprint 3 y registro de tiempos de ambos integrantes."),

  h1("9. Riesgos del sprint"),
  spacer(),
  makeTable(
    [3100, 3100, 3160],
    ["Riesgo", "Impacto", "Acción preventiva"],
    [
      [
        "AEUVG no entrega a tiempo la información de las asociaciones y clubes del campus.",
        "Las secciones se publicarían sin contenido real que mostrar.",
        "Trabajar con los datos de prueba y dejar la administración lista para que AEUVG cargue su propia información durante la revisión del sprint.",
      ],
      [
        "Las juntas directivas de las asociaciones cambian de periodo durante el proyecto.",
        "La información quedaría desactualizada sin forma de corregirla.",
        "Administrar los integrantes con su periodo y su estado, de modo que una junta anterior pueda retirarse de la vista sin borrar su registro.",
      ],
      [
        "Las fotografías de los integrantes no están disponibles para todas las asociaciones.",
        "Las tarjetas de la junta directiva se verían incompletas.",
        "Reutilizar la presentación por iniciales de la página institucional, ya resuelta en el Sprint 2.",
      ],
      [
        "Eliminar una asociación o un club que organiza eventos rompería su historial.",
        "Pérdida de información de actividades ya realizadas.",
        "Permitir la baja lógica como operación habitual y restringir la eliminación definitiva a los registros que no organizan ningún evento.",
      ],
      [
        "Carga académica del equipo durante las dos semanas del sprint.",
        "No completar la totalidad de las historias comprometidas.",
        "Priorizar las historias HU-13 a HU-17 y trasladar los eventos guardados de la historia HU-18 al Sprint 4 de ser necesario.",
      ],
    ]
  ),
]);

const out = path.join(__dirname, "..", "..", "Documentos", "AEUVG - Planificacion Sprint 3.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("Documento generado:", out);
});
