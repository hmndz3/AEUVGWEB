# Seguridad de la plataforma

Qué protege cada cosa y por qué está puesta así. El orden sigue el OWASP Top 10
de 2021, que es la lista contra la que se revisó el proyecto.

## A01 · Control de acceso

La autorización se decide **siempre en el servidor y contra la base**, nunca en
el navegador. El menú del encabezado y el proxy solo mejoran la experiencia.

- Las páginas usan `verificarAcceso([ROLES.x])` (`src/lib/auth/guardias.ts`).
- Las rutas de API usan `protegerRuta([ROLES.x])`, que envuelve el manejador.
  Las 42 rutas bajo `/api/admin/**` exigen `ADMINISTRADOR`; las del salón de
  batas exigen `VOLUNTARIO`; el resto, sesión.
- Sin sesión se responde **401**; con sesión pero sin permiso, **404**, para no
  confirmarle a nadie que la ruta existe.
- Lo que se consulta por identificador se acota por dueño en la consulta misma:
  una notificación por `idUsuario`, una franja de disponibilidad por `idTutor`,
  una tutoría por su tutor o su estudiante. No hay ninguna ruta que confíe en
  el identificador que viene en la dirección.
- Las peticiones que escriben comprueban el origen
  (`src/lib/seguridad/origen.ts`): una lanzada desde otra página se rechaza con
  **403** aunque la cookie sea válida. Es la segunda barrera contra la
  falsificación de peticiones entre sitios; la primera es `SameSite=Lax` en la
  cookie de sesión.

## A02 · Fallos criptográficos

- Las contraseñas se derivan con **scrypt**, N=2^14, r=8, **p=5**, sal de 16
  bytes al azar y salida de 64 bytes, comparada con `timingSafeEqual`. Es una
  de las combinaciones mínimas que publica OWASP; se eligió la que sube el
  costo sin subir la memoria, porque la plataforma corre en el plan más pequeño
  de Railway y las combinaciones de 128 MB por intento convertirían un puñado
  de accesos simultáneos en una caída.
- El hash guarda sus propios parámetros y la verificación los lee de ahí, con
  topes para que un hash manipulado no agote la memoria. Al entrar con un hash
  más flojo se vuelve a derivar con el costo de hoy (`necesitaRehacerse`): el
  costo sube sin dejar a nadie fuera.
- La sesión es un JWT firmado con HS256 y `AUTH_SECRET`, que se exige de al
  menos 32 bytes. La cookie es `HttpOnly`, `SameSite=Lax` y `Secure` en
  producción.
- Los tokens de verificación y de recuperación son 32 bytes al azar y en la
  base solo vive su **SHA-256**: quien lea la tabla no puede usarlos.
- El hash de comparación falsa del inicio de sesión lleva los parámetros
  vigentes, de modo que un correo inexistente cueste lo mismo que uno real y no
  se pueda averiguar qué cuentas existen midiendo el tiempo.

## A03 · Inyección

- Todo el acceso a datos pasa por **Prisma**, que parametriza. La única consulta
  cruda es `SELECT 1` del chequeo de salud, sin interpolación.
- Toda entrada se valida con esquemas **Zod** antes de llegar a un servicio.
- React escapa lo que pinta. El único `dangerouslySetInnerHTML` del proyecto es
  el guion del tema, una constante del propio código, y va marcado con el
  número de un solo uso de la política de contenidos.
- La política de contenidos solo deja correr los guiones marcados con ese
  número (`'strict-dynamic'`, sin `'unsafe-inline'`), de modo que una etiqueta
  inyectada no se ejecutaría aunque llegara a colarse.

## A04 · Diseño inseguro

Los topes de intentos (`src/lib/seguridad/limitador.ts`) están donde un abuso
sale barato:

| Formulario              | Tope        | Clave              |
| ----------------------- | ----------- | ------------------ |
| Inicio de sesión        | 5 / 15 min  | dirección + correo |
| Inicio de sesión        | 30 / 15 min | dirección          |
| Registro                | 5 / 1 h     | dirección          |
| Recuperar contraseña    | 5 / 1 h     | dirección          |
| Reenviar verificación   | 5 / 1 h     | dirección          |
| Restablecer / verificar | 10 / 15 min | dirección          |

El segundo tope del inicio de sesión es el que corta a quien prueba una
contraseña común contra muchos correos distintos: sin él, cada correo empezaría
su cuenta de cero. Los de recuperación y reenvío van por dirección y no por
correo para que la respuesta siga sin revelar qué cuentas existen.

El conteo vive en memoria del proceso. Con un solo contenedor basta; si algún
día hubiera varios, cada uno llevaría su cuenta y el tope real se multiplicaría
por el número de contenedores.

## A05 · Configuración insegura

Cabeceras en toda respuesta (`src/lib/seguridad/cabeceras.ts`, declaradas en
`next.config.ts` y en `src/proxy.ts`):

