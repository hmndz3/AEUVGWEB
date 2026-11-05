import { Prisma, type PrismaClient } from "@prisma/client";

import { textoDeBusquedaRegistroHora } from "@/lib/horas-beca/busqueda-horas";
import type { DatosRegistroHora } from "@/lib/horas-beca/servicio-horas-beca";
import type { ErrorFila } from "@/lib/horas-beca/validacion-importacion";
import type { EstudianteDeCarnet } from "@/lib/horas-beca/repositorio-horas-beca";
import { obtenerPrisma } from "@/lib/prisma";

/** Registro listo para guardarse, con el vínculo ya resuelto. */
export type RegistroImportado = DatosRegistroHora & { idEstudiante: number | null };

export type DatosImportacion = {
  realizadaPor: number;
  nombreArchivo: string;
  totalFilas: number;
  filasExitosas: number;
  filasFallidas: number;
  errores: ErrorFila[];
};

export interface RepositorioImportacion {
  /** Cuentas de varios carnets de una sola vez. */
  estudiantesPorCarnet(carnets: string[]): Promise<Map<string, EstudianteDeCarnet>>;
  registrarImportacion(datos: DatosImportacion): Promise<number>;
  /** `idImportacion` es nulo cuando los registros no vienen de un archivo. */
  crearRegistrosImportados(
    registros: RegistroImportado[],
    idImportacion: number | null,
    creadoPor: number
  ): Promise<number>;
}

export class RepositorioImportacionPrisma implements RepositorioImportacion {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  /**
   * Una sola consulta para todos los carnets del archivo: uno histórico repite
   * al mismo estudiante decenas de veces, y preguntar por fila convertiría la
   * importación en cientos de viajes a la base.
   */
  async estudiantesPorCarnet(carnets: string[]): Promise<Map<string, EstudianteDeCarnet>> {
    if (carnets.length === 0) return new Map();

    const estudiantes = await this.prisma.estudiante.findMany({
      where: { carnet: { in: carnets, mode: "insensitive" } },
      select: { idEstudiante: true, nombreCompleto: true, carnet: true },
    });

    return new Map(
      estudiantes.map((estudiante) => [
        estudiante.carnet.toUpperCase(),
        { idEstudiante: estudiante.idEstudiante, nombreCompleto: estudiante.nombreCompleto },
      ])
    );
  }

  /**
   * Deja constancia de la importación con sus conteos y el detalle de lo que
   * falló. El estado distingue la que entró entera de la que entró a medias,
   * que es lo que permite saber después si un archivo hay que volver a cargarlo.
   */
  async registrarImportacion(datos: DatosImportacion): Promise<number> {
    const importacion = await this.prisma.importacionHoras.create({
      data: {
        realizadaPor: datos.realizadaPor,
        nombreArchivo: datos.nombreArchivo,
        totalFilas: datos.totalFilas,
        filasExitosas: datos.filasExitosas,
        filasFallidas: datos.filasFallidas,
        estado: datos.filasFallidas === 0 ? "COMPLETADA" : "PARCIAL",
        detalleErrores: datos.errores as unknown as Prisma.InputJsonValue,
      },
      select: { idImportacion: true },
    });

    return importacion.idImportacion;
  }

  async crearRegistrosImportados(
    registros: RegistroImportado[],
    idImportacion: number | null,
    creadoPor: number
  ): Promise<number> {
    const { count } = await this.prisma.registroHoraBeca.createMany({
      data: registros.map((registro) => ({
        carnet: registro.carnet,
        nombreEstudiante: registro.nombreEstudiante,
        idEstudiante: registro.idEstudiante,
        idImportacion,
        creadoPor,
        fechaActividad: registro.fechaActividad,
        horarioApoyo: registro.horarioApoyo,
        descripcionActividad: registro.descripcionActividad,
        cantidadHoras: new Prisma.Decimal(registro.cantidadHoras.toFixed(2)),
        observaciones: registro.observaciones,
        textoBusqueda: textoDeBusquedaRegistroHora(registro),
      })),
    });

    return count;
  }
}
