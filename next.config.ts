import type { NextConfig } from "next";

import { cabecerasFijas } from "./src/lib/seguridad/cabeceras";

const nextConfig: NextConfig = {
  // Genera un build autocontenido para desplegar en Docker/Railway
  output: "standalone",

  // Deja de anunciar el marco y su versión: es información gratis para quien
  // busca una vulnerabilidad conocida.
  poweredByHeader: false,

  /**
   * Cabeceras de seguridad en toda respuesta, incluidas las rutas de API y los
   * archivos estáticos. La política de contenidos no va aquí porque su valor
   * cambia en cada petición; la pone src/proxy.ts.
   */
  async headers() {
    return [
      {
        source: "/:ruta*",
        headers: cabecerasFijas(process.env.NODE_ENV === "production"),
      },
    ];
  },
};

export default nextConfig;
