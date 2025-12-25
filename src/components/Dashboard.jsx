import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CandidateList from './CandidateList';
import AddCandidateForm from './AddCandidateForm';
import CandidateDetails from './CandidateDetails';
import Chatbot from './Chatbot';
import './Dashboard.css';
const API_URL =
  import.meta.env.MODE === 'production'
    ? 'https://backend-4kvw.onrender.com/api'
    : 'http://localhost:4000/api';

export default function Dashboard() {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' or 'details'

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/candidates`);
      setCandidates(res.data);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleSelectCandidate = async (candidateId) => {
    try {
      const res = await axios.get(`${API_URL}/candidates/${candidateId}`);
      setSelectedCandidate(res.data);
      setView('details');
    } catch (error) {
      console.error("Failed to fetch candidate details:", error);
    }
  };

  const handleBackToList = () => {
    setSelectedCandidate(null);
    setView('list');
    fetchCandidates();
  };

  return (
    <div className="dashboard">
      <div className="main-panel">
        <h1 className="dashboard-title">Onboarding Dashboard</h1>
        {view === 'list' ? (
          <>
            <AddCandidateForm onCandidateAdded={fetchCandidates} />
            <div className="candidate-list-wrapper">
              {loading ? <p>Loading...</p> : <CandidateList candidates={candidates} onSelectCandidate={handleSelectCandidate} />}
            </div>
          </>
        ) : (
          <CandidateDetails candidate={selectedCandidate} onBack={handleBackToList} />
        )}
      </div>
      <div className="chat-panel">
        <Chatbot />
      </div>
    </div>
  );
}
