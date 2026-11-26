# Módulo de tutorías

Implementado durante el Sprint 6. Cubre el ciclo completo: un estudiante se postula para dar tutorías de los cursos que aprobó, AEUVG revisa la postulación, el aprobado publica sus horarios en el directorio y cualquier estudiante le agenda una sesión.

No requirió migración de base de datos en el Sprint 6; en las pruebas finales se agregó `curso.propuesto` (`20261124000000_add_propuesto_curso`) para la opción Otro. Las siete tablas del módulo —`curso`, `postulacion_tutor`, `curso_postulacion`, `tutor`, `tutor_curso`, `disponibilidad_tutor` y `tutoria`— existen desde el Sprint 1. Lo único que se agregó en este sprint fue `estudiante.foto_url`, que pertenece al perfil y se describe en [perfil-y-eventos-guardados.md](perfil-y-eventos-guardados.md).

## La nota respalda el curso, no a la persona

Es la decisión que define la postulación. Se pide una nota por cada curso al que alguien se postula, y no un promedio: quien sacó cien en cálculo puede no estar en condiciones de dar química, y un promedio alto escondería exactamente eso.

Cada curso de la postulación va además con su comprobante, que es obligatorio. La nota la declara quien se postula, así que sin algo que la respalde la revisión de AEUVG no tendría con qué contrastarla. El comprobante es una imagen subida desde la propia pantalla: se valida que sea una imagen servida por la plataforma (`esImagenDelSitio`), porque aceptar una dirección externa dejaría la revisión dependiendo de un archivo que puede cambiar o desaparecer.

El mínimo es 80 (`NOTA_MINIMA_TUTOR`) y lo comprueba el servicio, no solo el formulario.

## Catálogo de cursos

Los cursos que se ofrecen en la postulación los administra AEUVG desde **Panel → Tutorías → Cursos** (`/admin/tutorias/cursos`): se agregan con código y nombre, se editan en la misma fila y se activan o desactivan. El código es único y se guarda en mayúsculas. Un curso solo se elimina si nadie lo usa; si ya tiene postulaciones, tutores o tutorías, se desactiva, para no perder ese historial.

El catálogo completo también se puede cargar de una vez desde un Excel de dos columnas —código y nombre— en **Panel → Tutorías → Cursos → Importar desde Excel** (`/admin/tutorias/cursos/importar`). La plantilla se descarga de la misma pantalla y acepta que la columna del código se llame «Id», que es como la tiene AEUVG hoy. El archivo se revisa antes de guardar nada: los códigos que ya existen se omiten, de modo que el mismo archivo se pueda volver a cargar cuando se le agreguen cursos sin duplicar los de antes. Si un código existe con otro nombre, se conserva el guardado y el reporte lo señala, porque renombrar un curso es una decisión de AEUVG y se hace desde el catálogo.

Si el curso de un estudiante no está en la lista, la postulación ofrece la opción **Otro**: escribe el nombre y, si lo conoce, el código. El servicio busca primero un curso existente con ese código o ese nombre; si no lo hay, crea uno inactivo y marcado como `propuesto` (con un código provisional `OTRO-XXXXXX` si no se indicó). Los propuestos no aparecen en el formulario ni en el directorio. Entran al catálogo al aprobar la postulación que los trae, o cuando AEUVG los admite desde la pestaña de cursos. El curso se resuelve al final de las validaciones, para no dejar propuestos de postulaciones que nunca se guardaron.

## Postularse y ser aprobado

Una cuenta no puede tener dos postulaciones sin resolver: duplicaría el trabajo de revisión sin aportar nada. Quien ya es tutor tampoco se postula de nuevo; para impartir otro curso escribe a AEUVG.

Aprobar es lo que crea al tutor, y son cinco escrituras que van juntas en una transacción: la postulación cambia de estado, entran al catálogo los cursos propuestos, nace o se reactiva el tutor, se le asignan los cursos que respaldó y se le concede el rol `TUTOR`. A medias dejaría a alguien aprobado sin poder entrar a su propia sección.

Una postulación ya resuelta no se vuelve a tocar: su comentario y su fecha son el registro de lo que AEUVG decidió, y reescribirlos borraría ese rastro. El comentario de un rechazo es obligatorio en la pantalla, porque un rechazo sin motivo obliga a la persona a adivinar qué faltó.

## Disponibilidad: días de la semana, no fechas

