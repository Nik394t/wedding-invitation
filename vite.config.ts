import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // Относительные пути: сборка работает и в корне домена, и в подпапке (GitHub Pages).
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/test/**/*.test.ts'],
  },
})
