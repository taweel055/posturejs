/**
 * ProPostureFitness Configuration System
 * Ultra-optimized configuration management with performance monitoring
 */

class ConfigManager {
    constructor() {
        this.version = '1.0.0';
        this.initTime = performance.now();
        
        // Default configuration with performance optimization
        this.defaultConfig = {
            // System Settings
            system: {
                version: this.version,
                debugMode: false,
                performanceLogging: true,
                maxFPS: 60,
                targetLatency: 16.67, // 60fps = 16.67ms per frame
                memoryThreshold: 100 * 1024 * 1024, // 100MB
            },
            
            // Camera Configuration
            camera: {
                resolution: { width: 1280, height: 720 },
                frameRate: 30,
                facingMode: 'user',
                autoGainControl: true,
                echoCancellation: false,
                noiseSuppression: true,
            },
            
            // Analysis Settings
            analysis: {
                mode: 'advanced', // basic, advanced, gpu
                detectionConfidence: 0.7,
                trackingConfidence: 0.5,
                modelComplexity: 1, // 0=lite, 1=full, 2=heavy
                smoothing: true,
                smoothingFactor: 0.8,
            },
            
            // Performance Optimization
            performance: {
                useWebWorkers: true,
                useOffscreenCanvas: true,
                useWebGL: true,
                frameSkipping: false,
                adaptiveQuality: true,
                memoryPooling: true,
                batchProcessing: false,
            },
            
            // UI Settings
            ui: {
                showPerformanceOverlay: true,
                showSkeletonLines: true,
                showLandmarks: false,
                overlayOpacity: 0.8,
                theme: 'dark',
                animations: true,
                hapticFeedback: false,
            },
            
            // Analytics & Storage
            analytics: {
                sessionTracking: true,
                scoreHistory: true,
                maxHistoryEntries: 1000,
                exportFormat: 'json',
                autoSave: true,
                privacyMode: false,
            },
            
            // Advanced Features
            advanced: {
                multiPersonDetection: false,
                backgroundSegmentation: false,
                gestureRecognition: false,
                voiceAlerts: false,
                biometricTracking: false,
                mlModelCaching: true,
            }
        };
        
        this.config = this.loadConfig();
        this.setupPerformanceMonitoring();
        this.validateConfiguration();
    }
    
    /**
     * Load configuration from localStorage with fallback to defaults
     */
    loadConfig() {
        try {
            const stored = localStorage.getItem('proposturefitness-config');
            if (stored) {
                const parsed = JSON.parse(stored);
                return this.mergeConfigs(this.defaultConfig, parsed);
            }
        } catch (error) {
            console.warn('Failed to load stored config:', error);
        }
        return { ...this.defaultConfig };
    }
    
    /**
     * Deep merge configuration objects
     */
    mergeConfigs(defaults, overrides) {
        const result = { ...defaults };
        
        for (const key in overrides) {
            if (overrides[key] && typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
                result[key] = this.mergeConfigs(defaults[key] || {}, overrides[key]);
            } else {
                result[key] = overrides[key];
            }
        }
        
        return result;
    }
    
    /**
     * Save configuration to localStorage
     */
    saveConfig() {
        try {
            localStorage.setItem('proposturefitness-config', JSON.stringify(this.config));
            this.logPerformance('config_save', performance.now() - this.initTime);
            return true;
        } catch (error) {
            console.error('Failed to save config:', error);
            return false;
        }
    }
    
