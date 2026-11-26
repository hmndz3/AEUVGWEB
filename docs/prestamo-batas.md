# Préstamo de batas y voluntariado

AEUVG presta batas y lentes de laboratorio en un salón atendido por estudiantes
voluntarios organizados en turnos. Antes, los voluntarios llevaban el registro en
hojas de Excel (datos de préstamo, lista negra, horarios de los voluntarios). Este
módulo lleva todo ese proceso a la plataforma: disponibilidad pública, postulación
y asignación de voluntarios, registro de préstamos y devoluciones, lista negra y
acreditación de horas beca por atender el salón.

## 1. Qué hace cada quien

- **Cualquier estudiante** ve en `/prestamo-batas` la disponibilidad de batas y
  lentes (por tipo y talla) y los horarios de atención del salón con quién los
  cubre. Desde ahí se postula como voluntario en `/prestamo-batas/postular`,
  eligiendo los turnos a los que puede atender.
- **El administrador**, en `/admin/prestamo-batas`, gestiona el inventario, los
  turnos de atención, revisa las postulaciones (asigna a cada estudiante a sus
  turnos, con un máximo de dos voluntarios por turno), consulta los préstamos y la
  lista negra, y revisa los comprobantes de horas de los voluntarios.
- **El voluntario** (rol `VOLUNTARIO`, que se concede al ser asignado a su primer
  turno) atiende desde `/prestamo-batas/panel`: registra préstamos y sus
  devoluciones, agrega a la lista negra y envía sus comprobantes de entrada y
  salida. Cuando el administrador aprueba un comprobante, se le acreditan las
  horas beca por la duración del turno.

## 2. Reglas del negocio

- **Dos voluntarios por turno.** Cada `TurnoVoluntariado` tiene `cupo` (2 por
  defecto). Un turno lleno deja de aceptar postulaciones y se muestra como
  cubierto. El cupo se cuenta dentro de la transacción de asignación para que dos
  revisiones simultáneas no metan a tres personas en un turno de dos
  (`RepositorioVoluntariosPrisma.aprobarPostulacion`).
- **Una postulación a la vez.** No se admite una segunda postulación mientras haya
  una sin resolver. Solo se postula a turnos activos, con cupo libre y a los que el
  estudiante no esté ya asignado.
- **El rol se concede y se retira solo.** Al asignar a alguien a su primer turno se
  le concede el rol `VOLUNTARIO`; al retirarle su última asignación activa, lo
  pierde (y con él, su pestaña). Las asignaciones son de baja lógica (`activo`),
  para conservar el historial y poder reasignar al mismo carnet.
- **El inventario nunca sale en negativo.** La disponibilidad de un artículo es su
  `cantidadTotal` menos lo que está prestado y sin devolver. Un préstamo no puede
  sacar más de lo disponible, y no se puede bajar el total por debajo de lo
  prestado. La devolución marca el préstamo como `DEVUELTO` y el artículo vuelve a
  contar como disponible (no hay movimiento de stock que deshacer: la
  disponibilidad siempre se calcula sobre los préstamos vigentes).
- **Las batas tienen talla, los lentes no.** Hay batas azules y blancas en tallas
  S, M, L y XL; los lentes son el mismo par para todos, así que se guardan sin
  talla y en una sola fila.
- **Horas por comprobante.** Al aprobar un `ComprobanteTurno` se crea un
  `RegistroHoraBeca` **pendiente de acreditar**, con `cantidadHoras` igual a la
  duración del turno (p. ej. 06:45–09:00 = 2.25 h), reutilizando el
  `ServicioHorasBeca` para que esas horas vivan junto con el resto de las del
  estudiante. La fecha del comprobante debe caer en el día del turno y no puede ser
  futura. Si el comprobante deja de estar pendiente entre la creación del registro
  y el guardado, el registro de horas se deshace para no dejarlo huérfano.

## 3. Modelo de datos

Enums: `TipoArticuloBata` (bata_azul, bata_blanca, lentes), `TallaBata`
(S, M, L, XL), `EstadoPrestamoBata` (prestado, devuelto), `EstadoComprobanteTurno`
(pendiente, aprobado, rechazado). Las postulaciones reutilizan `EstadoPostulacion`
y los turnos `DiaSemana`.

