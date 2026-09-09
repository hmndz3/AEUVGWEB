# Inicio de sesión y sesiones — T-04.3

## Decisión técnica

Las contraseñas se derivan con `scrypt` nativo de Node.js usando N=16384, r=8, p=1, una sal aleatoria de 16 bytes y una clave derivada de 64 bytes. El texto plano no se persiste, registra ni devuelve. La verificación acepta únicamente ese formato y compara el resultado con `timingSafeEqual`.

Se eligió una sesión stateless firmada con `jose` (JWT HS256), almacenada exclusivamente en la cookie `aeuvg_session`. Es una solución adecuada para el monolito actual: no requiere una tabla o limpieza periódica de sesiones, y permite que T-04.4 cierre sesión borrando la cookie. El token contiene solo el identificador interno del usuario, emisor, audiencia, emisión, expiración y un identificador aleatorio; no contiene contraseña ni correo.

La cookie es `HttpOnly`, `SameSite=Lax`, tiene `Secure` en producción, ruta `/` y expiración configurable. Cada endpoint protegido vuelve a consultar el usuario y exige que permanezca activo y con correo verificado.

## Endpoints

- `POST /api/auth/iniciar-sesion`: valida credenciales, limita intentos y crea la cookie de sesión.
- `GET /api/auth/sesion`: endpoint protegido que devuelve la identidad mínima de la sesión válida. T-04.4 puede consumirlo para reflejar el estado en la interfaz.

Los correos inexistentes, contraseñas incorrectas y cuentas sin verificar comparten la misma respuesta HTTP 401 para no revelar cuál condición falló. Después de cinco fallos por combinación de dirección cliente y correo, se responde 429 durante quince minutos.

## Variables

| Variable                 | Propósito                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------ |
| `AUTH_SECRET`            | Secreto de al menos 32 bytes para firmar JWT; generar con `openssl rand -base64 32`. |
| `SESSION_DURATION_HOURS` | Duración entre 1 y 168 horas; el ejemplo usa 8.                                      |

## Desarrollo

Con los datos ficticios cargados, la cuenta local es `estudiante.prueba@uvg.edu.gt` con contraseña `PruebaSegura1!`. Es exclusiva de desarrollo; no debe cargarse en Railway ni producción.
