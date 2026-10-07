import { protegerRuta } from "@/lib/auth/guardias";
import { crearServicioEventosGuardados } from "@/lib/perfil/crear-servicio-eventos-guardados";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

const noEncontrado = () =>
  Response.json({ mensaje: "El evento no existe." }, { status: 404, headers: sinCache });

/**
 * Guarda el evento en el perfil de quien tiene la sesión.
 *
 * Exige sesión pero ningún rol: guardar un evento es una acción de cualquier
 * cuenta. El estudiante nunca se indica en la petición, lo resuelve la sesión, de
 * modo que no exista forma de guardar algo en el perfil de otra persona.
 */
export const POST = protegerRuta([], async (usuario, _solicitud: Request, contexto: Contexto) => {
  const idEvento = Number((await contexto.params).id);

  try {
    const resultado = await crearServicioEventosGuardados().guardar(usuario.idUsuario, idEvento);

    if (resultado.tipo === "no_encontrado") return noEncontrado();

    return Response.json({ guardado: true }, { headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudo guardar el evento. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});

/** Quita el evento de los guardados de quien tiene la sesión. */
export const DELETE = protegerRuta([], async (usuario, _solicitud: Request, contexto: Contexto) => {
  const idEvento = Number((await contexto.params).id);

  try {
    const resultado = await crearServicioEventosGuardados().quitar(usuario.idUsuario, idEvento);

    if (resultado.tipo === "no_encontrado") return noEncontrado();

    return Response.json({ guardado: false }, { headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudo quitar el evento. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
