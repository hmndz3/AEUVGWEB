/**
 * Tipos de notificación que emite la plataforma.
 *
 * Viven aparte del módulo que las escribe porque la lista la necesitan también
 * las pantallas, que corren en el navegador: importarla desde el módulo de
 * escritura arrastraría el cliente de la base al paquete del cliente.
 *
 * El tipo se guarda como texto en la base y sirve para agrupar y para elegir
 * el color: no se declara como enum en el esquema porque la lista crece con
 * cada módulo y una migración por aviso nuevo sería desproporcionada.
 */
export const TIPOS_NOTIFICACION = {
  postulacion: "postulacion_tutor",
  tutoria: "tutoria",
  horasBeca: "horas_beca",
  evento: "evento",
} as const;

export type TipoNotificacion = (typeof TIPOS_NOTIFICACION)[keyof typeof TIPOS_NOTIFICACION];

export const ETIQUETAS_TIPO_NOTIFICACION: Record<string, string> = {
  [TIPOS_NOTIFICACION.postulacion]: "Tutorías",
  [TIPOS_NOTIFICACION.tutoria]: "Tutorías",
  [TIPOS_NOTIFICACION.horasBeca]: "Horas beca",
  [TIPOS_NOTIFICACION.evento]: "Eventos",
};

/**
 * Evento del navegador con el que la pantalla de notificaciones avisa al
 * encabezado que cambió el número de avisos sin leer.
 */
export const EVENTO_NOTIFICACIONES = "aeuvg:notificaciones";
