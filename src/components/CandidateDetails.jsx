import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API_URL = 'https://backend-4kvw.onrender.com/api';

// Keyword map matching the Cron/Drive service logic
// CandidateDetails.jsx - Update the DOC_KEYWORDS object
const DOC_KEYWORDS = {
  aadhaar: ["aadhaar", "adhar", "uid", "adhaar", "aadhar"],
  pan: ["pan", "pancard"],
  education: ["education", "degree", "certificate", "mark", "10th", "12th", "btech", "graduation", "diploma"],
  photo: ["photo", "passport", "selfie", "image", "pic"],
  passbook: ["passbook", "bank", "cheque", "statement", "pass_book", "bank_statement"]
};

const DEFAULT_DOC_SCHEMA = {
  aadhaar: { name: "Aadhaar Card", uploaded: false, verified: false, specialApproval: false },
  pan: { name: "PAN Card", uploaded: false, verified: false, specialApproval: false },
  education: { name: "Education Certificate", uploaded: false, verified: false, specialApproval: false },
  photo: { name: "Passport Photo", uploaded: false, verified: false, specialApproval: false },
  passbook: { name: "Bank Passbook", uploaded: false, verified: false, specialApproval: false }
};

export default function CandidateDetails({ candidate, onBack }) {
  const [driveFiles, setDriveFiles] = useState([]); // Always initialize as array
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
// CandidateDetails.jsx

const fetchFiles = async () => {
  setLoadingFiles(true);
  try {
    const res = await axios.get(`${API_URL}/workflow/files/${candidate.driveFolderId}`);
    
    console.log("📂 Raw Data:", res.data);

    // FIX: Look for res.data.files since the backend returns an object
    let filesData = [];
    
    if (res.data && Array.isArray(res.data.files)) {
      filesData = res.data.files;
    } else if (Array.isArray(res.data)) {
      filesData = res.data;
    }

    setDriveFiles(filesData);
  } catch (err) {
    console.error("Failed to load drive files", err);
    setDriveFiles([]);
  } finally {
    setLoadingFiles(false);
  }
};

  const handleToggle = async (docKey, field) => {
    const currentDoc = docStatus[docKey] || DEFAULT_DOC_SCHEMA[docKey];
    const newValue = !currentDoc[field];
    
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
      console.error("Backend sync failed", error);
    }
  };

  const triggerResend = async (mailNumber) => {
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/workflow/resend-mail`, {
        candidateName: candidate.name,
        mailNumber
      });
      alert(`Mail ${mailNumber} resent successfully!`);
    } catch (err) {
      alert("Error resending mail");
    } finally {
      setActionLoading(false);
    }
  };

  if (!candidate) return null;

  return (
    <div className="card">
      <div className="detail-header">
        <button className="back-button" onClick={onBack}>← Back to List</button>
        <div className="action-buttons">
          <button className="btn-secondary" onClick={() => triggerResend(1)} disabled={actionLoading}>Resend Prov. Offer</button>
          <button className="btn-primary" onClick={() => triggerResend(2)} disabled={actionLoading}>Resend Formal & Drive Access</button>
        </div>
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
           <div><strong>Folder ID:</strong> <code style={{fontSize: '11px'}}>{candidate.driveFolderId}</code></div>
        </div>

        <hr/>
        
        <div className="section-title-row">
          <h3>Document Checklist (PDF Only)</h3>
          <button className="refresh-btn" onClick={fetchFiles} disabled={loadingFiles}>
            {loadingFiles ? "Syncing..." : "🔄 Refresh Drive State"}
          </button>
        </div>
        
        {candidate.driveFolderId && (
          <div className="drive-link-box">
            <a 
              href={`https://drive.google.com/drive/folders/${candidate.driveFolderId}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              📂 Open Candidate Folder in Google Drive
            </a>
            <p className="text-muted" style={{fontSize: '11px', marginTop: '5px'}}>
              Note: Access is shared with <strong>{candidate.email}</strong>
            </p>
          </div>
        )}

        <table className="doc-table">
          <thead>
            <tr>
              <th>Requirement</th>
              <th>Status</th>
              <th>Detected PDF File</th>
              <th className="text-center">Verified</th>
              <th className="text-center">Exception</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(DEFAULT_DOC_SCHEMA).map((key) => {
              const doc = docStatus[key] || DEFAULT_DOC_SCHEMA[key];
              
              // Logic: Match Drive files based on keywords
              const matchingFile = driveFiles.find(file => 
                DOC_KEYWORDS[key].some(keyword => file.name.toLowerCase().includes(keyword))
              );

              // Status Priority: Verified > Approval > Uploaded > Missing
              let statusLabel = "Missing";
              let badgeClass = "tag-error";

              if (doc.verified) {
                statusLabel = "Verified";
                badgeClass = "tag-success";
              } else if (doc.specialApproval) {
                statusLabel = "Approval (Exc)";
                badgeClass = "tag-warning";
              } else if (matchingFile) {
                statusLabel = "Uploaded";
                badgeClass = "tag-info";
              }

              return (
                <tr key={key}>
                  <td><strong>{doc.name}</strong></td>
                  <td>
                    <span className={`tag ${badgeClass}`}>{statusLabel}</span>
                  </td>
                  <td>
                    {matchingFile ? (
                      <a href={matchingFile.webViewLink} target="_blank" rel="noreferrer" className="pdf-link">
                        📄 {matchingFile.name.length > 20 ? matchingFile.name.substring(0,20) + '...' : matchingFile.name}
                      </a>
                    ) : (
                      <span className="text-muted">Not detected</span>
                    )}
                  </td>
                  <td className="text-center">
                    <input 
                      type="checkbox" 
                      checked={doc.verified || false} 
                      onChange={() => handleToggle(key, 'verified')}
                    />
                  </td>
                  <td className="text-center">
                    <input 
                      type="checkbox" 
                      checked={doc.specialApproval || false} 
                      onChange={() => handleToggle(key, 'specialApproval')}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="activity-log">
          <h3>Activity Timeline</h3>
          <div className="log-list">
            {candidate.log?.slice().reverse().map((entry, index) => (
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