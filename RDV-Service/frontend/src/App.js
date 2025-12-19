import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { configAPI } from './services/api';
import RendezVousList from './pages/RendezVousList';
import AddRendezVous from './pages/AddRendezVous';
import EditRendezVous from './pages/EditRendezVous';
import FacturesList from './pages/FacturesList';
import AddFacture from './pages/AddFacture';
import EditFacture from './pages/EditFacture';
import './App.css';

function App() {
  const [config, setConfig] = useState({
    auth_url: '',
    patients_url: '',
    doctors_url: ''
  });

  useEffect(() => {
    // Load configuration
    configAPI.getConfig()
      .then(response => setConfig(response.data))
      .catch(error => console.error('Failed to load config:', error));
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Sidebar config={config} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<RendezVousList config={config} />} />
            <Route path="/rdv" element={<RendezVousList config={config} />} />
            <Route path="/rdv/add" element={<AddRendezVous config={config} />} />
            <Route path="/rdv/edit/:id" element={<EditRendezVous config={config} />} />
            <Route path="/factures" element={<FacturesList config={config} />} />
            <Route path="/factures/add" element={<AddFacture config={config} />} />
            <Route path="/factures/edit/:id" element={<EditFacture config={config} />} />
          </Routes>
          <Footer />
        </main>
      </div>
    </Router>
  );
}

function Sidebar({ config }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <span className="logo-icon">Ⓜ️</span> MediManage
      </div>
      <nav>
        {config.auth_url && (
          <a href={config.auth_url} className="nav-link" target="_blank" rel="noopener noreferrer">
            Home
          </a>
        )}
        <Link to="/rdv" className="nav-link">Rendez-vous</Link>
        {config.patients_url && (
          <a href={config.patients_url} className="nav-link" target="_blank" rel="noopener noreferrer">
            Patients
          </a>
        )}
        {config.doctors_url && (
          <a href={config.doctors_url} className="nav-link" target="_blank" rel="noopener noreferrer">
            Doctors
          </a>
        )}
        <Link to="/factures" className="nav-link">Factures</Link>
      </nav>
    </aside>
  );
}

function Footer() {
  return (
    <footer className="footer">
      © 2023 MediManage. All rights reserved.
    </footer>
  );
}

export default App;