This directory is for high-level integration and end-to-end tests
that exercise both the backend (FastAPI) and frontend (React/Vite)
of the Desk Management system.

Tests here are written using `pytest` and the `requests` library,
and assume:

- The backend API is running at http://127.0.0.1:8000
- The frontend is running at http://127.0.0.1:5173 (default Vite port)

