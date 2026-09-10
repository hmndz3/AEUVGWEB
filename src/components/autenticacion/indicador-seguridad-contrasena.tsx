import { Icono } from "@/components/autenticacion/icono";
import { evaluarSeguridadContrasena } from "@/lib/seguridad-contrasena";

export function IndicadorSeguridadContrasena({ contrasena }: { contrasena: string }) {
  const seguridad = evaluarSeguridadContrasena(contrasena);
  const barrasActivas =
    seguridad.puntaje === 0 ? 0 : seguridad.puntaje <= 1 ? 1 : seguridad.puntaje <= 3 ? 2 : 3;
  const color = {
    "Sin evaluar": "bg-borde",
    Baja: "bg-error",
    Media: "bg-ambar",
    Alta: "bg-turquesa",
  }[seguridad.nivel];
  const colorTexto = {
    "Sin evaluar": "text-texto-suave",
    Baja: "text-error",
    Media: "text-ambar",
    Alta: "text-turquesa",
  }[seguridad.nivel];

  return (
    <div className="bg-superficie-suave rounded-xl p-3" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((barra) => (
          <span
            key={barra}
            className={`${barra < barrasActivas ? color : "bg-borde"} h-1.5 flex-1 rounded-full transition-colors`}
          />
        ))}
      </div>
      <p className="text-texto-suave mt-2 flex items-center gap-1.5 text-xs">
        <Icono nombre="escudo" className={`${colorTexto} size-4`} /> Nivel de seguridad:
        <strong className={colorTexto}>{seguridad.nivel}</strong>
        <span>({seguridad.mensaje})</span>
      </p>
    </div>
  );
}
