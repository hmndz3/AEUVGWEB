import type {
  DiaSemana,
  EstadoComprobanteTurno,
  EstadoPrestamoBata,
  TallaBata,
} from "@prisma/client";

import {
  describirArticulo,
  duracionHorasTurno,
  ESTADOS_PRESTAMO,
  ETIQUETAS_ESTADO_COMPROBANTE,
  ETIQUETAS_ESTADO_PRESTAMO,
  ETIQUETAS_TIPO_ARTICULO,
  formatearFecha,
  formatearRangoTurno,
  TALLAS,
} from "@/lib/prestamo-batas/formato-prestamo-batas";
import { obtenerPrisma } from "@/lib/prisma";
import { aHoraDeReloj, DIAS_SEMANA, ETIQUETAS_DIA } from "@/lib/tutorias/formato-tutorias";

// ---------------------------------------------------------------------------
// Público
// ---------------------------------------------------------------------------

export type DisponibilidadTalla = { talla: TallaBata; disponible: number; total: number };

export type InventarioPublico = {
  batasAzules: DisponibilidadTalla[];
  batasBlancas: DisponibilidadTalla[];
  lentes: { disponible: number; total: number } | null;
};

export type TurnoPublico = {
  idTurno: number;
  dia: DiaSemana;
  etiquetaDia: string;
  horaInicio: string;
  horaFin: string;
  rango: string;
  voluntarios: string[];
  cupo: number;
  cubierto: boolean;
};

export type PanoramaPublico = { inventario: InventarioPublico; turnos: TurnoPublico[] };

/** Unidades prestadas y sin devolver de cada artículo. */
async function prestadasPorArticulo(): Promise<Map<number, number>> {
  const agregados = await obtenerPrisma().articuloPrestado.groupBy({
    by: ["idArticulo"],
    where: { prestamo: { estado: "PRESTADO" } },
    _sum: { cantidad: true },
  });

  return new Map(agregados.map((fila) => [fila.idArticulo, fila._sum.cantidad ?? 0]));
}

/**
 * Disponibilidad e inventario que ve el estudiantado, más los turnos de atención
 * con quién los cubre. Es todo lo que la página pública necesita: qué hay para
 * prestar, por tipo y talla, y a qué horas está abierto el salón.
 */
export async function obtenerPanoramaPublico(): Promise<PanoramaPublico> {
  const prisma = obtenerPrisma();

  const [articulos, turnos, prestadas] = await Promise.all([
    prisma.articuloInventario.findMany({
      where: { activo: true },
      select: { idArticulo: true, tipo: true, talla: true, cantidadTotal: true },
    }),
    prisma.turnoVoluntariado.findMany({
      where: { activo: true },
      orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
      select: {
        idTurno: true,
        diaSemana: true,
        horaInicio: true,
        horaFin: true,
        cupo: true,
        asignaciones: {
          where: { activo: true },
          orderBy: { fechaAsignacion: "asc" },
          select: { estudiante: { select: { nombreCompleto: true } } },
        },
      },
    }),
    prestadasPorArticulo(),
  ]);

  const porTalla = (tipo: "BATA_AZUL" | "BATA_BLANCA"): DisponibilidadTalla[] =>
    TALLAS.map((talla) => {
      const articulo = articulos.find((a) => a.tipo === tipo && a.talla === talla);
      const total = articulo?.cantidadTotal ?? 0;
      const prestada = articulo ? (prestadas.get(articulo.idArticulo) ?? 0) : 0;
      return { talla, disponible: Math.max(total - prestada, 0), total };
    }).filter((fila) => fila.total > 0);

  const articuloLentes = articulos.find((a) => a.tipo === "LENTES");
  const lentes = articuloLentes
    ? {
        disponible: Math.max(
          articuloLentes.cantidadTotal - (prestadas.get(articuloLentes.idArticulo) ?? 0),
          0
        ),
        total: articuloLentes.cantidadTotal,
      }
    : null;

  return {
    inventario: {
      batasAzules: porTalla("BATA_AZUL"),
      batasBlancas: porTalla("BATA_BLANCA"),
      lentes,
    },
    turnos: turnos.map((turno) => ({
      idTurno: turno.idTurno,
      dia: turno.diaSemana,
      etiquetaDia: ETIQUETAS_DIA[turno.diaSemana],
      horaInicio: aHoraDeReloj(turno.horaInicio),
      horaFin: aHoraDeReloj(turno.horaFin),
      rango: formatearRangoTurno(turno.horaInicio, turno.horaFin),
      voluntarios: turno.asignaciones.map((a) => a.estudiante.nombreCompleto),
      cupo: turno.cupo,
      cubierto: turno.asignaciones.length >= turno.cupo,
    })),
  };
}