| Cabecera                     | Valor                                          |
| ---------------------------- | ---------------------------------------------- |
| `Content-Security-Policy`    | con número de un solo uso, ver abajo           |
| `Strict-Transport-Security`  | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options`     | `nosniff`                                      |
| `X-Frame-Options`            | `DENY`                                         |
| `Referrer-Policy`            | `strict-origin-when-cross-origin`              |
| `Permissions-Policy`         | cámara, micrófono y ubicación apagados         |
| `Cross-Origin-Opener-Policy` | `same-origin`                                  |
| `X-DNS-Prefetch-Control`     | `off`                                          |

Además, `poweredByHeader: false`: el sitio deja de anunciar el marco y su
versión, que es información gratis para quien busca una vulnerabilidad conocida.

La política de contenidos queda así:

```
default-src 'self'; script-src 'self' 'nonce-…' 'strict-dynamic';
style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:;
font-src 'self' data:; connect-src 'self'; media-src 'self'; object-src 'none';
base-uri 'self'; form-action 'self'; frame-ancestors 'none'; frame-src 'none';
upgrade-insecure-requests
```

Dos directivas son menos estrictas a propósito y conviene saber por qué:

- `style-src` admite estilos en línea porque el marco escribe etiquetas de
  estilo propias al pintar en el servidor. Un estilo inyectado afea la página;
  no ejecuta código.
- `img-src` admite cualquier `https:` porque el panel sí permite pegar el
  enlace de una imagen alojada fuera, y así está validado en los formularios de
  eventos y de organizaciones. Cerrarlo a una lista de dominios rompería esa
  función sin cerrar ningún camino para ejecutar código.

El número de un solo uso se genera en `src/proxy.ts` —renombrado desde
`middleware.ts`, que el marco marcó como obsoleto— y viaja a la página por una
cabecera de la petición.

## A06 · Componentes vulnerables

`npm audit` queda sin avisos críticos ni de alta gravedad en lo que llega a
producción. Lo que permanece, y por qué:

- **exceljs → uuid (moderada).** El fallo pide llamar a `uuid` v3/v5/v6 con un
  búfer propio; exceljs usa v4. La única corrección que ofrece npm es bajar
  exceljs a 3.4.0, que rompería las plantillas y la carga por Excel.
- **prisma → @prisma/config → effect / deepmerge-ts (alta).** Viven en el CLI
  de Prisma, que es una dependencia de desarrollo: se usa al generar el cliente
  y al aplicar migraciones, y no se despliega. La corrección que ofrece npm es
  bajar Prisma a la 6, que rompería el esquema.

Conviene volver a correr `npm audit` cada vez que se toque `package.json`.

## A07 · Fallos de identificación y autenticación

- El inicio de sesión responde siempre lo mismo ante un correo inexistente y
  ante una contraseña incorrecta, y cuesta lo mismo en tiempo.
- La recuperación y el reenvío responden lo mismo exista o no la cuenta.
- La sesión vence sola (`SESSION_DURATION_HOURS`, entre 1 y 168 horas) y cerrar
  sesión borra la cookie.
- Las cuentas nacen con el correo sin verificar y no pueden entrar hasta
  verificarlo.
- **Queda abierto:** la sesión es un token firmado y sin estado, así que cerrar
  sesión no invalida un token ya emitido; si alguien lo robara, serviría hasta
  su vencimiento. Cerrarlo del todo pide guardar las sesiones en la base.

## A08 · Fallos de integridad

- Lo que se sube se comprueba por su **contenido**, no por lo que declara quien
  sube: los primeros bytes tienen que ser los de un JPEG, un PNG o un WebP
  (`validarContenidoImagen`). El formato que se guarda sale de ahí.
- El nombre del archivo lo genera el servidor (32 dígitos hexadecimales) y la
  ruta que lo sirve solo acepta ese patrón, de modo que no hay forma de pedir
  un archivo de otra carpeta.
- El tamaño máximo es configurable entre 1 y 10 MB, con 3 MB por omisión.

## A09 · Registro y monitoreo

`src/lib/seguridad/registro-seguridad.ts` anota, en una línea de JSON por
hecho: accesos correctos y fallidos, topes alcanzados, permisos denegados,
orígenes rechazados y subidas rechazadas. Sale por la salida de errores del
proceso, que es lo que Railway conserva, y no por la base: estos hechos tienen
que poder anotarse aunque la base sea justamente lo que falla.

Nunca entran ahí contraseñas, tokens ni cookies. El correo va recortado
(`est…@uvg.edu.gt`): sirve para seguir un intento repetido sin dejar el
directorio de la universidad escrito en los registros.

## A10 · Petición falsificada del lado del servidor

La única función que pide una dirección que escribe otra persona es la descarga
de la imagen de una plantilla de Excel (`src/lib/importacion/descarga-imagen.ts`).
Antes de pedirla: resuelve el nombre, rechaza las direcciones privadas, de
bucle local, de enlace local y las de metadatos de la nube, y vuelve a
comprobarlo después de cada redirección. Además tiene tope de tiempo y de
tamaño, y comprueba que lo descargado sea de verdad una imagen.

## Cómo comprobarlo

```bash
npm test
```

```bash
npm audit --omit=dev
```

Y contra la aplicación levantada:

```bash
curl -s -D - -o /dev/null http://localhost:3000/ | grep -i "content-security\|strict-transport\|x-frame"
```
