from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import jwt
from datetime import datetime, timedelta
import requests
from celery import Celery
import json
import subprocess # To run command-line tools like sslyze

# --- App & Celery Configuration ---
app = Flask(__name__)
app.config['SECRET_KEY'] = 'my-super-secret-key-that-is-not-secret'
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

# Configure Celery
# Replace with your Redis URL if it's different
app.config['CELERY_BROKER_URL'] = 'redis://localhost:6379/0'
app.config['CELERY_RESULT_BACKEND'] = 'redis://localhost:6379/0'

celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'])
celery.conf.update(app.config)

# --- In-Memory Database (will be replaced by PostgreSQL later) ---
users = {}
websites = {} # Now this will store task IDs

# --- Helper Functions ---
def get_user_from_token():
    # ... (same as before) ...
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise PermissionError("Authorization token is missing or invalid.")
    token = auth_header.split(' ')[1]
    try:
        decoded_token = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        return decoded_token['user_id']
    except jwt.ExpiredSignatureError:
        raise PermissionError("Token has expired.")
    except jwt.InvalidTokenError:
        raise PermissionError("Invalid token.")


# --- Celery Background Tasks ---
@celery.task
def run_full_scan(website_id, user_id, url):
    """
    This function runs in the background, executed by a Celery worker.
    It performs all scans and will eventually update a real database.
    For now, we'll just log the results.
    """
    print(f"Starting full scan for {url} (ID: {website_id})")
    
    # Task 1: Header Analysis
    header_results = analyze_headers(url)
    
    # Task 2: SSL/TLS Analysis using sslyze
    ssl_results = analyze_ssl(url)

    # In a real app, we would save these results to a persistent database
    # associated with the website_id.
    print(f"--- Scan Results for {url} ---")
    print("Headers:", header_results)
    print("SSL/TLS:", ssl_results)
    print("--- Scan Complete ---")

    # For this phase, we won't have a way to get results back to the user yet.
    # We're just setting up the async architecture.
    return {"status": "Complete", "header_results": header_results, "ssl_results": ssl_results}

def analyze_headers(url):
    # ... (same as before) ...
    results = []
    try:
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        response = requests.get(url, timeout=10, headers={'User-Agent': 'ProjectSentinel-Scanner/1.0'})
        headers = response.headers
        # Header checks remain the same
        if 'Strict-Transport-Security' in headers: results.append({'name': 'Strict-Transport-Security', 'status': 'Present'})
        else: results.append({'name': 'Strict-Transport-Security', 'status': 'Missing'})
        if 'X-Frame-Options' in headers: results.append({'name': 'X-Frame-Options', 'status': 'Present'})
        else: results.append({'name': 'X-Frame-Options', 'status': 'Missing'})
        if headers.get('X-Content-Type-Options', '').lower() == 'nosniff': results.append({'name': 'X-Content-Type-Options', 'status': 'Present'})
        else: results.append({'name': 'X-Content-Type-Options', 'status': 'Missing'})
        if 'Content-Security-Policy' in headers: results.append({'name': 'Content-Security-Policy', 'status': 'Present'})
        else: results.append({'name': 'Content-Security-Policy', 'status': 'Missing'})
    except requests.exceptions.RequestException as e:
        return [{'name': 'Connection Error', 'status': 'Error', 'value': str(e)}]
    return results


def analyze_ssl(url):
    """
    Runs the sslyze command-line tool and parses the JSON output.
    """
    # Extract hostname from URL
    from urllib.parse import urlparse
    hostname = urlparse(url).hostname
    if not hostname:
        return [{'name': 'SSL/TLS Scan', 'status': 'Error', 'value': 'Invalid URL provided.'}]
    
    try:
        # Run sslyze as a subprocess
        # Assumes sslyze is installed and in the system's PATH
        result = subprocess.run(
            ['sslyze', '--json_out=-', hostname],
            capture_output=True,
            text=True,
            check=True,
            timeout=120 # 120-second timeout
        )
        scan_data = json.loads(result.stdout)
        # Process the JSON data to get meaningful results (this is a simplified example)
        server_scan = scan_data.get('server_scan_results', [])[0]
        if server_scan.get('scan_status') == 'COMPLETED':
            return [{'name': 'SSL/TLS Scan', 'status': 'Completed', 'value': f"Successfully scanned {hostname}."}]
        else:
            return [{'name': 'SSL/TLS Scan', 'status': 'Error', 'value': 'Scan failed or was rejected.'}]

    except FileNotFoundError:
        return [{'name': 'SSL/TLS Scan', 'status': 'Error', 'value': 'sslyze command not found. Is it installed?'}]
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
        return [{'name': 'SSL/TLS Scan', 'status': 'Error', 'value': f'Scan process failed: {e}'}]
    except json.JSONDecodeError:
        return [{'name': 'SSL/TLS Scan', 'status': 'Error', 'value': 'Failed to parse sslyze JSON output.'}]

# --- API Endpoints ---
# /register and /login endpoints are the same as before

@app.route('/api/websites', methods=['GET', 'POST'])
def handle_websites():
    # ... (same as before) ...
    pass

@app.route('/api/websites/<website_id>/scan', methods=['POST'])
def scan_website(website_id):
    """UPDATED: This endpoint now starts a background task."""
    try:
        user_id = get_user_from_token()
    except PermissionError as e:
        return jsonify({"message": str(e)}), 401

    user_sites = websites.get(user_id, [])
    target_site = next((site for site in user_sites if site['id'] == website_id), None)

    if not target_site:
        return jsonify({"message": "Website not found."}), 404

    # Start the background task via Celery
    task = run_full_scan.delay(target_site['id'], user_id, target_site['url'])

    # Update the site's status to show the scan is in progress
    target_site['status'] = 'Pending'
    target_site['task_id'] = task.id # Save the task ID to check its status later

    return jsonify({"message": "Scan has been initiated.", "task_id": task.id, "website": target_site})

# We would also need an endpoint to check the status/result of a task
# @app.route('/api/tasks/<task_id>', methods=['GET'])
# def get_task_status(task_id):
#     task = run_full_scan.AsyncResult(task_id)
#     # ... logic to return status and results ...

if __name__ == '__main__':
    app.run(debug=True, port=5000)

