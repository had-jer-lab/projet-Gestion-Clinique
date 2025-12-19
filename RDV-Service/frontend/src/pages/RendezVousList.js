import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rdvAPI } from '../services/api';

function RendezVousList() {
  const [rdvs, setRdvs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRendezVous();
  }, []);

  const loadRendezVous = async () => {
    try {
      setLoading(true);
      const response = await rdvAPI.getAll();
      setRdvs(response.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des rendez-vous');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      try {
        await rdvAPI.delete(id);
        loadRendezVous();
      } catch (err) {
        alert('Erreur lors de la suppression');
        console.error(err);
      }
    }
  };

  const filteredRdvs = rdvs.filter(rdv => {
    const searchLower = searchTerm.toLowerCase();
    return (
      rdv.nom_patient.toLowerCase().includes(searchLower) ||
      rdv.nom_medecin?.toLowerCase().includes(searchLower) ||
      rdv.motif?.toLowerCase().includes(searchLower) ||
      rdv.statut.toLowerCase().includes(searchLower)
    );
  });

  const getStatusClass = (statut) => {
    switch (statut) {
      case 'Terminé': return 'status-termine';
      case 'En cours': return 'status-en-cours';
      case 'Annulé': return 'status-annule';
      default: return 'status-attente';
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page-container">
      <h1>Nos Rendez-vous</h1>
      
      <div className="page-header">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Rechercher un rendez-vous..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Link to="/rdv/add" className="button">+ Nouveau Rendez-vous</Link>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Heure</th>
              <th>Motif</th>
              <th>Patient</th>
              <th>Médecin</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRdvs.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-message">
                  Aucun rendez-vous enregistré. Cliquez sur "+ Nouveau Rendez-vous" pour commencer.
                </td>
              </tr>
            ) : (
              filteredRdvs.map(rdv => (
                <tr key={rdv.id_rdv}>
                  <td>RDV{String(rdv.id_rdv).padStart(3, '0')}</td>
                  <td>{rdv.date_rdv}</td>
                  <td>{rdv.heure}</td>
                  <td>{rdv.motif}</td>
                  <td>{rdv.nom_patient}</td>
                  <td>DR. {rdv.nom_medecin}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(rdv.statut)}`}>
                      {rdv.statut}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(rdv.id_rdv)}
                      className="action-button delete"
                      title="Supprimer"
                    >
                      🗑
                    </button>
                    <Link
                      to={`/rdv/edit/${rdv.id_rdv}`}
                      className="action-button edit"
                      title="Modifier"
                    >
                      ✏
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RendezVousList;