// ---------------------------------------------------------------------------
// Selectores (formularios)
// ---------------------------------------------------------------------------

export type TurnoSelector = {
  idTurno: number;
  dia: DiaSemana;
  etiquetaDia: string;
  horaInicio: string;
  horaFin: string;
  rango: string;
  libre: boolean;
};

/** Turnos activos para la postulación, marcando los que ya tienen sus dos voluntarios. */
export async function listarTurnosParaPostular(): Promise<TurnoSelector[]> {
  const turnos = await obtenerPrisma().turnoVoluntariado.findMany({
    where: { activo: true },
    orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
    select: {
      idTurno: true,
      diaSemana: true,
      horaInicio: true,
      horaFin: true,
      cupo: true,
      _count: { select: { asignaciones: { where: { activo: true } } } },
    },
  });

  return turnos.map((turno) => ({
    idTurno: turno.idTurno,
    dia: turno.diaSemana,
    etiquetaDia: ETIQUETAS_DIA[turno.diaSemana],
    horaInicio: aHoraDeReloj(turno.horaInicio),
    horaFin: aHoraDeReloj(turno.horaFin),
    rango: formatearRangoTurno(turno.horaInicio, turno.horaFin),
    libre: turno._count.asignaciones < turno.cupo,
  }));
}

/** Artículos con existencias disponibles, para el formulario de préstamo del voluntario. */
export type ArticuloSelector = {
  idArticulo: number;
  descripcion: string;
  disponible: number;
};

export async function listarArticulosDisponibles(): Promise<ArticuloSelector[]> {
  const prisma = obtenerPrisma();
  const [articulos, prestadas] = await Promise.all([
    prisma.articuloInventario.findMany({
      where: { activo: true },
      orderBy: [{ tipo: "asc" }, { talla: "asc" }],
      select: { idArticulo: true, tipo: true, talla: true, cantidadTotal: true },
    }),
    prestadasPorArticulo(),
  ]);

  return articulos.map((articulo) => ({
    idArticulo: articulo.idArticulo,
    descripcion: describirArticulo(articulo.tipo, articulo.talla),
    disponible: Math.max(articulo.cantidadTotal - (prestadas.get(articulo.idArticulo) ?? 0), 0),
  }));
}

// ---------------------------------------------------------------------------
// Panel administrativo
// ---------------------------------------------------------------------------

export type ArticuloPanel = {
  idArticulo: number;
  tipo: string;
  etiquetaTipo: string;
  talla: TallaBata | null;
  descripcion: string;
  cantidadTotal: number;
  cantidadPrestada: number;
  disponible: number;
  activo: boolean;
};

export async function listarInventarioPanel(): Promise<ArticuloPanel[]> {
  const prisma = obtenerPrisma();
  const [articulos, prestadas] = await Promise.all([
    prisma.articuloInventario.findMany({
      orderBy: [{ tipo: "asc" }, { talla: "asc" }],
      select: {
        idArticulo: true,
        tipo: true,
        talla: true,
        cantidadTotal: true,
        activo: true,
      },
    }),
    prestadasPorArticulo(),
  ]);

  return articulos.map((articulo) => {
    const cantidadPrestada = prestadas.get(articulo.idArticulo) ?? 0;
    return {
      idArticulo: articulo.idArticulo,
      tipo: articulo.tipo,
      etiquetaTipo: ETIQUETAS_TIPO_ARTICULO[articulo.tipo],
      talla: articulo.talla,
      descripcion: describirArticulo(articulo.tipo, articulo.talla),
      cantidadTotal: articulo.cantidadTotal,
      cantidadPrestada,
      disponible: Math.max(articulo.cantidadTotal - cantidadPrestada, 0),
      activo: articulo.activo,
    };
  });
}

