import type { EstadoUsuario } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";

export type CarreraDisponible = {
  idCarrera: number;
  nombre: string;
  facultad: string;
};

export type PerfilEstudiante = {
  idUsuario: number;
  nombreCompleto: string;
  carnet: string;
  correoUvg: string;
  correoCuenta: string;
  telefono: string | null;
  idCarrera: number;
  carrera: string;
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
          carnet: true,
          correoUvg: true,
          telefono: true,
          idCarrera: true,
          carrera: { select: { nombre: true, facultad: { select: { nombre: true } } } },
        },
      },
    },
  });

  if (!usuario) return null;

  const { estudiante } = usuario;

  return {
    idUsuario: usuario.idUsuario,
    nombreCompleto: estudiante.nombreCompleto,
    carnet: estudiante.carnet,
    correoUvg: estudiante.correoUvg,
    correoCuenta: usuario.correo,
    telefono: estudiante.telefono,
    idCarrera: estudiante.idCarrera,
    carrera: estudiante.carrera.nombre,
    facultad: estudiante.carrera.facultad.nombre,
    estado: usuario.estado,
    correoVerificado: usuario.correoVerificado,
    fechaCreacion: usuario.fechaCreacion,
  };
}

/**
 * Carreras activas con su facultad, para el selector del perfil. Se devuelven en
 * una sola lista con la facultad al lado en lugar de agrupadas: en el perfil se
 * cambia la carrera, y la facultad se deduce de ella.
 */
export async function listarCarrerasDisponibles(): Promise<CarreraDisponible[]> {
  const carreras = await obtenerPrisma().carrera.findMany({
    where: { activo: true, facultad: { activo: true } },
    orderBy: [{ facultad: { nombre: "asc" } }, { nombre: "asc" }],
    select: { idCarrera: true, nombre: true, facultad: { select: { nombre: true } } },
  });

  return carreras.map((carrera) => ({
    idCarrera: carrera.idCarrera,
    nombre: carrera.nombre,
    facultad: carrera.facultad.nombre,
  }));
}
