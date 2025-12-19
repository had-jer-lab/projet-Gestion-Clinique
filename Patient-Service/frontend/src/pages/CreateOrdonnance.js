import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patientsAPI, ordonnancesAPI } from '../services/api';

function CreateOrdonnance() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [age, setAge] = useState(0);
  const [medicaments, setMedicaments] = useState('');
  const [lastRdv, setLastRdv] = useState(null);

  useEffect(() => {
    loadPatient();
    loadLastRdv();
  }, [id]);

  const loadPatient = async () => {
    try {
      const response = await patientsAPI.getById(id);
      setPatient(response.data);
      calculateAge(response.data.date_naissance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLastRdv = async () => {
    try {
      const response = await patientsAPI.getLastRdv(id);
      setLastRdv(response.data);
    } catch (err) {
      console.error('Error loading last RDV:', err);
    }
  };

  const calculateAge = (dateNaissance) => {
    const birthDate = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    setAge(age);
  };

  const addQuickMed = (med) => {
    setMedicaments(prev => prev + med + '\n\n');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!medicaments.trim()) {
      alert('Veuillez saisir l\'ordonnance');
      return;
    }

    try {
      await ordonnancesAPI.create(id, { medicaments });
      navigate(`/patients/${id}`);
    } catch (err) {
      alert('Erreur lors de l\'enregistrement de l\'ordonnance');
      console.error(err);
    }
  };

  const handlePrint = () => {
    if (!medicaments.trim()) {
      alert('Veuillez saisir l\'ordonnance d\'abord!');
      return;
    }

    const printWindow = window.open('', '_blank');
    const doctorName = lastRdv?.nom_medecin ? `Dr. ${lastRdv.nom_medecin}` : 'Dr. Médecin généraliste';
    const currentDate = new Date().toLocaleDateString('fr-FR');

    printWindow.document.write(`
      <html>
        <head>
          <title>Ordonnance - ${patient.prenom} ${patient.nom}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #007bff; padding-bottom: 20px; }
            .doctor { text-align: right; font-size: 20px; color: #007bff; margin: 20px 0; font-weight: bold; }
            .ordonnance { font-family: 'Courier New', monospace; font-size: 17px; line-height: 2; white-space: pre-wrap; padding: 30px; border: 2px solid #007bff; border-radius: 12px; background: #f8fdff; }
            @media print { body { margin: 10mm; } }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <h1>ORDONNANCE MÉDICALE</h1>
            <h2>${patient.prenom} ${patient.nom}</h2>
            <p>Âge: ${age} ans | Tél: ${patient.telephone} | Date: ${currentDate}</p>
          </div>
          <div class="doctor">
            Médecin traitant : ${doctorName}
            ${lastRdv?.last_rdv ? `<br><small>(Dernière consultation : ${new Date(lastRdv.last_rdv).toLocaleDateString('fr-FR')})</small>` : ''}
          </div>
          <div class="ordonnance">${medicaments.replace(/\n/g, '<br>')}</div>
          <div style="margin-top: 60px; text-align: right; font-size: 16px;">
            <em>Signature du médecin</em>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (!patient) return <div className="error">Patient non trouvé</div>;

  return (
    <div className="ordonnance-container">
      {/* Header */}
      <div className="ordonnance-header">
        <div className="patient-info">
          <img
            src={`/uploads/${patient.photo}`}
            alt={patient.prenom}
            className="patient-photo"
            onError={(e) => { e.target.src = '/uploads/default.jpg'; }}
          />
          <div className="patient-details">
            <h1>{patient.prenom} {patient.nom}</h1>
            <p>Âge: {age} ans</p>
            <p>{patient.telephone}</p>
            <p>ID: {patient.id}</p>
          </div>
        </div>
        <div className="ordonnance-id">
          <h2>Nouvelle Ordonnance</h2>
          <span className="date-today">{new Date().toLocaleDateString('fr-FR')}</span>
          
          {lastRdv?.nom_medecin && (
            <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', textAlign: 'center' }}>
              <strong style={{ fontSize: '18px' }}>Dr. {lastRdv.nom_medecin}</strong>
              {lastRdv.last_rdv && (
                <>
                  <br />
                  <small>Dernière consultation : {new Date(lastRdv.last_rdv).toLocaleDateString('fr-FR')}</small>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="ordonnance-form">
        <div className="medicaments-section">
          <h3>Médicaments</h3>

          {/* Quick Meds */}
          <div className="quick-meds">
            <h4>Médicaments fréquents:</h4>
            <div className="med-buttons">
              <button
                type="button"
                className="quick-med-btn"
                onClick={() => addQuickMed('PARACÉTAMOL 500mg\n1cp 3x/jour pendant 5 jours')}
              >
                Paracétamol
              </button>
              <button
                type="button"
                className="quick-med-btn"
                onClick={() => addQuickMed('AMOXICILLINE 500mg\n1cp 3x/jour pendant 7 jours')}
              >
                Amoxicilline
              </button>
              <button
                type="button"
                className="quick-med-btn"
                onClick={() => addQuickMed('IBUPROFÈNE 400mg\n1cp 2x/jour si besoin')}
              >
                Ibuprofène
              </button>
              <button
                type="button"
                className="quick-med-btn"
                onClick={() => addQuickMed('AUGMENTIN 1g\n1cp 2x/jour pendant 7 jours')}
              >
                Augmentin
              </button>
              <button
                type="button"
                className="quick-med-btn"
                onClick={() => addQuickMed('DOLIPRANE 1000mg\n1cp 3x/jour')}
              >
                Doliprane
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div className="medicaments-input">
            <label>Ordonnance complète:</label>
            <textarea
              id="medicaments"
              rows="12"
              value={medicaments}
              onChange={(e) => setMedicaments(e.target.value)}
              placeholder="Exemple:
PARACÉTAMOL 500mg
1 comprimé 3 fois par jour pendant 5 jours

AMOXICILLINE 500mg
1 comprimé 3 fois par jour pendant 7 jours

Repos et hydratation abondante"
              required
            />
          </div>
        </div>

        {/* Allergies Alert */}
        {patient.allergies && (
          <div className="allergies-alert">
            <strong>⚠️ ATTENTION:</strong> Allergies: {patient.allergies}
          </div>
        )}

        {/* Actions */}
        <div className="ordonnance-actions">
          <button type="submit" className="btn-primary btn-large">
            Enregistrer Ordonnance
          </button>
          <button
            type="button"
            onClick={() => navigate(`/patients/${patient.id}`)}
            className="btn-secondary btn-large"
          >
            Retour Dossier
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-success btn-large"
          >
            🖨️ Imprimer
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateOrdonnance;