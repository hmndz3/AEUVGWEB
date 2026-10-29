import {
  nombrarEstudiantes,
  plegarPorEstudiante,
  plegarPorMes,
  type ResumenEstudiante,
  type ResumenMes,
} from "@/lib/horas-beca/calculos-reportes";
import { condicionesDeFiltrosHoras } from "@/lib/horas-beca/filtros-horas";
import { obtenerPrisma } from "@/lib/prisma";
import type { FiltrosHorasBeca } from "@/validators/horas-beca";

/** Totales del programa completo, no de una página ni de un estudiante. */
export type ResumenPrograma = {
  registros: number;
  horasTotales: number;
  horasAcreditadas: number;
  horasPendientes: number;
  /** Carnets distintos con al menos un registro en el periodo. */
  estudiantes: number;
  registrosSinCuenta: number;
  /** Carnets distintos sin cuenta vinculada: a cuánta gente le falta registrarse. */
  carnetsSinCuenta: number;
  primeraActividad: Date | null;
  ultimaActividad: Date | null;
};

/**
 * Filtros que admite un reporte.
 *
 * Es el periodo y nada más. Los filtros del listado —búsqueda, estado, vínculo—
 * no entran a propósito: un resumen del programa con el estado ya filtrado
 * dejaría la columna de pendientes en cero y parecería un dato, no un filtro.
 */
export type FiltrosReporte = Pick<FiltrosHorasBeca, "desde" | "hasta">;

export type { ResumenEstudiante, ResumenMes };

/**
 * Estudiantes que presenta el detalle del reporte.
 *
 * El desglose se ordena de más horas a menos, así que el corte deja fuera la
 * cola de quienes apenas tienen un registro. Para el listado completo está la
 * exportación, que es la herramienta hecha para eso.
 */
export const MAXIMO_ESTUDIANTES_REPORTE = 100;

/**
 * Resumen general del programa de horas beca.
 *
 * Las sumas se calculan en la base y agrupadas por estado, que es lo que
 * devuelve las horas acreditadas y las pendientes en una sola consulta. Los
 * carnets se cuentan como distintos y no como filas: el dato que AEUVG informa
 * es a cuánta gente alcanzó el programa, no cuántas veces se capturó.
 */
export async function obtenerResumenPrograma(
  filtros: FiltrosReporte = {}
): Promise<ResumenPrograma> {
  const where = condicionesDeFiltrosHoras(filtros);
  const prisma = obtenerPrisma();

  const [porEstado, carnets, registrosSinCuenta, carnetsSinCuenta, periodo] = await Promise.all([
    prisma.registroHoraBeca.groupBy({
      by: ["estado"],
      where,
      _sum: { cantidadHoras: true },
      _count: { _all: true },
    }),
    prisma.registroHoraBeca.findMany({ where, distinct: ["carnet"], select: { carnet: true } }),
    prisma.registroHoraBeca.count({ where: { ...where, idEstudiante: null } }),
    prisma.registroHoraBeca.findMany({
      where: { ...where, idEstudiante: null },
      distinct: ["carnet"],
      select: { carnet: true },
    }),
    prisma.registroHoraBeca.aggregate({
      where,
      _min: { fechaActividad: true },
      _max: { fechaActividad: true },
    }),
  ]);

  const horasDe = (estado: "PENDIENTE" | "ACREDITADA") =>
    Number(porEstado.find((grupo) => grupo.estado === estado)?._sum.cantidadHoras ?? 0);

  const horasAcreditadas = horasDe("ACREDITADA");
  const horasPendientes = horasDe("PENDIENTE");

  return {
    registros: porEstado.reduce((total, grupo) => total + grupo._count._all, 0),
    horasTotales: horasAcreditadas + horasPendientes,
    horasAcreditadas,
    horasPendientes,
    estudiantes: carnets.length,
    registrosSinCuenta,
    carnetsSinCuenta: carnetsSinCuenta.length,
    primeraActividad: periodo._min.fechaActividad,
    ultimaActividad: periodo._max.fechaActividad,
  };
}

/**
 * Horas por mes, del mes más reciente al más antiguo.
 *
 * La base agrupa por día y por estado, y el pliegue a meses se hace aquí. Es
 * deliberado: `date_trunc` obligaría a escribir la consulta a mano y a repetir
 * la traducción de los filtros, mientras que los días distintos de un periodo
 * son unos cuantos cientos como máximo, muy lejos del volumen de registros que
 * se evita traer.
 */
export async function obtenerHorasPorMes(filtros: FiltrosReporte = {}): Promise<ResumenMes[]> {
  const porDia = await obtenerPrisma().registroHoraBeca.groupBy({
    by: ["fechaActividad", "estado"],
    where: condicionesDeFiltrosHoras(filtros),
    _sum: { cantidadHoras: true },
    _count: { _all: true },
  });

  return plegarPorMes(
    porDia.map((grupo) => ({
      fechaActividad: grupo.fechaActividad,
      estado: grupo.estado,
      horas: Number(grupo._sum.cantidadHoras ?? 0),
      registros: grupo._count._all,
    }))
  );
}

/**
 * Horas por estudiante, de más horas a menos.
 *
 * El nombre no se puede agrupar junto al carnet: un mismo carnet puede traer el
 * nombre escrito de dos maneras en hojas de distintos años, y agruparlo lo
 * partiría en dos filas con la mitad de las horas cada una. Se agrupa por
 * carnet, que es el identificador, y los nombres se resuelven después: el de la
 * cuenta cuando existe —que es el verificado— y el del registro más reciente
 * cuando el carnet todavía no tiene cuenta.
 */
export async function obtenerHorasPorEstudiante(
  filtros: FiltrosReporte = {},
  maximo = MAXIMO_ESTUDIANTES_REPORTE
): Promise<ResumenEstudiante[]> {
  const where = condicionesDeFiltrosHoras(filtros);
  const prisma = obtenerPrisma();

  const porCarnet = await prisma.registroHoraBeca.groupBy({
    by: ["carnet", "estado"],
    where,
    _sum: { cantidadHoras: true },
    _count: { _all: true },
  });

  const detalle = plegarPorEstudiante(
    porCarnet.map((grupo) => ({
      carnet: grupo.carnet,
      estado: grupo.estado,
      horas: Number(grupo._sum.cantidadHoras ?? 0),
      registros: grupo._count._all,
    })),
    maximo
  );

  if (detalle.length === 0) return detalle;

  const carnets = detalle.map(({ carnet }) => carnet);

  const [cuentas, cargados] = await Promise.all([
    prisma.estudiante.findMany({
      where: { carnet: { in: carnets, mode: "insensitive" } },
      select: { carnet: true, nombreCompleto: true },
    }),
    prisma.registroHoraBeca.findMany({
      where: { ...where, carnet: { in: carnets } },
      distinct: ["carnet"],
      orderBy: [{ fechaActividad: "desc" }, { idRegistroHora: "desc" }],
      select: { carnet: true, nombreEstudiante: true },
    }),
  ]);

  return nombrarEstudiantes(detalle, cuentas, cargados);
}
