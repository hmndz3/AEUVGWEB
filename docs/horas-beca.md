# Módulo de horas beca

Implementado durante el Sprint 4 (HU-19 a HU-24). Sustituye el control que AEUVG llevaba en hojas de cálculo: el registro, la búsqueda, el filtrado y la acreditación de las horas de servicio del estudiantado, más la consulta de cada estudiante desde su perfil.

La importación desde Excel, la exportación y las convocatorias para realizar horas corresponden al Sprint 5 y no forman parte de este módulo todavía.

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

Las rutas de administración usan `protegerRuta([ROLES.administrador])`, que responde 401 sin sesión y 404 sin el rol, para no revelar que existen. La sección del perfil se resuelve con el usuario de la sesión y nunca con un parámetro, igual que el resto del perfil.

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

El conjunto de datos ficticios incluye siete registros: pendientes y acreditados, manuales y provenientes de una importación, con cuenta vinculada y sin ella, repartidos entre dos carnets que no tienen ficha de estudiante. El verificador comprueba además que ningún registro quede sin vincular si su carnet sí tiene ficha, que es la señal de que alguna de las dos mitades de la asociación dejó de aplicarse.
