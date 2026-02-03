from fastapi import FastAPI
from app.database.database import engine
from app.models import User, Employee, Desk, DeskAssignment, DeskStatusHistory
from app.routers import desks, assignments, auth, employees

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    engine.connect()
    User.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "Welcome to Desk Management API"}

app.include_router(desks.router)
app.include_router(assignments.router)
app.include_router(auth.router)
app.include_router(employees.router)

