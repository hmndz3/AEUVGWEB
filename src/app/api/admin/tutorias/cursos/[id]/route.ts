import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioCursos } from "@/lib/tutorias/crear-servicios-tutorias";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaCursoAdmin } from "@/validators/tutoria";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

const noEncontrado = () =>
  Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });

async function interpretarId(contexto: Contexto): Promise<number | null> {
  const id = Number((await contexto.params).id);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Cambia el código, el nombre o el estado de un curso del catálogo. */
export const PATCH = protegerRuta(
  [ROLES.administrador],
  async (_usuario, solicitud: Request, contexto: Contexto) => {
    const id = await interpretarId(contexto);
    if (id === null) return noEncontrado();

    const cuerpo = await solicitud.json().catch(() => null);
    const validacion = esquemaCursoAdmin.safeParse(cuerpo);

    if (!validacion.success) {
      return Response.json(
        { errores: erroresPorCampo(validacion.error) },
        { status: 422, headers: sinCache }
      );
    }

    try {
      const resultado = await crearServicioCursos().actualizar(id, validacion.data);

      if (resultado.tipo === "no_encontrado") return noEncontrado();
      if (resultado.tipo === "invalido") {
        return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
      }

      return Response.json({ idCurso: resultado.idCurso }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo guardar el curso. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);

/** Borra un curso que nadie usa todavía. Si ya tiene historial, se desactiva. */
export const DELETE = protegerRuta(
  [ROLES.administrador],
  async (_usuario, _solicitud: Request, contexto: Contexto) => {
    const id = await interpretarId(contexto);
    if (id === null) return noEncontrado();

    try {
      const resultado = await crearServicioCursos().eliminar(id);

      if (resultado.tipo === "no_encontrado") return noEncontrado();
      if (resultado.tipo === "en_uso") {
        return Response.json({ mensaje: resultado.mensaje }, { status: 409, headers: sinCache });
      }

      return new Response(null, { status: 204, headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo eliminar el curso. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
