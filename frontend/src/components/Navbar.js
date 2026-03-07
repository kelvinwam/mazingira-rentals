import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🏠 Mazingira Rentals</Link>
        <span className="navbar-tagline">Machakos</span>
      </div>
      <div className="navbar-links">
        <Link to="/">Browse</Link>
        {!user && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn-primary">Register</Link>
          </>
        )}
        {user && user.role === 'landlord' && (
          <Link to="/landlord/dashboard">My Listings</Link>
        )}
        {user && user.role === 'admin' && (
          <Link to="/admin/dashboard">Admin Panel</Link>
        )}
        {user && (
          <span className="navbar-user">
            Hi, {user.name}
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </span>
        )}
      </div>
    </nav>
  );
}
