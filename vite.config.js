import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Pure logic runs in Node. Component tests opt in to a DOM with a
    // "@vitest-environment jsdom" comment at the top of the file.
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
    exclude: ['node_modules', 'dist', '.agents', '.claude', '.codestudio'],
    setupFiles: ['./src/test/setup.js'],
  },
})
