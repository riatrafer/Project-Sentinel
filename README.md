# Project Sentinel: The Proactive Web Security Monitor

Project Sentinel is a full-stack web application designed to provide simple, actionable, and continuous security monitoring for developers and website owners. It aims to cut through the noise of traditional vulnerability scanners by focusing on high-impact findings, providing clear remediation advice, and proactively detecting changes.

## The Vision

This tool is not built to replace expert penetration testers but to serve as a "security co-pilot". It automates routine checks, watches for common attack vectors, and alerts users to meaningful changes in their web application's posture.

## Development Roadmap

This project is being built in phases:

- **Phase 1: The Foundation (Current)**
  - **Goal:** Establish the user-facing application and backend API.
  - **Features:** User registration/login, a dashboard to add websites, and a backend to manage user data.

- **Phase 2: The First Scan**
  - **Goal:** Implement the first server-side vulnerability check.
  - **Features:** Scan for missing security headers and display results.

- **Phase 3: Asynchronous & Deeper Scanning**
  - **Goal:** Handle long-running scans without blocking the UI.
  - **Features:** Integrate a task queue (Celery/Redis) and add SSL/TLS scanning capabilities.

- **Phase 4: Proactive Monitoring & Notifications**
  - **Goal:** Make the system autonomous and proactive.
  - **Features:** Scheduled scans, JavaScript file change detection, and email/Slack alerts.

## Phase 1: Setup and Installation

Follow these instructions to get the foundational application running on your local machine.

### Prerequisites

- **Node.js & npm:** For running the React frontend.
- **Python 3 & pip:** For running the Flask backend.

### Backend Setup (Flask API)

1.  **Navigate to your project folder.**
2.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```
3.  **Install Python dependencies:**
    ```bash
    pip install Flask Flask-Cors PyJWT
    ```
4.  **Run the backend server:**
    ```bash
    python app.py
    ```
    The backend API will now be running at `http://127.0.0.1:5000`.

### Frontend Setup (React App)

1.  **Open a new terminal window** and navigate to your project folder.
2.  **Create a new React project using Vite (if you haven't already):**
    ```bash
    npm create vite@latest frontend -- --template react
    cd frontend
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Replace the contents** of `frontend/src/App.jsx` with the React code provided.
5.  **Run the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend will now be running at `http://localhost:5173`.

You can now open your browser to `http://localhost:5173`, create an account, and add a website. The frontend will communicate with your local backend API.
