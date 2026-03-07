import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ListingDetailPage from './pages/ListingDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandlordDashboard from './pages/LandlordDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/landlord/dashboard" element={<LandlordDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;
