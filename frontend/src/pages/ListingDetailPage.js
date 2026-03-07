import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function ListingDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/listings/${id}`);
        setListing(res.data);
      } catch {
        setError('Listing not found or no longer available.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <div className="page loading">Loading…</div>;
  if (error) return <div className="page error">{error} <Link to="/">← Back</Link></div>;

  return (
    <div className="page">
      <Link to="/" className="back-link">← Back to Listings</Link>
      <div className="listing-detail">
        {listing.image_url ? (
          <img src={listing.image_url} alt={listing.title} className="listing-detail-img" />
        ) : (
          <div className="listing-detail-img-placeholder">🏠</div>
        )}
        <div className="listing-detail-body">
          <div className="verified-badge">✅ Verified by Mazingira Rentals Admin</div>
          <h1>{listing.title}</h1>
          <p className="listing-detail-location">📍 {listing.location}</p>
          <p className="listing-detail-price">KSh {Number(listing.price).toLocaleString()} / month</p>
          <div className="listing-detail-meta">
            <span>🛏 {listing.bedrooms} bedroom{listing.bedrooms > 1 ? 's' : ''}</span>
            <span>🚿 {listing.bathrooms} bathroom{listing.bathrooms > 1 ? 's' : ''}</span>
          </div>
          {listing.amenities && (
            <div className="listing-detail-amenities">
              <h3>Amenities</h3>
              <p>{listing.amenities}</p>
            </div>
          )}
          <div className="listing-detail-description">
            <h3>About this property</h3>
            <p>{listing.description}</p>
          </div>
          <div className="listing-detail-contact">
            <h3>Contact Landlord</h3>
            <p><strong>{listing.landlord_name}</strong></p>
            {listing.landlord_phone && <p>📞 {listing.landlord_phone}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
