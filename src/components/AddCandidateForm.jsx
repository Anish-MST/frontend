import React, { useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API_URL = import.meta.env.MODE === 'production' 
  ? 'https://backend-4kvw.onrender.com/api' 
  : 'http://localhost:4000/api';

export default function AddCandidateForm({ onCandidateAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    salary: '',
    expYears: '0',
    expMonths: '0',
    dateOfJoining: '',
    hasSpecialIncentive: false,
    specialIncentiveDetail: '',
    specialIncentiveAmount: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Combine years and months into a single decimal or object for the backend
    const totalExperience = `${formData.expYears} Years, ${formData.expMonths} Months`;
    
    const payload = {
      ...formData,
      experience: totalExperience // Sending a friendly string
    };

    try {
      const res = await axios.post(`${API_URL}/candidates`, payload);
      setMessage(res.data.message);
      setFormData({
        name: '', email: '', role: '', salary: '', expYears: '0', expMonths: '0',
        dateOfJoining: '', hasSpecialIncentive: false, specialIncentiveDetail: '', specialIncentiveAmount: ''
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
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Role</label>
          <input type="text" name="role" value={formData.role} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Annual CTC (Salary)</label>
          <input type="number" name="salary" value={formData.salary} onChange={handleChange} required />
        </div>

        {/* User Friendly Experience Input */}
        <div className="form-group">
          <label>Total Experience</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <input type="number" name="expYears" value={formData.expYears} onChange={handleChange} placeholder="Years" min="0" required />
              <small>Years</small>
            </div>
            <div style={{ flex: 1 }}>
              <input type="number" name="expMonths" value={formData.expMonths} onChange={handleChange} placeholder="Months" min="0" max="11" required />
              <small>Months</small>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Date of Joining</label>
          <input type="date" name="dateOfJoining" value={formData.dateOfJoining} onChange={handleChange} required />
        </div>

        <div className="form-group-checkbox">
          <input type="checkbox" name="hasSpecialIncentive" id="hasSpecialIncentive" checked={formData.hasSpecialIncentive} onChange={handleChange} />
          <label htmlFor="hasSpecialIncentive">Add special incentive</label>
        </div>

        {formData.hasSpecialIncentive && (
          <>
            <div className="form-group">
              <label>Incentive Amount (₹)</label>
              <input type="number" name="specialIncentiveAmount" value={formData.specialIncentiveAmount} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Incentive Type / Details</label>
              <input type="text" name="specialIncentiveDetail" value={formData.specialIncentiveDetail} onChange={handleChange} required />
            </div>
          </>
        )}

        <button type="submit" disabled={loading} style={{ gridColumn: "1 / -1", marginTop: "10px" }}>
          {loading ? 'Starting...' : 'Start Workflow'}
        </button>
      </form>
    </div>
  );
}