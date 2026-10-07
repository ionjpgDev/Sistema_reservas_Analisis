# Inicio rápido

Desde la raíz del repositorio, ejecuta:

```bash
docker compose up --build -d
```

Espera a que la base de datos y el backend estén saludables. Luego abre <http://localhost:5173>.

```bash
docker compose ps
docker compose logs -f
```

Para detener los servicios y conservar los datos:

```bash
docker compose down
```

No es necesario instalar Node.js ni PostgreSQL localmente. Consulta [README.md](README.md) para la configuración opcional, pgAdmin, cuentas de prueba y resolución de problemas. Para reiniciar la base de datos desde cero, consulta la advertencia sobre `docker compose down -v` en el README: elimina todos los datos guardados.