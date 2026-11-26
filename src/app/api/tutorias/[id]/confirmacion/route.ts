import { protegerRuta } from "@/lib/auth/guardias";
import { crearServicioValidacionTutorias } from "@/lib/tutorias/crear-servicios-tutorias";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaPruebaEstudiante } from "@/validators/tutoria";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

/** El estudiante confirma con una imagen que el tutor sí se presentó. */
export const POST = protegerRuta([], async (usuario, solicitud: Request, contexto: Contexto) => {
  const id = Number((await contexto.params).id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
  }

  const cuerpo = await solicitud.json().catch(() => null);
  const datos = esquemaPruebaEstudiante.safeParse(cuerpo);

  if (!datos.success) {
    return Response.json(
      { errores: erroresPorCampo(datos.error) },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioValidacionTutorias().confirmarComoEstudiante(
      usuario.idUsuario,
      id,
      datos.data.pruebaUrl
    );

    if (resultado.tipo === "no_encontrada") {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }
    if (resultado.tipo === "no_permitida") {
      return Response.json({ mensaje: resultado.mensaje }, { status: 409, headers: sinCache });
    }

    return Response.json({ confirmada: true }, { headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudo confirmar la tutoría. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
