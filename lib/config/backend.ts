/**
 * Backend API Configuration
 * 
 * This file contains configuration for connecting to the Fastify backend.
 * Update the BACKEND_URL to point to your Fastify server.
 */

export const BACKEND_CONFIG = {
  // Backend API base URL
  // Change this to your Fastify server URL
  BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
  
  // API endpoints
  ENDPOINTS: {
    PROJECTS: '/projects',
    AUTH: '/auth',
    HEALTH: '/health',
  },
  
  // Request timeout (in milliseconds)
  TIMEOUT: 30000,
  
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // 1 second
  }
} as const;

/**
 * Get the full URL for an API endpoint
 */
export function getApiUrl(endpoint: string): string {
  return `${BACKEND_CONFIG.BASE_URL}${endpoint}`;
}

/**
 * Check if the backend URL is configured
 */
export function isBackendConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_BACKEND_URL || BACKEND_CONFIG.BASE_URL !== 'http://localhost:3001/api';
}