export type AsignadoPanel = {
  idAsignacion: number;
  nombre: string;
  carnet: string;
};

export type TurnoPanel = {
  idTurno: number;
  dia: DiaSemana;
  etiquetaDia: string;
  horaInicio: string;
  horaFin: string;
  rango: string;
  cupo: number;
  activo: boolean;
  asignados: AsignadoPanel[];
};

export async function listarTurnosPanel(): Promise<TurnoPanel[]> {
  const turnos = await obtenerPrisma().turnoVoluntariado.findMany({
    orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
    select: {
      idTurno: true,
      diaSemana: true,
      horaInicio: true,
      horaFin: true,
      cupo: true,
      activo: true,
      asignaciones: {
        where: { activo: true },
        orderBy: { fechaAsignacion: "asc" },
        select: {
          idAsignacion: true,
          estudiante: { select: { nombreCompleto: true, carnet: true } },
        },
      },
    },
  });

  return turnos.map((turno) => ({
    idTurno: turno.idTurno,
    dia: turno.diaSemana,
    etiquetaDia: ETIQUETAS_DIA[turno.diaSemana],
    horaInicio: aHoraDeReloj(turno.horaInicio),
    horaFin: aHoraDeReloj(turno.horaFin),
    rango: formatearRangoTurno(turno.horaInicio, turno.horaFin),
    cupo: turno.cupo,
    activo: turno.activo,
    asignados: turno.asignaciones.map((a) => ({
      idAsignacion: a.idAsignacion,
      nombre: a.estudiante.nombreCompleto,
      carnet: a.estudiante.carnet,
    })),
  }));
}

export type TurnoSolicitado = {
  idTurno: number;
  dia: DiaSemana;
  etiquetaDia: string;
  rango: string;
  asignadosActivos: number;
  cupo: number;
};

export type PostulacionPanel = {
  idPostulacion: number;
  fecha: string;
  estudiante: { nombre: string; carnet: string; carrera: string };
  comentario: string | null;
  turnos: TurnoSolicitado[];
};

export async function listarPostulacionesPendientes(): Promise<PostulacionPanel[]> {
  const postulaciones = await obtenerPrisma().postulacionVoluntario.findMany({
    where: { estado: "PENDIENTE" },
    orderBy: { fechaPostulacion: "asc" },
    select: {
      idPostulacion: true,
      fechaPostulacion: true,
      comentarioSolicitante: true,
      estudiante: {
        select: { nombreCompleto: true, carnet: true, carrera: { select: { nombre: true } } },
      },
      turnos: {
        select: {
          turno: {
            select: {
              idTurno: true,
              diaSemana: true,
              horaInicio: true,
              horaFin: true,
              cupo: true,
              _count: { select: { asignaciones: { where: { activo: true } } } },
            },
          },
        },
      },
    },
  });

  return postulaciones.map((postulacion) => ({
    idPostulacion: postulacion.idPostulacion,
    fecha: formatearFecha(postulacion.fechaPostulacion),
    estudiante: {
      nombre: postulacion.estudiante.nombreCompleto,
      carnet: postulacion.estudiante.carnet,
      carrera: postulacion.estudiante.carrera.nombre,
    },
    comentario: postulacion.comentarioSolicitante,
    turnos: postulacion.turnos
      .map((t) => ({
        idTurno: t.turno.idTurno,
        dia: t.turno.diaSemana,
        etiquetaDia: ETIQUETAS_DIA[t.turno.diaSemana],
        rango: formatearRangoTurno(t.turno.horaInicio, t.turno.horaFin),
        asignadosActivos: t.turno._count.asignaciones,
        cupo: t.turno.cupo,
      }))
      .sort((a, b) => DIAS_SEMANA.indexOf(a.dia) - DIAS_SEMANA.indexOf(b.dia)),
  }));
}

export type PrestamoPanel = {
  idPrestamo: number;
  fecha: string;
  persona: string;
  carnet: string;
  correo: string | null;
  telefono: string | null;
  estado: EstadoPrestamoBata;
  etiquetaEstado: string;
  horaSalida: string;
  horaEntregaEstimada: string | null;
  articulos: string[];
  comentarios: string | null;
  registrador: string | null;
};

