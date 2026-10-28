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
