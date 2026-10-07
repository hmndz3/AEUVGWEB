# Asociaciones y clubes

Implementado durante el Sprint 3 (HU-13 a HU-16). Cubre las secciones públicas de asociaciones y clubes, su vinculación con los eventos y su administración desde el panel.

## Pantallas

| Ruta                        | Quién entra    | Qué hace                                                         |
| --------------------------- | -------------- | ---------------------------------------------------------------- |
| `/asociaciones`             | Cualquiera     | Listado de asociaciones activas, con buscador y paginación.      |
| `/asociaciones/[id]`        | Cualquiera     | Detalle: descripción, misión, visión, junta, contacto y eventos. |
| `/clubes`                   | Cualquiera     | Listado de clubes activos, con buscador y paginación.            |
| `/clubes/[id]`              | Cualquiera     | Detalle: descripción, actividades, contacto y eventos.           |
| `/admin/asociaciones`       | Administración | Listado con los registros de baja y su conteo de eventos.        |
| `/admin/asociaciones/nueva` | Administración | Creación de una asociación.                                      |
| `/admin/asociaciones/[id]`  | Administración | Edición, junta directiva y redes sociales.                       |
| `/admin/clubes`             | Administración | Listado con los registros de baja y su conteo de eventos.        |
| `/admin/clubes/nueva`       | Administración | Creación de un club.                                             |
| `/admin/clubes/[id]`        | Administración | Edición y redes sociales.                                        |

La asociación general AEUVG queda fuera del listado público y su detalle redirige a `/sobre-aeuvg`, que es su página institucional. Sí aparece en el panel, porque AEUVG administra su propia ficha desde ahí.

## Servicios

Las dos entidades comparten un grupo de endpoints con el tipo en la dirección (`asociaciones` o `clubes`), porque comparten todas sus operaciones y lo único que cambia son los campos propios de cada ficha.

| Endpoint                                                          | Método | Acceso         |
| ----------------------------------------------------------------- | ------ | -------------- |
| `/api/admin/organizaciones/[tipo]`                                | POST   | Administración |
| `/api/admin/organizaciones/[tipo]/[id]`                           | PUT    | Administración |
| `/api/admin/organizaciones/[tipo]/[id]`                           | DELETE | Administración |
| `/api/admin/organizaciones/[tipo]/[id]/estado`                    | PATCH  | Administración |
| `/api/admin/organizaciones/asociaciones/[id]/integrantes`         | POST   | Administración |
| `/api/admin/organizaciones/asociaciones/[id]/integrantes/[idInt]` | PUT    | Administración |
| `/api/admin/organizaciones/asociaciones/[id]/integrantes/[idInt]` | DELETE | Administración |
| `/api/admin/organizaciones/[tipo]/[id]/redes`                     | POST   | Administración |
| `/api/admin/organizaciones/[tipo]/[id]/redes/[idRed]`             | DELETE | Administración |

Un tipo que no sea `asociaciones` ni `clubes` responde 404. Las rutas de integrantes solo aceptan `asociaciones`: el requerimiento no contempla junta directiva para los clubes.

Todas pasan por `protegerRuta`, que responde 401 sin sesión y 404 sin el rol.

## Baja y eliminación

Dar de baja (`activo = false`) es la operación habitual: retira el registro de las pantallas públicas y conserva su historial de eventos. La eliminación definitiva solo se permite cuando el registro no organiza ningún evento; de lo contrario el servicio responde 409 con el mensaje que indica dar de baja, en lugar de dejar que la restricción de `OrganizadorEvento` produzca un error de la base.

## Búsqueda

`asociacion.texto_busqueda` y `club.texto_busqueda` guardan una copia en minúsculas y sin acentos de los campos por los que se busca: nombre, descripción y misión en el caso de una asociación; nombre, descripción y actividades en el de un club. El servicio la recalcula en cada guardado, igual que en los eventos. La normalización vive en `src/lib/busqueda-texto.ts`, compartida por los dos módulos para que la copia se genere con la misma regla.

Se incluye la misión en el texto de una asociación porque muchas explican ahí a qué se dedican, y buscar "voluntariado" debe encontrarlas aunque la palabra no esté en su descripción.

## Vinculación con los eventos

`OrganizadorEvento` ya relacionaba eventos con asociaciones y clubes desde el Sprint 1. En este sprint la relación se recorre en los dos sentidos:

- La página de una asociación o de un club muestra sus actividades publicadas, separadas en próximas y pasadas (`src/lib/organizaciones/eventos-organizador.ts`).
- Los organizadores de un evento enlazan a su página. Una unidad de la universidad no tiene página propia, así que viaja con `href: null` y se pinta como texto.

En la tarjeta de un evento los organizadores siguen siendo texto: la tarjeta entera es un enlace al evento y un enlace dentro de otro no es HTML válido.

## Componentes compartidos

`src/components/organizaciones/` reúne lo que usan las dos secciones: la tarjeta del listado, el encabezado del detalle, los bloques de texto opcionales, la junta directiva, el contacto y los enlaces a redes. La junta directiva es el mismo componente que usa `/sobre-aeuvg` desde este sprint.

Los enlaces a redes se abren en otra pestaña con `rel="noreferrer noopener"`, y la presentación descarta los que no sean `http` o `https`: la validación del panel ya los rechaza, pero la base conserva lo que se cargó antes de este sprint.

## Pendientes para sprints posteriores

- Convocatorias de horas beca asociadas a cada organización (Sprint 5).
- Recomendaciones de asociaciones y clubes según los intereses del estudiante (Sprint 6).
