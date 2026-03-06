import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// If deploying to GitHub Pages project site, set base to the repo name
// Using dynamic env to avoid breaking non-GitHub hosting
const repoBase = process.env.GHPAGES_BASE || '';
const isElectron = process.env.ELECTRON === '1';

export default defineConfig({
  // For Electron we must use relative base ('./') so assets resolve under file:// protocol
  base: isElectron ? './' : (repoBase || '/'),
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 8080,
    host: true
  }
})