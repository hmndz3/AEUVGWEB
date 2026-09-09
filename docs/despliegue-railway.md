# Despliegue en Railway — Página Web AEUVG

**Tareas:** T-01.4 (proyecto en Railway y despliegue automático) y T-01.5 (variables de entorno).
**Sprint:** 1 — Fundamentos del sistema

## 1. Cómo funciona

```
GitHub (hmndz3/AEUVGWEB), rama main
        │  push
        ▼
Railway ──► build con Dockerfile ──► aplicación + PostgreSQL
```

- Railway construye la imagen con el `Dockerfile` del repositorio; `railway.json` fija ese constructor.
- Cada push a `main` genera automáticamente un nuevo despliegue.
- El build genera el cliente de Prisma (`npm run build` ejecuta `prisma generate`), por lo que no necesita conexión a la base de datos.
- El trabajo del sprint se integra en `develop` y se publica al hacer merge a `main`.

## 2. Crear el proyecto

1. Crear la cuenta en [railway.com](https://railway.com) y contratar el plan **Hobby (US$5/mes)**.
2. **New Project → Deploy from GitHub repo** → autorizar el acceso y seleccionar `hmndz3/AEUVGWEB`.
3. En el servicio creado: **Settings → Source** → rama **`main`**.
4. Agregar la base de datos: **Create → Database → PostgreSQL**.
5. Publicar la aplicación: **Settings → Networking → Generate Domain**, puerto **3000**.

Railway inyecta su propia variable `PORT` en tiempo de ejecución, que tiene prioridad sobre la del `Dockerfile`. Si el puerto que recibe la aplicación no coincide con el del dominio, el sitio responde `502 Application failed to respond` aunque el servicio aparezca en línea. Para que ambos coincidan se define `PORT=3000` como variable del servicio.

## 3. Variables de entorno

Se configuran en el servicio de la aplicación, pestaña **Variables**. Nunca se suben al repositorio: el `.gitignore` excluye todo archivo `.env`.

| Variable                                     | Valor                                                                  |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`                               | `${{Postgres.DATABASE_URL}}` — referencia literal que Railway resuelve |
| `NEXT_PUBLIC_APP_URL`                        | dominio generado por Railway, con `https://` y sin barra final         |
| `INSTITUTIONAL_EMAIL_DOMAIN`                 | `uvg.edu.gt`, sin arroba                                               |
| `EMAIL_VERIFICATION_TOKEN_TTL_MINUTES`       | `30`                                                                   |
| `EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS` | `60`                                                                   |
| `EMAIL_VERIFICATION_RESEND_MAX_PER_HOUR`     | `5`                                                                    |
| `EMAIL_PROVIDER`                             | `resend` en pruebas y producción                                       |
| `RESEND_API_KEY`                             | clave de envío creada en Resend, nunca versionada                      |
| `EMAIL_FROM`                                 | remitente perteneciente a un dominio verificado en Resend              |
| `AUTH_SECRET`                                | valor aleatorio propio, generado con `openssl rand -base64 32`         |
| `PORT`                                       | `3000`, para que coincida con el puerto del dominio                    |

`AUTH_SECRET` firmará las sesiones de los usuarios, por lo que debe ser un valor aleatorio generado con el comando indicado y nunca una palabra escogida a mano. `NEXT_PUBLIC_APP_URL` se incrusta durante el build: cambiar su valor exige un nuevo despliegue para que tome efecto.

El registro solo permite `EMAIL_PROVIDER=memory` fuera de producción. Railway debe usar `resend` y
un dominio de remitente verificado; de lo contrario, la cuenta puede crearse pero el mensaje no se
entrega. El detalle del flujo está en [registro-estudiantes.md](registro-estudiantes.md). La lista
completa vive en [.env.example](../.env.example).

## 4. Migraciones de la base de datos

Las migraciones **no** se aplican desde el despliegue. La imagen de producción es un build autocontenido de Next: contiene lo necesario para servir la aplicación, pero no el CLI de Prisma, que arrastra decenas de dependencias de desarrollo. Configurar un Pre-Deploy Command con `prisma migrate deploy` falla con `sh: prisma: not found`, e incluirlo agregaría cientos de megabytes a la imagen. El campo **Settings → Deploy → Pre-Deploy Command** debe quedar vacío.

En su lugar se aplican de forma explícita desde una máquina de desarrollo, que sí cuenta con todas las dependencias. El `DATABASE_URL` del proyecto apunta a `postgres.railway.internal`, un nombre que solo resuelve dentro de la red privada de Railway, por lo que `railway run` no basta: hace falta una ruta pública hacia la base.

Para abrirla, en el servicio **Postgres**: **Settings → Public Networking → TCP Proxy**, puerto `5432`. Railway entrega un host y un puerto públicos.

Con el CLI de Railway autenticado y el proyecto enlazado:

```bash
npm i -g @railway/cli
railway login
railway link
```

El script [`scripts/db/railway.js`](../scripts/db/railway.js) obtiene el endpoint del proxy y las credenciales del servicio, arma la cadena de conexión y se la entrega al comando de Prisma por variable de entorno, sin escribirla en disco. Se usa a través de estos scripts:

```bash
npm run db:railway:status    # revisar qué migraciones están aplicadas
npm run db:railway:migrate   # aplicar las migraciones pendientes
npm run db:railway:seed      # cargar los catálogos iniciales
```

Se usa `migrate deploy` porque aplica únicamente las migraciones ya versionadas: no genera archivos nuevos ni reinicia datos. El seed de catálogos es idempotente y se ejecuta una sola vez por ambiente.

**Al terminar conviene eliminar el TCP Proxy**, para que la base deje de estar accesible desde internet. Se vuelve a habilitar cuando haya una migración nueva. Mantenerlo activo de forma permanente solo se justifica si el equipo necesita conectarse con un cliente gráfico como DBeaver o pgAdmin, y en ese caso la contraseña generada por Railway no debe compartirse ni versionarse.

Este paso se repite cada vez que se agrega una migración, después de publicar el cambio en `main`. Que sea explícito es deliberado: un cambio de esquema en producción conviene ejecutarlo de forma consciente y no como efecto secundario de un despliegue.

## 5. Verificación

- [ ] El dominio público responde y muestra la aplicación.
- [ ] `GET /api/health` devuelve `{"estado":"ok","baseDatos":"conectada"}`.
- [ ] Un push a `main` genera un despliegue nuevo en el panel de Railway.
- [ ] Los respaldos automáticos de PostgreSQL están habilitados (**Database → Backups**).

Si `/api/health` responde con estado `error`, la aplicación no alcanza la base: revisar que `DATABASE_URL` esté definida en el servicio y que apunte al PostgreSQL del proyecto. La verificación consulta la conexión, no el esquema, por lo que responde `ok` aunque las migraciones todavía no se hayan aplicado.

## 6. Dominio institucional (en trámite)

Cuando la universidad apruebe el dominio `.uvg.gt`:

1. **Settings → Networking → Custom Domain** → agregar `aeuvg.uvg.gt`.
2. Railway mostrará un registro **CNAME**; solicitar a TI de la UVG que lo cree apuntando al dominio de Railway.
3. Actualizar `NEXT_PUBLIC_APP_URL` con el dominio definitivo.
