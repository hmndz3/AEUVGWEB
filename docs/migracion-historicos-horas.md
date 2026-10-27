# Migración de los históricos de horas beca

Procedimiento para pasar a la plataforma el control que AEUVG llevaba en hojas de cálculo. Implementado durante el Sprint 5 (HU-26 y HU-27). No requiere migración de base de datos: `registro_hora_beca` e `importacion_horas` existen desde el Sprint 1 y el carnet se agregó en el Sprint 4.

## Qué hace el importador

Lee una hoja de Excel, la valida fila por fila contra las mismas reglas del formulario del panel y guarda solo las filas correctas, dejando constancia de la carga en `importacion_horas` con el detalle de lo que falló.

El trabajo está partido en dos pasos a propósito:

1. **Revisión.** Lee y valida sin escribir nada. Devuelve cuántas filas están bien, cuántas no y qué le pasa a cada una.
2. **Importación.** Repite la lectura y guarda las filas correctas.

La revisión es lo que evita el caso que hace daño: descubrir los errores cuando ya se guardó medio archivo. El archivo no se guarda en el servidor entre los dos pasos; el navegador lo vuelve a enviar al confirmar.

## Antes de empezar

- La plantilla se descarga desde `/admin/horas-beca/importar` o desde `/api/admin/horas-beca/plantilla`. Se genera en cada descarga a partir de la misma lista de columnas que usa el importador, así que no puede quedarse desalineada.
- Las columnas se localizan por su encabezado, no por su posición: la hoja puede traerlas en cualquier orden y puede tener columnas propias de más. Lo que no puede es tener los encabezados renombrados.
- `Observaciones` es la única columna opcional; puede quedar vacía o quitarse entera.
- Máximo 2000 filas de datos y 5 MB por archivo. Un histórico más grande se divide en varios archivos y se carga uno por uno.
- Conviene empezar con un archivo pequeño —veinte o treinta filas— para ver cómo responde la validación antes de cargar años completos.

## Procedimiento

1. Entrar al panel como administrador y abrir **Horas beca → Importar desde Excel**.
2. Descargar la plantilla y volcar el histórico en la hoja `Horas beca`, borrando la fila de ejemplo.
3. Elegir el archivo y pulsar **Revisar archivo**. La pantalla indica cuántas filas se leyeron, cuántas están correctas y cuáles tienen problemas, con el número de fila tal como lo muestra Excel.
4. Corregir en el mismo archivo las filas señaladas y volver a revisarlo. Se puede repetir cuantas veces haga falta: la revisión no escribe nada.
5. Pulsar **Importar** cuando el reporte esté limpio, o cuando se decida dejar fuera las filas que no se pueden corregir.
6. Verificar el resultado en el listado de `/admin/horas-beca`, acotado al periodo que se acaba de cargar.

Si una carga queda a medias, el estado de `importacion_horas` lo registra como `PARCIAL` y guarda en `detalle_errores` las filas que no entraron, de modo que después se pueda saber qué falta sin volver a abrir el archivo.

## Qué se valida

Las mismas reglas del formulario del panel, porque el importador reutiliza su esquema de validación (`esquemaRegistroHoraAdmin`). Una fila con varios problemas se reporta una sola vez, con el primero: el reporte sirve para saber qué filas revisar, no para enumerar cada defecto.

| Columna               | Regla                                                                       |
| --------------------- | --------------------------------------------------------------------------- |
| Carnet                | De 3 a 20 caracteres, letras, números y guiones. Se guarda en mayúsculas.   |
| Nombre del estudiante | De 3 a 200 caracteres.                                                      |
| Fecha de la actividad | Fecha real de Excel, o texto como `2026-10-09`, `09/10/2026` o `9-10-2026`. |
| Hora de inicio y fin  | Celda con formato de hora, o texto como `14:00` o `9:00`.                   |
| Actividad             | De 3 a 1000 caracteres.                                                     |
| Cantidad de horas     | Mayor que cero, hasta 24 y con dos decimales como máximo.                   |
| Observaciones         | Opcional, hasta 1000 caracteres.                                            |

Además, la hora de fin tiene que ser posterior a la de inicio. Las filas enteramente vacías —el relleno que deja Excel al final de la hoja— se descartan sin contarlas como error.

El rango amplio del carnet es deliberado: las hojas históricas incluyen carnets de otras épocas, y exigir los cinco dígitos del formulario de registro dejaría fuera justamente la información que este procedimiento viene a rescatar.

## Carnets sin cuenta

Una fila cuyo carnet no tiene cuenta en la plataforma se importa igual, con el nombre que trae la hoja y sin vínculo. Cuando esa persona se registre, el registro de estudiantes vincula sola las filas de su carnet: es el mismo mecanismo del Sprint 4, descrito en [horas-beca.md](horas-beca.md).

Cuando el carnet sí tiene cuenta, el registro se guarda con el nombre verificado de la cuenta y no con el de la hoja, por si el histórico lo traía abreviado o mal escrito.

## Después de la migración

- Revisar en `/admin/reportes` cuántos registros quedaron sin cuenta vinculada. Es el dato que señala a quién le falta registrarse.
- Acreditar las horas cargadas con la acreditación en lote del listado, si el histórico ya venía dado por bueno.
- Conservar los archivos originales fuera de la plataforma hasta haber comprobado los totales por estudiante. `importacion_horas` guarda el nombre del archivo y sus conteos, no su contenido.
