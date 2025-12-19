import os

# Check if running in Docker
USE_DOCKER = os.getenv('USE_DOCKER', 'false').lower() == 'true'

if USE_DOCKER:
    # Docker service names
    AUTH_URL = os.getenv('AUTH_SERVICE_URL', 'http://auth-service:5009')
    PATIENTS_URL = os.getenv('PATIENTS_SERVICE_URL', 'http://patients-service:5001')
    DOCTORS_URL = os.getenv('DOCTORS_SERVICE_URL', 'http://doctors-service:5000')
    RDV_URL = 'http://rdv-backend:5005'
else:
    # Tailscale IPs for local development
    TAILSCALE_IPS = {
        "auth_url": "http://100.119.228.76:5009",
        "PATIENTS": "http://100.83.82.128:5001",
        "DOCTORS": "http://100.95.250.126:5000",
        "RDV": "http://100.125.192.97:5005",
    }
    
    AUTH_URL = TAILSCALE_IPS["auth_url"]
    PATIENTS_URL = TAILSCALE_IPS["PATIENTS"]
    DOCTORS_URL = TAILSCALE_IPS["DOCTORS"]
    RDV_URL = TAILSCALE_IPS["RDV"]

PORTS = {
    "RDV": 5005
}