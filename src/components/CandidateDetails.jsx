import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API_URL =
  import.meta.env.MODE === 'production'
    ? 'https://backend-4kvw.onrender.com/api'
    : 'http://localhost:4000/api';

/**
 * Updated Keywords: Includes NDA requirement
 */
const DOC_KEYWORDS = {
  nda: ["signed nda", "signed_nda", "nda_signed", "signed agreement"],
  aadhaar: ["aadhaar", "adhar", "uid", "adhaar", "aadhar"],
  pan: ["pan", "pancard"],
  education: ["education", "degree", "certificate", "mark", "10th", "12th", "btech", "graduation", "diploma"],
  photo: ["photo", "passport", "selfie", "image", "pic"],
};

/**
 * Updated Default Schema: Includes Signed NDA
 */
const DEFAULT_DOC_SCHEMA = {
  nda: { name: "Signed NDA", uploaded: false, verified: false, specialApproval: false },
  aadhaar: { name: "Aadhaar Card", uploaded: false, verified: false, specialApproval: false },
  pan: { name: "PAN Card", uploaded: false, verified: false, specialApproval: false },
  education: { name: "Education Certificate", uploaded: false, verified: false, specialApproval: false },
  photo: { name: "Passport Photo", uploaded: false, verified: false, specialApproval: false },
};

export default function CandidateDetails({ candidate, onBack }) {
  const [driveFiles, setDriveFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [docStatus, setDocStatus] = useState(
    (candidate.docStatus && Object.keys(candidate.docStatus).length > 0) 
      ? candidate.docStatus 
      : DEFAULT_DOC_SCHEMA
  );

  useEffect(() => {
    if (candidate.driveFolderId) {
      fetchFiles();
    }
  }, [candidate.driveFolderId]);

  const fetchFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await axios.get(`${API_URL}/workflow/files/${candidate.driveFolderId}`);
      const filesData = res.data.files || res.data || [];
      setDriveFiles(filesData);
    } catch (err) {
      console.error("Failed to load drive files", err);
      setDriveFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleManualSync = async () => {
    setLoadingFiles(true);
    try {
      const res = await axios.post(`${API_URL}/workflow/sync-drive-state`, {
        candidateId: candidate.id
      });
      if (res.data.docStatus) setDocStatus(res.data.docStatus);
      if (res.data.files) setDriveFiles(res.data.files);
      alert("Drive sync complete!");
    } catch (err) {
      alert("Sync failed.");
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleReleaseOffer = async () => {
    if (!window.confirm("Release Official Offer Letter to candidate?")) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_URL}/workflow/release-offer-letter`, {
        candidateId: candidate.id
      });
      alert(res.data.message || "Offer letter released!");
    } catch (err) {
      alert(err.response?.data?.error || "Error releasing offer.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggle = async (docKey, field) => {
    const newValue = !docStatus[docKey][field];
    setDocStatus(prev => ({
      ...prev,
      [docKey]: { ...prev[docKey], [field]: newValue }
    }));

    try {
      await axios.post(`${API_URL}/workflow/update-doc-status`, {
        candidateId: candidate.id,
        docKey,
        field,
        value: newValue
      });
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const triggerResend = async (mailNumber) => {
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/workflow/resend-mail`, {
        candidateId: candidate.id,
        mailNumber
      });
      alert("Reminder resent successfully!");
    } catch (err) {
      alert("Error resending mail.");
    } finally {
      setActionLoading(false);
    }
  };

  const finalizeOnboarding = async () => {
    if (!window.confirm("Finalize Onboarding?")) return;
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/workflow/finalize-onboarding`, { candidateId: candidate.id });
      alert("Success!");
      onBack(); 
    } catch (err) {
      alert("Failed.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="detail-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <div className="action-buttons">
          <button className="btn-secondary" onClick={() => triggerResend(1)} disabled={actionLoading}>
            Resend Provisional
          </button>

          {/* DYNAMIC NUDGE BUTTON */}
          {candidate.status === 'Waiting for HR NDA' ? (
             <button className="btn-warning" onClick={() => triggerResend(2)} disabled={actionLoading}>
               🔔 Nudge HR (NDA)
             </button>
          ) : (
             <button className="btn-secondary" onClick={() => triggerResend(2)} disabled={actionLoading}>
               Remind Candidate
             </button>
          )}
          
          <button className="btn-primary" onClick={handleReleaseOffer} disabled={actionLoading} style={{ background: '#6366f1' }}>
            🚀 Release Offer
          </button>

          <button className="btn-success" onClick={finalizeOnboarding} disabled={actionLoading} style={{marginLeft: '10px', background: '#10b981'}}>
            Finalize
          </button>
        </div>
      </div>

      <div className="candidate-details">
        {/* HR NDA ALERT */}
        {candidate.status === 'Waiting for HR NDA' && (
          <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#9a3412' }}>
            <strong>🕒 System Paused:</strong> Waiting for Jamuna (HR) to upload the unsigned NDA. 
            The candidate will not be notified until the NDA is detected in the folder.
          </div>
        )}

        <div className="header-section">
          <h2>{candidate.name}</h2>
          <span className={`status-badge status-${candidate.status?.toLowerCase().replace(/\s+/g, '-')}`}>
            {candidate.status}
          </span>
        </div>

        <div className="info-grid">
           <div><strong>Email:</strong> {candidate.email}</div>
           <div><strong>Role:</strong> {candidate.role || 'Not set'}</div>
           <div><strong>Folder:</strong> <a href={`https://drive.google.com/drive/folders/${candidate.driveFolderId}`} target="_blank">View on Drive</a></div>
        </div>

        <hr/>
        
        <div className="section-title-row">
          <h3>Verification Dashboard</h3>
          <button className="refresh-btn" onClick={handleManualSync} disabled={loadingFiles}>
            {loadingFiles ? "Scanning..." : "🔄 Force Sync Drive"}
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
              const matchingFile = driveFiles.find(file => 
                DOC_KEYWORDS[key].some(keyword => file.name.toLowerCase().includes(keyword))
              );

              let statusLabel = "Missing";
              let badgeClass = "tag-error";

              if (doc.verified) { statusLabel = "Verified"; badgeClass = "tag-success"; }
              else if (doc.specialApproval) { statusLabel = "Exception"; badgeClass = "tag-warning"; }
              else if (matchingFile || doc.uploaded) { statusLabel = "Uploaded"; badgeClass = "tag-info"; }

              return (
                <tr key={key} style={key === 'nda' ? {background: '#f8fafc', fontWeight: 'bold'} : {}}>
                  <td>{key === 'nda' ? '📜 ' : ''}{doc.name}</td>
                  <td><span className={`tag ${badgeClass}`}>{statusLabel}</span></td>
                  <td>
                    {matchingFile ? (
                      <a href={matchingFile.webViewLink} target="_blank" className="pdf-link">
                        📄 {matchingFile.name.substring(0, 20)}...
                      </a>
                    ) : <span className="text-muted">Not detected</span>}
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

        <div className="activity-log">
          <h3>Activity Timeline</h3>
          <div className="log-list">
            {(candidate.log || []).slice().reverse().map((entry, index) => (
              <div key={index} className="log-item">
                <span className="log-time">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span className="log-event">{entry.event}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}