# Guía de instalación

## Requisitos

- Git.
- Docker Desktop o Docker Engine con Docker Compose v2.

Node.js y PostgreSQL no necesitan instalarse en el equipo: se ejecutan dentro de contenedores.

## Instalar y arrancar

```bash
git clone https://github.com/Roberto-Carlos01/Sistema-de-Reservas---Complejo-deportivo-.git
cd Sistema-de-Reservas---Complejo-deportivo-
docker compose up --build -d
```

Frontend: <http://localhost:5173>

API: <http://localhost:4000/api>

Health check: <http://localhost:4000/api/health>

Para configurar puertos, credenciales locales, pgAdmin, detener la aplicación o consultar cuentas de prueba, sigue [README.md](README.md), que es la guía principal del proyecto.