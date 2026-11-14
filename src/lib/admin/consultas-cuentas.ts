import type { EstadoUsuario, Prisma } from "@prisma/client";

import { normalizarRol, type Rol } from "@/lib/auth/roles";
import { obtenerPrisma } from "@/lib/prisma";

/** Cuentas por página del panel. */
export const CUENTAS_POR_PAGINA = 25;

export type CuentaAdmin = {
  idUsuario: number;
  idEstudiante: number;
  carnet: string;
  nombreCompleto: string;
  correo: string;
  correoUvg: string;
  telefono: string | null;
  carrera: string;
  facultad: string;
  estado: EstadoUsuario;
  correoVerificado: boolean;
  ultimoAcceso: Date | null;
  fechaCreacion: Date;
  roles: Rol[];
};

export type FiltrosCuentas = {
  q?: string;
  estado?: EstadoUsuario;
  facultad?: number;
  /** "verificados" o "sin-verificar"; cualquier otra cosa se descarta. */
  verificacion?: "verificados" | "sin-verificar";
  pagina?: number;
};

const CAMPOS_CUENTA = {
  idUsuario: true,
  idEstudiante: true,
  correo: true,
  estado: true,
  correoVerificado: true,
  ultimoAcceso: true,
  fechaCreacion: true,
  estudiante: {
    select: {
      carnet: true,
      nombreCompleto: true,
      correoUvg: true,
      telefono: true,
      carrera: { select: { nombre: true, facultad: { select: { nombre: true } } } },
    },
  },
  roles: { select: { rol: { select: { nombre: true } } } },
} as const;

type FilaCuenta = Prisma.UsuarioGetPayload<{ select: typeof CAMPOS_CUENTA }>;

function aCuenta(fila: FilaCuenta): CuentaAdmin {
  return {
    idUsuario: fila.idUsuario,
    idEstudiante: fila.idEstudiante,
    carnet: fila.estudiante.carnet,
    nombreCompleto: fila.estudiante.nombreCompleto,
    correo: fila.correo,
    correoUvg: fila.estudiante.correoUvg,
    telefono: fila.estudiante.telefono,
    carrera: fila.estudiante.carrera.nombre,
    facultad: fila.estudiante.carrera.facultad.nombre,
    estado: fila.estado,
    correoVerificado: fila.correoVerificado,
    ultimoAcceso: fila.ultimoAcceso,
    fechaCreacion: fila.fechaCreacion,
    roles: fila.roles
      .map(({ rol }) => normalizarRol(rol.nombre))
      .filter((rol): rol is Rol => rol !== null),
  };
}

/**
 * Traduce los filtros del panel a la condición de la consulta.
 *
 * Vive aparte para poder comprobarla sin base de datos, con el mismo criterio
 * que los filtros de horas beca: es la regla que decide qué cuentas se ven.
 */
export function condicionesDeCuentas(filtros: FiltrosCuentas): Prisma.UsuarioWhereInput {
  const condiciones: Prisma.UsuarioWhereInput = {};

  if (filtros.estado) condiciones.estado = filtros.estado;
  if (filtros.verificacion) {
    condiciones.correoVerificado = filtros.verificacion === "verificados";
  }

  const estudiante: Prisma.EstudianteWhereInput = {};

  if (filtros.facultad) estudiante.carrera = { idFacultad: filtros.facultad };
  if (filtros.q) {
    // Se busca por los tres datos con los que AEUVG localiza una cuenta: el
    // carnet, el nombre y el correo. La tabla de estudiantes no tiene copia
    // normalizada, así que se compara ignorando mayúsculas.
    estudiante.OR = [
      { carnet: { contains: filtros.q, mode: "insensitive" } },
      { nombreCompleto: { contains: filtros.q, mode: "insensitive" } },
      { correoUvg: { contains: filtros.q, mode: "insensitive" } },
    ];
  }

  if (Object.keys(estudiante).length > 0) condiciones.estudiante = estudiante;

  return condiciones;
}

export type PaginaCuentas = {
  cuentas: CuentaAdmin[];
  total: number;
  pagina: number;
  paginas: number;
};

/** Cuentas del panel, de la más reciente a la más antigua. */
export async function listarCuentas(filtros: FiltrosCuentas = {}): Promise<PaginaCuentas> {
  const numero = Math.max(1, Math.trunc(filtros.pagina ?? 1));
  const where = condicionesDeCuentas(filtros);
  const prisma = obtenerPrisma();

  const [total, filas] = await Promise.all([
    prisma.usuario.count({ where }),
    prisma.usuario.findMany({
      where,
      orderBy: [{ fechaCreacion: "desc" }, { idUsuario: "desc" }],
      skip: (numero - 1) * CUENTAS_POR_PAGINA,
      take: CUENTAS_POR_PAGINA,
      select: CAMPOS_CUENTA,
    }),
  ]);

  return {
    cuentas: filas.map(aCuenta),
    total,
    pagina: numero,
    paginas: Math.max(1, Math.ceil(total / CUENTAS_POR_PAGINA)),
  };
}

export type ResumenCuentas = {
  total: number;
  activas: number;
  pendientes: number;
  bloqueadas: number;
  sinVerificar: number;
};

/** Totales de las cuentas, sobre todas y no sobre la página en pantalla. */
export async function obtenerResumenCuentas(): Promise<ResumenCuentas> {
  const prisma = obtenerPrisma();

  const [porEstado, sinVerificar] = await Promise.all([
    prisma.usuario.groupBy({ by: ["estado"], _count: { _all: true } }),
    prisma.usuario.count({ where: { correoVerificado: false } }),
  ]);

  const de = (estado: EstadoUsuario) =>
    porEstado.find((grupo) => grupo.estado === estado)?._count._all ?? 0;

  return {
    total: porEstado.reduce((suma, grupo) => suma + grupo._count._all, 0),
    activas: de("ACTIVO"),
    pendientes: de("PENDIENTE"),
    bloqueadas: de("BLOQUEADO"),
    sinVerificar,
  };
}
