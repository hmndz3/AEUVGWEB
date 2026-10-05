import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioOrganizaciones } from "@/lib/organizaciones/crear-servicio-organizaciones";
import {
  interpretarOrganizacion,
  interpretarTipoOrganizacion,
} from "@/validators/organizacion-admin";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ tipo: string }> };

const sinCache = { "Cache-Control": "no-store" };

const MENSAJE_BASE =
  "No se pudo guardar el registro. Revisa que la base de datos esté disponible y con las migraciones aplicadas.";

/** Crea una asociación o un club. El tipo viaja en la dirección. */
export const POST = protegerRuta(
  [ROLES.administrador],
  async (_usuario, solicitud: Request, contexto: Contexto) => {
    const tipo = interpretarTipoOrganizacion((await contexto.params).tipo);

    if (!tipo) {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }

    const cuerpo = await solicitud.json().catch(() => null);
    const lectura = interpretarOrganizacion(tipo, cuerpo);

    if (!lectura.valida) {
      return Response.json({ errores: lectura.errores }, { status: 422, headers: sinCache });
    }

    try {
      const resultado = await crearServicioOrganizaciones().crear(lectura.entrada);

      if (resultado.tipo === "invalida") {
        return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
      }
      if (resultado.tipo === "no_encontrada") {
        return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
      }

      return Response.json({ id: resultado.id }, { status: 201, headers: sinCache });
    } catch {
      // Sin este manejo, un fallo de la base respondía con un error genérico del
      // framework y en el formulario parecía que el botón no hacía nada.
      return Response.json({ mensaje: MENSAJE_BASE }, { status: 503, headers: sinCache });
    }
  }
);
