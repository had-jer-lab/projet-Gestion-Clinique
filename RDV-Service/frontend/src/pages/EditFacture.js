import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { facturesAPI } from '../services/api';

function EditFacture() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [formData, setFormData] = useState({
    numero_facture: '',
    nom_patient: '',
    montant: '',
    remboursement: '',
    reste_a_payer: '',
    statut: '',
    date_paiement: null
  });
  const [remboursementPct, setRemboursementPct] = useState(0);

  useEffect(() => {
    loadFacture();
  }, [id]);

  const loadFacture = async () => {
    try {
      const response = await facturesAPI.getById(id);
      const facture = response.data;
      setFormData(facture);
      setIsPaid(facture.statut === 'Payée');
      
      // Calculate remboursement percentage
      if (facture.montant > 0) {
        setRemboursementPct((facture.remboursement / facture.montant * 100).toFixed(0));
      }
    } catch (err) {
      setError('Erreur lors du chargement de la facture');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateReste = (montant, pct) => {
    const m = parseFloat(montant) || 0;
    const p = parseFloat(pct) || 0;
    const remb = m * (p / 100);
    return m - remb;
  };

  const calculateRemboursement = (montant, pct) => {
    const m = parseFloat(montant) || 0;
    const p = parseFloat(pct) || 0;
    return m * (p / 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isPaid) {
      setError('Cette facture est déjà payée et ne peut plus être modifiée.');
      return;
    }

    try {
      const updateData = {
        montant: parseFloat(formData.montant),
        remboursement_pct: parseFloat(remboursementPct),
        statut: formData.statut
      };

      const response = await facturesAPI.update(id, updateData);
      
      if (response.data.statut === 'Payée') {
        setSuccess('Facture mise à jour et payée avec succès. Impression du reçu en cours...');
        setIsPaid(true);
        setFormData(response.data);
        setTimeout(() => window.print(), 500);
      } else {
        navigate('/factures');
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Erreur lors de la mise à jour de la facture');
      }
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page-container">
      <h1>Gestion des Factures</h1>

      <div className="card">
        <h2>Modifier la Facture {formData.numero_facture}</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {isPaid ? (
          <>
            <div className="printable" style={{ padding: '20px' }}>
              <h4>Reçu de Paiement</h4>
              <h3 style={{ marginBottom: '20px' }}>Confirmation de Paiement</h3>
              <p><strong>Patient :</strong> {formData.nom_patient} (ID: {formData.id_patient})</p>
              <p><strong>Numéro de facture :</strong> {formData.numero_facture}</p>
              <p><strong>Montant total de la facture :</strong> {formData.montant} DA</p>
              <p><strong>Remboursement :</strong> {formData.remboursement} DA</p>
              <p><strong>Montant payé (reste à payer) :</strong> {formData.reste_a_payer} DA</p>
              <p><strong>Date de paiement :</strong> {formData.date_paiement || 'Non défini'}</p>
              <p><strong>Statut :</strong> {formData.statut}</p>
              <p style={{ marginTop: '20px' }}>Ce document confirme que le patient a payé la facture ci-dessus.</p>
            </div>
            <div className="form-actions" style={{ padding: '20px' }}>
              <button onClick={() => navigate('/factures')} className="button-secondary">
                Retour à la liste
              </button>
              <button onClick={() => window.print()} className="button">
                🖨️ Imprimer le reçu
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3>Informations de la Facture</h3>

            <label>Numéro de Facture</label>
            <input
              type="text"
              value={formData.numero_facture}
              disabled
              style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
            />

            <label>Patient</label>
            <input
              type="text"
              value={formData.nom_patient}
              disabled
              style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
            />

            <h3>Détails Financiers</h3>

            <label>Montant (DA) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
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
              value={remboursementPct}
              onChange={(e) => setRemboursementPct(e.target.value)}
              required
            />

            <label>Statut *</label>
            <select
              value={formData.statut}
              onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
              required
            >
              <option value="En attente">En attente</option>
              <option value="Payée">Payée</option>
              <option value="Annulée">Annulée</option>
            </select>

            <div className="summary-box">
              <div className="summary-row">
                <span>Montant:</span>
                <strong>{parseFloat(formData.montant || 0).toFixed(2)} DA</strong>
              </div>
              <div className="summary-row">
                <span>Remboursement:</span>
                <strong>{calculateRemboursement(formData.montant, remboursementPct).toFixed(2)} DA</strong>
              </div>
              <div className="summary-row summary-total">
                <span>Reste à payer:</span>
                <strong>{calculateReste(formData.montant, remboursementPct).toFixed(2)} DA</strong>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/factures')} className="button-secondary">
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

export default EditFacture;