import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import checker from 'vite-plugin-checker'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: true,
    })
  ],
  resolve: {
      alias: [
          { find: '@api', replacement: '/src/api' },
          { find: '@components', replacement: '/src/components' },
          { find: '@state', replacement: '/src/state' },
          { find: '@utils', replacement: '/src/utils' },
          { find: '@mirage', replacement: '/src/mirage.ts' },
      ],
  },
})
