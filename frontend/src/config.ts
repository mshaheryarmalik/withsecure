// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://0.0.0.0:8000';
export const STREAM_ENDPOINT = `${API_BASE_URL}/assess/stream`;
export const HEALTH_ENDPOINT = `${API_BASE_URL}/health`;
export const ASSESS_ENDPOINT = `${API_BASE_URL}/assess`;

