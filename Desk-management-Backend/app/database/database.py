from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


from sqlalchemy.pool import StaticPool

# DATABASE_URL = "mysql+pymysql://desk_user:desk%40123@localhost:3306/desk_management_db"
DATABASE_URL = "sqlite:///./desk_management.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=True 
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
