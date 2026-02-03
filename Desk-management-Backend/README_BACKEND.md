# Desk Management Backend — MySQL migration notes

This backend now defaults to a MySQL DSN. You can still use SQLite by setting
`DATABASE_URL` to a `sqlite:///...` URL.

Quick local setup (Ubuntu 22.04):

1. Install MariaDB (recommended) or MySQL server:

```bash
sudo apt update
sudo apt install mariadb-server -y
sudo systemctl enable --now mariadb
```

2. Create the database and user (adjust password):

```bash
sudo mysql -e "CREATE DATABASE IF NOT EXISTS desk_management_db; \
CREATE USER IF NOT EXISTS 'desk_user'@'localhost' IDENTIFIED BY 'desk@123'; \
GRANT ALL PRIVILEGES ON desk_management_db.* TO 'desk_user'@'localhost'; \
FLUSH PRIVILEGES;"
```

3. Export `DATABASE_URL` (URL-encode special characters in password):

```bash
export DATABASE_URL="mysql+pymysql://desk_user:desk%40123@localhost:3306/desk_management_db"
export PYTHONPATH=$PWD
alembic upgrade head
```

To use SQLite instead:

```bash
export DATABASE_URL="sqlite:///./desk_management.db"
alembic upgrade head
```

Notes:
- `app/database/database.py` default `DEFAULT_DB_URL` was changed to a MySQL DSN placeholder.
- `alembic.ini` default `sqlalchemy.url` was also updated to the same placeholder.
- The app still respects an explicit `DATABASE_URL` environment variable.
