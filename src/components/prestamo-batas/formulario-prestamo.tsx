"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { EtiquetaCampo, NotaCamposObligatorios } from "@/components/ui/etiqueta-campo";
import { SelectorFecha } from "@/components/ui/selector-fecha";
import { SelectorHora } from "@/components/ui/selector-hora";
import type { ArticuloSelector } from "@/lib/prestamo-batas/consultas-prestamo-batas";

/** Día de hoy en Guatemala, en "YYYY-MM-DD", para el valor inicial de la fecha. */
function hoyIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guatemala" }).format(new Date());
}

/**
 * Registro de un préstamo por parte del voluntario.
 *
 * Los datos de la persona se escriben libres —como en el Excel— porque quien
 * presta puede no tener cuenta. Al guardar, el inventario descuenta lo prestado
 * y la tabla de préstamos se actualiza.
 */
export function FormularioPrestamo({ articulos }: { articulos: ArticuloSelector[] }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [carnet, setCarnet] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fecha, setFecha] = useState(hoyIso());
  const [horaSalida, setHoraSalida] = useState("");
  const [horaEntrega, setHoraEntrega] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  function cambiarCantidad(idArticulo: number, valor: number, maximo: number) {
    const cantidad = Math.max(0, Math.min(valor, maximo));
    setCantidades((previo) => ({ ...previo, [idArticulo]: cantidad }));
  }

  function limpiar() {
    setNombre("");
    setApellido("");
    setCarnet("");
    setCorreo("");
    setTelefono("");
    setHoraSalida("");
    setHoraEntrega("");
    setComentarios("");
    setCantidades({});
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    const seleccion = articulos
      .filter((articulo) => (cantidades[articulo.idArticulo] ?? 0) > 0)
      .map((articulo) => ({
        idArticulo: articulo.idArticulo,
        cantidad: cantidades[articulo.idArticulo],
      }));

    if (seleccion.length === 0) {
      setError("Elige al menos un artículo para prestar.");
      return;
    }
    if (!horaSalida) {
      setError("Indica la hora de salida.");
      return;
    }

    setEnviando(true);
    try {
      const respuesta = await fetch("/api/prestamo-batas/prestamos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          apellido,
          carnet,
          correo,
          telefono,
          fechaPrestamo: fecha,
          horaSalida,
          horaEntregaEstimada: horaEntrega || null,
          comentarios,
          articulos: seleccion,
        }),
      });

      if (respuesta.ok) {
        setExito(true);
        limpiar();
        router.refresh();
        return;
      }

      const cuerpo = (await respuesta.json().catch(() => ({}))) as {
        errores?: Record<string, string>;
        mensaje?: string;
      };
      setError(
        Object.values(cuerpo.errores ?? {})[0] ??
          cuerpo.mensaje ??
          "No se pudo registrar el préstamo."
      );
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <NotaCamposObligatorios />

      {exito && <Alerta tipo="exito">El préstamo quedó registrado.</Alerta>}
      {error && <Alerta tipo="error">{error}</Alerta>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Nombre"
          name="nombre"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <Campo
          etiqueta="Apellido"
          name="apellido"
          required
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
        />
        <Campo
          etiqueta="Carné"
          name="carnet"
          required
          value={carnet}
          onChange={(e) => setCarnet(e.target.value)}
        />
        <Campo
          etiqueta="Teléfono"
          name="telefono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
        <Campo
          etiqueta="Correo"
          name="correo"
          type="email"
          className="sm:col-span-2"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo obligatorio>Fecha</EtiquetaCampo>
          <SelectorFecha id="fecha-prestamo" valor={fecha} onCambiar={setFecha} />
        </div>
        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo htmlFor="hora-salida" obligatorio>
            Hora de salida
          </EtiquetaCampo>
          <SelectorHora id="hora-salida" valor={horaSalida} onCambiar={setHoraSalida} paso={5} />
        </div>
        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo htmlFor="hora-entrega">Entrega estimada</EtiquetaCampo>
          <SelectorHora id="hora-entrega" valor={horaEntrega} onCambiar={setHoraEntrega} paso={5} />
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-texto text-sm font-semibold">
          Artículos a prestar
          <span aria-hidden className="text-error ml-0.5 font-bold">
            *
          </span>
        </legend>
        <div className="border-borde divide-borde bg-superficie divide-y rounded-2xl border">
          {articulos.map((articulo) => {
            const agotado = articulo.disponible <= 0;
            return (
              <div
                key={articulo.idArticulo}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <div>
                  <p className="text-texto text-sm font-semibold">{articulo.descripcion}</p>
                  <p className="text-texto-suave text-xs">{articulo.disponible} disponibles</p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={articulo.disponible}
                  disabled={agotado}
                  value={cantidades[articulo.idArticulo] ?? 0}
                  onChange={(e) =>
                    cambiarCantidad(
                      articulo.idArticulo,
                      Number(e.target.value),
                      articulo.disponible
                    )
                  }
                  className="border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 h-10 w-20 rounded-xl border px-3 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
                  aria-label={`Cantidad de ${articulo.descripcion}`}
                />
              </div>
            );
          })}
          {articulos.length === 0 && (
            <p className="text-texto-suave px-4 py-4 text-sm">
              No hay artículos en el inventario todavía.
            </p>
          )}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <EtiquetaCampo htmlFor="comentarios-prestamo">Comentarios</EtiquetaCampo>
        <textarea
          id="comentarios-prestamo"
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Notas sobre el préstamo, por ejemplo una seña particular."
          className="border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </div>

      <div>
        <Boton type="submit" cargando={enviando}>
          Registrar préstamo
        </Boton>
      </div>
    </form>
  );
}
