
# Desk Management System

A role-based workplace optimization platform for managing office desks, hardware maintenance, and employee desk assignments in hybrid and multi-shift environments.

---

## 📖 Project Overview

The **Desk Management System** is a comprehensive solution designed to digitize office space allocation. It streamlines desk inventory, employee assignments, and hardware maintenance tracking through a secure, role-based workflow.

Ideally suited for hybrid work models, the system supports:
*   **Multi-shift desk sharing** (Morning/Night shifts)
*   **Conflict-free scheduling** with automated overlap detection
*   **Real-time status updates** for maintenance and availability
*   **Role-based access control** for Admins, IT Support, and Employees

---

## 🛠️ Technology Stack

**Frontend**
*   **Framework**: React 19 (via Vite)
*   **Styling**: TailwindCSS
*   **Routing**: React Router 7
*   **Testing**: Vitest

**Backend**
*   **Framework**: FastAPI (Python 3.10+)
*   **Database**: MySQL
*   **ORM**: SQLAlchemy 2.0
*   **Migrations**: Alembic
*   **Validation**: Pydantic 2

**Security**
*   **Authentication**: JWT (JSON Web Tokens)
*   **Hashing**: Bcrypt password hashing

**DevOps & Deployment**
*   **Containerization**: Docker & Docker Compose
*   **Web Server**: Nginx (Production ready configuration)

---

## 🚀 Setup and Run Instructions

### Prerequisites
*   [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.
*   (Optional) Python 3.10+ and Node.js 18+ for local development without Docker.

### Option 1: Run with Docker (Recommended)

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/MahekPatel11/Desk_Management.git
    cd Desk_Management
    ```

2.  **Start the Application**
    Run the following command to build and start all services (Backend, Frontend, Database, Nginx):
    ```bash
    docker-compose up --build
    ```

3.  **Access the Application**
    *   **Local**: [http://localhost:80](http://localhost:80)
    *   **Network**: [http://172.18.0.x:80](http://172.18.0.x:80) (Check your docker logs for precise IP)
    *   **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

4.  **Stop the Application**
    Press `Ctrl+C` in the terminal or run:
    ```bash
    docker-compose down
    ```

### Option 2: Run Locally (Manual Setup)

**1. Database Setup**
*   Install MySQL and create a database named `desk_db`.
*   Update the `.env` file in `Desk-management-Backend` with your credentials.

**2. Backend Setup**
```bash
cd Desk-management-Backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed_db.py         # Initialize and seed the database
uvicorn app.main:app --reload
```

**3. Frontend Setup**
```bash
cd Desk_Management_Frontend/Frontend
npm install
npm run dev
```

---

## 🔗 API Endpoints

The backend provides a comprehensive REST API. Full documentation is available via Swagger UI at `/docs` when running the application.

### Key Endpoints

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| **Auth** | | | |
| `POST` | `/auth/login` | Login and retrieve access token | Public |
| `POST` | `/auth/request-password-reset` | Request password reset token | Public |
| **Desks** | | | |
| `GET` | `/desks/` | List all desks with status | Auth |
| `POST` | `/desks/assign` | Assign a desk to an employee | Admin |
| `PUT` | `/desks/{id}/status` | Update desk status (e.g. Maintenance) | Admin, IT Support |
| **Employees** | | | |
| `GET` | `/employees/` | List all employees | Admin |
| `GET` | `/employees/{id}` | Get employee details | Admin, Employee |

---

## 🔐 Sample Credentials

The database is seeded with the following default accounts for testing:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `emily.carter@company.com` | `admin@123` |
| **Administrator** | `rajesh.mehta@company.com` | `admin@123` |
| **IT Support** | `daniel.moore@company.com` | `it@123` |
| **IT Support** | `michael.brown@company.com` | `it@123` |
| **Employee** | `john.anderson@company.com` | `employee@123` |
| **Employee** | `neha.patel@company.com` | `employee@123` |

---

## ✅ Learning Outcomes

*   **Full-Stack Application Development**: Gained hands-on experience building a complex role-based application using React, FastAPI, and MySQL.
*   **Role-Based Access Control (RBAC)**: Implemented robust security with JWT authentication and permission-based routing.
*   **Docker & DevOps**: Learned to containerize a full-stack application and orchestrate microservices using Docker Compose.
*   **Complex Business Logic**: Solved real-world problems like preventing schedule clashes and managing multi-shift resources.
*   **Database Design**: Designed a normalized database schema to handle relationships between employees, desks, and departments.

---

## � Conclusion

The Desk Management System successfully addresses the challenges of hybrid workplace management. By automating desk allocations, preventing booking conflicts, and providing real-time visibility into office resources, the platform significantly improves operational efficiency. The project demonstrates a scalable, secure, and user-friendly architecture ready for deployment in modern office environments.

---

## �👩‍💻 Author

*   **Mahek Patel**
*   **Keshvi Dholakiya**

---