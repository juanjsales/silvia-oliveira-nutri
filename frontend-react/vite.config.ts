import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
  const configuredSurface=loadEnv(mode,process.cwd(),'').VITE_APP_SURFACE;
  const surface=configuredSurface==='control-plane'||(!configuredSurface&&mode==='control-plane')?'ControlPlaneApp.tsx':'App.tsx';
  // E2E never talks to the development/production API. Browser-level mocks
  // handle expected requests and a local no-database server catches omissions.
  const apiTarget = mode === 'e2e' ? 'http://127.0.0.1:3199' : 'http://127.0.0.1:3000';

  return {
    plugins: [react()],
    resolve:{alias:{'@surface':resolve(process.cwd(),'src/app',surface)}},
    server: {
      port: 5173,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/health': { target: apiTarget },
      },
    },
  };
});
