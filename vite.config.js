import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Use /cutup-magnet-poetry/ for GitHub Pages, / for Vercel
const base = process.env.GITHUB_ACTIONS ? '/cutup-magnet-poetry/' : '/'

export default defineConfig({
  base,
  plugins: [react()],
})
