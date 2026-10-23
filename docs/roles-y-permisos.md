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

Para revisar la plataforma sin usar una cuenta personal existen cinco cuentas de demostración:

| Cuenta                       | Carnet      | Nombre                        | Roles                      |
| ---------------------------- | ----------- | ----------------------------- | -------------------------- |
| `demo.estudiante@uvg.edu.gt` | `DEMO-0001` | [DEMO] Estudiante             | Estudiante                 |
| `demo.admin@uvg.edu.gt`      | `DEMO-0002` | [DEMO] Administrador          | Estudiante y administrador |
| `mor24117@uvg.edu.gt`        | `24117`     | Ana Lucía Morales Castillo    | Estudiante                 |
| `rui24263@uvg.edu.gt`        | `24263`     | Diego Alejandro Ruiz Herrera  | Estudiante                 |
| `ort24518@uvg.edu.gt`        | `24518`     | Gabriela Fernanda Ortiz López | Estudiante                 |

Las tres últimas se agregaron en el Sprint 4 para mostrar el módulo de horas beca con varias personas. A diferencia de las dos primeras, **no llevan el marcador `[DEMO]`**: usan nombre, carnet de cinco dígitos y correo institucional con el formato real, para que la demostración ante AEUVG no se vea poblada de datos evidentemente falsos.

Esa decisión tiene una contrapartida: no se distinguen a simple vista de una cuenta real. Por eso la base se reinicia antes de la puesta en producción definitiva, y mientras tanto se identifican por los carnets de esta tabla. Se indica el carnet porque es el dato con el que se les registran las horas desde el panel.

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
