type CuentaAutenticable = {
  estado: "ACTIVO" | "BLOQUEADO" | "PENDIENTE";
  correoVerificado: boolean;
};

/** T-04.3 debe aplicar esta política después de validar las credenciales. */
export function puedeAutenticarse(cuenta: CuentaAutenticable): boolean {
  return cuenta.estado === "ACTIVO" && cuenta.correoVerificado;
}
