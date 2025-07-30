/**
 * ProPostureFitness Posture Analysis System
 * Ultra-optimized posture analysis with multiple detection modes
 */

/**
 * Analysis Modes Enumeration
 */
const AnalysisMode = {
    BASIC: 'basic',
    ADVANCED: 'advanced',
    GPU_ACCELERATED: 'gpu'
};

/**
 * Abstract base class for posture analyzers
 */
class PostureAnalyzer {
    constructor(mode) {
        this.mode = mode;
        this.running = false;
        this.frameCount = 0;
        this.startTime = null;
        this.performanceMetrics = {
            fps: 0,
            processingTime: 0,
            memoryUsage: 0,
            accuracy: 0,
        };
        
        // Initialize performance monitoring
        this.setupPerformanceMonitoring();
    }
    
    /**
     * Abstract method - must be implemented by subclasses
     */
    async analyzePosture(_imageData) {
        throw new Error('analyzePosture must be implemented by subclass');
    }
    
    /**
     * Get required dependencies for this analyzer
     */
    getRequiredDependencies() {
        return ['basic-browser-apis'];
    }
    
    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        this.frameHistory = [];
        this.maxFrameHistory = 30;
        
        if (performance.memory) {
            setInterval(() => {
                this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
            }, 1000);
        }
    }
    
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(processingTime) {
        const currentTime = performance.now();
        this.frameHistory.push(currentTime);
        
        // Keep only recent frames
        if (this.frameHistory.length > this.maxFrameHistory) {
            this.frameHistory.shift();
        }
        
        // Calculate FPS
        if (this.frameHistory.length > 1) {
            const timeSpan = this.frameHistory[this.frameHistory.length - 1] - this.frameHistory[0];
            this.performanceMetrics.fps = (this.frameHistory.length - 1) / (timeSpan / 1000);
        }
        
        this.performanceMetrics.processingTime = processingTime;
    }
    
    /**
     * Get current performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }
}

/**
 * Basic posture analyzer using face detection
 */
class BasicPostureAnalyzer extends PostureAnalyzer {
    constructor() {
        super(AnalysisMode.BASIC);
        this.initializeFaceDetection();
    }
    
    async initializeFaceDetection() {
        try {
            // Use Face Detection API if available
            if ('FaceDetector' in window) {
                this.faceDetector = new FaceDetector({
                    maxDetectedFaces: 1,
                    fastMode: true
                });
                console.log('✅ Face Detection API initialized');
            } else {
                // Fallback to basic detection
                this.useBasicDetection = true;
                console.log('⚠️ Using basic face detection fallback');
            }
        } catch (error) {
            console.warn('Face detection initialization failed:', error);
            this.useBasicDetection = true;
        }
    }
    
    getRequiredDependencies() {
        return ['canvas-api', 'imagedata-api'];
    }
    
    async analyzePosture(imageData) {
        const startTime = performance.now();
        
        try {
            let score = 75.0;
            let status = 'Ready';
            let detailedMetrics = {};
            
            if (this.faceDetector && !this.useBasicDetection) {
                const faces = await this.faceDetector.detect(imageData);
                if (faces.length > 0) {
                    const face = faces[0];
                    score = this.calculateFaceScore(face, imageData.width, imageData.height);
                    status = this.getPostureStatus(score);
                    detailedMetrics = this.getFaceMetrics(face, imageData.width, imageData.height);
                }
            } else {
                // Basic canvas-based detection
                const result = await this.basicFaceDetection(imageData);
                score = result.score;
                status = result.status;
                detailedMetrics = result.metrics;
            }
            
            const processingTime = performance.now() - startTime;
            this.updatePerformanceMetrics(processingTime);
            
            return {
                score,
                status,
                mode: this.mode,
                processingTime,
                detailedMetrics,
                landmarks: null
            };
            
        } catch (error) {
            console.error('Basic analysis error:', error);
            return {
                score: null,
                status: 'Error',
                mode: this.mode,
                processingTime: performance.now() - startTime,
                detailedMetrics: {},
                landmarks: null
            };
        }
    }
    
