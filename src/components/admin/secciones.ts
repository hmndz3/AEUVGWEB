/** Secciones del panel administrativo. El orden define el de la barra lateral. */
export const SECCIONES_ADMIN = [
  { href: "/admin", texto: "Resumen", descripcion: "Indicadores generales de la plataforma." },
  {
    href: "/admin/eventos",
    texto: "Eventos",
    descripcion: "Creación, edición y publicación de eventos.",
  },
  {
    href: "/admin/calendario",
    texto: "Calendario",
    descripcion: "Vista mensual de las actividades programadas.",
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
    descripcion: "Registro, acreditación, importación y exportación de horas.",
  },
  {
    href: "/admin/oportunidades",
    texto: "Oportunidades de horas",
    descripcion: "Convocatorias para realizar horas beca con AEUVG.",
  },
  {
    href: "/admin/tutores",
    texto: "Tutores",
    descripcion: "Tutores activos, cursos que imparten y disponibilidad.",
  },
  {
    href: "/admin/postulaciones",
    texto: "Postulaciones",
    descripcion: "Solicitudes de estudiantes para convertirse en tutores.",
  },
  {
    href: "/admin/estudiantes",
    texto: "Estudiantes",
    descripcion: "Cuentas registradas y su estado de verificación.",
  },
  {
    href: "/admin/reportes",
    texto: "Reportes",
    descripcion: "Generación de reportes en Excel y PDF.",
  },
] as const;

export type SeccionAdmin = (typeof SECCIONES_ADMIN)[number];
