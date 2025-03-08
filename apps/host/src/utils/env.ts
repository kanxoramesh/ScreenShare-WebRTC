import { config } from 'dotenv';
import { resolve } from 'path';
import { expand } from 'dotenv-expand';

const NODE_ENV = process.env.NODE_ENV || 'development';

// Load workspace-level env variables
const workspaceEnv = config({
  path: resolve(__dirname, '../../../../.env')
});
expand(workspaceEnv);

// Load app-specific env variables (overrides workspace)
const appEnv = config({
  path: resolve(__dirname, '../../config/.env')
});
expand(appEnv);

// Load environment-specific variables (overrides workspace and app)
const envSpecific = config({
  path: resolve(__dirname, `../../config/.env.${NODE_ENV}`)
});
expand(envSpecific);

export const env = {
  NODE_ENV,
  HOST_PORT: process.env.HOST_PORT || '3000',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3001',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3001',
  API_TIMEOUT: parseInt(process.env.API_TIMEOUT || '5000', 10),
  ENABLE_METRICS: process.env.ENABLE_METRICS === 'true',
  ICE_SERVERS: JSON.parse(process.env.ICE_SERVERS || '[]'),
  SIGNALING_SERVER: process.env.SIGNALING_SERVER || 'ws://localhost:8080',
};
