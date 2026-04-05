import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API_URL =
  import.meta.env.MODE === 'production'
    ? 'https://backend-4kvw.onrender.com/api'
    : 'http://localhost:4000/api';

const DOC_KEYWORDS = {
  nda: ["signed nda", "signed_nda", "nda_signed", "signed agreement"],
  aadhaar: ["aadhaar", "adhar", "uid", "adhaar", "aadhar"],
  pan: ["pan", "pancard"],
  education: ["education", "degree", "certificate", "mark", "10th", "12th", "btech", "graduation", "diploma"],
  photo: ["photo", "passport", "selfie", "image", "pic"],
};

const DEFAULT_DOC_SCHEMA = {
  nda: { name: "Signed NDA", uploaded: false, verified: false, specialApproval: false },
  aadhaar: { name: "Aadhaar Card", uploaded: false, verified: false, specialApproval: false },
  pan: { name: "PAN Card", uploaded: false, verified: false, specialApproval: false },
  education: { name: "Education Certificate", uploaded: false, verified: false, specialApproval: false },
  photo: { name: "Passport Photo", uploaded: false, verified: false, specialApproval: false },
};

const WORKFLOW_STAGES = [
  "Initiated", 
  "Provisional Offer Sent", 
  "Details Received", 
  "Waiting for HR NDA", 
  "NDA & Docs Pending", 
  "Offer Released", 
  "Onboarded"
];

