// Genera Documentos/AEUVG - Desarrollo Sprint 3.docx
// Uso: node scripts/docs/desarrollo-sprint3.js
const { Packer } = require("docx");
const fs = require("fs");
const path = require("path");
const { p, bullet, h1, h2, makeTable, spacer, cover, buildDocument } = require("./template");
const { bloquesRegistroTiempos } = require("./tiempos-sprint3");

const tiempos = bloquesRegistroTiempos(10);

const doc = buildDocument([
  ...cover({
    subtitle: "Documento de Desarrollo del Sprint 3",
    date: "Guatemala, 7 de octubre del 2026",
  }),

  // ---------- 1 ----------
  h1("1. Introducción"),
  p(
    "El presente documento registra el desarrollo del Sprint 3 - Asociaciones, clubes y perfil de usuario (23 de septiembre al 6 de octubre de 2026) del proyecto de la plataforma web de la Asociación General de Estudiantes de la Universidad del Valle de Guatemala (AEUVG). Complementa la planificación del Sprint 3, documentando por cada historia de usuario el trabajo realizado y las decisiones tomadas durante su implementación."
  ),
  p(
    "El Sprint 3 da visibilidad a las asociaciones y clubes estudiantiles y habilita el perfil personal del estudiante. Es el primer sprint con funcionalidad asociada a la cuenta y no al rol de administración: hasta ahora la sesión servía únicamente para entrar al panel. Al cierre del sprint, el estudiantado consulta los grupos del campus, ve qué organiza cada uno, revisa y corrige sus propios datos y guarda los eventos que le interesan."
  ),

  // ---------- 2. HU-13 ----------
  h1("2. HU-13 - Servicios de consulta de asociaciones y clubes"),
  p(
    "Las tablas de asociaciones, clubes, integrantes y redes sociales ya existían desde el Sprint 1, por lo que esta historia no volvió a diseñarlas: agregó lo que faltaba para poder buscarlas y construyó la capa de consulta sobre la que se apoyan las pantallas públicas y las del panel."
  ),

  h2("2.1. Búsqueda sin acentos compartida"),
  p(
    "Se agregaron las columnas de texto de búsqueda de asociaciones y clubes, con el mismo criterio que la de eventos del Sprint 2: una copia del texto en minúsculas y sin acentos que el servicio recalcula en cada guardado. La normalización se trasladó a un módulo propio, fuera de los dos módulos que la usan, porque la copia tiene que generarse con la misma regla en ambos; con una función por módulo, cualquier ajuste en una dejaría la otra buscando distinto."
  ),
  p(
    "El texto de una asociación reúne su nombre, su descripción y su misión. Se incluye la misión porque varias asociaciones explican ahí a qué se dedican, y buscar “voluntariado” debe encontrarlas aunque la palabra no esté en su descripción. El de un club reúne su nombre, su descripción y sus actividades, por la misma razón. En la misma migración se crearon los índices sobre estado y nombre de las dos tablas, que es exactamente el orden del listado público."
  ),

  h2("2.2. Consultas del módulo"),
  p(
    "Todas las pantallas leen las organizaciones a través de un mismo archivo de consultas, igual que los eventos. La regla está escrita una sola vez: fuera del panel administrativo solo existen las organizaciones activas. Dar de baja una asociación la retira de las pantallas públicas sin borrar su historial, por lo que esa condición no puede quedar al criterio de cada pantalla."
  ),
  p(
    "La asociación general AEUVG queda fuera del listado porque tiene su propia página institucional, y aparecer dos veces en el sitio confundiría al estudiantado. Su detalle no responde con un error: redirige a esa página institucional, de modo que un enlace antiguo o un buscador externo sigan llevando a donde corresponde. En el panel sí aparece, porque AEUVG administra su propia ficha desde ahí."
  ),

  h2("2.3. Actividades de cada organizador"),
  p(
    "La página de una asociación o de un club responde dos preguntas distintas: a qué puedo asistir y qué ha hecho este grupo. Por eso sus actividades se consultan en dos bloques, próximas y pasadas, con órdenes opuestos: las próximas de la más cercana a la más lejana y las pasadas de la más reciente a la más antigua, que es como se leen."
  ),
  p(
    "Para esto se agregó al módulo de eventos una consulta de eventos publicados con orden y ventana de fechas configurables. La alternativa era escribir una consulta nueva dentro del módulo de organizaciones, pero eso habría duplicado la regla de qué eventos son visibles y el mapeo de sus organizadores. La misma consulta la reutiliza después la sección de eventos guardados del perfil."
  ),

  h2("2.4. Información de prueba"),
  p(
    "El conjunto de datos ficticios pasó de una asociación y un club a tres de cada uno: uno completo, uno sin junta directiva ni medios de contacto y uno dado de baja. Con ellos se pueden revisar sin información real los casos que antes no estaban cubiertos: que una organización de baja no aparezca en el listado público, que los bloques sin información se omitan del detalle en lugar de mostrarse vacíos, y que el buscador encuentre por descripción y no solo por nombre. El verificador de datos de prueba comprueba además que ninguna organización ficticia quede sin su texto de búsqueda cargado."
  ),

  // ---------- 3. HU-14 ----------
  h1("3. HU-14 - Sección de asociaciones"),
  p(
    "Esta historia construye la primera de las dos secciones públicas y, con ella, los componentes que después reutiliza la de clubes."
  ),

  h2("3.1. Tarjeta de organización"),
  p(
    "La tarjeta se implementó como un solo componente que sirve a las dos secciones: un grupo estudiantil se presenta igual sea asociación o club, y mantener dos tarjetas solo garantizaba que se separaran con el tiempo. Muestra el logotipo, el nombre y un resumen de la descripción recortado en el último espacio antes del límite, para no cortar una palabra por la mitad. Una organización sin logotipo se presenta con las iniciales de su nombre sobre el color de la sección, la misma solución que la junta directiva de la página institucional."
  ),

  h2("3.2. Listado y buscador"),
  p(
    "El listado presenta las asociaciones activas en orden alfabético, en páginas de doce, y reutiliza la paginación por enlaces del módulo de eventos. El buscador es un formulario común, sin JavaScript propio: al enviarlo el navegador arma la dirección y la página se vuelve a generar en el servidor, de modo que el resultado siempre sea compartible por enlace."
  ),
  p(
    "Los parámetros se validan por separado y el que no sea válido se descarta, con el mismo criterio de los filtros de eventos: una dirección mal escrita no produce una pantalla de error, sino el listado sin ese parámetro. El estado vacío distingue las dos causas posibles, igual que en la cartelera: que AEUVG todavía no haya cargado nada, o que la búsqueda no deje pasar ninguna organización."
  ),

  h2("3.3. Detalle, junta directiva y contacto"),
  p(
    "El detalle presenta la descripción, la misión y la visión, y omite por completo los bloques sin información en lugar de mostrarlos con un “pendiente” dentro. AEUVG carga la ficha de cada asociación por partes, y un apartado vacío resta más que no estar."
  ),
  p(
    "La junta directiva se presenta con el nombre, el cargo y el periodo de cada integrante, en el orden que AEUVG define desde el panel y no en orden alfabético: una junta se lee por jerarquía de cargos. Quien no tenga fotografía aparece con sus iniciales. La página institucional de AEUVG pasó a usar este mismo componente, que antes tenía su propia copia del mismo diseño."
  ),
  p(
    "El bloque de contacto reúne el correo, la información de contacto y las redes sociales, y desaparece completo cuando no hay ninguno de los tres. Los enlaces a redes se abren en otra pestaña y sin referencia de origen, para no filtrar desde qué página se llegó ni dejar que el destino manipule la ventana que lo abrió. La presentación descarta además los enlaces que no sean http o https: la validación del panel ya los rechaza, pero la base conserva lo que se cargó antes de este sprint."
  ),

  h2("3.4. Verificación en dispositivos"),
  p(
    "La revisión en anchos de teléfono, tableta y escritorio dejó tres ajustes. En la tarjeta faltaba permitir que el contenedor del nombre se encogiera, y un nombre largo empujaba el logotipo fuera de la tarjeta en lugar de partirse en dos líneas. En el encabezado del detalle el logotipo cede tamaño en teléfono, donde lo primero que hay que leer es el nombre. Y la junta directiva pasó a presentarse en tres columnas dentro de la página de una asociación, más angosta que la institucional, porque con cuatro los retratos quedaban demasiado estrechos para leer el cargo sin partirlo en tres líneas."
  ),

  // ---------- 4. HU-15 ----------
  h1("4. HU-15 - Sección de clubes y vinculación con sus actividades"),

  h2("4.1. Reutilización de los componentes"),
  p(
    "La sección de clubes se construyó después de la de asociaciones y no en paralelo, tal como se planificó: reutiliza sus mismos componentes y adelantarla habría obligado a escribirlos dos veces. El listado y el detalle son las mismas piezas con otra ruta y otros textos."
  ),
  p(
    "La única diferencia estructural es que un club no tiene junta directiva registrada, porque el requerimiento de AEUVG no contempla ese dato para los clubes. En su lugar, ese espacio del detalle lo ocupan sus actividades habituales, que es lo que alguien necesita saber antes de acercarse a integrarse."
  ),

  h2("4.2. Organizadores enlazados"),
  p(
    "Los organizadores de un evento dejaron de ser solo texto: ahora viajan con su enlace y la vista de detalle lleva a la página de la asociación o del club correspondiente. Un organizador que es una unidad de la universidad no tiene página propia en la plataforma, así que viaja sin enlace y se presenta como texto, sin inventarle un destino."
  ),
  p(
    "En la tarjeta de un evento los organizadores siguen siendo texto. La tarjeta entera es un enlace al evento y un enlace dentro de otro no es HTML válido; el clic además activaría los dos destinos. Sus páginas se alcanzan desde el detalle, que es donde alguien se detiene a ver quién organiza la actividad."
  ),
  p(
    "El cambio implicó modificar la forma en que las consultas de eventos devuelven sus organizadores, que hasta este sprint era una lista de nombres. Las pantallas que solo necesitan el texto usan una función que extrae los nombres, de modo que el listado del panel y la tarjeta no tengan que conocer la nueva forma."
  ),

  h2("4.3. Navegación"),
  p(
    "Los accesos rápidos de la página principal separaron asociaciones y clubes en dos tarjetas. Hasta este sprint compartían una sola, porque ninguna de las dos secciones existía; con los dos listados publicados, un acceso compartido obligaba a entrar a uno para llegar al otro. El pie de página incorporó también el calendario, que faltaba desde el Sprint 2."
  ),

  // ---------- 5. HU-16 ----------
  h1("5. HU-16 - Administración de asociaciones y clubes"),
  p(
    "Esta historia entrega a AEUVG el control de la información de los grupos del campus, que hasta este sprint habría requerido al equipo de desarrollo."
  ),

  h2("5.1. Un grupo de servicios para las dos fichas"),
  p(
    "Las dos entidades comparten todas sus operaciones y lo único que cambia son los campos propios de cada una, así que comparten también su grupo de servicios: el tipo viaja en la dirección y se valida contra una lista cerrada. Un tipo que no sea asociaciones ni clubes responde como no encontrado."
  ),
  p(
    "Para que el servicio no tenga que suponer qué ficha está guardando, la lectura del cuerpo devuelve una entrada marcada con su tipo y los datos ya validados con el esquema que le corresponde. Así el compilador garantiza que los campos de una asociación no terminen en la tabla de clubes, en lugar de dejarlo a una comprobación en tiempo de ejecución."
  ),

  h2("5.2. Validaciones"),
  p(
    "El nombre se comprueba contra la base sin distinguir mayúsculas, porque la restricción de la tabla sí las distingue y “Club de Teatro” y “club de teatro” son el mismo grupo para cualquiera que lea el listado. Al editar se excluye el propio registro de la comprobación, o ninguna ficha podría guardarse sin cambiarle el nombre."
  ),
  p(
    "El correo y los enlaces son opcionales, y el campo vacío del formulario equivale a no tener valor. Los enlaces de imagen admiten que se peguen sin esquema y se completan con https, igual que en los eventos, pero se rechazan los esquemas que no sean http o https. Las direcciones de las imágenes subidas al almacenamiento del propio sitio se dejan intactas."
  ),

  h2("5.3. Baja lógica y eliminación"),
  p(
    "Dar de baja es la operación habitual y la que el panel ofrece en cada fila: retira el registro de las pantallas públicas y conserva su historial de eventos. La eliminación definitiva solo se permite cuando la organización no organiza ningún evento."
  ),
  p(
    "La comprobación se hace en el servicio y no se deja a la base. La restricción de la tabla de organizadores ya impediría el borrado, pero el panel habría mostrado un error del motor en lugar de explicar que corresponde dar de baja. El listado del panel muestra además cuántos eventos organiza cada registro, que es justamente el dato que decide entre las dos operaciones."
  ),

  h2("5.4. Junta directiva y redes sociales"),
  p(
    "La junta directiva y las redes sociales se administran en la pantalla de edición, pero cada registro se guarda por su cuenta y no con el formulario de la ficha. Obligar a reenviar toda la asociación para corregir un cargo haría perder los demás cambios a medio escribir. Por la misma razón solo se administran al editar, cuando la ficha ya tiene identificador."
  ),
  p(
    "Las operaciones sobre un integrante llevan la asociación en la condición además del identificador del integrante, de modo que una dirección manipulada no pueda editar al integrante de otra ficha. Los enlaces de redes se agregan y se quitan, pero no se editan: son un par de plataforma y dirección, y corregirlos equivale a reemplazarlos. El duplicado se detecta antes de intentar guardarlo, porque la tabla tiene una restricción de unicidad y el panel habría mostrado un error del motor."
  ),
  p(
    "Las rutas de integrantes solo aceptan asociaciones. Un club no tiene junta directiva en el requerimiento, así que la ruta de un club responde como inexistente en lugar de aceptar datos que ninguna pantalla mostraría."
  ),

  h2("5.5. Pantallas del panel"),
  p(
    "Las secciones de asociaciones y clubes del panel dejaron de ser marcadores. El listado es un solo componente para las dos, con sus columnas, su buscador y sus acciones; el formulario también, mostrando los campos propios según el tipo. Los servicios de administración se protegieron con el mismo mecanismo de roles del Sprint 1, que responde con un error de autenticación cuando no hay sesión y con un no encontrado cuando hay sesión pero no el rol."
  ),

  // ---------- 6. HU-17 ----------
  h1("6. HU-17 - Perfil del estudiante"),

  h2("6.1. Quién puede escribir sobre qué"),
  p(
    "Ni la pantalla del perfil ni su servicio reciben el identificador del estudiante: lo resuelve el servicio a partir del usuario de la sesión. Así no existe forma de leer ni de escribir el perfil de otra persona, ni manipulando un enlace ni enviando un cuerpo distinto al esperado. El servicio exige sesión pero ningún rol en particular, porque cualquier cuenta administra lo propio."
  ),
  p(
    "La ruta del perfil se agregó además a las rutas privadas del middleware, que redirige al inicio de sesión cuando la cookie no es válida. Esa comprobación es solo de comodidad: la autorización se decide en el servidor con los datos de la base, igual que en el panel."
  ),

  h2("6.2. Qué se puede editar y qué no"),
  p(
    "El estudiante puede cambiar su teléfono y su carrera. El nombre, el carnet y el correo institucional se presentan como información de solo lectura, con una nota que indica escribir a AEUVG para corregirlos. No es una limitación de comodidad: identifican la cuenta y con el carnet se asocian los registros de horas beca, incluidos los que se carguen antes de que el estudiante tenga cuenta en el Sprint 4, de modo que permitir cambiarlo rompería ese vínculo."
  ),
  p(
    "El teléfono se valida en su formato (ocho dígitos, con prefijo de país y separadores opcionales) y se guarda tal como lo escribió su dueño. La plataforma únicamente lo muestra, así que normalizarlo le quitaría el formato con el que lo reconoce. La carrera se comprueba además contra la base: el esquema solo puede saber que es un número, no que la carrera exista y siga activa. La facultad no se edita, se deduce de la carrera."
  ),

  h2("6.3. La pantalla"),
  p(
    "El perfil presenta primero quién es el estudiante, con el estado de su cuenta y si su correo está verificado, después sus datos de cuenta y al final el formulario de edición. El aviso de guardado aparece en la misma pantalla en lugar de navegar a otra: el perfil es donde el estudiante ya está, y sacarlo de ahí para decirle que se guardó no aporta nada. Los datos de solo lectura los genera el servidor, así que al guardar se refresca la ruta para que un cambio de carrera se vea también arriba."
  ),

  // ---------- 7. HU-18 ----------
  h1("7. HU-18 - Eventos guardados y redes sociales de AEUVG"),

  h2("7.1. Reglas de guardado"),
  p("Las reglas quedaron escritas en el servicio:"),
  bullet(
    "Solo se guardan eventos publicados: un borrador o un evento cancelado no existen fuera del panel."
  ),
  bullet(
    "Guardar dos veces el mismo evento no duplica el registro ni produce un error; la escritura comprueba la existencia antes de insertar."
  ),
  bullet(
    "Quitar no exige que el evento siga publicado: si AEUVG lo canceló, el estudiante todavía debe poder retirarlo de su lista."
  ),
  bullet(
    "El listado del perfil vuelve a exigir que el evento esté publicado, por lo que un evento cancelado o eliminado desaparece de los guardados sin que nadie tenga que quitarlo."
  ),

  h2("7.2. El control de guardar"),
  p(
    "El control aparece en la cartelera y en el detalle del evento, y su estado se pinta ya marcado desde el servidor: la pantalla resuelve la sesión y consulta en una sola llamada cuáles de los eventos visibles están guardados, en lugar de que cada tarjeta pregunte por su cuenta. La página principal no lo muestra, de modo que la pantalla más visitada del sitio no pague esa consulta."
  ),
  p(
    "El cambio se refleja de inmediato y se revierte si el servidor lo rechaza. El control vive dentro de una tarjeta, donde esperar la respuesta deja la impresión de que no reaccionó. Sin sesión el control no se oculta: navega al inicio de sesión llevando la pantalla actual en el parámetro de continuación, de modo que al volver el estudiante quede donde estaba y no en la portada; ocultarlo dejaría la función invisible justo para quien todavía no tiene cuenta."
  ),
  p(
    "En la tarjeta el control se coloca sobre ella y no dentro de su enlace, por la misma razón que los organizadores: un botón dentro de un enlace no es HTML válido."
  ),

  h2("7.3. Sección del perfil"),
  p(
    "El perfil presenta los eventos guardados en dos bloques, con los próximos antes que los ya finalizados. Los finalizados se conservan porque el estudiante los guardó por algo y hacerlos desaparecer solos sería una sorpresa; los cancelados, en cambio, sí desaparecen, porque dejan de estar publicados. Cuando no hay ninguno, la sección explica para qué sirve la estrella y ofrece ir a la cartelera."
  ),

  h2("7.4. Redes sociales de AEUVG"),
  p(
    "Las redes oficiales ya se mostraban en la página principal desde el Sprint 2. En este sprint se incorporaron también al pie de página y a la página institucional, y las tres usan el mismo componente de enlaces que las fichas de asociaciones y clubes. Se leen de la base y no están escritas en el código: AEUVG las administra desde el panel y el sitio debe seguirlas sin que haya que tocar nada."
  ),

  // ---------- 8 ----------
  h1("8. Pruebas y verificación"),
  p(
    "Las pruebas automatizadas del proyecto pasaron de 147 a 223. Las 76 nuevas corresponden a este sprint y se ejecutan sin base de datos, sustituyendo el acceso a datos por dobles de prueba, para que puedan correrse en cualquier momento del desarrollo."
  ),
  spacer(),
  makeTable(
    [3400, 1400, 4560],
    ["Área", "Pruebas", "Qué se verifica"],
    [
      [
        "Consultas de asociaciones y clubes",
        "19",
        "Que solo se consulten registros activos, la exclusión de la asociación general, el buscador sin acentos y la paginación.",
      ],
      [
        "Actividades y organizadores",
        "7",
        "El enlace de cada organizador según su tipo, el orden del organizador principal y la separación entre actividades próximas y pasadas.",
      ],
      [
        "Administración de organizaciones",
        "27",
        "Las validaciones de los formularios, el nombre repetido, la baja lógica, la restricción de la eliminación y los permisos por rol.",
      ],
      [
        "Perfil del estudiante",
        "11",
        "Los formatos de teléfono admitidos, la comprobación de la carrera y que el perfil se escriba sobre el estudiante de la sesión.",
      ],
      [
        "Eventos guardados",
        "12",
        "Que solo se guarden eventos publicados, que guardar dos veces no falle y que el listado del perfil exija evento publicado.",
      ],
    ]
  ),
  spacer(),
  p(
    "Las pruebas del módulo de eventos se actualizaron al nuevo formato de los organizadores, que ahora incluye el enlace de cada uno. Además de las pruebas automatizadas se verificó que el proyecto compile sin errores de tipos, que el análisis estático no reporte problemas y que la compilación de producción se complete, incluyendo las trece rutas nuevas del sprint. Las pantallas se revisaron en anchos de teléfono, tableta y escritorio."
  ),

  // ---------- 9 ----------
  h1("9. Estado del sprint"),
  p(
    `Las seis historias comprometidas para el Sprint 3 se encuentran completadas, con ${tiempos.enHoras(tiempos.totalEquipo)} horas de trabajo de equipo frente a las 28 estimadas. El detalle por sesión se encuentra en la sección 10. La plataforma cuenta ahora con:`
  ),
  bullet(
    "Las secciones de asociaciones y de clubes, con su listado, su buscador y su página de detalle."
  ),
  bullet(
    "La junta directiva, los medios de contacto y las redes sociales de cada organización en su página."
  ),
  bullet(
    "Las actividades publicadas de cada organizador dentro de su página, separadas en próximas y pasadas."
  ),
  bullet("Los organizadores de cada evento enlazados a su página correspondiente."),
  bullet(
    "Las secciones de asociaciones y clubes del panel administrativo, con la junta directiva, las redes sociales, la baja lógica y la eliminación restringida."
  ),
  bullet("El perfil del estudiante, con la edición de su teléfono y de su carrera."),
  bullet("Los eventos guardados, con su control en la cartelera y su sección en el perfil."),
  bullet(
    "Las redes sociales oficiales de AEUVG en la página principal, el pie de página y la página institucional."
  ),
  p(
    "Queda pendiente de AEUVG la carga de la información real de las asociaciones y clubes del campus, incluidas las fotografías de sus juntas directivas. No bloquea el sprint: la administración quedó lista y el módulo funciona con la información de prueba. Continúa también en gestión el trámite del dominio institucional iniciado en el Sprint 1."
  ),
  p(
    "El desarrollo continúa en el Sprint 4 con el módulo de horas beca, que sustituye el control que AEUVG realiza actualmente mediante hojas de cálculo y que se apoya en el perfil entregado en este sprint para la sección “Mis horas beca”."
  ),

  // ---------- 10. Registro de tiempos ----------
  ...tiempos.bloques,
]);

const out = path.join(__dirname, "..", "..", "Documentos", "AEUVG - Desarrollo Sprint 3.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("Documento generado:", out);
});