    /**
     * Get configuration value with dot notation
     */
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let current = this.config;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        
        return current;
    }
    
    /**
     * Set configuration value with dot notation
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = this.config;
        
        for (const key of keys) {
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[lastKey] = value;
        this.saveConfig();
        
        // Trigger configuration change event
        this.dispatchConfigChange(path, value);
    }
    
    /**
     * Reset configuration to defaults
     */
    reset() {
        this.config = { ...this.defaultConfig };
        this.saveConfig();
        this.dispatchConfigChange('*', this.config);
    }
    
    /**
     * Validate configuration for performance and compatibility
     */
    validateConfiguration() {
        const issues = [];
        
        // Check WebGL support for GPU mode
        if (this.get('analysis.mode') === 'gpu' && !this.checkWebGLSupport()) {
            issues.push('GPU mode selected but WebGL not supported');
            this.set('analysis.mode', 'advanced');
        }
        
        // Validate camera resolution
        const resolution = this.get('camera.resolution');
        if (resolution.width * resolution.height > 1920 * 1080) {
            issues.push('Camera resolution too high, may impact performance');
        }
        
        // Check memory threshold
        if (this.get('system.memoryThreshold') > 500 * 1024 * 1024) {
            issues.push('Memory threshold very high, may cause browser issues');
        }
        
        // Validate FPS settings
        const maxFPS = this.get('system.maxFPS');
        if (maxFPS > 60) {
            issues.push('FPS above 60 may not be achievable in browser');
            this.set('system.maxFPS', 60);
        }
        
        if (issues.length > 0) {
            console.warn('Configuration validation issues:', issues);
        }
        
        return issues;
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
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        if (!this.get('system.performanceLogging')) {return;}
        
        this.performanceMetrics = {
            configLoads: 0,
            configSaves: 0,
            memoryUsage: 0,
            lastUpdate: Date.now(),
        };
        
        // Monitor memory usage
        if (performance.memory) {
            setInterval(() => {
                this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
                
                // Alert if memory usage is high
                const threshold = this.get('system.memoryThreshold');
                if (this.performanceMetrics.memoryUsage > threshold) {
                    this.dispatchEvent('memory-warning', {
                        usage: this.performanceMetrics.memoryUsage,
                        threshold
                    });
                }
            }, 5000);
        }
    }
    
    /**
     * Log performance metrics
     */
    logPerformance(operation, duration) {
        if (!this.get('system.performanceLogging')) {return;}
        
        this.performanceMetrics[operation] = (this.performanceMetrics[operation] || 0) + 1;
        
        if (this.get('system.debugMode')) {
            console.log(`Config ${operation}: ${duration.toFixed(2)}ms`);
        }
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }
    
    /**
     * Dispatch configuration change event
     */
    dispatchConfigChange(path, value) {
        window.dispatchEvent(new CustomEvent('config-changed', {
            detail: { path, value, config: this.config }
        }));
    }
    
    /**
     * Dispatch custom event
     */
    dispatchEvent(type, data) {
        window.dispatchEvent(new CustomEvent(`config-${type}`, {
            detail: data
        }));
    }
    
    /**
     * Export configuration
     */
    export() {
        return {
            version: this.version,
            timestamp: Date.now(),
            config: this.config,
            metrics: this.performanceMetrics
        };
    }
    
    /**
     * Import configuration
     */
    import(data) {
        try {
            if (data.version !== this.version) {
                console.warn('Configuration version mismatch');
            }
            
            this.config = this.mergeConfigs(this.defaultConfig, data.config);
            this.saveConfig();
            this.validateConfiguration();
            
            return true;
        } catch (error) {
            console.error('Failed to import configuration:', error);
            return false;
        }
    }
    
    /**
     * Get camera constraints for WebRTC
     */
    getCameraConstraints() {
        const camera = this.get('camera');
        return {
            video: {
                width: { ideal: camera.resolution.width },
                height: { ideal: camera.resolution.height },
                frameRate: { ideal: camera.frameRate },
                facingMode: camera.facingMode,
                autoGainControl: camera.autoGainControl,
                echoCancellation: camera.echoCancellation,
                noiseSuppression: camera.noiseSuppression,
            },
            audio: false
        };
    }
    
    /**
     * Get MediaPipe configuration
     */
    getMediaPipeConfig() {
        const analysis = this.get('analysis');
        return {
            modelComplexity: analysis.modelComplexity,
            enableSegmentation: false,
            smoothLandmarks: analysis.smoothing,
            minDetectionConfidence: analysis.detectionConfidence,
            minTrackingConfidence: analysis.trackingConfidence,
        };
    }
    
    /**
     * Get optimal settings based on device capabilities
     */
    getOptimizedSettings() {
        const deviceInfo = this.getDeviceInfo();
        const optimized = { ...this.config };
        
        // Adjust based on device performance
        if (deviceInfo.isMobile) {
            optimized.camera.resolution = { width: 640, height: 480 };
            optimized.camera.frameRate = 24;
            optimized.analysis.modelComplexity = 0;
            optimized.performance.frameSkipping = true;
        }
        
        if (deviceInfo.isLowEnd) {
            optimized.analysis.mode = 'basic';
            optimized.ui.animations = false;
            optimized.performance.adaptiveQuality = true;
        }
        
        return optimized;
    }
    
    /**
     * Get device information for optimization
     */
    getDeviceInfo() {
        const userAgent = navigator.userAgent;
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
        
        // Rough performance estimation
        const cores = navigator.hardwareConcurrency || 2;
        const memory = navigator.deviceMemory || 2;
        const isLowEnd = cores < 4 || memory < 4;
        
        return {
            isMobile,
            isTablet,
            isLowEnd,
            cores,
            memory,
            userAgent
        };
    }
}

// Global configuration instance
window.ProPostureConfig = new ConfigManager();

// Export for module systems (CommonJS)
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = ConfigManager;
}