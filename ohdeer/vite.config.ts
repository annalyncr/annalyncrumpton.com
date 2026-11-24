import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite is the tool that runs the dev server and builds the site.
export default defineConfig({
  plugins: [react()],
})
