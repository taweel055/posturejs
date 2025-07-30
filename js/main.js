/**
 * ProPostureFitness Main Application Controller
 * Ultra-optimized main application with performance monitoring and error handling
 */

import APIService from './apiService.js';
import AuthManager from './authManager.js';
import HeaderManager from './headerManager.js';
import VideoControlsManager from './videoControlsManager.js';
import MetricsManager from './metricsManager.js';
import AlertsManager from './alertsManager.js';
import SkeletonOverlayManager from './skeletonOverlayManager.js';
import GamificationManager from './gamificationManager.js';
import ExerciseRecommendationManager from './exerciseRecommendationManager.js';
import SettingsManager from './settingsManager.js';

class ProPostureFitnessApp {
    constructor() {
        this.version = '1.0.0';
        this.initialized = false;
        this.running = false;
        
        // Core components
        this.cameraManager = null;
        this.postureAnalyzer = null;
        this.uiManager = null;
        
        // Backend integration
        this.apiService = APIService;
        this.authManager = null;
        this.headerManager = null;
        this.videoControlsManager = null;
        this.metricsManager = null;
        this.alertsManager = null;
        this.skeletonOverlayManager = null;
        this.gamificationManager = null;
        this.exerciseRecommendationManager = null;
        this.settingsManager = null;
        this.currentSession = null;
        
        // Performance monitoring
        this.performanceMonitor = {
            startTime: 0,
            frameCount: 0,
            lastFpsUpdate: 0,
            currentFps: 0,
            processingTimes: [],
            maxHistorySize: 100
        };
        
        // Error handling
        this.errorCount = 0;
        this.maxErrors = 10;
        this.lastError = null;
        
        // Analysis state
        this.analysisMode = 'advanced';
        this.isAnalyzing = false;
        this.frameProcessingActive = false;
        
        this.initialize();
    }
    
