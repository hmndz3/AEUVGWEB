type RegistroIntentos = { fallos: number; expiraEn: number };

export class LimitadorIniciosSesion {
  private readonly registros = new Map<string, RegistroIntentos>();

  constructor(
    private readonly maximosFallos = 5,
    private readonly ventanaMilisegundos = 15 * 60_000
  ) {}

  permitir(clave: string, fecha = new Date()): boolean {
    this.limpiar(fecha);
    return (this.registros.get(clave)?.fallos ?? 0) < this.maximosFallos;
  }

  registrarFallo(clave: string, fecha = new Date()): void {
    this.limpiar(fecha);
    const actual = this.registros.get(clave);
    this.registros.set(clave, {
      fallos: (actual?.fallos ?? 0) + 1,
      expiraEn: fecha.getTime() + this.ventanaMilisegundos,
    });
  }

  reiniciar(clave: string): void {
    this.registros.delete(clave);
  }

  private limpiar(fecha: Date): void {
    for (const [clave, registro] of this.registros) {
      if (registro.expiraEn <= fecha.getTime()) this.registros.delete(clave);
    }
  }
}

export const limitadorIniciosSesion = new LimitadorIniciosSesion();
