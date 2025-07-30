import js from '@eslint/js';
import globals from 'globals';

export default [
  // Base JavaScript configuration
  js.configs.recommended,
  
  {
    files: ['**/*.js'],
    ignores: ['**/*.html', '**/node_modules/**'], // Don't lint HTML files or node_modules
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        
        // MediaPipe globals
        Pose: 'readonly',
        Camera: 'readonly',
        drawConnectors: 'readonly',
        drawLandmarks: 'readonly',
        FaceDetector: 'readonly',
        
        // Application globals
        ProPostureConfig: 'writable',
        PostureAnalyzer: 'writable',
        BasicPostureAnalyzer: 'writable',
        AdvancedPostureAnalyzer: 'writable',
        GPUPostureAnalyzer: 'writable',
        PostureAnalyzerFactory: 'writable',
        AnalysisMode: 'writable',
        CameraManager: 'writable',
        UIManager: 'writable',
        ProPostureFitnessApp: 'writable',
        
        // Build-time globals
        __APP_VERSION__: 'readonly',
        __BUILD_DATE__: 'readonly',
        __DEV__: 'readonly',
        
        // Node.js globals for conditional exports
        module: 'readonly',
        exports: 'readonly'
      }
    },
    
    rules: {
      // Error prevention
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      'no-console': ['warn', { 
        allow: ['warn', 'error', 'log', 'info'] 
      }],
      'no-debugger': 'error',
      'no-alert': 'off', // Allow confirm dialogs for user settings
      'no-var': 'error',
      'prefer-const': 'error',
      
      // Best practices
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'dot-notation': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-with': 'error',
      'radix': 'error',
      
      // Modern JavaScript
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'template-curly-spacing': 'error',
      'object-shorthand': 'error',
      
      // Async/await
      'prefer-promise-reject-errors': 'error',
      'no-async-promise-executor': 'error',
      
      // Performance
      'no-loop-func': 'error',
      'no-inner-declarations': 'error',
      
      // Code style
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { 
        avoidEscape: true,
        allowTemplateLiterals: true
      }],
      'comma-dangle': ['error', 'only-multiline'],
      
      // Security
      'no-new-wrappers': 'error',
      'no-caller': 'error'
    }
  },
  
  {
    // Test files configuration
    files: ['**/*.test.js', '**/*.spec.js', '**/test/**/*.js', '**/tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        global: 'writable',
        // Node.js globals for test setup
        process: 'readonly',
        Buffer: 'readonly'
      }
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off' // Allow test globals
    }
  },
  
  {
    // Configuration files
    files: ['*.config.js', '*.config.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        module: 'writable',
        exports: 'writable'
      }
    }
  },
  
  {
    // Ignore patterns
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.min.js',
      '*.html',
      'public/sw.js',
      'public/workbox-*.js'
    ]
  }
];