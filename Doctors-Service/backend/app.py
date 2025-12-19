import os
import json
import requests
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from config import AUTH_URL, PATIENTS_URL, DOCTORS_URL, RDV_URL
from data_structures import (
    get_doctor_data,
    delete_doctor_by_id,
    get_doctor_by_id,
    add_or_update_doctor,
    get_appointment_data
)

app = Flask(__name__)
# IMPORTANT: Configure CORS properly
CORS(app, resources={r"/api/*": {"origins": "*"}})

def fetch_appointments_from_friend_api(doctor_id=None, date_str=None):
    params = {}
    if doctor_id:
        params['doctor_id'] = doctor_id
    if date_str:
        params['date'] = date_str

    try:
        response = requests.get(f"{RDV_URL}/api/appointments", params=params, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        app.logger.error(f"Erreur lors de l'appel au microservice de RDV (Hajer): {e}")
        return []

@app.route('/api/doctors', methods=['GET'])
def api_doctors():
    try:
        doctors_data = get_doctor_data()
        result = []
        for d in doctors_data:
            result.append({
                'id': d['id'],
                'name': d['name'],
                'nom_complet': d['name'],
                'speciality': d['speciality'],
                'status': d.get('status', 'Inconnu'),
                'patients': d.get('patients', 0),
                'patients_total': d.get('patients', 0),
            })
        return jsonify(result), 200
    except Exception as e:
        print(f"Error in api_doctors: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/doctors/<int:doctor_id>', methods=['GET'])
def api_get_doctor(doctor_id):
    try:
        doctor = get_doctor_by_id(doctor_id)
        if not doctor:
            return jsonify({"error": "Médecin non trouvé"}), 404
        return jsonify(doctor), 200
    except Exception as e:
        print(f"Error in api_get_doctor: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/doctors', methods=['POST'])
def api_add_doctor():
    try:
        data = request.json
        print(f"Received data: {data}")  # Debug
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({"error": "Name is required"}), 400
        
        data_to_save = {
            'id': int(data.get('id')) if data.get('id') and str(data.get('id')).isdigit() else None,
            'name': data.get('name', 'Nouveau Docteur'),
            'speciality': data.get('speciality', 'Inconnu'),
            'status': data.get('status', 'Disponible'),
            'patients': int(data.get('patients', 0)) if data.get('patients') else 0
        }
        
        print(f"Data to save: {data_to_save}")  # Debug

        if add_or_update_doctor(data_to_save):
            return jsonify({
                "message": "Doctor added successfully", 
                "doctor": data_to_save
            }), 200
        else:
            return jsonify({"error": "Failed to add doctor"}), 500
            
    except Exception as e:
        print(f"Error in api_add_doctor: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/doctors/<int:doctor_id>', methods=['PUT'])
def api_update_doctor(doctor_id):
    try:
        data = request.json
        data['id'] = doctor_id
        
        print(f"Updating doctor {doctor_id} with data: {data}")  # Debug
        
        if add_or_update_doctor(data):
            return jsonify({"message": "Doctor updated successfully"}), 200
        else:
            return jsonify({"error": "Failed to update doctor"}), 500
            
    except Exception as e:
        print(f"Error in api_update_doctor: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/doctors/<int:doctor_id>', methods=['DELETE'])
def api_delete_doctor(doctor_id):
    try:
        if delete_doctor_by_id(doctor_id):
            return jsonify({"message": f"Médecin {doctor_id} supprimé."}), 200
        else:
            return jsonify({"error": "Erreur: Médecin non trouvé"}), 404
    except Exception as e:
        print(f"Error in api_delete_doctor: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/appointments', methods=['GET'])
def api_appointments():
    try:
        raw_appointments = []
        doctors = []

        try:
            rdv_response = requests.get(f"{RDV_URL}/api/rdv_today", timeout=4)
            if rdv_response.status_code == 200:
                raw_appointments = rdv_response.json()
        except Exception as e:
            print("Hajer HS → on passe au mock", e)

        if not raw_appointments:
            raw_appointments = get_appointment_data()

        try:
            doctors = requests.get(f"{DOCTORS_URL}/api/doctors", timeout=3).json()
        except:
            doctors = get_doctor_data()

        def find_doctor_name(doc_id):
            def clean_name(name):
                if not name:
                    return ""
                name = str(name).strip()
                name = re.sub(r'^(dr\.?\s*)+', '', name, flags=re.IGNORECASE)
                return name.strip()

            if not doc_id:
                return "ID Manquant"

            for d in doctors:
                if str(d.get('id')) == str(doc_id) or str(d.get('id_medecin')) == str(doc_id):
                    nom_complet = d.get('name') or d.get('nom_complet')
                    nom_propre = clean_name(nom_complet)
                    if nom_propre:
                        return f"Dr. {nom_propre}"
                    return f"Dr. {doc_id} (Nom Vide)"

            nom_base = clean_name(doc_id)
            return f" {nom_base}" if nom_base else f"Dr. {doc_id}"

        normalized = []
        for ap in raw_appointments:
            patient_id = (ap.get('patient_id') or
                          ap.get('id_patient') or
                          ap.get('idPatient') or
                          ap.get('patientId') or
                          None)

            if not patient_id and ap.get('patient'):
                patient_name = ap.get('patient') or ap.get('nom_patient') or ""
                try:
                    resp = requests.get(f"{PATIENTS_URL}/api/patients", timeout=3).json()
                    for p in resp:
                        full_name = f"{p.get('prenom','')} {p.get('nom','')}".strip()
                        if full_name.lower() == patient_name.lower() or patient_name.lower() in full_name.lower():
                            patient_id = p.get('id')
                            break
                except:
                    pass

            doctor_id = (ap.get('medecin') or ap.get('doctor_id') or ap.get('id_medecin') or ap.get('doctorId') or ap.get('id_doctor'))
            
            normalized.append({
                "time": ap.get('heure') or ap.get('time') or "??:??",
                "patient": ap.get('patient') or ap.get('nom_patient') or "Patient inconnu",
                "patient_id": patient_id or "INCONNU",
                "doctor_name": find_doctor_name(doctor_id),
                "reason": ap.get('motif') or ap.get('reason') or "-",
                "status": ap.get('statut') or ap.get('status') or "EN ATTENTE",
            })

        return jsonify(normalized), 200
    except Exception as e:
        print(f"Error in api_appointments: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/patient/<patient_id>', methods=['GET'])
def api_patient_detail(patient_id):
    try:
        patient_data = {"patient": f"Patient ID {patient_id} Inconnu", "id": patient_id}
        try:
            response = requests.get(f"{PATIENTS_URL}/api/patient/{patient_id}")
            response.raise_for_status()
            patient_data = response.json()
        except requests.exceptions.RequestException as e:
            app.logger.error(f"Erreur d'accès au microservice Patient: {e}")

        rdv_data = []
        try:
            response = requests.get(f"{RDV_URL}/api/appointments?patient_id={patient_id}")
            response.raise_for_status()
            rdv_data = response.json()
        except requests.exceptions.RequestException:
            pass

        ord_data = []
        try:
            response = requests.get(f"{PATIENTS_URL}/api/ordonnances/{patient_id}")
            response.raise_for_status()
            ord_data = response.json()
        except requests.exceptions.RequestException:
            pass

        last_rdv = rdv_data[-1] if rdv_data else {}

        return jsonify({
            "patient": patient_data,
            "last_rdv": last_rdv,
            "ordonnances": ord_data
        }), 200
    except Exception as e:
        print(f"Error in api_patient_detail: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)