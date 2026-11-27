import { protegerRuta } from "@/lib/auth/guardias";
import { obtenerProveedorImagenes } from "@/lib/imagenes/proveedor-imagenes";
import { validarContenidoImagen, validarImagen } from "@/lib/imagenes/validacion-imagen";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/**
 * Sube una imagen del estudiante de la sesión y devuelve su dirección.
 *
 * Existe aparte de la de eventos porque esa exige el rol de administrador, y
 * aquí quien sube es el propio estudiante: el comprobante de su postulación a
 * tutor y su fotografía de perfil. La protección es de sesión y no de rol.
 *
 * La subida pasa por el servidor, igual que la de eventos, para comprobar el
 * formato y el tamaño antes de escribir nada y para no sacar al navegador las
 * credenciales del almacenamiento.
 */
export const POST = protegerRuta([], async (_usuario, solicitud: Request) => {
  const proveedor = obtenerProveedorImagenes();

  if (!proveedor) {
    return Response.json(
      { mensaje: "La subida de imágenes no está configurada en este ambiente." },
      { status: 503, headers: sinCache }
    );
  }

  const formulario = await solicitud.formData().catch(() => null);
  const archivo = formulario?.get("imagen");

  if (!(archivo instanceof File)) {
    return Response.json({ mensaje: "Adjunta una imagen." }, { status: 422, headers: sinCache });
  }

  const validacion = validarImagen({ tipo: archivo.type, tamano: archivo.size });

  if (!validacion.valida) {
    return Response.json({ mensaje: validacion.mensaje }, { status: 422, headers: sinCache });
  }

  // El tipo que declara quien sube es solo una afirmación suya: lo que decide
  // es el contenido. Sin esto, un archivo cualquiera con el encabezado de una
  // imagen acabaría guardado y servido por el propio dominio.
  const contenido = await archivo.arrayBuffer();
  const contenidoValido = validarContenidoImagen(Buffer.from(contenido));

  if (!contenidoValido.valida) {
    return Response.json({ mensaje: contenidoValido.mensaje }, { status: 422, headers: sinCache });
  }

  try {
    const url = await proveedor.subir({
      nombre: archivo.name,
      tipo: contenidoValido.tipo,
      contenido,
    });

    return Response.json({ url }, { headers: sinCache });
  } catch (error) {
    console.error(
      "Fallo al subir una imagen del estudiante:",
      error instanceof Error ? error.message : error
    );

    return Response.json(
      { mensaje: "No se pudo subir la imagen. Intenta de nuevo en unos minutos." },
      { status: 502, headers: sinCache }
    );
  }
});
