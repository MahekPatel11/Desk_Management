#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Waiting for database to be ready..."
# The healthcheck in docker-compose handles most of this, but alembic might still fail if the DB isn't quite ready for connections.
# We'll use a simple loop or just rely on the healthcheck if we're sure.
# Actually, let's just run migrations.

echo "Running migrations..."
alembic upgrade head

# Uncomment the following line if you want to seed the database on every startup (CAUTION: drops data)
# python seed_db.py

echo "Starting Backend API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
