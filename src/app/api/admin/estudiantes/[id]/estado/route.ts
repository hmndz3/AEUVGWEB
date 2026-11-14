import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioCuentas } from "@/lib/admin/repositorio-cuentas";
import { ESTADOS_CUENTA } from "@/validators/cuentas-admin";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

/**
 * Activa, deja pendiente o bloquea una cuenta del estudiantado.
 *
 * El administrador de la sesión viaja al servicio para que no pueda bloquearse
 * a sí mismo: hacerlo lo dejaría fuera del panel y recuperar el acceso
 * exigiría entrar a la base a mano.
 */
export const PATCH = protegerRuta(
  [ROLES.administrador],
  async (usuario, solicitud: Request, contexto: Contexto) => {
    const id = Number((await contexto.params).id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }

    const cuerpo = (await solicitud.json().catch(() => null)) as { estado?: unknown } | null;
    const estado = ESTADOS_CUENTA.find((valor) => valor === cuerpo?.estado);

    if (!estado) {
      return Response.json(
        { mensaje: "Indica un estado válido para la cuenta." },
        { status: 422, headers: sinCache }
      );
    }

    try {
      const resultado = await crearServicioCuentas().cambiarEstado(id, estado, usuario.idUsuario);

      if (resultado.tipo === "no_encontrada") {
        return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
      }
      if (resultado.tipo === "no_permitido") {
        return Response.json({ mensaje: resultado.mensaje }, { status: 409, headers: sinCache });
      }

      return Response.json({ estado: resultado.estado }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo cambiar el estado de la cuenta. Intenta de nuevo." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
