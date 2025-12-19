import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { facturesAPI } from '../services/api';

function FacturesList() {
  const [factures, setFactures] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFactures();
  }, []);

  const loadFactures = async () => {
    try {
      setLoading(true);
      const response = await facturesAPI.getAll();
      setFactures(response.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des factures');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      try {
        await facturesAPI.delete(id);
        loadFactures();
      } catch (err) {
        alert('Erreur lors de la suppression');
        console.error(err);
      }
    }
  };

  const filteredFactures = factures.filter(facture => {
    const searchLower = searchTerm.toLowerCase();
    return (
      facture.nom_patient.toLowerCase().includes(searchLower) ||
      facture.numero_facture.toLowerCase().includes(searchLower) ||
      facture.statut.toLowerCase().includes(searchLower)
    );
  });

  const getStatusClass = (statut) => {
    switch (statut) {
      case 'Payée': return 'status-payee';
      case 'Annulée': return 'status-annulee';
      default: return 'status-attente';
    }
  };

  const calculateRemboursementPct = (facture) => {
    if (facture.montant > 0) {
      return ((facture.remboursement / facture.montant) * 100).toFixed(0);
    }
    return 0;
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page-container">
      <h1>Nos Factures</h1>

      <div className="page-header">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Rechercher un patient..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Link to="/factures/add" className="button">+ Nouvelle Facture</Link>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Patient</th>
              <th>Montant</th>
              <th>Remise</th>
              <th>Reste à payer</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFactures.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-message">
                  Aucune facture enregistrée. Cliquez sur "+ Nouvelle Facture" pour commencer.
                </td>
              </tr>
            ) : (
              filteredFactures.map(facture => (
                <tr key={facture.id_facture}>
                  <td><strong>{facture.numero_facture}</strong></td>
                  <td>{facture.nom_patient}</td>
                  <td>{facture.montant.toFixed(2)} DA</td>
                  <td>{calculateRemboursementPct(facture)}%</td>
                  <td><strong>{facture.reste_a_payer.toFixed(2)} DA</strong></td>
                  <td>
                    <span className={`status-badge ${getStatusClass(facture.statut)}`}>
                      {facture.statut}
                    </span>
                  </td>
                  <td>{facture.date_creation}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(facture.id_facture)}
                      className="action-button delete"
                      title="Supprimer"
                    >
                      🗑
                    </button>
                    <Link
                      to={`/factures/edit/${facture.id_facture}`}
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

export default FacturesList;