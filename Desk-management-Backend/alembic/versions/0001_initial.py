"""initial

Revision ID: 0001_initial
Revises: 
Create Date: 2026-02-03 00:00:00.000000

"""
from alembic import op

revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Use SQLAlchemy metadata to create all tables
    from app.database.database import engine
    from app.database.database import Base
    from app import models  # Ensure all models are registered

    Base.metadata.create_all(bind=engine)


def downgrade():
    from app.database.database import engine
    from app.database.database import Base

    Base.metadata.drop_all(bind=engine)
