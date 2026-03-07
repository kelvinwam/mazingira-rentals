import { render, screen } from '@testing-library/react';
import App from './App';

// Mock axios to prevent actual API calls
jest.mock('./services/api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(),
  interceptors: { request: { use: jest.fn() } },
}));

test('renders Mazingira Rentals navbar brand', () => {
  render(<App />);
  // The navbar brand link text
  expect(screen.getByText(/Mazingira Rentals/i)).toBeInTheDocument();
});

test('renders login link in navbar when not authenticated', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
});

test('renders register link in navbar when not authenticated', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
});