El tutor publica franjas por día de la semana y no por fecha. La disponibilidad se repite: quien puede los martes de dos a cuatro lo puede todos los martes del ciclo, y pedirle que marque fecha por fecha convertiría esto en un trabajo semanal.

Dos franjas del mismo día no pueden encimarse. Es lo que impide que el estudiante vea dos huecos para la misma hora y el tutor acabe con dos tutorías a la vez.

El lugar o el enlace son obligatorios en cada franja: son el dato que el estudiante necesita para presentarse, y una franja sin ellos no sirve de nada. Cuando se agenda una tutoría, el lugar sale de la franja y no del cuerpo de la petición; de otro modo se podría citar al tutor donde nunca dijo que estaría.

Las horas se guardan como `time(0)` y se convierten en UTC (`aHoraDeBase` / `aHoraDeReloj`), por el mismo motivo que el resto de las horas de reloj del proyecto: interpretarlas en la zona del país las correría seis horas.

## Agendar

La solicitud la hace el estudiante y le llega al tutor como notificación. El tutor la acepta o la rechaza desde su panel —con un motivo opcional que el estudiante verá—, y hasta que la acepte la cita no está cerrada. Una tutoría aceptada sigue ocupando su horario igual que una recién agendada.

Las reglas son las que impiden que una cita no se pueda cumplir:

- El horario pedido tiene que caber entero dentro de una franja publicada, no solo tocarla.
- La modalidad pedida tiene que caber en la que ofrece la franja. Una franja `AMBAS` admite las dos; pedir `AMBAS` como estudiante no significa nada, porque hay que presentarse de una forma o de la otra.
- El tutor no puede tener dos tutorías encimadas. Dos citas pegadas —una que acaba cuando la otra empieza— sí se admiten.
- La fecha no puede haber pasado. El corte se calcula con el instante real, y la fecha y la hora se combinan en la zona de Guatemala (`instanteEnGuatemala`), que no cambia de horario en todo el año.
- Nadie se agenda una tutoría consigo mismo.

Cancelar lo pueden los dos mientras la cita siga en pie —agendada o aceptada—: al estudiante le surge algo y al tutor también. Una tutoría ajena responde como no encontrada en lugar de como prohibida, para no confirmar que existe.

## Doble validación y horas beca

Una tutoría da horas beca al tutor, así que no basta con que él diga que la dio. Después de la hora de inicio:

- El **tutor** sube dos pruebas, una del arranque y otra del final, y con eso la da por impartida. Las dos son obligatorias: es lo que las vuelve prueba. Antes de que la tutoría empiece no se admiten, porque una foto del inicio subida la víspera no prueba nada.
- El **estudiante** confirma por su lado con una foto de que el tutor se presentó. Puede hacerlo aunque el tutor todavía no haya subido las suyas: el orden en que cada uno entra a la página no es cosa del otro.
- **AEUVG** revisa las tres pruebas en **Panel → Tutorías → Horas** (`/admin/tutorias/horas`) y acepta o rechaza las horas. Aceptarlas crea el registro de horas beca del tutor por lo que duró la tutoría —una sesión de hora y media son 1.5 horas—, que queda pendiente de acreditar como cualquier otro apoyo y aparece en su módulo de horas beca. La tutoría pasa entonces a completada.

Se puede aceptar aunque falte la confirmación del estudiante, porque no siempre entra a la página; la ficha lo señala para que la decisión se tome viéndolo. Si AEUVG rechaza las horas, el tutor puede volver a subir las pruebas y enviarlas otra vez.

Las dos escrituras de la aceptación van en una transacción: un registro de horas sin tutoría cerrada se volvería a acreditar en la siguiente revisión, y una tutoría cerrada sin registro dejaría al tutor sin sus horas.

## Pantallas y servicios

| Ruta                                     | Método | Acceso        | Qué hace                                                 |
| ---------------------------------------- | ------ | ------------- | -------------------------------------------------------- |
| `/tutorias`                              | —      | Pública       | Directorio de tutores activos, con filtro por curso.     |
| `/tutorias/[id]`                         | —      | Pública       | Ficha del tutor y formulario para agendar.               |
| `/tutorias/postular`                     | —      | Con sesión    | Postulación con sus cursos, notas y comprobantes.        |
| `/tutorias/panel`                        | —      | Tutor         | Horarios, tutorías solicitadas y ficha pública.          |
| `/api/tutorias/postulaciones`            | POST   | Con sesión    | Envía la postulación del estudiante de la sesión.        |
| `/api/tutorias`                          | POST   | Con sesión    | Agenda una tutoría con el tutor y el horario elegidos.   |
| `/api/tutorias/[id]`                     | PATCH  | Con sesión    | Cancela la tutoría.                                      |
| `/api/tutorias/[id]/respuesta`           | POST   | Tutor         | Acepta o rechaza la tutoría que le agendaron.            |
| `/api/tutorias/[id]/pruebas`             | POST   | Tutor         | Da la tutoría por impartida con sus dos pruebas.         |
| `/api/tutorias/[id]/confirmacion`        | POST   | Con sesión    | El estudiante confirma la tutoría con una foto.          |
| `/api/tutorias/ficha`                    | PUT    | Tutor         | Guarda la descripción y el contacto del tutor.           |
| `/api/tutorias/disponibilidad`           | POST   | Tutor         | Agrega una franja de disponibilidad.                     |
| `/api/tutorias/disponibilidad/[id]`      | DELETE | Tutor         | Quita una franja.                                        |
| `/api/imagenes/subir`                    | POST   | Con sesión    | Sube el comprobante o la fotografía del estudiante.      |
| `/admin/tutorias`                        | —      | Administrador | Tutores, con filtros por nombre, carnet, estado y curso. |
| `/admin/tutorias/postulaciones`          | —      | Administrador | Postulaciones por estado, con la foto del estudiante.    |
| `/admin/tutorias/cursos`                 | —      | Administrador | Catálogo de cursos y cursos propuestos.                  |
| `/admin/tutorias/cursos/importar`        | —      | Administrador | Carga del catálogo desde un Excel.                       |
| `/admin/tutorias/horas`                  | —      | Administrador | Horas de las tutorías dadas, con sus tres pruebas.       |
| `/api/admin/tutorias/cursos/plantilla`   | GET    | Administrador | Descarga la plantilla de cursos.                         |
| `/api/admin/tutorias/cursos/importar`    | POST   | Administrador | Revisa o carga el archivo de cursos.                     |
| `/api/admin/tutorias/horas/[id]`         | POST   | Administrador | Acepta o rechaza las horas de una tutoría.               |
| `/api/admin/tutorias/cursos`             | POST   | Administrador | Agrega un curso al catálogo.                             |
| `/api/admin/tutorias/cursos/[id]`        | PATCH  | Administrador | Edita, activa o desactiva un curso.                      |
| `/api/admin/tutorias/cursos/[id]`        | DELETE | Administrador | Elimina un curso que nadie usa.                          |
| `/api/admin/tutorias/postulaciones/[id]` | PATCH  | Administrador | Aprueba o rechaza una postulación.                       |
| `/api/admin/tutorias/tutores/[id]`       | PATCH  | Administrador | Activa, desactiva o suspende a un tutor.                 |

Las rutas de tutor no se protegen por el rol sino resolviendo el tutor de la sesión: el rol se concede al aprobar, pero la ficha y las franjas son de una persona concreta, y recibir el tutor por parámetro permitiría editar la de cualquiera.

La sección del panel abre en los tutores; las postulaciones, los cursos y las horas están en pestañas aparte, cada una con el número de pendientes, propuestos o por revisar, para que la vista de entrada no se llene de datos que solo se necesitan al revisar.

## Qué se ve y qué no

El directorio presenta solo a los tutores activos que imparten algún curso: uno sin cursos no se puede elegir para nada y listarlo solo haría más larga la búsqueda. Un tutor inactivo o suspendido desaparece del directorio por su estado, no por borrarse: sus tutorías ya realizadas siguen contando y su ficha vuelve si AEUVG lo reactiva.

La ficha del tutor muestra su fotografía cuando la tiene. Es el único sitio público donde aparece, y la pantalla del perfil lo advierte antes de subirla.

## Información de prueba

El conjunto de datos ficticios incluye dos cursos, una postulación con sus cursos, un tutor con dos franjas de disponibilidad y dos tutorías. `npm run db:verificar-tutorias` comprueba contra la base que la columna de la fotografía exista y sea opcional, que las ocho tablas del módulo sigan ahí, que el rol `TUTOR` esté en el catálogo, que ningún tutor haya quedado sin cursos y que toda postulación aprobada tenga su tutor dado de alta.
