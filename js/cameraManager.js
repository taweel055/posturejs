/**
 * ProPostureFitness Camera Management System
 * Ultra-optimized camera handling with WebRTC and performance monitoring
 */

class CameraManager {
    constructor() {
        this.stream = null;
        this.videoElement = null;
        this.canvas = null;
        this.context = null;
        this.isInitialized = false;
        this.isStreaming = false;
        
        // Performance monitoring
        this.performanceMetrics = {
            initTime: 0,
            frameRate: 0,
            resolution: { width: 0, height: 0 },
            bandwidth: 0,
            droppedFrames: 0,
            latency: 0
        };
        
        // Error handling
        this.errorCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000;
        
        // Frame processing
        this.frameCallbacks = [];
        this.animationFrameId = null;
        this.lastFrameTime = 0;
        this.frameBuffer = [];
        this.maxBufferSize = 3;
        
        this.setupEventListeners();
    }
    
    /**
     * Initialize camera with optimal settings
     */
    async initializeCamera() {
        const startTime = performance.now();
        
        try {
            
            // Check browser compatibility
            if (!this.checkBrowserSupport()) {
                throw new Error('Browser does not support required camera APIs');
            }
            
            // Get optimal camera constraints
            const constraints = this.getOptimalConstraints();
            
            // Request camera access with retry logic
            this.stream = await this.requestCameraWithRetry(constraints);
            
            // Setup video element
            this.setupVideoElement();
            
            // Initialize canvas for frame processing
            this.initializeCanvas();
            
            // Start frame processing loop
            this.startFrameProcessing();
            
            // Setup performance monitoring
            this.setupPerformanceMonitoring();
            
            this.isInitialized = true;
            this.isStreaming = true;
            
            this.performanceMetrics.initTime = performance.now() - startTime;
            
            
            // Dispatch initialization event
            this.dispatchEvent('camera-initialized', {
                resolution: this.performanceMetrics.resolution,
                initTime: this.performanceMetrics.initTime
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Camera initialization failed:', error);
            this.handleCameraError(error);
            return false;
        }
    }
    
    /**
     * Check browser support for required APIs
     */
    checkBrowserSupport() {
        const required = [
            'navigator.mediaDevices',
            'navigator.mediaDevices.getUserMedia',
            'HTMLVideoElement',
            'HTMLCanvasElement',
            'CanvasRenderingContext2D'
        ];
        
        for (const api of required) {
            if (!this.checkAPISupport(api)) {
                console.error(`❌ Missing required API: ${api}`);
                return false;
            }
        }
        
        // Check for advanced features
        const _advanced = {
            webgl: !!document.createElement('canvas').getContext('webgl'),
            webgl2: !!document.createElement('canvas').getContext('webgl2'),
            offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
            imageCapture: 'ImageCapture' in window,
            faceDetection: 'FaceDetector' in window
        };
        
        return true;
    }
    
    checkAPISupport(apiPath) {
        const parts = apiPath.split('.');
        let current = window;
        
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return false;
            }
        }
        
        return typeof current !== 'undefined';
    }
    
    /**
     * Get optimal camera constraints based on device and configuration
     */
    getOptimalConstraints() {
        const config = window.ProPostureConfig;
        const deviceInfo = config.getDeviceInfo();
        const cameraConfig = config.get('camera');
        
        // Base constraints
        const constraints = {
            video: {
                width: { ideal: cameraConfig.resolution.width },
                height: { ideal: cameraConfig.resolution.height },
                frameRate: { ideal: cameraConfig.frameRate },
                facingMode: cameraConfig.facingMode,
                autoGainControl: cameraConfig.autoGainControl,
                echoCancellation: cameraConfig.echoCancellation,
                noiseSuppression: cameraConfig.noiseSuppression,
            },
            audio: false
        };
        
        // Device-specific optimizations
        if (deviceInfo.isMobile) {
            constraints.video.width = { ideal: 640 };
            constraints.video.height = { ideal: 480 };
            constraints.video.frameRate = { ideal: 24 };
        }
        
        if (deviceInfo.isLowEnd) {
            constraints.video.width = { ideal: 320 };
            constraints.video.height = { ideal: 240 };
            constraints.video.frameRate = { ideal: 15 };
        }
        
        // Add advanced constraints if supported
        if (navigator.mediaDevices.getSupportedConstraints) {
            const supported = navigator.mediaDevices.getSupportedConstraints();
            
            if (supported.brightness) {
                constraints.video.brightness = { ideal: 0 };
            }
            if (supported.contrast) {
                constraints.video.contrast = { ideal: 1 };
            }
            if (supported.exposureMode) {
                constraints.video.exposureMode = 'continuous';
            }
            if (supported.focusMode) {
                constraints.video.focusMode = 'continuous';
            }
        }
        
        return constraints;
    }
    
