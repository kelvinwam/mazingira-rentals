import React from 'react';

export default function ListingCard({ listing }) {
  return (
    <div className="listing-card">
      {listing.image_url ? (
        <img src={listing.image_url} alt={listing.title} className="listing-card-img" />
      ) : (
        <div className="listing-card-img-placeholder">🏠</div>
      )}
      <div className="listing-card-body">
        <h3 className="listing-card-title">{listing.title}</h3>
        <p className="listing-card-location">📍 {listing.location}</p>
        <p className="listing-card-price">KSh {Number(listing.price).toLocaleString()} / month</p>
        <div className="listing-card-meta">
          <span>🛏 {listing.bedrooms} bed{listing.bedrooms > 1 ? 's' : ''}</span>
          <span>🚿 {listing.bathrooms} bath{listing.bathrooms > 1 ? 's' : ''}</span>
        </div>
        {listing.amenities && (
          <p className="listing-card-amenities">✨ {listing.amenities}</p>
        )}
      </div>
    </div>
  );
}
