import { normalizarTexto } from "@/lib/busqueda-texto";
import { interpretarTipoActividad } from "@/lib/eventos/columnas-importacion";
import { claveDiaLocal, desdeCampoFechaHora } from "@/lib/eventos/formato-fechas";
import type { FilaCrudaEvento } from "@/lib/eventos/importacion-eventos";
import type { ErrorFilaImportacion, FilaOmitida } from "@/lib/importacion/reporte";
import { erroresPorCampo } from "@/validators/errores";
import {
  ETIQUETAS_CAMPO_EVENTO,
  esquemaEventoAdmin,
  type DatosEventoAdmin,
} from "@/validators/evento-admin";

/**
 * Catálogos contra los que se resuelven los nombres que trae la hoja.
 *
 * El archivo no puede pedir identificadores: quien lo llena escribe "Festival"
 * o "AEBIO", no el número de la fila de una tabla. Las claves van normalizadas
 * —sin acentos y en minúsculas— para que "Proyección" y "proyeccion" encuentren
 * la misma categoría.
 */
export type CatalogosEventos = {
  categorias: Map<string, number>;
  /** Nombres de las categorías tal como se escriben, para nombrarlas en los errores. */
  nombresCategorias: string[];
  /** Nombre y siglas de cada asociación activa apuntan al mismo identificador. */
  asociaciones: Map<string, number>;
  clubes: Map<string, number>;
};

/** Evento que ya existe en la plataforma, para no volver a crearlo. */
export type EventoExistente = { nombre: string; fechaInicio: Date };

export type ValidacionEventos = {
  validas: FilaValidaEvento[];
  errores: ErrorFilaImportacion[];
  repetidas: FilaOmitida[];
  total: number;
};

export type FilaValidaEvento = {
  fila: number;
  datos: DatosEventoAdmin;
  /** Enlace de la imagen tal como se escribió; se descarga al importar. */
  enlaceImagen: string;
};

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const FORMATO_HORA = /^\d{1,2}:\d{2}$/;

const MENSAJE_FECHA = "Escribe la fecha como 2026-10-09 o 09/10/2026.";
const MENSAJE_HORA = "Escribe la hora como 14:00.";

/**
 * Identifica un evento para saber si ya está creado.
 *
 * Es el nombre más el día de inicio: una actividad que se repite cada mes con
 * el mismo nombre son eventos distintos, y dos filas con el mismo nombre el
 * mismo día son la misma actividad cargada dos veces.
 */
export function claveDeEvento(nombre: string, fechaInicio: Date): string {
  return `${normalizarTexto(nombre)}|${claveDiaLocal(fechaInicio)}`;
}

/** Nombres de catálogo que se ofrecen cuando lo que trae la hoja no existe. */
function enumerar(opciones: Iterable<string>, maximo = 8): string {
  const lista = [...new Set(opciones)];
  const visibles = lista.slice(0, maximo).join(", ");

  return lista.length > maximo ? `${visibles}…` : visibles;
}

/**
 * Resuelve el organizador que escribió quien llenó la hoja.
 *
 * Se busca primero entre las asociaciones y los clubes registrados, por nombre
 * o por siglas. Lo que no corresponda a ninguno se guarda como unidad de UVG,
 * que es el campo libre que el panel ya usa para los organizadores que no son
 * ni asociación ni club (una facultad, la biblioteca, un departamento).
 */
function resolverOrganizador(
  texto: string,
  catalogos: CatalogosEventos
): { idAsociacion: number | ""; idClub: number | ""; unidadUvg: string } {
  const normalizado = normalizarTexto(texto);

  if (normalizado === "") return { idAsociacion: "", idClub: "", unidadUvg: "" };

  const idAsociacion = catalogos.asociaciones.get(normalizado);
  if (idAsociacion) return { idAsociacion, idClub: "", unidadUvg: "" };

  const idClub = catalogos.clubes.get(normalizado);
  if (idClub) return { idAsociacion: "", idClub, unidadUvg: "" };

  return { idAsociacion: "", idClub: "", unidadUvg: texto };
}

/**
 * Valida el archivo fila por fila sin escribir nada.
 *
 * Usa el mismo esquema que el formulario del panel, así que una fila del Excel
 * tiene que cumplir exactamente lo que se le exige a un evento creado a mano:
 * si mañana cambia la longitud mínima de la descripción, cambia en los dos
 * sitios a la vez.
 *
 * Además de lo que el esquema puede comprobar por sí solo, aquí se aplican las
 * dos reglas que pidió AEUVG: un evento que ya terminó no se crea, y un evento
 * que ya existe no se duplica. La segunda mira también las filas anteriores del
 * propio archivo, porque una hoja llenada entre varias personas repite
 * actividades.
 */
