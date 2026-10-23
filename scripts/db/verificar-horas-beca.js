// Comprueba contra la base que la migración del Sprint 4 quedó bien aplicada.
//
// Uso (con DATABASE_URL apuntando a la base que se quiere revisar):
//   node scripts/db/verificar-horas-beca.js
//
// No imprime la cadena de conexión ni ningún dato personal: solo conteos y el
// resultado de cada comprobación.
require("dotenv/config");
const { Client } = require("pg");

const COMPROBACIONES = [
  {
    nombre: "Las tres columnas nuevas existen",
    sql: `SELECT count(*)::int AS valor FROM information_schema.columns
          WHERE table_name = 'registro_hora_beca'
            AND column_name IN ('carnet', 'nombre_estudiante', 'texto_busqueda')`,
    esperado: 3,
  },
  {
    nombre: "El vínculo con el estudiante quedó opcional",
    sql: `SELECT count(*)::int AS valor FROM information_schema.columns
          WHERE table_name = 'registro_hora_beca'
            AND column_name = 'id_estudiante'
            AND is_nullable = 'YES'`,
    esperado: 1,
  },
  {
    nombre: "Ningún registro quedó sin carnet",
    sql: `SELECT count(*)::int AS valor FROM registro_hora_beca WHERE btrim(carnet) = ''`,
    esperado: 0,
  },
  {
    nombre: "Ningún registro quedó sin nombre de estudiante",
    sql: `SELECT count(*)::int AS valor FROM registro_hora_beca WHERE btrim(nombre_estudiante) = ''`,
    esperado: 0,
  },
  {
    // Misma normalización que src/lib/busqueda-texto.ts: minúsculas, sin
    // acentos y con los espacios repetidos colapsados.
    nombre: "El texto de búsqueda coincide con el que calcula la aplicación",
    sql: `SELECT count(*)::int AS valor FROM registro_hora_beca
          WHERE texto_busqueda IS DISTINCT FROM btrim(regexp_replace(lower(translate(
            coalesce(carnet, '') || ' ' || coalesce(nombre_estudiante, '') || ' ' || coalesce(descripcion_actividad, ''),
            'áéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙ',
            'aeiouunAEIOUUNaeiouAEIOU'
          )), '\\s+', ' ', 'g'))`,
    esperado: 0,
  },
  {
    nombre: "Los tres índices nuevos existen",
    sql: `SELECT count(*)::int AS valor FROM pg_indexes
          WHERE tablename = 'registro_hora_beca'
            AND indexname IN ('registro_hora_beca_carnet_idx',
                              'registro_hora_beca_carnet_estado_idx',
                              'registro_hora_beca_estado_fecha_actividad_idx')`,
    esperado: 3,
  },
  {
    nombre: "La migración quedó registrada por Prisma",
    sql: `SELECT count(*)::int AS valor FROM _prisma_migrations
          WHERE migration_name = '20261009010000_add_carnet_registro_hora_beca'
            AND finished_at IS NOT NULL AND rolled_back_at IS NULL`,
    esperado: 1,
  },
];

const RESUMEN = `SELECT count(*)::int AS registros,
                        count(id_estudiante)::int AS vinculados,
                        count(*)::int - count(id_estudiante)::int AS sin_cuenta
                 FROM registro_hora_beca`;

async function principal() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("Falta DATABASE_URL. Defínela antes de ejecutar este script.");
    process.exit(1);
  }

  const cliente = new Client({ connectionString });
  await cliente.connect();

  let fallos = 0;

  try {
    for (const comprobacion of COMPROBACIONES) {
      const { rows } = await cliente.query(comprobacion.sql);
      const valor = rows[0].valor;
      const bien = valor === comprobacion.esperado;

      if (!bien) fallos += 1;
      console.log(
        `${bien ? "OK  " : "FALLA"}  ${comprobacion.nombre}` +
          (bien ? "" : ` (esperado ${comprobacion.esperado}, obtenido ${valor})`)
      );
    }

    const { rows } = await cliente.query(RESUMEN);
    const { registros, vinculados, sin_cuenta: sinCuenta } = rows[0];
    console.log(
      `\nRegistros de horas: ${registros} · con cuenta vinculada: ${vinculados} · sin cuenta: ${sinCuenta}`
    );
  } finally {
    await cliente.end();
  }

  if (fallos > 0) {
    console.error(`\n${fallos} comprobación(es) fallaron.`);
    process.exit(1);
  }

  console.log("\nLa migración del Sprint 4 está aplicada y la base es coherente.");
}

principal().catch((error) => {
  console.error("No se pudo verificar la base:", error.message);
  process.exit(1);
});
