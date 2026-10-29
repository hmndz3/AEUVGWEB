import type { EstadoOportunidad, Prisma } from "@prisma/client";

import { aHoraDeReloj } from "@/lib/horas-beca/horario-oportunidad";
import { obtenerPrisma } from "@/lib/prisma";

/**
 * Convocatorias por página del panel. Más bajo que el listado de registros: una
 * convocatoria ocupa una fila con fecha, estado y cupo, y AEUVG no publica
 * cientos en un ciclo.
 */
export const OPORTUNIDADES_POR_PAGINA = 20;

/** Una convocatoria tal como la presenta el panel. */
export type OportunidadPanel = {
  idOportunidad: number;
  nombre: string;
  descripcion: string;
  fecha: Date;
  /** Hora de inicio como "HH:MM". */
  horaInicio: string;
  horaFin: string;
  lugar: string;
  cantidadPersonas: number;
  estado: EstadoOportunidad;
  informacionAdicional: string | null;
  /** Registros de horas ya asociados: una convocatoria con horas no se elimina. */
  registros: number;
};

export type PaginaOportunidades = {
  oportunidades: OportunidadPanel[];
  total: number;
  pagina: number;
  paginas: number;
};

export type FiltrosOportunidades = {
  estado?: EstadoOportunidad;
  pagina?: number;
};

const CAMPOS_OPORTUNIDAD = {
  idOportunidad: true,
  nombre: true,
  descripcion: true,
  fecha: true,
  horaInicio: true,
  horaFin: true,
  lugar: true,
  cantidadPersonas: true,
  estado: true,
  informacionAdicional: true,
  _count: { select: { registrosHoraBeca: true } },
} as const;

type FilaOportunidad = Prisma.OportunidadHoraBecaGetPayload<{ select: typeof CAMPOS_OPORTUNIDAD }>;

function aOportunidad(fila: FilaOportunidad): OportunidadPanel {
  return {
    idOportunidad: fila.idOportunidad,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    fecha: fila.fecha,
    horaInicio: aHoraDeReloj(fila.horaInicio),
    horaFin: aHoraDeReloj(fila.horaFin),
    lugar: fila.lugar,
    cantidadPersonas: fila.cantidadPersonas,
    estado: fila.estado,
    informacionAdicional: fila.informacionAdicional,
    registros: fila._count.registrosHoraBeca,
  };
}

/**
 * Convocatorias del panel, de la más próxima a la más lejana.
 *
 * Incluye las que no están publicadas, al contrario que la consulta pública:
 * el panel es justamente donde se preparan los borradores y donde se revisa lo
 * que quedó cancelado. El identificador desempata para que dos convocatorias
 * del mismo día no cambien de orden entre páginas.
 */
export async function listarOportunidadesPanel(
  filtros: FiltrosOportunidades = {}
): Promise<PaginaOportunidades> {
  const numero = Math.max(1, Math.trunc(filtros.pagina ?? 1));
  const where: Prisma.OportunidadHoraBecaWhereInput = filtros.estado
    ? { estado: filtros.estado }
    : {};
  const prisma = obtenerPrisma();

  const [total, filas] = await Promise.all([
    prisma.oportunidadHoraBeca.count({ where }),
    prisma.oportunidadHoraBeca.findMany({
      where,
      orderBy: [{ fecha: "desc" }, { idOportunidad: "desc" }],
      skip: (numero - 1) * OPORTUNIDADES_POR_PAGINA,
      take: OPORTUNIDADES_POR_PAGINA,
      select: CAMPOS_OPORTUNIDAD,
    }),
  ]);

  return {
    oportunidades: filas.map(aOportunidad),
    total,
    pagina: numero,
    paginas: Math.max(1, Math.ceil(total / OPORTUNIDADES_POR_PAGINA)),
  };
}

/** Una convocatoria por su identificador, para la pantalla de edición. */
export async function obtenerOportunidadPanel(id: number): Promise<OportunidadPanel | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null;

  const fila = await obtenerPrisma().oportunidadHoraBeca.findUnique({
    where: { idOportunidad: id },
    select: CAMPOS_OPORTUNIDAD,
  });

  return fila ? aOportunidad(fila) : null;
}

/** Cuántas convocatorias hay en cada estado, para los contadores del panel. */
export async function contarOportunidadesPorEstado(): Promise<Record<EstadoOportunidad, number>> {
  const grupos = await obtenerPrisma().oportunidadHoraBeca.groupBy({
    by: ["estado"],
    _count: { _all: true },
  });

  const conteo = {
    BORRADOR: 0,
    PUBLICADA: 0,
    CERRADA: 0,
    CANCELADA: 0,
    FINALIZADA: 0,
  } satisfies Record<EstadoOportunidad, number>;

  for (const grupo of grupos) conteo[grupo.estado] = grupo._count._all;

  return conteo;
}
