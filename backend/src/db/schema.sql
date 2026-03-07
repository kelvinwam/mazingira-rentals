-- Mazingira Rentals Database Schema

-- Users table (tenants, landlords, admins)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL DEFAULT 'tenant' CHECK (role IN ('tenant', 'landlord', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Property listings table
CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  landlord_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  location VARCHAR(200) NOT NULL,
  bedrooms INTEGER NOT NULL DEFAULT 1,
  bathrooms INTEGER NOT NULL DEFAULT 1,
  amenities TEXT,
  image_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Verification logs table (admin actions on listings)
CREATE TABLE IF NOT EXISTS verification_logs (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('verified', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
