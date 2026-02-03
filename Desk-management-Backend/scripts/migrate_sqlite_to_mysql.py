#!/usr/bin/env python3
"""Migrate data from a local SQLite file to the configured DATABASE_URL (MySQL).

Usage:
  # from Desk-management-Backend dir
  export PYTHONPATH=$PWD
  export DATABASE_URL="mysql+pymysql://desk_user:desk%40123@localhost:3306/desk_management_db"
  python3 scripts/migrate_sqlite_to_mysql.py

Optional: set SOURCE_DATABASE_URL to point to a different sqlite file.
"""
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from sqlalchemy import MetaData, select

# ensure package import
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import database as dbmod
from app.models.users import User
from app.models.employees import Employee
from app.models.desks import Desk
from app.models.desk_assignments import DeskAssignment
from app.models.desk_status_history import DeskStatusHistory


def get_engine(url):
    if url.startswith('sqlite'):
        return create_engine(url, connect_args={"check_same_thread": False})
    return create_engine(url)


def row_to_dict(obj):
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}


def copy_table(Model, src_engine, tgt_sess):
    tbl_name = Model.__tablename__
    print(f"Copying {tbl_name}...")

    # reflect source table to determine which columns exist
    src_meta = MetaData()
    src_meta.reflect(bind=src_engine, only=[tbl_name])
    if tbl_name not in src_meta.tables:
        print(f"Source table {tbl_name} not found, skipping")
        return

    src_table = src_meta.tables[tbl_name]
    src_cols = list(src_table.c.keys())

    tgt_cols = [c.name for c in Model.__table__.columns]
    common_cols = [c for c in src_cols if c in tgt_cols]

    if not common_cols:
        print(f"No common columns for {tbl_name}, skipping")
        return

    conn = src_engine.connect()
    stmt = select(src_table)
    result = conn.execute(stmt)
    rows = result.mappings().all()
    conn.close()

    count = 0
    for r in rows:
        data = {k: r[k] for k in common_cols}
        try:
            tgt_sess.execute(Model.__table__.insert().values(**data))
            count += 1
        except IntegrityError:
            tgt_sess.rollback()
        except Exception as e:
            tgt_sess.rollback()
            print(f"Failed inserting into {tbl_name}: {e}")
    print(f"Copied {count} rows into {tbl_name}")


def main():
    src_url = os.getenv('SOURCE_DATABASE_URL', 'sqlite:///./desk_management.db')
    tgt_url = os.getenv('DATABASE_URL', dbmod.DATABASE_URL)

    print('Source DB:', src_url)
    print('Target DB:', tgt_url)

    src_engine = get_engine(src_url)
    tgt_engine = get_engine(tgt_url)

    # ensure target tables exist
    dbmod.Base.metadata.create_all(bind=tgt_engine)

    SrcSession = sessionmaker(bind=src_engine)
    TgtSession = sessionmaker(bind=tgt_engine)

    src_sess = SrcSession()
    tgt_sess = TgtSession()

    try:
        # copy in dependency order
        copy_table(User, src_engine, tgt_sess)
        copy_table(Employee, src_engine, tgt_sess)
        copy_table(Desk, src_engine, tgt_sess)
        copy_table(DeskStatusHistory, src_engine, tgt_sess)
        copy_table(DeskAssignment, src_engine, tgt_sess)
        tgt_sess.commit()
    finally:
        src_sess.close()
        tgt_sess.close()


if __name__ == '__main__':
    main()
