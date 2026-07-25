import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || 'AIzaSyApKWxXncItYVA7Huhapf85gq64TX4PnU4')
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  }
});
