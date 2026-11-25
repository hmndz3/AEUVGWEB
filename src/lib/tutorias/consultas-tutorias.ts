import type { EstadoPostulacion, EstadoTutor, Prisma } from "@prisma/client";

import { aHoraDeReloj, formatearFechaTutoria } from "@/lib/tutorias/formato-tutorias";
import { obtenerPrisma } from "@/lib/prisma";

/** Postulaciones por página del panel. */
export const POSTULACIONES_POR_PAGINA = 20;

export type CursoDisponible = { idCurso: number; codigo: string; nombre: string };

/** Cursos activos del catálogo, para la postulación y para los filtros. */
export async function listarCursos(): Promise<CursoDisponible[]> {
  return obtenerPrisma().curso.findMany({
    where: { activo: true },
    orderBy: [{ codigo: "asc" }],
    select: { idCurso: true, codigo: true, nombre: true },
  });
}

/** Un curso de la postulación, con lo que la respalda. */
export type CursoPostulado = {
  idCurso: number;
  codigo: string;
  nombre: string;
  notaObtenida: number | null;
  comprobanteUrl: string;
};

export type PostulacionAdmin = {
  idPostulacion: number;
  idEstudiante: number;
  carnet: string;
  nombreCompleto: string;
  correoUvg: string;
  fotoUrl: string | null;
  carrera: string;
  facultad: string;
  estado: EstadoPostulacion;
  comentarioSolicitante: string | null;
  comentarioRevision: string | null;
  fechaPostulacion: Date;
  fechaRevision: Date | null;
  revisadaPor: string | null;
  cursos: CursoPostulado[];
};

const CAMPOS_POSTULACION = {
  idPostulacion: true,
  idEstudiante: true,
  estado: true,
  comentarioSolicitante: true,
  comentarioRevision: true,
  fechaPostulacion: true,
  fechaRevision: true,
  estudiante: {
    select: {
      carnet: true,
      nombreCompleto: true,
      correoUvg: true,
      fotoUrl: true,
      carrera: { select: { nombre: true, facultad: { select: { nombre: true } } } },
    },
  },
  revisor: { select: { estudiante: { select: { nombreCompleto: true } } } },
  cursos: {
    select: {
      notaObtenida: true,
      comprobanteUrl: true,
      curso: { select: { idCurso: true, codigo: true, nombre: true } },
    },
  },
} as const;

type FilaPostulacion = Prisma.PostulacionTutorGetPayload<{ select: typeof CAMPOS_POSTULACION }>;

function aPostulacion(fila: FilaPostulacion): PostulacionAdmin {
  return {
    idPostulacion: fila.idPostulacion,
    idEstudiante: fila.idEstudiante,
    carnet: fila.estudiante.carnet,
    nombreCompleto: fila.estudiante.nombreCompleto,
    correoUvg: fila.estudiante.correoUvg,
    fotoUrl: fila.estudiante.fotoUrl,
    carrera: fila.estudiante.carrera.nombre,
    facultad: fila.estudiante.carrera.facultad.nombre,
    estado: fila.estado,
    comentarioSolicitante: fila.comentarioSolicitante,
    comentarioRevision: fila.comentarioRevision,
    fechaPostulacion: fila.fechaPostulacion,
    fechaRevision: fila.fechaRevision,
    revisadaPor: fila.revisor?.estudiante.nombreCompleto ?? null,
    cursos: fila.cursos.map((curso) => ({
      idCurso: curso.curso.idCurso,
      codigo: curso.curso.codigo,
      nombre: curso.curso.nombre,
      notaObtenida: curso.notaObtenida === null ? null : Number(curso.notaObtenida),
      comprobanteUrl: curso.comprobanteUrl,
    })),
  };
}

export type PaginaPostulaciones = {
  postulaciones: PostulacionAdmin[];
  total: number;
  pagina: number;
  paginas: number;
};

/**
 * Postulaciones del panel, de la más reciente a la más antigua.
 *
 * Las pendientes son las que AEUVG viene a resolver, así que el filtro por
 * estado es la primera operación de la pantalla; sin filtro se listan todas,
 * porque revisar una postulación vieja es parte del historial.
 */
