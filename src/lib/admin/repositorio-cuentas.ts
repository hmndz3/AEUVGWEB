import type { PrismaClient } from "@prisma/client";

import { ServicioCuentas, type RepositorioCuentas } from "@/lib/admin/servicio-cuentas";
import { obtenerPrisma } from "@/lib/prisma";
import type { EstadoCuenta } from "@/validators/cuentas-admin";

export class RepositorioCuentasPrisma implements RepositorioCuentas {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async estadoDe(idUsuario: number): Promise<EstadoCuenta | null> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { idUsuario },
      select: { estado: true },
    });

    return usuario?.estado ?? null;
  }

  async cambiarEstado(idUsuario: number, estado: EstadoCuenta): Promise<boolean> {
    const { count } = await this.prisma.usuario.updateMany({
      where: { idUsuario },
      data: { estado },
    });

    return count > 0;
  }
}

export function crearServicioCuentas(): ServicioCuentas {
  return new ServicioCuentas(new RepositorioCuentasPrisma());
}
