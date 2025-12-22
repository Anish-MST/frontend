import React from 'react';
import './Dashboard.css';

const statusColorMap = {
  'Initiated': 'status-initiated',
  'Documents Requested': 'status-requested',
  'Final Offer Sent': 'status-offer',
  'Offer Accepted': 'status-accepted',
  'Onboarded': 'status-onboarded'
};

export default function CandidateList({ candidates, onSelectCandidate }) {
  if (!candidates || candidates.length === 0) {
    return <p className="no-candidates">No candidates found.</p>;
  }

  return (
    <table className="candidate-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Role</th>
          <th>Status</th>
          <th>Last Updated</th>
        </tr>
      </thead>
      <tbody>
        {candidates.map((candidate) => (
          <tr key={candidate.id} onClick={() => onSelectCandidate(candidate.id)}>
            <td>{candidate.name}</td>
            <td>{candidate.role}</td>
            <td>
              <span className={`status-badge ${statusColorMap[candidate.status] || 'status-default'}`}>
                {candidate.status}
              </span>
            </td>
            <td>{candidate.updatedAt ? new Date(candidate.updatedAt._seconds * 1000).toLocaleString() : 'N/A'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
