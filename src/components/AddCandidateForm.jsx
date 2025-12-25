import React, { useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API_URL =
  import.meta.env.MODE === 'production'
    ? 'https://backend-4kvw.onrender.com/api'
    : 'http://localhost:4000/api';

export default function AddCandidateForm({ onCandidateAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    salary: '',
    experience: '',
    dateOfJoining: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post(`${API_URL}/candidates`, formData);
      setMessage(res.data.message);
      setFormData({
        name: '',
        email: '',
        role: '',
        salary: '',
        experience: '',
        dateOfJoining: ''
      });
      onCandidateAdded();
    } catch (error) {
      setMessage(error.response?.data?.error || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Add New Candidate</h2>
      <form onSubmit={handleSubmit} className="form-grid">

        <div className="form-group">
          <label>Name</label>
          <br></br>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Email</label>
          <br></br>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Role</label>
          <br></br>
          <input type="text" name="role" value={formData.role} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Salary</label>
          <br></br>
          <input type="number" name="salary" value={formData.salary} onChange={handleChange} required />
        </div>

        {/* NEW: Experience */}
        <div className="form-group">
          <label>Experience (Years)</label>
          <br></br>
          <input
            type="number"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            required
            min="0"
          />
        </div>

        {/* NEW: Date of Joining */}
        <div className="form-group">
          <label>Date of Joining</label>
          <br></br>
          
          <input
            type="date"
            name="dateOfJoining"
            value={formData.dateOfJoining}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Starting...' : 'Start Workflow'}
        </button>
      </form>

      {message && (
        <p className={`message ${message.includes('error') ? 'error' : 'success'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
