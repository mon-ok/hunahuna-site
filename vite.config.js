import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// SCSS partials in src/styles are made available to every component via
// additionalData so `@use` of variables/mixins doesn't need a relative path.
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        // Modern Sass API so loadPaths is honored (the legacy API ignores it).
        api: 'modern',
        // loadPaths lets `@use "variables"` resolve to src/styles/_variables.scss
        // from any file. additionalData injects the tokens into every
        // JS-imported stylesheet so components/pages don't repeat the imports.
        // Partials loaded via @use (e.g. _base.scss) import explicitly.
        loadPaths: ['src/styles'],
        additionalData: `@use "variables" as *;\n@use "mixins" as *;\n`,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    // Split long-lived vendor code into its own cacheable chunks so a content
    // change doesn't bust React / motion / data-layer bundles for returning
    // visitors. Page chunks are already split via React.lazy in App.jsx.
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
})
