from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import jwt # PyJWT library
from datetime import datetime, timedelta

# --- App Configuration ---
app = Flask(__name__)
# WARNING: In a real app, use a long, random, secret key stored securely.
app.config['SECRET_KEY'] = 'my-super-secret-key-that-is-not-secret'
# Allow requests from our React frontend
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}}) 

# --- In-Memory Database (for Phase 1) ---
# In a real app, this would be a proper database like PostgreSQL.
users = {}
websites = {}

# --- API Endpoints ---

@app.route('/api/register', methods=['POST'])
def register():
    """Registers a new user."""
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"message": "Email and password are required."}), 400

    email = data['email']
    if email in users:
        return jsonify({"message": "User with this email already exists."}), 409

    user_id = str(uuid.uuid4())
    users[email] = {
        'id': user_id,
        'password': data['password'], # In a real app, HASH THIS PASSWORD!
    }
    websites[user_id] = []
    
    # Create a token for the new user
    token = jwt.encode({
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({"message": "User registered successfully.", "token": token}), 201

@app.route('/api/login', methods=['POST'])
def login():
    """Logs in a user."""
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"message": "Email and password are required."}), 400

    email = data['email']
    password = data['password']

    user = users.get(email)
    # In a real app, compare hashed passwords!
    if not user or user['password'] != password:
        return jsonify({"message": "Invalid credentials."}), 401
    
    token = jwt.encode({
        'user_id': user['id'],
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({"message": "Logged in successfully.", "token": token}), 200

@app.route('/api/websites', methods=['GET', 'POST'])
def handle_websites():
    """Handles fetching and adding websites for a user."""
    # --- Token Authentication ---
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "Authorization token is missing or invalid."}), 401
    
    token = auth_header.split(' ')[1]
    try:
        decoded_token = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        user_id = decoded_token['user_id']
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token has expired."}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token."}), 401

    # --- Handle Request ---
    if request.method == 'POST':
        data = request.get_json()
        if not data or not data.get('url'):
            return jsonify({"message": "URL is required."}), 400
        
        new_website = {
            'id': str(uuid.uuid4()),
            'url': data['url'],
            'status': 'Not Scanned'
        }
        websites[user_id].append(new_website)
        return jsonify({"message": "Website added.", "website": new_website}), 201

    if request.method == 'GET':
        user_websites = websites.get(user_id, [])
        return jsonify({"websites": user_websites}), 200

# --- Main Execution ---
if __name__ == '__main__':
    # Use port 5000 for the backend
    app.run(debug=True, port=5000)

