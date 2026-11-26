import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioVoluntarios } from "@/lib/prestamo-batas/crear-servicios-prestamo-batas";

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
 * Retira a un voluntario de un turno. Es una baja lógica: si con ella el
 * estudiante se queda sin turnos, pierde el rol de voluntario y su pestaña.
 */
export const DELETE = protegerRuta(
  [ROLES.administrador],
  async (_usuario, _solicitud: Request, contexto: Contexto) => {
    const id = await leerId(contexto);
    if (id === null) return noEncontrado();

    try {
      const resultado = await crearServicioVoluntarios().desasignar(id);
      if (resultado.tipo === "no_encontrado") return noEncontrado();

      return Response.json({ desasignado: true }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo retirar al voluntario. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
