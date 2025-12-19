import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { configAPI } from './services/api';
import PatientsList from './pages/PatientsList';
import AddPatient from './pages/AddPatient';
import EditPatient from './pages/EditPatient';
import PatientDetail from './pages/PatientDetail';
import CreateOrdonnance from './pages/CreateOrdonnance';
import './App.css';

function App() {
  const [config, setConfig] = useState({
    rdv_url: '',
    doctors_url: ''
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await configAPI.getConfig();
      setConfig(response.data);
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  };

  return (
    <Router>
      <div className="app-container">
        <Sidebar config={config} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<PatientsList />} />
            <Route path="/patients" element={<PatientsList />} />
            <Route path="/patients/add" element={<AddPatient />} />
            <Route path="/patients/edit/:id" element={<EditPatient />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/patients/:id/ordonnance" element={<CreateOrdonnance />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Sidebar({ config }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <img 
          src="https://i.postimg.cc/BnDqVC0G/Gemini-Generated-Image-60401b60401b6040-removebg-preview.png" 
          className="logo-img" 
          alt="Logo"
        />
      </div>
      <nav>
        <ul>
          {config.doctors_url && (
            <li>
              <a href={config.doctors_url} className="nav-link" target="_blank" rel="noopener noreferrer">
                <i className="fas fa-user-md"></i> Doctors
              </a>
            </li>
          )}
          <li>
            <Link to="/patients" className="nav-link">
              <i className="fas fa-users"></i> Patients
            </Link>
          </li>
          {config.rdv_url && (
            <li>
              <a href={config.rdv_url} className="nav-link" target="_blank" rel="noopener noreferrer">
                <i className="fas fa-calendar-alt"></i> Rendez-vous
              </a>
            </li>
          )}
          <li>
            <Link to="/ordonnances" className="nav-link">
              <i className="fas fa-prescription-bottle-alt"></i> Ordonnances
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default App;