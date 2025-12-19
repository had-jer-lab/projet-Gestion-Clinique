import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { facturesAPI, rdvAPI, externalAPI } from '../services/api';

function AddFacture({ config }) {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    id_patient: '',
    nom_patient: '',
    montant: '',
    remboursement_pct: '0'
  });

  useEffect(() => {
    loadPatients();
  }, [config]);

  const loadPatients = async () => {
    if (config.patients_url) {
      try {
        // Get all patients
        const allPatients = await externalAPI.getPatients(config.patients_url);
        
        // Get all appointments to filter patients with RDV
        const rdvResponse = await rdvAPI.getAll();
        const patientIdsWithRdv = new Set(rdvResponse.data.map(rdv => rdv.id_patient));
        
        // Filter patients who have appointments
        const filteredPatients = allPatients.filter(p => 
          patientIdsWithRdv.has(p.id || p.id_patient)
        );
        
        setPatients(filteredPatients);
      } catch (err) {
        console.error('Failed to load patients:', err);
      }
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

  const calculateReste = () => {
    const montant = parseFloat(formData.montant) || 0;
    const remboursementPct = parseFloat(formData.remboursement_pct) || 0;
    const remboursement = montant * (remboursementPct / 100);
    return montant - remboursement;
  };

  const calculateRemboursement = () => {
    const montant = parseFloat(formData.montant) || 0;
    const remboursementPct = parseFloat(formData.remboursement_pct) || 0;
    return montant * (remboursementPct / 100);
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
      await facturesAPI.create(formData);
      navigate('/factures');
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Erreur lors de la création de la facture');
      }
      console.error(err);
    }
  };

  return (
    <div className="page-container">
      <h1>Gestion des Factures</h1>

      <div className="card">
        <h2>Créer une Nouvelle Facture</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
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
                Aucun patient avec RDV trouvé
              </option>
            ) : (
              patients.map(patient => (
                <option key={patient.id || patient.id_patient} value={patient.id || patient.id_patient}>
                  {patient.prenom || patient.first_name} {patient.nom || patient.last_name}
                </option>
              ))
            )}
          </select>

          <h3>Informations de Facturation</h3>

          <label>Montant (DA) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Ex: 150.00"
            value={formData.montant}
            onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
            required
          />

          <label>Taux de Remboursement (%) *</label>
          <input
            type="number"
            step="1"
            min="0"
            max="100"
            placeholder="Ex: 10"
            value={formData.remboursement_pct}
            onChange={(e) => setFormData({ ...formData, remboursement_pct: e.target.value })}
            required
          />

          <div className="summary-box">
            <div className="summary-row">
              <span>Montant:</span>
              <strong>{parseFloat(formData.montant || 0).toFixed(2)} DA</strong>
            </div>
            <div className="summary-row">
              <span>Remboursement:</span>
              <strong>{calculateRemboursement().toFixed(2)} DA</strong>
            </div>
            <div className="summary-row summary-total">
              <span>Reste à payer:</span>
              <strong>{calculateReste().toFixed(2)} DA</strong>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/factures')} className="button-secondary">
              Annuler
            </button>
            <button type="submit" className="button">
              💾 Enregistrer la facture
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddFacture;