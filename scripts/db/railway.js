// Ejecuta un comando de Prisma contra la base de datos de Railway.
//
// El DATABASE_URL del proyecto apunta a postgres.railway.internal, un nombre
// que solo resuelve dentro de la red privada de Railway. Para trabajar desde
// una máquina de desarrollo hace falta un camino hacia ella. El script lee las
// credenciales mediante el CLI de Railway, arma la cadena de conexión y la
// entrega al comando por variable de entorno, sin escribirla en disco ni
// mostrarla en pantalla.
//
// Se prefiere el túnel cifrado por SSH, que no expone la base a internet:
//
//   1. railway connect Postgres --tunnel-only --port 55432   (dejar corriendo)
//   2. node scripts/db/railway.js prisma migrate deploy
//
// El túnel se detecta solo en 127.0.0.1:55432. Con otro puerto, indicarlo en
// RAILWAY_DB_TUNNEL (por ejemplo 127.0.0.1:6543). Si no hay túnel, el script
// recurre al acceso público del servicio (antes TCP Proxy), que sí expone la
// base mientras esté activo.
//
// Requisitos: railway login, railway link y una llave SSH registrada con
// railway ssh keys add.
//
// Uso:
//   node scripts/db/railway.js prisma migrate deploy
//   node scripts/db/railway.js prisma db seed

const { execFileSync, spawnSync } = require("child_process");

const SERVICIO_BD = "Postgres";
const TUNEL_PREDETERMINADO = "127.0.0.1:55432";

function railway(args) {
  return execFileSync("railway", args, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    shell: true,
  });
}

/** Comprueba si algo está escuchando en el endpoint, sin llegar a hablar SQL. */
function hayTunel(endpoint) {
  const [host, puerto] = endpoint.split(":");
  const resultado = spawnSync(
    process.execPath,
    [
      "-e",
      `const s=require("net").connect(${Number(puerto)},${JSON.stringify(host)});` +
        's.setTimeout(1500);s.on("connect",()=>{s.destroy();process.exit(0)});' +
        's.on("error",()=>process.exit(1));s.on("timeout",()=>{s.destroy();process.exit(1)});',
    ],
    { timeout: 5000 }
  );

  return resultado.status === 0;
}

function obtenerEndpoint() {
  const tunel = process.env.RAILWAY_DB_TUNNEL || TUNEL_PREDETERMINADO;

  if (hayTunel(tunel)) return { endpoint: tunel, via: "túnel SSH" };

  const { proxies } = JSON.parse(railway(["tcp-proxy", "list", "-s", SERVICIO_BD, "--json"]));

  if (!proxies || proxies.length === 0) {
    throw new Error(
      `No hay forma de alcanzar la base de ${SERVICIO_BD}.
` +
        `Abre el túnel cifrado en otra terminal y déjalo corriendo:
` +
        `  railway connect ${SERVICIO_BD} --tunnel-only --port 55432
` +
        "Como alternativa, activa el acceso público del servicio en Settings → " +
        "Networking → Public Access (expone la base mientras esté activo)."
    );
  }

  return { endpoint: proxies[0].endpoint, via: "acceso público" };
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

  const { endpoint, via } = obtenerEndpoint();
  const { usuario, clave, base } = obtenerCredenciales();
  const url = `postgresql://${usuario}:${encodeURIComponent(clave)}@${endpoint}/${base}`;

  console.log(`Conectando a ${endpoint}/${base} como ${usuario} (${via})`);
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
