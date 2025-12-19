import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsAPI } from '../services/api';

function AddPatient() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState('/uploads/default.jpg');
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    date_naissance: '',
    sexe: '',
    telephone: '',
    email: '',
    adresse: '',
    groupe_sanguin: '',
    allergies: '',
    maladies: '',
    photo: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file
      }));
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== '') {
        data.append(key, formData[key]);
      }
    });

    try {
      await patientsAPI.create(data);
      navigate('/patients');
    } catch (err) {
      setError('Erreur lors de l\'ajout du patient');
      console.error(err);
    }
  };

  return (
    <div className="form-container">
      <h1>Ajouter un Nouveau Patient</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="photo-section">
          <label htmlFor="photo">
            <img
              id="preview"
              src={photoPreview}
              alt="Preview"
              className="photo-preview"
            />
            <p>Cliquez pour ajouter une photo</p>
          </label>
          <input
            type="file"
            name="photo"
            id="photo"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ display: 'none' }}
          />
        </div>

        <div className="form-grid">
          <input
            type="text"
            name="nom"
            placeholder="Nom de famille"
            value={formData.nom}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="prenom"
            placeholder="Prénom"
            value={formData.prenom}
            onChange={handleChange}
            required
          />

          <input
            type="date"
            name="date_naissance"
            value={formData.date_naissance}
            onChange={handleChange}
            required
            style={{ gridColumn: 'span 2' }}
          />

          <select
            name="sexe"
            value={formData.sexe}
            onChange={handleChange}
            required
            style={{ gridColumn: 'span 2' }}
          >
            <option value="">-- Choisir le sexe --</option>
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
          </select>

          <input
            type="text"
            name="telephone"
            placeholder="Téléphone"
            value={formData.telephone}
            onChange={handleChange}
            required
            style={{ gridColumn: 'span 2' }}
          />

          <input
            type="email"
            name="email"
            placeholder="Email (facultatif)"
            value={formData.email}
            onChange={handleChange}
            style={{ gridColumn: 'span 2' }}
          />

          <input
            type="text"
            name="adresse"
            placeholder="Adresse complète"
            value={formData.adresse}
            onChange={handleChange}
            required
            style={{ gridColumn: 'span 2' }}
          />

          <select
            name="groupe_sanguin"
            value={formData.groupe_sanguin}
            onChange={handleChange}
            required
            style={{ gridColumn: 'span 2' }}
          >
            <option value="">-- Groupe sanguin --</option>
            <option>A+</option>
            <option>A-</option>
            <option>B+</option>
            <option>B-</option>
            <option>AB+</option>
            <option>AB-</option>
            <option>O+</option>
            <option>O-</option>
          </select>

          <input
            type="text"
            name="allergies"
            placeholder="Allergies (séparées par des virgules)"
            value={formData.allergies}
            onChange={handleChange}
            style={{ gridColumn: 'span 2' }}
          />

          <input
            type="text"
            name="maladies"
            placeholder="Maladies chroniques"
            value={formData.maladies}
            onChange={handleChange}
            style={{ gridColumn: 'span 2' }}
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/patients')} className="btn-secondary">
            Annuler
          </button>
          <button type="submit" className="btn-primary">
            Enregistrer le patient
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddPatient;