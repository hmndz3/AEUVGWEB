# Notificaciones y personalización

Implementado durante el Sprint 6. Cubre los avisos de la cuenta y las recomendaciones del perfil. No requirió migración: `notificacion`, `interes_usuario` e `interaccion_usuario` existen desde el Sprint 1.

## Un aviso nunca hace fallar la operación

`notificar()` no lanza. Una notificación acompaña a la operación, no es la operación: si el aviso falla, la postulación revisada o la tutoría agendada ya ocurrieron, y hacer fallar la petición por el aviso sería peor que quedarse sin él. El motivo se registra en el log para poder rastrearlo.

Por lo mismo los avisos se emiten desde los endpoints, después de que el servicio resolvió, y no dentro de los servicios: así las reglas de negocio siguen probándose sin base de datos y sin dobles de notificación.

## Cuándo se avisa

| Momento                        | A quién                      | Por qué                                                                 |
| ------------------------------ | ---------------------------- | ----------------------------------------------------------------------- |
| AEUVG resuelve una postulación | A quien se postuló           | Es la respuesta que estaba esperando; sin aviso tendría que ir a mirar. |
| Alguien agenda una tutoría     | Al tutor                     | Es quien tiene que presentarse, y no fue quien la creó.                 |
| Se cancela o se completa una   | A la otra parte              | Nunca a quien acaba de hacerlo: ya lo sabe.                             |
| AEUVG acredita horas beca      | A los estudiantes con cuenta | Es el dato por el que el estudiantado escribía a AEUVG.                 |

No se avisa al revertir una acreditación: suele ser la corrección de un error de AEUVG, y avisarlo sembraría en el estudiante una duda que no le toca.

El tipo se guarda como texto y no como enum del esquema, porque la lista crece con cada módulo y una migración por aviso nuevo sería desproporcionada. Vive en `tipos-notificacion.ts`, aparte del módulo que escribe, para que las pantallas puedan importarlo sin arrastrar el cliente de la base al navegador.

## Leer

Un aviso se marca como leído al abrirlo (clic en la tarjeta), no al entrar a la pantalla: quien entra a revisar sus avisos suele querer dejar pendientes los que todavía no resolvió, y marcarlos todos por el hecho de haberlos visto se los esconde. Si el aviso tiene destino, abrirlo lleva ahí; la marca se envía con `keepalive` para que no se pierda al cambiar de página, y la pantalla emite el evento `aeuvg:notificaciones` para que el contador del encabezado se actualice sin recargar. "Marcar todas como leídas" sigue disponible.

La cuenta entra en la condición de la escritura en lugar de comprobarse aparte, así que un aviso ajeno no se marca ni por accidente y responde como no encontrado, para no confirmar que existe.

El encabezado consulta solo el contador (`GET /api/notificaciones`): traer los cincuenta avisos para pintar un número sería desproporcionado, y es el único dato del encabezado que cambia sin recargar.

## Recomendaciones

Las recomendaciones salen de las categorías de evento que el estudiante marcó, no de lo más popular: la plataforma todavía no tiene volumen para que "lo popular" signifique algo, y presentar la cartelera ordenada por fecha como recomendación personal sería falso.

Se recomiendan los eventos publicados y próximos de esas categorías, sin los que ya guardó: si ya están en su lista, recomendárselos no le dice nada nuevo. Sin intereses marcados no se recomienda nada y la pantalla lo explica, en lugar de caer a un listado genérico.

La selección reemplaza a la anterior en una transacción, en lugar de resolver altas y bajas por separado: es una lista corta de casillas y la comparación tendría más que salir mal y nada que ganar. Una lista vacía es válida y significa no recibir recomendaciones.

`interes_usuario` guarda una referencia polimórfica: `tipo_interes` dice a qué tabla apunta `id_referencia`, y por eso no hay llave foránea. Los tipos viven en `intereses.ts`.

Guardar un evento deja además constancia en `interaccion_usuario`. Es un dato de apoyo para afinar las recomendaciones más adelante; como el aviso, nunca hace fallar la operación.

## Pantallas y servicios

| Ruta                         | Método | Acceso     | Qué hace                                           |
| ---------------------------- | ------ | ---------- | -------------------------------------------------- |
| `/notificaciones`            | —      | Con sesión | Avisos de la cuenta, con su estado de lectura.     |
| `/api/notificaciones`        | GET    | Con sesión | Cuántos avisos sin leer tiene, para el encabezado. |
| `/api/notificaciones/[id]`   | PATCH  | Con sesión | Marca un aviso como leído.                         |
| `/api/notificaciones/leidas` | POST   | Con sesión | Marca como leídos todos los pendientes.            |
| `/api/perfil/intereses`      | PUT    | Con sesión | Reemplaza las categorías que le interesan.         |
| `/api/perfil/foto`           | PUT    | Con sesión | Guarda o quita su fotografía de perfil.            |
