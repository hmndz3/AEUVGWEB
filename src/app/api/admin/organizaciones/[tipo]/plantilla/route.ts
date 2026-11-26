import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { respuestaDePlantilla, sinCache } from "@/lib/importacion/solicitud-archivo";
import {
  generarPlantillaOrganizaciones,
  nombrePlantillaOrganizaciones,
} from "@/lib/organizaciones/plantilla-organizaciones";
import { interpretarTipoOrganizacion } from "@/validators/organizacion-admin";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ tipo: string }> };

/**
 * Descarga la plantilla de Excel de asociaciones o de clubes. El tipo viaja en
 * la dirección, igual que en el resto de los endpoints de la sección.
 */
export const GET = protegerRuta(
  [ROLES.administrador],
  async (_usuario, _solicitud: Request, contexto: Contexto) => {
    const tipo = interpretarTipoOrganizacion((await contexto.params).tipo);

    if (!tipo) {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }

    try {
      return respuestaDePlantilla(
        await generarPlantillaOrganizaciones(tipo),
        nombrePlantillaOrganizaciones(tipo)
      );
    } catch {
      return Response.json(
        { mensaje: "No se pudo generar la plantilla. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
