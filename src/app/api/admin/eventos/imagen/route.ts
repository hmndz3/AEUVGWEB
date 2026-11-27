import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { obtenerProveedorImagenes } from "@/lib/imagenes/proveedor-imagenes";
import { validarContenidoImagen, validarImagen } from "@/lib/imagenes/validacion-imagen";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/**
 * Sube la imagen de un evento y devuelve su dirección definitiva.
 *
 * La subida pasa por el servidor y no directamente al proveedor porque la
 * clave del servicio no puede salir al navegador, y porque así el formato y el
 * tamaño se comprueban antes de gastar la cuota del plan contratado.
 */
export const POST = protegerRuta([ROLES.administrador], async (_usuario, solicitud: Request) => {
  const proveedor = obtenerProveedorImagenes();

  if (!proveedor) {
    return Response.json(
      {
        mensaje:
          "La subida de imágenes no está configurada en este ambiente. Pega la dirección de una imagen externa.",
      },
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
    // Se registra el motivo: sin esto, un fallo de permisos o de cuota del
    // almacenamiento solo se veía como un mensaje genérico en el formulario.
    console.error(
      "Fallo al subir la imagen de un evento:",
      error instanceof Error ? error.message : error
    );

    return Response.json(
      { mensaje: "No se pudo subir la imagen. Intenta de nuevo en unos minutos." },
      { status: 502, headers: sinCache }
    );
  }
});
