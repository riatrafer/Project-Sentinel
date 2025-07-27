# Project Sentinel: The Proactive Web Security Monitor

Project Sentinel is a full-stack web application designed to provide simple, actionable, and continuous security monitoring for developers and website owners. It aims to cut through the noise of traditional vulnerability scanners by focusing on high-impact findings, providing clear remediation advice, and proactively detecting changes.

## Development Roadmap

- **Phase 1: The Foundation (Complete)**
  - **Features:** User registration/login, a dashboard to add websites, and a backend to manage user data.

- **Phase 2: The First Scan (Current)**
  - **Goal:** Implement the first server-side vulnerability check.
  - **Features:** A "Scan" button triggers a backend job to check for essential security headers (`HSTS`, `X-Frame-Options`, etc.). Results are stored and can be viewed in a modal.

- **Phase 3: Asynchronous & Deeper Scanning**
  - **Goal:** Handle long-running scans without blocking the UI.
  - **Features:** Integrate a task queue (Celery/Redis) and add SSL/TLS scanning capabilities.

- **Phase 4: Proactive Monitoring & Notifications**
  - **Goal:** Make the system autonomous and proactive.
  - **Features:** Scheduled scans, JavaScript file change detection, and email/Slack alerts.

## Phase 2: Setup and Installation

Follow these instructions to get the application running on your local machine.

### Prerequisites

- **Node.js & npm:** For running the React frontend.
- **Python 3 & pip:** For running the Flask backend.

### Backend Setup (Flask API)

1.  **Navigate to your project folder.**
2.  **Create a virtual environment (if you haven't already):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```
3.  **Install Python dependencies:**
    ```bash
    pip install Flask Flask-Cors PyJWT requests
    ```
4.  **Run the backend server:**
    ```bash
    python app.py
    ```
    The backend API will now be running at `http://127.0.0.1:5000`.

### Frontend Setup (React App)

1.  **Open a new terminal** and navigate to your `frontend` directory.
2.  **Install dependencies (if you haven't already):**
    ```bash
    npm install
    ```
3.  **Replace the contents** of `frontend/src/App.jsx` with the updated React code.
4.  **Run the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend will now be running at `http://localhost:5173`.

You can now log in, add a website, and click "Scan" to see the security header analysis. We are now one step closer to our goal!
