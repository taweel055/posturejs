import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'happy-dom', // Faster than jsdom, good for most use cases
    
    // Alternative environments for different test types
    environmentOptions: {
      'happy-dom': {
        width: 1280,
        height: 720,
        url: 'http://localhost:3000'
      }
    },
    
    // Global test setup
    globals: true,
    setupFiles: ['./tests/setup.js'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '*.config.js',
        '*.config.mjs',
        'coverage/',
        '**/*.test.js',
        '**/*.spec.js'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      all: true,
      include: ['js/**/*.js'],
      skipFull: true
    },
    
    // Test patterns
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules/',
      'dist/',
      '.idea/',
      '.git/',
      '.cache/',
      'coverage/'
    ],
    
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Browser simulation
    browser: {
      enabled: false, // Enable for browser-specific tests
      name: 'chrome',
      headless: true
    },
    
    // Reporter configuration
    reporter: ['verbose', 'html', 'json'],
    outputFile: {
      html: './coverage/test-results.html',
      json: './coverage/test-results.json'
    },
    
    // Watch mode
    watch: true,
    watchExclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**'
    ],
    
    // Mocking
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    
    // Performance
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true,
        minThreads: 1,
        maxThreads: 4
      }
    },
    
    // TypeScript support (if added later)
    typecheck: {
      checker: 'tsc',
      include: ['**/*.{test,spec}-d.ts']
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': new URL('./js', import.meta.url).pathname,
      '@tests': new URL('./tests', import.meta.url).pathname
    }
  },
  
  // Define global constants for tests
  define: {
    __TEST__: true,
    __DEV__: true,
    __APP_VERSION__: '"1.0.0-test"',
    __BUILD_DATE__: '"test-build"'
  }
});