    /**
     * Request camera access with retry logic
     */
    async requestCameraWithRetry(constraints, attempt = 1) {
        try {
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Validate stream
            const videoTracks = stream.getVideoTracks();
            if (videoTracks.length === 0) {
                throw new Error('No video tracks available');
            }
            
            // Log track capabilities
            const track = videoTracks[0];
            const _capabilities = track.getCapabilities ? track.getCapabilities() : {};
            const _settings = track.getSettings ? track.getSettings() : {};
            
            
            return stream;
            
        } catch (error) {
            console.warn(`⚠️ Camera request attempt ${attempt} failed:`, error.message);
            
            if (attempt < this.maxRetries) {
                // Try with fallback constraints
                const fallbackConstraints = this.getFallbackConstraints(constraints, error);
                
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.requestCameraWithRetry(fallbackConstraints, attempt + 1);
            } else {
                throw new Error(`Camera access failed after ${this.maxRetries} attempts: ${error.message}`);
            }
        }
    }
    
    /**
     * Get fallback constraints for retry attempts
     */
    getFallbackConstraints(originalConstraints, error) {
        const fallback = { ...originalConstraints };
        
        // Common fallback strategies
        if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
            // Relax resolution constraints
            fallback.video.width = 640;
            fallback.video.height = 480;
            fallback.video.frameRate = 30;
            
            // Remove advanced constraints
            delete fallback.video.autoGainControl;
            delete fallback.video.brightness;
            delete fallback.video.contrast;
            delete fallback.video.exposureMode;
            delete fallback.video.focusMode;
        }
        
        if (error.name === 'NotFoundError') {
            // Try any available camera
            fallback.video.facingMode = undefined;
        }
        
        if (error.name === 'NotAllowedError') {
            // User denied permission - can't retry
            throw error;
        }
        
