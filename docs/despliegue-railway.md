# Despliegue en Railway — Página Web AEUVG

**Tareas:** T-01.4 (proyecto en Railway y despliegue automático) y T-01.5 (variables de entorno por ambiente).
**Sprint:** 1 — Fundamentos del sistema

## 1. Arquitectura de despliegue

```
GitHub (hmndz3/AEUVGWEB)
   ├── rama main    ──► Railway environment "production"  ──► app + PostgreSQL
   └── rama develop ──► Railway environment "pruebas"     ──► app + PostgreSQL
```

- Railway construye la aplicación usando el `Dockerfile` del repositorio (configurado en `railway.json`).
- Cada push a la rama conectada genera automáticamente un nuevo despliegue.
- Cada ambiente tiene su propia base de datos y sus propias variables de entorno.

## 2. Creación del proyecto (una sola vez)

1. Crear cuenta en [railway.com](https://railway.com) con el correo del equipo y contratar el plan **Hobby (US$5/mes)**.
2. **New Project → Deploy from GitHub repo** → autorizar acceso y seleccionar `hmndz3/AEUVGWEB`.
3. En el servicio creado: **Settings → Branch** → seleccionar `main`. Railway detecta el `Dockerfile` automáticamente.
4. Agregar la base de datos: **Create → Database → PostgreSQL**.
5. Generar el dominio público: **Settings → Networking → Generate Domain**.

## 3. Ambiente de pruebas

1. En el proyecto: **Environments → New Environment** → nombre `pruebas` (duplicar desde `production`).
2. En el ambiente `pruebas`, cambiar la rama del servicio a `develop`.
3. Verificar que el ambiente `pruebas` tenga su **propia** instancia de PostgreSQL (no compartir la de producción).
4. Generar un dominio público propio para pruebas.

Con esto, el flujo queda: el trabajo del sprint se integra a `develop` y se revisa en el ambiente de pruebas; al cerrar el sprint, `develop → main` publica a producción.

## 4. Variables de entorno

Se configuran en Railway: servicio → pestaña **Variables**, por cada ambiente. Nunca se suben al repositorio (el `.gitignore` excluye todo `.env*` excepto `.env.example`).

| Variable              | Pruebas                                                            | Producción                                                  |
| --------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| `DATABASE_URL`        | `${{Postgres.DATABASE_URL}}` (referencia al Postgres del ambiente) | `${{Postgres.DATABASE_URL}}`                                |
| `NEXT_PUBLIC_APP_URL` | URL del dominio de pruebas                                         | `https://aeuvg.uvg.gt` (mientras tanto, dominio de Railway) |
| `AUTH_SECRET`         | valor propio, generado con `openssl rand -base64 32`               | valor propio y **distinto** al de pruebas                   |
| `RESEND_API_KEY`      | API key de Resend (modo pruebas)                                   | API key de producción                                       |
| `EMAIL_FROM`          | `AEUVG <noreply@...>`                                              | `AEUVG <noreply@aeuvg.uvg.gt>`                              |

La lista completa y actualizada de variables vive en [.env.example](../.env.example); cada variable nueva que el proyecto necesite debe agregarse allí con un comentario.

## 5. Dominio institucional (T-01.6, en trámite)

Cuando la universidad apruebe el dominio `.uvg.gt`:

1. En Railway (ambiente production): **Settings → Networking → Custom Domain** → agregar `aeuvg.uvg.gt`.
2. Railway mostrará el registro **CNAME** que debe configurarse en el DNS de la universidad.
3. Solicitar al área de TI de la UVG la creación de ese registro CNAME apuntando al dominio de Railway.
4. Actualizar `NEXT_PUBLIC_APP_URL` en producción.

## 6. Verificación del despliegue

Después de cada configuración inicial:

- [ ] Un push a `main` genera un deploy visible en el dashboard de Railway.
- [ ] La URL pública responde y muestra la aplicación.
- [ ] Un push a `develop` despliega solo el ambiente de pruebas.
- [ ] Las variables de entorno no aparecen en el repositorio.
- [ ] Los respaldos automáticos de PostgreSQL están habilitados (Database → Backups).