export async function listarPostulaciones(filtros: {
  estado?: EstadoPostulacion;
  pagina?: number;
}): Promise<PaginaPostulaciones> {
  const numero = Math.max(1, Math.trunc(filtros.pagina ?? 1));
  const where: Prisma.PostulacionTutorWhereInput = filtros.estado ? { estado: filtros.estado } : {};
  const prisma = obtenerPrisma();

  const [total, filas] = await Promise.all([
    prisma.postulacionTutor.count({ where }),
    prisma.postulacionTutor.findMany({
      where,
      orderBy: [{ fechaPostulacion: "desc" }, { idPostulacion: "desc" }],
      skip: (numero - 1) * POSTULACIONES_POR_PAGINA,
      take: POSTULACIONES_POR_PAGINA,
      select: CAMPOS_POSTULACION,
    }),
  ]);

  return {
    postulaciones: filas.map(aPostulacion),
    total,
    pagina: numero,
    paginas: Math.max(1, Math.ceil(total / POSTULACIONES_POR_PAGINA)),
  };
}

/** Cuántas postulaciones hay en cada estado, para los contadores del panel. */
export async function contarPostulacionesPorEstado(): Promise<Record<EstadoPostulacion, number>> {
  const grupos = await obtenerPrisma().postulacionTutor.groupBy({
    by: ["estado"],
    _count: { _all: true },
  });

  const conteo = { PENDIENTE: 0, APROBADA: 0, RECHAZADA: 0 } satisfies Record<
    EstadoPostulacion,
    number
  >;

  for (const grupo of grupos) conteo[grupo.estado] = grupo._count._all;

  return conteo;
}

/** La postulación del estudiante de la sesión, si ya envió alguna. */
export async function obtenerPostulacionDeEstudiante(
  idUsuario: number
): Promise<PostulacionAdmin | null> {
  const fila = await obtenerPrisma().postulacionTutor.findFirst({
    where: { estudiante: { usuario: { idUsuario } } },
    orderBy: { fechaPostulacion: "desc" },
    select: CAMPOS_POSTULACION,
  });

  return fila ? aPostulacion(fila) : null;
}

export type DisponibilidadTutorVista = {
  idDisponibilidad: number;
  diaSemana: import("@prisma/client").DiaSemana;
  horaInicio: string;
  horaFin: string;
  modalidad: import("@prisma/client").ModalidadTutoria;
  ubicacionEnlace: string | null;
};

export type TutorVista = {
  idTutor: number;
  idEstudiante: number;
  carnet: string;
  nombreCompleto: string;
  correoUvg: string;
  carrera: string;
  facultad: string;
  fotoUrl: string | null;
  descripcion: string | null;
  informacionContacto: string | null;
  estado: EstadoTutor;
  fechaAprobacion: Date;
  cursos: CursoDisponible[];
  disponibilidades: DisponibilidadTutorVista[];
  /** Tutorías ya realizadas, que es lo que respalda al tutor ante quien lo elige. */
  tutoriasCompletadas: number;
};

const CAMPOS_TUTOR = {
  idTutor: true,
  idEstudiante: true,
  descripcion: true,
  informacionContacto: true,
  estado: true,
  fechaAprobacion: true,
  estudiante: {
    select: {
      carnet: true,
      nombreCompleto: true,
      correoUvg: true,
      fotoUrl: true,
      carrera: { select: { nombre: true, facultad: { select: { nombre: true } } } },
    },
  },
  cursos: {
    where: { activo: true },
    select: { curso: { select: { idCurso: true, codigo: true, nombre: true } } },
  },
  disponibilidades: {
    where: { activo: true },
    orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
    select: {
      idDisponibilidad: true,
      diaSemana: true,
      horaInicio: true,
      horaFin: true,
      modalidad: true,
      ubicacionEnlace: true,
    },
  },
  _count: { select: { tutorias: { where: { estado: "COMPLETADA" } } } },
} satisfies Prisma.TutorSelect;

type FilaTutor = Prisma.TutorGetPayload<{ select: typeof CAMPOS_TUTOR }>;

