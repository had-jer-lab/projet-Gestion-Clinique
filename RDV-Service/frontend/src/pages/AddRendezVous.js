import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rdvAPI, externalAPI } from '../services/api';

function AddRendezVous({ config }) {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    id_patient: '',
    nom_patient: '',
    id_medecin: '',
    nom_medecin: '',
    date_rdv: '',
    heure: '',
    motif: ''
  });

  useEffect(() => {
    loadData();
  }, [config]);

  const loadData = async () => {
    if (config.patients_url) {
      const patientsData = await externalAPI.getPatients(config.patients_url);
      setPatients(patientsData);
    }
    if (config.doctors_url) {
      const doctorsData = await externalAPI.getDoctors(config.doctors_url);
      setMedecins(doctorsData);
    }
  };

  const handlePatientChange = (e) => {
    const selectedId = e.target.value;
    const patient = patients.find(p => (p.id || p.id_patient) === selectedId);
    
    if (patient) {
      setFormData({
        ...formData,
        id_patient: selectedId,
        nom_patient: `${patient.prenom || patient.first_name} ${patient.nom || patient.last_name}`
      });
    }
  };

  const handleMedecinChange = (e) => {
    const selectedId = e.target.value;
    const medecin = medecins.find(m => m.id === selectedId);
    
    if (medecin) {
      setFormData({
        ...formData,
        id_medecin: selectedId,
        nom_medecin: medecin.nom_complet
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.id_patient) {
      setError('Veuillez sélectionner un patient');
      return;
    }

    if (!formData.nom_patient) {
      setError('Le nom du patient est vide');
      return;
    }

    try {
      await rdvAPI.create(formData);
      navigate('/rdv');
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Erreur lors de la création du rendez-vous');
      }
      console.error(err);
    }
  };

  return (
    <div className="page-container">
      <h1>Gestion des Rendez-vous</h1>

      <div className="card">
        <h2>Ajouter un Rendez-vous</h2>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <h3>Informations du Rendez-vous</h3>

          <label>Date du rendez-vous *</label>
          <input
            type="date"
            value={formData.date_rdv}
            onChange={(e) => setFormData({ ...formData, date_rdv: e.target.value })}
            required
          />

          <label>Heure *</label>
          <input
            type="time"
            value={formData.heure}
            onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
            required
          />

          <label>Motif *</label>
          <input
            type="text"
            value={formData.motif}
            onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
            required
          />

          <h3>Sélectionner le Patient</h3>

          <label>Patient *</label>
          <select
            value={formData.id_patient}
            onChange={handlePatientChange}
            required
          >
            <option value="">-- Sélectionnez un patient --</option>
            {patients.length === 0 ? (
              <option value="" disabled style={{ color: 'red' }}>
                Aucun patient trouvé (vérifiez le serveur)
              </option>
            ) : (
              patients.map(patient => (
                <option key={patient.id || patient.id_patient} value={patient.id || patient.id_patient}>
                  {patient.prenom || patient.first_name} {patient.nom || patient.last_name} ({patient.telephone})
                </option>
              ))
            )}
          </select>

          <h3>Sélectionner le Médecin</h3>

          <label>Médecin</label>
          <select
            value={formData.id_medecin}
            onChange={handleMedecinChange}
          >
            <option value="">-- Sélectionnez un médecin --</option>
            {medecins.map(medecin => (
              <option key={medecin.id} value={medecin.id}>
                Dr. {medecin.nom_complet}
              </option>
            ))}
          </select>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/rdv')} className="button-secondary">
              Annuler
            </button>
            <button type="submit" className="button">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddRendezVous;