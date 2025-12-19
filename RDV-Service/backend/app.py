from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
from flask_migrate import Migrate
import requests
from config import AUTH_URL, PATIENTS_URL, DOCTORS_URL

app = Flask(__name__)
app.secret_key = 'clinique2025'

# CORS configuration for React frontend
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///clinique.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# ========================
# DATABASE MODELS
# ========================
class RendezVous(db.Model):
    id_rdv = db.Column(db.Integer, primary_key=True)
    id_patient = db.Column(db.String(50), nullable=False)
    nom_patient = db.Column(db.String(100), nullable=False)
    id_medecin = db.Column(db.String(50), nullable=False)
    nom_medecin = db.Column(db.String(100), nullable=True)
    date_rdv = db.Column(db.String(50), nullable=False)
    heure = db.Column(db.String(20), nullable=False)
    motif = db.Column(db.String(100), nullable=True)
    statut = db.Column(db.String(20), default='En attente')
    
    def to_dict(self):
        return {
            'id_rdv': self.id_rdv,
            'id_patient': self.id_patient,
            'nom_patient': self.nom_patient,
            'id_medecin': self.id_medecin,
            'nom_medecin': self.nom_medecin,
            'date_rdv': self.date_rdv,
            'heure': self.heure,
            'motif': self.motif,
            'statut': self.statut
        }

class Facture(db.Model):
    id_facture = db.Column(db.Integer, primary_key=True)
    numero_facture = db.Column(db.String(50), unique=True, nullable=False)
    id_patient = db.Column(db.String(50), nullable=False)
    nom_patient = db.Column(db.String(100), nullable=False)
    montant = db.Column(db.Float, nullable=False)
    remboursement = db.Column(db.Float, default=0.0)
    reste_a_payer = db.Column(db.Float, nullable=False)
    statut = db.Column(db.String(20), default='En attente')
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    date_paiement = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id_facture': self.id_facture,
            'numero_facture': self.numero_facture,
            'id_patient': self.id_patient,
            'nom_patient': self.nom_patient,
            'montant': self.montant,
            'remboursement': self.remboursement,
            'reste_a_payer': self.reste_a_payer,
            'statut': self.statut,
            'date_creation': self.date_creation.strftime('%Y-%m-%d'),
            'date_paiement': self.date_paiement.strftime('%Y-%m-%d %H:%M') if self.date_paiement else None
        }

with app.app_context():
    db.create_all()

# ========================
# RENDEZ-VOUS API ROUTES
# ========================

@app.route('/api/rdv', methods=['GET'])
def get_all_rdv():
    """Get all appointments"""
    rdvs = RendezVous.query.order_by(RendezVous.date_rdv.desc()).all()
    return jsonify([rdv.to_dict() for rdv in rdvs])

@app.route('/api/rdv/<int:id>', methods=['GET'])
def get_rdv(id):
    """Get specific appointment"""
    rdv = RendezVous.query.get_or_404(id)
    return jsonify(rdv.to_dict())

