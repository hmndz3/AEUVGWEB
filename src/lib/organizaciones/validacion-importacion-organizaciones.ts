import { normalizarTexto } from "@/lib/busqueda-texto";
import type { ErrorFilaImportacion, FilaOmitida } from "@/lib/importacion/reporte";
import { COLUMNAS_REDES } from "@/lib/organizaciones/columnas-importacion";
import type { FilaCrudaOrganizacion } from "@/lib/organizaciones/importacion-organizaciones";
import {
  ETIQUETA_TIPO,
  esquemaRedSocialAdmin,
  etiquetasDeCampo,
  interpretarOrganizacion,
  type DatosRedSocialAdmin,
  type EntradaOrganizacion,
  type TipoOrganizacion,
} from "@/validators/organizacion-admin";

/** Nombres y siglas que ya existen en la plataforma, normalizados. */
export type RegistradosOrganizacion = {
  nombres: Iterable<string>;
  siglas: Iterable<string>;
};

export type FilaValidaOrganizacion = {
  fila: number;
  entrada: EntradaOrganizacion;
  /** Enlace de la imagen tal como se escribió; se descarga al importar. */
  enlaceImagen: string;
  redes: DatosRedSocialAdmin[];
};

export type ValidacionOrganizaciones = {
  validas: FilaValidaOrganizacion[];
  errores: ErrorFilaImportacion[];
  repetidas: FilaOmitida[];
  total: number;
};

/** Campos de la ficha que corresponden al tipo que se está cargando. */
function cuerpoDeFila(
  cruda: FilaCrudaOrganizacion,
  tipo: TipoOrganizacion
): Record<string, string> {
  const comunes = {
    nombre: cruda.nombre,
    descripcion: cruda.descripcion,
    correo: cruda.correo,
    telefono: cruda.telefono,
    informacionContacto: cruda.informacionContacto,
    imagenUrl: cruda.enlaceImagen,
  };

  return tipo === "asociaciones"
    ? { ...comunes, siglas: cruda.siglas, mision: cruda.mision, vision: cruda.vision }
    : { ...comunes, actividades: cruda.actividades };
}

/** Redes sociales que trae la fila, con su plataforma. */
function redesDeFila(cruda: FilaCrudaOrganizacion): { plataforma: string; url: string }[] {
  const valores: Record<string, string> = {
    Instagram: cruda.instagram,
    Facebook: cruda.facebook,
    "Sitio web": cruda.sitioWeb,
  };

  return COLUMNAS_REDES.filter((red) => (valores[red.columna] ?? "") !== "").map((red) => ({
    plataforma: red.plataforma,
    url: valores[red.columna],
  }));
}

/**
 * Valida el archivo fila por fila sin escribir nada.
 *
 * Usa los mismos esquemas que el formulario del panel, así que una fila del
 * Excel tiene que cumplir lo mismo que una ficha creada a mano: nombre de al
 * menos tres caracteres, siglas en las asociaciones y al menos un medio de
 * contacto.
 *
 * Una fila cuyo nombre o cuyas siglas ya existen no se vuelve a crear. Se mira
 * también contra las filas anteriores del propio archivo, porque dos
 * organizadores pueden haber escrito el mismo club en la hoja compartida.
 */
export function validarFilasDeOrganizaciones(
  filas: FilaCrudaOrganizacion[],
  tipo: TipoOrganizacion,
  registrados: RegistradosOrganizacion = { nombres: [], siglas: [] }
): ValidacionOrganizaciones {
  const nombres = new Set([...registrados.nombres]);
  const siglas = new Set([...registrados.siglas]);
  const etiquetas = etiquetasDeCampo(tipo);
  // El género del registro cambia el artículo del mensaje: "una asociación"
  // pero "un club". Armarlo con plantillas evita leer "una club".
  const { singular } = ETIQUETA_TIPO[tipo];
  const esFemenino = tipo === "asociaciones";
  const yaExiste = `Ya existe ${esFemenino ? "una" : "un"} ${singular}`;
  const noSeCreo = `así que no se creó ${esFemenino ? "otra" : "otro"}.`;

  const validas: FilaValidaOrganizacion[] = [];
  const errores: ErrorFilaImportacion[] = [];
  const repetidas: FilaOmitida[] = [];

  for (const cruda of filas) {
    const referencia = cruda.nombre;
    const lectura = interpretarOrganizacion(tipo, cuerpoDeFila(cruda, tipo));

    if (!lectura.valida) {
      const [campo, mensaje] = Object.entries(lectura.errores)[0];
      errores.push({
        fila: cruda.fila,
        referencia,
        campo: etiquetas[campo] ?? campo,
        mensaje,
      });
      continue;
    }

    const redes: DatosRedSocialAdmin[] = [];
    let redInvalida: ErrorFilaImportacion | null = null;

    for (const red of redesDeFila(cruda)) {
      const resultado = esquemaRedSocialAdmin.safeParse(red);

      if (!resultado.success) {
        redInvalida = {
          fila: cruda.fila,
          referencia,
          campo: red.plataforma,
          mensaje: "Escribe el enlace completo, empezando con https://.",
        };
        break;
      }

      redes.push(resultado.data);
    }

    if (redInvalida) {
      errores.push(redInvalida);
      continue;
    }

    const nombre = normalizarTexto(lectura.entrada.datos.nombre);
    if (nombres.has(nombre)) {
      repetidas.push({
        fila: cruda.fila,
        referencia,
        mensaje: `${yaExiste} con ese nombre, ${noSeCreo}`,
      });
      continue;
    }

    const abreviatura =
      lectura.entrada.tipo === "asociaciones"
        ? normalizarTexto(lectura.entrada.datos.siglas)
        : null;

    if (abreviatura !== null && siglas.has(abreviatura)) {
      repetidas.push({
        fila: cruda.fila,
        referencia,
        mensaje: `${yaExiste} con las siglas «${cruda.siglas}», ${noSeCreo}`,
      });
      continue;
    }

    nombres.add(nombre);
    if (abreviatura !== null) siglas.add(abreviatura);

    validas.push({
      fila: cruda.fila,
      entrada: lectura.entrada,
      enlaceImagen: lectura.entrada.datos.imagenUrl ?? "",
      redes,
    });
  }

  return { validas, errores, repetidas, total: filas.length };
}
