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

## 3. Variables de entorno

Se configuran en el servicio de la aplicación, pestaña **Variables**. Nunca se suben al repositorio: el `.gitignore` excluye todo archivo `.env`.

| Variable              | Valor                                                                  |
| --------------------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`        | `${{Postgres.DATABASE_URL}}` — referencia literal que Railway resuelve |
| `NEXT_PUBLIC_APP_URL` | dominio generado por Railway, con `https://` y sin barra final         |
| `AUTH_SECRET`         | valor aleatorio propio, generado con `openssl rand -base64 32`         |

`AUTH_SECRET` firmará las sesiones de los usuarios, por lo que debe ser un valor aleatorio generado con el comando indicado y nunca una palabra escogida a mano. `NEXT_PUBLIC_APP_URL` se incrusta durante el build: cambiar su valor exige un nuevo despliegue para que tome efecto.

`RESEND_API_KEY` y `EMAIL_FROM` se agregan cuando se implemente el envío de correos; la aplicación funciona sin ellas. La lista completa vive en [.env.example](../.env.example) y cada variable nueva debe documentarse allí.

## 4. Migraciones de la base de datos

Las migraciones **no** se aplican desde el despliegue. La imagen de producción es un build autocontenido de Next: contiene lo necesario para servir la aplicación, pero no el CLI de Prisma, que arrastra decenas de dependencias de desarrollo. Configurar un Pre-Deploy Command con `prisma migrate deploy` falla con `sh: prisma: not found`, e incluirlo agregaría cientos de megabytes a la imagen. El campo **Settings → Deploy → Pre-Deploy Command** debe quedar vacío.

En su lugar, las migraciones se aplican de forma explícita desde una máquina de desarrollo, usando el CLI de Railway para inyectar las variables del ambiente:

```bash
npm i -g @railway/cli
railway login
railway link
railway run npm run db:migrate:deploy
```

`railway run` ejecuta el comando localmente con `DATABASE_URL` del proyecto, de modo que corre con todas las dependencias disponibles. Se usa `migrate deploy` porque aplica únicamente las migraciones ya versionadas: no genera archivos nuevos ni reinicia datos.

Este paso se repite cada vez que se agrega una migración, después de publicar el cambio en `main`. Que sea explícito es deliberado: un cambio de esquema en producción conviene ejecutarlo de forma consciente y no como efecto secundario de un despliegue.

Los catálogos iniciales (facultades, carreras, categorías y roles) se cargan una sola vez, de la misma forma:

```bash
railway run npx prisma db seed
```

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
