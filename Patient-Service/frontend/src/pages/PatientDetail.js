import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { patientsAPI, observationsAPI, ordonnancesAPI } from '../services/api';

function PatientDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRdv, setLastRdv] = useState(null);
  const [age, setAge] = useState(0);
  const [newObservation, setNewObservation] = useState('');

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
      setError('Erreur lors du chargement du patient');
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

  const handleAddObservation = async (e) => {
    e.preventDefault();
    if (!newObservation.trim()) return;

    try {
      await observationsAPI.create(id, { texte: newObservation });
      setNewObservation('');
      loadPatient();
    } catch (err) {
      alert('Erreur lors de l\'ajout de l\'observation');
      console.error(err);
    }
  };

  const handleDownloadPDF = async (ordId) => {
    try {
      const response = await ordonnancesAPI.getPDF(id, ordId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ordonnance_${patient.nom}_${ordId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Erreur lors du téléchargement du PDF');
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!patient) return <div className="error">Patient non trouvé</div>;

  return (
    <div className="patient-detail-container">
      {/* Header */}
      <div className="patient-header">
        <div className="patient-info">
          <img
            src={`/uploads/${patient.photo}`}
            className="patient-photo"
            alt={`${patient.prenom} ${patient.nom}`}
            onError={(e) => { e.target.src = '/uploads/default.jpg'; }}
          />
          <div>
            <h1>{patient.prenom} {patient.nom}</h1>
            <p><strong>{age} ans</strong> • {patient.sexe} • Groupe sanguin : <strong>{patient.groupe_sanguin}</strong></p>
            <p>Adresse : {patient.adresse}</p>
            <p>Téléphone : {patient.telephone} • Email : {patient.email || 'Non renseigné'}</p>
          </div>
        </div>
        <div className="header-actions">
          <Link to={`/patients/edit/${patient.id}`} className="btn-primary">
            Modifier
          </Link>
          <button onClick={() => navigate('/patients')} className="btn-secondary">
            Retour à la liste
          </button>
        </div>
      </div>

      {/* 3 Cards Grid */}
      <div className="grid-3">
        {/* Antécédents */}
        <div className="card">
          <h3>Antécédents Médicaux</h3>
          <strong>Allergies :</strong><br />
          {patient.allergies ? (
            <span className="tag allergy">{patient.allergies}</span>
          ) : (
            <span style={{ color: '#28a745' }}>Aucune allergie connue</span>
          )}
          <br /><br />
          <strong>Maladies chroniques :</strong><br />
          {patient.maladies ? (
            patient.maladies.split(', ').map((m, i) => (
              <div key={i}>{m}</div>
            ))
          ) : (
            'Aucune'
          )}
        </div>

        {/* Médecin Traitant */}
        <div className="card doctor-card">
          <h3>Médecin Traitant</h3>
          {lastRdv && lastRdv.nom_medecin ? (
            <div className="doctor-item">
              <div className="doctor-name">
                Dr. {lastRdv.nom_medecin}
              </div>
              {lastRdv.last_rdv && (
                <div className="doctor-date">
                  Dernier RDV : {new Date(lastRdv.last_rdv).toLocaleDateString('fr-FR')}
                </div>
              )}
            </div>
          ) : (
            <div className="doctor-empty">
              <p>Aucun rendez-vous enregistré</p>
            </div>
          )}
          <a
            href={`http://localhost:5005/ajouter_rdv?patient_id=${patient.id}&nom_patient=${patient.prenom} ${patient.nom}`}
            className="btn-rdv-small"
            target="_blank"
            rel="noopener noreferrer"
          >
            Nouveau RDV
          </a>
        </div>

        {/* Nouvelle Observation */}
        <div className="card">
          <h3>Nouvelle Observation</h3>
          <form onSubmit={handleAddObservation}>
            <textarea
              placeholder="Écrivez votre observation clinique..."
              rows="3"
              value={newObservation}
              onChange={(e) => setNewObservation(e.target.value)}
              required
            />
            <br /><br />
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Ajouter Observation
            </button>
          </form>
        </div>
      </div>

      {/* Ordonnance Section */}
      <div className="card full-width">
        <h3>Nouvelle Ordonnance</h3>
        <div style={{ textAlign: 'center', marginTop: '25px' }}>
          <Link to={`/patients/${patient.id}/ordonnance`} className="btn-primary btn-full">
            Créer Ordonnance Complète
          </Link>
        </div>
      </div>

      {/* Timeline Observations */}
      <div className="card full-width" style={{ marginTop: '30px' }}>
        <h3>Suivi Clinique</h3>
        {patient.observations && patient.observations.length > 0 ? (
          <div className="timeline">
            {patient.observations
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map(obs => (
                <div key={obs.id} className="timeline-item">
                  <div className="timeline-date">{obs.date}</div>
                  <div className="timeline-content">
                    <p>{obs.texte}</p>
                    <small>par Dr. {obs.auteur_id || 'Inconnu'}</small>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#999', padding: '40px', fontStyle: 'italic' }}>
            Aucune observation pour le moment.
          </p>
        )}
      </div>

      {/* Tableau Ordonnances */}
      <div className="card full-width" style={{ marginTop: '30px' }}>
        <h3>Ordonnances</h3>
        {patient.ordonnances && patient.ordonnances.length > 0 ? (
          <table className="ordonnances-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Médicaments</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {patient.ordonnances
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(ord => (
                  <tr key={ord.id}>
                    <td style={{ fontWeight: '600', color: '#007bff' }}>{ord.id}</td>
                    <td>{ord.date}</td>
                    <td style={{ whiteSpace: 'pre-line', fontSize: '0.9em', maxWidth: '400px' }}>
                      {ord.medicaments.substring(0, 100)}...
                    </td>
                    <td>
                      <button
                        onClick={() => handleDownloadPDF(ord.id)}
                        className="btn-small"
                      >
                        📄 PDF
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', color: '#999', padding: '40px', fontStyle: 'italic' }}>
            Aucune ordonnance enregistrée.
          </p>
        )}
      </div>
    </div>
  );
}

export default PatientDetail;