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
    // Las convocatorias para realizar horas viven dentro de esta sección: son
    // el origen de los registros que aquí mismo se acreditan.
    href: "/admin/horas-beca",
    texto: "Horas beca",
    descripcion:
      "Registro y acreditación de horas, convocatorias para realizarlas, importación y exportación.",
  },
  {
    // Tutores y postulaciones son dos momentos del mismo trámite, así que se
    // administran juntos en lugar de en dos secciones separadas.
    href: "/admin/tutorias",
    texto: "Tutorías",
    descripcion:
      "Postulaciones de estudiantes, tutores activos, cursos que imparten y disponibilidad.",
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
