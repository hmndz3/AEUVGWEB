import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { destinatariosDeAcreditacion } from "@/lib/horas-beca/consultas-horas-beca";
import { crearServicioHorasBeca } from "@/lib/horas-beca/crear-servicio-horas-beca";
import { formatearHoras } from "@/lib/horas-beca/formato-horas";
import { notificar, TIPOS_NOTIFICACION } from "@/lib/notificaciones/notificaciones";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaAcreditacionLote } from "@/validators/hora-beca-admin";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/**
 * Acredita o devuelve a pendiente los registros seleccionados.
 *
 * Vive en un recurso aparte del registro porque la acreditación no es un campo
 * más de la ficha: cambia el estado, deja constancia de quién la aplicó y se
 * ejecuta sobre varios registros a la vez. La fecha la pone el servidor y el
 * responsable sale de la sesión, de modo que el cuerpo no pueda falsear ninguno.
 */
export const PATCH = protegerRuta([ROLES.administrador], async (usuario, solicitud: Request) => {
  const cuerpo = await solicitud.json().catch(() => null);
  const validacion = esquemaAcreditacionLote.safeParse(cuerpo);

  if (!validacion.success) {
    return Response.json(
      { errores: erroresPorCampo(validacion.error) },
      { status: 422, headers: sinCache }
    );
  }

  const { accion, ids } = validacion.data;

  try {
    const servicio = crearServicioHorasBeca();
    const resultado =
      accion === "acreditar"
        ? await servicio.acreditar(ids, usuario.idUsuario, new Date())
        : await servicio.revertir(ids);

    if (resultado.tipo === "invalida") {
      return Response.json({ mensaje: resultado.mensaje }, { status: 422, headers: sinCache });
    }

    // Se avisa solo al acreditar: la reversión suele ser la corrección de un
    // error de AEUVG y avisar de ella sembraría una duda que no toca al
    // estudiante. El aviso nunca hace fallar la operación, que ya se aplicó.
    if (accion === "acreditar" && resultado.afectados > 0) {
      for (const destino of await destinatariosDeAcreditacion(ids)) {
        await notificar({
          idUsuario: destino.idUsuario,
          tipo: TIPOS_NOTIFICACION.horasBeca,
          titulo: "Te acreditaron horas beca",
          mensaje: `AEUVG acreditó ${formatearHoras(destino.horas)} ${destino.horas === 1 ? "hora" : "horas"} de ${destino.registros} ${destino.registros === 1 ? "actividad" : "actividades"}.`,
          urlDestino: "/perfil#mis-horas-beca",
        });
      }
    }

    return Response.json(
      { accion, solicitados: resultado.solicitados, afectados: resultado.afectados },
      { headers: sinCache }
    );
  } catch {
    return Response.json(
      { mensaje: "No se pudo aplicar la operación. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
