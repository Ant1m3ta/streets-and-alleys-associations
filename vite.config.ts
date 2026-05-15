import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/streets-and-alleys-associations/' : '/',
  plugins: [react()],
  server: { port: 5174, host: true },
}));
