from flask import Flask, request, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
from datetime import datetime
from werkzeug.utils import secure_filename
import os
import io
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
import requests

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'clinique2025')

# CORS configuration for React frontend
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///patients.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024

db = SQLAlchemy(app)
migrate = Migrate(app, db)
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# External service URLs
RDV_SERVICE_URL = os.getenv('RDV_SERVICE_URL', "http://localhost:5005")
DOCTORS_SERVICE_URL = os.getenv('DOCTORS_SERVICE_URL', "http://localhost:5001")

# ==================== MODELS ====================
class Patient(db.Model):
    id = db.Column(db.String(10), primary_key=True)
    nom = db.Column(db.String(50), nullable=False)
    prenom = db.Column(db.String(50), nullable=False)
    date_naissance = db.Column(db.String(20), nullable=False)
    sexe = db.Column(db.String(10), nullable=False)
    telephone = db.Column(db.String(30), nullable=False)
    email = db.Column(db.String(100))
    adresse = db.Column(db.String(200), nullable=False)
    groupe_sanguin = db.Column(db.String(5), nullable=False)
    allergies = db.Column(db.Text)
    maladies = db.Column(db.Text)
    photo = db.Column(db.String(100), default='default.jpg')
    observations = db.relationship('Observation', backref='patient', lazy=True, cascade="all, delete-orphan")
    ordonnances = db.relationship('Ordonnance', backref='patient', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self, include_details=False):
        data = {
            'id': self.id,
            'nom': self.nom,
            'prenom': self.prenom,
            'nom_complet': f"{self.prenom} {self.nom}",
            'date_naissance': self.date_naissance,
            'sexe': self.sexe,
            'telephone': self.telephone,
            'email': self.email,
            'adresse': self.adresse,
            'groupe_sanguin': self.groupe_sanguin,
            'allergies': self.allergies,
            'maladies': self.maladies,
            'photo': self.photo
        }
        
        if include_details:
            data['observations'] = [obs.to_dict() for obs in self.observations]
            data['ordonnances'] = [ord.to_dict() for ord in self.ordonnances]
            
        return data

