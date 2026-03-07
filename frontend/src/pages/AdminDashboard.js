import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedListing, setSelectedListing] = useState(null);
  const [logs, setLogs] = useState([]);
  const [notes, setNotes] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/login');
    else fetchListings(statusFilter);
  }, [user, navigate]);

  const fetchListings = async (status) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.get('/listings/admin/all', { params: status !== 'all' ? { status } : {} });
      setListings(res.data);
    } catch {
      setError('Failed to load listings.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (s) => {
    setStatusFilter(s);
    setSelectedListing(null);
    setLogs([]);
    fetchListings(s);
  };

  const handleSelectListing = async (listing) => {
    setSelectedListing(listing);
    setNotes('');
    setActionMsg('');
    try {
      const res = await api.get(`/listings/admin/${listing.id}/logs`);
      setLogs(res.data);
    } catch {
      setLogs([]);
    }
  };

  const handleVerify = async () => {
    setActionMsg('');
    try {
      const res = await api.patch(`/listings/admin/${selectedListing.id}/verify`, { notes });
      setActionMsg('✅ ' + res.data.message);
      fetchListings(statusFilter);
      setSelectedListing({ ...selectedListing, status: 'verified' });
    } catch (err) {
      setActionMsg('Error: ' + (err.response?.data?.message || 'Failed to verify'));
    }
  };

  const handleReject = async () => {
    setActionMsg('');
    try {
      const res = await api.patch(`/listings/admin/${selectedListing.id}/reject`, { notes });
      setActionMsg('❌ ' + res.data.message);
      fetchListings(statusFilter);
      setSelectedListing({ ...selectedListing, status: 'rejected' });
    } catch (err) {
      setActionMsg('Error: ' + (err.response?.data?.message || 'Failed to reject'));
    }
  };

  const statusBadge = (status) => {
    const map = { pending: '🟡 Pending', verified: '✅ Verified', rejected: '❌ Rejected' };
    return <span className={`status-badge status-${status}`}>{map[status] || status}</span>;
  };

  return (
    <div className="page admin-page">
      <h1>Admin Dashboard — Listing Verification</h1>
      <p className="admin-subtitle">
        Review landlord submissions and verify them via phone call or physical visit before they go live.
      </p>

      <div className="admin-layout">
        {/* Left panel: listing list */}
        <div className="admin-left">
          <div className="filter-tabs">
            {['pending', 'verified', 'rejected', 'all'].map((s) => (
              <button
                key={s}
                className={`filter-tab ${statusFilter === s ? 'active' : ''}`}
                onClick={() => handleFilterChange(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {error && <p className="error">{error}</p>}
          {loading && <p className="loading">Loading…</p>}

          <div className="admin-listing-list">
            {!loading && listings.length === 0 && (
              <p className="empty">No {statusFilter !== 'all' ? statusFilter : ''} listings found.</p>
            )}
            {listings.map((l) => (
              <div
                key={l.id}
                className={`admin-listing-item ${selectedListing?.id === l.id ? 'selected' : ''}`}
                onClick={() => handleSelectListing(l)}
              >
                <div className="admin-listing-item-title">{l.title}</div>
                <div className="admin-listing-item-meta">
                  📍 {l.location} · KSh {Number(l.price).toLocaleString()}
                </div>
                <div>{statusBadge(l.status)}</div>
                <div className="admin-listing-item-landlord">
                  Landlord: {l.landlord_name} · {l.landlord_email}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel: detail & actions */}
        <div className="admin-right">
          {!selectedListing ? (
            <div className="admin-placeholder">
              <p>Select a listing to review and take action.</p>
            </div>
          ) : (
            <div className="admin-detail">
              <h2>{selectedListing.title}</h2>
              <div className="admin-detail-status">{statusBadge(selectedListing.status)}</div>

              <div className="admin-detail-info">
                <div><strong>Location:</strong> {selectedListing.location}</div>
                <div><strong>Price:</strong> KSh {Number(selectedListing.price).toLocaleString()} / month</div>
                <div><strong>Beds / Baths:</strong> {selectedListing.bedrooms} / {selectedListing.bathrooms}</div>
                {selectedListing.amenities && <div><strong>Amenities:</strong> {selectedListing.amenities}</div>}
                <div><strong>Description:</strong> {selectedListing.description}</div>
              </div>

              <div className="admin-detail-landlord">
                <h3>Landlord Details</h3>
                <div><strong>Name:</strong> {selectedListing.landlord_name}</div>
                <div><strong>Email:</strong> {selectedListing.landlord_email}</div>
                {selectedListing.landlord_phone && <div><strong>Phone:</strong> 📞 {selectedListing.landlord_phone}</div>}
              </div>

              <div className="admin-verify-section">
                <h3>Verification Action</h3>
                <p className="verify-hint">
                  Contact the landlord via phone or schedule a physical visit to confirm the property exists and matches the description.
                </p>
                <textarea
                  placeholder="Notes (e.g. Verified via phone call on 7 March)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
                <div className="verify-actions">
                  <button className="btn-verify" onClick={handleVerify}>✅ Verify Listing</button>
                  <button className="btn-reject" onClick={handleReject}>❌ Reject Listing</button>
                </div>
                {actionMsg && <p className="action-msg">{actionMsg}</p>}
              </div>

              {logs.length > 0 && (
                <div className="admin-logs">
                  <h3>Verification History</h3>
                  {logs.map((log) => (
                    <div key={log.id} className={`log-entry log-${log.action}`}>
                      <span className="log-action">{log.action === 'verified' ? '✅' : '❌'} {log.action}</span>
                      <span className="log-admin">by {log.admin_name}</span>
                      <span className="log-date">{new Date(log.created_at).toLocaleString()}</span>
                      {log.notes && <p className="log-notes">{log.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