| Modelo                                       | Para qué                                                                                              |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `TurnoVoluntariado`                          | Catálogo de turnos (día + horario), con `cupo`. Gestionado por el admin.                              |
| `PostulacionVoluntario` + `TurnoPostulacion` | Postulación del estudiante y los turnos que eligió.                                                   |
| `AsignacionVoluntario`                       | Voluntario asignado a un turno (baja lógica con `activo`; único por turno+estudiante).                |
| `ArticuloInventario`                         | Un tipo+talla de artículo con su `cantidadTotal` (único por tipo+talla).                              |
| `PrestamoBata` + `ArticuloPrestado`          | Un préstamo con sus líneas; cada línea descuenta del inventario mientras el préstamo está `PRESTADO`. |
| `ListaNegraBata`                             | Quien no devolvió o devolvió con un problema. Solo nombre y justificación obligatorios.               |
| `ComprobanteTurno`                           | Entrada/salida de un turno; al aprobarse se liga al `RegistroHoraBeca` creado.                        |

Horas y horarios se guardan como `time(0)` (hora del día en UTC, como la
disponibilidad de los tutores); las fechas de préstamo y comprobante como `date`
(día de calendario en UTC). Ver `src/lib/prestamo-batas/formato-prestamo-batas.ts`
para las conversiones y el cálculo de la duración del turno.

Por eso el día de la semana de esas fechas se lee en UTC, con
`diaSemanaDeFechaDeCalendario`, y no con el `diaSemanaDe` de tutorías, que lee la
zona de Guatemala. Tutorías compara instantes reales y ahí la zona es lo
correcto; aquí la fecha es un día de calendario a medianoche UTC, y como
Guatemala va seis horas detrás, leerla en esa zona la corría al día anterior: el
jueves se leía miércoles y ningún comprobante pasaba la validación del día.

## 4. Código

Sigue el patrón del resto del proyecto: consultas de lectura en
`src/lib/prestamo-batas/consultas-prestamo-batas.ts`; reglas en servicios con
repositorio inyectable, probados sin base en `tests/prestamo-batas-*.test.ts`;
endpoints protegidos con `protegerRuta` en `src/app/api/prestamo-batas/**` (público
y voluntario) y `src/app/api/admin/prestamo-batas/**` (admin); esquemas Zod en
`src/validators/prestamo-batas.ts`. El cableado de servicios está en
`src/lib/prestamo-batas/crear-servicios-prestamo-batas.ts`.

Páginas: `/prestamo-batas` (pública), `/prestamo-batas/postular`,
`/prestamo-batas/panel` (voluntario) y `/admin/prestamo-batas` con sus subsecciones
(inventario, turnos, postulaciones, préstamos, comprobantes).

Los turnos se presentan como un horario y no como una lista: las horas en el
costado y los días arriba. `rejilla-turnos.ts` reacomoda la lista de turnos en esa
forma —saca los bloques distintos, los ordena por hora de inicio y deja a mano el
turno de cada cruce— y el componente del mismo nombre la dibuja. Lo usan los tres
sitios donde aparecen los turnos: la página pública, la postulación y el panel. Los
bloques no son iguales todos los días (entre semana se abre a las 6:45 y el sábado
a las 7:00), así que un bloque que solo existe un día deja vacías las demás
casillas de su fila, igual que en el horario de papel. En el teléfono no caben seis
columnas sin volver ilegible la letra: ahí se escoge el día con una pestaña y se
ven sus bloques.

## 5. Seed

Los turnos estándar del salón y un inventario inicial se cargan con un seed
idempotente, aparte del contenido de demostración porque **no se retiran**: son los
horarios reales y las existencias con las que AEUVG arranca.

```bash
npm run db:prestamo-batas            # base local
npm run db:railway:prestamo-batas    # Railway, por el proxy temporal
```

Carga las franjas de lunes a viernes (06:45–09:00, 09:00–12:00, 12:00–15:00,
15:00–18:00, 18:00–21:00) y las de sábado (07:00–10:00, 10:00–13:00), más batas
azules y blancas en las cuatro tallas y un lote de lentes. Volver a ejecutarlo no
duplica nada ni pisa las cantidades que ya se hayan ajustado desde el panel.

## 6. Comprobar la base

Después de migrar y sembrar, se comprueba contra la base que todo quedó bien:
las tablas y los enums, el rol, los turnos, que las batas tengan talla y los
lentes no, que ningún turno pase de su cupo, que lo prestado no supere el total
y que todo comprobante aprobado tenga su registro de horas.

```bash
npm run db:verificar-batas            # base local
npm run db:railway:verificar-batas    # Railway, por el túnel
```

## 7. Despliegue

La migración `20261126173647_add_prestamo_batas_y_voluntariado` solo agrega tablas
y enums, así que es segura de aplicar antes de publicar (ver
`docs/despliegue-railway.md`, sección 4). El rol `VOLUNTARIO` se agrega con
`npm run db:seed` (catálogos). Tras migrar y sembrar el rol, se puede correr el
seed de turnos e inventario.
