import os

# Check if running in Docker
USE_DOCKER = os.getenv('USE_DOCKER', 'false').lower() == 'true'

if USE_DOCKER:
    # Docker service names
    AUTH_URL = os.getenv('AUTH_SERVICE_URL', 'http://auth-service:5009')
    PATIENTS_URL = 'http://patients-backend:5001'
    DOCTORS_URL = os.getenv('DOCTORS_SERVICE_URL', 'http://doctors-service:5000')
    RDV_URL = os.getenv('RDV_SERVICE_URL', 'http://rdv-backend:5005')
else:
    # Tailscale IPs for local development
    AUTH_URL = "http://100.119.228.76:5009"
    PATIENTS_URL = "http://100.83.82.128:5001"
    DOCTORS_URL = "http://100.95.250.126:5000"
    RDV_URL = "http://100.125.192.97:5005"

# Service configuration
PORTS = {
    "PATIENTS": 5001
}

# RDV Service URL (used in filters)
RDV_SERVICE_URL = RDV_URL