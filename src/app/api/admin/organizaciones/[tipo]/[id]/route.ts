import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioOrganizaciones } from "@/lib/organizaciones/crear-servicio-organizaciones";
import {
  interpretarOrganizacion,
  interpretarTipoOrganizacion,
  type TipoOrganizacion,
} from "@/validators/organizacion-admin";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ tipo: string; id: string }> };

const sinCache = { "Cache-Control": "no-store" };

/** Resuelve el tipo y el identificador de la dirección, o null si no son válidos. */
async function leerRuta(
  contexto: Contexto
): Promise<{ tipo: TipoOrganizacion; id: number } | null> {
  const { tipo: tipoCrudo, id: idCrudo } = await contexto.params;
  const tipo = interpretarTipoOrganizacion(tipoCrudo);
  const id = Number(idCrudo);

  if (!tipo || !Number.isSafeInteger(id) || id <= 0) return null;

  return { tipo, id };
}

const noEncontrado = () =>
  Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });

/** Edita una asociación o un club. */
export const PUT = protegerRuta(
  [ROLES.administrador],
  async (_usuario, solicitud: Request, contexto: Contexto) => {
    const ruta = await leerRuta(contexto);
    if (!ruta) return noEncontrado();

    const cuerpo = await solicitud.json().catch(() => null);
    const lectura = interpretarOrganizacion(ruta.tipo, cuerpo);

    if (!lectura.valida) {
      return Response.json({ errores: lectura.errores }, { status: 422, headers: sinCache });
    }

    try {
      const resultado = await crearServicioOrganizaciones().editar(ruta.id, lectura.entrada);

      if (resultado.tipo === "invalida") {
        return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
      }
      if (resultado.tipo === "no_encontrada") return noEncontrado();

      return Response.json({ id: resultado.id }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo guardar el registro. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);

/** Elimina una asociación o un club que no organice eventos. */
export const DELETE = protegerRuta(
  [ROLES.administrador],
  async (_usuario, _solicitud: Request, contexto: Contexto) => {
    const ruta = await leerRuta(contexto);
    if (!ruta) return noEncontrado();

    try {
      const resultado = await crearServicioOrganizaciones().eliminar(ruta.tipo, ruta.id);

      if (resultado.tipo === "no_encontrada") return noEncontrado();
      if (resultado.tipo === "no_permitida") {
        return Response.json({ mensaje: resultado.mensaje }, { status: 409, headers: sinCache });
      }

      return Response.json({ eliminada: true }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo eliminar el registro. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
