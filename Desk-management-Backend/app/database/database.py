from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool
import os

# Default to MySQL for deployments. Keep SQLite behavior when explicitly used
# by setting DATABASE_URL to an sqlite://... URL. This default can be
# overridden via the `DATABASE_URL` environment variable (used in Docker/dev).
# Example MySQL DSN (URL-encoded password):
# mysql+pymysql://desk_user:desk%40123@localhost:3306/desk_management_db
DEFAULT_DB_URL = "mysql+pymysql://desk_user:desk%40123@localhost:3306/desk_management_db"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)


engine = create_engine(
    DATABASE_URL,
    # SQLite needs specific connect args and pool class; other DBs do not.
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    poolclass=StaticPool if DATABASE_URL.startswith("sqlite") else None,
    echo=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
