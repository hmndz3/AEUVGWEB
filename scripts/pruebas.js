// Lanza el runner de pruebas de Node con todos los archivos de tests/.
// El descubrimiento automatico de Node solo reconoce archivos .js, y el glob
// del shell no funciona igual en Windows, asi que la lista se arma aqui.
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const CARPETA = path.join(__dirname, "..", "tests");

function archivosDePrueba(directorio) {
  return fs
    .readdirSync(directorio, { withFileTypes: true })
    .flatMap((entrada) => {
      const ruta = path.join(directorio, entrada.name);
      if (entrada.isDirectory()) return archivosDePrueba(ruta);
      return entrada.name.endsWith(".test.ts") ? [ruta] : [];
    })
    .sort();
}

const archivos = archivosDePrueba(CARPETA);

if (archivos.length === 0) {
  console.error("No se encontraron archivos de prueba en tests/.");
  process.exit(1);
}

// Se pasan rutas relativas porque la ruta del proyecto puede contener espacios.
const raiz = path.join(__dirname, "..");
const relativas = archivos.map((archivo) => path.relative(raiz, archivo).split(path.sep).join("/"));

const resultado = spawnSync("npx", ["tsx", "--test", ...relativas], {
  cwd: raiz,
  stdio: "inherit",
  shell: true,
});

process.exit(resultado.status === null ? 1 : resultado.status);
