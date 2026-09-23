/**
 * Información institucional de AEUVG entregada por la Junta Directiva.
 *
 * Se mantiene versionada aquí, separada de la lógica de carga, para que
 * actualizarla al cambiar de junta no implique tocar el script. Las fotografías
 * viven en public/integrantes y se sirven con la aplicación.
 */
export const INFORMACION_AEUVG = {
  nombre: "AEUVG",
  descripcion:
    "La Asociación General de Estudiantes de la Universidad del Valle de Guatemala representa al estudiantado y articula el trabajo de las asociaciones y clubes del campus. Su Junta Directiva coordina las actividades académicas, culturales, deportivas y de voluntariado, y acompaña a quienes realizan sus horas beca con la asociación.",
  mision:
    "Conectar a la comunidad estudiantil mediante la contribución multidisciplinaria y sinergia del espíritu universitario, potenciando la inclusión y respeto.",
  vision:
    "Ser una asociación representativa, innovadora y proactiva que genere confianza a la comunidad a través de la unión y deje un legado de participación.",
} as const;

export type IntegranteInicial = {
  nombre: string;
  cargo: string;
  periodo: string;
  fotoUrl: string;
  ordenVisualizacion: number;
};

const PERIODO = "2026";

export const JUNTA_DIRECTIVA_AEUVG: readonly IntegranteInicial[] = [
  {
    nombre: "Marcos Montoya",
    cargo: "Presidente",
    periodo: PERIODO,
    fotoUrl: "/integrantes/marcos-montoya.jpg",
    ordenVisualizacion: 1,
  },
  {
    nombre: "Fátima Escobar",
    cargo: "Vicepresidenta",
    periodo: PERIODO,
    fotoUrl: "/integrantes/fatima-escobar.jpg",
    ordenVisualizacion: 2,
  },
  {
    nombre: "Lucia Sánchez",
    cargo: "Secretaria",
    periodo: PERIODO,
    fotoUrl: "/integrantes/lucia-sanchez.jpg",
    ordenVisualizacion: 3,
  },
  {
    nombre: "Margarita Juarez",
    cargo: "Tesorera",
    periodo: PERIODO,
    fotoUrl: "/integrantes/margarita-juarez.jpg",
    ordenVisualizacion: 4,
  },
  {
    nombre: "Fabricio Chen",
    cargo: "Vocal Académico",
    periodo: PERIODO,
    fotoUrl: "/integrantes/fabricio-chen.jpg",
    ordenVisualizacion: 5,
  },
  {
    nombre: "Sabrina de León-Regil",
    cargo: "Vocal de Comunicación y Relaciones Públicas",
    periodo: PERIODO,
    fotoUrl: "/integrantes/sabrina-de-leon-regil.jpg",
    ordenVisualizacion: 6,
  },
  {
    nombre: "Ximena Gudiel",
    cargo: "Vocal de Arte y Cultura",
    periodo: PERIODO,
    fotoUrl: "/integrantes/ximena-gudiel.jpg",
    ordenVisualizacion: 7,
  },
  {
    nombre: "Daniela Muñoz",
    cargo: "Vocal de Deportes",
    periodo: PERIODO,
    fotoUrl: "/integrantes/daniela-munoz.jpg",
    ordenVisualizacion: 8,
  },
];