@app.route('/api/rdv', methods=['POST'])
def create_rdv():
    """Create new appointment"""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('id_patient') or not data.get('nom_patient'):
        return jsonify({'error': 'Patient information required'}), 400
    
    # Validate date is not in the past
    try:
        rdv_datetime = datetime.strptime(f"{data['date_rdv']} {data['heure']}", "%Y-%m-%d %H:%M")
        if rdv_datetime < datetime.now():
            return jsonify({'error': 'Cannot set appointment for past date'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid date or time format'}), 400
    
    rdv = RendezVous(
        id_patient=data['id_patient'],
        nom_patient=data['nom_patient'],
        id_medecin=data.get('id_medecin', ''),
        nom_medecin=data.get('nom_medecin', ''),
        date_rdv=data['date_rdv'],
        heure=data['heure'],
        motif=data.get('motif', '')
    )
    
    db.session.add(rdv)
    db.session.commit()
    
    return jsonify(rdv.to_dict()), 201

@app.route('/api/rdv/<int:id>', methods=['PUT'])
def update_rdv(id):
    """Update appointment"""
    rdv = RendezVous.query.get_or_404(id)
    data = request.get_json()
    
    # Check if appointment is already terminated
    if rdv.statut == 'Terminé':
        return jsonify({'error': 'Cannot modify terminated appointment'}), 400
    
    # Validate date changes
    if 'date_rdv' in data and 'heure' in data:
        try:
            new_rdv_datetime = datetime.strptime(f"{data['date_rdv']} {data['heure']}", "%Y-%m-%d %H:%M")
            current_rdv_datetime = datetime.strptime(f"{rdv.date_rdv} {rdv.heure}", "%Y-%m-%d %H:%M")
            
            if new_rdv_datetime < datetime.now() and new_rdv_datetime != current_rdv_datetime:
                return jsonify({'error': 'Cannot set appointment for past date'}), 400
            
            # Check if trying to set status to 'Terminé' for future date
            if data.get('statut') == 'Terminé' and new_rdv_datetime > datetime.now():
                return jsonify({'error': 'Cannot mark future appointment as terminated'}), 400
                
        except ValueError:
            return jsonify({'error': 'Invalid date or time format'}), 400
    
    # Update fields
    rdv.date_rdv = data.get('date_rdv', rdv.date_rdv)
    rdv.heure = data.get('heure', rdv.heure)
    rdv.motif = data.get('motif', rdv.motif)
    rdv.id_medecin = data.get('id_medecin', rdv.id_medecin)
    rdv.nom_medecin = data.get('nom_medecin', rdv.nom_medecin)
    rdv.statut = data.get('statut', rdv.statut)
    
    db.session.commit()
    
    return jsonify(rdv.to_dict())

@app.route('/api/rdv/<int:id>', methods=['DELETE'])
def delete_rdv(id):
    """Delete appointment"""
    rdv = RendezVous.query.get_or_404(id)
    db.session.delete(rdv)
    db.session.commit()
    return jsonify({'message': 'Appointment deleted successfully'})

# ========================
# FACTURES API ROUTES
# ========================

@app.route('/api/factures', methods=['GET'])
def get_all_factures():
    """Get all invoices"""
    factures = Facture.query.order_by(Facture.date_creation.desc()).all()
    return jsonify([facture.to_dict() for facture in factures])

@app.route('/api/factures/<int:id>', methods=['GET'])
def get_facture(id):
    """Get specific invoice"""
    facture = Facture.query.get_or_404(id)
    return jsonify(facture.to_dict())

@app.route('/api/factures', methods=['POST'])
def create_facture():
    """Create new invoice"""
    data = request.get_json()
    
    # Validate patient has appointment
    rdv_exists = RendezVous.query.filter_by(id_patient=data['id_patient']).first()
    if not rdv_exists:
        return jsonify({'error': 'Patient must have an existing appointment'}), 400
    
    # Generate invoice number
    dernier_numero = Facture.query.count() + 1
    numero_facture = f"INV-2023-{dernier_numero:03d}"
    
    montant = float(data['montant'])
    remboursement_pct = float(data.get('remboursement_pct', 0))
    remboursement = montant * (remboursement_pct / 100)
    reste_a_payer = montant - remboursement
    
    facture = Facture(
        numero_facture=numero_facture,
        id_patient=data['id_patient'],
        nom_patient=data['nom_patient'],
        montant=montant,
        remboursement=remboursement,
        reste_a_payer=reste_a_payer,
        statut='Payée' if reste_a_payer == 0 else 'En attente'
    )
    
    db.session.add(facture)
    db.session.commit()
    
    return jsonify(facture.to_dict()), 201

@app.route('/api/factures/<int:id>', methods=['PUT'])
def update_facture(id):
    """Update invoice"""
    facture = Facture.query.get_or_404(id)
    data = request.get_json()
    
    # Check if already paid
    if facture.statut == 'Payée':
        return jsonify({'error': 'Cannot modify paid invoice'}), 400
    
    # Check if trying to mark as paid without terminated appointment
    if data.get('statut') == 'Payée':
        rdv_termine = RendezVous.query.filter_by(
            id_patient=facture.id_patient, 
            statut='Terminé'
        ).first()
        if not rdv_termine:
            return jsonify({'error': 'Cannot mark as paid without terminated appointment'}), 400
    
    montant = float(data.get('montant', facture.montant))
    remboursement_pct = float(data.get('remboursement_pct', 0))
    remboursement = montant * (remboursement_pct / 100)
    reste_a_payer = montant - remboursement
    
    facture.montant = montant
    facture.remboursement = remboursement
    facture.reste_a_payer = reste_a_payer
    facture.statut = data.get('statut', facture.statut)
    
    if data.get('statut') == 'Payée' and facture.statut != 'Payée':
        facture.date_paiement = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify(facture.to_dict())

@app.route('/api/factures/<int:id>', methods=['DELETE'])
def delete_facture(id):
    """Delete invoice"""
    facture = Facture.query.get_or_404(id)
    db.session.delete(facture)
    db.session.commit()
    return jsonify({'message': 'Invoice deleted successfully'})

# ========================
# ADDITIONAL API ENDPOINTS
# ========================

@app.route('/api/factures/patient/<string:id_patient>', methods=['GET'])
def get_factures_by_patient(id_patient):
    """Get invoices for specific patient"""
    factures = Facture.query.filter_by(id_patient=id_patient).all()
    return jsonify([facture.to_dict() for facture in factures])

@app.route('/api/rdv/today', methods=['GET'])
def get_rdv_today():
    """Get today's appointments"""
    from datetime import date
    today = date.today().isoformat()
    rdvs = RendezVous.query.filter(RendezVous.date_rdv == today).order_by(RendezVous.heure).all()
    return jsonify([rdv.to_dict() for rdv in rdvs])

@app.route('/api/rdv/patient/<string:id_patient>/last', methods=['GET'])
def get_last_rdv(id_patient):
    """Get last appointment for patient"""
    rdv = RendezVous.query.filter_by(id_patient=id_patient)\
                          .order_by(RendezVous.date_rdv.desc())\
                          .first()
    if not rdv:
        return jsonify({"last_rdv": None})
    return jsonify(rdv.to_dict())

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get revenue statistics"""
    from datetime import datetime
    current_year = datetime.now().year
    
    factures_payees = Facture.query.filter_by(statut='Payée').all()
    
    revenu_current_year = 0
    monthly_revenue = {i: 0.0 for i in range(1, 13)}
    
    for f in factures_payees:
        if f.date_paiement and f.date_paiement.year == current_year:
            revenu_current_year += f.montant
            month = f.date_paiement.month
            monthly_revenue[month] += f.montant
    
    monthly_data = [monthly_revenue[i] for i in range(1, 13)]
    
    return jsonify({
        "revenu_total": round(revenu_current_year, 2),
        "annee_courante": current_year,
        "revenus_mensuels": monthly_data,
        "total_factures": len(factures_payees)
    })

@app.route('/api/stats/historique', methods=['GET'])
def get_stats_historique():
    """Get historical revenue statistics"""
    factures_payees = Facture.query.filter_by(statut='Payée').all()
    
    historique = {}
    for f in factures_payees:
        if not f.date_paiement:
            continue
        year = f.date_paiement.year
        month = f.date_paiement.month
        
        if year not in historique:
            historique[year] = {i: 0.0 for i in range(1, 13)}
        
        historique[year][month] += f.montant
    
    result = []
    for year, months in sorted(historique.items(), reverse=True):
        monthly_list = [months[i] for i in range(1, 13)]
        total_year = sum(monthly_list)
        result.append({
            "annee": year,
            "total": round(total_year, 2),
            "mensuel": monthly_list
        })
    
    return jsonify(result)

@app.route('/api/config', methods=['GET'])
def get_config():
    """Get external service URLs"""
    return jsonify({
        'auth_url': AUTH_URL,
        'patients_url': PATIENTS_URL,
        'doctors_url': DOCTORS_URL
    })

# ========================
# ERROR HANDLERS
# ========================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == "__main__":
    app.run(host="localhost", port=5005, debug=True)