export function validarFilasDeEventos(
  filas: FilaCrudaEvento[],
  catalogos: CatalogosEventos,
  opciones: { ahora?: Date; existentes?: Iterable<string> } = {}
): ValidacionEventos {
  const ahora = opciones.ahora ?? new Date();
  const conocidas = new Set(opciones.existentes ?? []);

  const validas: FilaValidaEvento[] = [];
  const errores: ErrorFilaImportacion[] = [];
  const repetidas: FilaOmitida[] = [];

  for (const cruda of filas) {
    const referencia = cruda.nombre;
    const problema = (campo: string, mensaje: string) => {
      errores.push({ fila: cruda.fila, referencia, campo, mensaje });
    };

    const categoria = catalogos.categorias.get(normalizarTexto(cruda.categoria));
    if (!categoria) {
      problema(
        "Categoría",
        cruda.categoria === ""
          ? `Indica la categoría. Las disponibles son: ${enumerar(catalogos.nombresCategorias)}.`
          : `La categoría «${cruda.categoria}» no existe en la plataforma. Las disponibles son: ${enumerar(catalogos.nombresCategorias)}.`
      );
      continue;
    }

    const tipoActividad = interpretarTipoActividad(cruda.tipoActividad);
    if (!tipoActividad) {
      problema(
        "Tipo de actividad",
        `«${cruda.tipoActividad}» no es un tipo de actividad. Escribe Académica, Recreativa, Voluntariado u Otro.`
      );
      continue;
    }

    if (!FORMATO_FECHA.test(cruda.fechaInicio)) {
      problema("Inicio", MENSAJE_FECHA);
      continue;
    }

    // Lo normal es que el evento empiece y termine el mismo día.
    const fechaFin = cruda.fechaFin === "" ? cruda.fechaInicio : cruda.fechaFin;
    if (!FORMATO_FECHA.test(fechaFin)) {
      problema("Finalización", MENSAJE_FECHA);
      continue;
    }

    if (!FORMATO_HORA.test(cruda.horaInicio)) {
      problema("Inicio", MENSAJE_HORA);
      continue;
    }

    if (!FORMATO_HORA.test(cruda.horaFin)) {
      problema("Finalización", MENSAJE_HORA);
      continue;
    }

    const organizador = resolverOrganizador(cruda.organizador, catalogos);

    const resultado = esquemaEventoAdmin.safeParse({
      nombre: cruda.nombre,
      descripcion: cruda.descripcion,
      idCategoriaEvento: categoria,
      tipoActividad,
      // Las horas se interpretan en la zona de Guatemala, igual que las del
      // formulario: sin el desplazamiento explícito, un evento de las 3 de la
      // tarde podría guardarse con seis horas de diferencia.
      fechaInicio: desdeCampoFechaHora(`${cruda.fechaInicio}T${cruda.horaInicio}`),
      fechaFin: desdeCampoFechaHora(`${fechaFin}T${cruda.horaFin}`),
      ubicacion: cruda.ubicacion,
      cupo: cruda.cupo,
      informacionAdicional: cruda.informacionAdicional,
      imagenUrl: cruda.enlaceImagen,
      destacado: false,
      idAsociacion: organizador.idAsociacion,
      idClub: organizador.idClub,
      unidadUvg: organizador.unidadUvg,
    });

    if (!resultado.success) {
      const porCampo = erroresPorCampo(resultado.error);
      const [campo, mensaje] = Object.entries(porCampo)[0];
      problema(ETIQUETAS_CAMPO_EVENTO[campo] ?? campo, mensaje);
      continue;
    }

    if (resultado.data.fechaFin.getTime() < ahora.getTime()) {
      problema(
        "Finalización",
        "El evento ya terminó, así que no se publica. Corrige la fecha si todavía no ocurre."
      );
      continue;
    }

    const clave = claveDeEvento(resultado.data.nombre, resultado.data.fechaInicio);

    if (conocidas.has(clave)) {
      repetidas.push({
        fila: cruda.fila,
        referencia,
        mensaje: "Ya existe un evento con ese nombre en esa fecha, así que no se creó otro.",
      });
      continue;
    }

    conocidas.add(clave);
    validas.push({
      fila: cruda.fila,
      datos: resultado.data,
      enlaceImagen: resultado.data.imagenUrl ?? "",
    });
  }

  return { validas, errores, repetidas, total: filas.length };
}
