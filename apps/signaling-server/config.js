"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOGGING_CONFIG = exports.SECURITY_CONFIG = exports.WEBRTC_CONFIG = exports.SERVER_CONFIG = void 0;
// packages/signaling-server/src/config.ts
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env file from the project root
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
// Server configuration
exports.SERVER_CONFIG = {
    PORT: parseInt(process.env.SIGNALING_PORT || '4000', 10),
    HOST: process.env.SIGNALING_HOST || '0.0.0.0',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    CORS_METHODS: (process.env.CORS_METHODS || 'GET,POST').split(','),
    NODE_ENV: process.env.NODE_ENV || 'development',
};
// WebRTC configuration (e.g., STUN/TURN servers)
exports.WEBRTC_CONFIG = {
    ICE_SERVERS: process.env.ICE_SERVERS
        ? JSON.parse(process.env.ICE_SERVERS)
        : [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
};
// Security configuration
exports.SECURITY_CONFIG = {
    MAX_CONNECTIONS: parseInt(process.env.MAX_CONNECTIONS || '100', 10),
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    JWT_SECRET: process.env.JWT_SECRET || '',
    AUTH_ENABLED: process.env.AUTH_ENABLED === 'true',
};
// Logging configuration
exports.LOGGING_CONFIG = {
    LEVEL: process.env.LOG_LEVEL || 'info',
    FILE_LOGGING: process.env.FILE_LOGGING === 'true',
    LOG_FILE_PATH: process.env.LOG_FILE_PATH || './logs/signaling-server.log',
};
