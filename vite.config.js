import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Finance Tracker 1.1',
        short_name: 'FinanceApp',
        description: 'Personal Finance Tracking Application',
        theme_color: '#1a1a1c',
        background_color: '#1a1a1c',
        display: 'standalone',
        icons: [
          {
            src: 'https://via.placeholder.com/192.png/1a1a1c/ffffff?text=FT',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://via.placeholder.com/512.png/1a1a1c/ffffff?text=FT',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'https://via.placeholder.com/512.png/1a1a1c/ffffff?text=FT',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
})
