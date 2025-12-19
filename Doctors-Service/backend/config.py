# Fichier : config.py
# ==========================================================

# Configuration des adresses des microservices

# تفعيل أو تعطيل استعمال Tailscale
USE_TAILSCALE = True

# عناوين خدمات Tailscale (Doivent correspondre aux adresses IP de vos amis)
TAILSCALE_IPS = {
    "auth_url":  "http://100.119.228.76:5009",  # dounia
    "PATIENTS":  "http://100.83.82.128:5001",   # asma
    "DOCTORS":   "http://100.95.250.126:5000",  # kawthar (votre propre microservice)
    "RDV":       "http://100.125.192.97:5005",  # hajir (RDV + Factures)
}

# Définition des URLs utilisées dans app.py
if USE_TAILSCALE:
    AUTH_URL     = TAILSCALE_IPS["auth_url"]
    PATIENTS_URL = TAILSCALE_IPS["PATIENTS"]
    DOCTORS_URL  = TAILSCALE_IPS["DOCTORS"]
    RDV_URL      = TAILSCALE_IPS["RDV"]
    
else:
    # URL de secours pour le développement local
    AUTH_URL     = "http://127.0.0.1:5009"
    PATIENTS_URL = "http://127.0.0.1:5001"
    DOCTORS_URL  = "http://127.0.0.1:5000"
    RDV_URL      = "http://127.0.0.1:5005"