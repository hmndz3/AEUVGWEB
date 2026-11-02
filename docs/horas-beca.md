# Módulo de horas beca

Implementado durante el Sprint 4 (HU-19 a HU-24) y ampliado en el Sprint 5 (HU-25 a HU-30). Sustituye el control que AEUVG llevaba en hojas de cálculo: el registro, la búsqueda, el filtrado y la acreditación de las horas de servicio del estudiantado, su consulta desde el perfil, la exportación y la importación de los históricos, el reporte del programa y las convocatorias para realizar horas.

El procedimiento de migración de las hojas históricas se describe aparte, en [migracion-historicos-horas.md](migracion-historicos-horas.md).

## El carnet como identificador

Es la decisión que condiciona todo el módulo. La información no nace en la plataforma: existe desde antes, en hojas en las que la persona se identifica por carnet, y buena parte de esos carnets todavía no tiene cuenta ni ficha en `estudiante`.

Por eso `registro_hora_beca` guarda el `carnet` como dato obligatorio y su `id_estudiante` es opcional desde la migración `20261009010000_add_carnet_registro_hora_beca`. El vínculo con la cuenta se resuelve en dos momentos:

1. Al guardar un registro, el servicio busca la ficha del carnet y la vincula si existe (`ServicioHorasBeca`).
2. Al crearse una cuenta, la transacción del registro de estudiantes vincula los registros de ese carnet que no tenían dueño (`vincularRegistrosDeCarnet`, invocada desde `RepositorioRegistroPrisma`).

Las dos mitades comparan el carnet normalizado (sin espacios, en mayúsculas) e ignoran las mayúsculas en la consulta: el registro guarda el carnet normalizado, pero la ficha del estudiante conserva el que se capturó al crear la cuenta, y un carnet con letras quedaría sin vincular para siempre sin que nadie pudiera notarlo.

El `nombre_estudiante` del registro conserva el nombre con el que AEUVG lo cargó, porque un carnet sin cuenta no tiene de dónde tomarlo. Cuando el vínculo existe, el servicio guarda el nombre de la cuenta —que es el verificado contra el correo institucional— y el panel presenta además el nombre cargado cuando difiere: si no coinciden, lo más probable es que la fila se capturó con el carnet de otra persona.

## Pantallas y servicios

| Ruta                                 | Método | Acceso        | Qué hace                                                |
| ------------------------------------ | ------ | ------------- | ------------------------------------------------------- |
| `/admin/horas-beca`                  | —      | Administrador | Listado con buscador, filtros y resumen del periodo.    |
| `/admin/horas-beca/nuevo`            | —      | Administrador | Registro de horas de un carnet.                         |
| `/admin/horas-beca/[id]`             | —      | Administrador | Corrección de un registro.                              |
| `/api/admin/horas-beca`              | POST   | Administrador | Crea un registro, a nombre del administrador de sesión. |
| `/api/admin/horas-beca/[id]`         | PUT    | Administrador | Corrige los datos de un registro.                       |
| `/api/admin/horas-beca/[id]`         | DELETE | Administrador | Elimina un registro de forma definitiva.                |
| `/api/admin/horas-beca/acreditacion` | PATCH  | Administrador | Acredita o devuelve a pendiente los registros marcados. |
| `/perfil#mis-horas-beca`             | —      | Con sesión    | Totales e historial del estudiante de la sesión.        |

Lo que agregó el Sprint 5:

| Ruta                                              | Método | Acceso        | Qué hace                                                    |
| ------------------------------------------------- | ------ | ------------- | ----------------------------------------------------------- |
| `/api/admin/horas-beca/exportar`                  | GET    | Administrador | Descarga el listado filtrado en CSV, Excel o PDF.           |
| `/admin/horas-beca/importar`                      | —      | Administrador | Revisión previa e importación de una hoja de Excel.         |
| `/api/admin/horas-beca/importar`                  | POST   | Administrador | Revisa o importa el archivo, según la acción pedida.        |
| `/api/admin/horas-beca/plantilla`                 | GET    | Administrador | Descarga la plantilla de Excel del importador.              |
| `/admin/reportes`                                 | —      | Administrador | Resumen del programa, desglose por mes y por estudiante.    |
| `/admin/horas-beca/oportunidades`                 | —      | Administrador | Listado de convocatorias, incluidas las no publicadas.      |
| `/admin/horas-beca/oportunidades/nueva`           | —      | Administrador | Creación de una convocatoria, que nace como borrador.       |
| `/admin/horas-beca/oportunidades/[id]`            | —      | Administrador | Corrección de una convocatoria que todavía no es histórico. |
| `/api/admin/horas-beca/oportunidades`             | POST   | Administrador | Crea la convocatoria, a nombre del administrador de sesión. |
| `/api/admin/horas-beca/oportunidades/[id]`        | PUT    | Administrador | Corrige los datos, sin tocar el estado.                     |
| `/api/admin/horas-beca/oportunidades/[id]`        | DELETE | Administrador | Elimina una convocatoria sin horas registradas.             |
| `/api/admin/horas-beca/oportunidades/[id]/estado` | PATCH  | Administrador | Publica, cierra, cancela o finaliza la convocatoria.        |
| `/oportunidades`                                  | —      | Pública       | Convocatorias publicadas que todavía no han pasado.         |