/** Préstamos para el panel y el voluntario: los prestados primero, luego los recientes. */
export async function listarPrestamos(limite = 100): Promise<PrestamoPanel[]> {
  const prestamos = await obtenerPrisma().prestamoBata.findMany({
    orderBy: [{ estado: "asc" }, { fechaPrestamo: "desc" }, { idPrestamo: "desc" }],
    take: limite,
    select: {
      idPrestamo: true,
      fechaPrestamo: true,
      nombre: true,
      apellido: true,
      carnet: true,
      correo: true,
      telefono: true,
      estado: true,
      horaSalida: true,
      horaEntregaEstimada: true,
      comentarios: true,
      articulos: {
        select: { cantidad: true, articulo: { select: { tipo: true, talla: true } } },
      },
      registrador: { select: { estudiante: { select: { nombreCompleto: true } } } },
    },
  });

  return prestamos.map((prestamo) => ({
    idPrestamo: prestamo.idPrestamo,
    fecha: formatearFecha(prestamo.fechaPrestamo),
    persona: `${prestamo.nombre} ${prestamo.apellido}`,
    carnet: prestamo.carnet,
    correo: prestamo.correo,
    telefono: prestamo.telefono,
    estado: prestamo.estado,
    etiquetaEstado: ETIQUETAS_ESTADO_PRESTAMO[prestamo.estado],
    horaSalida: aHoraDeReloj(prestamo.horaSalida),
    horaEntregaEstimada: prestamo.horaEntregaEstimada
      ? aHoraDeReloj(prestamo.horaEntregaEstimada)
      : null,
    articulos: prestamo.articulos.map(
      (linea) =>
        `${linea.cantidad > 1 ? `${linea.cantidad}× ` : ""}${describirArticulo(linea.articulo.tipo, linea.articulo.talla)}`
    ),
    comentarios: prestamo.comentarios,
    registrador: prestamo.registrador.estudiante?.nombreCompleto ?? null,
  }));
}

export type EntradaListaNegra = {
  idListaNegra: number;
  fecha: string | null;
  nombre: string;
  apellido: string | null;
  correo: string | null;
  carnet: string | null;
  telefono: string | null;
  justificacion: string;
  registrador: string | null;
};

export async function listarListaNegra(limite = 100): Promise<EntradaListaNegra[]> {
  const entradas = await obtenerPrisma().listaNegraBata.findMany({
    orderBy: { fechaCreacion: "desc" },
    take: limite,
    select: {
      idListaNegra: true,
      fecha: true,
      nombre: true,
      apellido: true,
      correo: true,
      carnet: true,
      telefono: true,
      justificacion: true,
      registrador: { select: { estudiante: { select: { nombreCompleto: true } } } },
    },
  });

  return entradas.map((entrada) => ({
    idListaNegra: entrada.idListaNegra,
    fecha: entrada.fecha ? formatearFecha(entrada.fecha) : null,
    nombre: entrada.nombre,
    apellido: entrada.apellido,
    correo: entrada.correo,
    carnet: entrada.carnet,
    telefono: entrada.telefono,
    justificacion: entrada.justificacion,
    registrador: entrada.registrador.estudiante?.nombreCompleto ?? null,
  }));
}

export type ComprobantePanel = {
  idComprobante: number;
  estado: EstadoComprobanteTurno;
  etiquetaEstado: string;
  voluntario: { nombre: string; carnet: string };
  turno: string;
  fecha: string;
  horaEntrada: string;
  horaSalida: string;
  horasTurno: number;
  fotoInicioUrl: string | null;
  fotoFinUrl: string | null;
  comentarioVoluntario: string | null;
  comentarioRevision: string | null;
};

