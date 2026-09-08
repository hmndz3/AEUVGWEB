// Ejecuta un comando de Prisma contra la base de datos de Railway.
//
// El DATABASE_URL del proyecto apunta a postgres.railway.internal, un nombre
// que solo resuelve dentro de la red privada de Railway. Para trabajar desde
// una máquina de desarrollo hace falta el TCP Proxy del servicio Postgres.
// Este script lee ese endpoint y las credenciales mediante el CLI de Railway,
// arma la cadena de conexión y la entrega al comando por variable de entorno,
// sin escribirla en disco ni mostrarla en pantalla.
//
// Requisitos: railway login y railway link ejecutados previamente, y el
// TCP Proxy habilitado en el servicio Postgres.
//
// Uso:
//   node scripts/db/railway.js prisma migrate deploy
//   node scripts/db/railway.js prisma db seed

const { execFileSync, spawnSync } = require("child_process");

const SERVICIO_BD = "Postgres";

function railway(args) {
  return execFileSync("railway", args, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    shell: true,
  });
}

function obtenerEndpoint() {
  const { proxies } = JSON.parse(railway(["tcp-proxy", "list", "-s", SERVICIO_BD, "--json"]));

  if (!proxies || proxies.length === 0) {
    throw new Error(
      `El servicio ${SERVICIO_BD} no tiene un TCP Proxy activo. ` +
        "Habilitarlo en Settings → Public Networking → TCP Proxy, puerto 5432."
    );
  }

  return proxies[0].endpoint;
}

function obtenerCredenciales() {
  const vars = JSON.parse(railway(["variables", "-s", SERVICIO_BD, "--json"]));
  const usuario = vars.PGUSER || vars.POSTGRES_USER;
  const clave = vars.PGPASSWORD || vars.POSTGRES_PASSWORD;
  const base = vars.PGDATABASE || vars.POSTGRES_DB;

  if (!usuario || !clave || !base) {
    throw new Error(`No se encontraron las credenciales del servicio ${SERVICIO_BD}.`);
  }

  return { usuario, clave, base };
}

function main() {
  const comando = process.argv.slice(2);

  if (comando.length === 0) {
    console.error("Uso: node scripts/db/railway.js <comando...>");
    console.error("Ejemplo: node scripts/db/railway.js prisma migrate deploy");
    process.exit(1);
  }

  const endpoint = obtenerEndpoint();
  const { usuario, clave, base } = obtenerCredenciales();
  const url = `postgresql://${usuario}:${encodeURIComponent(clave)}@${endpoint}/${base}`;

  console.log(`Conectando a ${endpoint}/${base} como ${usuario}`);
  console.log(`Ejecutando: ${comando.join(" ")}`);

  const resultado = spawnSync("npx", comando, {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, DATABASE_URL: url },
  });

  process.exit(resultado.status === null ? 1 : resultado.status);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
