import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioVoluntarios } from "@/lib/prestamo-batas/crear-servicios-prestamo-batas";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaRevisionPostulacionVoluntario } from "@/validators/prestamo-batas";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

async function leerId(contexto: Contexto): Promise<number | null> {
  const id = Number((await contexto.params).id);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

const noEncontrado = () =>
  Response.json({ mensaje: "No encontrada." }, { status: 404, headers: sinCache });

/**
 * Revisa una postulación de voluntario. Al aprobar, asigna al estudiante a los
 * turnos indicados (hasta dos voluntarios por turno) y le concede el rol.
 */
export const POST = protegerRuta(
  [ROLES.administrador],
  async (usuario, solicitud: Request, contexto: Contexto) => {
    const id = await leerId(contexto);
    if (id === null) return noEncontrado();

    const cuerpo = await solicitud.json().catch(() => null);
    const validacion = esquemaRevisionPostulacionVoluntario.safeParse(cuerpo);

    if (!validacion.success) {
      return Response.json(
        { errores: erroresPorCampo(validacion.error) },
        { status: 422, headers: sinCache }
      );
    }

    try {
      const { decision, idsTurnos, comentarioRevision } = validacion.data;
      const resultado = await crearServicioVoluntarios().revisar(
        id,
        decision,
        idsTurnos,
        comentarioRevision,
        usuario.idUsuario
      );

      if (resultado.tipo === "no_encontrada") return noEncontrado();
      if (resultado.tipo === "no_permitida") {
        return Response.json({ mensaje: resultado.mensaje }, { status: 409, headers: sinCache });
      }

      return Response.json(
        { estado: resultado.estado, asignacion: resultado.asignacion },
        { headers: sinCache }
      );
    } catch {
      return Response.json(
        { mensaje: "No se pudo revisar la postulación. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
