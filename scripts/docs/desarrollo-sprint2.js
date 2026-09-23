// Genera Documentos/AEUVG - Desarrollo Sprint 2.docx
// Uso: node scripts/docs/desarrollo-sprint2.js
const { Packer } = require("docx");
const fs = require("fs");
const path = require("path");
const { p, bullet, h1, h2, makeTable, spacer, cover, buildDocument } = require("./template");
const { bloquesRegistroTiempos } = require("./tiempos-sprint2");

const tiempos = bloquesRegistroTiempos(10);

const doc = buildDocument([
  ...cover({
    subtitle: "Documento de Desarrollo del Sprint 2",
    date: "Guatemala, 23 de septiembre del 2026",
  }),

  // ---------- 1 ----------
  h1("1. Introducción"),
  p(
    "El presente documento registra el desarrollo del Sprint 2 - Eventos y calendario (9 al 22 de septiembre de 2026) del proyecto de la plataforma web de la Asociación General de Estudiantes de la Universidad del Valle de Guatemala (AEUVG). Complementa la planificación del Sprint 2, documentando por cada historia de usuario el trabajo realizado y las decisiones tomadas durante su implementación."
  ),
  p(
    "El Sprint 2 construye el módulo de eventos, que es la funcionalidad principal de consulta para el estudiantado y el primer módulo funcional levantado sobre la base técnica establecida en el Sprint 1. Al cierre del sprint, AEUVG administra sus propios eventos desde el panel y el estudiantado los consulta en la cartelera, en el calendario y en la página principal."
  ),

  // ---------- 2. HU-07 ----------
  h1("2. HU-07 - Catálogo de eventos y servicios de consulta"),
  p(
    "El modelo de datos de eventos ya existía desde el Sprint 1, por lo que esta historia no volvió a diseñarlo: completó el catálogo de categorías, agregó los índices que necesitaban las consultas del sprint y construyó la capa de consulta sobre la que se apoyan todas las pantallas del módulo."
  ),

  h2("2.1. Catálogo de categorías"),
  p(
    "El catálogo pasó de ocho a diez categorías. Se agregaron torneo deportivo y conferencia o taller, que aparecían en el calendario de actividades entregado por AEUVG y no tenían dónde clasificarse. Se mantiene la separación entre categoría y tipo de actividad: la categoría es administrable y específica, mientras que el tipo de actividad conserva la clasificación general cerrada de académica, recreativa, voluntariado u otro."
  ),
  p(
    "Los colores de las categorías dejaron de ser provisionales. Cada una toma ahora una variante oscurecida de un acento del logo de AEUVG, tal como los define el sistema de diseño. Se oscurecieron porque el nombre de la categoría se muestra en blanco sobre el color, y los acentos en su tono original no alcanzan el contraste necesario para texto pequeño."
  ),

  h2("2.2. Índices de búsqueda"),
  p(
    "Se agregaron tres índices sobre la tabla de eventos antes de implementar los filtros, de modo que las consultas nuevas no recorrieran la tabla completa: estado con fecha de finalización, para el rango del calendario; estado con destacado y fecha de inicio, para las actividades destacadas de la portada; y tipo de actividad, para el filtro correspondiente. La decisión de crearlos primero responde a uno de los riesgos identificados en la planificación, el del consumo de recursos en Railway."
  ),

  h2("2.3. Consultas del módulo"),
  p(
    "Todas las pantallas leen los eventos a través de un mismo archivo de consultas. Esto evita que cada pantalla decida por su cuenta qué eventos mostrar, que es la forma más fácil de que un borrador termine visible en algún lugar del sitio. La regla es única y está escrita una sola vez: fuera del panel administrativo solo existen los eventos publicados."
  ),
  p(
    "Se implementaron tres consultas: el listado paginado, el detalle de un evento y el rango de fechas que usa el calendario. El listado considera próximo todo evento que no haya terminado, y no solo los que aún no empiezan, para que una actividad de varios días no desaparezca de la cartelera el mismo día en que inicia. La consulta de rango incluye los eventos que se cruzan con el periodo, no únicamente los que caben enteros dentro de él, y tiene un tope fijo de resultados para que una vista de calendario no pueda pedir toda la tabla."
  ),

  h2("2.4. Estado visible y fechas"),
  p(
    "El estado almacenado de un evento distingue borrador, publicado, cancelado y finalizado, pero nadie marca un evento como finalizado a mano cuando pasa su fecha. Por eso el estado que se le muestra al estudiante se deriva cada vez que se presenta: un evento publicado aparece como próximo, en curso o finalizado según sus fechas, mientras que la cancelación y el borrador prevalecen sobre ellas."
  ),
  p(
    "Las fechas se guardan en UTC y se presentan siempre en la zona horaria de Guatemala, sin importar la del navegador o la del servidor: un evento que empieza a las tres de la tarde en el campus debe leerse igual para todos. Guatemala no aplica horario de verano desde 2006, por lo que el desplazamiento se define una sola vez en el proyecto y se reutiliza desde ahí."
  ),

  h2("2.5. Información de prueba"),
  p(
    "El conjunto de datos ficticios pasó de tres a siete eventos, agregando uno cancelado, uno en borrador, uno de tres días de duración y uno con fecha lejana. Con ellos se pueden revisar sin base real los casos que antes no estaban cubiertos: que un cancelado no aparezca en la cartelera, que un borrador solo se vea desde el panel, que un evento de varios días se repita en el calendario y que el orden del listado sea el correcto."
  ),

  // ---------- 3. HU-08 ----------
  h1("3. HU-08 - Listado de eventos y vista de detalle"),
  p(
    "Esta historia construye la cartelera pública, que es la pantalla por la que el estudiantado entra al módulo."
  ),

  h2("3.1. Tarjeta de evento"),
  p(
    "La tarjeta de evento se implementó como un solo componente que se usa en la portada, en la cartelera y en los resultados de una búsqueda, de modo que un evento se vea igual en todo el sitio. Muestra la imagen, la categoría con su color, el nombre, la fecha y hora, la ubicación y los organizadores, con el organizador principal al frente. El estado solo se rotula cuando no es el esperado: un evento próximo no lleva etiqueta, mientras que uno en curso, finalizado o cancelado sí."
  ),

  h2("3.2. Listado y paginación"),
  p(
    "El listado presenta los eventos publicados que no han terminado, del más próximo al más lejano, en páginas de nueve. La paginación se resuelve con enlaces y no con estado del navegador: así cada página puede compartirse por su dirección y el contenido lo sigue generando el servidor, sin depender de que el JavaScript haya cargado."
  ),
  p(
    "El estado vacío se separó del listado porque el vacío tiene dos causas distintas y el mensaje no puede ser el mismo. Si AEUVG todavía no ha publicado nada, la pantalla lo explica y ofrece volver a la página principal; si son los filtros los que no dejan pasar ningún evento, ofrece limpiarlos."
  ),

  h2("3.3. Detalle del evento"),
  p(
    "El detalle presenta la descripción completa, la información adicional, el cupo, la imagen y los organizadores. Un evento que no existe, uno en borrador y uno cancelado responden exactamente igual: no existen para quien no administra la plataforma. Se agregó una pantalla propia para ese caso, con el mensaje correspondiente y el enlace de regreso a la cartelera, en lugar del error genérico del framework."
  ),

  h2("3.4. Servicio público"),
  p(
    "Se expusieron los puntos de acceso de listado y de detalle de eventos. No exigen sesión, porque la cartelera es contenido abierto del sitio, y solo devuelven eventos publicados. Llevan un minuto de caché compartida, suficiente para absorber los picos de navegación sin que un evento recién publicado tarde en aparecer."
  ),

  // ---------- 4. HU-09 ----------
  h1("4. HU-09 - Calendario de eventos"),
  p(
    "El calendario se construyó sin librerías externas, con los componentes del sistema de diseño. Una librería de calendarios habría resuelto la grilla, pero habría obligado a reestilizar por completo sus componentes para respetar la paleta de AEUVG y habría agregado peso al sitio; la grilla en sí es aritmética de fechas."
  ),

  h2("4.1. Separación entre la grilla y su presentación"),
  p(
    "Toda la aritmética quedó en un archivo aparte que construye el periodo y devuelve los días que lo componen, sin saber nada de la pantalla. Esta separación se decidió desde la planificación, como acción preventiva ante el riesgo de que el calendario resultara más complejo de lo estimado, y permitió probar la construcción de la grilla de forma independiente de la interfaz."
  ),
  p(
    "La vista mensual completa la primera y la última semana con días de los meses vecinos, para que las columnas siempre correspondan al mismo día de la semana, y marca esos días de relleno para presentarlos atenuados. La semana inicia el domingo, conforme al uso local. Las fechas se calculan sobre el día civil y no sobre la fecha local del servidor: de otro modo el calendario cambiaría de mes según dónde estuviera corriendo la aplicación."
  ),

  h2("4.2. Navegación y estado en la dirección"),
  p(
    "El periodo y la vista viajan en la dirección de la página en lugar de guardarse en el navegador. Así, el enlace de una semana concreta puede compartirse y la página la sigue generando el servidor. Una fecha manipulada en la dirección no produce un error: se descarta y el calendario muestra el periodo actual. La navegación entre meses se ancla al primer día del mes, de modo que avanzar desde el 31 de enero lleve a febrero y no a marzo."
  ),

  h2("4.3. Eventos dentro del calendario"),
  p(
    "Cada día muestra sus eventos con el color de su categoría y enlaza al detalle. Un evento de varios días aparece en todos los días que abarca, que es como se lee un calendario. La vista mensual muestra hasta tres eventos por casilla y resume el resto con un enlace al listado filtrado por ese día; la vista semanal, al disponer de más espacio, muestra también la hora y el lugar."
  ),

  h2("4.4. Versión para teléfono"),
  p(
    "Siete columnas no caben en el ancho de un teléfono sin volver ilegible cada casilla. En pantallas pequeñas el periodo se presenta como una agenda: los días con actividades, uno debajo de otro, con la hora y el lugar de cada evento. Se omiten los días vacíos, porque en esa vista no aportan estructura, solo desplazamiento."
  ),

  // ---------- 5. HU-10 ----------
  h1("5. HU-10 - Filtros y buscador de eventos"),
  p(
    "Esta historia se adelantó a la del calendario en el orden de ejecución, porque se apoya en las mismas consultas del listado y permitía avanzar mientras se construía la grilla."
  ),

  h2("5.1. Lectura de los filtros"),
  p(
    "Los filtros llegan en la dirección de la página, que puede escribir cualquiera, por lo que cada parámetro se valida por separado y el que no sea válido simplemente se descarta. Un filtro mal escrito no produce una pantalla de error: el estudiante ve el listado sin ese filtro. Un rango de fechas invertido conserva la fecha de inicio y descarta la de fin, en lugar de devolver una lista vacía sin explicación."
  ),
  p(
    "El rango de fechas se interpreta como cruce y no como contención: un evento entra si alguna parte de su duración cae dentro del rango. Las fechas del filtro son días de calendario y se convierten al instante que les corresponde en Guatemala antes de consultar; de otro modo, un evento de las siete de la noche quedaría fuera de su propio día. Indicar una fecha de inicio sustituye la ventana predeterminada de eventos que no han terminado, de manera que quien busque una actividad pasada pueda encontrarla."
  ),

  h2("5.2. Buscador"),
  p(
    "PostgreSQL puede ignorar mayúsculas al comparar texto, pero no acentos: buscar “musica” no encontraría “Semana de la Música”. Se evaluó instalar la extensión unaccent en la base de Railway y se descartó, para no depender de una extensión del motor. En su lugar, cada evento guarda una copia de su nombre, descripción y ubicación ya normalizada, sin acentos y en minúsculas, y la búsqueda compara contra ella. La copia se recalcula en cada creación y edición, por lo que no puede quedar desfasada, y la migración incluyó la carga inicial de los eventos ya existentes."
  ),

  h2("5.3. Presentación de los filtros"),
  p(
    "La barra de filtros es un formulario común, sin JavaScript propio: al enviarlo, el navegador arma la dirección y la página se vuelve a generar en el servidor. El resultado siempre es compartible por enlace y la pantalla sigue funcionando aunque el JavaScript no haya cargado. Debajo se muestran los filtros activos, cada uno con la opción de quitarlo por separado sin perder los demás, que es lo que se espera al ir afinando una búsqueda, además de la opción de limpiarlos todos."
  ),

  // ---------- 6. HU-11 ----------
  h1("6. HU-11 - Administración de eventos"),
  p(
    "Esta historia entrega a AEUVG el control de su propio contenido: hasta este sprint, publicar un evento habría requerido al equipo de desarrollo."
  ),

  h2("6.1. Servicio y validaciones"),
  p(
    "La lógica de creación y edición se implementó siguiendo la misma separación entre servicio y repositorio que usa la autenticación desde el Sprint 1, lo que permite probarla sin base de datos. El formulario se valida con el mismo esquema en el cliente y en el servidor, y se comprueba además contra la base lo que el esquema no puede saber por sí solo: que la categoría exista y esté activa, y que la asociación o el club seleccionados existan."
  ),
  p(
    "Se exige al menos un organizador, ya sea una asociación, un club o una unidad de UVG, porque sin él el estudiante no sabe a quién corresponde la actividad, que es justamente lo que AEUVG pidió dejar claro en cada evento. El primero que se indica queda como organizador principal y es el que encabeza la tarjeta. Cada organizador guarda una sola referencia, como exige la restricción de la tabla, y al editar un evento se reemplazan en bloque dentro de la misma transacción, de modo que no quede un estado intermedio sin organizador."
  ),

  h2("6.2. Estados de publicación"),
  p("Las transiciones siguen reglas explícitas:"),
  bullet("Todo evento nuevo se guarda como borrador; publicarlo es una decisión aparte."),
  bullet("Un evento finalizado no vuelve a publicarse ni puede cancelarse."),
  bullet("Un evento cancelado deja de aparecer en la cartelera, en el calendario y en la portada."),
  bullet(
    "Un evento publicado que ya inició no se elimina, solo se cancela: forma parte del historial de AEUVG y puede estar referenciado por los eventos guardados de los estudiantes, que se implementan en el Sprint 3."
  ),
  p(
    "Las tres acciones cambian lo que ve el estudiantado, por lo que ninguna se ejecuta desde el panel sin confirmación previa."
  ),

  h2("6.3. Servicios protegidos"),
  p(
    "Los puntos de acceso de administración se protegieron con el mismo mecanismo de roles del Sprint 1, que responde con un error de autenticación cuando no hay sesión y con un no encontrado cuando hay sesión pero no el rol, para no confirmarle a nadie que la ruta existe. La protección se reorganizó levemente para poder verificarla en las pruebas sin montar una petición ni una base de datos."
  ),

  h2("6.4. Pantallas del panel"),
  p(
    "La sección de eventos del panel dejó de ser un marcador y presenta el listado completo con su estado, filtros por estado, buscador y las acciones de publicar, cancelar y eliminar en cada fila. El formulario de creación y edición cubre todos los campos del evento. Las fechas se envían con el desplazamiento de Guatemala explícito: el campo del navegador entrega una hora sin zona y, sin indicarla, el servidor la interpretaría en la suya, guardando el evento con seis horas de diferencia."
  ),

  // ---------- 7. HU-12 ----------
  h1("7. HU-12 - Imágenes de los eventos e integración en la página principal"),

  h2("7.1. Almacenamiento de las imágenes"),
  p(
    "El sistema de archivos de Railway es efímero: cualquier despliegue borraría las imágenes que AEUVG hubiera subido, por lo que el almacenamiento tiene que ser externo. Para no depender de que el servicio estuviera contratado dentro del sprint, que era uno de los riesgos identificados en la planificación, la subida se implementó detrás de una interfaz con tres configuraciones posibles por ambiente: sin proveedor, un proveedor local que conserva la imagen en memoria para desarrollo, y la subida firmada a Cloudinary."
  ),
  p(
    "Cuando no hay proveedor configurado la plataforma sigue funcionando: el formulario acepta la dirección de una imagen externa y solo se deshabilita la subida de archivos. La subida pasa por el servidor y no directamente al proveedor, porque la clave del servicio no puede salir al navegador y porque así el formato y el tamaño se comprueban antes de gastar la cuota del plan contratado. Se aceptan JPEG, PNG y WebP hasta tres megabytes, límite bajo a propósito: la aplicación corre en el plan más pequeño de Railway y una subida grande ocuparía memoria del mismo proceso que atiende al resto del sitio."
  ),
  p(
    "Un evento sin imagen se presenta con un marcador del color de su categoría, de modo que siga siendo reconocible y no se vea como un espacio roto."
  ),

  h2("7.2. Página principal y navegación"),
  p(
    "Los espacios de actividades destacadas y próximos eventos que quedaron preparados en el Sprint 1 ahora muestran información real y enlazan al detalle de cada evento. La portada dejó de tener su propia consulta y su propia tarjeta: usa las mismas del módulo de eventos, para que un evento se vea igual y con el mismo criterio en los dos lugares. Las consultas de la portada conservan su tolerancia a fallos: si la base no responde, la sección se muestra vacía en lugar de tumbar la página principal."
  ),
  p(
    "El calendario se incorporó al menú principal y a los accesos rápidos, y tanto la cartelera como el calendario ofrecen el cambio entre ambas vistas, ya que son dos formas de leer la misma información."
  ),

  // ---------- 8 ----------
  h1("8. Pruebas y verificación"),
  p(
    "Las pruebas automatizadas del proyecto pasaron de 48 a 133. Las 85 nuevas corresponden al módulo de eventos y se ejecutan sin base de datos, sustituyendo el acceso a datos por dobles de prueba, para que puedan correrse en cualquier momento del desarrollo."
  ),
  spacer(),
  makeTable(
    [3400, 1400, 4560],
    ["Área", "Pruebas", "Qué se verifica"],
    [
      [
        "Consultas de eventos",
        "12",
        "Que solo se consulten eventos publicados, la paginación, el orden de los organizadores y el rango del calendario.",
      ],
      [
        "Estado visible y fechas",
        "12",
        "La derivación del estado según las fechas y la presentación en hora de Guatemala.",
      ],
      [
        "Filtros y buscador",
        "17",
        "El descarte de parámetros inválidos, la combinación de filtros y la búsqueda sin acentos.",
      ],
      [
        "Calendario",
        "16",
        "La construcción de la grilla, la navegación entre periodos y los eventos de varios días.",
      ],
      [
        "Administración",
        "22",
        "Las validaciones del formulario, las transiciones de estado y los permisos por rol.",
      ],
      [
        "Imágenes",
        "6",
        "Los formatos admitidos, el tamaño máximo y el proveedor local de desarrollo.",
      ],
    ]
  ),
  spacer(),
  p(
    "Además de las pruebas automatizadas se verificó que el proyecto compile sin errores de tipos, que el análisis estático no reporte problemas y que la compilación de producción se complete, incluyendo las nuevas rutas del módulo. Las pantallas se revisaron en anchos de teléfono, tableta y escritorio, lo que llevó a ajustar los títulos y los nombres largos de los eventos para que no produzcan desplazamiento horizontal."
  ),

  // ---------- 9 ----------
  h1("9. Estado del sprint"),
  p(
    `Las seis historias comprometidas para el Sprint 2 se encuentran completadas, con ${tiempos.enHoras(tiempos.totalEquipo)} horas de trabajo de equipo frente a las 34 estimadas. El detalle por sesión se encuentra en la sección 10. La plataforma cuenta ahora con:`
  ),
  bullet("El catálogo de categorías completo, con sus colores alineados al sistema de diseño."),
  bullet("La cartelera de eventos con su paginación, sus estados vacíos y su vista de detalle."),
  bullet("El calendario con vista mensual y semanal, y su versión de agenda para teléfono."),
  bullet(
    "Los filtros por fecha, categoría, tipo de actividad, asociación y club, y el buscador por nombre, descripción y ubicación."
  ),
  bullet(
    "La sección de eventos del panel administrativo, con creación, edición, publicación, cancelación y eliminación."
  ),
  bullet("La carga de imágenes de los eventos, configurable por ambiente."),
  bullet("La página principal mostrando las actividades destacadas y los próximos eventos reales."),
  p(
    "Queda pendiente de AEUVG la carga de sus eventos reales y la definición del servicio de imágenes que contratará; ninguna de las dos bloquea el sprint, ya que el módulo funciona con la información de prueba y sin proveedor de imágenes. Continúa también en gestión el trámite del dominio institucional iniciado en el Sprint 1."
  ),
  p(
    "El desarrollo continúa en el Sprint 3 con las secciones de asociaciones y clubes, el perfil de usuario y la función de guardar eventos, que se apoya directamente en el módulo entregado en este sprint."
  ),

  // ---------- 10. Registro de tiempos ----------
  ...tiempos.bloques,
]);

const out = path.join(__dirname, "..", "..", "Documentos", "AEUVG - Desarrollo Sprint 2.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("Documento generado:", out);
});
