import type { EstadoUsuario } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";

export type FacultadDisponible = {
  idFacultad: number;
  nombre: string;
  carreras: { idCarrera: number; nombre: string }[];
};

export type PerfilEstudiante = {
  idUsuario: number;
  nombreCompleto: string;
  /** Fotografía de perfil, cuando la subió. Las iniciales son el respaldo. */
  fotoUrl: string | null;
  carnet: string;
  correoUvg: string;
  correoCuenta: string;
  telefono: string | null;
  idCarrera: number;
  carrera: string;
  idFacultad: number;
  facultad: string;
  estado: EstadoUsuario;
  correoVerificado: boolean;
  fechaCreacion: Date;
};

/**
 * Perfil del estudiante dueño de la sesión.
 *
 * Se consulta siempre por el identificador del usuario de la sesión y nunca por
 * un parámetro de la dirección: así no existe forma de pedir el perfil de otra
 * persona, ni por descuido ni manipulando un enlace.
 */
export async function obtenerPerfil(idUsuario: number): Promise<PerfilEstudiante | null> {
  if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) return null;

  const usuario = await obtenerPrisma().usuario.findUnique({
    where: { idUsuario },
    select: {
      idUsuario: true,
      correo: true,
      estado: true,
      correoVerificado: true,
      fechaCreacion: true,
      estudiante: {
        select: {
          nombreCompleto: true,
          fotoUrl: true,
          carnet: true,
          correoUvg: true,
          telefono: true,
          idCarrera: true,
          carrera: {
            select: { nombre: true, idFacultad: true, facultad: { select: { nombre: true } } },
          },
        },
      },
    },
  });

  if (!usuario) return null;

  const { estudiante } = usuario;

  return {
    idUsuario: usuario.idUsuario,
    nombreCompleto: estudiante.nombreCompleto,
    fotoUrl: estudiante.fotoUrl,
    carnet: estudiante.carnet,
    correoUvg: estudiante.correoUvg,
    correoCuenta: usuario.correo,
    telefono: estudiante.telefono,
    idCarrera: estudiante.idCarrera,
    carrera: estudiante.carrera.nombre,
    idFacultad: estudiante.carrera.idFacultad,
    facultad: estudiante.carrera.facultad.nombre,
    estado: usuario.estado,
    correoVerificado: usuario.correoVerificado,
    fechaCreacion: usuario.fechaCreacion,
  };
}

/**
 * Facultades activas con sus carreras, para los dos selectores del perfil.
 * Van agrupadas como en la creación de cuenta: primero se elige la facultad y
 * con ella se filtran las carreras.
 */
export async function listarFacultadesDisponibles(): Promise<FacultadDisponible[]> {
  return obtenerPrisma().facultad.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: {
      idFacultad: true,
      nombre: true,
      carreras: {
        where: { activo: true },
        orderBy: { nombre: "asc" },
        select: { idCarrera: true, nombre: true },
      },
    },
  });
}
