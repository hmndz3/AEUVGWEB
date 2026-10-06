import { protegerRuta } from "@/lib/auth/guardias";
import { crearServicioPerfil } from "@/lib/perfil/crear-servicio-perfil";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaPerfil } from "@/validators/perfil";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/**
 * Actualiza el perfil de quien tiene la sesión.
 *
 * No exige ningún rol, solo sesión: cualquier cuenta puede editar su propio
 * perfil. Tampoco recibe el identificador del estudiante, porque lo resuelve el
 * servicio a partir de la sesión y así nadie puede escribir sobre otro perfil.
 */
export const PUT = protegerRuta([], async (usuario, solicitud: Request) => {
  const cuerpo = await solicitud.json().catch(() => null);
  const validacion = esquemaPerfil.safeParse(cuerpo);

  if (!validacion.success) {
    return Response.json(
      { errores: erroresPorCampo(validacion.error) },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioPerfil().actualizar(usuario.idUsuario, validacion.data);

    if (resultado.tipo === "invalido") {
      return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
    }
    if (resultado.tipo === "no_encontrado") {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }

    return Response.json({ guardado: true }, { headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudo guardar el perfil. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
