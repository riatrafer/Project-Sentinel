# Project Sentinel: The Proactive Web Security Monitor

Project Sentinel is a full-stack web application designed to provide simple, actionable, and continuous security monitoring. It features a React frontend, a Python/Flask backend, and uses Celery for asynchronous task processing and scheduling with a PostgreSQL database for persistent storage.

## Final Features

- **User Authentication:** Secure user registration and login.
- **Asynchronous Scanning:** Uses Celery and Redis to run scans in the background without freezing the UI.
- **Scheduled Monitoring:** Celery Beat automatically runs scans for all registered websites on a daily schedule.
- **Persistent Storage:** Uses a PostgreSQL database to store all user and website data.
- **Real-time Feedback:** The frontend polls the backend to get the status and results of background scans.
- **Multi-layered Analysis:** Scans for critical security headers and in-depth SSL/TLS configuration issues.

## Final Architecture Setup

The setup is complex, requiring a database, a message broker, and multiple running processes.

### Prerequisites

- **Node.js & npm**
- **Python 3 & pip**
- **PostgreSQL:** A running PostgreSQL server. You will need to create a database (e.g., `sentinel`) and have the connection URL handy.
- **Redis:** A running Redis server.
- **sslyze:** The command-line tool (`pip install sslyze`).

### Backend Setup

You will need **three separate terminals** for the backend services.

1.  **Install all dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
2.  **Database Initialization (One-time setup):**
    * Set the `DATABASE_URL` environment variable to your PostgreSQL connection string.
    * Initialize the database with Flask-Migrate:
    ```bash
    export FLASK_APP=app.py
    flask db init  # Only run this the very first time
    flask db migrate -m "Initial migration."
    flask db upgrade
    ```

**Terminal 1: Run the Celery Beat Scheduler**
This process schedules the daily scans.
```bash
celery -A app.celery beat --loglevel=info
