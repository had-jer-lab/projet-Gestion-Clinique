# ----------------------------
# config.py - Auth Service
# ----------------------------
import os

# Check if running in Docker
USE_DOCKER = os.getenv('USE_DOCKER', 'false').lower() == 'true'

if USE_DOCKER:
    # Docker service names (for inter-container communication)
    AUTH_URL = os.getenv('AUTH_SERVICE_URL', 'http://auth-service:5009')
    PATIENTS_URL = os.getenv('PATIENTS_SERVICE_URL', 'http://patients-service:5001')
    DOCTORS_URL = os.getenv('DOCTORS_SERVICE_URL', 'http://doctors-service:5000')
    RDV_URL = os.getenv('RDV_SERVICE_URL', 'http://rdv-backend:5005')
    
    PORTS = {
        "AUTH": 5009,
        "PATIENTS": 5001,
        "DOCTORS": 5000,
        "RDV": 5005
    }
else:
    # Tailscale IPs for local development
    AUTH_IP = "100.119.228.76"
    PATIENTS_IP = "100.83.82.128"
    DOCTORS_IP = "100.95.250.126"
    RDV_IP = "100.125.192.97"
    
    PORTS = {
        "AUTH": 5009,
        "PATIENTS": 5001,
        "DOCTORS": 5000,
        "RDV": 5005
    }
    
    AUTH_URL = f"http://{AUTH_IP}:{PORTS['AUTH']}"
    PATIENTS_URL = f"http://{PATIENTS_IP}:{PORTS['PATIENTS']}"
    DOCTORS_URL = f"http://{DOCTORS_IP}:{PORTS['DOCTORS']}"
    RDV_URL = f"http://{RDV_IP}:{PORTS['RDV']}"