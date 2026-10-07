# Sistema de Reservas de Complejo Deportivo

## Requisitos

- Docker Desktop o Docker Engine con Docker Compose v2.
- Git para clonar el repositorio.

No es necesario instalar Node.js ni PostgreSQL para probar la aplicación.

## Arranque local

```bash
git clone https://github.com/Roberto-Carlos01/Sistema-de-Reservas---Complejo-deportivo-.git
cd Sistema-de-Reservas---Complejo-deportivo-
docker compose up --build -d
```

Abre el frontend en <http://localhost:5173>. La API está en <http://localhost:4000/api> y su health check en <http://localhost:4000/api/health>.

Compose inicia PostgreSQL, el backend y el frontend, esperando a que la base de datos y la API estén saludables. La primera inicialización carga los SQL de `database/`; los datos persisten en un volumen entre reinicios.

Si ya tenías un volumen PostgreSQL antes de estas migraciones, ejecútalas una vez para normalizar las contraseñas demo, sincronizar secuencias y ampliar el estado del pago sin borrar datos:

```bash
docker compose exec -T db psql -U limber -d bdcomplejodeportivo -f /docker-entrypoint-initdb.d/03_hash_contrasenas_demo.sql
docker compose exec -T db psql -U limber -d bdcomplejodeportivo -f /docker-entrypoint-initdb.d/04_sincronizar_secuencias.sql
docker compose exec -T db psql -U limber -d bdcomplejodeportivo -f /docker-entrypoint-initdb.d/05_ampliar_estado_pago.sql
```

Ver estado y logs:

```bash
docker compose ps
docker compose logs -f
```

Detener los servicios sin borrar los datos:

```bash
docker compose down
```

## Configuración local

La aplicación inicia con valores predeterminados para desarrollo. Para cambiarlos, copia la plantilla a `.env` en la raíz del repositorio:

```bash
cp .env.example .env
```

No uses las credenciales de desarrollo de la plantilla en un entorno compartido o productivo. Se pueden configurar credenciales, secreto JWT, puertos y correo. El `.env` está excluido de Git.

pgAdmin es opcional. Para iniciarlo junto con la aplicación:

```bash
docker compose --profile tools up --build -d
```

PgAdmin está en <http://localhost:5050>. Sus credenciales locales se configuran con `PGADMIN_EMAIL` y `PGADMIN_PASSWORD`.

Si un puerto está ocupado, define `DB_PORT_HOST`, `BACKEND_PORT_HOST`, `FRONTEND_PORT` o `PGADMIN_PORT` en `.env` y vuelve a iniciar Compose.

Para reconstruir las imágenes tras cambios de código:

```bash
docker compose up --build -d
```

**El siguiente comando borra todos los datos de PostgreSQL.** Úsalo solo para reiniciar la base de datos desde cero:

```bash
docker compose down -v
docker compose up --build -d
```

## Cuentas de prueba

| Correo | Contraseña | Rol |
| --- | --- | --- |
| `carla.mamani@canchasbo.com` | `Passw123` | Administrador |
| `jorge.fernandez@canchasbo.com` | `Passw123` | Administrador |
| `ana.torrez@canchasbo.com` | `Passw123` | Empleado |
| `maria.lopez@gmail.com` | `Passw123` | Cliente |

## Verificación manual de pagos

En pagos QR, transferencia o tarjeta de crédito, el cliente adjunta un comprobante JPG, PNG, WEBP o PDF de hasta 5 MB e ingresa el número de operación/autorización impreso en ese recibo. La aplicación conserva también una referencia interna `RES-id`, el monto, método y fecha de registro. El pago queda pendiente hasta que un administrador o empleado revise la evidencia en `/verificar-pagos`; solo puede aprobarse si tiene comprobante. La tarjeta de crédito se registra para revisión manual, no se procesa con una pasarela bancaria. Si se rechaza, la reserva queda pendiente de pago para reintentar.

## Estructura

```text
backend/       API REST con Node.js, TypeScript y Express
frontend/      Interfaz React, TypeScript y Vite
database/      Esquema SQL y datos iniciales
docker-compose.yml
.env.example   Plantilla de configuración local
```

## Flujo de trabajo con Git

```bash
git pull origin main
git add .
git commit -m "feat: descripción del cambio"
git push origin main
```

## Diagnóstico rápido

```bash
docker compose ps
docker compose logs db backend frontend
```

Si se cambiaron las credenciales de PostgreSQL después de crear el volumen, el contenedor conserva las credenciales iniciales. Para reinicializarlo hay que borrar el volumen con `docker compose down -v`, lo que también elimina sus datos.