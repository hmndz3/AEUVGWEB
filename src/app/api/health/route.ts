import { obtenerPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    await obtenerPrisma().$queryRaw`SELECT 1`;

    return Response.json({ estado: "ok", baseDatos: "conectada" });
  } catch {
    // El detalle del error puede exponer la cadena de conexión, así que no se
    // devuelve al cliente.
    return Response.json({ estado: "error", baseDatos: "sin conexion" }, { status: 503 });
  }
}
