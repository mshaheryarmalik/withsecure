// API Configuration
// Automatically detects the backend URL based on the current hostname
// This works for both local development and VM/production deployment

function getApiBaseUrl(): string {
  // If explicitly set via environment variable, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Auto-detect based on current hostname
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;

  // If on localhost, always use localhost:8000
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
    return 'http://localhost:8000';
  }

  // For VM/production: use same hostname and protocol, but port 8000
  // This handles cases like:
  // - http://VM_IP:3000 -> http://VM_IP:8000
  // - https://example.com -> https://example.com:8000 (or use same port if behind proxy)
  
  // Always use port 8000 for backend (unless on standard HTTPS port 443)
  const backendPort = protocol === 'https:' && (port === '443' || port === '') ? '' : '8000';
  const portSuffix = backendPort ? `:${backendPort}` : '';
  
  return `${protocol}//${hostname}${portSuffix}`;
}

export const API_BASE_URL = getApiBaseUrl();
export const STREAM_ENDPOINT = `${API_BASE_URL}/assess/stream`;
export const HEALTH_ENDPOINT = `${API_BASE_URL}/health`;
export const ASSESS_ENDPOINT = `${API_BASE_URL}/assess`;

