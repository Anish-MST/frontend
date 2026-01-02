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
    dateOfJoining: '',
    hasSpecialIncentive: false,
    specialIncentiveDetail: '',
    specialIncentiveAmount: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
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
        dateOfJoining: '',
        hasSpecialIncentive: false,
        specialIncentiveDetail: '',
        specialIncentiveAmount: ''
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
          <br />
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Email</label>
          <br />
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Role</label>
          <br />
          <input type="text" name="role" value={formData.role} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Annual CTC (Salary)</label>
          <br />
          <input type="number" name="salary" value={formData.salary} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Experience (Years)</label>
          <br />
          <input type="number" name="experience" value={formData.experience} onChange={handleChange} required min="0" />
        </div>

        <div className="form-group">
          <label>Date of Joining</label>
          <br />
          <input type="date" name="dateOfJoining" value={formData.dateOfJoining} onChange={handleChange} required />
        </div>

        {/* Special Incentive Checkbox */}
        <div className="form-group" style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
          <input 
            type="checkbox" 
            name="hasSpecialIncentive" 
            id="hasSpecialIncentive"
            checked={formData.hasSpecialIncentive} 
            onChange={handleChange} 
          />
          <label htmlFor="hasSpecialIncentive" style={{ fontWeight: "bold", cursor: "pointer", color: "#1A73E8" }}>
            Add Special Incentive?
          </label>
        </div>

        {/* Conditional Incentive Inputs */}
        {formData.hasSpecialIncentive && (
          <>
            <div className="form-group">
              <label>Incentive Amount (₹)</label>
              <br />
              <input 
                type="number" 
                name="specialIncentiveAmount" 
                value={formData.specialIncentiveAmount} 
                onChange={handleChange} 
                placeholder="e.g. 50000"
                required 
              />
            </div>
            <div className="form-group">
              <label>Incentive Type / Details</label>
              <br />
              <input 
                type="text" 
                name="specialIncentiveDetail" 
                value={formData.specialIncentiveDetail} 
                onChange={handleChange} 
                placeholder="e.g. Joining Bonus"
                required 
              />
            </div>
          </>
        )}

        <button type="submit" disabled={loading} style={{ gridColumn: "1 / -1", marginTop: "10px" }}>
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