    /**
     * Initialize the application
     */
    async initialize() {
        try {
            
            // Check browser compatibility
            if (!this.checkCompatibility()) {
                throw new Error('Browser compatibility check failed');
            }
            
            // Initialize configuration
            this.initializeConfiguration();
            
            // Initialize authentication manager
            this.authManager = new AuthManager(this.apiService);
            this.authManager.setAuthStateChangeCallback((isAuthenticated, user) => {
                this.handleAuthStateChange(isAuthenticated, user);
            });
            
            // Initialize header manager
            this.headerManager = new HeaderManager(this.apiService, this.authManager);
            
            // Initialize UI manager
            this.uiManager = new UIManager();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize camera manager
            this.cameraManager = new CameraManager();
            
            // Start MediaPipe preloading for better performance
            this.preloadMediaPipe();
            
            // Initialize default posture analyzer
            this.initializePostureAnalyzer();
            
            // Initialize video controls manager
            this.videoControlsManager = new VideoControlsManager(this.cameraManager, this.postureAnalyzer);
            
            // Initialize metrics manager
            this.metricsManager = new MetricsManager(this.apiService, this.postureAnalyzer);
            
            // Initialize alerts manager
            this.alertsManager = new AlertsManager(this.apiService, this.metricsManager);
            
            // Initialize skeleton overlay manager
            this.skeletonOverlayManager = new SkeletonOverlayManager(this.postureAnalyzer, this.videoControlsManager);
            
            // Initialize gamification manager
            this.gamificationManager = new GamificationManager(this.apiService, this.metricsManager, this.alertsManager);
            
            // Initialize exercise recommendation manager
            this.exerciseRecommendationManager = new ExerciseRecommendationManager(this.postureAnalyzer, this.alertsManager, this.metricsManager);
            window.exerciseRecommendationManager = this.exerciseRecommendationManager; // Make globally available
            
            // Initialize settings manager
            this.settingsManager = new SettingsManager(this.apiService, this.videoControlsManager, this.alertsManager);
            window.settingsManager = this.settingsManager; // Make globally available
            
            // Setup performance monitoring
            this.setupPerformanceMonitoring();
            
            // Setup error handling
            this.setupErrorHandling();
            
            // Load saved state
            this.loadSavedState();
            
            this.initialized = true;
            
            // Dispatch initialization event
            window.dispatchEvent(new CustomEvent('app-initialized', {
                detail: { version: this.version }
            }));
            
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * Preload MediaPipe modules for better performance
     */
    async preloadMediaPipe() {
        try {
            
            // Get the preferred analysis mode
            const preferredMode = this.analysisMode || 'advanced';
            
            // Start preloading in background
            window.MediaPipeLoader.preloadModules(['pose', 'drawing_utils']).then((results) => {
                const successful = results.filter(r => r.status === 'success').length;
                const total = results.length;
                
                
                // Dispatch preload completion event
                window.dispatchEvent(new CustomEvent('mediapipe-preloaded', {
                    detail: { 
                        results, 
                        successful, 
                        total,
                        preferredMode 
                    }
                }));
            }).catch(error => {
                console.warn('⚠️ MediaPipe preloading failed:', error);
            });
            
        } catch (error) {
            console.warn('⚠️ MediaPipe preload initialization failed:', error);
        }
    }
    
    /**
     * Check browser compatibility
     */
    checkCompatibility() {
        const requirements = {
            'WebRTC': () => !!navigator.mediaDevices?.getUserMedia,
            'Canvas': () => !!document.createElement('canvas').getContext,
            'WebGL': () => !!document.createElement('canvas').getContext('webgl'),
            'ES6 Classes': () => typeof class {} === 'function',
            'Promises': () => typeof Promise !== 'undefined',
            'Async/Await': () => {
                try {
                    return (async () => {})().constructor === Promise;
                } catch (_e) {
                    return false;
                }
            },
            'LocalStorage': () => typeof Storage !== 'undefined',
            'MediaPipe': () => typeof Pose !== 'undefined'
        };
        
        const results = {};
        let allSupported = true;
        
        for (const [feature, check] of Object.entries(requirements)) {
            const supported = check();
            results[feature] = supported;
            
            if (!supported && feature !== 'MediaPipe') { // MediaPipe is optional
                console.error(`❌ ${feature} not supported`);
                allSupported = false;
            }
        }
        
        
        if (!allSupported) {
            this.showCompatibilityError(results);
            return false;
        }
        
        return true;
    }
    
    /**
     * Show compatibility error
     */
    showCompatibilityError(results) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ef4444;
            color: white;
            padding: 2rem;
            border-radius: 0.5rem;
            z-index: 10001;
            max-width: 500px;
            text-align: center;
        `;
        
        const unsupported = Object.entries(results)
            .filter(([, supported]) => !supported)
            .map(([feature]) => feature);
        
        errorDiv.innerHTML = `
            <h3>❌ Browser Not Supported</h3>
            <p>Your browser doesn't support the following required features:</p>
            <ul style="text-align: left; margin: 1rem 0;">
                ${unsupported.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
            <p>Please use a modern browser like Chrome, Firefox, or Safari.</p>
        `;
        
        document.body.appendChild(errorDiv);
    }
    
    /**
     * Initialize configuration
     */
    initializeConfiguration() {
        // Configuration is already initialized via config.js
        // Apply any app-specific configurations here
        
        const config = window.ProPostureConfig;
        this.analysisMode = config.get('analysis.mode');
        
    }
    
    /**
     * Initialize posture analyzer
     */
    initializePostureAnalyzer() {
        try {
            this.postureAnalyzer = PostureAnalyzerFactory.create(this.analysisMode);
        } catch (error) {
            console.error('Posture analyzer initialization failed:', error);
            // Fallback to basic mode
            this.analysisMode = 'basic';
            this.postureAnalyzer = PostureAnalyzerFactory.create('basic');
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // UI events
        window.addEventListener('ui-start-analysis', (e) => this.startAnalysis(e.detail.mode));
        window.addEventListener('ui-stop-analysis', async () => await this.stopAnalysis());
        window.addEventListener('ui-take-screenshot', () => this.takeScreenshot());
        window.addEventListener('ui-mode-changed', (e) => this.changeAnalysisMode(e.detail.mode));
        
        // Camera events
        window.addEventListener('camera-initialized', () => this.handleCameraReady());
        window.addEventListener('camera-error', (e) => this.handleCameraError(e.detail));
        
        // Configuration events
        window.addEventListener('config-changed', (e) => this.handleConfigChange(e.detail));
        
        // Performance events
        window.addEventListener('memory-warning', (e) => this.handleMemoryWarning(e.detail));
        
        // Page lifecycle events
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        window.addEventListener('beforeunload', () => this.handleBeforeUnload());
        
        // Error events
        window.addEventListener('error', (e) => this.handleGlobalError(e));
        window.addEventListener('unhandledrejection', (e) => this.handleUnhandledRejection(e));
        
    }
    
    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // FPS monitoring
        setInterval(() => {
            this.updateFpsMetrics();
        }, 1000);
        
        // Memory monitoring
        if (performance.memory) {
            setInterval(() => {
                this.monitorMemoryUsage();
            }, 5000);
        }
        
        // Performance logging
        setInterval(() => {
            this.logPerformanceMetrics();
        }, 30000); // Every 30 seconds
        
    }
    
    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // Set up global error boundaries
        this.setupErrorBoundaries();
        
    }
    
    /**
     * Start analysis
     */
    async startAnalysis(mode = this.analysisMode) {
        if (this.isAnalyzing) {
            console.warn('⚠️ Analysis already running');
            return false;
        }
        
        try {
            
            // Check authentication and start session
            if (!this.apiService.isAuthenticated()) {
                console.warn('⚠️ User not authenticated, starting session locally only');
                // Start local session in metrics manager
                if (this.metricsManager) {
                    await this.metricsManager.startSession();
                }
            } else {
                // Create new posture session (this will also sync with metrics manager)
                await this.createPostureSession();
            }
            
            // Initialize camera if not already done
            if (!this.cameraManager.isInitialized) {
                const cameraReady = await this.cameraManager.initializeCamera();
                if (!cameraReady) {
                    throw new Error('Camera initialization failed');
                }
            }
            
            // Switch analyzer mode if needed
            if (mode !== this.analysisMode) {
                await this.changeAnalysisMode(mode);
            }
            
            // Start frame processing
            this.startFrameProcessing();
            
            // Set state
            this.isAnalyzing = true;
            this.running = true;
            this.performanceMonitor.startTime = performance.now();
            this.performanceMonitor.frameCount = 0;
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to start analysis:', error);
            this.handleAnalysisError(error);
            return false;
        }
    }
    
    /**
     * Stop analysis
     */
    async stopAnalysis() {
        if (!this.isAnalyzing) {
            console.warn('⚠️ Analysis not running');
            return;
        }
        
        
        // Stop frame processing
        this.stopFrameProcessing();
        
        // End posture session (this will also sync with metrics manager)
        await this.endPostureSession();
        
        // Set state
        this.isAnalyzing = false;
        this.running = false;
        
        // Log session summary
        this.logSessionSummary();
        
    }
    
    /**
     * Start frame processing loop
     */
    startFrameProcessing() {
        if (this.frameProcessingActive) {return;}
        
        this.frameProcessingActive = true;
        
        // Add frame callback to camera manager
        this.cameraManager.addFrameCallback((imageData) => {
            this.processFrame(imageData);
        });
        
    }
    
    /**
     * Stop frame processing
     */
    stopFrameProcessing() {
        this.frameProcessingActive = false;
        
        // Remove frame callback
        this.cameraManager.removeFrameCallback(this.processFrame.bind(this));
        
    }
    
    /**
     * Process individual frame
     */
    async processFrame(imageData) {
        if (!this.frameProcessingActive || !this.postureAnalyzer) {return;}
        
        const frameStartTime = performance.now();
        
        try {
            // Analyze posture
            const result = await this.postureAnalyzer.analyzePosture(imageData);
            
            if (result) {
                // Calculate FPS
                this.performanceMonitor.frameCount++;
                const fps = this.calculateCurrentFps();
                
                // Add FPS and processing time to result
                const processingTime = performance.now() - frameStartTime;
                result.fps = fps;
                result.processingTime = processingTime;
                result.frameCount = this.performanceMonitor.frameCount;
                
                // Track processing time
                this.trackProcessingTime(processingTime);
                
                // Update metrics manager with enhanced data
                if (this.metricsManager) {
                    const enhancedMetrics = {
                        ...result,
                        postureScore: result.score || 0,
                        headPosition: result.headAlignment || 0,
                        shoulderAlignment: result.shoulderLevel || 0,
                        spineCurvature: result.spinePosture || 0,
                        headTiltAngle: result.headTilt || 0,
                        neckAngle: result.neckAngle || 0,
                        shoulderSlope: result.shoulderSlope || 0,
                        spineAlignment: result.spineAlignment || 0,
                        forwardHeadDistance: result.forwardHead || 0,
                        shoulderHeightDiff: result.shoulderImbalance || 0,
                        hipAlignment: result.hipAlignment || 0,
                        timestamp: Date.now()
                    };
                    this.metricsManager.updateMetrics(enhancedMetrics);
                }
                
                // Update video controls manager
                if (this.videoControlsManager) {
                    this.videoControlsManager.updateFromAnalyzer({
                        fps,
                        score: result.score,
                        status: result.score >= 70 ? 'Good' : result.score >= 50 ? 'Fair' : 'Poor'
                    });
                }
                
                // Send data to backend
                await this.sendPostureData(result);
                
                // Dispatch result event
                window.dispatchEvent(new CustomEvent('analysis-result', {
                    detail: result
                }));
                
                // Auto-screenshot for excellent posture
                if (result.score > 90 && window.ProPostureConfig.get('analytics.autoSave')) {
                    this.autoScreenshot(result.score);
                }
            }
            
        } catch (error) {
            console.error('Frame processing error:', error);
            this.handleFrameProcessingError(error);
        }
    }
    
    /**
     * Calculate current FPS
     */
    calculateCurrentFps() {
        const now = performance.now();
        const elapsed = (now - this.performanceMonitor.startTime) / 1000;
        
        if (elapsed > 0) {
            return this.performanceMonitor.frameCount / elapsed;
        }
        
        return 0;
    }
    
    /**
     * Track processing time
     */
    trackProcessingTime(time) {
        this.performanceMonitor.processingTimes.push(time);
        
        // Keep only recent times
        if (this.performanceMonitor.processingTimes.length > this.performanceMonitor.maxHistorySize) {
            this.performanceMonitor.processingTimes.shift();
        }
    }
    
    /**
     * Take screenshot
     */
    takeScreenshot() {
        if (!this.cameraManager) {
            console.warn('⚠️ Camera not available for screenshot');
            return null;
        }
        
        try {
            const screenshotUrl = this.cameraManager.takeScreenshot();
            
            if (screenshotUrl) {
                // Log screenshot
                
                // Dispatch screenshot event
                window.dispatchEvent(new CustomEvent('screenshot-taken', {
                    detail: { url: screenshotUrl, timestamp: Date.now() }
                }));
            }
            
            return screenshotUrl;
            
        } catch (error) {
            console.error('Screenshot error:', error);
            return null;
        }
    }
    
    /**
     * Auto-screenshot for good posture
     */
    autoScreenshot(_score) {
        // Throttle auto-screenshots (max 1 per minute)
        const now = Date.now();
        if (this.lastAutoScreenshot && (now - this.lastAutoScreenshot) < 60000) {
            return;
        }
        
        this.lastAutoScreenshot = now;
        this.takeScreenshot();
        
    }
    
    /**
     * Change analysis mode
     */
    async changeAnalysisMode(mode) {
        if (mode === this.analysisMode) {return;}
        
        try {
            
            // Stop current analysis if running
            const wasRunning = this.isAnalyzing;
            if (wasRunning) {
                await this.stopAnalysis();
            }
            
            // Create new analyzer
            this.postureAnalyzer = PostureAnalyzerFactory.create(mode);
            this.analysisMode = mode;
            
            // Update configuration
            window.ProPostureConfig.set('analysis.mode', mode);
            
            // Restart analysis if it was running
            if (wasRunning) {
                await this.startAnalysis(mode);
            }
            
            
        } catch (error) {
            console.error(`❌ Failed to switch to ${mode} mode:`, error);
            // Fallback to previous mode or basic
            this.analysisMode = this.analysisMode || 'basic';
            this.postureAnalyzer = PostureAnalyzerFactory.create(this.analysisMode);
        }
    }
    
    /**
     * Handle camera ready
     */
    handleCameraReady() {
    }
    
    /**
     * Handle camera error
     */
    async handleCameraError(errorInfo) {
        console.error('📷 Camera error:', errorInfo);
        
        // Stop analysis if running
        if (this.isAnalyzing) {
            await this.stopAnalysis();
        }
        
        // Reset UI state
        this.uiManager?.resetUIState();
    }
    
    /**
     * Handle configuration changes
     */
    handleConfigChange(detail) {
        const { path, value } = detail;
        
        
        // Handle specific configuration changes
        if (path === 'analysis.mode') {
            this.changeAnalysisMode(value);
        }
    }
    
    /**
     * Handle memory warning
     */
    handleMemoryWarning(detail) {
        console.warn('⚠️ Memory warning:', detail);
        
        // Implement memory optimization strategies
        this.optimizeMemoryUsage();
    }
    
    /**
     * Optimize memory usage
     */
    optimizeMemoryUsage() {
        // Clear processing time history
        this.performanceMonitor.processingTimes = [];
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
    }
    
    /**
     * Handle visibility change
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden, pause analysis
            if (this.isAnalyzing) {
                this.pauseAnalysis();
            }
        } else {
            // Page is visible, resume analysis
            if (this.wasPaused) {
                this.resumeAnalysis();
            }
        }
    }
    
    /**
     * Pause analysis
     */
    pauseAnalysis() {
        if (!this.isAnalyzing) {return;}
        
        this.wasPaused = true;
        this.stopFrameProcessing();
        this.cameraManager?.pause();
        
    }
    
    /**
     * Resume analysis
     */
    resumeAnalysis() {
        if (!this.wasPaused) {return;}
        
        this.wasPaused = false;
        this.cameraManager?.resume();
        this.startFrameProcessing();
        
    }
    
    /**
     * Handle before unload
     */
    handleBeforeUnload() {
        // Save current state
        this.saveState();
        
        // Stop analysis
        if (this.isAnalyzing) {
            this.stopAnalysis(); // Don't await here as page is unloading
        }
        
        // Cleanup resources
        this.cleanup();
    }
    
    /**
     * Handle global errors
     */
    handleGlobalError(event) {
        this.errorCount++;
        this.lastError = {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            timestamp: Date.now()
        };
        
        console.error('Global error:', this.lastError);
        
        // Stop analysis if too many errors
        if (this.errorCount > this.maxErrors) {
            this.emergencyStop();
        }
    }
    
    /**
     * Handle unhandled promise rejections
     */
    handleUnhandledRejection(event) {
        this.errorCount++;
        
        console.error('Unhandled promise rejection:', event.reason);
        
        // Prevent default browser behavior
        event.preventDefault();
    }
    
    /**
     * Handle initialization error
     */
    handleInitializationError(error) {
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ef4444;
            color: white;
            padding: 2rem;
            border-radius: 0.5rem;
            z-index: 10001;
            max-width: 500px;
            text-align: center;
        `;
        
        errorDiv.innerHTML = `
            <h3>❌ Initialization Failed</h3>
            <p>${error.message}</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #ef4444;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 0.25rem;
                margin-top: 1rem;
                cursor: pointer;
            ">Reload Page</button>
        `;
        
        document.body.appendChild(errorDiv);
    }
    
    /**
     * Handle analysis error
     */
    handleAnalysisError(error) {
        console.error('Analysis error:', error);
        
        // Reset analysis state
        this.isAnalyzing = false;
        this.running = false;
        
        // Show error notification
        if (this.uiManager) {
            this.uiManager.showErrorMessage(`Analysis failed: ${error.message}`);
            this.uiManager.resetUIState();
        }
    }
    
    /**
     * Handle frame processing error
     */
    handleFrameProcessingError(error) {
        this.errorCount++;
        
        // Log error but continue processing
        console.warn('Frame processing error:', error);
        
        // Stop processing if too many errors
        if (this.errorCount > this.maxErrors) {
            this.emergencyStop();
        }
    }
    
    /**
     * Emergency stop
     */
    emergencyStop() {
        console.error('🚨 Emergency stop due to excessive errors');
        
        // Stop all processing
        if (this.isAnalyzing) {
            this.stopAnalysis(); // Don't await here as this is emergency stop
        }
        this.cameraManager?.stop();
        
        // Show error message
        if (this.uiManager) {
            this.uiManager.showErrorMessage('Application stopped due to errors. Please refresh the page.');
        }
    }
    
    /**
     * Setup error boundaries
     */
    setupErrorBoundaries() {
        // Wrap critical functions in try-catch
        const originalProcessFrame = this.processFrame.bind(this);
        this.processFrame = async (imageData) => {
            try {
                return await originalProcessFrame(imageData);
            } catch (error) {
                this.handleFrameProcessingError(error);
            }
        };
    }
    
    /**
     * Update FPS metrics
     */
    updateFpsMetrics() {
        const now = performance.now();
        
        if (this.performanceMonitor.lastFpsUpdate > 0) {
            const elapsed = (now - this.performanceMonitor.lastFpsUpdate) / 1000;
            this.performanceMonitor.currentFps = this.performanceMonitor.frameCount / elapsed;
        }
        
        this.performanceMonitor.lastFpsUpdate = now;
    }
    
    /**
     * Monitor memory usage
     */
    monitorMemoryUsage() {
        if (!performance.memory) {return;}
        
        const memory = performance.memory;
        const usedMB = memory.usedJSHeapSize / (1024 * 1024);
        const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
        
        // Warn if memory usage is high
        if (usedMB > limitMB * 0.8) {
            console.warn(`⚠️ High memory usage: ${usedMB.toFixed(1)}MB / ${limitMB.toFixed(1)}MB`);
            this.optimizeMemoryUsage();
        }
    }
    
    /**
     * Log performance metrics
     */
    logPerformanceMetrics() {
        if (!this.isAnalyzing) {return;}
        
        const _metrics = {
            fps: this.performanceMonitor.currentFps,
            frameCount: this.performanceMonitor.frameCount,
            avgProcessingTime: this.getAverageProcessingTime(),
            memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 0,
            uptime: (performance.now() - this.performanceMonitor.startTime) / 1000
        };
        
    }
    
    /**
     * Get average processing time
     */
    getAverageProcessingTime() {
        const times = this.performanceMonitor.processingTimes;
        if (times.length === 0) {return 0;}
        
        const sum = times.reduce((a, b) => a + b, 0);
        return sum / times.length;
    }
    
    /**
     * Log session summary
     */
    logSessionSummary() {
        const totalTime = (performance.now() - this.performanceMonitor.startTime) / 1000;
        const _avgFps = this.performanceMonitor.frameCount / totalTime;
        const _avgProcessingTime = this.getAverageProcessingTime();
        
    }
    
    /**
     * Save application state
     */
    saveState() {
        const state = {
            version: this.version,
            analysisMode: this.analysisMode,
            timestamp: Date.now(),
            performanceMetrics: this.performanceMonitor,
            errorCount: this.errorCount
        };
        
        try {
            localStorage.setItem('proposturefitness-state', JSON.stringify(state));
        } catch (error) {
            console.warn('Failed to save state:', error);
        }
    }
    
    /**
     * Load saved state
     */
    loadSavedState() {
        try {
            const saved = localStorage.getItem('proposturefitness-state');
            if (saved) {
                const state = JSON.parse(saved);
                
                // Restore analysis mode if valid
                if (state.analysisMode && PostureAnalyzerFactory.getSupportedModes().includes(state.analysisMode)) {
                    this.analysisMode = state.analysisMode;
                }
                
            }
        } catch (error) {
            console.warn('Failed to load saved state:', error);
        }
    }
    
    /**
     * Get application status
     */
    getStatus() {
        return {
            version: this.version,
            initialized: this.initialized,
            running: this.running,
            isAnalyzing: this.isAnalyzing,
            analysisMode: this.analysisMode,
            errorCount: this.errorCount,
            performanceMetrics: this.performanceMonitor
        };
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        
        // Stop analysis
        if (this.isAnalyzing) {
            this.stopAnalysis(); // Don't await here as this is cleanup
        }
        
        // Cleanup components
        this.cameraManager?.stop();
        this.uiManager?.destroy();
        
        // Clear intervals and timeouts
        // (This would be more comprehensive in a real implementation)
        
    }

    // Backend Integration Methods

    /**
     * Handle authentication state change
     */
    handleAuthStateChange(isAuthenticated, _user) {
        
        if (isAuthenticated) {
            // Load user preferences and data
            this.loadUserData();
        } else {
            // Clear session data
            this.currentSession = null;
        }
    }

    /**
     * Load user data and preferences
     */
    async loadUserData() {
        try {
            const [profile, _stats] = await Promise.all([
                this.apiService.getProfile(),
                this.apiService.getUserStats()
            ]);

            
            // Apply user preferences to configuration
            if (profile.user.preferences) {
                this.applyUserPreferences(profile.user.preferences);
            }

        } catch (error) {
            console.error('❌ Failed to load user data:', error);
        }
    }

    /**
     * Apply user preferences
     */
    applyUserPreferences(preferences) {
        // Apply preferences to the application configuration
        Object.keys(preferences).forEach(key => {
            if (window.ProPostureConfig.has(key)) {
                window.ProPostureConfig.set(key, preferences[key]);
            }
        });

    }

    /**
     * Create new posture session
     */
    async createPostureSession() {
        try {
            const sessionData = {
                sessionName: `Session ${new Date().toLocaleString()}`,
                sessionNotes: `Analysis mode: ${this.analysisMode}`
            };

            const response = await this.apiService.createPostureSession(sessionData);
            this.currentSession = response.session;
            

            // Sync with metrics manager
            if (this.metricsManager) {
                this.metricsManager.sessionId = this.currentSession.id;
                this.metricsManager.isSessionActive = true;
                this.metricsManager.sessionStartTime = Date.now();
            }

            // Join WebSocket session for real-time updates
            if (this.apiService.socket) {
                this.apiService.joinSession(this.currentSession.id);
                this.apiService.startPostureStreaming(this.currentSession.id);
            }

            return this.currentSession;

        } catch (error) {
            console.error('❌ Failed to create posture session:', error);
            // Continue with local-only session
            this.currentSession = {
                id: Date.now(),
                local: true,
                startTime: new Date().toISOString()
            };
            
            // Sync with metrics manager for local session
            if (this.metricsManager) {
                this.metricsManager.sessionId = this.currentSession.id;
                this.metricsManager.isSessionActive = true;
                this.metricsManager.sessionStartTime = Date.now();
            }
            
            return this.currentSession;
        }
    }

    /**
     * End current posture session
     */
    async endPostureSession() {
        if (!this.currentSession) {return;}

        try {
            // Sync with metrics manager first
            if (this.metricsManager && this.metricsManager.isSessionActive) {
                await this.metricsManager.endSession();
            }

            if (!this.currentSession.local && this.apiService.isAuthenticated()) {
                // Calculate session summary
                const duration = Math.floor((performance.now() - this.performanceMonitor.startTime) / 1000);
                const avgProcessingTime = this.getAverageProcessingTime();
                
                const sessionUpdate = {
                    endTime: new Date().toISOString(),
                    postureScore: this.getSessionAverageScore(),
                    sessionNotes: `Completed - Duration: ${duration}s, Avg Processing: ${avgProcessingTime.toFixed(2)}ms`
                };

                await this.apiService.updatePostureSession(this.currentSession.id, sessionUpdate);

                // Stop WebSocket streaming
                if (this.apiService.socket) {
                    this.apiService.stopPostureStreaming();
                    this.apiService.leaveSession(this.currentSession.id);
                }
            }

        } catch (error) {
            console.error('❌ Failed to end posture session:', error);
        }

        this.currentSession = null;
    }

    /**
     * Send posture data to backend
     */
    async sendPostureData(analysisResult) {
        if (!this.currentSession || this.currentSession.local || !this.apiService.isAuthenticated()) {
            return; // Skip if no session or local-only
        }

        try {
            const postureData = {
                sessionId: this.currentSession.id,
                postureScore: analysisResult.score,
                headAngle: analysisResult.headAlignment,
                shoulderAngle: analysisResult.shoulderLevel,
                spineAngle: analysisResult.forwardHead,
                isGoodPosture: analysisResult.score >= 70,
                timestamp: new Date().toISOString()
            };

            // Send via WebSocket for real-time updates
            if (this.apiService.socket) {
                this.apiService.sendPostureData(postureData);
            } else {
                // Fallback to HTTP API (less efficient for real-time data)
                await this.apiService.addPostureData(postureData);
            }

        } catch (error) {
            console.error('❌ Failed to send posture data:', error);
            // Continue silently - don't disrupt analysis
        }
    }

    /**
     * Get session average score
     */
    getSessionAverageScore() {
        // This would calculate from stored results
        // For now, return a placeholder
        return 75.0;
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.ProPostureFitnessApp = new ProPostureFitnessApp();
});

// Export for external access
window.ProPostureFitnessApp = ProPostureFitnessApp;
