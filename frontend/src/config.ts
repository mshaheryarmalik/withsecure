// API Configuration
// Default to localhost for local development
// For production, set VITE_API_URL environment variable (e.g., https://api.example.com)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const STREAM_ENDPOINT = `${API_BASE_URL}/assess/stream`;
export const HEALTH_ENDPOINT = `${API_BASE_URL}/health`;
export const ASSESS_ENDPOINT = `${API_BASE_URL}/assess`;

