/**
 * MediaPipe Dynamic Loader with Ultra-Optimization
 * Progressive enhancement with intelligent caching and fallback strategies
 */

class MediaPipeLoader {
    constructor() {
        this.loadingPromises = new Map();
        this.loadedModules = new Map();
        this.loadingStates = new Map();
        this.fallbackStrategies = new Map();
        this.performanceMetrics = {
            loadTimes: {},
            cacheHits: 0,
            fallbackUsage: 0,
            networkRequests: 0
        };
        
        this.initializeCaching();
        this.setupFallbackStrategies();
    }
    
    /**
     * Initialize service worker caching for MediaPipe files
     */
    async initializeCaching() {
        if ('serviceWorker' in navigator && 'caches' in window) {
            try {
                this.cache = await caches.open('mediapipe-cache-v1');
            } catch (error) {
                console.warn('⚠️ Cache initialization failed:', error);
            }
        }
    }
    
    /**
     * Setup fallback strategies for different scenarios
     */
    setupFallbackStrategies() {
        this.fallbackStrategies.set('pose', [
            // Strategy 1: CDN with version fallback
            { type: 'cdn', url: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404', timeout: 15000 },
            // Strategy 2: Alternative CDN
            { type: 'cdn', url: 'https://unpkg.com/@mediapipe/pose@0.5.1675469404', timeout: 20000 }
        ]);
        
        this.fallbackStrategies.set('camera_utils', [
            { type: 'cdn', url: 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1640029074', timeout: 10000 },
            { type: 'cdn', url: 'https://unpkg.com/@mediapipe/camera_utils@0.3.1640029074', timeout: 12000 }
        ]);
        
        this.fallbackStrategies.set('drawing_utils', [
            { type: 'cdn', url: 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1620248257', timeout: 10000 },
            { type: 'cdn', url: 'https://unpkg.com/@mediapipe/drawing_utils@0.3.1620248257', timeout: 12000 }
        ]);
    }
    
    /**
     * Load MediaPipe module with intelligent optimization
     */
    async loadModule(moduleName, options = {}) {
        const startTime = performance.now();
        
        // Return cached promise if already loading
        if (this.loadingPromises.has(moduleName)) {
            return this.loadingPromises.get(moduleName);
        }
        
        // Return cached module if already loaded
        if (this.loadedModules.has(moduleName)) {
            this.performanceMetrics.cacheHits++;
            return this.loadedModules.get(moduleName);
        }
        
        // Create loading promise
        const loadingPromise = this.loadModuleWithFallback(moduleName, options);
        this.loadingPromises.set(moduleName, loadingPromise);
        
        try {
            const module = await loadingPromise;
            this.loadedModules.set(moduleName, module);
            this.performanceMetrics.loadTimes[moduleName] = performance.now() - startTime;
            
            return module;
            
        } catch (error) {
            console.error(`❌ Failed to load MediaPipe ${moduleName}:`, error);
            this.loadingPromises.delete(moduleName);
            throw error;
        } finally {
            this.loadingPromises.delete(moduleName);
        }
    }
    
    /**
     * Load module with fallback strategies
     */
    async loadModuleWithFallback(moduleName, options) {
        const strategies = this.fallbackStrategies.get(moduleName) || [];
        let lastError = null;
        
        for (const strategy of strategies) {
            try {
                this.setLoadingState(moduleName, `Loading from ${strategy.type}...`);
                const module = await this.loadFromStrategy(moduleName, strategy, options);
                this.setLoadingState(moduleName, 'Loaded');
                return module;
                
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Strategy ${strategy.type} failed for ${moduleName} (${strategy.url || strategy.path}):`, error.message);
                this.performanceMetrics.fallbackUsage++;
                continue;
            }
        }
        
        this.setLoadingState(moduleName, 'Failed');
        throw new Error(`All fallback strategies failed for ${moduleName}: ${lastError?.message}`);
    }
    
    /**
     * Load from specific strategy
     */
    async loadFromStrategy(moduleName, strategy, options) {
        this.performanceMetrics.networkRequests++;
        
        switch (strategy.type) {
            case 'cdn':
                return this.loadFromCDN(moduleName, strategy, options);
            case 'local':
                return this.loadFromLocal(moduleName, strategy, options);
            default:
                throw new Error(`Unknown strategy type: ${strategy.type}`);
        }
    }
    
    /**
     * Load from CDN with caching and retry logic
     */
    async loadFromCDN(moduleName, strategy, options, retryCount = 0) {
        const { url, timeout } = strategy;
        const maxRetries = 2;
        
        // Check cache first
        if (this.cache) {
            const cachedResponse = await this.cache.match(url);
            if (cachedResponse) {
                return this.processResponse(cachedResponse, moduleName, options);
            }
        }
        
        const actualTimeout = timeout + (retryCount * 5000);
        
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Timeout loading ${moduleName} after ${actualTimeout}ms`)), actualTimeout);
        });
        
        // Create fetch promise
        const fetchPromise = fetch(url).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Cache successful response
            if (this.cache) {
                this.cache.put(url, response.clone());
            }
            
            return this.processResponse(response, moduleName, options);
        }).catch(error => {
            if (retryCount < maxRetries && (error.message.includes('Timeout') || error.message.includes('Failed to fetch'))) {
                console.warn(`⚠️ Retry ${retryCount + 1}/${maxRetries} for ${moduleName} from ${url}`);
                return this.loadFromCDN(moduleName, strategy, options, retryCount + 1);
            }
            throw error;
        });
        
        return Promise.race([fetchPromise, timeoutPromise]);
    }
    
    /**
     * Load from local files
     */
    async loadFromLocal(moduleName, strategy, options) {
        const response = await fetch(`${strategy.path}/${moduleName}.js`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return this.processResponse(response, moduleName, options);
    }
    
    /**
     * Process response based on module type
     */
    async processResponse(response, moduleName, _options) {
        const scriptText = await response.text();
        
        // Create script element for dynamic loading
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            
            script.onload = () => {
                // Module-specific initialization
                switch (moduleName) {
                    case 'pose':
                        resolve(window.Pose);
                        break;
                    case 'camera_utils':
                        resolve({
                            Camera: window.Camera,
                            CameraUtils: window.CameraUtils
                        });
                        break;
                    case 'drawing_utils':
                        resolve({
                            drawConnectors: window.drawConnectors,
                            drawLandmarks: window.drawLandmarks,
                            POSE_CONNECTIONS: window.POSE_CONNECTIONS,
                            POSE_LANDMARKS: window.POSE_LANDMARKS
                        });
                        break;
                    default:
                        resolve(window[moduleName]);
                }
                document.head.removeChild(script);
            };
            
            script.onerror = () => {
                document.head.removeChild(script);
                reject(new Error(`Failed to execute script for ${moduleName}`));
            };
            
            script.text = scriptText;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Progressive loading for analysis modes
     */
    async loadAnalysisMode(mode) {
        const startTime = performance.now();
        
        switch (mode) {
            case 'basic':
                // Basic mode doesn't need MediaPipe
                return { mode: 'basic', loadTime: performance.now() - startTime };
                
            case 'advanced':
                try {
                    const [Pose, drawingUtils] = await Promise.all([
                        this.loadModule('pose'),
                        this.loadModule('drawing_utils')
                    ]);
                    
                    return {
                        mode: 'advanced',
                        Pose,
                        drawingUtils,
                        loadTime: performance.now() - startTime
                    };
                } catch (_error) {
                    console.warn('⚠️ Advanced mode failed, falling back to basic');
                    return { mode: 'basic', fallback: true, loadTime: performance.now() - startTime };
                }
                
            case 'gpu':
                try {
                    // Check WebGL support first
                    if (!this.checkWebGLSupport()) {
                        throw new Error('WebGL not supported');
                    }
                    
                    const [Pose, drawingUtils, cameraUtils] = await Promise.all([
                        this.loadModule('pose'),
                        this.loadModule('drawing_utils'),
                        this.loadModule('camera_utils')
                    ]);
                    
                    return {
                        mode: 'gpu',
                        Pose,
                        drawingUtils,
                        cameraUtils,
                        loadTime: performance.now() - startTime
                    };
                } catch (_error) {
                    console.warn('⚠️ GPU mode failed, falling back to advanced');
                    return this.loadAnalysisMode('advanced');
                }
                
            default:
                throw new Error(`Unknown analysis mode: ${mode}`);
        }
    }
    
    /**
     * Check WebGL support
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            return !!gl;
        } catch (_e) {
            return false;
        }
    }
    
    /**
     * Preload modules for better performance
     */
    async preloadModules(modules = ['pose', 'drawing_utils']) {
        
        const preloadPromises = modules.map(async (module) => {
            try {
                await this.loadModule(module);
                return { module, status: 'success' };
            } catch (error) {
                return { module, status: 'failed', error: error.message };
            }
        });
        
        const results = await Promise.allSettled(preloadPromises);
        const summary = results.map(result => result.value || { status: 'failed' });
        
        return summary;
    }
    
    /**
     * Set loading state with events
     */
    setLoadingState(moduleName, state) {
        this.loadingStates.set(moduleName, state);
        
        // Dispatch loading state event
        window.dispatchEvent(new CustomEvent('mediapipe-loading-state', {
            detail: { module: moduleName, state }
        }));
    }
    
    /**
     * Get loading state
     */
    getLoadingState(moduleName) {
        return this.loadingStates.get(moduleName) || 'idle';
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            loadingStates: Object.fromEntries(this.loadingStates),
            cachedModules: Array.from(this.loadedModules.keys()),
            totalLoadTime: Object.values(this.performanceMetrics.loadTimes).reduce((a, b) => a + b, 0)
        };
    }
    
    /**
     * Clear cache and reset
     */
    async clearCache() {
        if (this.cache) {
            await this.cache.clear();
        }
        this.loadedModules.clear();
        this.loadingPromises.clear();
        this.loadingStates.clear();
    }
    
    /**
     * Get memory usage estimation
     */
    getMemoryUsage() {
        const modules = Array.from(this.loadedModules.keys());
        const estimatedSize = {
            pose: 2.3 * 1024 * 1024, // ~2.3MB
            camera_utils: 150 * 1024, // ~150KB
            drawing_utils: 100 * 1024 // ~100KB
        };
        
        return modules.reduce((total, module) => {
            return total + (estimatedSize[module] || 0);
        }, 0);
    }
}

// Global instance
window.MediaPipeLoader = new MediaPipeLoader();

// Export for module systems
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = MediaPipeLoader;
}