Las rutas de administración usan `protegerRuta([ROLES.administrador])`, que responde 401 sin sesión y 404 sin el rol, para no revelar que existen. La sección del perfil se resuelve con el usuario de la sesión y nunca con un parámetro, igual que el resto del perfil. `/oportunidades` es pública y no exige sesión: su contenido es una convocatoria abierta a quien quiera presentarse.

## Exportación

Los tres formatos salen de la misma conversión a filas (`aFilaExportacion`), para que el CSV, el Excel y el PDF digan exactamente lo mismo: si cada uno formateara por su cuenta, con el tiempo una columna acabaría distinta en un archivo y en otro.

Se exporta lo que el panel está mostrando, con los filtros de la dirección, y no la base completa. El archivo se arma entero en memoria, así que la exportación se rechaza por encima de 5000 registros (`MAXIMO_REGISTROS_EXPORTACION`) con una explicación que pide acotar el periodo, en lugar de tumbar el servidor justo cuando AEUVG necesita el reporte.

El CSV se escribe con BOM y punto y coma, que es lo que Excel en español abre sin preguntar nada. En el Excel las horas van como número y no como texto, porque AEUVG suma y filtra sobre el archivo descargado. Un formato que no se reconozca responde 404 en lugar de caer a uno por omisión que nadie pidió.

## Importación

Dos pasos: la revisión lee y valida sin escribir nada, y la importación guarda solo las filas correctas. La revisión es lo que evita el caso que hace daño —descubrir los errores cuando ya se guardó medio archivo— y se puede repetir cuantas veces haga falta.

Las columnas se localizan por su encabezado y no por su posición: la hoja puede traerlas en cualquier orden. La validación reutiliza `esquemaRegistroHoraAdmin`, el mismo esquema del formulario del panel, así que una regla cambia en los dos sitios a la vez; lo único que agrega es armar el horario con las dos columnas de hora. Una fila con varios problemas se reporta una sola vez, con el primero.

`importacion_horas` deja constancia de cada carga con sus conteos y el detalle de lo que falló, y distingue la que entró entera (`COMPLETADA`) de la que entró a medias (`PARCIAL`). Los carnets se consultan de una sola vez y no fila por fila, porque un histórico repite al mismo estudiante decenas de veces.

La plantilla se genera en cada descarga a partir de la misma lista de columnas que usa el importador, de modo que no pueda quedarse desalineada. `npm run horas:verificar-plantilla` comprueba que el archivo que sale siga siendo legible para el que entra.

## Reportes

El resumen del programa cuenta los carnets como distintos y no como filas: el dato que AEUVG informa es a cuánta gente alcanzó el programa, no cuántas veces se capturó. Admite acotarse por periodo y nada más: con el estado ya filtrado, la columna de pendientes quedaría en cero y se leería como un dato en lugar de como un filtro.

La base suma y cuenta agrupando por día o por carnet, y el pliegue a meses y a estudiantes vive en `calculos-reportes.ts`, separado de las consultas para poder comprobarlo con grupos escritos a mano. El mes se calcula en UTC por el mismo motivo que la fecha de la actividad. El detalle por estudiante se agrupa por carnet y no por nombre: un mismo carnet puede traer el nombre escrito de dos maneras en hojas de distintos años, y agruparlo por nombre lo partiría en dos filas con la mitad de las horas cada una.

## Convocatorias

Una convocatoria nace `BORRADOR` y solo se ve en el sitio cuando se publica. El estado cambia por su propia ruta y no en el cuerpo de la edición, de modo que corregir una descripción no pueda publicar lo que todavía se estaba preparando. `CANCELADA` y `FINALIZADA` son el final del recorrido: desde ahí no se edita ni se cambia de estado, porque su información es la que vio quien se presentó.

Una convocatoria con horas registradas no se elimina, se cancela: esas horas son el historial de quien ya apoyó, y borrar la convocatoria las dejaría sin su origen. El panel ofrece eliminar solo cuando no hay ninguna, y el servidor lo rechaza igual si la petición llega por otro camino.

La fecha es un día de calendario y las horas son horas de reloj (`time(0)`), igual que están en la base: una convocatoria no es un instante, es un día y un horario. `horario-oportunidad.ts` hace la conversión en UTC, porque interpretarla en la zona del país la correría seis horas.

La consulta pública presenta únicamente las publicadas cuya fecha no ha pasado, de la más próxima a la más lejana. El corte compara contra el día de hoy en Guatemala, así que una convocatoria se retira sola al día siguiente sin que nadie tenga que cerrarla, y no desaparece la misma tarde en que se realiza.

## Estados y acreditación

Un registro nace `PENDIENTE`. La acreditación es una operación aparte, en su propio recurso, y no un campo del formulario: cambia el estado, guarda la fecha y deja constancia de quién la aplicó. Corregir una descripción no puede, por tanto, devolver a pendiente lo que AEUVG ya acreditó.

