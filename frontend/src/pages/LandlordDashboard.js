import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { title: '', description: '', price: '', location: '', bedrooms: 1, bathrooms: 1, amenities: '', image_url: '' };

export default function LandlordDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'landlord') navigate('/login');
    else fetchMyListings();
  }, [user, navigate]);

  const fetchMyListings = async () => {
    try {
      const res = await api.get('/listings/landlord/my-listings');
      setListings(res.data);
    } catch {
      setError('Failed to load your listings.');
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/listings/${editId}`, form);
        setSuccess('Listing updated! It is now pending re-verification by the admin.');
      } else {
        await api.post('/listings', form);
        setSuccess('Listing submitted! An admin will review and verify it shortly.');
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      fetchMyListings();
    } catch (err) {
      const msgs = err.response?.data?.errors;
      setError(msgs ? msgs.map((e) => e.msg).join(', ') : err.response?.data?.message || 'Failed to save listing.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (listing) => {
    setEditId(listing.id);
    setForm({
      title: listing.title,
      description: listing.description,
      price: listing.price,
      location: listing.location,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      amenities: listing.amenities || '',
      image_url: listing.image_url || '',
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      setSuccess('Listing deleted.');
      fetchMyListings();
    } catch {
      setError('Failed to delete listing.');
    }
  };

  const statusBadge = (status) => {
    const map = { pending: '🟡 Pending', verified: '✅ Verified', rejected: '❌ Rejected' };
    return <span className={`status-badge status-${status}`}>{map[status] || status}</span>;
  };

  return (
    <div className="page">
      <div className="dashboard-header">
        <h1>My Listings</h1>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); setError(''); setSuccess(''); }}>
          {showForm ? 'Cancel' : '+ Add New Listing'}
        </button>
      </div>

      {success && <p className="success">{success}</p>}
      {error && <p className="error">{error}</p>}

      {showForm && (
        <div className="listing-form-card">
          <h2>{editId ? 'Edit Listing' : 'New Listing'}</h2>
          <p className="form-hint">
            After submission, an admin will review your property — either via phone call or a physical visit — before it appears publicly.
          </p>
          <form onSubmit={handleSubmit} className="listing-form">
            <div className="form-row">
              <div className="form-group">
                <label>Title *</label>
                <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Spacious 2-bedroom in Machakos Town" />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input name="location" value={form.location} onChange={handleChange} required placeholder="e.g. Machakos Town, Kenyatta Rd" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Monthly Rent (KSh) *</label>
                <input type="number" name="price" value={form.price} onChange={handleChange} required min="0" placeholder="e.g. 8000" />
              </div>
              <div className="form-group">
                <label>Bedrooms *</label>
                <input type="number" name="bedrooms" value={form.bedrooms} onChange={handleChange} required min="1" />
              </div>
              <div className="form-group">
                <label>Bathrooms *</label>
                <input type="number" name="bathrooms" value={form.bathrooms} onChange={handleChange} required min="1" />
              </div>
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} required rows={4} placeholder="Describe your property…" />
            </div>
            <div className="form-group">
              <label>Amenities (optional)</label>
              <input name="amenities" value={form.amenities} onChange={handleChange} placeholder="e.g. WiFi, Parking, Water 24hrs" />
            </div>
            <div className="form-group">
              <label>Image URL (optional)</label>
              <input name="image_url" value={form.image_url} onChange={handleChange} placeholder="https://example.com/image.jpg" />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving…' : editId ? 'Save Changes' : 'Submit for Verification'}
            </button>
          </form>
        </div>
      )}

      <div className="listings-table-wrap">
        {listings.length === 0 ? (
          <p className="empty">You have no listings yet. Click "Add New Listing" to post your property.</p>
        ) : (
          <table className="listings-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Location</th>
                <th>Price</th>
                <th>Beds</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id}>
                  <td>{l.title}</td>
                  <td>{l.location}</td>
                  <td>KSh {Number(l.price).toLocaleString()}</td>
                  <td>{l.bedrooms}</td>
                  <td>{statusBadge(l.status)}</td>
                  <td className="table-actions">
                    {l.status !== 'verified' && (
                      <button className="btn-sm btn-edit" onClick={() => handleEdit(l)}>Edit</button>
                    )}
                    <button className="btn-sm btn-danger" onClick={() => handleDelete(l.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