export default function CandidateDetails({ candidate, onBack }) {
  const [driveFiles, setDriveFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [selectedHours, setSelectedHours] = useState(candidate?.reminderTimes || [10, 14]);

  const [docStatus, setDocStatus] = useState(
    (candidate?.docStatus && Object.keys(candidate.docStatus).length > 0) 
      ? candidate.docStatus 
      : DEFAULT_DOC_SCHEMA
  );

  useEffect(() => {
    if (candidate?.driveFolderId) {
      fetchFiles(candidate.driveFolderId);
    }
  }, [candidate?.driveFolderId]);

  const fetchFiles = async (folderId) => {
    setLoadingFiles(true);
    try {
      const res = await axios.get(`${API_URL}/workflow/files/${folderId}`);
      setDriveFiles(res.data.files || res.data || []);
    } catch (err) {
      setDriveFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  if (!candidate) {
    return (
      <div className="card">
        <div className="detail-header">
          <button className="back-button" onClick={onBack}>← Back</button>
        </div>
        <div style={{ padding: '50px', textAlign: 'center' }}>Loading details...</div>
      </div>
    );
  }

  const formatHourFriendly = (h) => (h === 12 ? "12 PM" : h < 12 ? `${h} AM` : `${h - 12} PM`);

  const toggleHour = (hour) => {
    setSelectedHours(prev => prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour].sort((a, b) => a - b));
  };

  const handleUpdateSchedule = async () => {
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/workflow/update-reminders`, { candidateId: candidate.id, reminderTimes: selectedHours });
      alert("Reminder schedule updated.");
    } catch (err) { alert("Failed to update schedule."); } 
    finally { setActionLoading(false); }
  };

  const handleStatusOverride = async (status) => {
    if (!window.confirm(`Manually move workflow stage to: ${status}?`)) return;
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/workflow/override-status`, { candidateId: candidate.id, newStatus: status });
      alert("Status updated.");
      window.location.reload();
    } catch (err) { alert("Override failed."); } 
    finally { setActionLoading(false); }
  };

  const handleManualSync = async () => {
    setLoadingFiles(true);
    try {
      const res = await axios.post(`${API_URL}/workflow/sync-drive-state`, { candidateId: candidate.id });
      if (res.data.docStatus) setDocStatus(res.data.docStatus);
      if (res.data.files) setDriveFiles(res.data.files);
      alert("Drive scan complete!");
    } catch (err) { alert("Sync failed."); } 
    finally { setLoadingFiles(false); }
  };

  const handleToggle = async (docKey, field) => {
    const newValue = !docStatus[docKey][field];
    setDocStatus(prev => ({ ...prev, [docKey]: { ...prev[docKey], [field]: newValue } }));
    try {
      await axios.post(`${API_URL}/workflow/update-doc-status`, { candidateId: candidate.id, docKey, field, value: newValue });
    } catch (error) { console.error("Update failed", error); }
  };

  const handleReleaseOffer = async () => {
    if (!window.confirm("Release Official Offer Letter & Agreement? This emails the candidate instantly.")) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_URL}/workflow/release-offer-letter`, { candidateId: candidate.id });
      alert(res.data.message || "Offer Released!");
    } catch (err) { alert("Error releasing offer."); } 
    finally { setActionLoading(false); }
  };

  // NEW: Updated to send a specific mailType string
  const triggerMail = async (mailType, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/workflow/resend-mail`, { candidateId: candidate.id, mailType });
      alert(`Email triggered successfully!`);
    } catch (err) { alert("Error triggering mail."); } 
    finally { setActionLoading(false); }
  };

  return (
    <div className="card">
      <div className="detail-header">
        <button className="back-button" onClick={onBack}>← Back to Candidates</button>
      </div>

      <div className="candidate-details">
        <div className="header-section">
          <h2>{candidate.name}</h2>
          <span className={`status-badge status-${candidate.status?.toLowerCase().replace(/\s+/g, '-')}`}>
            {candidate.status}
          </span>
        </div>

        <div className="info-grid">
           <div><strong>Email:</strong> {candidate.email}</div>
           <div><strong>Role:</strong> {candidate.role || 'Not set'}</div>
           <div><strong>Experience:</strong> {candidate.experience || '0 Years, 0 Months'}</div>
           <div><strong>DOJ:</strong> {candidate.dateOfJoining ? new Date(candidate.dateOfJoining).toLocaleDateString('en-IN') : 'Pending'}</div>
           <div style={{ gridColumn: 'span 2' }}>
             <strong>Drive Folder:</strong> <a href={`https://drive.google.com/drive/folders/${candidate.driveFolderId}`} target="_blank" rel="noreferrer">Open in Google Drive ↗</a>
           </div>
        </div>

        {/* SECTION: MANUAL MAIL TRIGGERS */}
        <div className="manual-actions-box" style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px dashed #94a3b8', margin: '20px 0' }}>
          <h3 style={{ marginTop: 0, marginBottom: '5px', color: '#1e293b' }}>⚡ Manual Email Triggers</h3>
          <p style={{ margin: '0 0 15px', fontSize: '13px', color: '#64748b' }}>
            Click to force the system to send an email immediately, ignoring workflow rules.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            
            <button className="btn-secondary" onClick={() => triggerMail('provisional')} disabled={actionLoading}>
              📧 1. Provisional Offer (Candidate)
            </button>
            
            <button className="btn-secondary" onClick={() => triggerMail('hr_initial')} disabled={actionLoading}>
              📂 2. Request NDA Setup (HR)
            </button>
            
            <button className="btn-secondary" onClick={() => triggerMail('hr_reminder', 'Send missing NDA reminder to Jamuna?')} disabled={actionLoading}>
              ⏰ 3. Remind HR for NDA (HR)
            </button>
            
            <button className="btn-secondary" onClick={() => triggerMail('candidate_docs', 'Send missing docs reminder to Candidate?')} disabled={actionLoading}>
              📤 4. Remind for Docs (Candidate)
            </button>
            
            <button className="btn-primary" onClick={handleReleaseOffer} disabled={actionLoading} style={{ background: '#6366f1' }}>
              🚀 5. Final Documents (Candidate)
            </button>

          </div>
        </div>

        <hr/>
        
        {/* SECTION 2: WORKFLOW STAGE OVERRIDE */}
        <div className="override-section">
          <label className="section-label">Workflow Progress Override (Status only)</label>
          <div className="stage-container">
            {WORKFLOW_STAGES.map(stage => (
              <button key={stage} className={`stage-btn ${candidate.status === stage ? 'active' : ''}`} onClick={() => handleStatusOverride(stage)} disabled={actionLoading}>
                {stage}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 3: REMINDERS DASHBOARD */}
        <div className="reminder-dashboard">
          <div className="reminder-header">
            <div className="header-text">
              <h4>Automated Follow-up Schedule</h4>
              <p>System will send document reminders at these hours until all files are uploaded.</p>
            </div>
            <button className="btn-save-reminders" onClick={handleUpdateSchedule} disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Apply Schedule'}
            </button>
          </div>

          <div className="hour-selection-container">
            <div className="time-group">
              <span className="group-label">Morning</span>
              <div className="chip-grid">
                {[9, 10, 11].map(h => (
                  <button key={h} className={`hour-chip ${selectedHours.includes(h) ? 'active' : ''} ${h === 10 ? 'recommended' : ''}`} onClick={() => toggleHour(h)}>
                    {formatHourFriendly(h)}
                    {h === 10 && <span className="rec-badge">Best</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="time-group">
              <span className="group-label">Afternoon</span>
              <div className="chip-grid">
                {[12, 13, 14, 15, 16].map(h => (
                  <button key={h} className={`hour-chip ${selectedHours.includes(h) ? 'active' : ''} ${h === 14 ? 'recommended' : ''}`} onClick={() => toggleHour(h)}>
                    {formatHourFriendly(h)}
                    {h === 14 && <span className="rec-badge">Best</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="time-group">
              <span className="group-label">Evening</span>
              <div className="chip-grid">
                {[17, 18, 19, 20, 21].map(h => (
                  <button key={h} className={`hour-chip ${selectedHours.includes(h) ? 'active' : ''}`} onClick={() => toggleHour(h)}>
                    {formatHourFriendly(h)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <hr/>
        
        {/* SECTION 4: DOCUMENT DASHBOARD */}
        <div className="section-title-row">
          <h3>Verification Dashboard</h3>
          <button className="refresh-btn" onClick={handleManualSync} disabled={loadingFiles}>
            {loadingFiles ? "Scanning Drive..." : "🔄 Force Sync Drive"}
          </button>
        </div>

        <table className="doc-table">
          <thead>
            <tr>
              <th>Requirement</th>
              <th>Status</th>
              <th>Detected PDF</th>
              <th className="text-center">Verified</th>
              <th className="text-center">Exception</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(DEFAULT_DOC_SCHEMA).map((key) => {
              const doc = docStatus[key] || DEFAULT_DOC_SCHEMA[key];
              const matchingFile = driveFiles.find(file => DOC_KEYWORDS[key].some(keyword => file.name.toLowerCase().includes(keyword)));

              let statusLabel = "Missing"; let badgeClass = "tag-error";
              if (doc.verified) { statusLabel = "Verified"; badgeClass = "tag-success"; }
              else if (doc.specialApproval) { statusLabel = "Exception"; badgeClass = "tag-warning"; }
              else if (matchingFile || doc.uploaded) { statusLabel = "Uploaded"; badgeClass = "tag-info"; }

              return (
                <tr key={key}>
                  <td>{doc.name}</td>
                  <td><span className={`tag ${badgeClass}`}>{statusLabel}</span></td>
                  <td>
                    {matchingFile ? (
                      <a href={matchingFile.webViewLink} target="_blank" rel="noreferrer" className="pdf-link">
                        📄 {matchingFile.name.substring(0, 20)}...
                      </a>
                    ) : <span className="text-muted">No PDF found</span>}
                  </td>
                  <td className="text-center">
                    <input type="checkbox" checked={doc.verified || false} onChange={() => handleToggle(key, 'verified')} />
                  </td>
                  <td className="text-center">
                    <input type="checkbox" checked={doc.specialApproval || false} onChange={() => handleToggle(key, 'specialApproval')} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* SECTION 5: ACTIVITY TIMELINE */}
        <div className="activity-log">
          <h3>Activity Timeline</h3>
          <div className="log-list">
            {(candidate.log || []).slice().reverse().map((entry, index) => (
              <div key={index} className="log-item">
                <span className="log-time">{new Date(entry.timestamp).toLocaleString()}</span>
                <span className="log-event">{entry.event}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}