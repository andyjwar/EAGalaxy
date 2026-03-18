import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  /** GitHub Actions sets this to /REPO_NAME/ so Pages URL matches any repo name */
  base: process.env.VITE_BASE_PATH || '/TCLOT/',
  plugins: [react()],
})