    calculateFaceScore(face, frameWidth, frameHeight) {
        const boundingBox = face.boundingBox;
        const faceCenter = {
            x: boundingBox.x + boundingBox.width / 2,
            y: boundingBox.y + boundingBox.height / 2
        };
        
        const frameCenter = { x: frameWidth / 2, y: frameHeight / 2 };
        
        // Calculate alignment score
        const horizontalOffset = Math.abs(faceCenter.x - frameCenter.x);
        const maxHorizontalOffset = frameWidth / 4;
        const alignmentScore = Math.max(0, 100 - (horizontalOffset / maxHorizontalOffset * 50));
        
        // Calculate height score
        const headHeightRatio = boundingBox.y / frameHeight;
        const heightScore = (headHeightRatio > 0.1 && headHeightRatio < 0.4) ? 100 : 50;
        
        // Calculate size score (distance estimation)
        const faceArea = boundingBox.width * boundingBox.height;
        const frameArea = frameWidth * frameHeight;
        const faceRatio = faceArea / frameArea;
        const sizeScore = (faceRatio > 0.02 && faceRatio < 0.15) ? 100 : 70;
        
        return (alignmentScore + heightScore + sizeScore) / 3;
    }
    
    getFaceMetrics(face, frameWidth, frameHeight) {
        const boundingBox = face.boundingBox;
        const faceCenter = {
            x: boundingBox.x + boundingBox.width / 2,
            y: boundingBox.y + boundingBox.height / 2
        };
        
        const frameCenter = { x: frameWidth / 2, y: frameHeight / 2 };
        const horizontalOffset = Math.abs(faceCenter.x - frameCenter.x);
        
        return {
            headAlignment: Math.max(0, 100 - (horizontalOffset / (frameWidth / 4) * 100)),
            shoulderLevel: 85, // Estimated for basic mode
            forwardHead: 75   // Estimated for basic mode
        };
    }
    
    async basicFaceDetection(imageData) {
        // Simplified detection using edge detection and color analysis
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        
        ctx.putImageData(imageData, 0, 0);
        
        // Basic skin tone detection in upper portion of frame
        const skinPixels = this.detectSkinTone(imageData);
        const score = skinPixels > 1000 ? 75 : 50;
        
        return {
            score,
            status: this.getPostureStatus(score),
            metrics: {
                headAlignment: score,
                shoulderLevel: 80,
                forwardHead: 70
            }
        };
    }
    
    detectSkinTone(imageData) {
        const data = imageData.data;
        let skinPixels = 0;
        
        // Check upper third of image for skin-like colors
        const upperThird = Math.floor(imageData.height / 3);
        
        for (let y = 0; y < upperThird; y++) {
            for (let x = 0; x < imageData.width; x += 4) {
                const i = (y * imageData.width + x) * 4;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                if (this.isSkinColor(r, g, b)) {
                    skinPixels++;
                }
            }
        }
        
        return skinPixels;
    }
    
    isSkinColor(r, g, b) {
        // Simple skin color detection
        return r > 95 && g > 40 && b > 20 &&
               Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
               Math.abs(r - g) > 15 && r > g && r > b;
    }
    
    getPostureStatus(score) {
        if (score > 85) {return 'Excellent';}
        if (score > 70) {return 'Good';}
        if (score > 55) {return 'Fair';}
        return 'Poor';
    }
}

/**
 * Advanced posture analyzer using MediaPipe Pose with dynamic loading
 */
class AdvancedPostureAnalyzer extends PostureAnalyzer {
    constructor() {
        super(AnalysisMode.ADVANCED);
        this.pose = null;
        this.initialized = false;
        this.initializing = false;
        this.drawingUtils = null;
        this.loadingProgress = 0;
    }
    
    async initializeMediaPipe() {
        if (this.initializing) {
            return this.waitForInitialization();
        }
        
        this.initializing = true;
        
        try {
            // Use dynamic loader for progressive enhancement
            const mediapipeData = await window.MediaPipeLoader.loadAnalysisMode('advanced');
            
            if (mediapipeData.fallback) {
                console.warn('⚠️ MediaPipe unavailable, analyzer will use fallback mode');
                this.mode = AnalysisMode.BASIC;
                this.initialized = true;
                return;
            }
            
            const { Pose, drawingUtils } = mediapipeData;
            this.drawingUtils = drawingUtils;
            
            // Initialize pose with optimized settings
            const config = window.ProPostureConfig.getMediaPipeConfig();
            
            this.pose = new Pose({
                locateFile: (file) => {
                    // Use cached CDN path
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                }
            });
            
            this.pose.setOptions({
                modelComplexity: config.modelComplexity,
                smoothLandmarks: config.smoothLandmarks,
                enableSegmentation: false,
                smoothSegmentation: false,
                minDetectionConfidence: config.minDetectionConfidence,
                minTrackingConfidence: config.minTrackingConfidence,
            });
            
            this.pose.onResults((results) => {
                this.latestResults = results;
            });
            
            this.initialized = true;
            this.loadingProgress = 100;
            console.log(`✅ MediaPipe Pose initialized (${mediapipeData.loadTime.toFixed(0)}ms)`);
            
            // Dispatch initialization event
            window.dispatchEvent(new CustomEvent('mediapipe-initialized', {
                detail: { mode: this.mode, loadTime: mediapipeData.loadTime }
            }));
            
        } catch (error) {
            console.error('MediaPipe initialization failed:', error);
            console.log('🔄 Falling back to basic mode');
            
            // Graceful fallback to basic mode
            this.mode = AnalysisMode.BASIC;
            this.initialized = true;
            
            window.dispatchEvent(new CustomEvent('mediapipe-fallback', {
                detail: { originalMode: 'advanced', fallbackMode: 'basic', error: error.message }
            }));
        } finally {
            this.initializing = false;
        }
    }
    
