import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { generarPlantillaEventos, NOMBRE_PLANTILLA_EVENTOS } from "@/lib/eventos/plantilla-eventos";
import { RepositorioImportacionEventosPrisma } from "@/lib/eventos/repositorio-importacion-eventos";
import { respuestaDePlantilla, sinCache } from "@/lib/importacion/solicitud-archivo";

export const runtime = "nodejs";

/**
 * Descarga la plantilla de Excel para cargar eventos.
 *
 * Se genera en cada descarga y no se guarda como archivo del proyecto porque
 * lleva adentro los catálogos de la plataforma: las categorías y los grupos que
 * existen hoy, como listas desplegables. Una plantilla fija se desactualizaría
 * en cuanto AEUVG agregara una categoría.
 */
export const GET = protegerRuta([ROLES.administrador], async () => {
  try {
    const listas = await new RepositorioImportacionEventosPrisma().listas();

    return respuestaDePlantilla(await generarPlantillaEventos(listas), NOMBRE_PLANTILLA_EVENTOS);
  } catch {
    return Response.json(
      { mensaje: "No se pudo generar la plantilla. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
