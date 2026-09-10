import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { obtenerPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** Indicadores del panel administrativo. Solo accesible para administradores. */
export const GET = protegerRuta([ROLES.administrador], async () => {
  const prisma = obtenerPrisma();

  const [estudiantes, eventosPublicados, horasPendientes, postulacionesPendientes] =
    await Promise.all([
      prisma.estudiante.count({ where: { activo: true } }),
      prisma.evento.count({ where: { estado: "PUBLICADO" } }),
      prisma.registroHoraBeca.count({ where: { estado: "PENDIENTE" } }),
      prisma.postulacionTutor.count({ where: { estado: "PENDIENTE" } }),
    ]);

  return Response.json(
    { estudiantes, eventosPublicados, horasPendientes, postulacionesPendientes },
    { headers: { "Cache-Control": "no-store" } }
  );
});
