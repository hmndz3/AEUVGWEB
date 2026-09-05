export type FacultadInicial = {
  codigo: string;
  nombre: string;
  activo: boolean;
};

export type CarreraInicial = {
  codigo: string;
  nombre: string;
  codigoFacultad: string;
  activo: boolean;
};

export type CategoriaEventoInicial = {
  nombre: string;
  descripcion: string;
  color: string;
  activo: boolean;
};

export type RolInicial = {
  nombre: string;
  descripcion: string;
  activo: boolean;
};

export const FUENTE_CATALOGO_ACADEMICO = {
  nombre: "Catálogo público de carreras de UVG",
  url: "https://www.uvg.edu.gt/academico/carreras/",
  fechaConsulta: "2026-09-04",
  alcance:
    "Programas de pregrado publicados para las unidades académicas del sitio principal de UVG",
} as const;

// Los códigos son identificadores técnicos internos y no códigos académicos oficiales de UVG.
export const FACULTADES_INICIALES: readonly FacultadInicial[] = [
  { codigo: "CC-ING", nombre: "Facultad de Ingeniería", activo: true },
  { codigo: "CC-CYH", nombre: "Facultad de Ciencias y Humanidades", activo: true },
  { codigo: "CC-CSO", nombre: "Facultad de Ciencias Sociales", activo: true },
  { codigo: "CC-EDU", nombre: "Facultad de Educación", activo: true },
  { codigo: "CC-CU", nombre: "Colegio Universitario", activo: true },
  { codigo: "CC-BBS", nombre: "Bridge Business School", activo: true },
  { codigo: "CC-DIA", nombre: "Design Innovation & Arts School", activo: true },
  { codigo: "CC-ARQ", nombre: "Escuela de Arquitectura", activo: true },
];

