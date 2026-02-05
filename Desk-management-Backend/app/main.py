from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from urllib.parse import urlparse
from app.database.database import engine
from app.models import User, Employee, Desk, DeskAssignment, DeskStatusHistory
from app.routers import (
    desks,
    assignments,
    auth,
    employees,
    desk_requests,
    settings,
    admin_config,
)

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RelativeRedirectMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if response.status_code in {301, 302, 303, 307, 308}:
            location = response.headers.get("Location")
            if location:
                parsed = urlparse(location)
                if parsed.scheme and parsed.netloc:
                    relative_location = parsed.path
                    if parsed.query:
                        relative_location += f"?{parsed.query}"
                    response.headers["Location"] = relative_location
        return response

app.add_middleware(RelativeRedirectMiddleware)

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
app.include_router(desk_requests.router)
app.include_router(settings.router)
app.include_router(admin_config.router)

