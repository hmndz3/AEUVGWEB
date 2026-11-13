import { protegerRuta } from "@/lib/auth/guardias";
import { crearServicioFichaTutor } from "@/lib/tutorias/crear-servicios-tutorias";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

/** Quita una franja de disponibilidad del tutor de la sesión. */
export const DELETE = protegerRuta([], async (usuario, _solicitud: Request, contexto: Contexto) => {
  const id = Number((await contexto.params).id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
  }

  try {
    const resultado = await crearServicioFichaTutor().quitarFranja(usuario.idUsuario, id);

    if (resultado.tipo === "no_es_tutor") {
      return Response.json(
        { mensaje: "Tu cuenta no es tutor en la plataforma." },
        { status: 403, headers: sinCache }
      );
    }
    if (resultado.tipo === "no_encontrada") {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }

    return Response.json({ quitada: true }, { headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudo quitar la franja. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
