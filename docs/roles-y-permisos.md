# Roles, permisos y panel administrativo

**Historia de usuario:** HU-05 — Roles, permisos y acceso al panel administrativo.

## 1. Roles

El catálogo `rol` se carga con los catálogos iniciales y define tres roles:

| Rol             | Alcance                                                            |
| --------------- | ------------------------------------------------------------------ |
| `ESTUDIANTE`    | Rol predeterminado. Se asigna automáticamente al crear una cuenta. |
| `TUTOR`         | Se otorga al aprobar una postulación de tutoría (Sprint 6).        |
| `ADMINISTRADOR` | Acceso al panel administrativo y a los servicios de gestión.       |

Un usuario puede tener más de un rol. Los nombres desconocidos que aparezcan en la base se descartan al leerlos, de modo que un registro manual erróneo no concede permisos.

## 2. Dónde se decide la autorización

La comprobación real ocurre **siempre en el servidor**, en `src/lib/auth/guardias.ts`:

- `verificarAcceso(roles)` resuelve la sesión desde la cookie, carga el usuario con sus roles y responde `autorizado`, `sin_sesion` o `sin_permiso`.
- `protegerRuta(roles, manejador)` envuelve un manejador de API. Responde `401` sin sesión y `404` sin permiso, para no confirmar que la ruta existe ante quien no debe verla.

Las otras dos capas son solo de experiencia de uso y **no protegen nada por sí solas**:

- El **middleware** (`src/middleware.ts`) evita mostrar pantallas privadas a quien no inició sesión. Solo valida la firma y la vigencia de la cookie, porque no puede consultar la base de datos.
- La **navegación** oculta los enlaces que el rol no puede usar.

Quien llegue directamente a una ruta protegida vuelve a pasar por la comprobación del servidor.

## 3. Cuentas de administrador

Las cuentas de administrador no se crean desde la plataforma: se otorgan de forma explícita con un script.

```bash
ADMIN_PASSWORD='una-contraseña-larga' npm run db:admin -- \
  --carnet 24089 --nombre "Nombre Apellido" --correo persona@uvg.edu.gt
```

Contra la base de Railway, con el TCP Proxy habilitado:

```bash
ADMIN_PASSWORD='una-contraseña-larga' npm run db:railway:admin -- \
  --carnet 24089 --nombre "Nombre Apellido" --correo persona@uvg.edu.gt
```

Consideraciones:

- La contraseña se lee de `ADMIN_PASSWORD` y nunca se pasa como argumento, para que no quede en el historial del shell ni en la lista de procesos.
- El script es idempotente: si la cuenta ya existe, solo la activa y le asigna el rol, sin tocar su contraseña.
- Las cuentas creadas así quedan activas y con el correo verificado, porque no pasan por el flujo de registro.
- La contraseña usada debe cambiarse desde la plataforma en el primer acceso.

## 4. Verificación

- [ ] Una cuenta de estudiante no ve el enlace al panel y recibe `404` al entrar a `/admin`.
- [ ] Una cuenta sin sesión es redirigida a `/iniciar-sesion` al entrar a `/admin` o `/perfil`.
- [ ] Una cuenta de administrador ve el enlace al panel y accede a sus secciones.
- [ ] `GET /api/admin/resumen` responde `401` sin sesión y `404` con una cuenta sin el rol.

## 5. Cuentas de demostración

Para revisar la plataforma sin usar una cuenta personal existen dos cuentas de demostración:

| Cuenta                       | Roles                      |
| ---------------------------- | -------------------------- |
| `demo.estudiante@uvg.edu.gt` | Estudiante                 |
| `demo.admin@uvg.edu.gt`      | Estudiante y administrador |

Se crean o se rotan con:

```bash
npm run db:demo          # base local
npm run db:railway:demo  # base de Railway, con el TCP Proxy habilitado
```

Las contraseñas **no están en el repositorio**: se generan al momento y se escriben en `credenciales-demo.local.txt`, que el `.gitignore` excluye. Volver a ejecutar el comando genera contraseñas nuevas.

Esta es la diferencia con el seed de datos ficticios (`db:seed:test`), cuya contraseña sí está versionada y que por eso se niega a ejecutarse en producción: una contraseña publicada en el repositorio, sobre una cuenta con rol de administrador, equivaldría a dejar el panel abierto.

Para saber quién tiene acceso al panel:

```bash
npm run db:railway:admins
```