function aComprobantePanel(fila: {
  idComprobante: number;
  estado: EstadoComprobanteTurno;
  fecha: Date;
  horaEntrada: Date;
  horaSalida: Date;
  fotoInicioUrl: string | null;
  fotoFinUrl: string | null;
  comentarioVoluntario: string | null;
  comentarioRevision: string | null;
  estudiante: { nombreCompleto: string; carnet: string };
  turno: { diaSemana: DiaSemana; horaInicio: Date; horaFin: Date };
}): ComprobantePanel {
  return {
    idComprobante: fila.idComprobante,
    estado: fila.estado,
    etiquetaEstado: ETIQUETAS_ESTADO_COMPROBANTE[fila.estado],
    voluntario: { nombre: fila.estudiante.nombreCompleto, carnet: fila.estudiante.carnet },
    turno: `${ETIQUETAS_DIA[fila.turno.diaSemana]}, ${formatearRangoTurno(fila.turno.horaInicio, fila.turno.horaFin)}`,
    fecha: formatearFecha(fila.fecha),
    horaEntrada: aHoraDeReloj(fila.horaEntrada),
    horaSalida: aHoraDeReloj(fila.horaSalida),
    horasTurno: duracionHorasTurno(fila.turno.horaInicio, fila.turno.horaFin),
    fotoInicioUrl: fila.fotoInicioUrl,
    fotoFinUrl: fila.fotoFinUrl,
    comentarioVoluntario: fila.comentarioVoluntario,
    comentarioRevision: fila.comentarioRevision,
  };
}

const SELECCION_COMPROBANTE = {
  idComprobante: true,
  estado: true,
  fecha: true,
  horaEntrada: true,
  horaSalida: true,
  fotoInicioUrl: true,
  fotoFinUrl: true,
  comentarioVoluntario: true,
  comentarioRevision: true,
  estudiante: { select: { nombreCompleto: true, carnet: true } },
  turno: { select: { diaSemana: true, horaInicio: true, horaFin: true } },
} as const;

export async function listarComprobantesPendientes(): Promise<ComprobantePanel[]> {
  const filas = await obtenerPrisma().comprobanteTurno.findMany({
    where: { estado: "PENDIENTE" },
    orderBy: { fechaEnvio: "asc" },
    select: SELECCION_COMPROBANTE,
  });

  return filas.map(aComprobantePanel);
}

export async function listarComprobantesRevisados(limite = 50): Promise<ComprobantePanel[]> {
  const filas = await obtenerPrisma().comprobanteTurno.findMany({
    where: { estado: { not: "PENDIENTE" } },
    orderBy: { fechaRevision: "desc" },
    take: limite,
    select: SELECCION_COMPROBANTE,
  });

  return filas.map(aComprobantePanel);
}

// ---------------------------------------------------------------------------
// Panel del voluntario
// ---------------------------------------------------------------------------

export type MiTurno = {
  idTurno: number;
  dia: DiaSemana;
  etiquetaDia: string;
  rango: string;
};

export async function listarMisTurnos(idUsuario: number): Promise<MiTurno[]> {
  const asignaciones = await obtenerPrisma().asignacionVoluntario.findMany({
    where: { activo: true, estudiante: { usuario: { idUsuario } } },
    orderBy: [{ turno: { diaSemana: "asc" } }, { turno: { horaInicio: "asc" } }],
    select: {
      turno: { select: { idTurno: true, diaSemana: true, horaInicio: true, horaFin: true } },
    },
  });

  return asignaciones.map(({ turno }) => ({
    idTurno: turno.idTurno,
    dia: turno.diaSemana,
    etiquetaDia: ETIQUETAS_DIA[turno.diaSemana],
    rango: formatearRangoTurno(turno.horaInicio, turno.horaFin),
  }));
}

export type MiComprobante = {
  idComprobante: number;
  turno: string;
  fecha: string;
  horaEntrada: string;
  horaSalida: string;
  estado: EstadoComprobanteTurno;
  etiquetaEstado: string;
  horasTurno: number;
  comentarioRevision: string | null;
};

export async function listarMisComprobantes(idUsuario: number): Promise<MiComprobante[]> {
  const filas = await obtenerPrisma().comprobanteTurno.findMany({
    where: { estudiante: { usuario: { idUsuario } } },
    orderBy: { fechaEnvio: "desc" },
    select: {
      idComprobante: true,
      estado: true,
      fecha: true,
      horaEntrada: true,
      horaSalida: true,
      comentarioRevision: true,
      turno: { select: { diaSemana: true, horaInicio: true, horaFin: true } },
    },
  });

  return filas.map((fila) => ({
    idComprobante: fila.idComprobante,
    turno: `${ETIQUETAS_DIA[fila.turno.diaSemana]}, ${formatearRangoTurno(fila.turno.horaInicio, fila.turno.horaFin)}`,
    fecha: formatearFecha(fila.fecha),
    horaEntrada: aHoraDeReloj(fila.horaEntrada),
    horaSalida: aHoraDeReloj(fila.horaSalida),
    estado: fila.estado,
    etiquetaEstado: ETIQUETAS_ESTADO_COMPROBANTE[fila.estado],
    horasTurno: duracionHorasTurno(fila.turno.horaInicio, fila.turno.horaFin),
    comentarioRevision: fila.comentarioRevision,
  }));
}

