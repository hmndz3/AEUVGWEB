// Comprueba contra la base que el Sprint 6 quedó bien aplicado.
//
// Uso (con el túnel de Railway abierto):
//   node scripts/db/railway.js tsx prisma/verificar-tutorias.ts
//
// No imprime la cadena de conexión ni ningún dato personal: solo conteos y el
// resultado de cada comprobación.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

type Comprobacion = { nombre: string; bien: boolean; detalle?: string };

async function principal(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no está definida.");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const comprobaciones: Comprobacion[] = [];

  try {
    const columna = await prisma.$queryRaw<
      { data_type: string; character_maximum_length: number; is_nullable: string }[]
    >`SELECT data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'estudiante' AND column_name = 'foto_url'`;

    comprobaciones.push({
      nombre: "La columna de la fotografía de perfil existe",
      bien: columna.length === 1,
    });
    comprobaciones.push({
      nombre: "La fotografía es opcional y admite 500 caracteres",
      bien: columna[0]?.is_nullable === "YES" && columna[0]?.character_maximum_length === 500,
      detalle: JSON.stringify(columna[0] ?? null),
    });

    // Las tablas del módulo existen desde el Sprint 1: lo que se comprueba es
    // que sigan ahí y que el rol de tutor esté en el catálogo, que es lo que
    // la aprobación de una postulación concede.
    const tablas = await prisma.$queryRaw<{ cantidad: bigint }[]>`
      SELECT COUNT(*) AS cantidad FROM information_schema.tables
      WHERE table_name IN ('curso', 'postulacion_tutor', 'curso_postulacion', 'tutor',
                           'tutor_curso', 'disponibilidad_tutor', 'tutoria', 'notificacion')`;

    comprobaciones.push({
      nombre: "Las ocho tablas del módulo de tutorías y notificaciones existen",
      bien: Number(tablas[0]?.cantidad ?? 0) === 8,
      detalle: String(tablas[0]?.cantidad ?? 0),
    });

    const rolTutor = await prisma.rol.count({ where: { nombre: "TUTOR" } });
    comprobaciones.push({ nombre: "El rol TUTOR está en el catálogo", bien: rolTutor === 1 });

    // Un tutor sin cursos no se puede elegir para nada: si aparece alguno, la
    // aprobación dejó de asignar los cursos de la postulación.
    const tutoresSinCurso = await prisma.tutor.count({ where: { cursos: { none: {} } } });
    comprobaciones.push({
      nombre: "Ningún tutor quedó sin cursos asignados",
      bien: tutoresSinCurso === 0,
      detalle: String(tutoresSinCurso),
    });

    const aprobadasSinTutor = await prisma.postulacionTutor.count({
      where: { estado: "APROBADA", estudiante: { tutor: null } },
    });
    comprobaciones.push({
      nombre: "Toda postulación aprobada tiene su tutor dado de alta",
      bien: aprobadasSinTutor === 0,
      detalle: String(aprobadasSinTutor),
    });

    const [cursos, tutores, franjas, tutorias, notificaciones] = await Promise.all([
      prisma.curso.count(),
      prisma.tutor.count(),
      prisma.disponibilidadTutor.count(),
      prisma.tutoria.count(),
      prisma.notificacion.count(),
    ]);

    let fallos = 0;
    for (const { nombre, bien, detalle } of comprobaciones) {
      if (!bien) fallos += 1;
      console.log(
        `${bien ? "OK  " : "FALLA"}  ${nombre}${bien || !detalle ? "" : ` (${detalle})`}`
      );
    }

    console.log(
      `\nCursos: ${cursos} · tutores: ${tutores} · franjas: ${franjas} · tutorías: ${tutorias} · notificaciones: ${notificaciones}`
    );

    if (fallos > 0) {
      console.error(`\n${fallos} comprobación(es) fallaron.`);
      process.exitCode = 1;
      return;
    }

    console.log("\nEl módulo de tutorías está aplicado y la base es coherente.");
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
