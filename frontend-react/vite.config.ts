import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // E2E never talks to the development/production API. Browser-level mocks
  // handle expected requests and a local no-database server catches omissions.
  const apiTarget = mode === 'e2e' ? 'http://127.0.0.1:3199' : 'http://127.0.0.1:3000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/health': { target: apiTarget },
      },
    },
  };
});