/** Postulaciones y comprobantes esperando revisión, para los contadores del panel. */
export async function contarPendientesPanel(): Promise<{
  postulaciones: number;
  comprobantes: number;
}> {
  const prisma = obtenerPrisma();
  const [postulaciones, comprobantes] = await Promise.all([
    prisma.postulacionVoluntario.count({ where: { estado: "PENDIENTE" } }),
    prisma.comprobanteTurno.count({ where: { estado: "PENDIENTE" } }),
  ]);

  return { postulaciones, comprobantes };
}

/** True si el estudiante de la sesión tiene al menos un turno activo asignado. */
export async function esVoluntarioActivo(idUsuario: number): Promise<boolean> {
  const cuantas = await obtenerPrisma().asignacionVoluntario.count({
    where: { activo: true, estudiante: { usuario: { idUsuario } } },
  });

  return cuantas > 0;
}

/** Estado de la postulación del estudiante, para la página pública y la de postular. */
export type EstadoPostulacionEstudiante =
  | { estado: "ninguna" }
  | { estado: "pendiente" }
  | { estado: "aprobada" }
  | { estado: "rechazada" };

export async function estadoPostulacionDe(idUsuario: number): Promise<EstadoPostulacionEstudiante> {
  const ultima = await obtenerPrisma().postulacionVoluntario.findFirst({
    where: { estudiante: { usuario: { idUsuario } } },
    orderBy: { fechaPostulacion: "desc" },
    select: { estado: true },
  });

  if (!ultima) return { estado: "ninguna" };
  if (ultima.estado === "PENDIENTE") return { estado: "pendiente" };
  if (ultima.estado === "APROBADA") return { estado: "aprobada" };
  return { estado: "rechazada" };
}

export { ESTADOS_PRESTAMO };

// ---------------------------------------------------------------------------
// La jornada del voluntario
// ---------------------------------------------------------------------------

/**
 * Lo que un voluntario hizo el día que estuvo a cargo.
 *
 * Al enviar el comprobante su turno queda cerrado y los formularios dejan de
 * estar a la vista: ya no está atendiendo. Lo que sí se conserva es esto, el
 * registro de la jornada, para que pueda consultar qué prestó y a quién anotó
 * sin poder seguir escribiendo sobre un turno terminado.
 */
export type JornadaVoluntario = {
  /** Día de calendario en Guatemala, "AAAA-MM-DD". */
  dia: string;
  fecha: string;
  cerrada: boolean;
  /** Estado del comprobante con el que se cerró, si ya se envió. */
  comprobante: MiComprobante | null;
  prestamos: PrestamoPanel[];
  listaNegra: EntradaListaNegra[];
};

const diaEnGuatemala = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "America/Guatemala",
});

/** Hoy en Guatemala, como el día de calendario con el que se guardan las fechas. */
export function diaDeHoy(ahora = new Date()): string {
  return diaEnGuatemala.format(ahora);
}

/**
 * La jornada de hoy del voluntario de la sesión.
 *
 * El día se decide en la hora de Guatemala y no en la del servidor: un turno
 * de las siete de la noche pertenece a ese día, no al siguiente.
 */
