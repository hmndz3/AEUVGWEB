# Registro y verificación de estudiantes — T-04.2

## Flujo implementado

1. `GET /api/catalogos/academicos` obtiene únicamente facultades y carreras activas.
2. `POST /api/auth/registro` vuelve a validar todos los datos, incluido el dominio institucional y la relación facultad-carrera.
3. Una transacción crea `Estudiante`, `Usuario` pendiente, su rol `ESTUDIANTE` y un token de verificación. La contraseña se deriva con `scrypt`; el token aleatorio nunca se guarda, solo su hash SHA-256.
4. El usuario recibe un enlace hacia `/verificar-correo`. `POST /api/auth/verificar-correo` consume el token una sola vez y activa la cuenta.
5. `POST /api/auth/reenviar-verificacion` invalida tokens vigentes antes de crear otro. Aplica una espera mínima y un máximo por hora, y su respuesta no revela si la cuenta existe.

La migración `20260909000000_add_email_verification_tokens` agrega la tabla que permite auditar vigencia, uso e invalidación de los enlaces. El borrado en cascada se limita a estos tokens, que no tienen sentido sin su usuario.

## Correo local y real

`EMAIL_PROVIDER=memory` no realiza conexiones ni escribe mensajes en la terminal. Está destinado al desarrollo y a las pruebas automatizadas; el proceso conserva temporalmente el mensaje en memoria y se bloquea explícitamente si `NODE_ENV=production`.

Para envíos reales se usa `EMAIL_PROVIDER=brevo`, con `BREVO_API_KEY` y un `EMAIL_FROM` verificado como remitente en Brevo; es el proveedor de producción mientras AEUVG no tenga dominio propio. `EMAIL_PROVIDER=resend` sigue disponible, con `RESEND_API_KEY` y un remitente de un dominio verificado en Resend. Las dos integraciones usan HTTPS detrás de `ProveedorCorreo`, de manera que pueden sustituirse sin cambiar el servicio de registro; la configuración en Railway está en [despliegue-railway.md](despliegue-railway.md). Un fallo de envío deja en el registro del servidor solo el motivo, nunca el destinatario ni el enlace.

## Variables

| Variable                                     | Propósito                                                 |
| -------------------------------------------- | --------------------------------------------------------- |
| `INSTITUTIONAL_EMAIL_DOMAIN`                 | Dominio exacto permitido, sin `@`                         |
| `NEXT_PUBLIC_APP_URL`                        | Origen usado para construir el enlace de verificación     |
| `EMAIL_VERIFICATION_TOKEN_TTL_MINUTES`       | Vigencia del enlace                                       |
| `EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS` | Espera mínima entre solicitudes                           |
| `EMAIL_VERIFICATION_RESEND_MAX_PER_HOUR`     | Máximo de tokens creados por cuenta en una hora           |
| `EMAIL_PROVIDER`                             | `memory` en desarrollo/pruebas; `brevo` o `resend` real   |
| `BREVO_API_KEY`                              | Credencial de Brevo; obligatoria solo para ese proveedor  |
| `RESEND_API_KEY`                             | Credencial de Resend; obligatoria solo para ese proveedor |
| `EMAIL_FROM`                                 | Remitente verificado en el proveedor elegido              |

## Límite de esta tarea

No se implementaron sesiones ni el endpoint de inicio de sesión. T-04.3 debe validar la contraseña con `verificarContrasena` y aplicar `puedeAutenticarse`; esta última exige simultáneamente estado `ACTIVO` y `correoVerificado=true`.

## Cuenta ficticia de desarrollo

Después de aplicar migraciones y ejecutar `ALLOW_TEST_SEED=true npm run db:seed:test`, la base local incluye la cuenta ficticia `estudiante.prueba@uvg.edu.gt` con contraseña `PruebaSegura1!`. Nunca debe cargarse ese seed ni esas credenciales en Railway o producción.
