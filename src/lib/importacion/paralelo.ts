/**
 * Ejecuta una tarea sobre cada elemento, con un límite de tareas a la vez.
 *
 * Lo pide la descarga de imágenes: una hoja de cincuenta eventos trae cincuenta
 * enlaces, y bajarlos de uno en uno tarda tanto que la petición del navegador
 * se agota. Lanzarlos todos de golpe tampoco sirve, porque el proceso corre en
 * el plan más pequeño de Railway y cincuenta descargas simultáneas se le comen
 * la memoria. Los resultados conservan el orden de la entrada.
 */
export async function enParalelo<T, R>(
  elementos: readonly T[],
  limite: number,
  tarea: (elemento: T, indice: number) => Promise<R>
): Promise<R[]> {
  const resultados = new Array<R>(elementos.length);
  let siguiente = 0;

  async function trabajador(): Promise<void> {
    while (siguiente < elementos.length) {
      const indice = siguiente;
      siguiente += 1;
      resultados[indice] = await tarea(elementos[indice], indice);
    }
  }

  const trabajadores = Array.from({ length: Math.max(1, Math.min(limite, elementos.length)) }, () =>
    trabajador()
  );

  await Promise.all(trabajadores);

  return resultados;
}
