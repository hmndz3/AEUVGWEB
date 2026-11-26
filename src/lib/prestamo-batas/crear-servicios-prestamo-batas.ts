import { crearServicioHorasBeca } from "@/lib/horas-beca/crear-servicio-horas-beca";
import { RepositorioComprobantesPrisma } from "@/lib/prestamo-batas/repositorio-comprobantes";
import { RepositorioInventarioPrisma } from "@/lib/prestamo-batas/repositorio-inventario";
import { RepositorioOperacionPrisma } from "@/lib/prestamo-batas/repositorio-operacion";
import { RepositorioTurnosPrisma } from "@/lib/prestamo-batas/repositorio-turnos";
import { RepositorioVoluntariosPrisma } from "@/lib/prestamo-batas/repositorio-voluntarios";
import { ServicioComprobantes } from "@/lib/prestamo-batas/servicio-comprobantes";
import { ServicioInventario } from "@/lib/prestamo-batas/servicio-inventario";
import { ServicioOperacion } from "@/lib/prestamo-batas/servicio-operacion";
import { ServicioTurnos } from "@/lib/prestamo-batas/servicio-turnos";
import { ServicioVoluntarios } from "@/lib/prestamo-batas/servicio-voluntarios";

export function crearServicioInventario(): ServicioInventario {
  return new ServicioInventario(new RepositorioInventarioPrisma());
}

export function crearServicioTurnos(): ServicioTurnos {
  return new ServicioTurnos(new RepositorioTurnosPrisma());
}

export function crearServicioVoluntarios(): ServicioVoluntarios {
  return new ServicioVoluntarios(new RepositorioVoluntariosPrisma());
}

export function crearServicioOperacion(): ServicioOperacion {
  return new ServicioOperacion(new RepositorioOperacionPrisma());
}

export function crearServicioComprobantes(): ServicioComprobantes {
  return new ServicioComprobantes(new RepositorioComprobantesPrisma(), crearServicioHorasBeca());
}
