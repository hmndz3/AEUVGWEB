import { RepositorioHorasBecaPrisma } from "@/lib/horas-beca/repositorio-horas-beca";
import { ServicioHorasBeca } from "@/lib/horas-beca/servicio-horas-beca";

export function crearServicioHorasBeca(): ServicioHorasBeca {
  return new ServicioHorasBeca(new RepositorioHorasBecaPrisma());
}