export async function obtenerJornadaDeHoy(
  idUsuario: number,
  ahora = new Date()
): Promise<JornadaVoluntario> {
  const prisma = obtenerPrisma();
  const dia = diaDeHoy(ahora);
  const fechaDelDia = new Date(`${dia}T00:00:00.000Z`);

  const [comprobante, prestamos, listaNegra] = await Promise.all([
    prisma.comprobanteTurno.findFirst({
      where: { fecha: fechaDelDia, estudiante: { usuario: { idUsuario } } },
      orderBy: { fechaEnvio: "desc" },
      select: {
        idComprobante: true,
        estado: true,
        fecha: true,
        horaEntrada: true,
        horaSalida: true,
        fotoInicioUrl: true,
        fotoFinUrl: true,
        comentarioRevision: true,
        turno: { select: { diaSemana: true, horaInicio: true, horaFin: true } },
      },
    }),
    prisma.prestamoBata.findMany({
      where: { fechaPrestamo: fechaDelDia, registradoPor: idUsuario },
      orderBy: { idPrestamo: "desc" },
      select: {
        idPrestamo: true,
        fechaPrestamo: true,
        nombre: true,
        apellido: true,
        carnet: true,
        correo: true,
        telefono: true,
        estado: true,
        horaSalida: true,
        horaEntregaEstimada: true,
        comentarios: true,
        articulos: {
          select: { cantidad: true, articulo: { select: { tipo: true, talla: true } } },
        },
        registrador: { select: { estudiante: { select: { nombreCompleto: true } } } },
      },
    }),
    prisma.listaNegraBata.findMany({
      where: {
        registradoPor: idUsuario,
        fechaCreacion: {
          gte: new Date(`${dia}T00:00:00.000-06:00`),
          lt: new Date(`${dia}T23:59:59.999-06:00`),
        },
      },
      orderBy: { idListaNegra: "desc" },
      select: {
        idListaNegra: true,
        fecha: true,
        nombre: true,
        apellido: true,
        correo: true,
        carnet: true,
        telefono: true,
        justificacion: true,
        registrador: { select: { estudiante: { select: { nombreCompleto: true } } } },
      },
    }),
  ]);

  return {
    dia,
    fecha: formatearFecha(fechaDelDia),
    cerrada: comprobante !== null,
    comprobante: comprobante
      ? {
          idComprobante: comprobante.idComprobante,
          turno: `${ETIQUETAS_DIA[comprobante.turno.diaSemana]}, ${formatearRangoTurno(comprobante.turno.horaInicio, comprobante.turno.horaFin)}`,
          fecha: formatearFecha(comprobante.fecha),
          horaEntrada: aHoraDeReloj(comprobante.horaEntrada),
          horaSalida: aHoraDeReloj(comprobante.horaSalida),
          estado: comprobante.estado,
          etiquetaEstado: ETIQUETAS_ESTADO_COMPROBANTE[comprobante.estado],
          horasTurno: duracionHorasTurno(comprobante.turno.horaInicio, comprobante.turno.horaFin),
          comentarioRevision: comprobante.comentarioRevision,
        }
      : null,
    prestamos: prestamos.map((prestamo) => ({
      idPrestamo: prestamo.idPrestamo,
      fecha: formatearFecha(prestamo.fechaPrestamo),
      persona: `${prestamo.nombre} ${prestamo.apellido}`,
      carnet: prestamo.carnet,
      correo: prestamo.correo,
      telefono: prestamo.telefono,
      estado: prestamo.estado,
      etiquetaEstado: ETIQUETAS_ESTADO_PRESTAMO[prestamo.estado],
      horaSalida: aHoraDeReloj(prestamo.horaSalida),
      horaEntregaEstimada: prestamo.horaEntregaEstimada
        ? aHoraDeReloj(prestamo.horaEntregaEstimada)
        : null,
      articulos: prestamo.articulos.map(
        (linea) =>
          `${linea.cantidad > 1 ? `${linea.cantidad}× ` : ""}${describirArticulo(linea.articulo.tipo, linea.articulo.talla)}`
      ),
      comentarios: prestamo.comentarios,
      registrador: prestamo.registrador.estudiante?.nombreCompleto ?? null,
    })),
    listaNegra: listaNegra.map((entrada) => ({
      idListaNegra: entrada.idListaNegra,
      fecha: entrada.fecha ? formatearFecha(entrada.fecha) : null,
      nombre: entrada.nombre,
      apellido: entrada.apellido,
      correo: entrada.correo,
      carnet: entrada.carnet,
      telefono: entrada.telefono,
      justificacion: entrada.justificacion,
      registrador: entrada.registrador.estudiante?.nombreCompleto ?? null,
    })),
  };
}
