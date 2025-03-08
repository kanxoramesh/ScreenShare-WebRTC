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
  CLIENT_PORT: process.env.CLIENT_PORT || '3001',
  HOST_ORIGIN: process.env.HOST_ORIGIN || 'http://localhost:3000',
  DEBUG_MODE: process.env.DEBUG_MODE === 'true',
  ICE_SERVERS: JSON.parse(process.env.ICE_SERVERS || '[]'),
  SIGNALING_SERVER: process.env.SIGNALING_SERVER || 'ws://localhost:8080',
};
