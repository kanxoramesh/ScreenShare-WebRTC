// packages/signaling-server/src/config.ts
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Server configuration
export const SERVER_CONFIG = {
  PORT: parseInt(process.env.SIGNALING_PORT || '4000', 10),
  HOST: process.env.SIGNALING_HOST || '0.0.0.0',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  CORS_METHODS: (process.env.CORS_METHODS || 'GET,POST').split(','),
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// WebRTC configuration (e.g., STUN/TURN servers)
export const WEBRTC_CONFIG = {
  ICE_SERVERS: process.env.ICE_SERVERS 
    ? JSON.parse(process.env.ICE_SERVERS) 
    : [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
};

// Security configuration
export const SECURITY_CONFIG = {
  MAX_CONNECTIONS: parseInt(process.env.MAX_CONNECTIONS || '100', 10),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  JWT_SECRET: process.env.JWT_SECRET || '',
  AUTH_ENABLED: process.env.AUTH_ENABLED === 'true',
};

// Logging configuration
export const LOGGING_CONFIG = {
  LEVEL: process.env.LOG_LEVEL || 'info',
  FILE_LOGGING: process.env.FILE_LOGGING === 'true',
  LOG_FILE_PATH: process.env.LOG_FILE_PATH || './logs/signaling-server.log',
};