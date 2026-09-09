import { obtenerPrisma } from "@/lib/prisma";
import { obtenerConfiguracionRegistro } from "@/lib/configuracion-registro";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { dominioInstitucional } = obtenerConfiguracionRegistro();
    const facultades = await obtenerPrisma().facultad.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: {
        idFacultad: true,
        nombre: true,
        carreras: {
          where: { activo: true },
          orderBy: { nombre: "asc" },
          select: { idCarrera: true, nombre: true },
        },
      },
    });

    return Response.json(
      { facultades, dominioInstitucional },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json(
      { mensaje: "No fue posible cargar los catálogos académicos." },
      { status: 503 }
    );
  }
}
