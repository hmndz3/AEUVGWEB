import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { respuestaDePlantilla, sinCache } from "@/lib/importacion/solicitud-archivo";
import { generarPlantillaCursos, NOMBRE_PLANTILLA_CURSOS } from "@/lib/tutorias/plantilla-cursos";

export const runtime = "nodejs";

/** Descarga la plantilla de Excel del catálogo de cursos. */
export const GET = protegerRuta([ROLES.administrador], async () => {
  try {
    return respuestaDePlantilla(await generarPlantillaCursos(), NOMBRE_PLANTILLA_CURSOS);
  } catch {
    return Response.json(
      { mensaje: "No se pudo generar la plantilla. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
