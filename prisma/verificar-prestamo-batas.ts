// Comprueba contra la base que el módulo de préstamo de batas quedó bien aplicado.
//
// Uso (con el túnel de Railway abierto):
//   node scripts/db/railway.js tsx prisma/verificar-prestamo-batas.ts
//
// No imprime la cadena de conexión ni ningún dato personal: solo conteos y el
// resultado de cada comprobación.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

type Comprobacion = { nombre: string; bien: boolean; detalle?: string };

/** Las nueve tablas que agrega la migración del módulo. */
const TABLAS = [
  "turno_voluntariado",
  "postulacion_voluntario",
  "turno_postulacion",
  "asignacion_voluntario",
  "articulo_inventario",
  "prestamo_bata",
  "articulo_prestado",
  "lista_negra_bata",
  "comprobante_turno",
];

async function principal(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no está definida.");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const comprobaciones: Comprobacion[] = [];

  try {
    const tablas = await prisma.$queryRaw<{ cantidad: bigint }[]>`
      SELECT COUNT(*) AS cantidad FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ANY(${TABLAS})`;

    comprobaciones.push({
      nombre: "Las nueve tablas del módulo existen",
      bien: Number(tablas[0]?.cantidad ?? 0) === TABLAS.length,
      detalle: String(tablas[0]?.cantidad ?? 0),
    });

    const enums = await prisma.$queryRaw<{ cantidad: bigint }[]>`
      SELECT COUNT(DISTINCT typname) AS cantidad FROM pg_type
      WHERE typname IN ('tipo_articulo_bata', 'talla_bata', 'estado_prestamo_bata',
                        'estado_comprobante_turno')`;

    comprobaciones.push({
      nombre: "Los cuatro enums del módulo existen",
      bien: Number(enums[0]?.cantidad ?? 0) === 4,
      detalle: String(enums[0]?.cantidad ?? 0),
    });

    const rolVoluntario = await prisma.rol.count({ where: { nombre: "VOLUNTARIO", activo: true } });
    comprobaciones.push({
      nombre: "El rol VOLUNTARIO está activo en el catálogo",
      bien: rolVoluntario === 1,
    });

    // Los turnos del salón: cinco franjas de lunes a viernes y dos el sábado.
    const turnos = await prisma.turnoVoluntariado.count({ where: { activo: true } });
    comprobaciones.push({
      nombre: "Los 27 turnos de atención están cargados",
      bien: turnos === 27,
      detalle: String(turnos),
    });

    const sinCupo = await prisma.turnoVoluntariado.count({ where: { cupo: { lte: 0 } } });
    comprobaciones.push({
      nombre: "Ningún turno quedó sin cupo",
      bien: sinCupo === 0,
      detalle: String(sinCupo),
    });

    // Dos voluntarios por turno: ningún turno puede tener más asignaciones
    // activas que su cupo.
    const excedidos = await prisma.$queryRaw<{ cantidad: bigint }[]>`
      SELECT COUNT(*) AS cantidad FROM (
        SELECT a.id_turno FROM asignacion_voluntario a
        JOIN turno_voluntariado t ON t.id_turno = a.id_turno
        WHERE a.activo = true
        GROUP BY a.id_turno, t.cupo
        HAVING COUNT(*) > t.cupo
      ) AS excedidos`;

    comprobaciones.push({
      nombre: "Ningún turno supera su cupo de voluntarios",
      bien: Number(excedidos[0]?.cantidad ?? 0) === 0,
      detalle: String(excedidos[0]?.cantidad ?? 0),
    });

    // Las batas llevan talla y los lentes no: una fila de lentes sin talla.
    const lentesConTalla = await prisma.articuloInventario.count({
      where: { tipo: "LENTES", talla: { not: null } },
    });
    const batasSinTalla = await prisma.articuloInventario.count({
      where: { tipo: { not: "LENTES" }, talla: null },
    });
    comprobaciones.push({
      nombre: "Las batas tienen talla y los lentes no",
      bien: lentesConTalla === 0 && batasSinTalla === 0,
      detalle: `lentes con talla: ${lentesConTalla}, batas sin talla: ${batasSinTalla}`,
    });

    const articulos = await prisma.articuloInventario.count({ where: { activo: true } });
    comprobaciones.push({
      nombre: "El inventario inicial está cargado (8 tallas de bata + lentes)",
      bien: articulos >= 9,
      detalle: String(articulos),
    });

    const negativos = await prisma.articuloInventario.count({
      where: { cantidadTotal: { lt: 0 } },
    });
    comprobaciones.push({
      nombre: "Ningún artículo tiene cantidad total negativa",
      bien: negativos === 0,
      detalle: String(negativos),
    });

    // El inventario cuadra: lo prestado sin devolver nunca pasa del total.
    const sobregirados = await prisma.$queryRaw<{ cantidad: bigint }[]>`
      SELECT COUNT(*) AS cantidad FROM (
        SELECT ap.id_articulo FROM articulo_prestado ap
        JOIN prestamo_bata p ON p.id_prestamo = ap.id_prestamo
        JOIN articulo_inventario i ON i.id_articulo = ap.id_articulo
        WHERE p.estado = 'prestado'
        GROUP BY ap.id_articulo, i.cantidad_total
        HAVING SUM(ap.cantidad) > i.cantidad_total
      ) AS sobregirados`;

    comprobaciones.push({
      nombre: "Lo prestado sin devolver nunca supera el total del inventario",
      bien: Number(sobregirados[0]?.cantidad ?? 0) === 0,
      detalle: String(sobregirados[0]?.cantidad ?? 0),
    });

    // Un comprobante aprobado tiene que haber dejado su registro de horas.
    const aprobadosSinHoras = await prisma.comprobanteTurno.count({
      where: { estado: "APROBADO", idRegistroHora: null },
    });
    comprobaciones.push({
      nombre: "Todo comprobante aprobado tiene su registro de horas beca",
      bien: aprobadosSinHoras === 0,
      detalle: String(aprobadosSinHoras),
    });

    const [asignaciones, prestamos, prestados, listaNegra, postulaciones, comprobantes] =
      await Promise.all([
        prisma.asignacionVoluntario.count({ where: { activo: true } }),
        prisma.prestamoBata.count(),
        prisma.prestamoBata.count({ where: { estado: "PRESTADO" } }),
        prisma.listaNegraBata.count(),
        prisma.postulacionVoluntario.count({ where: { estado: "PENDIENTE" } }),
        prisma.comprobanteTurno.count({ where: { estado: "PENDIENTE" } }),
      ]);

    let fallos = 0;
    for (const { nombre, bien, detalle } of comprobaciones) {
      if (!bien) fallos += 1;
      console.log(
        `${bien ? "OK  " : "FALLA"}  ${nombre}${bien || !detalle ? "" : ` (${detalle})`}`
      );
    }

    console.log(
      `\nTurnos: ${turnos} · artículos: ${articulos} · voluntarios asignados: ${asignaciones}` +
        `\nPréstamos: ${prestamos} (${prestados} sin devolver) · lista negra: ${listaNegra}` +
        `\nPendientes de revisar: ${postulaciones} postulación(es), ${comprobantes} comprobante(s)`
    );

    if (fallos > 0) {
      console.error(`\n${fallos} comprobación(es) fallaron.`);
      process.exitCode = 1;
      return;
    }

    console.log("\nEl módulo de préstamo de batas está aplicado y la base es coherente.");
  } finally {
    await prisma.$disconnect();
  }
}

principal().catch((error: unknown) => {
  const mensaje = error instanceof Error ? error.message : String(error);
  const url = process.env.DATABASE_URL;
  console.error(
    "No se pudo verificar la base:",
    url ? mensaje.replaceAll(url, "[DATABASE_URL]") : mensaje
  );
  process.exitCode = 1;
});
