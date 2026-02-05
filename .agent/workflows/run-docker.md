---
description: How to run the Desk Management project using Docker
---
To run the project, follow these steps:

1.  **Open your terminal** and navigate to the project directory:
    ```bash
    cd /home/cygnet/Desk_Management_final/Desk_Management
    ```
2.  **Ensure your `.env` file is present** in this directory.
3.  **Start the containers** using Docker Compose:
    // turbo
    ```bash
    docker compose up --build
    ```
4.  **Access the application**:
    - Frontend: [http://localhost:3000](http://localhost:3000)
    - Backend API: [http://localhost:8000](http://localhost:8000)
