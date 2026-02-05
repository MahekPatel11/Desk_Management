"""add missing columns

Revision ID: 0002_add_missing_columns
Revises: 0001_initial
Create Date: 2026-02-04 18:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0002_add_missing_columns'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade():
    # Columns are already created by Base.metadata.create_all() in 0001_initial
    pass


def downgrade():
    # Remove columns from desk_assignments
    op.drop_column('desk_assignments', 'is_auto_assigned')
    op.drop_column('desk_assignments', 'end_date')
    op.drop_column('desk_assignments', 'start_date')
    op.drop_column('desk_assignments', 'shift')
    
    # Remove shift column from employees
    op.drop_column('employees', 'shift')
