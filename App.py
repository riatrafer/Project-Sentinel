from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import jwt # PyJWT library
from datetime import datetime, timedelta
import requests # Added for making HTTP requests

# --- App Configuration ---
app = Flask(__name__)
app.config['SECRET_KEY'] = 'my-super-secret-key-that-is-not-secret'
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}}) 

# --- In-Memory Database (for Phase 1 & 2) ---
users = {}
websites = {}

# --- Helper Functions ---

def get_user_from_token():
    """Helper to decode JWT from Authorization header."""
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

def analyze_headers(url):
    """
    Performs the security header scan on a given URL.
    Returns a list of dictionaries with the analysis results.
    """
    results = []
    try:
        # Add http:// if no scheme is present
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
            
        response = requests.get(url, timeout=10, headers={'User-Agent': 'ProjectSentinel-Scanner/1.0'})
        headers = response.headers

        # 1. Check for Strict-Transport-Security (HSTS)
        if 'Strict-Transport-Security' in headers:
            results.append({'name': 'Strict-Transport-Security', 'status': 'Present', 'value': headers['Strict-Transport-Security']})
        else:
            results.append({'name': 'Strict-Transport-Security', 'status': 'Missing', 'value': 'Header not found. Recommended for HTTPS sites.'})

        # 2. Check for X-Frame-Options
        if 'X-Frame-Options' in headers:
            results.append({'name': 'X-Frame-Options', 'status': 'Present', 'value': headers['X-Frame-Options']})
        else:
            results.append({'name': 'X-Frame-Options', 'status': 'Missing', 'value': 'Header not found. Protects against clickjacking.'})

        # 3. Check for X-Content-Type-Options
        if headers.get('X-Content-Type-Options', '').lower() == 'nosniff':
            results.append({'name': 'X-Content-Type-Options', 'status': 'Present', 'value': headers['X-Content-Type-Options']})
        else:
            results.append({'name': 'X-Content-Type-Options', 'status': 'Missing', 'value': 'Header not found or invalid. Should be "nosniff".'})

        # 4. Check for Content-Security-Policy (CSP)
        if 'Content-Security-Policy' in headers:
            results.append({'name': 'Content-Security-Policy', 'status': 'Present', 'value': 'CSP is complex. Manual review recommended.'})
        else:
            results.append({'name': 'Content-Security-Policy', 'status': 'Missing', 'value': 'Header not found. Powerful defense against XSS.'})

    except requests.exceptions.RequestException as e:
        return [{'name': 'Connection Error', 'status': 'Error', 'value': str(e)}]
    
    return results


# --- API Endpoints ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"message": "Email and password are required."}), 400
    email = data['email']
    if email in users:
        return jsonify({"message": "User with this email already exists."}), 409
    user_id = str(uuid.uuid4())
    users[email] = {'id': user_id, 'password': data['password']}
    websites[user_id] = []
    token = jwt.encode({'user_id': user_id, 'exp': datetime.utcnow() + timedelta(hours=24)}, app.config['SECRET_KEY'], algorithm="HS256")
    return jsonify({"message": "User registered successfully.", "token": token}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"message": "Email and password are required."}), 400
    email = data['email']
    password = data['password']
    user = users.get(email)
    if not user or user['password'] != password:
        return jsonify({"message": "Invalid credentials."}), 401
    token = jwt.encode({'user_id': user['id'], 'exp': datetime.utcnow() + timedelta(hours=24)}, app.config['SECRET_KEY'], algorithm="HS256")
    return jsonify({"message": "Logged in successfully.", "token": token}), 200

@app.route('/api/websites', methods=['GET', 'POST'])
def handle_websites():
    try:
        user_id = get_user_from_token()
    except PermissionError as e:
        return jsonify({"message": str(e)}), 401

    if request.method == 'POST':
        data = request.get_json()
        if not data or not data.get('url'):
            return jsonify({"message": "URL is required."}), 400
        new_website = {'id': str(uuid.uuid4()), 'url': data['url'], 'status': 'Not Scanned', 'scan_results': None}
        websites[user_id].append(new_website)
        return jsonify({"message": "Website added.", "website": new_website}), 201

    if request.method == 'GET':
        user_websites = websites.get(user_id, [])
        return jsonify({"websites": user_websites}), 200

@app.route('/api/websites/<website_id>/scan', methods=['POST'])
def scan_website(website_id):
    """NEW: Endpoint to trigger a scan for a specific website."""
    try:
        user_id = get_user_from_token()
    except PermissionError as e:
        return jsonify({"message": str(e)}), 401

    user_sites = websites.get(user_id, [])
    target_site = next((site for site in user_sites if site['id'] == website_id), None)

    if not target_site:
        return jsonify({"message": "Website not found."}), 404

    scan_results = analyze_headers(target_site['url'])
    
    # Update the website object with the scan results
    target_site['scan_results'] = scan_results
    target_site['status'] = 'Scanned'
    target_site['last_scanned'] = datetime.utcnow().isoformat() + 'Z'

    return jsonify({"message": "Scan complete.", "website": target_site})

# --- Main Execution ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)

