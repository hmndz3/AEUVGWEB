# Módulo de horas beca

Implementado durante el Sprint 4 (HU-19 a HU-24) y ampliado en el Sprint 5. Sustituye el control que AEUVG llevaba en hojas de cálculo: el registro, la búsqueda, el filtrado y la acreditación de las horas de servicio del estudiantado, su consulta desde el perfil, la exportación y la importación de los históricos y el reporte del programa.

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

| Ruta                              | Método | Acceso        | Qué hace                                                 |
| --------------------------------- | ------ | ------------- | -------------------------------------------------------- |
| `/api/admin/horas-beca/exportar`  | GET    | Administrador | Descarga el listado filtrado en CSV, Excel o PDF.        |
| `/admin/horas-beca/importar`      | —      | Administrador | Revisión previa e importación de una hoja de Excel.      |
| `/api/admin/horas-beca/importar`  | POST   | Administrador | Revisa o importa el archivo, según la acción pedida.     |
| `/api/admin/horas-beca/plantilla` | GET    | Administrador | Descarga la plantilla de Excel del importador.           |
| `/admin/reportes`                 | —      | Administrador | Resumen del programa, desglose por mes y por estudiante. |

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

## Información de prueba

El conjunto de datos ficticios incluye nueve registros: pendientes y acreditados, manuales y provenientes de una importación, con cuenta vinculada y sin ella, repartidos entre dos carnets que no tienen ficha de estudiante. Hay dos importaciones de ejemplo, una que entró a medias y otra que entró completa, para que el reporte y la pantalla de importación tengan los dos casos. El verificador comprueba además que ningún registro quede sin vincular si su carnet sí tiene ficha, que es la señal de que alguna de las dos mitades de la asociación dejó de aplicarse.