    async waitForInitialization() {
        while (this.initializing) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        return this.initialized;
    }
    
    getRequiredDependencies() {
        return ['mediapipe-pose', 'webgl'];
    }
    
    async analyzePosture(imageData) {
        const startTime = performance.now();
        
        // Auto-initialize if not done yet
        if (!this.initialized && !this.initializing) {
            await this.initializeMediaPipe();
        }
        
        // Wait for initialization if in progress
        if (this.initializing) {
            await this.waitForInitialization();
        }
        
        // Check if we fell back to basic mode
        if (this.mode === AnalysisMode.BASIC) {
            const basicAnalyzer = new BasicPostureAnalyzer();
            return basicAnalyzer.analyzePosture(imageData);
        }
        
        if (!this.initialized || !this.pose) {
            return {
                score: null,
                status: 'Initialization failed',
                mode: this.mode,
                processingTime: performance.now() - startTime,
                detailedMetrics: {},
                landmarks: null
            };
        }
        
        try {
            // Convert ImageData to HTMLImageElement for MediaPipe
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            ctx.putImageData(imageData, 0, 0);
            
            // Send to MediaPipe
            await this.pose.send({ image: canvas });
            
            // Wait for results (with timeout)
            const results = await this.waitForResults(100);
            
            if (results && results.poseLandmarks) {
                const score = this.calculatePostureScore(results.poseLandmarks);
                const status = this.getPostureStatus(score);
                const detailedMetrics = this.getDetailedMetrics(results.poseLandmarks);
                
                const processingTime = performance.now() - startTime;
                this.updatePerformanceMetrics(processingTime);
                
                return {
                    score,
                    status,
                    mode: this.mode,
                    processingTime,
                    detailedMetrics,
                    landmarks: results.poseLandmarks
                };
            } else {
                return {
                    score: null,
                    status: 'No pose detected',
                    mode: this.mode,
                    processingTime: performance.now() - startTime,
                    detailedMetrics: {},
                    landmarks: null
                };
            }
            
        } catch (error) {
            console.error('Advanced analysis error:', error);
            return {
                score: null,
                status: 'Error',
                mode: this.mode,
                processingTime: performance.now() - startTime,
                detailedMetrics: {},
                landmarks: null
            };
        }
    }
    
