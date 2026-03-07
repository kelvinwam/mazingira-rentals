import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ListingCard from '../components/ListingCard';

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ location: '', min_price: '', max_price: '', bedrooms: '' });

  const fetchListings = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/listings', { params });
      setListings(res.data);
    } catch {
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (filters.location) params.location = filters.location;
    if (filters.min_price) params.min_price = filters.min_price;
    if (filters.max_price) params.max_price = filters.max_price;
    if (filters.bedrooms) params.bedrooms = filters.bedrooms;
    fetchListings(params);
  };

  return (
    <div className="page">
      <div className="hero">
        <h1>Find Your Perfect Home in Machakos</h1>
        <p>Browse verified rental listings — no agents, no scams.</p>

        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Location (e.g. Machakos Town)"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          />
          <input
            type="number"
            placeholder="Min price (KSh)"
            value={filters.min_price}
            onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
          />
          <input
            type="number"
            placeholder="Max price (KSh)"
            value={filters.max_price}
            onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
          />
          <input
            type="number"
            placeholder="Bedrooms"
            value={filters.bedrooms}
            min="1"
            onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      <div className="listings-section">
        <h2>Verified Listings</h2>
        {loading && <p className="loading">Loading listings…</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && listings.length === 0 && (
          <p className="empty">No verified listings found. Check back soon!</p>
        )}
        <div className="listings-grid">
          {listings.map((l) => (
            <Link to={`/listings/${l.id}`} key={l.id} className="listing-link">
              <ListingCard listing={l} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
