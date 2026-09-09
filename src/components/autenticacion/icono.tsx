import { cn } from "@/lib/utils";

type NombreIcono =
  | "at"
  | "calendario"
  | "candado"
  | "chevron"
  | "edificio"
  | "escudo"
  | "flecha"
  | "flechaAtras"
  | "graduacion"
  | "id"
  | "informacion"
  | "ojo"
  | "personas"
  | "persona"
  | "verificado";

type PropsIcono = {
  nombre: NombreIcono;
  className?: string;
};

const TRAZOS: Record<NombreIcono, React.ReactNode> = {
  at: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M16 8.75v4.1a2.1 2.1 0 0 0 4.2 0V12a8.2 8.2 0 1 1-2.5-5.9" />
    </>
  ),
  calendario: (
    <>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
      <path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17M8 14h.01M12 14h.01M16 14h.01" />
    </>
  ),
  candado: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
    </>
  ),
  chevron: <path d="m7.5 9 4.5 4.5L16.5 9" />,
  edificio: (
    <>
      <path d="M3.5 20.5h17M5.5 20.5v-12L12 4l6.5 4.5v12" />
      <path d="M9 20.5v-3h6v3M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14h.01M12 14h.01M15.5 14h.01" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 3.5 19 6v5c0 4.5-3 7.5-7 9.5-4-2-7-5-7-9.5V6l7-2.5Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  flecha: <path d="M5 12h14m-5-5 5 5-5 5" />,
  flechaAtras: <path d="M19 12H5m5 5-5-5 5-5" />,
  graduacion: (
    <>
      <path d="m3 9 9-4 9 4-9 4-9-4Z" />
      <path d="M7 11.2V16c2.8 1.8 7.2 1.8 10 0v-4.8M21 9v5" />
    </>
  ),
  id: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="8.5" cy="11" r="2" />
      <path d="M5.8 16c.8-1.8 4.6-1.8 5.4 0M13.5 10h4M13.5 14h4" />
    </>
  ),
  informacion: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 10.5v5M12 7.5h.01" />
    </>
  ),
  ojo: (
    <>
      <path d="M3.5 12s3-5 8.5-5 8.5 5 8.5 5-3 5-8.5 5-8.5-5-8.5-5Z" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  personas: (
    <>
      <circle cx="9" cy="9" r="2.5" />
      <path d="M4.5 18c.5-3 2.1-4.5 4.5-4.5s4 1.5 4.5 4.5M16.5 10.5a2.25 2.25 0 1 0 0-4.5M15.5 14c2.1 0 3.4 1.3 4 3.5" />
    </>
  ),
  persona: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6" />
    </>
  ),
  verificado: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12 2.2 2.2 4.8-4.8" />
    </>
  ),
};

export function Icono({ nombre, className }: PropsIcono) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