class Observation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(20), nullable=False)
    texte = db.Column(db.Text, nullable=False)
    auteur_id = db.Column(db.String(10))
    patient_id = db.Column(db.String(10), db.ForeignKey('patient.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date,
            'texte': self.texte,
            'auteur_id': self.auteur_id,
            'patient_id': self.patient_id
        }

class Ordonnance(db.Model):
    id = db.Column(db.String(10), primary_key=True)
    date = db.Column(db.String(20), nullable=False)
    medicaments = db.Column(db.Text, nullable=False)
    patient_id = db.Column(db.String(10), db.ForeignKey('patient.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date,
            'medicaments': self.medicaments,
            'patient_id': self.patient_id
        }

with app.app_context():
    db.create_all()

# ==================== PATIENTS API ====================
@app.route('/api/patients', methods=['GET'])
def get_all_patients():
    """Get all patients"""
    search = request.args.get('q', '').strip()
    
    if search:
        patients = Patient.query.filter(
            db.or_(
                Patient.nom.contains(search),
                Patient.prenom.contains(search),
                Patient.telephone.contains(search),
                Patient.id.contains(search)
            )
        ).order_by(Patient.nom).all()
    else:
        patients = Patient.query.order_by(Patient.nom).all()
    
    return jsonify([p.to_dict() for p in patients])

@app.route('/api/patients/<patient_id>', methods=['GET'])
def get_patient(patient_id):
    """Get specific patient with details"""
    patient = Patient.query.get_or_404(patient_id)
    return jsonify(patient.to_dict(include_details=True))

@app.route('/api/patients', methods=['POST'])
def create_patient():
    """Create new patient"""
    data = request.form
    photo = request.files.get('photo')
    filename = "default.jpg"
    
    if photo and photo.filename:
        filename = secure_filename(photo.filename)
        photo.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    
    # Generate new patient ID
    last_patient = Patient.query.order_by(Patient.id.desc()).first()
    if last_patient and last_patient.id.startswith('PT'):
        try:
            num = int(last_patient.id[2:])
            new_id = f"PT{num+1:03d}"
        except:
            new_id = "PT001"
    else:
        new_id = "PT001"
    
    patient = Patient(
        id=new_id,
        nom=data['nom'],
        prenom=data['prenom'],
        date_naissance=data['date_naissance'],
        sexe=data['sexe'],
        telephone=data['telephone'],
        email=data.get('email'),
        adresse=data['adresse'],
        groupe_sanguin=data['groupe_sanguin'],
        allergies=data.get('allergies'),
        maladies=data.get('maladies'),
        photo=filename
    )
    
    db.session.add(patient)
    db.session.commit()
    
    return jsonify(patient.to_dict()), 201

@app.route('/api/patients/<patient_id>', methods=['PUT'])
def update_patient(patient_id):
    """Update patient"""
    patient = Patient.query.get_or_404(patient_id)
    data = request.form
    
    photo = request.files.get('photo')
    if photo and photo.filename:
        filename = secure_filename(photo.filename)
        photo.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        patient.photo = filename
    
    patient.nom = data.get('nom', patient.nom)
    patient.prenom = data.get('prenom', patient.prenom)
    patient.date_naissance = data.get('date_naissance', patient.date_naissance)
    patient.sexe = data.get('sexe', patient.sexe)
    patient.telephone = data.get('telephone', patient.telephone)
    patient.email = data.get('email', patient.email)
    patient.adresse = data.get('adresse', patient.adresse)
    patient.groupe_sanguin = data.get('groupe_sanguin', patient.groupe_sanguin)
    patient.allergies = data.get('allergies', patient.allergies)
    patient.maladies = data.get('maladies', patient.maladies)
    
    db.session.commit()
    
    return jsonify(patient.to_dict())

@app.route('/api/patients/<patient_id>', methods=['DELETE'])
def delete_patient(patient_id):
    """Delete patient"""
    patient = Patient.query.get_or_404(patient_id)
    
    if patient.photo != 'default.jpg':
        path = os.path.join(app.config['UPLOAD_FOLDER'], patient.photo)
        if os.path.exists(path):
            os.remove(path)
    
    db.session.delete(patient)
    db.session.commit()
    
    return jsonify({'message': 'Patient deleted successfully'})

# ==================== OBSERVATIONS API ====================
@app.route('/api/patients/<patient_id>/observations', methods=['POST'])
def add_observation(patient_id):
    """Add observation to patient"""
    patient = Patient.query.get_or_404(patient_id)
    data = request.get_json()
    
    obs = Observation(
        date=datetime.today().strftime("%Y-%m-%d"),
        texte=data['texte'],
        auteur_id=data.get('auteur_id', 'D001'),
        patient_id=patient_id
    )
    
    db.session.add(obs)
    db.session.commit()
    
    return jsonify(obs.to_dict()), 201

# ==================== ORDONNANCES API ====================
def generate_ordonnance_id():
    last_ord = Ordonnance.query.order_by(Ordonnance.id.desc()).first()
    if not last_ord:
        return "ORD001"
    last_num = int(last_ord.id.replace("ORD", ""))
    return f"ORD{last_num + 1:03d}"

@app.route('/api/patients/<patient_id>/ordonnances', methods=['POST'])
def create_ordonnance(patient_id):
    """Create ordonnance for patient"""
    patient = Patient.query.get_or_404(patient_id)
    data = request.get_json()
    
    ord_id = generate_ordonnance_id()
    
    ordon = Ordonnance(
        id=ord_id,
        date=datetime.today().strftime("%Y-%m-%d"),
        medicaments=data['medicaments'],
        patient_id=patient_id
    )
    
    db.session.add(ordon)
    db.session.commit()
    
    return jsonify(ordon.to_dict()), 201

@app.route('/api/patients/<patient_id>/ordonnances/<ord_id>/pdf', methods=['GET'])
def get_ordonnance_pdf(patient_id, ord_id):
    """Generate PDF for ordonnance"""
    patient = Patient.query.get_or_404(patient_id)
    ordonnance = Ordonnance.query.get_or_404(ord_id)
    
    # Get doctor name from RDV service
    doctor_name = "Dr. Médecin Généraliste"
    try:
        response = requests.get(f"{RDV_SERVICE_URL}/api/last_rdv/{patient_id}", timeout=3)
        if response.status_code == 200:
            data = response.json()
            nom_medecin = data.get('nom_medecin')
            if nom_medecin:
                doctor_name = f"Dr. {nom_medecin}"
    except:
        pass
    
    # Calculate age
    date_naiss = datetime.strptime(patient.date_naissance, "%Y-%m-%d")
    today = datetime.today()
    age = today.year - date_naiss.year
    if (today.month, today.day) < (date_naiss.month, date_naiss.day):
        age -= 1
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=80)
    styles = getSampleStyleSheet()
    elements = []
    
    elements.append(Paragraph("ORDONNANCE MÉDICALE", styles['Title']))
    elements.append(Spacer(1, 30))
    
    elements.append(Paragraph(
        f"<b>Patient :</b> {patient.prenom} {patient.nom} ({age} ans)",
        styles['Normal']
    ))
    elements.append(Paragraph(f"<b>Date :</b> {ordonnance.date}", styles['Normal']))
    elements.append(Paragraph(f"Médecin : {doctor_name}", styles['Normal']))
    elements.append(Spacer(1, 40))
    
    meds = [m.strip() for m in ordonnance.medicaments.split('\n') if m.strip()]
    data = [["Médicament / Posologie"]] + [[m] for m in meds]
    
    table = Table(data, colWidths=[480])
    table.setStyle([
        ('GRID', (0, 0), (-1, -1), 0.7, colors.grey),
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('LEFTPADDING', (0, 1), (-1, -1), 15),
        ('TOPPADDING', (0, 1), (-1, -1), 15),
    ])
    
    elements.append(table)
    doc.build(elements)
    
    buffer.seek(0)
    response = make_response(buffer.getvalue())
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = (
        f'attachment; filename=Ordonnance_{patient.nom}_{ordonnance.id}.pdf'
    )
    return response

# ==================== EXTERNAL SERVICE INTEGRATION ====================
@app.route('/api/patients/<patient_id>/last-rdv', methods=['GET'])
def get_patient_last_rdv(patient_id):
    """Get patient's last RDV from RDV service"""
    try:
        response = requests.get(f"{RDV_SERVICE_URL}/api/last_rdv/{patient_id}", timeout=3)
        if response.status_code == 200:
            return jsonify(response.json())
        return jsonify({"last_rdv": None})
    except:
        return jsonify({"last_rdv": None})

@app.route('/api/config', methods=['GET'])
def get_config():
    """Get external service URLs"""
    return jsonify({
        'rdv_url': RDV_SERVICE_URL,
        'doctors_url': DOCTORS_SERVICE_URL
    })

# ==================== ERROR HANDLERS ====================
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    
    app.run(host="localhost", port=5001, debug=True)