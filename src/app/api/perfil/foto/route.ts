import { protegerRuta } from "@/lib/auth/guardias";
import { esImagenDelSitio } from "@/lib/imagenes/validacion-imagen";
import { obtenerPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/**
 * Guarda o quita la fotografía de perfil del estudiante de la sesión.
 *
 * Solo se admite una imagen servida por la propia plataforma: la dirección
 * llega del endpoint de subida, que ya comprobó el formato y el tamaño.
 * Aceptar una dirección externa dejaría al sitio cargando imágenes de
 * cualquier parte, y la foto se ve en el directorio público de tutores.
 */
export const PUT = protegerRuta([], async (usuario, solicitud: Request) => {
  const cuerpo = (await solicitud.json().catch(() => null)) as { fotoUrl?: unknown } | null;
  const valor = typeof cuerpo?.fotoUrl === "string" ? cuerpo.fotoUrl.trim() : "";

  // La cadena vacía quita la foto: es la forma de volver a las iniciales.
  if (valor !== "" && !esImagenDelSitio(valor)) {
    return Response.json(
      { mensaje: "La fotografía debe subirse desde esta pantalla." },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const { count } = await obtenerPrisma().estudiante.updateMany({
      where: { usuario: { idUsuario: usuario.idUsuario } },
      data: { fotoUrl: valor === "" ? null : valor },
    });

    if (count === 0) {
      return Response.json(
        { mensaje: "Tu cuenta no tiene una ficha de estudiante asociada." },
        { status: 409, headers: sinCache }
      );
    }

    return Response.json({ fotoUrl: valor === "" ? null : valor }, { headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudo guardar la fotografía. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
