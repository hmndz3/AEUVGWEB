# Módulo de eventos

Implementado durante el Sprint 2 (HU-07 a HU-12). Cubre la cartelera pública, el calendario, los filtros y la administración de eventos desde el panel.

## Pantallas

| Ruta                   | Quién entra    | Qué hace                                            |
| ---------------------- | -------------- | --------------------------------------------------- |
| `/eventos`             | Cualquiera     | Cartelera con filtros, buscador y paginación.       |
| `/eventos/[id]`        | Cualquiera     | Detalle de un evento publicado.                     |
| `/calendario`          | Cualquiera     | Vista mensual y semanal; agenda en teléfono.        |
| `/admin/eventos`       | Administración | Listado con todos los estados, búsqueda y acciones. |
| `/admin/eventos/nuevo` | Administración | Creación de un evento.                              |
| `/admin/eventos/[id]`  | Administración | Edición de un evento.                               |

## Servicios

| Endpoint                         | Método | Acceso         |
| -------------------------------- | ------ | -------------- |
| `/api/eventos`                   | GET    | Público        |
| `/api/eventos/[id]`              | GET    | Público        |
| `/api/admin/eventos`             | POST   | Administración |
| `/api/admin/eventos/[id]`        | PUT    | Administración |
| `/api/admin/eventos/[id]`        | DELETE | Administración |
| `/api/admin/eventos/[id]/estado` | PATCH  | Administración |
| `/api/admin/eventos/imagen`      | POST   | Administración |

Las rutas de administración pasan por `protegerRuta`, que responde 401 sin sesión y 404 sin el rol, para no confirmar la existencia de la ruta a quien no puede usarla.

## Estados de un evento

`EstadoEvento` guarda cuatro valores: `BORRADOR`, `PUBLICADO`, `CANCELADO` y `FINALIZADO`. Lo que ve el estudiante se deriva además de las fechas (`src/lib/eventos/estado-evento.ts`), porque nadie marca un evento como finalizado a mano cuando pasa su fecha.

Reglas de las transiciones (`src/lib/eventos/servicio-eventos.ts`):

- Todo evento nuevo nace como borrador; publicarlo es una decisión aparte.
- Los organizadores son opcionales: AEUVG publica actividades propias que no corresponden a ninguna asociación ni club. Cuando se indican, el primero (asociación, club, unidad de UVG, en ese orden) queda como organizador principal.
- Un evento finalizado no vuelve a publicarse ni puede cancelarse.
- Un evento publicado que ya inició no se elimina, solo se cancela: forma parte del historial de AEUVG y puede estar referenciado por los eventos guardados de los estudiantes.
- Solo los eventos publicados aparecen en la cartelera, en el calendario, en la portada y en el detalle público.

## Fechas y zona horaria

Las fechas se guardan en UTC (`timestamptz`) y se presentan siempre en la zona de Guatemala, sin importar la del navegador o la del servidor. Guatemala usa UTC-6 todo el año, por lo que el desplazamiento está escrito fijo en `src/lib/eventos/formato-fechas.ts` y se reutiliza desde ahí.

Los filtros por fecha y la grilla del calendario convierten el día calendario al instante correspondiente antes de consultar, o un evento de las siete de la noche quedaría fuera de su propio día.

## Búsqueda

`evento.texto_busqueda` guarda una copia en minúsculas y sin acentos de nombre, descripción y ubicación. El servicio la recalcula en cada guardado. El detalle de la decisión está en [docs/modelo-datos.md](modelo-datos.md).

## Imágenes

El sistema de archivos de Railway es efímero, así que las imágenes se guardan en un servicio externo detrás de la interfaz `ProveedorImagenes` (`src/lib/imagenes/proveedor-imagenes.ts`). La variable `IMAGE_PROVIDER` decide cuál se usa:

- `ninguno` (predeterminado): no hay subida de archivos; el formulario acepta la dirección de una imagen externa.
- `memoria`: solo desarrollo; conserva la imagen en memoria y no sale a la red.
- `cloudinary`: subida firmada desde el servidor, con la clave secreta fuera del navegador.

Se aceptan JPEG, PNG y WebP hasta el tamaño de `IMAGE_MAX_MB` (3 MB de forma predeterminada, con un tope de 10). El límite es bajo a propósito: la aplicación corre en el plan más pequeño de Railway y una subida grande ocuparía memoria del mismo proceso que atiende al resto del sitio.

Un evento sin imagen se muestra con un marcador del color de su categoría, no con un espacio roto.

## Pendientes para sprints posteriores

- Guardar eventos en el perfil del usuario (Sprint 3).
- Páginas de asociaciones y clubes enlazadas desde los organizadores de cada evento (Sprint 3).
- Recordatorios de eventos próximos (Sprint 6).
