import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { rdvAPI, externalAPI } from '../services/api';

function EditRendezVous({ config }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [medecins, setMedecins] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTerminated, setIsTerminated] = useState(false);
  const [formData, setFormData] = useState({
    date_rdv: '',
    heure: '',
    motif: '',
    id_medecin: '',
    nom_medecin: '',
    statut: '',
    nom_patient: ''
  });

  useEffect(() => {
    loadData();
  }, [id, config]);

  const loadData = async () => {
    try {
      // Load appointment data
      const response = await rdvAPI.getById(id);
      const rdv = response.data;
      setFormData(rdv);
      setIsTerminated(rdv.statut === 'Terminé');

      // Load doctors
      if (config.doctors_url) {
        const doctorsData = await externalAPI.getDoctors(config.doctors_url);
        setMedecins(doctorsData);
      }
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
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
    setSuccess('');

    if (isTerminated) {
      setError('Ce rendez-vous est déjà terminé et ne peut plus être modifié.');
      return;
    }

    try {
      const response = await rdvAPI.update(id, formData);
      
      if (response.data.statut === 'Terminé') {
        setSuccess('Rendez-vous mis à jour et terminé avec succès.');
        setIsTerminated(true);
        setTimeout(() => window.print(), 500);
      } else {
        navigate('/rdv');
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Erreur lors de la mise à jour du rendez-vous');
      }
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page-container">
      <h1>Gestion des Rendez-vous</h1>

      <div className="card">
        <h2>Modifier le Rendez-vous RDV{String(id).padStart(3, '0')}</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {isTerminated ? (
          <>
            <div className="printable" style={{ padding: '20px' }}>
              <h4>Confirmation de Rendez-vous Terminé</h4>
              <p><strong>Patient :</strong> {formData.nom_patient}</p>
              <p><strong>Date :</strong> {formData.date_rdv}</p>
              <p><strong>Heure :</strong> {formData.heure}</p>
              <p><strong>Médecin :</strong> Dr. {formData.nom_medecin}</p>
              <p><strong>Motif :</strong> {formData.motif}</p>
              <p><strong>Statut :</strong> {formData.statut}</p>
            </div>
            <div className="form-actions" style={{ padding: '20px' }}>
              <button onClick={() => navigate('/rdv')} className="button-secondary">
                Retour à la liste
              </button>
              <button onClick={() => window.print()} className="button">
                🖨️ Imprimer
              </button>
            </div>
          </>
        ) : (
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

            <label>Patient</label>
            <input
              type="text"
              value={formData.nom_patient}
              disabled
              style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
            />

            <label>Médecin</label>
            <select value={formData.id_medecin} onChange={handleMedecinChange}>
              <option value="">-- Sélectionnez un médecin --</option>
              {medecins.map(medecin => (
                <option key={medecin.id} value={medecin.id}>
                  Dr. {medecin.nom_complet}
                </option>
              ))}
            </select>

            <label>Statut *</label>
            <select
              value={formData.statut}
              onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
              required
            >
              <option value="En attente">En attente</option>
              <option value="Terminé">Terminé</option>
              <option value="En cours">En cours</option>
              <option value="Annulé">Annulé</option>
            </select>

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/rdv')} className="button-secondary">
                Annuler
              </button>
              <button type="submit" className="button">
                💾 Enregistrer les modifications
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default EditRendezVous;