- **Acreditar** alcanza solo los registros que siguen pendientes, así que aplicarlo dos veces no reescribe la fecha ni el responsable del que ya estaba acreditado.
- **Revertir** devuelve a `PENDIENTE` y borra la fecha y el responsable, que es lo que exige el `CHECK` de la tabla. Existe porque una selección en lote se puede equivocar: sin reversión, corregirla obligaría a borrar los registros y volver a capturarlos.
- La respuesta informa cuántos registros se pidieron y cuántos cambiaron, porque una selección puede mezclar estados y el panel tiene que poder explicarlo. El listado presenta además quién acreditó cada registro y cuándo: con varios administradores usando el panel, es el único modo de rastrear una acreditación aplicada por error.

La fecha la pone el servidor y el responsable sale de la sesión: el cuerpo de la petición no puede falsear ninguno de los dos.

## Operaciones en lote

La selección vive en el cliente, no en la dirección: solo sirve para la operación que se está a punto de aplicar. La tabla se monta con una clave que incluye los filtros y la página, de modo que cambiar cualquiera de los dos la descarte en lugar de acreditar registros que ya no están en pantalla.

El lote admite hasta 200 registros (`MAXIMO_REGISTROS_EN_LOTE`), que es la selección que cabe en pantalla con holgura. Los identificadores llegan como lista y no como filtro: el panel acredita exactamente lo que el administrador marcó, y traducir un filtro a registros en el servidor podría alcanzar filas distintas de las que vio.

## Búsqueda, filtros y resumen

`registro_hora_beca.texto_busqueda` guarda la copia normalizada del carnet, el nombre del estudiante y la descripción de la actividad, con la misma regla que eventos y organizaciones (`src/lib/busqueda-texto.ts`): el panel tiene que encontrar un registro tanto por quién realizó las horas como por en qué apoyó.

Los filtros son estado, periodo de actividad y vínculo con la cuenta. Cada parámetro se valida por separado y el que no sea válido se descarta, con el mismo criterio que los filtros de eventos: una dirección mal escrita produce el listado sin ese filtro, no una pantalla de error.

El filtro de registros sin cuenta vinculada es el que le dice a AEUVG a qué carnets les falta registrarse en la plataforma.

Las pantallas de registro reciben en la dirección el listado del que vienen (`volver`) y regresan a él al guardar, con sus filtros intactos. El valor se comprueba con `destinoPanelHoras`: solo se acepta una ruta interna de esta misma sección, porque de otro modo el formulario serviría para enviar a alguien a un sitio ajeno.

El resumen de horas se calcula en la base y sobre la condición completa, no sumando las filas de la página: AEUVG cierra periodos de cientos de registros y el dato que necesita es justamente el que no cabe en pantalla.

## Fechas: día de calendario frente a instante

`fecha_actividad` es un `date` sin hora y PostgreSQL la compara contra la medianoche en UTC. Tanto el rango de los filtros (`diaCalendario`) como su presentación (`formatearFechaActividad`) trabajan en UTC: convertirla al desplazamiento de Guatemala la correría un día y una actividad del 9 de octubre se leería como del 8.

`fecha_acreditacion` sí es un instante (`timestamptz`) y se presenta en la hora de Guatemala, como el resto de las fechas del sitio.

## Precisión de las horas

Las horas se guardan en `Decimal(6,2)` y el esquema rechaza más de dos decimales, para que un 1.333 no se redondee en silencio y descuadre el total del estudiante. Los totales del perfil se suman en centésimas y se dividen al final: sumar treinta registros de 0.1 en coma flotante da 2.9999999999999996, que en pantalla se leería como 3 pero no coincidiría con lo que reporta el panel, que suma en la base.

Un registro admite hasta 24 horas (`MAXIMO_HORAS_POR_REGISTRO`): más de un día no es un apoyo, es un error de captura. Por la misma razón, el servicio rechaza una fecha de actividad posterior al día de hoy; el día de referencia se calcula en la zona de Guatemala, porque entre las 18:00 y la medianoche del país en UTC ya es el día siguiente y una captura nocturna habría quedado rechazada por futura.

## Eliminación

La eliminación es definitiva y no hay baja lógica, a diferencia de las organizaciones: una fila de horas mal capturada no tiene historial que preservar y dejarla oculta solo descuadraría los totales del estudiante. La confirmación del panel dice en qué consiste la operación en lugar de preguntar si se está seguro.

## Información de prueba

El conjunto de datos ficticios incluye nueve registros: pendientes y acreditados, manuales y provenientes de una importación, con cuenta vinculada y sin ella, repartidos entre dos carnets que no tienen ficha de estudiante. Hay dos importaciones de ejemplo, una que entró a medias y otra que entró completa, para que el reporte y la pantalla de importación tengan los dos casos. El verificador comprueba además que ningún registro quede sin vincular si su carnet sí tiene ficha, que es la señal de que alguna de las dos mitades de la asociación dejó de aplicarse.