export const CARRERAS_INICIALES: readonly CarreraInicial[] = [
  // Facultad de Ingeniería
  {
    codigo: "CC-ING-BIOMED",
    nombre: "Ingeniería Biomédica",
    codigoFacultad: "CC-ING",
    activo: true,
  },
  {
    codigo: "CC-ING-BIOTEC",
    nombre: "Ingeniería en Biotecnología Industrial",
    codigoFacultad: "CC-ING",
    activo: true,
  },
  {
    codigo: "CC-ING-ALIMENTOS",
    nombre: "Ingeniería en Ciencias de Alimentos",
    codigoFacultad: "CC-ING",
    activo: true,
  },
  {
    codigo: "CC-ING-ALIM-IND",
    nombre: "Ingeniería en Ciencias de Alimentos Industrial",
    codigoFacultad: "CC-ING",
    activo: true,
  },
  {
    codigo: "CC-ING-ICA",
    nombre: "Ingeniería en Ciencia de la Administración",
    codigoFacultad: "CC-ING",
    activo: true,
  },
  { codigo: "CC-ING-CIVIL", nombre: "Ingeniería Civil", codigoFacultad: "CC-ING", activo: true },
  {
    codigo: "CC-ING-CIV-ARQ",
    nombre: "Ingeniería Civil Arquitectónica",
    codigoFacultad: "CC-ING",
    activo: true,
  },
  {
    codigo: "CC-ING-COMP",
    nombre: "Ingeniería en Ciencia de la Computación y Tecnologías de la Información",
    codigoFacultad: "CC-ING",
    activo: true,
  },
  {
    codigo: "CC-ING-SIC",
    nombre: "Sistemas de Información Computacional",
    codigoFacultad: "CC-ING",
    activo: true,
  },
  { codigo: "CC-ING-IND", nombre: "Ingeniería Industrial", codigoFacultad: "CC-ING", activo: true },
  {
    codigo: "CC-ING-MEC-IND",
    nombre: "Ingeniería Mecánica Industrial",
    codigoFacultad: "CC-ING",
    activo: true,
  },
  {
    codigo: "CC-ING-ELEC",
    nombre: "Ingeniería Electrónica",
    codigoFacultad: "CC-ING",
    activo: true,
  },
  { codigo: "CC-ING-QUIM", nombre: "Ingeniería Química", codigoFacultad: "CC-ING", activo: true },
  {
    codigo: "CC-ING-QUIM-IND",
    nombre: "Ingeniería Química Industrial",
    codigoFacultad: "CC-ING",
    activo: true,
  },
  { codigo: "CC-ING-MEC", nombre: "Ingeniería Mecánica", codigoFacultad: "CC-ING", activo: true },
  {
    codigo: "CC-ING-MEC-AERO",
    nombre: "Ingeniería Mecánica y Aeronáutica",
    codigoFacultad: "CC-ING",
    activo: true,
  },
  {
    codigo: "CC-ING-MECATRON",
    nombre: "Ingeniería Mecatrónica",
    codigoFacultad: "CC-ING",
    activo: true,
  },

  // Facultad de Ciencias y Humanidades
  {
    codigo: "CC-CYH-BIO",
    nombre: "Licenciatura en Biología",
    codigoFacultad: "CC-CYH",
    activo: true,
  },
  {
    codigo: "CC-CYH-BQM",
    nombre: "Licenciatura en Bioquímica y Microbiología",
    codigoFacultad: "CC-CYH",
    activo: true,
  },
  {
    codigo: "CC-CYH-BIOT-MOL",
    nombre: "Licenciatura en Biotecnología Molecular",
    codigoFacultad: "CC-CYH",
    activo: true,
  },
  {
    codigo: "CC-CYH-FIS",
    nombre: "Licenciatura en Física",
    codigoFacultad: "CC-CYH",
    activo: true,
  },
  {
    codigo: "CC-CYH-MAT-APL",
    nombre: "Licenciatura en Matemática Aplicada",
    codigoFacultad: "CC-CYH",
    activo: true,
  },
  {
    codigo: "CC-CYH-NUT",
    nombre: "Licenciatura en Nutrición",
    codigoFacultad: "CC-CYH",
    activo: true,
  },
  {
    codigo: "CC-CYH-QUIM",
    nombre: "Licenciatura en Química",
    codigoFacultad: "CC-CYH",
    activo: true,
  },
  {
    codigo: "CC-CYH-QF",
    nombre: "Licenciatura en Química Farmacéutica",
    codigoFacultad: "CC-CYH",
    activo: true,
  },

  // Facultad de Ciencias Sociales
  {
    codigo: "CC-CSO-ANT",
    nombre: "Licenciatura en Antropología",
    codigoFacultad: "CC-CSO",
    activo: true,
  },
  {
    codigo: "CC-CSO-ARQ",
    nombre: "Licenciatura en Arqueología",
    codigoFacultad: "CC-CSO",
    activo: true,
  },
  {
    codigo: "CC-CSO-PSI",
    nombre: "Licenciatura en Psicología",
    codigoFacultad: "CC-CSO",
    activo: true,
  },
  {
    codigo: "CC-CSO-RI",
    nombre: "Licenciatura en Relaciones Internacionales",
    codigoFacultad: "CC-CSO",
    activo: true,
  },

  // Facultad de Educación
  {
    codigo: "CC-EDU-LIC",
    nombre: "Licenciatura en Educación",
    codigoFacultad: "CC-EDU",
    activo: true,
  },
  {
    codigo: "CC-EDU-MUS",
    nombre: "Profesorado de Enseñanza Media especializado en Educación Musical",
    codigoFacultad: "CC-EDU",
    activo: true,
  },
  {
    codigo: "CC-EDU-ELT",
    nombre: "Profesorado de Enseñanza Media especializado en English Language Teaching (ELT)",
    codigoFacultad: "CC-EDU",
    activo: true,
  },
  {
    codigo: "CC-EDU-INCLUS",
    nombre: "Profesorado Especializado en Educación Inclusiva",
    codigoFacultad: "CC-EDU",
    activo: true,
  },
  {
    codigo: "CC-EDU-PRIM-V",
    nombre: "Profesorado Especializado en Educación Primaria (100% virtual)",
    codigoFacultad: "CC-EDU",
    activo: true,
  },
  {
    codigo: "CC-EDU-APR",
    nombre: "Profesorado Especializado en Problemas del Aprendizaje",
    codigoFacultad: "CC-EDU",
    activo: true,
  },
  {
    codigo: "CC-EDU-MAT-FIS",
    nombre: "Profesorado de Enseñanza Media Especializado en Matemática y Ciencias Físicas",
    codigoFacultad: "CC-EDU",
    activo: true,
  },
  {
    codigo: "CC-EDU-QUI-BIO",
    nombre: "Profesorado de Enseñanza Media Especializado en Ciencias Químicas y Biológicas",
    codigoFacultad: "CC-EDU",
    activo: true,
  },
  {
    codigo: "CC-EDU-SOC",
    nombre: "Profesorado de Enseñanza Media Especializado en Ciencias Sociales",
    codigoFacultad: "CC-EDU",
    activo: true,
  },
  {
    codigo: "CC-EDU-COM-LEN",
    nombre: "Profesorado de Enseñanza Media Especializado en Comunicación y Lenguaje",
    codigoFacultad: "CC-EDU",
    activo: true,
  },

  // Colegio Universitario
  {
    codigo: "CC-CU-BA",
    nombre: "Baccalaureatus en Artibus",
    codigoFacultad: "CC-CU",
    activo: true,
  },
  {
    codigo: "CC-CU-BS",
    nombre: "Baccalaureatus en Scientiis",
    codigoFacultad: "CC-CU",
    activo: true,
  },

  // Bridge Business School
  {
    codigo: "CC-BBS-ECON-AN",
    nombre: "Licenciatura en Economía Analítica",
    codigoFacultad: "CC-BBS",
    activo: true,
  },
  {
    codigo: "CC-BBS-GBM-MIM",
    nombre: "Licenciatura en Global Business Management + Master in Management",
    codigoFacultad: "CC-BBS",
    activo: true,
  },
  {
    codigo: "CC-BBS-IMBA",
    nombre: "Licenciatura en International Marketing and Business Analytics",
    codigoFacultad: "CC-BBS",
    activo: true,
  },
  {
    codigo: "CC-BBS-COM-EST",
    nombre: "Licenciatura en Comunicación Estratégica",
    codigoFacultad: "CC-BBS",
    activo: true,
  },

  // Design Innovation & Arts School
  {
    codigo: "CC-DIA-MUS",
    nombre: "Licenciatura en Composición y Producción Musical",
    codigoFacultad: "CC-DIA",
    activo: true,
  },
  {
    codigo: "CC-DIA-DPI",
    nombre: "Licenciatura en Diseño de Producto e Innovación",
    codigoFacultad: "CC-DIA",
    activo: true,
  },

  // Escuela de Arquitectura
  { codigo: "CC-ARQ-ARQ", nombre: "Arquitectura", codigoFacultad: "CC-ARQ", activo: true },
];

