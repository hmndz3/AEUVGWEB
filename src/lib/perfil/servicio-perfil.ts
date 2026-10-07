import type { RepositorioPerfil } from "@/lib/perfil/repositorio-perfil";
import type { DatosPerfil } from "@/validators/perfil";

export type ResultadoPerfil =
  | { tipo: "guardado" }
  | { tipo: "no_encontrado" }
  | { tipo: "invalido"; errores: Record<string, string> };

/**
 * Edición del perfil del estudiante.
 *
 * Sigue la misma separación entre servicio y repositorio que la autenticación y
 * los eventos, de modo que las reglas puedan probarse sin base de datos.
 *
 * El servicio recibe el usuario de la sesión y resuelve por su cuenta a qué
 * estudiante corresponde: así ninguna pantalla ni ningún servicio puede indicar
 * sobre qué estudiante escribir.
 */
export class ServicioPerfil {
  constructor(private readonly repositorio: RepositorioPerfil) {}

  async actualizar(idUsuario: number, datos: DatosPerfil): Promise<ResultadoPerfil> {
    const idEstudiante = await this.repositorio.estudianteDeUsuario(idUsuario);
    if (idEstudiante === null) return { tipo: "no_encontrado" };

    // La carrera se comprueba contra la base: el esquema solo puede saber que es
    // un número, no que exista y siga abierta.
    if (!(await this.repositorio.carreraActiva(datos.idCarrera))) {
      return {
        tipo: "invalido",
        errores: { idCarrera: "La carrera seleccionada no existe o ya no está activa." },
      };
    }

    const guardado = await this.repositorio.actualizar(idEstudiante, datos);

    return guardado ? { tipo: "guardado" } : { tipo: "no_encontrado" };
  }
}
