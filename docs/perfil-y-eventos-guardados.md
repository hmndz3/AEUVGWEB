# Perfil del estudiante y eventos guardados

Implementado durante el Sprint 3 (HU-17 y HU-18). Es la primera funcionalidad de la plataforma asociada a la cuenta del estudiante y no al rol de administración.

## Pantallas y servicios

| Ruta                        | Método | Acceso     | Qué hace                                         |
| --------------------------- | ------ | ---------- | ------------------------------------------------ |
| `/perfil`                   | —      | Con sesión | Datos de la cuenta, eventos guardados y edición. |
| `/api/perfil`               | PUT    | Con sesión | Actualiza el teléfono y la carrera.              |
| `/api/eventos/[id]/guardar` | POST   | Con sesión | Guarda el evento en el perfil.                   |
| `/api/eventos/[id]/guardar` | DELETE | Con sesión | Quita el evento del perfil.                      |

Las tres rutas usan `protegerRuta([])`: exigen sesión pero ningún rol, porque cualquier cuenta administra lo propio. `/perfil` está además en el `matcher` del middleware, que redirige al inicio de sesión cuando la cookie no es válida.

## Quién puede escribir sobre qué

Ninguna de las rutas recibe el identificador del estudiante: lo resuelve el servicio a partir del usuario de la sesión. Así no existe forma de leer ni escribir el perfil de otra persona, ni manipulando un enlace ni enviando un cuerpo distinto.

## Campos editables

El estudiante puede cambiar su teléfono y su carrera. El nombre, el carnet y el correo institucional son de solo lectura, con una nota en la pantalla que indica escribir a AEUVG para corregirlos:

- Identifican la cuenta.
- Con el carnet se asocian los registros de horas beca, incluidos los cargados antes de que el estudiante tuviera cuenta (Sprint 4), de modo que cambiarlo rompería ese vínculo.

El teléfono se guarda tal como lo escribió su dueño; solo se valida el formato (ocho dígitos, con prefijo `+502` y separadores opcionales). La plataforma únicamente lo muestra, así que normalizarlo le quitaría el formato con el que lo reconoce.

La carrera se comprueba contra la base además del esquema: este solo puede saber que es un número, no que la carrera exista y siga activa. La facultad no se edita, se deduce de la carrera.

## Eventos guardados

`EventoGuardado` ya existía en el modelo desde el Sprint 1, con su restricción de unicidad por usuario y evento. Reglas del servicio (`src/lib/perfil/servicio-eventos-guardados.ts`):

- Solo se guardan eventos publicados: un borrador o un evento cancelado no existen fuera del panel.
- Guardar dos veces el mismo evento no duplica el registro ni produce un error; la escritura es un `upsert`.
- Quitar no exige que el evento siga publicado: si AEUVG lo canceló, el estudiante todavía debe poder retirarlo de su lista.
- El listado del perfil vuelve a exigir que el evento esté publicado, por lo que un evento cancelado o eliminado desaparece de los guardados sin que nadie tenga que quitarlo.

El listado reutiliza `consultarEventosPublicados` del módulo de eventos y separa próximos de finalizados, con el mismo criterio de la cartelera: un evento sigue siendo próximo mientras no haya terminado.

## El control de guardar

`BotonGuardarEvento` aparece en la cartelera y en el detalle del evento. Decisiones:

- El estado se pinta ya marcado desde el servidor: la pantalla resuelve la sesión y consulta en una sola llamada cuáles de los eventos visibles están guardados, en lugar de que cada tarjeta pregunte por su cuenta.
- El cambio se refleja de inmediato y se revierte si el servidor lo rechaza. El control vive dentro de una tarjeta y esperar la respuesta deja la impresión de que no reaccionó.
- Sin sesión el control no se oculta: navega al inicio de sesión llevando la pantalla actual en `continuar`, de modo que al volver el estudiante quede donde estaba.
- En la tarjeta el control se coloca sobre ella y no dentro de su enlace, porque un botón dentro de un enlace no es HTML válido.
- La portada no lo muestra: así no paga la consulta de los eventos guardados en la pantalla más visitada del sitio.

## Pendientes para sprints posteriores

- Sección "Mis horas beca" dentro del perfil (Sprint 4).
- Recordatorios de los eventos guardados (Sprint 6).