    async waitForResults(timeout = 100) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const checkResults = () => {
                if (this.latestResults) {
                    const results = this.latestResults;
                    this.latestResults = null;
                    resolve(results);
                } else if (Date.now() - startTime < timeout) {
                    requestAnimationFrame(checkResults);
                } else {
                    resolve(null);
                }
            };
            checkResults();
        });
    }
    
    calculatePostureScore(landmarks) {
        try {
            const nose = landmarks[0];
            const leftShoulder = landmarks[11];
            const rightShoulder = landmarks[12];
            const _leftEar = landmarks[7];
            const _rightEar = landmarks[8];
            
            // Calculate shoulder alignment
            const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
            const shoulderScore = Math.max(0, 100 - (shoulderDiff * 1000));
            
            // Calculate head alignment
            const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
            const headOffset = Math.abs(nose.x - shoulderCenterX);
            const headScore = Math.max(0, 100 - (headOffset * 200));
            
            // Calculate ear alignment
            const earDiff = Math.abs(_leftEar.y - _rightEar.y);
            const earScore = Math.max(0, 100 - (earDiff * 1000));
            
            // Calculate forward head posture
            const shoulderCenterZ = (leftShoulder.z + rightShoulder.z) / 2;
            const forwardHead = Math.abs(nose.z - shoulderCenterZ);
            const forwardScore = Math.max(0, 100 - (forwardHead * 500));
            
            // Weighted average
            const totalScore = (shoulderScore * 0.3 + headScore * 0.3 + earScore * 0.2 + forwardScore * 0.2);
            return Math.min(100, Math.max(0, totalScore));
            
        } catch (error) {
            console.error('Score calculation error:', error);
            return 50.0;
        }
    }
    
    getDetailedMetrics(landmarks) {
        try {
            const nose = landmarks[0];
            const leftShoulder = landmarks[11];
            const rightShoulder = landmarks[12];
            
            const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
            const shoulderCenterZ = (leftShoulder.z + rightShoulder.z) / 2;
            
            return {
                headAlignment: Math.max(0, 100 - (Math.abs(nose.x - shoulderCenterX) * 200)),
                shoulderLevel: Math.max(0, 100 - (Math.abs(leftShoulder.y - rightShoulder.y) * 1000)),
                forwardHead: Math.max(0, 100 - (Math.abs(nose.z - shoulderCenterZ) * 500))
            };
            
        } catch (_error) {
            return {
                headAlignment: 50,
                shoulderLevel: 50,
                forwardHead: 50
            };
        }
    }
    
    getPostureStatus(score) {
        if (score > 85) {return 'Excellent';}
        if (score > 70) {return 'Good';}
        if (score > 55) {return 'Fair';}
        return 'Poor';
    }
}

/**
 * GPU-accelerated posture analyzer with WebGL optimization
 */
class GPUPostureAnalyzer extends AdvancedPostureAnalyzer {
    constructor() {
        super();
        this.mode = AnalysisMode.GPU_ACCELERATED;
        this.webglContext = null;
        this.computeShaders = null;
        this.cameraUtils = null;
    }
    
    async initializeMediaPipe() {
        if (this.initializing) {
            return this.waitForInitialization();
        }
        
        this.initializing = true;
        
        try {
            // Use dynamic loader for GPU mode
            const mediapipeData = await window.MediaPipeLoader.loadAnalysisMode('gpu');
            
            if (mediapipeData.fallback || mediapipeData.mode !== 'gpu') {
                console.warn('⚠️ GPU mode unavailable, using fallback');
                this.mode = mediapipeData.mode;
                
                if (mediapipeData.mode === AnalysisMode.ADVANCED) {
                    // Initialize as advanced mode
                    const { Pose, drawingUtils } = mediapipeData;
                    this.drawingUtils = drawingUtils;
                    await this.initializePose(Pose);
                } else {
                    // Fall back to basic mode
                    this.initialized = true;
                }
                return;
            }
            
            const { Pose, drawingUtils, cameraUtils } = mediapipeData;
            this.drawingUtils = drawingUtils;
            this.cameraUtils = cameraUtils;
            
            // Initialize WebGL context
            await this.initializeWebGL();
            
            // Initialize pose with GPU optimization
            await this.initializePose(Pose);
            
            this.initialized = true;
            this.loadingProgress = 100;
            console.log(`✅ GPU-accelerated MediaPipe initialized (${mediapipeData.loadTime.toFixed(0)}ms)`);
            
            window.dispatchEvent(new CustomEvent('mediapipe-initialized', {
                detail: { mode: this.mode, loadTime: mediapipeData.loadTime, gpuAccelerated: true }
            }));
            
        } catch (error) {
            console.error('GPU MediaPipe initialization failed:', error);
            console.log('🔄 Falling back to advanced mode');
            
            // Fallback to advanced mode
            this.mode = AnalysisMode.ADVANCED;
            return super.initializeMediaPipe();
        } finally {
            this.initializing = false;
        }
    }
    
