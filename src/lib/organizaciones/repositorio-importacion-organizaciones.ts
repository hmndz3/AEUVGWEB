import type { PrismaClient } from "@prisma/client";

import { normalizarTexto } from "@/lib/busqueda-texto";
import type { RegistradosOrganizacion } from "@/lib/organizaciones/validacion-importacion-organizaciones";
import { obtenerPrisma } from "@/lib/prisma";
import type { TipoOrganizacion } from "@/validators/organizacion-admin";

export interface RepositorioImportacionOrganizaciones {
  /** Nombres y siglas ya registrados, normalizados, para no duplicarlos. */
  registrados(tipo: TipoOrganizacion): Promise<RegistradosOrganizacion>;
}

/**
 * Lo único que la importación necesita de la base además de crear: saber qué
 * nombres ya existen.
 *
 * Se consultan todos de una vez y no uno por fila. Son decenas de grupos en
 * total, así que la lista completa cabe de sobra en memoria y evita una consulta
 * por línea del archivo. Se incluyen los dados de baja: su nombre sigue
 * ocupado, y crear otro con el mismo chocaría con la restricción de la tabla.
 */
export class RepositorioImportacionOrganizacionesPrisma implements RepositorioImportacionOrganizaciones {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async registrados(tipo: TipoOrganizacion): Promise<RegistradosOrganizacion> {
    if (tipo === "clubes") {
      const clubes = await this.prisma.club.findMany({ select: { nombre: true } });

      return { nombres: clubes.map((club) => normalizarTexto(club.nombre)), siglas: [] };
    }

    const asociaciones = await this.prisma.asociacion.findMany({
      select: { nombre: true, siglas: true },
    });

    return {
      nombres: asociaciones.map((asociacion) => normalizarTexto(asociacion.nombre)),
      siglas: asociaciones
        .filter((asociacion) => asociacion.siglas !== null)
        .map((asociacion) => normalizarTexto(asociacion.siglas as string)),
    };
  }
}
