import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Base configuration
  base: './',
  publicDir: 'public',
  
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    host: true, // Allow external connections
    https: false, // Set to true for HTTPS in development
    cors: true,
    hmr: {
      overlay: true
    }
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',
    
    // Optimize chunks with ultra-intelligent splitting
    rollupOptions: {
      input: {
        main: './index.html',
        test: './test.html'
      },
      output: {
        // Dynamic chunk splitting strategy
        manualChunks(id) {
          // MediaPipe is now dynamically loaded - exclude from initial bundles
          if (id.includes('@mediapipe/')) {
            return null; // Let them be loaded dynamically
          }
          
          // Core application - critical path
          if (id.includes('config.js') || id.includes('main.js')) {
            return 'core';
          }
          
          // Analysis engine with dynamic loader
          if (id.includes('postureAnalyzer.js') || 
              id.includes('mediapipeLoader.js') || 
              id.includes('cameraManager.js')) {
            return 'analysis-engine';
          }
          
          // UI components - lazy loaded
          if (id.includes('uiManager.js')) {
            return 'ui-components';
          }
          
          // Test utilities
          if (id.includes('test') || id.includes('spec')) {
            return 'test-utils';
          }
          
          // Third-party vendor code
          if (id.includes('node_modules')) {
            // Large libraries get their own chunks
            if (id.includes('vitest') || id.includes('testing')) {
              return 'test-vendor';
            }
            if (id.includes('workbox')) {
              return 'pwa-vendor';
            }
            return 'vendor';
          }
        },
        
        // Optimized asset naming with cache-busting
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          
          // Core chunks - highest priority
          if (name === 'core') {
            return 'assets/core/[name]-[hash].js';
          }
          
          // Analysis engine - medium priority
          if (name === 'analysis-engine') {
            return 'assets/analysis/[name]-[hash].js';
          }
          
          // UI components - lazy loaded
          if (name === 'ui-components') {
            return 'assets/ui/[name]-[hash].js';
          }
          
          // Vendor chunks
          if (name.includes('vendor')) {
            return 'assets/vendor/[name]-[hash].js';
          }
          
          // Default pattern
          return 'assets/js/[name]-[hash].js';
        },
        
        entryFileNames: 'assets/entry/[name]-[hash].js',
        
        // Enhanced asset naming
        assetFileNames: (assetInfo) => {
          const extType = (assetInfo.name?.split('.').pop() || '').toLowerCase();
          
          // Images
          if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp', 'ico'].includes(extType)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          
          // CSS files
          if (extType === 'css') {
            return 'assets/css/[name]-[hash][extname]';
          }
          
          // Fonts
          if (['woff', 'woff2', 'ttf', 'eot'].includes(extType)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          
          // Default
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    
    // Terser options for minification
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    
    // Build optimizations
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000
  },
  
  // Plugin configuration
  plugins: [
    // Progressive Web App
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        
        // Enhanced caching for dynamic MediaPipe loading
        runtimeCaching: [
          {
            // MediaPipe model files - cache first with long expiration
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/@mediapipe.*\.(wasm|data|js)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mediapipe-models-v1',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 90 // 90 days - models rarely change
              },
              cacheKeyWillBeUsed: async ({ request }) => {
                // Create stable cache keys for MediaPipe files
                return `${request.url}-mediapipe-cache`;
              }
            }
          },
          {
            // MediaPipe JavaScript libraries - cache with fallback
            urlPattern: /^https:\/\/(cdn\.jsdelivr\.net|unpkg\.com)\/npm\/@mediapipe.*\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'mediapipe-scripts-v1',
              expiration: {
                maxEntries: 15,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          },
          {
            // Application static resources
            urlPattern: /\.(js|css|html)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'app-static-v1',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          },
          {
            // Images and media files
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-images-v1',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      
      // Manifest configuration
      manifest: {
        name: 'ProPostureFitness',
        short_name: 'PostureFit',
        description: 'Professional Posture Analysis System',
        theme_color: '#2563eb',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png', 
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        categories: ['health', 'fitness', 'utilities'],
        shortcuts: [
          {
            name: 'Start Analysis',
            short_name: 'Analyze',
            description: 'Start posture analysis',
            url: '/?action=start',
            icons: [{ src: 'icons/start-96.png', sizes: '96x96' }]
          }
        ]
      }
    })
  ],
  
  // Optimization configuration for dynamic loading
  optimizeDeps: {
    // Exclude MediaPipe from pre-bundling (loaded dynamically)
    exclude: [
      '@mediapipe/pose',
      '@mediapipe/camera_utils',
      '@mediapipe/drawing_utils'
    ],
    
    // Pre-bundle core dependencies
    include: [
      // Core utilities that are always needed
    ],
    
    // Force optimization when needed
    force: false,
    
    // ESBuild options for optimization
    esbuildOptions: {
      target: 'es2020',
      supported: {
        'dynamic-import': true
      }
    }
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      // Add global CSS variables if needed
    }
  },
  
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  },
  
  // ESbuild configuration
  esbuild: {
    // Remove debugger statements in production
    drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
    
    // Target modern browsers
    target: 'es2020',
    
    // Keep class names for debugging
    keepNames: true
  },
  
  // Preview server configuration (for production preview)
  preview: {
    port: 3000,
    host: true,
    strictPort: true,
    https: false
  },
  
  // Environment variables
  envPrefix: 'PROPOSTURE_',
  
  // JSON handling
  json: {
    stringify: true
  }
});