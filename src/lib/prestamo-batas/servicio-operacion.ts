import { aFechaDeCalendario, describirArticulo } from "@/lib/prestamo-batas/formato-prestamo-batas";
import type { RepositorioOperacion } from "@/lib/prestamo-batas/repositorio-operacion";
import { aHoraDeBase } from "@/lib/tutorias/formato-tutorias";
import type { DatosDevolucion, DatosListaNegra, DatosPrestamo } from "@/validators/prestamo-batas";

export type ResultadoPrestamo =
  { tipo: "guardado"; idPrestamo: number } | { tipo: "invalido"; errores: Record<string, string> };

export type ResultadoDevolucion =
  { tipo: "devuelto" } | { tipo: "no_encontrado" } | { tipo: "ya_devuelto" };

export type ResultadoListaNegra =
  | { tipo: "guardado"; idListaNegra: number }
  | { tipo: "invalido"; errores: Record<string, string> };

/**
 * Lo que se responde cuando el voluntario ya cerró su turno.
 *
 * Al enviar el comprobante el salón deja de estar a su nombre por ese día, así
 * que la pantalla le quita los formularios. Esto es lo mismo del lado del
 * servidor, para que el cierre valga aunque alguien mande la petición a mano.
 */
const MENSAJE_TURNO_CERRADO =
  "Ya cerraste tu turno de hoy, así que no puedes seguir registrando en él.";

/** Día de calendario de hoy en Guatemala, que es con el que se guardan las fechas. */
const diaGuatemala = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "America/Guatemala",
});

/**
 * Operación diaria del salón: préstamos, devoluciones y lista negra.
 *
 * Es lo que registra el voluntario durante su turno. La regla propia es que un
 * préstamo nunca saca más unidades de las disponibles —el total del inventario
 * menos lo que ya está prestado sin devolver—, de modo que la disponibilidad que
 * ve el estudiantado siempre cuadre con lo que de verdad hay en el salón.
 */
export class ServicioOperacion {
  constructor(
    private readonly repositorio: RepositorioOperacion,
    private readonly ahora: () => Date = () => new Date()
  ) {}

  async registrarPrestamo(datos: DatosPrestamo, registradoPor: number): Promise<ResultadoPrestamo> {
    if (await this.turnoCerrado(registradoPor)) {
      return { tipo: "invalido", errores: { turno: MENSAJE_TURNO_CERRADO } };
    }

    const articulos = new Map(
      (await this.repositorio.articulosParaPrestamo(datos.articulos.map((a) => a.idArticulo))).map(
        (articulo) => [articulo.idArticulo, articulo]
      )
    );

    for (const linea of datos.articulos) {
      const articulo = articulos.get(linea.idArticulo);
      if (!articulo || !articulo.activo) {
        return {
          tipo: "invalido",
          errores: { articulos: "Alguno de los artículos elegidos ya no está disponible." },
        };
      }

      const disponible = articulo.cantidadTotal - articulo.cantidadPrestada;
      if (linea.cantidad > disponible) {
        const nombre = describirArticulo(articulo.tipo, articulo.talla);
        return {
          tipo: "invalido",
          errores: {
            articulos:
              disponible <= 0
                ? `No hay ${nombre} disponibles para prestar.`
                : `Solo ${disponible === 1 ? "queda 1" : `quedan ${disponible}`} de ${nombre}.`,
          },
        };
      }
    }

    const idPrestamo = await this.repositorio.crearPrestamo(
      {
        nombre: datos.nombre,
        apellido: datos.apellido,
        carnet: datos.carnet,
        correo: datos.correo,
        telefono: datos.telefono,
        fechaPrestamo: aFechaDeCalendario(datos.fechaPrestamo),
        horaSalida: aHoraDeBase(datos.horaSalida),
        horaEntregaEstimada: datos.horaEntregaEstimada
          ? aHoraDeBase(datos.horaEntregaEstimada)
          : null,
        comentarios: datos.comentarios,
        articulos: datos.articulos,
      },
      registradoPor
    );

    return { tipo: "guardado", idPrestamo };
  }

  async devolver(idPrestamo: number, datos: DatosDevolucion): Promise<ResultadoDevolucion> {
    const aplicado = await this.repositorio.marcarDevuelto(
      idPrestamo,
      datos.comentarios,
      this.ahora()
    );

    // El repositorio devuelve false tanto si no existe como si ya estaba
    // devuelto; para el panel es lo mismo: el préstamo ya no está prestado.
    return aplicado ? { tipo: "devuelto" } : { tipo: "no_encontrado" };
  }

  async agregarListaNegra(
    datos: DatosListaNegra,
    registradoPor: number
  ): Promise<ResultadoListaNegra> {
    if (await this.turnoCerrado(registradoPor)) {
      return { tipo: "invalido", errores: { turno: MENSAJE_TURNO_CERRADO } };
    }

    const idListaNegra = await this.repositorio.crearListaNegra(
      {
        fecha: datos.fecha ? aFechaDeCalendario(datos.fecha) : null,
        nombre: datos.nombre,
        apellido: datos.apellido,
        correo: datos.correo,
        carnet: datos.carnet,
        telefono: datos.telefono,
        justificacion: datos.justificacion,
      },
      registradoPor
    );

    return { tipo: "guardado", idListaNegra };
  }

  /** El voluntario ya envió el comprobante de hoy, así que su turno terminó. */
  private async turnoCerrado(registradoPor: number): Promise<boolean> {
    return this.repositorio.turnoCerrado(registradoPor, diaGuatemala.format(this.ahora()));
  }
}
