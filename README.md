# Project Sentinel: The Proactive Web Security Monitor

## Development Roadmap

- **Phase 1: The Foundation (Complete)**
- **Phase 2: The First Scan (Complete)**

- **Phase 3: Asynchronous & Deeper Scanning (Current)**
  - **Goal:** Handle long-running scans without blocking the UI and add more powerful scanning tools.
  - **Features:** Integrated Celery and Redis to run scans as background jobs. Added SSL/TLS scanning by wrapping the `sslyze` command-line tool. The UI now shows a "Pending" state for scans in progress.

- **Phase 4: Proactive Monitoring & Notifications**
  - **Goal:** Make the system autonomous and proactive.

## Phase 3: Setup and Installation

The setup for Phase 3 is significantly more complex due to the introduction of background workers. You are now running a distributed system on your local machine.

### Prerequisites

- **Node.js & npm**
- **Python 3 & pip**
- **Redis:** You must have a Redis server installed and running. You can install it via a package manager like `brew` (macOS) or `apt` (Linux), or run it using Docker.
- **sslyze:** The command-line tool must be installed.
  ```bash
  pip install sslyze