        return fallback;
    }
    
    /**
     * Setup video element
     */
    setupVideoElement() {
        this.videoElement = document.getElementById('videoElement');
        
        if (!this.videoElement) {
            throw new Error('Video element not found');
        }
        
        // Configure video element
        this.videoElement.srcObject = this.stream;
        this.videoElement.autoplay = true;
        this.videoElement.muted = true;
        this.videoElement.playsInline = true;
        
        // Wait for video to be ready
        return new Promise((resolve, reject) => {
            this.videoElement.onloadedmetadata = () => {
                this.performanceMetrics.resolution = {
                    width: this.videoElement.videoWidth,
                    height: this.videoElement.videoHeight
                };
                resolve();
            };
            
            this.videoElement.onerror = reject;
            
            // Timeout after 10 seconds
            setTimeout(() => reject(new Error('Video element load timeout')), 10000);
        });
    }
    
    /**
     * Initialize canvas for frame processing
     */
    initializeCanvas() {
        this.canvas = document.getElementById('outputCanvas');
        
        if (!this.canvas) {
            throw new Error('Output canvas not found');
        }
        
        this.context = this.canvas.getContext('2d');
        
        // Set canvas size to match video
        this.canvas.width = this.performanceMetrics.resolution.width;
        this.canvas.height = this.performanceMetrics.resolution.height;
        
        // Optimize canvas for performance
        this.context.imageSmoothingEnabled = false;
        this.context.imageSmoothingQuality = 'low';
    }
    
    /**
     * Start frame processing loop
     */
    startFrameProcessing() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        const processFrame = (currentTime) => {
            if (!this.isStreaming) {return;}
            
            try {
                // Calculate frame rate
                if (this.lastFrameTime) {
                    const deltaTime = currentTime - this.lastFrameTime;
                    this.performanceMetrics.frameRate = 1000 / deltaTime;
                }
                this.lastFrameTime = currentTime;
                
                // Capture frame
                const imageData = this.captureFrame();
                
                if (imageData) {
                    // Add to buffer
                    this.addToFrameBuffer(imageData);
                    
                    // Notify callbacks
                    this.notifyFrameCallbacks(imageData);
                }
                
            } catch (error) {
                console.error('Frame processing error:', error);
                this.performanceMetrics.droppedFrames++;
            }
            
            // Schedule next frame
            this.animationFrameId = requestAnimationFrame(processFrame);
        };
        
        this.animationFrameId = requestAnimationFrame(processFrame);
    }
    
    /**
     * Capture current frame from video
     */
    captureFrame() {
        if (!this.videoElement || !this.context) {return null;}
        
        try {
            const { width, height } = this.performanceMetrics.resolution;
            
            // Draw video frame to canvas
            this.context.drawImage(this.videoElement, 0, 0, width, height);
            
            // Get image data
            return this.context.getImageData(0, 0, width, height);
            
        } catch (error) {
            console.error('Frame capture error:', error);
            return null;
        }
    }
    
    /**
     * Add frame to buffer for processing
     */
    addToFrameBuffer(imageData) {
        this.frameBuffer.push({
            data: imageData,
            timestamp: performance.now()
        });
        
        // Maintain buffer size
        if (this.frameBuffer.length > this.maxBufferSize) {
            this.frameBuffer.shift();
        }
    }
    
    /**
     * Get latest frame from buffer
     */
    getLatestFrame() {
        return this.frameBuffer.length > 0 ? this.frameBuffer[this.frameBuffer.length - 1] : null;
    }
    
    /**
     * Add frame callback
     */
    addFrameCallback(callback) {
        this.frameCallbacks.push(callback);
    }
    
    /**
     * Remove frame callback
     */
    removeFrameCallback(callback) {
        const index = this.frameCallbacks.indexOf(callback);
        if (index > -1) {
            this.frameCallbacks.splice(index, 1);
        }
    }
    
    /**
     * Notify all frame callbacks
     */
    notifyFrameCallbacks(imageData) {
        for (const callback of this.frameCallbacks) {
            try {
                callback(imageData);
            } catch (error) {
                console.error('Frame callback error:', error);
            }
        }
    }
    
    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor stream health
        setInterval(() => {
            if (this.stream) {
                const videoTracks = this.stream.getVideoTracks();
                if (videoTracks.length > 0) {
                    const track = videoTracks[0];
                    
                    // Check track state
                    if (track.readyState !== 'live') {
                        console.warn('⚠️ Video track not live:', track.readyState);
                        this.handleStreamError();
                    }
                    
                    // Get track stats if available
                    if (track.getStats) {
                        track.getStats().then(stats => {
                            // Process track statistics
                            this.updateTrackStats(stats);
                        });
                    }
                }
            }
        }, 5000);
        
        // Memory monitoring
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > 100 * 1024 * 1024) { // 100MB
                    console.warn('⚠️ High memory usage:', memory.usedJSHeapSize);
                    this.optimizeMemoryUsage();
                }
            }, 10000);
        }
    }
    
    /**
     * Update track statistics
     */
    updateTrackStats(stats) {
        // Process WebRTC statistics
        for (const [_id, stat] of stats) {
            if (stat.type === 'track') {
                this.performanceMetrics.bandwidth = stat.totalSamplesSent || 0;
                this.performanceMetrics.droppedFrames = stat.droppedSamplesDuration || 0;
            }
        }
    }
    
    /**
     * Optimize memory usage
     */
    optimizeMemoryUsage() {
        // Clear frame buffer
        this.frameBuffer = [];
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
    }
    
    /**
     * Handle camera/stream errors
     */
    handleCameraError(error) {
        this.errorCount++;
        
        const errorInfo = {
            name: error.name,
            message: error.message,
            count: this.errorCount,
            timestamp: Date.now()
        };
        
        // Dispatch error event
        this.dispatchEvent('camera-error', errorInfo);
        
        // Provide user-friendly error messages
        let userMessage = 'Camera error occurred';
        
        switch (error.name) {
            case 'NotAllowedError':
                userMessage = 'Camera access denied. Please allow camera permissions and refresh.';
                break;
            case 'NotFoundError':
                userMessage = 'No camera found. Please connect a camera and try again.';
                break;
            case 'NotReadableError':
                userMessage = 'Camera is being used by another application.';
                break;
            case 'OverconstrainedError':
                userMessage = 'Camera settings not supported. Trying with different settings.';
                break;
            case 'SecurityError':
                userMessage = 'Camera access blocked due to security settings.';
                break;
            default:
                userMessage = `Camera error: ${error.message}`;
        }
        
        // Show user notification
        this.showErrorNotification(userMessage);
    }
    
    /**
     * Handle stream errors
     */
    handleStreamError() {
        console.warn('⚠️ Stream error detected, attempting recovery...');
        
        // Attempt to recover
        setTimeout(() => {
            if (this.errorCount < this.maxRetries) {
                this.reinitializeCamera();
            } else {
                this.showErrorNotification('Camera connection lost. Please refresh the page.');
            }
        }, this.retryDelay);
    }
    
    /**
     * Reinitialize camera
     */
    async reinitializeCamera() {
        try {
            this.stop();
            await this.initializeCamera();
        } catch (error) {
            console.error('❌ Camera reinitialization failed:', error);
            this.handleCameraError(error);
        }
    }
    
    /**
     * Show error notification to user
     */
    showErrorNotification(message) {
        // Create or update error notification
        let notification = document.getElementById('camera-error-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'camera-error-notification';
            notification.className = 'error-notification';
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.style.display = 'block';
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (notification) {
                notification.style.display = 'none';
            }
        }, 10000);
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Network changes
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                this.handleNetworkChange();
            });
        }
    }
    
    /**
     * Pause camera streaming
     */
    pause() {
        this.isStreaming = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    /**
     * Resume camera streaming
     */
    resume() {
        if (this.isInitialized && !this.isStreaming) {
            this.isStreaming = true;
            this.startFrameProcessing();
        }
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Adjust canvas size if needed
        if (this.canvas && this.videoElement) {
            // Keep aspect ratio
            const aspectRatio = this.videoElement.videoWidth / this.videoElement.videoHeight;
            const containerWidth = this.canvas.parentElement.clientWidth;
            const containerHeight = this.canvas.parentElement.clientHeight;
            
            if (containerWidth / containerHeight > aspectRatio) {
                this.canvas.style.height = '100%';
                this.canvas.style.width = 'auto';
            } else {
                this.canvas.style.width = '100%';
                this.canvas.style.height = 'auto';
            }
        }
    }
    
    /**
     * Handle network changes
     */
    handleNetworkChange() {
        const connection = navigator.connection;
        
        // Adjust quality based on network
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            // Reduce frame rate for slow connections
            window.ProPostureConfig.set('camera.frameRate', 15);
        } else if (connection.effectiveType === '4g') {
            // Increase quality for fast connections
            window.ProPostureConfig.set('camera.frameRate', 30);
        }
    }
    
    /**
     * Take screenshot
     */
    takeScreenshot() {
        if (!this.canvas) {return null;}
        
        try {
            // Create download link
            const link = document.createElement('a');
            link.download = `posture_screenshot_${Date.now()}.png`;
            link.href = this.canvas.toDataURL('image/png');
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return link.href;
            
        } catch (error) {
            console.error('Screenshot error:', error);
            return null;
        }
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }
    
    /**
     * Stop camera and cleanup
     */
    stop() {
        
        this.isStreaming = false;
        this.isInitialized = false;
        
        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Stop media stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
            });
            this.stream = null;
        }
        
        // Clear video element
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
        
        // Clear callbacks
        this.frameCallbacks = [];
        
        // Clear buffers
        this.frameBuffer = [];
        
    }
    
    /**
     * Dispatch custom event
     */
    dispatchEvent(type, data) {
        window.dispatchEvent(new CustomEvent(`camera-${type}`, {
            detail: data
        }));
    }
}

// Export camera manager
window.CameraManager = CameraManager;
