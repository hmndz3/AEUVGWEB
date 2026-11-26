/** Secciones del panel administrativo. El orden define el de la barra lateral. */
export const SECCIONES_ADMIN = [
  { href: "/admin", texto: "Resumen", descripcion: "Indicadores generales de la plataforma." },
  {
    href: "/admin/estudiantes",
    texto: "Estudiantes",
    descripcion: "Cuentas registradas y su estado de verificación.",
  },
  {
    href: "/admin/eventos",
    texto: "Eventos",
    descripcion: "Creación, edición y publicación de eventos.",
  },
  {
    href: "/admin/calendario",
    texto: "Calendario",
    descripcion: "Vista mensual de las actividades, con sus borradores y cancelados.",
  },
  {
    href: "/admin/sobre-aeuvg",
    texto: "Sobre AEUVG",
    descripcion: "Presentación, misión, visión, junta directiva y contacto de AEUVG.",
  },
  {
    href: "/admin/asociaciones",
    texto: "Asociaciones",
    descripcion: "Información, junta directiva e integrantes de cada asociación.",
  },
  {
    href: "/admin/clubes",
    texto: "Clubes",
    descripcion: "Clubes estudiantiles y sus medios de contacto.",
  },
  {
    href: "/admin/horas-beca",
    texto: "Horas beca",
    descripcion:
      "Registro y acreditación de horas por carnet, importación desde Excel y exportación.",
  },
  {
    // Tutores y postulaciones son dos momentos del mismo trámite, así que se
    // administran juntos en lugar de en dos secciones separadas.
    href: "/admin/tutorias",
    texto: "Tutorías",
    descripcion: "Tutores con sus cursos, postulaciones para ser tutor y catálogo de cursos.",
  },
  {
    href: "/admin/reportes",
    texto: "Reportes",
    descripcion: "Resumen del programa de horas beca, por mes y por estudiante.",
  },
] as const;

export type SeccionAdmin = (typeof SECCIONES_ADMIN)[number];
