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

`RESEND_API_KEY` y `EMAIL_FROM` se agregan cuando se implemente el envío de correos; la aplicación funciona sin ellas. La lista completa vive en [.env.example](../.env.example) y cada variable nueva debe documentarse allí.

## 4. Migraciones de la base de datos

El contenedor solo ejecuta la aplicación, así que las migraciones se aplican en un paso previo. En el servicio: **Settings → Deploy → Pre-Deploy Command**:

```
npm run db:migrate:deploy
```

Railway lo ejecuta después del build y antes de reemplazar la versión en línea, de modo que el esquema queda actualizado antes de recibir tráfico. Se usa `prisma migrate deploy` porque aplica únicamente las migraciones ya versionadas: no genera archivos nuevos ni reinicia datos.

Los catálogos iniciales (facultades, carreras, categorías y roles) se cargan una sola vez con `npx prisma db seed` apuntando a la base de Railway. No forman parte del despliegue automático.

## 5. Verificación

- [ ] El dominio público responde y muestra la aplicación.
- [ ] `GET /api/health` devuelve `{"estado":"ok","baseDatos":"conectada"}`.
- [ ] Un push a `main` genera un despliegue nuevo en el panel de Railway.
- [ ] Los respaldos automáticos de PostgreSQL están habilitados (**Database → Backups**).

Si `/api/health` responde con estado `error`, la aplicación no alcanza la base: revisar que `DATABASE_URL` esté definida y que el Pre-Deploy Command haya aplicado las migraciones.

## 6. Dominio institucional (en trámite)

Cuando la universidad apruebe el dominio `.uvg.gt`:

1. **Settings → Networking → Custom Domain** → agregar `aeuvg.uvg.gt`.
2. Railway mostrará un registro **CNAME**; solicitar a TI de la UVG que lo cree apuntando al dominio de Railway.
3. Actualizar `NEXT_PUBLIC_APP_URL` con el dominio definitivo.
