import { describirArticulo } from "@/lib/prestamo-batas/formato-prestamo-batas";
import type {
  DatosArticuloPersistido,
  RepositorioInventario,
} from "@/lib/prestamo-batas/repositorio-inventario";
import type { DatosArticuloInventario } from "@/validators/prestamo-batas";

export type ResultadoCreacionArticulo =
  { tipo: "guardado"; idArticulo: number } | { tipo: "invalido"; errores: Record<string, string> };

export type ResultadoArticulo = ResultadoCreacionArticulo | { tipo: "no_encontrado" };

export type ResultadoEliminacion =
  { tipo: "eliminado" } | { tipo: "con_prestamos" } | { tipo: "no_encontrado" };

/**
 * Inventario de batas y lentes que AEUVG presta.
 *
 * Sigue la separación entre servicio y repositorio del resto del proyecto: las
 * reglas viven aquí y se prueban sin base de datos. Las propias de este módulo
 * son dos. No puede haber dos artículos del mismo tipo y talla —ni dos filas de
 * lentes, que no llevan talla— porque la disponibilidad que ve el estudiante se
 * repartiría entre filas duplicadas. Y el total no puede quedar por debajo de lo
 * que ya está prestado, que dejaría la disponibilidad en negativo.
 */
export class ServicioInventario {
  constructor(private readonly repositorio: RepositorioInventario) {}

  private async validar(
    datos: DatosArticuloInventario,
    idArticulo?: number
  ): Promise<Record<string, string> | null> {
    const talla = datos.tipo === "LENTES" ? null : datos.talla;

    if (await this.repositorio.existeTipoTalla(datos.tipo, talla, idArticulo)) {
      return {
        general: `Ya existe un registro de ${describirArticulo(datos.tipo, talla)} en el inventario. Edítalo en lugar de crear otro.`,
      };
    }

    if (idArticulo !== undefined) {
      const prestada = await this.repositorio.cantidadPrestadaDe(idArticulo);
      if (datos.cantidadTotal < prestada) {
        return {
          cantidadTotal: `Hay ${prestada} prestadas sin devolver: la cantidad total no puede ser menor.`,
        };
      }
    }

    return null;
  }

  async crear(datos: DatosArticuloInventario): Promise<ResultadoCreacionArticulo> {
    const errores = await this.validar(datos);
    if (errores) return { tipo: "invalido", errores };

    const idArticulo = await this.repositorio.crear(this.persistir(datos));

    return { tipo: "guardado", idArticulo };
  }

  async editar(idArticulo: number, datos: DatosArticuloInventario): Promise<ResultadoArticulo> {
    const errores = await this.validar(datos, idArticulo);
    if (errores) return { tipo: "invalido", errores };

    const actualizado = await this.repositorio.actualizar(idArticulo, this.persistir(datos));

    return actualizado ? { tipo: "guardado", idArticulo } : { tipo: "no_encontrado" };
  }

  async eliminar(idArticulo: number): Promise<ResultadoEliminacion> {
    return this.repositorio.eliminar(idArticulo);
  }

  private persistir(datos: DatosArticuloInventario): DatosArticuloPersistido {
    return {
      tipo: datos.tipo,
      // Los lentes nunca guardan talla, aunque el formulario llegara con una.
      talla: datos.tipo === "LENTES" ? null : datos.talla,
      cantidadTotal: datos.cantidadTotal,
      activo: datos.activo,
    };
  }
}
