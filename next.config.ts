import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera un build autocontenido para desplegar en Docker/Railway
  output: "standalone",
};

export default nextConfig;
