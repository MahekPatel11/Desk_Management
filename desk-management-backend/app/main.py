from fastapi import FastAPI
from app.database.database import engine
from app.models import User, Employee, Desk, DeskAssignment, DeskStatusHistory
from app.routers import desks, assignments, auth

app = FastAPI()

@app.on_event("startup")
def on_startup():
    engine.connect()
    User.metadata.create_all(bind=engine)

app.include_router(desks.router)
app.include_router(assignments.router)
app.include_router(auth.router)

