# pgAdmin Setup Guide

pgAdmin is a web-based administration tool for PostgreSQL. It's included in the docker-compose setup for easy database management.

## Access pgAdmin

1. Start the services:
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

2. Open your browser and navigate to: **http://localhost:5050**

3. Login with:
   - **Email**: `admin@docuforms.com` (or from `.env` as `PGADMIN_EMAIL`)
   - **Password**: `admin` (or from `.env` as `PGADMIN_PASSWORD`)

## Connect to DocuForms Database

1. In pgAdmin, right-click on **"Servers"** in the left panel
2. Select **"Register"** → **"Server"**
3. Fill in the **General** tab:
   - **Name**: `DocuForms DB` (or any name you prefer)
4. Fill in the **Connection** tab:
   - **Host name/address**: `postgres` (this is the service name in docker-compose)
   - **Port**: `5432`
   - **Maintenance database**: `docuforms`
   - **Username**: `docuforms`
   - **Password**: `changeme` (or your `POSTGRES_PASSWORD` from `.env`)
5. Click **"Save"**

The database connection will be saved and you can browse tables, run queries, and manage the database.

## Connect to Keycloak Database

You can also connect to the Keycloak database:

1. Right-click on **"Servers"** → **"Register"** → **"Server"**
2. **General** tab:
   - **Name**: `Keycloak DB`
3. **Connection** tab:
   - **Host name/address**: `keycloak-db`
   - **Port**: `5432`
   - **Maintenance database**: `keycloak`
   - **Username**: `keycloak`
   - **Password**: `changeme` (or your `KEYCLOAK_DB_PASSWORD` from `.env`)
4. Click **"Save"**

## Environment Variables

You can customize pgAdmin credentials in your `.env` file:

```bash
PGADMIN_EMAIL=admin@docuforms.local
PGADMIN_PASSWORD=admin
```

## Useful Features

- **Query Tool**: Execute SQL queries directly
- **Table Editor**: View and edit table data
- **Schema Browser**: Explore database structure
- **Backup/Restore**: Manage database backups
- **User Management**: Manage PostgreSQL users and permissions

## Troubleshooting

### Can't connect to database

- Ensure PostgreSQL container is running: `docker compose ps postgres`
- Verify the service name matches (`postgres` or `keycloak-db`)
- Check that you're using the correct credentials from `.env`

### pgAdmin not loading

- Check logs: `docker compose logs pgadmin`
- Verify port 5050 is not in use: `lsof -i :5050`
- Restart pgAdmin: `docker compose restart pgadmin`