function aTutor(fila: FilaTutor): TutorVista {
  return {
    idTutor: fila.idTutor,
    idEstudiante: fila.idEstudiante,
    carnet: fila.estudiante.carnet,
    nombreCompleto: fila.estudiante.nombreCompleto,
    correoUvg: fila.estudiante.correoUvg,
    carrera: fila.estudiante.carrera.nombre,
    facultad: fila.estudiante.carrera.facultad.nombre,
    fotoUrl: fila.estudiante.fotoUrl,
    descripcion: fila.descripcion,
    informacionContacto: fila.informacionContacto,
    estado: fila.estado,
    fechaAprobacion: fila.fechaAprobacion,
    cursos: fila.cursos.map(({ curso }) => curso),
    disponibilidades: fila.disponibilidades.map((franja) => ({
      idDisponibilidad: franja.idDisponibilidad,
      diaSemana: franja.diaSemana,
      horaInicio: aHoraDeReloj(franja.horaInicio),
      horaFin: aHoraDeReloj(franja.horaFin),
      modalidad: franja.modalidad,
      ubicacionEnlace: franja.ubicacionEnlace,
    })),
    tutoriasCompletadas: fila._count.tutorias,
  };
}

/**
 * Tutores que ve el estudiantado.
 *
 * Solo los activos y solo los que imparten algún curso: un tutor sin cursos no
 * se puede elegir para nada, y listarlo solo haría más larga la búsqueda. El
 * filtro por curso es la pregunta con la que se entra al directorio.
 */
export async function listarTutoresPublicos(
  filtros: {
    idCurso?: number;
    q?: string;
  } = {}
): Promise<TutorVista[]> {
  const where: Prisma.TutorWhereInput = {
    estado: "ACTIVO",
    cursos: filtros.idCurso
      ? { some: { activo: true, idCurso: filtros.idCurso } }
      : { some: { activo: true } },
  };

  if (filtros.q) {
    where.estudiante = {
      OR: [
        { nombreCompleto: { contains: filtros.q, mode: "insensitive" } },
        { carnet: { contains: filtros.q, mode: "insensitive" } },
      ],
    };
  }

  const filas = await obtenerPrisma().tutor.findMany({
    where,
    orderBy: { estudiante: { nombreCompleto: "asc" } },
    select: CAMPOS_TUTOR,
  });

  return filas.map(aTutor);
}

/** Un tutor por su identificador. Para el panel incluye los no activos. */
export async function obtenerTutor(idTutor: number, soloActivo = true): Promise<TutorVista | null> {
  if (!Number.isSafeInteger(idTutor) || idTutor <= 0) return null;

  const fila = await obtenerPrisma().tutor.findFirst({
    where: { idTutor, ...(soloActivo ? { estado: "ACTIVO" } : {}) },
    select: CAMPOS_TUTOR,
  });

  return fila ? aTutor(fila) : null;
}

/** El tutor que corresponde a la cuenta de la sesión, si lo es. */
export async function obtenerTutorDeUsuario(idUsuario: number): Promise<TutorVista | null> {
  const fila = await obtenerPrisma().tutor.findFirst({
    where: { estudiante: { usuario: { idUsuario } } },
    select: CAMPOS_TUTOR,
  });

  return fila ? aTutor(fila) : null;
}

/** Todos los tutores del panel, incluidos los inactivos y los suspendidos. */
export async function listarTutoresPanel(): Promise<TutorVista[]> {
  const filas = await obtenerPrisma().tutor.findMany({
    orderBy: [{ estado: "asc" }, { estudiante: { nombreCompleto: "asc" } }],
    select: CAMPOS_TUTOR,
  });

  return filas.map(aTutor);
}

export type TutoriaVista = {
  idTutoria: number;
  idTutor: number;
  fechaInicio: Date;
  fechaFin: Date;
  modalidad: import("@prisma/client").ModalidadTutoria;
  ubicacionEnlace: string | null;
  estado: import("@prisma/client").EstadoTutoria;
  observaciones: string | null;
  curso: { codigo: string; nombre: string };
  /** Nombre de la otra parte: el tutor para el estudiante y al revés. */
  tutor: string;
  estudiante: string;
};

