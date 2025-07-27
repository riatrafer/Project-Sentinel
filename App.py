from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import uuid
import jwt
from datetime import datetime, timedelta, timezone
import requests
from celery import Celery, chain
from celery.schedules import crontab
import json
import subprocess
import os

# --- App & Database Configuration ---
app = Flask(__name__)
# Replace with your actual PostgreSQL connection string
# Format: postgresql://<user>:<password>@<host>:<port>/<dbname>
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://postgres:password@localhost/sentinel')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'my-super-secret-key-that-is-not-secret'

db = SQLAlchemy(app)
migrate = Migrate(app, db)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

# --- Celery Configuration ---
app.config['CELERY_BROKER_URL'] = 'redis://localhost:6379/0'
app.config['CELERY_RESULT_BACKEND'] = 'redis://localhost:6379/0'

celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'])
celery.conf.update(app.config)
celery.conf.beat_schedule = {
    'scan-all-websites-every-day': {
        'task': 'app.run_all_scans',
        'schedule': crontab(hour=3, minute=0),  # Runs every day at 3:00 AM
    },
}

# --- Database Models ---
class User(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128)) # Store a hash, not the password!
    websites = db.relationship('Website', backref='owner', lazy=True)

class Website(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    url = db.Column(db.String(2048), nullable=False)
    status = db.Column(db.String(50), default='Not Scanned')
    last_scanned = db.Column(db.DateTime, nullable=True)
    scan_results = db.Column(db.JSON, nullable=True)
    task_id = db.Column(db.String(36), nullable=True)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)

# --- Helper Functions ---
def get_user_from_token():
    # ... (same as before) ...
    pass

# --- Celery Background Tasks ---
@celery.task
def run_all_scans():
    """Scheduled task to scan all websites in the database."""
    with app.app_context():
        all_websites = Website.query.all()
        for site in all_websites:
            print(f"Scheduler starting scan for: {site.url}")
            # Use a chain to update status after the scan
            workflow = chain(run_full_scan.s(site.id), update_scan_complete_status.s(site.id))
            workflow.apply_async()

@celery.task(bind=True)
def run_full_scan(self, website_id):
    """Performs the full scan and saves results to the database."""
    with app.app_context():
        site = Website.query.get(website_id)
        if not site:
            return {'status': 'Error', 'message': 'Website not found'}

        self.update_state(state='PROGRESS', meta={'message': 'Analyzing headers...'})
        header_results = analyze_headers(site.url)
        
        self.update_state(state='PROGRESS', meta={'message': 'Analyzing SSL/TLS...'})
        ssl_results = analyze_ssl(site.url)

        results = {'headers': header_results, 'ssl': ssl_results}
        
        site.scan_results = results
        db.session.commit()
        return {'status': 'SUCCESS', 'results': results}

@celery.task
def update_scan_complete_status(results, website_id):
    """Callback task to update the website status after a scan."""
    with app.app_context():
        site = Website.query.get(website_id)
        if site:
            site.status = 'Scanned'
            site.last_scanned = datetime.now(timezone.utc)
            site.task_id = None # Clear the task ID
            db.session.commit()
            print(f"Finished scan for {site.url} and updated status.")

def analyze_headers(url): # ... (same as before) ...
    pass
def analyze_ssl(url): # ... (same as before) ...
    pass

# --- API Endpoints ---
@app.route('/api/register', methods=['POST'])
def register():
    # ... (Modify to use User model and save to db) ...
    pass

@app.route('/api/login', methods=['POST'])
def login():
    # ... (Modify to fetch from db and check hashed password) ...
    pass

@app.route('/api/websites', methods=['GET', 'POST'])
def handle_websites():
    # ... (Modify to use Website model and db sessions) ...
    pass

@app.route('/api/websites/<website_id>/scan', methods=['POST'])
def scan_website(website_id):
    # ... (Modify to use a chain and save task_id to db) ...
    pass

@app.route('/api/tasks/<task_id>', methods=['GET'])
def get_task_status(task_id):
    """NEW: Endpoint for the frontend to poll for results."""
    task = run_full_scan.AsyncResult(task_id)
    response = {'state': task.state}
    if task.state == 'PROGRESS':
        response['message'] = task.info.get('message', '')
    elif task.state == 'SUCCESS':
        site = Website.query.filter_by(task_id=task_id).first()
        if site:
            response['results'] = site.scan_results
    elif task.state == 'FAILURE':
        response['message'] = str(task.info) # The exception
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, port=5000)

