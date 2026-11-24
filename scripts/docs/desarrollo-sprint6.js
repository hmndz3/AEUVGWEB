// Genera Documentos/AEUVG - Desarrollo Sprint 6.docx
// Uso: node scripts/docs/desarrollo-sprint6.js
const { Packer } = require("docx");
const fs = require("fs");
const path = require("path");
const { p, bullet, h1, h2, makeTable, spacer, cover, buildDocument } = require("./template");
const { bloquesRegistroTiempos } = require("./tiempos-sprint6");

const tiempos = bloquesRegistroTiempos(10);
const doc = buildDocument([
  ...cover({
    subtitle: "Documento de Desarrollo del Sprint 6",
    date: "Guatemala, 24 de noviembre del 2026",
  }),

  // ---------- 1 ----------
  h1("1. Introducción"),
  p(
    "El presente documento registra el desarrollo del Sprint 6 - Tutorías, cuentas y personalización (4 al 24 de noviembre de 2026) del proyecto de la plataforma web de la Asociación General de Estudiantes de la Universidad del Valle de Guatemala (AEUVG). Es el último sprint del proyecto y cierra todo lo que quedaba pendiente del alcance comprometido."
  ),
  p(
    "A diferencia de los cinco anteriores, este sprint no tuvo documento de planificación ni estimación previa. Se acordó cerrar en un solo tramo de tres semanas lo que faltaba, y el alcance se fue fijando historia por historia sobre el modelo de datos que el Sprint 1 había dejado completo. Por eso el documento parte de lo construido y no de lo planificado."
  ),
  p(
    "Al cierre del sprint no queda ninguna sección de la plataforma sin implementar: el panel administrativo ya no tiene pantallas marcadas como pendientes, el estudiantado puede postularse como tutor, agendar tutorías, recibir avisos, subir su fotografía y marcar qué le interesa, y AEUVG administra cuentas, postulaciones y tutores desde el panel."
  ),
  p(
    "El sprint requirió una sola migración, la de la fotografía de perfil, que agrega una columna opcional. Las siete tablas del módulo de tutorías y las tres de notificaciones y personalización existían en el modelo desde el Sprint 1 y se usaron tal como estaban diseñadas."
  ),

  // ---------- 2 ----------
  h1("2. Ajustes previos del panel de horas beca"),
  p(
    "El sprint abrió resolviendo dos observaciones que AEUVG dejó al revisar el Sprint 5, ambas sobre la misma pantalla."
  ),

  h2("2.1. Una tabla que cabe en la pantalla"),
  p(
    "La tabla de registros de horas se había ido llenando de columnas hasta salirse del ancho del panel, y revisarla obligaba a arrastrarla en horizontal en un monitor normal. Se ensanchó el contenedor del panel, que estaba pensado para texto y no para una zona de datos densos; se juntaron la fecha y el horario en una sola columna, porque son el mismo dato de cuándo se realizó el apoyo y por separado se llevaban el ancho de dos; y la actividad pasó a ajustarse en dos líneas en lugar de recortarse en una, que obligaba a pasar el cursor por encima para leer la columna que más se consulta."
  ),

  h2("2.2. Los estudiantes como burbujas"),
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
  h1("8. Pruebas y verificación"),
  p(
    "Las pruebas automatizadas del proyecto pasaron de 408 a 481. Las 73 nuevas corresponden a este sprint y se ejecutan sin base de datos, sustituyendo el acceso a datos por dobles de prueba, para que puedan correrse en cualquier momento del desarrollo."
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
    ]
  ),
  spacer(),
  p(
    "Además de las pruebas automatizadas se verificó que el proyecto compile sin errores de tipos, que el análisis estático no reporte problemas y que la compilación de producción se complete, incluyendo las catorce rutas nuevas del sprint: seis pantallas —el directorio de tutores, la ficha de un tutor, la postulación, el panel del tutor, las notificaciones y el calendario del panel, además de las dos que dejaron de ser marcadores— y ocho grupos de servicios. Se comprobó también que todos los enlaces internos del sitio resuelvan a una ruta existente, que es la revisión que en el sprint anterior destapó el enlace roto de tutorías; ese enlace volvió al menú en este sprint, ya con su sección detrás."
  ),
  p(
    "La migración de la fotografía de perfil se aplicó en el ambiente de Railway el 13 de noviembre, antes de publicar nada en la rama principal, siguiendo la regla que el proyecto documentó tras el incidente del Sprint 4. La comprobación posterior confirmó que la columna existe, que es opcional y que admite quinientos caracteres, que las ocho tablas del módulo de tutorías y notificaciones siguen en su sitio, que el rol de tutor está en el catálogo, que ningún tutor quedó sin cursos asignados y que toda postulación aprobada tiene su tutor dado de alta. La verificación de la información de prueba se volvió a ejecutar al cierre y pasó completa, sin relaciones huérfanas ni duplicados."
  ),

  // ---------- 9 ----------
  h1("9. Estado del proyecto"),
  p(
    `Las siete historias de este sprint se encuentran completadas, con ${tiempos.enHoras(tiempos.totalEquipo)} horas de trabajo de equipo. El detalle por sesión se encuentra en la sección 10. Con este sprint, la plataforma cuenta con:`
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
    "Módulo de horas beca completo: registro por carnet, acreditación, importación desde Excel, exportación en tres formatos y reportes del programa."
  ),
  bullet(
    "Módulo de tutorías completo: postulación con comprobantes, revisión de AEUVG, directorio público, horarios y agenda."
  ),
  bullet("Notificaciones de la cuenta y panel administrativo sin secciones pendientes."),
  p(
    "No queda ninguna pantalla del panel marcada como pendiente, y el componente que las señalaba se retiró del proyecto. Lo que continúa fuera del alcance del desarrollo es el trámite del dominio institucional, iniciado en el Sprint 1 y en gestión con la universidad, y la carga de los históricos reales de horas beca, que AEUVG realiza con sus propias hojas usando el importador y el procedimiento entregados en el Sprint 5."
  ),
  p(
    "Tras la revisión del Sprint 5 se incorporaron además dos observaciones de AEUVG sobre el panel de horas beca, descritas en la sección 2: la tabla que no cabía en pantalla y el registro de varios estudiantes como burbujas dentro del formulario de siempre."
  ),

  // ---------- 10. Registro de tiempos ----------
  ...tiempos.bloques,
]);

const out = path.join(__dirname, "..", "..", "Documentos", "AEUVG - Desarrollo Sprint 6.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("Documento generado:", out);
});
