import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { patientsAPI } from '../services/api';
import './PatientsList.css';

function PatientsList() {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRdvs, setLastRdvs] = useState({});

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async (search = '') => {
    try {
      setLoading(true);
      const response = await patientsAPI.getAll(search);
      setPatients(response.data);
      
      // Load last RDV for each patient
      response.data.forEach(patient => {
        loadLastRdv(patient.id);
      });
      
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des patients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLastRdv = async (patientId) => {
    try {
      const response = await patientsAPI.getLastRdv(patientId);
      setLastRdvs(prev => ({
        ...prev,
        [patientId]: response.data.last_rdv || 'Aucun'
      }));
    } catch (err) {
      setLastRdvs(prev => ({
        ...prev,
        [patientId]: 'Aucun'
      }));
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadPatients(searchQuery);
  };

  const handleDelete = async (id, nom, prenom) => {
    if (window.confirm(`Supprimer ${prenom} ${nom} ?`)) {
      try {
        await patientsAPI.delete(id);
        loadPatients(searchQuery);
      } catch (err) {
        alert('Erreur lors de la suppression');
        console.error(err);
      }
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="patients-container">
      <div className="header">
        <h1>Gestion des Patients</h1>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Rechercher un patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        <Link to="/patients/add" className="btn-primary">
          + Nouveau Patient
        </Link>
      </div>

      <table className="patients-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Date Naissance</th>
            <th>Sexe</th>
            <th>Téléphone</th>
            <th>Email</th>
            <th>Groupe</th>
            <th>Allergies</th>
            <th>Maladies</th>
            <th>Dernier RDV</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.length === 0 ? (
            <tr>
              <td colSpan="12" className="empty-message">
                {searchQuery ? 'Aucun patient trouvé' : 'Aucun patient'}
              </td>
            </tr>
          ) : (
            patients.map(patient => (
              <tr key={patient.id}>
                <td><strong>#{patient.id}</strong></td>
                <td><strong>{patient.nom}</strong></td>
                <td>{patient.prenom}</td>
                <td>{patient.date_naissance.replace(/-/g, '/')}</td>
                <td>{patient.sexe}</td>
                <td>{patient.telephone}</td>
                <td>{patient.email || '—'}</td>
                <td>{patient.groupe_sanguin}</td>
                <td>
                  {patient.allergies ? (
                    patient.allergies.length > 15 
                      ? `${patient.allergies.substring(0, 15)}...` 
                      : patient.allergies
                  ) : 'Aucune'}
                </td>
                <td>
                  {patient.maladies ? (
                    patient.maladies.length > 20 
                      ? `${patient.maladies.substring(0, 20)}...` 
                      : patient.maladies
                  ) : 'Aucune'}
                </td>
                <td className="last-rdv">
                  <strong>{lastRdvs[patient.id] || '...'}</strong>
                </td>
                <td className="actions">
                  <button
                    onClick={() => handleDelete(patient.id, patient.nom, patient.prenom)}
                    className="btn-action btn-delete"
                    title="Supprimer"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                  <Link
                    to={`/patients/edit/${patient.id}`}
                    className="btn-action btn-edit"
                    title="Modifier"
                  >
                    <i className="fas fa-edit"></i>
                  </Link>
                  <Link
                    to={`/patients/${patient.id}`}
                    className="btn-action btn-view"
                    title="Voir Dossier"
                  >
                    <i className="fas fa-eye"></i>
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default PatientsList;

