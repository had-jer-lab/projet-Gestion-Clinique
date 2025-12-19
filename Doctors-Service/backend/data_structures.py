import json
import os

# Fichier pour stocker les données des médecins
DOCTORS_FILE = 'doctors_data.json'
APPOINTMENTS_FILE = 'appointments_data.json'

# --- Fonctions pour les Médecins ---

def load_doctors():
    """Charge les données des médecins depuis le fichier JSON."""
    if os.path.exists(DOCTORS_FILE):
        try:
            with open(DOCTORS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Erreur lors du chargement des médecins: {e}")
            return []
    return []

def save_doctors(doctors):
    """Sauvegarde les données des médecins dans le fichier JSON."""
    try:
        with open(DOCTORS_FILE, 'w', encoding='utf-8') as f:
            json.dump(doctors, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Erreur lors de la sauvegarde des médecins: {e}")
        return False

def get_doctor_data():
    """Retourne la liste des médecins."""
    doctors = load_doctors()
    if not doctors:
        # Données par défaut si le fichier est vide
        doctors = [
            {
                "id": 1,
                "name": "Benali",
                "speciality": "Médecine Générale",
                "status": "Disponible",
                "patients": 45
            },
            {
                "id": 2,
                "name": "Meziane",
                "speciality": "Pédiatrie",
                "status": "En Consultation",
                "patients": 38
            }
        ]
        save_doctors(doctors)
    return doctors

def get_doctor_by_id(doctor_id):
    """Retourne un médecin par son ID."""
    doctors = get_doctor_data()
    for doctor in doctors:
        if doctor['id'] == doctor_id:
            return doctor
    return None

def add_or_update_doctor(doctor_data):
    """Ajoute ou met à jour un médecin."""
    try:
        doctors = get_doctor_data()
        
        # Si pas d'ID, c'est un nouveau médecin
        if not doctor_data.get('id'):
            # Trouver le prochain ID disponible
            max_id = max([d['id'] for d in doctors], default=0)
            doctor_data['id'] = max_id + 1
            doctors.append(doctor_data)
            print(f"Nouveau médecin ajouté avec ID: {doctor_data['id']}")
        else:
            # Mise à jour d'un médecin existant
            found = False
            for i, doctor in enumerate(doctors):
                if doctor['id'] == doctor_data['id']:
                    doctors[i] = doctor_data
                    found = True
                    print(f"Médecin {doctor_data['id']} mis à jour")
                    break
            
            if not found:
                print(f"Médecin {doctor_data['id']} non trouvé, ajout comme nouveau")
                doctors.append(doctor_data)
        
        # Sauvegarder
        return save_doctors(doctors)
    except Exception as e:
        print(f"Erreur dans add_or_update_doctor: {e}")
        return False

def delete_doctor_by_id(doctor_id):
    """Supprime un médecin par son ID."""
    try:
        doctors = get_doctor_data()
        initial_length = len(doctors)
        doctors = [d for d in doctors if d['id'] != doctor_id]
        
        if len(doctors) < initial_length:
            save_doctors(doctors)
            print(f"Médecin {doctor_id} supprimé")
            return True
        else:
            print(f"Médecin {doctor_id} non trouvé")
            return False
    except Exception as e:
        print(f"Erreur dans delete_doctor_by_id: {e}")
        return False

# --- Fonctions pour les Rendez-vous ---

def load_appointments():
    """Charge les données des rendez-vous depuis le fichier JSON."""
    if os.path.exists(APPOINTMENTS_FILE):
        try:
            with open(APPOINTMENTS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Erreur lors du chargement des RDV: {e}")
            return []
    return []

def save_appointments(appointments):
    """Sauvegarde les données des rendez-vous dans le fichier JSON."""
    try:
        with open(APPOINTMENTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(appointments, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Erreur lors de la sauvegarde des RDV: {e}")
        return False

def get_appointment_data():
    """Retourne la liste des rendez-vous (données mock par défaut)."""
    appointments = load_appointments()
    if not appointments:
        # Données par défaut
        appointments = [
            {
                "heure": "09:00",
                "patient": "Ahmed Benali",
                "patient_id": 1,
                "medecin": 1,
                "motif": "Consultation générale",
                "statut": "Confirmé"
            },
            {
                "heure": "10:30",
                "patient": "Fatima Meziane",
                "patient_id": 2,
                "medecin": 2,
                "motif": "Contrôle pédiatrique",
                "statut": "EN ATTENTE"
            }
        ]
        save_appointments(appointments)
    return appointments

# --- Données du Tableau de Bord ---
def get_data():
    """Retourne toutes les données nécessaires au tableau de bord."""
    return {
        "global_indicators": [
            {"label": "Patients Total", "value": 1245, "icon": "users"},
            {"label": "Médecins", "value": len(get_doctor_data()), "icon": "user-check"},
            {"label": "RDV Aujourd'hui", "value": len(get_appointment_data()), "icon": "calendar"}
        ],
        "monthly_revenue": [
            {"month": "Jan", "revenue": 45000},
            {"month": "Fév", "revenue": 52000},
            {"month": "Mar", "revenue": 48000},
            {"month": "Avr", "revenue": 61000},
            {"month": "Mai", "revenue": 55000},
            {"month": "Juin", "revenue": 67000}
        ]
    }