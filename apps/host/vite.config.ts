import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Load env files from config directory
const envDir = resolve(__dirname, 'config');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir,
  server: {
    port: parseInt(process.env.HOST_PORT || '3000', 10),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