// Categorías editables y específicas; TipoActividad conserva la clasificación general cerrada.
export const CATEGORIAS_EVENTO_INICIALES: readonly CategoriaEventoInicial[] = [
  {
    nombre: "Venta",
    descripcion:
      "Venta de productos o servicios organizada por AEUVG u otra organización estudiantil.",
    color: "#2563EB",
    activo: true,
  },
  {
    nombre: "Festival",
    descripcion: "Festival o actividad amplia de convivencia para la comunidad universitaria.",
    color: "#7C3AED",
    activo: true,
  },
  {
    nombre: "Proyección",
    descripcion: "Proyección audiovisual o presentación abierta a la comunidad universitaria.",
    color: "#0891B2",
    activo: true,
  },
  {
    nombre: "Convocatoria de horas beca",
    descripcion: "Convocatoria para apoyar actividades y obtener horas beca con AEUVG.",
    color: "#D97706",
    activo: true,
  },
  {
    nombre: "Recaudación de fondos",
    descripcion: "Actividad destinada a recaudar fondos para una iniciativa estudiantil.",
    color: "#059669",
    activo: true,
  },
  {
    nombre: "Espíritu universitario",
    descripcion: "Actividad que fortalece la identidad, participación y convivencia universitaria.",
    color: "#16A34A",
    activo: true,
  },
  {
    nombre: "Colaboración estudiantil",
    descripcion: "Actividad realizada en colaboración con asociaciones o clubes estudiantiles.",
    color: "#DB2777",
    activo: true,
  },
  {
    nombre: "Colaboración institucional",
    descripcion: "Actividad realizada junto con una unidad administrativa de UVG.",
    color: "#4F46E5",
    activo: true,
  },
];

export const ROLES_INICIALES: readonly RolInicial[] = [
  {
    nombre: "ESTUDIANTE",
    descripcion:
      "Consulta contenido, guarda eventos y gestiona su perfil y actividades estudiantiles.",
    activo: true,
  },
  {
    nombre: "TUTOR",
    descripcion: "Gestiona su perfil de tutor, disponibilidad y tutorías asignadas.",
    activo: true,
  },
  {
    nombre: "ADMINISTRADOR",
    descripcion: "Administra contenidos, catálogos y operaciones internas de AEUVG.",
    activo: true,
  },
];
