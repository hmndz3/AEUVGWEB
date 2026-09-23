// Genera Documentos/AEUVG - Planificacion Sprint 2.docx
// Uso: node scripts/docs/planificacion-sprint2.js
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
    subtitle: "Planificación del Sprint 2",
    date: "Guatemala, 10 de septiembre del 2026",
  }),

  h1("1. Introducción"),
  p(
    "El presente documento describe la planificación detallada del Sprint 2 del proyecto de la plataforma web de la Asociación General de Estudiantes de la Universidad del Valle de Guatemala (AEUVG). Complementa el documento de planificación general de sprints, en el cual se define la distribución del trabajo a lo largo de los seis sprints del proyecto."
  ),
  p(
    "El Sprint 2 corresponde al módulo de eventos, que constituye la funcionalidad principal de consulta para el estudiantado y el primer módulo funcional que se construye sobre la base establecida durante el Sprint 1."
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
      ["Sprint", "Sprint 2 - Eventos y calendario"],
      ["Fecha de inicio", "Miércoles 9 de septiembre de 2026"],
      ["Fecha de finalización", "Martes 22 de septiembre de 2026"],
      ["Duración", "2 semanas"],
      ["Equipo", "Harry Daniel Méndez Mendoza y Juan Gabriel Gualim Molina"],
      ["Historias de usuario", "6"],
      ["Tareas", "36"],
      ["Puntos de historia", "44"],
      ["Horas estimadas de equipo", "34 horas"],
      ["Revisión de sprint", "Martes 22 de septiembre de 2026"],
    ]
  ),
  spacer(),
  p(
    "La estimación en horas de este sprint se ajustó a la capacidad real observada durante el Sprint 1, que fue de 30.1 horas de equipo frente a las 102.5 horas estimadas inicialmente. La diferencia no correspondió a trabajo pendiente, ya que las seis historias se completaron, sino a una sobreestimación de las horas necesarias por punto de historia. Los puntos se mantienen como medida de tamaño relativo y las horas se estiman ahora a partir de la velocidad medida."
  ),

  h1("3. Objetivo del sprint"),
  p(
    "Dejar publicado el módulo de eventos completo: el estudiantado debe poder consultar los próximos eventos, abrir el detalle de cada uno, revisarlos en un calendario con vista mensual y semanal, filtrarlos y buscarlos; y AEUVG debe poder crear, editar, publicar y eliminar sus eventos desde el panel administrativo, incluyendo la imagen de cada actividad."
  ),
  p(
    "Al finalizar el sprint, los espacios de actividades destacadas y próximos eventos que quedaron preparados en la página principal durante el Sprint 1 mostrarán información real administrada por AEUVG."
  ),

  h1("4. Alcance del sprint"),
  h2("4.1. Trabajo incluido"),
  bullet("Catálogo de categorías de eventos y clasificación por tipo de actividad."),
  bullet("Listado de próximos eventos y vista de detalle de cada evento."),
  bullet("Calendario de eventos con vista mensual y semanal."),
  bullet(
    "Filtros por fecha, categoría, tipo de actividad, asociación y club, y buscador de eventos."
  ),
  bullet("Administración de eventos: creación, edición, publicación, cancelación y eliminación."),
  bullet("Carga de imágenes de los eventos."),
  bullet("Integración de los eventos destacados y próximos en la página principal."),

  h2("4.2. Trabajo no incluido"),
  bullet("Páginas de detalle de asociaciones y clubes, correspondientes al Sprint 3."),
  bullet("Guardar eventos en el perfil del usuario, correspondiente al Sprint 3."),
  bullet("Módulo de horas beca, correspondiente a los sprints 4 y 5."),
  bullet("Tutorías, tutores y postulaciones, correspondientes al Sprint 6."),
  bullet("Notificaciones y recordatorios de eventos, correspondientes al Sprint 6."),
  bullet(
    "Inscripción de estudiantes a los eventos: el requerimiento de AEUVG contempla la consulta de actividades, no el control de asistencia."
  ),

  h1("5. Historias de usuario del Sprint 2"),
  p(
    "A continuación se presentan las 6 historias de usuario comprometidas para el Sprint 2, cada una con su descripción, criterios de aceptación y tareas correspondientes. En total, el sprint comprende 36 tareas. La numeración continúa la del Sprint 1."
  ),

  h2("5.1. HU-07 - Catálogo de eventos y servicios de consulta"),
  p(
    "Historia: Como equipo de desarrollo, necesito el catálogo de eventos y los servicios de consulta implementados sobre el modelo de datos existente, para que todas las pantallas del módulo lean la misma información y con el mismo criterio."
  ),
  spacer(),
  ficha("Alta", 5, "5 h", "Harry Méndez"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "El catálogo de categorías de eventos se encuentra cargado y cada categoría tiene su color asignado."
  ),
  bullet(
    "Los eventos se clasifican por tipo de actividad: académica, recreativa, voluntariado u otro."
  ),
  bullet(
    "Existen consultas de listado, de detalle y de rango de fechas que únicamente devuelven eventos publicados al público general."
  ),
  bullet(
    "El estado visible del evento se deriva de sus fechas y de su estado almacenado: próximo, en curso, finalizado o cancelado."
  ),
  bullet("Las fechas se presentan en el formato y la zona horaria de Guatemala."),
  bullet("Existe información de prueba con eventos de distintas categorías, fechas y estados."),
  spacer(),
  tareas([
    [
      "T-07.1",
      "Ampliar el catálogo de categorías de eventos y revisar su correspondencia con los tipos de actividad.",
      "Harry",
      "1",
    ],
    ["T-07.2", "Implementar la migración de los índices de búsqueda de eventos.", "Harry", "1"],
    [
      "T-07.3",
      "Implementar las consultas de eventos: listado, detalle y rango de fechas.",
      "Harry",
      "1.5",
    ],
    [
      "T-07.4",
      "Implementar la derivación del estado visible del evento y el formato de sus fechas.",
      "Juan Gabriel",
      "0.5",
    ],
    [
      "T-07.5",
      "Ampliar los datos de prueba con eventos de distintas categorías y estados.",
      "Harry",
      "0.5",
    ],
    [
      "T-07.6",
      "Realizar pruebas de las consultas y del estado visible de los eventos.",
      "Ambos",
      "0.5",
    ],
  ]),

  h2("5.2. HU-08 - Listado de eventos y vista de detalle"),
  p(
    "Historia: Como estudiante, quiero consultar el listado de los próximos eventos y abrir el detalle de cada uno, para decidir en cuáles quiero participar."
  ),
  spacer(),
  ficha("Alta", 8, "7 h", "Juan Gabriel Gualim"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet("El listado presenta los eventos publicados ordenados del más próximo al más lejano."),
  bullet("Cada evento muestra su nombre, categoría, fecha, hora, ubicación y organizadores."),
  bullet(
    "El listado se recorre por páginas cuando hay más eventos de los que caben en la pantalla."
  ),
  bullet(
    "Cuando no hay eventos que mostrar, la pantalla presenta un estado vacío con una explicación y no una lista en blanco."
  ),
  bullet(
    "El detalle del evento presenta su descripción, información adicional, cupo, imagen y organizadores."
  ),
  bullet("Un evento que no existe o que no está publicado no es accesible desde su dirección."),
  bullet("El listado y el detalle se visualizan correctamente en computadora, tableta y teléfono."),
  spacer(),
  tareas([
    [
      "T-08.1",
      "Implementar la tarjeta de evento reutilizable a partir del prototipo.",
      "Juan Gabriel",
      "1.5",
    ],
    [
      "T-08.2",
      "Implementar la pantalla de listado de próximos eventos con su paginación.",
      "Juan Gabriel",
      "2",
    ],
    ["T-08.3", "Implementar el estado vacío del listado de eventos.", "Juan Gabriel", "0.5"],
    [
      "T-08.4",
      "Implementar la vista de detalle del evento con su información y sus organizadores.",
      "Harry",
      "2",
    ],
    ["T-08.5", "Exponer el endpoint público de consulta de eventos.", "Harry", "0.5"],
    [
      "T-08.6",
      "Verificar el listado y el detalle en computadora y en dispositivos móviles.",
      "Ambos",
      "0.5",
    ],
  ]),

  h2("5.3. HU-09 - Calendario de eventos"),
  p(
    "Historia: Como estudiante, quiero ver los eventos en un calendario con vista mensual y semanal, para ubicar rápidamente las actividades de una fecha concreta."
  ),
  spacer(),
  ficha("Alta", 8, "6.5 h", "Juan Gabriel Gualim"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "El calendario ofrece una vista mensual y una vista semanal, y permite alternar entre ambas."
  ),
  bullet("La semana inicia el domingo, conforme al uso local."),
  bullet(
    "El usuario puede avanzar y retroceder entre meses o semanas, y regresar al periodo actual."
  ),
  bullet(
    "El periodo y la vista seleccionados se conservan en la dirección, de modo que el enlace pueda compartirse."
  ),
  bullet("Cada día muestra los eventos que ocurren en él, y cada evento enlaza a su detalle."),
  bullet("Un evento de varios días aparece en todos los días que abarca."),
  bullet("El calendario se visualiza correctamente en dispositivos móviles."),
  spacer(),
  tareas([
    [
      "T-09.1",
      "Implementar la construcción de la grilla mensual y de la vista semanal.",
      "Harry",
      "1.5",
    ],
    [
      "T-09.2",
      "Implementar la pantalla del calendario con el cambio entre vista mensual y semanal.",
      "Juan Gabriel",
      "2",
    ],
    [
      "T-09.3",
      "Implementar la navegación entre periodos y la conservación del estado en la dirección.",
      "Juan Gabriel",
      "1",
    ],
    [
      "T-09.4",
      "Implementar la presentación de los eventos dentro de cada día y su enlace al detalle.",
      "Juan Gabriel",
      "1",
    ],
    [
      "T-09.5",
      "Implementar la versión para dispositivos móviles del calendario.",
      "Juan Gabriel",
      "0.5",
    ],
    [
      "T-09.6",
      "Realizar pruebas de la construcción del calendario y de la navegación entre periodos.",
      "Ambos",
      "0.5",
    ],
  ]),

  h2("5.4. HU-10 - Filtros y buscador de eventos"),
  p(
    "Historia: Como estudiante, quiero filtrar y buscar los eventos, para encontrar las actividades que me interesan sin recorrer todo el listado."
  ),
  spacer(),
  ficha("Media", 5, "5 h", "Harry Méndez"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet(
    "Los eventos pueden filtrarse por rango de fechas, categoría, tipo de actividad, asociación y club."
  ),
  bullet(
    "El buscador encuentra eventos por nombre, descripción y ubicación, sin distinguir mayúsculas ni acentos."
  ),
  bullet("Los filtros se combinan entre sí y con el buscador."),
  bullet(
    "Los filtros aplicados se conservan en la dirección y pueden limpiarse con una sola acción."
  ),
  bullet("Un parámetro inválido no produce un error: se descarta y el listado se presenta sin él."),
  bullet("Cuando ningún evento coincide, la pantalla lo indica y ofrece limpiar los filtros."),
  spacer(),
  tareas([
    ["T-10.1", "Definir y validar los parámetros de filtrado y búsqueda.", "Harry", "1"],
    [
      "T-10.2",
      "Implementar la traducción de los filtros a la consulta de la base de datos.",
      "Harry",
      "1.5",
    ],
    ["T-10.3", "Implementar el buscador por nombre, descripción y ubicación.", "Harry", "0.5"],
    ["T-10.4", "Implementar la barra de filtros de la pantalla de eventos.", "Juan Gabriel", "1"],
    [
      "T-10.5",
      "Implementar el resumen de los filtros aplicados y su limpieza.",
      "Juan Gabriel",
      "0.5",
    ],
    ["T-10.6", "Realizar pruebas de los filtros y del buscador.", "Ambos", "0.5"],
  ]),

  h2("5.5. HU-11 - Administración de eventos"),
  p(
    "Historia: Como administrador de AEUVG, quiero crear, editar, publicar y eliminar los eventos desde el panel administrativo, para mantener actualizada la información que consulta el estudiantado sin depender del equipo de desarrollo."
  ),
  spacer(),
  ficha("Alta", 13, "7.5 h", "Harry Méndez"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet("El panel presenta el listado de todos los eventos con su estado y permite filtrarlos."),
  bullet(
    "El administrador puede crear un evento indicando nombre, descripción, categoría, tipo de actividad, fechas, ubicación, cupo, información adicional y organizadores."
  ),
  bullet(
    "El sistema valida que la fecha de finalización no sea anterior a la de inicio y que los campos obligatorios estén completos."
  ),
  bullet(
    "Un evento nuevo se crea como borrador y no es visible para el estudiantado hasta que se publica."
  ),
  bullet(
    "El administrador puede publicar, cancelar y eliminar eventos, y la eliminación solicita confirmación."
  ),
  bullet("Un evento cancelado deja de aparecer en el listado público y en el calendario."),
  bullet(
    "Las operaciones de administración solo están disponibles para el rol de administrador, tanto en la interfaz como en los servicios."
  ),
  spacer(),
  tareas([
    [
      "T-11.1",
      "Implementar el servicio de creación y edición de eventos con sus validaciones.",
      "Harry",
      "2",
    ],
    [
      "T-11.2",
      "Implementar la publicación, la cancelación y la eliminación de eventos.",
      "Harry",
      "1.5",
    ],
    ["T-11.3", "Implementar los endpoints de administración protegidos por rol.", "Harry", "1"],
    [
      "T-11.4",
      "Implementar el listado administrativo de eventos con sus acciones.",
      "Juan Gabriel",
      "1.5",
    ],
    ["T-11.5", "Implementar el formulario de creación y edición de eventos.", "Juan Gabriel", "1"],
    [
      "T-11.6",
      "Realizar pruebas de las validaciones y de los permisos de administración.",
      "Ambos",
      "0.5",
    ],
  ]),

  h2("5.6. HU-12 - Imágenes de los eventos e integración en la página principal"),
  p(
    "Historia: Como administrador de AEUVG, quiero subir la imagen de cada evento y que los eventos destacados aparezcan en la página principal, para que las actividades se presenten con su material gráfico desde la portada del sitio."
  ),
  spacer(),
  ficha("Media", 5, "3 h", "Juan Gabriel Gualim"),
  spacer(),
  p("Criterios de aceptación:"),
  bullet("El administrador puede subir la imagen de un evento desde el formulario."),
  bullet(
    "El sistema acepta únicamente imágenes JPEG, PNG y WebP, y rechaza los archivos que superen el tamaño máximo definido."
  ),
  bullet(
    "El almacenamiento de las imágenes es externo al servidor de la aplicación, dado que su sistema de archivos es efímero."
  ),
  bullet(
    "Los eventos sin imagen se presentan con un marcador de la paleta y no con un espacio roto."
  ),
  bullet(
    "La página principal muestra las actividades destacadas y los próximos eventos reales, con enlace a su detalle."
  ),
  bullet(
    "Los accesos rápidos y el menú principal enlazan a las secciones de eventos y de calendario."
  ),
  spacer(),
  tareas([
    [
      "T-12.1",
      "Implementar el proveedor de almacenamiento de imágenes y su configuración por ambiente.",
      "Harry",
      "1",
    ],
    ["T-12.2", "Implementar la validación de formato y de tamaño de las imágenes.", "Harry", "0.5"],
    [
      "T-12.3",
      "Implementar la carga de la imagen desde el formulario de eventos.",
      "Juan Gabriel",
      "0.5",
    ],
    [
      "T-12.4",
      "Integrar los eventos destacados y los próximos eventos en la página principal.",
      "Juan Gabriel",
      "0.5",
    ],
    [
      "T-12.5",
      "Enlazar las secciones de eventos y calendario desde los accesos rápidos y el menú.",
      "Juan Gabriel",
      "0.25",
    ],
    [
      "T-12.6",
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
      ["HU-07", "Catálogo de eventos y servicios de consulta", "6", "5", "5"],
      ["HU-08", "Listado de eventos y vista de detalle", "6", "8", "7"],
      ["HU-09", "Calendario de eventos", "6", "8", "6.5"],
      ["HU-10", "Filtros y buscador de eventos", "6", "5", "5"],
      ["HU-11", "Administración de eventos", "6", "13", "7.5"],
      ["HU-12", "Imágenes de los eventos e integración en la página principal", "6", "5", "3"],
      ["", "Total", "36", "44", "34"],
    ]
  ),

  h2("6.2. Distribución del trabajo por integrante"),
  spacer(),
  makeTable(
    [3400, 2000, 2000, 1960],
    ["Integrante", "Tareas asignadas", "Horas estimadas", "Porcentaje"],
    [
      ["Harry Daniel Méndez Mendoza", "15", "17 h", "50%"],
      ["Juan Gabriel Gualim Molina", "15", "14.25 h", "42%"],
      ["Trabajo conjunto", "6", "2.75 h", "8%"],
      ["Total", "36", "34 h", "100%"],
    ]
  ),
  spacer(),
  p(
    "El trabajo conjunto corresponde a las tareas de prueba de cada historia y a la verificación final del sprint, que se realizan con ambos integrantes para que quien no escribió el código revise su comportamiento."
  ),

  h2("6.3. Cronograma del sprint"),
  spacer(),
  makeTable(
    [1400, 1800, 3900, 2260],
    ["Semana", "Fechas", "Trabajo principal", "Hito"],
    [
      [
        "Semana 1",
        "09/09 - 15/09",
        "HU-07 completa. HU-08: tarjeta de evento, listado, estado vacío, detalle y endpoint público.",
        "Listado y detalle de eventos publicados en el ambiente de pruebas.",
      ],
      [
        "Semana 2",
        "16/09 - 22/09",
        "HU-10, HU-09, HU-11 y HU-12 completas.",
        "Módulo de eventos completo, con calendario, filtros y administración.",
      ],
    ]
  ),

  h2("6.4. Carga de trabajo estimada"),
  p(
    "El Sprint 2 comprende 34 horas de trabajo de equipo, equivalentes a aproximadamente 17 horas por integrante durante las dos semanas. La carga es considerablemente menor a la del Sprint 1 porque la configuración del proyecto, el diseño de la base de datos y el sistema de diseño no se repiten: este sprint construye funcionalidad sobre una base ya establecida."
  ),
  p(
    "El orden de ejecución no sigue la numeración de las historias. La historia HU-10 se adelanta a la HU-09 porque los filtros se apoyan en las mismas consultas de la historia HU-08 y permiten avanzar mientras se construye el calendario. En caso de que la carga académica no permita alcanzar las horas estimadas, la historia HU-12 es la de menor prioridad y su parte de carga de imágenes puede trasladarse al Sprint 3, dado que un evento puede publicarse sin imagen."
  ),

  h1("7. Definición de terminado"),
  p(
    "Una historia de usuario del Sprint 2 se considerará terminada cuando cumpla con lo siguiente:"
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
  bullet("Catálogo de categorías de eventos cargado y documentado."),
  bullet("Listado de próximos eventos y vista de detalle publicados."),
  bullet("Calendario de eventos con vista mensual y semanal."),
  bullet(
    "Filtros por fecha, categoría, tipo de actividad, asociación y club, y buscador de eventos."
  ),
  bullet(
    "Sección de eventos del panel administrativo, con creación, edición, publicación, cancelación y eliminación."
  ),
  bullet("Carga de imágenes de los eventos."),
  bullet("Página principal mostrando los eventos destacados y próximos reales."),
  bullet("Documento de desarrollo del Sprint 2 y registro de tiempos de ambos integrantes."),

  h1("9. Riesgos del sprint"),
  spacer(),
  makeTable(
    [3100, 3100, 3160],
    ["Riesgo", "Impacto", "Acción preventiva"],
    [
      [
        "AEUVG no entrega a tiempo la información de sus eventos reales.",
        "El módulo se publicaría sin contenido real que mostrar.",
        "Trabajar con los datos de prueba y capacitar a AEUVG durante la revisión del sprint para que cargue sus propios eventos.",
      ],
      [
        "El servicio de almacenamiento de imágenes no queda contratado dentro del sprint.",
        "Los eventos se publicarían sin imagen.",
        "Implementar el almacenamiento detrás de una interfaz configurable por ambiente, de modo que la funcionalidad no dependa de un proveedor concreto.",
      ],
      [
        "El calendario resulta más complejo de lo estimado en dispositivos móviles.",
        "Retraso en la historia HU-09.",
        "Separar la construcción de la grilla de su presentación, para poder probarla de forma independiente de la pantalla.",
      ],
      [
        "Crecimiento del consumo de recursos en Railway al aumentar las consultas.",
        "Incremento del costo mensual de operación.",
        "Crear los índices de búsqueda antes de implementar los filtros y limitar la cantidad de eventos por consulta.",
      ],
      [
        "Carga académica del equipo durante las dos semanas del sprint.",
        "No completar la totalidad de las historias comprometidas.",
        "Priorizar las historias HU-07 a HU-11 y trasladar la carga de imágenes de la historia HU-12 al Sprint 3 de ser necesario.",
      ],
    ]
  ),
]);

const out = path.join(__dirname, "..", "..", "Documentos", "AEUVG - Planificacion Sprint 2.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("Documento generado:", out);
});
