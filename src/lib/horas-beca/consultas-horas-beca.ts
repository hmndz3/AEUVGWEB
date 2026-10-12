import type { EstadoHoraBeca, Prisma } from "@prisma/client";

import { condicionesDeFiltrosHoras } from "@/lib/horas-beca/filtros-horas";
import { obtenerPrisma } from "@/lib/prisma";
import type { FiltrosHorasBeca } from "@/validators/horas-beca";

/**
 * Registros por página del panel. Es una cifra alta a propósito: la sección
 * sustituye una hoja de cálculo y quien la usa espera ver muchas filas a la vez,
 * no doce tarjetas como en los listados públicos.
 */
export const REGISTROS_HORA_POR_PAGINA = 25;

/** Fila del panel de horas beca. */
export type RegistroHoraBecaAdmin = {
  idRegistroHora: number;
  carnet: string;
  /** Nombre con el que AEUVG cargó el registro. */
  nombreEstudiante: string;
  /** Nombre de la cuenta vinculada, cuando el carnet ya tiene una. */
  nombreCuenta: string | null;
  fechaActividad: Date;
  horarioApoyo: string;
  descripcionActividad: string;
  cantidadHoras: number;
  estado: EstadoHoraBeca;
  fechaAcreditacion: Date | null;
  observaciones: string | null;
};

export type PaginaRegistrosHoraBeca = {
  registros: RegistroHoraBecaAdmin[];
  total: number;
  pagina: number;
  paginas: number;
};

export type OpcionesListadoHoras = {
  filtros?: FiltrosHorasBeca;
  porPagina?: number;
};

const CAMPOS_REGISTRO = {
  idRegistroHora: true,
  carnet: true,
  nombreEstudiante: true,
  fechaActividad: true,
  horarioApoyo: true,
  descripcionActividad: true,
  cantidadHoras: true,
  estado: true,
  fechaAcreditacion: true,
  observaciones: true,
  estudiante: { select: { nombreCompleto: true } },
} as const;

type FilaRegistro = Prisma.RegistroHoraBecaGetPayload<{ select: typeof CAMPOS_REGISTRO }>;

/**
 * Las horas se guardan como `Decimal(6,2)` para que sumar cientos de registros
 * no arrastre error, pero las pantallas trabajan con números. La conversión se
 * hace aquí, en el borde, y no en cada componente.
 */
function aRegistro(fila: FilaRegistro): RegistroHoraBecaAdmin {
  return {
    idRegistroHora: fila.idRegistroHora,
    carnet: fila.carnet,
    nombreEstudiante: fila.nombreEstudiante,
    nombreCuenta: fila.estudiante?.nombreCompleto ?? null,
    fechaActividad: fila.fechaActividad,
    horarioApoyo: fila.horarioApoyo,
    descripcionActividad: fila.descripcionActividad,
    cantidadHoras: Number(fila.cantidadHoras),
    estado: fila.estado,
    fechaAcreditacion: fila.fechaAcreditacion,
    observaciones: fila.observaciones,
  };
}

function paginar(pagina: number | undefined, porPagina: number | undefined) {
  const tamano = porPagina ?? REGISTROS_HORA_POR_PAGINA;
  const numero = Math.max(1, Math.trunc(pagina ?? 1));

  return { tamano, numero, saltar: (numero - 1) * tamano };
}

/**
 * Registros de horas beca del panel, del más reciente al más antiguo.
 *
 * Se ordena por fecha de actividad y no por fecha de creación porque AEUVG
 * trabaja por periodos: lo que busca al abrir la sección es lo último que se
 * realizó, aunque se haya cargado después. El identificador desempata para que
 * dos registros del mismo día no cambien de orden entre páginas.
 */
export async function listarRegistrosHoraBeca(
  opciones: OpcionesListadoHoras = {}
): Promise<PaginaRegistrosHoraBeca> {
  const filtros = opciones.filtros ?? {};
  const { tamano, numero, saltar } = paginar(filtros.pagina, opciones.porPagina);
  const where = condicionesDeFiltrosHoras(filtros);
  const prisma = obtenerPrisma();

  const [total, filas] = await Promise.all([
    prisma.registroHoraBeca.count({ where }),
    prisma.registroHoraBeca.findMany({
      where,
      orderBy: [{ fechaActividad: "desc" }, { idRegistroHora: "desc" }],
      skip: saltar,
      take: tamano,
      select: CAMPOS_REGISTRO,
    }),
  ]);

  return {
    registros: filas.map(aRegistro),
    total,
    pagina: numero,
    paginas: Math.max(1, Math.ceil(total / tamano)),
  };
}

/** Un registro por su identificador, para la pantalla de edición del panel. */
export async function obtenerRegistroHoraBeca(id: number): Promise<RegistroHoraBecaAdmin | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null;

  const fila = await obtenerPrisma().registroHoraBeca.findUnique({
    where: { idRegistroHora: id },
    select: CAMPOS_REGISTRO,
  });

  return fila ? aRegistro(fila) : null;
}
