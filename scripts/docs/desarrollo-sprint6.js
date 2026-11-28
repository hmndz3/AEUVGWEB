// Genera Documentos/AEUVG - Desarrollo Sprint 6.docx
// Uso: node scripts/docs/desarrollo-sprint6.js
const { Packer } = require("docx");
const fs = require("fs");
const path = require("path");
const { p, bullet, h1, h2, makeTable, spacer, cover, buildDocument } = require("./template");
const { bloquesRegistroTiempos } = require("./tiempos-sprint6");

const tiempos = bloquesRegistroTiempos(19);
const doc = buildDocument([
  ...cover({
    subtitle: "Documento de Desarrollo del Sprint 6",
    date: "Guatemala, 27 de noviembre del 2026",
  }),

  // ---------- 1 ----------
  h1("1. Introducción"),
  p(
    "El presente documento registra el desarrollo del Sprint 6 - Cierre del producto (4 al 27 de noviembre de 2026) del proyecto de la plataforma web de la Asociación General de Estudiantes de la Universidad del Valle de Guatemala (AEUVG). Es el último sprint del proyecto y cierra todo lo que quedaba pendiente del alcance comprometido, más lo que la asociación fue pidiendo al ver funcionando cada incremento."
  ),
  p(
    "A diferencia de los cinco anteriores, este sprint no tuvo documento de planificación ni estimación previa. Se acordó cerrar en un solo tramo lo que faltaba, y el alcance se fue fijando historia por historia sobre el modelo de datos que el Sprint 1 había dejado completo. Por eso el documento parte de lo construido y no de lo planificado. Son tres semanas y media de trabajo, frente a las dos de los sprints anteriores, y el documento es proporcionalmente más largo: quince historias en lugar de cuatro o seis."
  ),
  p(
    "Al cierre del sprint no queda ninguna sección de la plataforma sin implementar. El estudiantado puede postularse como tutor, agendar tutorías, recibir avisos, subir su fotografía, marcar qué le interesa, consultar el salón de préstamo de batas y ofrecerse como voluntario; AEUVG administra cuentas, postulaciones, tutores, cursos, inventario y turnos desde el panel, carga eventos y organizaciones por Excel en lugar de uno por uno, y descarga el reporte de lo realizado. El producto quedó además revisado contra el OWASP Top 10."
  ),
  p(
    "El sprint requirió tres migraciones, todas aditivas y todas aplicadas en Railway antes de publicar: la fotografía de perfil, el módulo de préstamo de batas con sus nueve tablas y los campos de la doble validación de las tutorías. Las siete tablas del módulo de tutorías y las tres de notificaciones y personalización existían en el modelo desde el Sprint 1 y se usaron tal como estaban diseñadas."
  ),

  // ---------- 2 ----------
  h1("2. Ajustes previos del módulo de horas beca"),
  p(
    "El sprint abrió resolviendo lo que AEUVG dejó observado al revisar el Sprint 5. Son cuatro cambios y el retiro de una función completa, todos sobre el módulo de horas beca, y ocupan los dos primeros días."
  ),

  h2("2.1. El retiro de las convocatorias"),
  p(
    "Las dos historias de convocatorias para realizar horas, construidas al final del Sprint 5, se quitaron del producto. AEUVG explicó que no organiza las horas beca por convocatoria: las asigna directamente y después registra lo realizado, de modo que la sección se habría visto vacía todo el año. Se borró el código —el servicio, los endpoints, las pantallas del panel, la página pública y sus enlaces— y se dejaron las tablas, que existen desde el Sprint 1, vacías y sin uso: quitarlas habría exigido una migración destructiva para recuperar dos tablas que no estorban."
  ),

  h2("2.2. Las mismas horas para varios estudiantes"),
  p(
    "Registrar una actividad en la que participaron quince personas obligaba a llenar quince veces el mismo formulario. Se agregó la posibilidad de pegar una lista de carnets separados por comas, espacios o saltos de línea y registrar la misma actividad para todos de una vez. El nombre no se escribe: se resuelve desde la cuenta de cada carnet, y los carnets sin cuenta se reportan en lugar de crearse a medias, porque sin nombre el registro no sirve para rendir cuentas."
  ),

  h2("2.3. El archivo de AEUVG tal como está"),
  p(
    "El importador del Sprint 5 esperaba los encabezados de su propia plantilla. El archivo con el que AEUVG lleva el control de verdad usa otros —FECHA, NOMBRE COMPLETO, CARNÉ, CORREO, HORARIO DE APOYO, ACTIVIDAD DE APOYO, HORAS A ACREDITAR— y mete el horario entero en una sola celda. Pedirle a la asociación que renombrara los encabezados de años de histórico era justo el trabajo que el importador venía a evitar, así que se enseñó al importador a reconocerlos: los compara sin acentos ni mayúsculas y parte el horario admitiendo las tres formas en que aparece escrito en la hoja."
  ),

  h2("2.4. La facultad a la vista"),
  p(
    "AEUVG reporta las horas por facultad y la tabla del panel no la mostraba, así que el dato había que buscarlo carnet por carnet. La facultad sale de la carrera del estudiante, de modo que ya estaba en la base; se agregó como columna, como filtro y a la exportación. Un carnet sin cuenta la deja vacía, que es lo correcto: todavía no se sabe de qué facultad es."
  ),

  h2("2.5. Una tabla que cabe en la pantalla"),
  p(
    "La tabla de registros de horas se había ido llenando de columnas hasta salirse del ancho del panel, y revisarla obligaba a arrastrarla en horizontal en un monitor normal. Se ensanchó el contenedor del panel, que estaba pensado para texto y no para una zona de datos densos; se juntaron la fecha y el horario en una sola columna, porque son el mismo dato de cuándo se realizó el apoyo y por separado se llevaban el ancho de dos; y la actividad pasó a ajustarse en dos líneas en lugar de recortarse en una, que obligaba a pasar el cursor por encima para leer la columna que más se consulta."
  ),

  h2("2.6. Los estudiantes como burbujas"),
  p(
    "El registro para varios estudiantes se había entregado como una pantalla aparte en la que se pegaba una lista de carnets. AEUVG pidió que funcionara como los destinatarios de un correo y dentro del formulario de siempre: cada estudiante que se elige se vuelve una burbuja con su nombre y el campo queda listo para el siguiente."
  ),
  p(
    "Se rehízo así y se retiró la pantalla aparte. El buscador de estudiantes, que ya existía, ganó la posibilidad de confirmar lo escrito con Enter o con una coma para agregar un carnet que no aparece entre las sugerencias; al confirmarlo se resuelve contra las cuentas, de modo que quien captura vea el nombre de la persona a la que va a registrarle horas, que es lo que delata un carnet mal tecleado. Con un solo estudiante el formulario se comporta como antes, incluido el caso de un carnet sin cuenta, al que sigue pidiéndole el nombre."
  ),

  // ---------- 3 ----------
  h1("3. HU-31 - Postulación para ser tutor y su revisión"),

  h2("3.1. La nota respalda el curso, no a la persona"),
  p(
    "Es la decisión que define la postulación. Se pide una nota por cada curso al que alguien se postula y no un promedio: quien sacó cien en cálculo puede no estar en condiciones de dar química, y un promedio alto escondería exactamente eso. El mínimo es ochenta y lo comprueba el servicio, no solo el formulario."
  ),
  p(
    "Cada curso va además con su comprobante, que es obligatorio. La nota la declara quien se postula, así que sin algo que la respalde la revisión no tendría con qué contrastarla. El comprobante es una imagen subida desde la propia pantalla y se comprueba que la sirva la plataforma: aceptar una dirección externa dejaría la revisión dependiendo de un archivo que puede cambiar o desaparecer. Para eso se agregó una ruta de subida con protección de sesión en lugar de rol, porque quien sube es el propio estudiante y no un administrador."
  ),

  h2("3.2. Aprobar es lo que crea al tutor"),
  p(
    "Aprobar una postulación son cuatro escrituras que van juntas en una transacción: la postulación cambia de estado, nace o se reactiva el tutor, se le asignan los cursos que respaldó y se le concede el rol correspondiente. A medias dejaría a alguien aprobado sin poder entrar a su propia sección."
  ),
  p(
    "Una postulación ya resuelta no se vuelve a tocar: su comentario y su fecha son el registro de lo que AEUVG decidió, y reescribirlos borraría ese rastro. Tampoco se admite una segunda postulación mientras haya una sin resolver, que solo duplicaría el trabajo de revisión."
  ),

  h2("3.3. Lo que la revisión deja a la vista"),
  p(
    "El panel presenta las postulaciones como tarjetas y no como tabla: cada una trae sus cursos con la nota y el enlace al comprobante, que es lo que hay que mirar para decidir, y en una tabla eso no cabe sin esconderlo detrás de un detalle. Las notas por debajo del mínimo se señalan en rojo. Los estados funcionan como filtro y como contador a la vez, porque la pregunta con la que se abre la pantalla es cuántas faltan por revisar."
  ),
  p(
    "El comentario del rechazo se pide antes de aplicarlo: un rechazo sin motivo obliga a la persona a adivinar qué le faltó."
  ),

  // ---------- 4 ----------
  h1("4. HU-32 - Directorio de tutores y agenda de tutorías"),

  h2("4.1. Disponibilidad por día de la semana"),
  p(
    "El tutor publica franjas por día de la semana y no por fecha. La disponibilidad se repite: quien puede los martes de dos a cuatro lo puede todos los martes del ciclo, y pedirle que marque fecha por fecha convertiría esto en un trabajo semanal. Dos franjas del mismo día no pueden encimarse, que es lo que impide que el estudiante vea dos huecos para la misma hora y el tutor acabe con dos tutorías a la vez."
  ),
  p(
    "El lugar o el enlace son obligatorios en cada franja: son el dato que el estudiante necesita para presentarse. Al agendar, ese dato sale de la franja y no del cuerpo de la petición, porque de otro modo se podría citar al tutor donde nunca dijo que estaría."
  ),

  h2("4.2. La cita queda agendada, no solicitada"),
  p(
    "El estudiante elige tutor, curso, franja y día, y la tutoría queda programada de una vez. El tutor ya publicó en qué horarios puede, y pedirle además que confirme cada cita convertiría su disponibilidad en una intención y no en un compromiso. Lo que sí puede es cancelarla."
  ),
  p(
    "Las reglas son las que impiden que una cita no se pueda cumplir: el horario tiene que caber entero dentro de una franja publicada y no solo tocarla; la modalidad pedida tiene que caber en la que ofrece la franja; el tutor no puede tener dos tutorías encimadas, aunque sí dos pegadas; la fecha no puede haber pasado; y nadie se agenda consigo mismo."
  ),
  p(
    "La fecha y la hora se combinan en la zona de Guatemala, que no cambia de horario en todo el año. Sin ese desplazamiento una tutoría de las dos de la tarde se guardaría seis horas antes de lo que nadie acordó, y el día de la semana contra el que se compara la franja podría ser el equivocado para las citas de la noche."
  ),

  h2("4.3. Quién puede cancelar y quién completar"),
  p(
    "Cancelar lo pueden los dos: al estudiante le surge algo y al tutor también. Darla por completada solo el tutor, porque es quien sabe si la sesión ocurrió, y es el dato que respalda su ficha ante quien lo elige. Una tutoría ajena responde como no encontrada en lugar de como prohibida, para no confirmar que existe."
  ),

  h2("4.4. El directorio"),
  p(
    "Presenta solo a los tutores activos que imparten algún curso: uno sin cursos no se puede elegir para nada y listarlo solo haría más larga la búsqueda. Se filtra por curso, que es la pregunta con la que se entra, y se busca por nombre o carnet. Un tutor inactivo o suspendido desaparece del directorio por su estado y no por borrarse: sus tutorías realizadas siguen contando y su ficha vuelve si AEUVG lo reactiva."
  ),
  p(
    "Las rutas del tutor no se protegen por el rol sino resolviendo el tutor de la sesión. El rol se concede al aprobar, pero la ficha y las franjas son de una persona concreta, y recibir el tutor por parámetro permitiría editar la de cualquiera."
  ),

  // ---------- 5 ----------
  h1("5. HU-33 - Panel de cuentas del estudiantado"),
  p(
    "La sección de estudiantes del panel llevaba desde el Sprint 4 como marcador. Presenta las cuentas registradas con su carrera, sus roles, su último acceso y su estado de verificación, y se busca por carnet, nombre o correo, con filtros por estado, facultad y verificación."
  ),
  p(
    "Los datos personales no se editan desde aquí: son del estudiante y se corrigen desde su perfil. Lo único que AEUVG hace sobre una cuenta es activarla, dejarla pendiente o bloquearla, y por eso el estado se cambia desde la propia fila en lugar de abrir una ficha para un selector de tres opciones."
  ),
  p(
    "La regla propia es que un administrador no puede bloquear su propia cuenta. No es una cortesía: bloquearse a uno mismo cierra la sesión y deja el panel sin quien lo administre, y recuperarlo exigiría entrar a la base a mano. La tabla señala la fila de la cuenta en sesión en lugar de ofrecer el selector."
  ),

  // ---------- 6 ----------
  h1("6. HU-34 - Notificaciones de la cuenta"),

  h2("6.1. Un aviso nunca hace fallar la operación"),
  p(
    "Los avisos se escriben con una función que no lanza. Una notificación acompaña a la operación, no es la operación: si el aviso falla, la postulación revisada o la tutoría agendada ya ocurrieron, y hacer fallar la petición por el aviso sería peor que quedarse sin él. El motivo se registra para poder rastrearlo."
  ),
  p(
    "Por lo mismo los avisos se emiten desde los endpoints, después de que el servicio resolvió, y no dentro de los servicios. Así las reglas de negocio siguen probándose sin base de datos y sin dobles de notificación."
  ),

  h2("6.2. Cuándo se avisa"),
  p(
    "Se avisa a quien se postuló cuando AEUVG resuelve su postulación; al tutor cuando alguien le agenda una tutoría, porque es quien tiene que presentarse y no fue quien la creó; a la otra parte cuando una tutoría se cancela o se da por dada, nunca a quien acaba de hacerlo; y al estudiantado cuando se le acreditan horas beca, que es el dato por el que escribían a AEUVG."
  ),
  p(
    "No se avisa al revertir una acreditación: suele ser la corrección de un error de AEUVG, y avisarlo sembraría en el estudiante una duda que no le toca."
  ),

  h2("6.3. Leer"),
  p(
    "Marcar como leído es manual y no al abrir la pantalla: quien entra a revisar sus avisos suele querer dejar pendientes los que todavía no resolvió, y marcarlos todos por el hecho de haberlos visto se los esconde. La cuenta entra en la condición de la escritura en lugar de comprobarse aparte, así que un aviso ajeno no se marca ni por accidente y responde como no encontrado."
  ),
  p(
    "El encabezado consulta solo el contador de no leídos: traer los cincuenta avisos para pintar un número sería desproporcionado, y es el único dato del encabezado que cambia sin recargar la página."
  ),

  // ---------- 7 ----------
  h1("7. HU-35, HU-36 y HU-37 - Perfil, calendario y personalización"),

  h2("7.1. Fotografía de perfil"),
  p(
    "Es la única migración del sprint y agrega una columna opcional. La plataforma funcionaba sin ella y la mayoría de las cuentas no tendrá foto: en todas las pantallas hay iniciales como respaldo, que es lo que se ha mostrado desde el Sprint 1, así que las iniciales no son un respaldo temporal sino el caso habitual."
  ),
  p(
    "Solo se admite una imagen servida por la propia plataforma, porque la foto se ve en el directorio público de tutores y aceptar una dirección externa dejaría al sitio cargando imágenes de cualquier parte. La pantalla del perfil advierte dónde va a aparecer antes de subirla, y enviar una dirección vacía la quita y devuelve las iniciales."
  ),
  p(
    "El avatar se unificó en un solo componente que usan el perfil, el encabezado, el directorio y el panel. Antes cada pantalla repetía su propio círculo con iniciales y se iban separando entre sí."
  ),

  h2("7.2. Calendario del panel"),
  p(
    "La sección llevaba como marcador desde el Sprint 2. Reutiliza la grilla, los controles y la agenda del calendario público, y se distingue en una sola cosa: no aplica el filtro de publicados. El calendario del panel existe justamente para ver qué queda sin publicar antes de que llegue su fecha, y esconder los borradores y los cancelados lo volvería una copia del público."
  ),

  h2("7.3. Intereses y recomendaciones"),
  p(
    "Las recomendaciones del perfil salen de las categorías de evento que el estudiante marcó, no de lo más popular: la plataforma todavía no tiene volumen para que “lo popular” signifique algo, y presentar la cartelera ordenada por fecha como recomendación personal sería falso. Se recomiendan los eventos publicados y próximos de esas categorías, sin los que ya guardó, porque si ya están en su lista recomendárselos no le dice nada nuevo."
  ),
  p(
    "Sin intereses marcados no se recomienda nada y la pantalla lo explica, en lugar de caer a un listado genérico. Una selección vacía es válida y significa justamente eso. Guardar un evento deja además constancia de la interacción, que es un dato de apoyo para afinar las recomendaciones más adelante y que, como el aviso, nunca hace fallar la operación."
  ),

  // ---------- 8 ----------
  // ---------- 8 ----------
  h1("8. HU-38 - Catálogo de cursos y ajustes del módulo de tutorías"),
  p(
    "Con el módulo de tutorías funcionando, AEUVG lo usó y pidió cuatro cosas que solo se ven al usarlo."
  ),

  h2("8.1. Los cursos dejan de estar escritos en el código"),
  p(
    "El listado de cursos de la postulación venía fijo. Pasó a ser un catálogo que AEUVG administra desde el panel: se agregan con código y nombre, se editan y se activan o desactivan. Un curso solo se elimina si nadie lo usa; si ya tiene postulaciones, tutores o tutorías, se desactiva, para no perder el historial de quién respaldó qué."
  ),
  p(
    "Si el curso de un estudiante no está en la lista, la postulación ofrece la opción Otro: escribe el nombre y, si lo conoce, el código. El curso entra al catálogo marcado como propuesto, no aparece en el formulario ni en el directorio, y se admite al aprobar la postulación que lo trae o cuando AEUVG lo acepta desde la pestaña de cursos."
  ),

  h2("8.2. Buscar entre los tutores"),
  p(
    "El panel listaba a todos los tutores sin forma de acotarlos. Se agregaron los filtros por nombre, carnet, estado y curso, y las postulaciones se separaron de los tutores en pestañas distintas: son dos trabajos diferentes, revisar quién quiere entrar y administrar a quien ya está."
  ),

  h2("8.3. Editar los datos de la cuenta"),
  p(
    "El perfil mostraba los datos de la cuenta sin manera de corregirlos: un apellido mal escrito al registrarse se quedaba así. Ahora se editan desde la misma tarjeta donde se leen."
  ),

  h2("8.4. La actividad de las horas, ligada al evento"),
  p(
    "Las horas beca que se ganan apoyando un evento se capturaban escribiendo el nombre del evento a mano, con lo que el mismo evento acababa escrito de tres maneras. El formulario ahora filtra los eventos conforme se escribe y guarda el vínculo, no solo el texto. El nombre se sigue guardando aparte para que el registro se lea sin depender de que el evento siga existiendo."
  ),

  // ---------- 9 ----------
  h1("9. HU-39 - Página institucional administrable y envío de correos"),

  h2("9.1. Sobre AEUVG deja de estar en el código"),
  p(
    "La descripción de la asociación, su misión, su visión y los integrantes de la Junta Directiva se cargaban con un script y vivían en un archivo del proyecto. Cada cambio de junta habría exigido un despliegue. Pasaron al panel: AEUVG edita los textos y administra a los integrantes con su cargo y su retrato, que se sube como cualquier otra imagen del sitio."
  ),

  h2("9.2. Los correos que no llegaban"),
  p(
    "Los correos de verificación y de recuperación se enviaban sin dejar constancia de lo que pasaba con ellos: si fallaban, fallaban en silencio y el estudiante se quedaba esperando. El envío pasó a Brevo y cada fallo queda registrado con su motivo, de modo que un correo rechazado se pueda explicar en lugar de adivinarse."
  ),

  h2("9.3. Confirmar el correo con un botón"),
  p(
    "La verificación se hacía al abrir el enlace, y eso tenía un problema que apareció en uso real: los filtros de seguridad de los servidores de correo abren los enlaces de los mensajes para revisarlos, y al hacerlo activaban la cuenta sin que la persona hubiera hecho nada. Ahora el enlace lleva a una página con un botón, y es ese botón el que verifica. Un robot no lo pulsa."
  ),

  // ---------- 10 ----------
  h1("10. HU-40 - Modo oscuro y selectores propios de fecha y hora"),

  h2("10.1. El tema oscuro"),
  p(
    "La plataforma se usa de noche y desde el teléfono, y el fondo claro a esas horas molesta. Se agregó un modo oscuro que se elige desde el perfil y que se aplica antes de que la página pinte, para que no haya un destello claro al cargar."
  ),
  p(
    "Lo que costó no fue el fondo sino el contraste. La paleta tenía colores que se definen contra el tema —el color del texto, por ejemplo— y que al invertirse dejaban letras del mismo color que su fondo: el pie de página, la barra del panel y las fichas de los eventos desaparecían. Se introdujo un color de contraste que no cambia con el tema para esos casos, y un tono de texto propio para cada acento rebajado. Una prueba automatizada recorre los componentes y falla si alguno vuelve a combinar el color del texto con un fondo del que no se distingue."
  ),

  h2("10.2. Selectores propios en lugar de los del navegador"),
  p(
    "Los campos de fecha y hora eran los del navegador, que cambian de aspecto y de idioma según en qué se abra la página y que en el teléfono abren la rueda del sistema. Se reemplazaron por un calendario y un selector de hora propios, con el diseño del sitio, que además permiten acotar los días elegibles: al agendar una tutoría solo se ofrecen los días que el tutor atiende."
  ),

  // ---------- 11 ----------
  h1("11. HU-41 - Carga masiva desde Excel"),
  p(
    "Eventos, asociaciones, clubes y cursos se creaban uno por uno desde el panel. Con cien eventos al año eso son cien formularios. AEUVG pidió lo mismo que ya existía para las horas beca: una plantilla de Excel que cada organizador llena y que se sube de una vez."
  ),

  h2("11.1. Una sola capa para las cuatro secciones"),
  p(
    "Las cuatro importaciones comparten la lectura de celdas, la búsqueda de columnas por nombre —de modo que la hoja se pueda reordenar o renombrar sin romper la carga—, el reporte de errores por fila y la revisión previa en dos pasos: el primero no escribe nada y dice qué filas entran, cuáles ya existían y cuáles tienen problemas; el segundo confirma."
  ),

  h2("11.2. La imagen va como enlace"),
  p(
    "Una hoja de cálculo no puede llevar la foto adentro, así que lleva su enlace. Un enlace de Drive o de OneDrive devuelve una página, no la imagen, de modo que la plataforma lo traduce a su forma de descarga directa, baja el archivo al importar, comprueba por sus primeros bytes que sea de verdad una imagen y lo guarda en el almacenamiento del sitio. De ahí en adelante el evento ya no depende del Drive de nadie."
  ),
  p(
    "La descarga se hace desde el servidor, así que se protegió contra el abuso evidente: rechaza las direcciones internas y las de metadatos de la nube, vuelve a comprobarlo después de cada redirección y tiene tope de tiempo y de tamaño."
  ),

  h2("11.3. Lo que no se vuelve a crear"),
  p(
    "AEUVG pidió dos reglas para los eventos. Un evento cuya fecha ya pasó no se crea, y la fila se reporta con el motivo. Un evento que ya existe con el mismo nombre y la misma fecha tampoco: se omite y se crean solo los que faltaban, de modo que el mismo archivo se pueda volver a cargar cuando se le agregan filas sin duplicar las anteriores. Los eventos importados entran como borrador, igual que los creados a mano."
  ),

  // ---------- 12 ----------
  h1("12. HU-42 - Préstamo de batas y voluntariado del salón"),
  p(
    "AEUVG presta batas de laboratorio y lentes de protección en un salón que atienden estudiantes voluntarios por turnos. Todo se llevaba en un Excel con cuatro hojas: los préstamos, una lista negra de quien no devolvió, los turnos de los voluntarios y las etiquetas de las batas. El módulo reemplaza ese archivo."
  ),

  h2("12.1. Lo que ve el estudiantado"),
  p(
    "Una página pública con lo que hay disponible ahora mismo —batas azules y blancas por talla, y lentes— y el horario de atención del salón. El horario se presenta como un horario y no como una lista: las horas en el costado y los días arriba. El fin de semana va en su propia tabla porque el sábado se abre a otras horas, y en el teléfono se escoge el día con una pestaña."
  ),

  h2("12.2. Ser voluntario"),
  p(
    "El estudiante se postula marcando los turnos que puede cubrir. AEUVG revisa las postulaciones y asigna. Cada turno admite dos voluntarios: cuando se llena deja de aceptar postulaciones, y mientras no lo esté las sigue recibiendo. La regla vive en el servicio, no en la pantalla, de modo que dos postulaciones simultáneas no puedan dejar tres personas en un turno."
  ),

  h2("12.3. El turno del voluntario"),
  p(
    "Al ser aceptado se le habilita su panel: registra los préstamos y sus devoluciones, anota la lista negra y cierra su turno con una foto de cuando entró y otra de cuando salió. Cada préstamo descuenta del inventario y cada devolución lo repone, de modo que la disponibilidad que ve el estudiantado siempre cuadre con lo que de verdad hay en el salón."
  ),
  p(
    "Enviar el comprobante cierra la jornada: los formularios desaparecen, porque ya no está atendiendo, y en su lugar queda el registro de lo que hizo ese día. La regla también está del lado del servidor, para que el cierre valga aunque alguien mande la petición a mano."
  ),

  h2("12.4. Lo que revisa AEUVG"),
  p(
    "Desde el panel administra el inventario por tipo y talla, los turnos del salón y las postulaciones, consulta los préstamos y la lista negra, y revisa los comprobantes con sus dos fotos. Al aprobarlos, las horas del turno entran al módulo de horas beca del voluntario como pendientes de acreditar, por la duración del turno."
  ),

  // ---------- 13 ----------
  h1("13. HU-43 - Reporte de eventos"),
  p(
    "La sección de reportes solo cubría las horas beca. AEUVG pidió el equivalente para los eventos, con un filtro concreto: los que organizó ella misma, que son de los que rinde cuentas."
  ),
  p(
    "El reporte se filtra por periodo, organizador, categoría, tipo y estado, y se descarga en Excel o en CSV con todos los datos de cada evento. La descarga arrastra los filtros de la pantalla, de modo que el archivo traiga exactamente lo que se está viendo. Debajo quedan los eventos por mes, por categoría y por organizador."
  ),
  p(
    "Una aclaración que el reporte deja escrita: la plataforma no lleva lista de asistentes, porque nadie pasa asistencia en la puerta. El alcance de cada actividad se mide con lo que sí queda registrado, que es cuántos estudiantes la guardaron en su perfil y cuántas horas beca generó. Un evento con varios organizadores cuenta para cada uno, de modo que esa tabla responde en cuántas actividades participó cada grupo y no cómo se reparte el total."
  ),

  // ---------- 14 ----------
  h1("14. HU-44 - Doble validación de las tutorías y sus horas beca"),
  p(
    "Una tutoría da horas beca al tutor, y hasta aquí bastaba con que el tutor la marcara como dada. AEUVG pidió que eso no alcanzara."
  ),
  p(
    "El recorrido quedó así: el estudiante agenda y al tutor le llega el aviso; el tutor entra, ve la ficha y acepta o rechaza, con un motivo opcional que el estudiante verá. Si la acepta y la da, sube dos pruebas, una del inicio y otra del final. El estudiante, por su lado, confirma con una foto que el tutor se presentó. Con esas tres pruebas AEUVG revisa en el panel y acepta o rechaza las horas; al aceptarlas se crea el registro del tutor por lo que duró la tutoría y queda pendiente de acreditar como cualquier otro apoyo."
  ),
  p(
    "Dos decisiones de la regla. Las pruebas no se admiten antes de la hora de inicio, porque una foto del arranque subida la víspera no prueba nada. Y AEUVG puede aceptar las horas aunque falte la confirmación del estudiante, porque no siempre entra a la página; la ficha lo señala para que la decisión se tome viéndolo. Las dos escrituras de la aceptación van en una transacción: un registro de horas sin tutoría cerrada se volvería a acreditar en la siguiente revisión."
  ),

  // ---------- 15 ----------
  h1("15. HU-45 - Ajustes de presentación del sitio"),
  p(
    "El último grupo de cambios salió de revisar el sitio con AEUVG en una pantalla y en un teléfono."
  ),
  p(
    "La sección Explora de la portada eran seis tarjetas iguales que en el teléfono se apilaban una debajo de otra y obligaban a recorrer media pantalla por sección. Pasó a dos columnas desde el teléfono, con el icono de cada sección como textura de la tarjeta. El calendario de eventos no se veía en el teléfono —solo quedaba la lista de días—, así que se agregó una rejilla del mes que conserva la forma de un calendario y marca con un punto de color cada actividad. La portada de Sobre AEUVG era una franja de un morado saturado que no pertenecía a la paleta y se reemplazó por una tarjeta con los colores del sitio."
  ),
  p(
    "Por último se unificó el reloj. El selector mostraba las horas en doce horas mientras el resto de la pantalla las mostraba en veinticuatro, de modo que al agendar una tutoría se leía «4:30 p.m.» arriba y «17:30» abajo. Toda la plataforma usa ahora el reloj de veinticuatro horas."
  ),

  // ---------- 16 ----------
  h1("16. Endurecimiento de seguridad"),
  p(
    "Antes de dar el producto por cerrado se revisó contra el OWASP Top 10, que es la lista de referencia de riesgos de aplicaciones web. El detalle completo quedó en docs/seguridad.md; aquí van las decisiones."
  ),
  p(
    "Lo que ya estaba bien no se tocó: la autorización se decide en el servidor contra la base y no en el navegador, las consultas pasan por un ORM que parametriza, las contraseñas se guardan derivadas con scrypt y los tokens de correo se guardan cifrados."
  ),
  p(
    "Lo que faltaba eran las cabeceras: el sitio no enviaba ninguna. Se agregaron la política de contenidos —que solo deja correr los guiones que la propia página marca con un número distinto en cada visita—, el HTTPS obligatorio, el bloqueo de incrustación en otra página, el apagado de cámara, micrófono y ubicación, y se dejó de anunciar el marco y su versión. También se limitaron los intentos en todo el acceso y no solo en el inicio de sesión, se comprueba el origen de las peticiones que cambian algo, se valida el contenido real de las imágenes que se suben en lugar de creerle al encabezado, y los accesos fallidos y los permisos denegados quedan registrados."
  ),
  p(
    "Se actualizó además el marco por una vulnerabilidad crítica publicada en la versión que se estaba usando. Quedan dos avisos de dependencias que no se pueden cerrar sin romper el producto, los dos documentados con su razón: uno en la librería de Excel, cuya única corrección es bajar a una versión que no soporta las plantillas, y otro en el CLI del ORM, que es una dependencia de desarrollo y no se despliega."
  ),

  h1("17. Pruebas y verificación"),
  p(
    "Las pruebas automatizadas del proyecto pasaron de 408 a 735. Las 327 nuevas corresponden a este sprint y se ejecutan sin base de datos, sustituyendo el acceso a datos por dobles de prueba, para que puedan correrse en cualquier momento del desarrollo. La tabla recoge las del primer tramo, el de las siete historias de tutorías y cuentas; las del segundo tramo se describen debajo."
  ),
  spacer(),
  makeTable(
    [3400, 1400, 4560],
    ["Área", "Pruebas", "Qué se verifica"],
    [
      [
        "Postulación y su revisión",
        "20",
        "La nota mínima por curso, el comprobante del propio sitio, los cursos repetidos, que no se admita una segunda postulación pendiente, que aprobar dé de alta al tutor con sus cursos y que una resuelta no se vuelva a tocar.",
      ],
      [
        "Agenda de tutorías",
        "23",
        "La hora de reloj y el día de la semana en la zona del país, que la franja cubra el rango completo, la modalidad compatible, los traslapes, la fecha pasada, quién puede cancelar y quién completar, y que dos franjas del mismo día no se encimen.",
      ],
      [
        "Panel de cuentas",
        "13",
        "Que un filtro inválido se descarte, cómo se combinan estado, facultad, verificación y búsqueda, y que un administrador no pueda bloquear su propia cuenta.",
      ],
      [
        "Notificaciones",
        "5",
        "Que cada tipo tenga etiqueta, que marcar como leída guarde la cuenta y el momento, que una ajena responda como no encontrada y que la ruta exija sesión.",
      ],
      [
        "Fotografía de perfil",
        "4",
        "Que solo se admita una imagen servida por la plataforma, los tres formatos aceptados y que la sesión la lleve para el avatar del encabezado.",
      ],
      [
        "Intereses y recomendaciones",
        "6",
        "Que la selección se quede solo con identificadores reales, sin repetidos y cortada en el máximo, y que una selección vacía sea válida.",
      ],
      [
        "Calendario del panel",
        "2",
        "Que el filtro público deje fuera justo lo que el panel tiene que ver, y que la sección exija el rol de administrador.",
      ],
      [
        "Carga masiva desde Excel",
        "47",
        "La lectura de las columnas por nombre, las fechas en los tres formatos en que se escriben, el evento con fecha pasada y el repetido, el repetido dentro del mismo archivo, la traducción de los enlaces de Drive y OneDrive, el rechazo de las direcciones internas y que un archivo que no es una imagen no pase por una.",
      ],
      [
        "Préstamo de batas y voluntariado",
        "62",
        "Que un préstamo no saque más unidades de las disponibles, que la devolución las reponga, el tope de dos voluntarios por turno, el cálculo de las horas del turno, el día del comprobante en la zona del país y que con el turno cerrado no se registre nada más.",
      ],
      [
        "Doble validación de tutorías",
        "22",
        "Quién puede aceptar, rechazar y marcar como dada, que las pruebas no se admitan antes de la hora de inicio, que el estudiante confirme una sola vez, que las horas no se acepten dos veces y que las horas acreditadas sean exactamente lo que duró la tutoría.",
      ],
      [
        "Reporte de eventos",
        "21",
        "Que un filtro con basura se descarte, que el periodo se ancle a la hora del país, que el filtro de AEUVG no devuelva todo cuando la asociación no está cargada, el agrupado por mes y que un evento con dos organizadores cuente para los dos.",
      ],
      [
        "Horario del salón",
        "8",
        "Que los bloques salgan en orden de reloj, que solo aparezcan los días que abren y que un bloque que existe un solo día no invente turnos en los demás.",
      ],
      [
        "Seguridad",
        "29",
        "Que la política de contenidos no admita guiones en línea, que una escritura desde otra página se rechace, los topes de intentos con su ventana, que un hash con parámetros flojos siga sirviendo para entrar y se marque para rehacerse, y que un hash manipulado se rechace.",
      ],
    ]
  ),
  spacer(),
  p(
    "Además de las pruebas automatizadas se verificó que el proyecto compile sin errores de tipos, que el análisis estático no reporte problemas y que la compilación de producción se complete con todas las rutas nuevas del sprint. Se comprobó también que todos los enlaces internos del sitio resuelvan a una ruta existente, que es la revisión que en el sprint anterior destapó el enlace roto de tutorías; ese enlace volvió al menú en este sprint, ya con su sección detrás."
  ),
  p(
    "Las tres migraciones del sprint se aplicaron en el ambiente de Railway antes de publicar nada en la rama principal, siguiendo la regla que el proyecto documentó tras el incidente del Sprint 4: la fotografía de perfil el 13 de noviembre, y las del préstamo de batas y la doble validación de tutorías el 26. Cada una se comprobó después contra la base con su propio verificador. La comprobación posterior confirmó que la columna existe, que es opcional y que admite quinientos caracteres, que las ocho tablas del módulo de tutorías y notificaciones siguen en su sitio, que el rol de tutor está en el catálogo, que ningún tutor quedó sin cursos asignados y que toda postulación aprobada tiene su tutor dado de alta. La verificación de la información de prueba se volvió a ejecutar al cierre y pasó completa, sin relaciones huérfanas ni duplicados."
  ),
  p(
    "El segundo tramo se verificó además contra el sitio funcionando, y no solo con pruebas: se cargó un archivo de eventos de ejemplo contra la base real y se comprobó que los tres eventos nuevos quedaran como borrador con sus horarios y su imagen descargada, que el repetido se omitiera y que las dos filas con problemas se reportaran; se recorrió el camino completo de una tutoría hasta que sus horas aparecieron en el módulo de horas beca del tutor; se cerró un turno del salón y se comprobó que los formularios desaparecieran y que el historial de la jornada quedara; y se comprobaron las cabeceras de seguridad, el rechazo de una petición lanzada desde otro origen y el tope de intentos del acceso. Todos los datos de prueba creados en ese recorrido se borraron al terminar."
  ),

  // ---------- 9 ----------
  h1("18. Estado del proyecto"),
  p(
    `Las quince historias de este sprint se encuentran completadas, con ${tiempos.enHoras(tiempos.totalEquipo)} horas de trabajo de equipo repartidas en tres semanas y media. Es el sprint más largo del proyecto, y lo explica que concentrara todo lo que faltaba del producto más lo que AEUVG fue pidiendo al ver funcionando cada incremento. El detalle por sesión se encuentra en la sección 19. Con este sprint, la plataforma cuenta con:`
  ),
  bullet(
    "Autenticación propia con verificación de correo institucional, recuperación de contraseña y tres roles."
  ),
  bullet("Cartelera de eventos con su catálogo, sus filtros, su buscador y su calendario."),
  bullet(
    "Asociaciones y clubes con su junta directiva, sus redes sociales y sus medios de contacto."
  ),
  bullet(
    "Perfil del estudiante con sus datos, su fotografía, sus eventos guardados y sus recomendaciones."
  ),
  bullet(
    "Módulo de horas beca completo: registro por carnet y en lote, acreditación, importación desde el archivo que AEUVG ya usa, exportación en tres formatos y reportes del programa por facultad, por mes y por estudiante."
  ),
  bullet(
    "Módulo de tutorías completo: catálogo de cursos administrable, postulación con comprobantes, revisión de AEUVG, directorio público, horarios, agenda y doble validación con sus horas beca."
  ),
  bullet(
    "Préstamo de batas y voluntariado del salón: inventario por tipo y talla, préstamos con su devolución, lista negra, turnos, postulación con tope de dos personas y comprobantes de horas con sus fotos."
  ),
  bullet(
    "Carga masiva desde Excel de eventos, asociaciones, clubes y cursos, con plantilla, revisión previa y descarga de la imagen por enlace."
  ),
  bullet(
    "Reportes de horas beca y de eventos, con sus filtros y su descarga, incluido el filtro de los eventos organizados por AEUVG."
  ),
  bullet(
    "Notificaciones de la cuenta, modo oscuro, selectores propios de fecha y hora y página institucional administrable desde el panel."
  ),
  bullet(
    "Revisión de seguridad contra el OWASP Top 10, con sus cabeceras, sus topes de intentos y su registro de hechos."
  ),
  p(
    "No queda ninguna pantalla del panel marcada como pendiente, y el componente que las señalaba se retiró del proyecto. Lo que continúa fuera del alcance del desarrollo es el trámite del dominio institucional, iniciado en el Sprint 1 y en gestión con la universidad, y la carga de los históricos reales de horas beca, que AEUVG realiza con sus propias hojas usando el importador y el procedimiento entregados en el Sprint 5."
  ),
  p(
    "Tras la revisión del Sprint 5 se incorporaron además las observaciones de AEUVG sobre el módulo de horas beca, descritas en la sección 2, y se retiraron del producto las dos historias de convocatorias que la asociación no quiso. Con eso, el proyecto queda cerrado: lo único que continúa fuera del desarrollo es el trámite del dominio institucional y la carga de los históricos reales, que AEUVG hace con sus propias hojas."
  ),

  // ---------- 19. Registro de tiempos ----------
  ...tiempos.bloques,
]);

const out = path.join(__dirname, "..", "..", "Documentos", "AEUVG - Desarrollo Sprint 6.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("Documento generado:", out);
});