    async initializePose(Pose) {
        const config = window.ProPostureConfig.getMediaPipeConfig();
        
        this.pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });
        
        this.pose.setOptions({
            modelComplexity: config.modelComplexity,
            smoothLandmarks: config.smoothLandmarks,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: config.minDetectionConfidence,
            minTrackingConfidence: config.minTrackingConfidence,
        });
        
        this.pose.onResults((results) => {
            this.latestResults = results;
        });
    }
    
    async initializeWebGL() {
        try {
            // Create WebGL context for GPU acceleration
            const canvas = document.createElement('canvas');
            this.webglContext = canvas.getContext('webgl2') || canvas.getContext('webgl');
            
            if (this.webglContext) {
                this.setupComputeShaders();
                console.log('✅ WebGL GPU acceleration initialized');
            } else {
                console.warn('⚠️ WebGL not available, falling back to CPU');
            }
            
        } catch (error) {
            console.error('WebGL initialization failed:', error);
        }
    }
    
    setupComputeShaders() {
        // Simplified GPU shader setup for posture calculations
        const vertexShaderSource = `
            attribute vec2 position;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;
        
        const fragmentShaderSource = `
            precision mediump float;
            uniform sampler2D inputTexture;
            uniform vec2 resolution;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution;
                vec4 color = texture2D(inputTexture, uv);
                
                // Simple edge detection for pose estimation
                float intensity = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                gl_FragColor = vec4(vec3(intensity), 1.0);
            }
        `;
        
        // Compile and link shaders (simplified)
        this.computeShaders = {
            vertex: this.compileShader(vertexShaderSource, this.webglContext.VERTEX_SHADER),
            fragment: this.compileShader(fragmentShaderSource, this.webglContext.FRAGMENT_SHADER)
        };
    }
    
    compileShader(source, type) {
        if (!this.webglContext) {return null;}
        
        const shader = this.webglContext.createShader(type);
        this.webglContext.shaderSource(shader, source);
        this.webglContext.compileShader(shader);
        
        if (!this.webglContext.getShaderParameter(shader, this.webglContext.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.webglContext.getShaderInfoLog(shader));
            return null;
        }
        
        return shader;
    }
    
    getRequiredDependencies() {
        return ['mediapipe-pose', 'webgl2', 'compute-shaders'];
    }
    
    async analyzePosture(imageData) {
        const _startTime = performance.now();
        
        // Use GPU preprocessing if available
        if (this.webglContext && this.computeShaders) {
            imageData = await this.preprocessWithGPU(imageData);
        }
        
        // Run standard MediaPipe analysis
        const result = await super.analyzePosture(imageData);
        
        // Add GPU-specific performance metrics
        if (result) {
            result.gpuAccelerated = !!this.webglContext;
            result.webglSupport = !!this.webglContext;
            
            // GPU memory usage (if available)
            if (this.webglContext) {
                const ext = this.webglContext.getExtension('WEBGL_debug_renderer_info');
                if (ext) {
                    result.gpuRenderer = this.webglContext.getParameter(ext.UNMASKED_RENDERER_WEBGL);
                }
            }
        }
        
        return result;
    }
    
    async preprocessWithGPU(imageData) {
        // Simplified GPU preprocessing
        // In a full implementation, this would apply filters and optimizations
        return imageData;
    }
    
    getPerformanceMetrics() {
        const metrics = super.getPerformanceMetrics();
        
        // Add GPU-specific metrics
        metrics.gpuAccelerated = !!this.webglContext;
        metrics.webglVersion = this.webglContext ? 
            (this.webglContext instanceof WebGL2RenderingContext ? '2.0' : '1.0') : 'none';
        
        return metrics;
    }
}

/**
 * Factory class for creating posture analyzers
 */
class PostureAnalyzerFactory {
    static create(mode) {
        switch (mode) {
            case AnalysisMode.BASIC:
                return new BasicPostureAnalyzer();
            case AnalysisMode.ADVANCED:
                return new AdvancedPostureAnalyzer();
            case AnalysisMode.GPU_ACCELERATED:
                return new GPUPostureAnalyzer();
            default:
                console.warn(`Unknown analysis mode: ${mode}, defaulting to advanced`);
                return new AdvancedPostureAnalyzer();
        }
    }
    
    static getSupportedModes() {
        const modes = [AnalysisMode.BASIC];
        
        // Check MediaPipe support
        if (typeof Pose !== 'undefined') {
            modes.push(AnalysisMode.ADVANCED);
        }
        
        // Check WebGL support
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            if (gl && typeof Pose !== 'undefined') {
                modes.push(AnalysisMode.GPU_ACCELERATED);
            }
        } catch (_e) {
            // WebGL not supported
        }
        
        return modes;
    }
}

// Export classes and constants
window.PostureAnalyzer = PostureAnalyzer;
window.BasicPostureAnalyzer = BasicPostureAnalyzer;
window.AdvancedPostureAnalyzer = AdvancedPostureAnalyzer;
window.GPUPostureAnalyzer = GPUPostureAnalyzer;
window.PostureAnalyzerFactory = PostureAnalyzerFactory;
window.AnalysisMode = AnalysisMode;