import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioCursos } from "@/lib/tutorias/crear-servicios-tutorias";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaCursoAdmin } from "@/validators/tutoria";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/** Agrega un curso al catálogo que se ofrece en la postulación para ser tutor. */
export const POST = protegerRuta([ROLES.administrador], async (_usuario, solicitud: Request) => {
  const cuerpo = await solicitud.json().catch(() => null);
  const validacion = esquemaCursoAdmin.safeParse(cuerpo);

  if (!validacion.success) {
    return Response.json(
      { errores: erroresPorCampo(validacion.error) },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioCursos().crear(validacion.data);

    if (resultado.tipo === "invalido") {
      return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
    }
    if (resultado.tipo === "no_encontrado") {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }

    return Response.json({ idCurso: resultado.idCurso }, { status: 201, headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudo guardar el curso. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
