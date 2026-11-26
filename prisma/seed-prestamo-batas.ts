import "dotenv/config";
import { PrismaClient, type DiaSemana, type TallaBata, type TipoArticuloBata } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Seed del préstamo de batas: los turnos de atención estándar y un inventario
 * inicial de batas y lentes.
 *
 * A diferencia del contenido de demostración, esto no se retira: son los
 * horarios reales del salón y las existencias con las que AEUVG arranca, que
 * después ajusta desde el panel. Es idempotente —los turnos se identifican por
 * su día y horario, y los artículos por su tipo y talla—, así que volver a
 * ejecutarlo no duplica nada y respeta las cantidades que ya se hayan editado.
 *
 * Uso:
 *   npm run db:prestamo-batas            (base local)
 *   npm run db:railway:prestamo-batas    (Railway, por el proxy temporal)
 */

const DIA_DE_REFERENCIA = "1970-01-01";

function hora(valor: string): Date {
  return new Date(`${DIA_DE_REFERENCIA}T${valor}:00.000Z`);
}

/** Franjas de lunes a viernes y las de sábado, tal como atiende el salón. */
const FRANJAS_ENTRE_SEMANA: [string, string][] = [
  ["06:45", "09:00"],
  ["09:00", "12:00"],
  ["12:00", "15:00"],
  ["15:00", "18:00"],
  ["18:00", "21:00"],
];

const FRANJAS_SABADO: [string, string][] = [
  ["07:00", "10:00"],
  ["10:00", "13:00"],
];

const DIAS_ENTRE_SEMANA: DiaSemana[] = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"];

type TurnoInicial = { diaSemana: DiaSemana; horaInicio: string; horaFin: string };

const TURNOS_INICIALES: TurnoInicial[] = [
  ...DIAS_ENTRE_SEMANA.flatMap((diaSemana) =>
    FRANJAS_ENTRE_SEMANA.map(([horaInicio, horaFin]) => ({ diaSemana, horaInicio, horaFin }))
  ),
  ...FRANJAS_SABADO.map(([horaInicio, horaFin]) => ({
    diaSemana: "SABADO" as DiaSemana,
    horaInicio,
    horaFin,
  })),
];

type ArticuloInicial = { tipo: TipoArticuloBata; talla: TallaBata | null; cantidadTotal: number };

const TALLAS: TallaBata[] = ["S", "M", "L", "XL"];

const INVENTARIO_INICIAL: ArticuloInicial[] = [
  ...TALLAS.map((talla) => ({ tipo: "BATA_AZUL" as TipoArticuloBata, talla, cantidadTotal: 8 })),
  ...TALLAS.map((talla) => ({ tipo: "BATA_BLANCA" as TipoArticuloBata, talla, cantidadTotal: 8 })),
  { tipo: "LENTES", talla: null, cantidadTotal: 30 },
];

function describirDestino(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    return `host=${url.host}, base=${url.pathname.slice(1)}`;
  } catch {
    return "destino no interpretable";
  }
}

async function principal() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no está definida.");

  console.log(`Destino: ${describirDestino(connectionString)}.`);

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    let turnosCreados = 0;
    for (const turno of TURNOS_INICIALES) {
      const horaInicio = hora(turno.horaInicio);
      const horaFin = hora(turno.horaFin);
      const existente = await prisma.turnoVoluntariado.findFirst({
        where: { diaSemana: turno.diaSemana, horaInicio, horaFin },
        select: { idTurno: true },
      });
      if (!existente) {
        await prisma.turnoVoluntariado.create({
          data: { diaSemana: turno.diaSemana, horaInicio, horaFin },
        });
        turnosCreados += 1;
      }
    }

    let articulosCreados = 0;
    for (const articulo of INVENTARIO_INICIAL) {
      const existente = await prisma.articuloInventario.findFirst({
        where: { tipo: articulo.tipo, talla: articulo.talla },
        select: { idArticulo: true },
      });
      if (!existente) {
        await prisma.articuloInventario.create({ data: articulo });
        articulosCreados += 1;
      }
    }

    console.log(
      `Turnos: ${TURNOS_INICIALES.length} procesados; ${turnosCreados} creados; ${
        TURNOS_INICIALES.length - turnosCreados
      } ya existían.`
    );
    console.log(
      `Inventario: ${INVENTARIO_INICIAL.length} procesados; ${articulosCreados} creados; ${
        INVENTARIO_INICIAL.length - articulosCreados
      } ya existían.`
    );
    console.log("Seed del préstamo de batas completado.");
  } finally {
    await prisma.$disconnect();
  }
}

principal().catch((error) => {
  console.error(error);
  process.exit(1);
});