const CAMPOS_TUTORIA = {
  idTutoria: true,
  idTutor: true,
  fechaInicio: true,
  fechaFin: true,
  modalidad: true,
  ubicacionEnlace: true,
  estado: true,
  observaciones: true,
  curso: { select: { codigo: true, nombre: true } },
  tutor: { select: { estudiante: { select: { nombreCompleto: true } } } },
  estudiante: { select: { nombreCompleto: true } },
} as const;

type FilaTutoria = Prisma.TutoriaGetPayload<{ select: typeof CAMPOS_TUTORIA }>;

function aTutoria(fila: FilaTutoria): TutoriaVista {
  return {
    idTutoria: fila.idTutoria,
    idTutor: fila.idTutor,
    fechaInicio: fila.fechaInicio,
    fechaFin: fila.fechaFin,
    modalidad: fila.modalidad,
    ubicacionEnlace: fila.ubicacionEnlace,
    estado: fila.estado,
    observaciones: fila.observaciones,
    curso: fila.curso,
    tutor: fila.tutor.estudiante.nombreCompleto,
    estudiante: fila.estudiante.nombreCompleto,
  };
}

/**
 * Tutorías del estudiante de la sesión, de la más próxima a la más antigua.
 *
 * Las programadas van primero aunque sean futuras: lo que trae a esta sección
 * es saber a qué hay que presentarse, no repasar el historial.
 */
export async function listarTutoriasDeEstudiante(idUsuario: number): Promise<TutoriaVista[]> {
  const filas = await obtenerPrisma().tutoria.findMany({
    where: { estudiante: { usuario: { idUsuario } } },
    orderBy: [{ estado: "asc" }, { fechaInicio: "desc" }],
    take: 50,
    select: CAMPOS_TUTORIA,
  });

  return filas.map(aTutoria);
}

/** Tutorías que el tutor de la sesión tiene que impartir o ya impartió. */
export async function listarTutoriasDeTutor(idUsuario: number): Promise<TutoriaVista[]> {
  const filas = await obtenerPrisma().tutoria.findMany({
    where: { tutor: { estudiante: { usuario: { idUsuario } } } },
    orderBy: [{ estado: "asc" }, { fechaInicio: "desc" }],
    take: 50,
    select: CAMPOS_TUTORIA,
  });

  return filas.map(aTutoria);
}

/** Lo mínimo para redactar el aviso de una postulación resuelta. */
export async function obtenerPostulacionParaAviso(
  idPostulacion: number
): Promise<{ idUsuario: number | null } | null> {
  const fila = await obtenerPrisma().postulacionTutor.findUnique({
    where: { idPostulacion },
    select: { estudiante: { select: { usuario: { select: { idUsuario: true } } } } },
  });

  return fila ? { idUsuario: fila.estudiante.usuario?.idUsuario ?? null } : null;
}

/** Lo mínimo para redactar el aviso de una tutoría, con sus dos cuentas. */
export async function obtenerTutoriaParaAviso(idTutoria: number): Promise<{
  idUsuarioTutor: number | null;
  idUsuarioEstudiante: number | null;
  estudiante: string;
  curso: string;
  cuando: string;
} | null> {
  const fila = await obtenerPrisma().tutoria.findUnique({
    where: { idTutoria },
    select: {
      fechaInicio: true,
      curso: { select: { nombre: true } },
      estudiante: {
        select: { nombreCompleto: true, usuario: { select: { idUsuario: true } } },
      },
      tutor: { select: { estudiante: { select: { usuario: { select: { idUsuario: true } } } } } },
    },
  });

  if (!fila) return null;

  return {
    idUsuarioTutor: fila.tutor.estudiante.usuario?.idUsuario ?? null,
    idUsuarioEstudiante: fila.estudiante.usuario?.idUsuario ?? null,
    estudiante: fila.estudiante.nombreCompleto,
    curso: fila.curso.nombre,
    cuando: formatearFechaTutoria(fila.fechaInicio),
  };
}
