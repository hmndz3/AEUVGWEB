import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { generarPlantilla, NOMBRE_PLANTILLA } from "@/lib/horas-beca/plantilla-importacion";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/**
 * Descarga la plantilla de Excel para cargar registros de horas beca.
 *
 * Se genera en cada descarga en lugar de guardarse como archivo del proyecto:
 * así siempre sale con las columnas que el importador espera en ese momento.
 */
export const GET = protegerRuta([ROLES.administrador], async () => {
  try {
    const contenido = await generarPlantilla();

    return new Response(contenido as BodyInit, {
      headers: {
        ...sinCache,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${NOMBRE_PLANTILLA}"`,
      },
    });
  } catch {
    return Response.json(
      { mensaje: "No se pudo generar la plantilla. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
