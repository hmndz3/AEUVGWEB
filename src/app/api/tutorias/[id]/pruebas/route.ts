import { protegerRuta } from "@/lib/auth/guardias";
import { notificar, TIPOS_NOTIFICACION } from "@/lib/notificaciones/notificaciones";
import { obtenerTutoriaParaAviso } from "@/lib/tutorias/consultas-tutorias";
import { crearServicioValidacionTutorias } from "@/lib/tutorias/crear-servicios-tutorias";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaPruebasTutor } from "@/validators/tutoria";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

/**
 * El tutor da la tutoría por impartida y manda sus dos pruebas.
 *
 * Con esto las horas quedan pendientes de revisión por parte de AEUVG; no se
 * acreditan solas.
 */
export const POST = protegerRuta([], async (usuario, solicitud: Request, contexto: Contexto) => {
  const id = Number((await contexto.params).id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
  }

  const cuerpo = await solicitud.json().catch(() => null);
  const datos = esquemaPruebasTutor.safeParse(cuerpo);

  if (!datos.success) {
    return Response.json(
      { errores: erroresPorCampo(datos.error) },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioValidacionTutorias().marcarComoDada(
      usuario.idUsuario,
      id,
      datos.data
    );

    if (resultado.tipo === "no_encontrada") {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }
    if (resultado.tipo === "no_permitida") {
      return Response.json({ mensaje: resultado.mensaje }, { status: 409, headers: sinCache });
    }

    const aviso = await obtenerTutoriaParaAviso(id);

    if (aviso?.idUsuarioEstudiante) {
      await notificar({
        idUsuario: aviso.idUsuarioEstudiante,
        tipo: TIPOS_NOTIFICACION.tutoria,
        titulo: "Confirma tu tutoría",
        mensaje: `El tutor marcó como dada la tutoría de ${aviso.curso} del ${aviso.cuando}. Confírmala con una foto.`,
        urlDestino: "/tutorias/solicitudes",
      });
    }

    return Response.json({ estadoHoras: "PENDIENTE" }, { headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudieron guardar las pruebas. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
