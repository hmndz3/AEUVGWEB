import {
  Tabla,
  TablaCelda,
  TablaCeldaEncabezado,
  TablaCuerpo,
  TablaEncabezado,
  TablaFila,
} from "@/components/ui/tabla";
import type { EntradaListaNegra } from "@/lib/prestamo-batas/consultas-prestamo-batas";

/** Lista negra del salón: quienes no devolvieron una bata o la devolvieron con un problema. */
export function TablaListaNegra({ entradas }: { entradas: EntradaListaNegra[] }) {
  if (entradas.length === 0) {
    return (
      <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-10 text-center text-sm">
        La lista negra está vacía.
      </div>
    );
  }

  return (
    <Tabla>
      <TablaEncabezado>
        <tr>
          <TablaCeldaEncabezado>Persona</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Contacto</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Fecha</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Justificación</TablaCeldaEncabezado>
        </tr>
      </TablaEncabezado>
      <TablaCuerpo>
        {entradas.map((entrada) => (
          <TablaFila key={entrada.idListaNegra}>
            <TablaCelda>
              <p className="text-texto font-semibold">
                {entrada.nombre}
                {entrada.apellido ? ` ${entrada.apellido}` : ""}
              </p>
              {entrada.carnet && <p className="text-texto-suave text-xs">{entrada.carnet}</p>}
            </TablaCelda>
            <TablaCelda className="text-texto-suave text-xs">
              {entrada.correo && <p>{entrada.correo}</p>}
              {entrada.telefono && <p>{entrada.telefono}</p>}
              {!entrada.correo && !entrada.telefono && "—"}
            </TablaCelda>
            <TablaCelda className="text-texto-suave text-xs whitespace-nowrap">
              {entrada.fecha ?? "—"}
            </TablaCelda>
            <TablaCelda className="text-texto-suave max-w-md text-sm">
              {entrada.justificacion}
            </TablaCelda>
          </TablaFila>
        ))}
      </TablaCuerpo>
    </Tabla>
  );
}
