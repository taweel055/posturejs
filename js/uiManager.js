/**
 * ProPostureFitness UI Management System
 * Ultra-optimized UI handling with state management and animations
 */

class UIManager {
    constructor() {
        this.elements = {};
        this.state = {
            isAnalyzing: false,
            currentMode: 'advanced',
            showPerformance: true,
            lastScore: null,
            sessionStartTime: null,
            frameCount: 0
        };
        
        this.loadingTimeout = null;
        
        // Animation and performance
        this.animationQueue = [];
        this.isAnimating = false;
        this.updateThrottle = 16; // ~60fps
        this.lastUpdate = 0;
        
        // Event listeners
        this.eventListeners = new Map();
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.initializeAnimations();
    }
    
    /**
     * Initialize UI elements
     */
    initializeElements() {
        // Cache commonly used elements
        this.elements = {
            // Header elements
            timestamp: document.getElementById('timestamp'),
            
            // Control elements
            analysisMode: document.getElementById('analysisMode'),
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            screenshotBtn: document.getElementById('screenshotBtn'),
            settingsBtn: document.getElementById('settingsBtn'),
            
            // Video elements
            videoElement: document.getElementById('videoElement'),
            outputCanvas: document.getElementById('outputCanvas'),
            statusOverlay: document.getElementById('statusOverlay'),
            
            // Status displays
            fpsDisplay: document.getElementById('fpsDisplay'),
            scoreDisplay: document.getElementById('scoreDisplay'),
            postureStatus: document.getElementById('postureStatus'),
            
            // Metrics elements
            mainScore: document.getElementById('mainScore'),
            scoreCircle: document.getElementById('scoreCircle'),
            processingTime: document.getElementById('processingTime'),
            frameCount: document.getElementById('frameCount'),
            sessionDuration: document.getElementById('sessionDuration'),
            
            // Detailed metrics
            headAlignment: document.getElementById('headAlignment'),
            shoulderLevel: document.getElementById('shoulderLevel'),
            forwardHead: document.getElementById('forwardHead'),
            
            // Modal elements
            settingsModal: document.getElementById('settingsModal'),
            closeSettings: document.getElementById('closeSettings'),
            loadingScreen: document.getElementById('loadingScreen'),
            loadingStatus: document.getElementById('loadingStatus'),
            
            // Settings elements
            cameraResolution: document.getElementById('cameraResolution'),
            detectionConfidence: document.getElementById('detectionConfidence'),
            confidenceValue: document.getElementById('confidenceValue'),
            showPerformance: document.getElementById('showPerformance'),
            autoScreenshot: document.getElementById('autoScreenshot'),
            saveSettings: document.getElementById('saveSettings'),
            resetSettings: document.getElementById('resetSettings')
        };
        
        // Validate critical elements
        const critical = ['startBtn', 'stopBtn', 'videoElement', 'outputCanvas'];
        for (const elementId of critical) {
            if (!this.elements[elementId]) {
                console.error(`Critical UI element missing: ${elementId}`);
            }
        }
        
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Control buttons
        this.elements.startBtn?.addEventListener('click', () => this.handleStartAnalysis());
        this.elements.stopBtn?.addEventListener('click', () => this.handleStopAnalysis());
        this.elements.screenshotBtn?.addEventListener('click', () => this.handleTakeScreenshot());
        this.elements.settingsBtn?.addEventListener('click', () => this.showSettingsModal());
        
        // Settings modal
        this.elements.closeSettings?.addEventListener('click', () => this.hideSettingsModal());
        this.elements.saveSettings?.addEventListener('click', () => this.saveSettings());
        this.elements.resetSettings?.addEventListener('click', () => this.resetSettings());
        
        // Analysis mode change
        this.elements.analysisMode?.addEventListener('change', (e) => {
            this.handleModeChange(e.target.value);
        });
        
        // Settings inputs
        this.elements.detectionConfidence?.addEventListener('input', (e) => {
            if (this.elements.confidenceValue) {
                this.elements.confidenceValue.textContent = e.target.value;
            }
        });
        
        // Modal click outside to close
        this.elements.settingsModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.hideSettingsModal();
            }
        });
        
        // Custom application events
        window.addEventListener('camera-initialized', (e) => this.handleCameraInitialized(e));
        window.addEventListener('mediapipe-initialized', (e) => this.handleMediaPipeInitialized(e));
        window.addEventListener('camera-error', (e) => this.handleCameraError(e));
        window.addEventListener('analysis-result', (e) => this.handleAnalysisResult(e));
        window.addEventListener('config-changed', (e) => this.handleConfigChanged(e));
        
        // Browser events
        window.addEventListener('beforeunload', () => this.handlePageUnload());
        window.addEventListener('resize', () => this.handleResize());
        
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch (e.key.toLowerCase()) {
                case ' ': // Space - Screenshot
                    e.preventDefault();
                    this.handleTakeScreenshot();
                    break;
                    
                case 's': // S - Start/Stop
                    e.preventDefault();
                    if (this.state.isAnalyzing) {
                        this.handleStopAnalysis();
                    } else {
                        this.handleStartAnalysis();
                    }
                    break;
                    
                case 'h': // H - Help
                    e.preventDefault();
                    this.showHelpModal();
                    break;
                    
                case 'escape': // Esc - Close modals
                    this.hideAllModals();
                    break;
                    
                case 'p': // P - Toggle performance overlay
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.togglePerformanceOverlay();
                    }
                    break;
            }
        });
    }
    
    /**
     * Initialize animations
     */
    initializeAnimations() {
        // Score circle animation
        this.setupScoreAnimation();
        
        // Timestamp update
        this.startTimestampUpdate();
        
        // Session duration update
        this.startSessionTimer();
        
    }
    
    /**
     * Setup score circle animation
     */
    setupScoreAnimation() {
        if (!this.elements.scoreCircle) {return;}
        
        // Initialize CSS custom property
        this.elements.scoreCircle.style.setProperty('--score-percentage', '0%');
    }
    
    /**
     * Start timestamp updates
     */
    startTimestampUpdate() {
        const updateTimestamp = () => {
            if (this.elements.timestamp) {
                const now = new Date();
                this.elements.timestamp.textContent = now.toLocaleTimeString();
            }
        };
        
        updateTimestamp();
        setInterval(updateTimestamp, 1000);
    }
    
    /**
     * Start session timer
     */
    startSessionTimer() {
        setInterval(() => {
            if (this.state.sessionStartTime && this.elements.sessionDuration) {
                const elapsed = Date.now() - this.state.sessionStartTime;
                const minutes = Math.floor(elapsed / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                this.elements.sessionDuration.textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    /**
     * Handle start analysis
     */
    async handleStartAnalysis() {
        try {
            this.showLoadingScreen('Initializing camera and pose detection...');
            
            // Update UI state
            this.setState({
                isAnalyzing: true,
                sessionStartTime: Date.now(),
                frameCount: 0
            });
            
            // Update buttons
            this.elements.startBtn.disabled = true;
            this.elements.stopBtn.disabled = false;
            this.elements.screenshotBtn.disabled = false;
            
            // Dispatch start event
            window.dispatchEvent(new CustomEvent('ui-start-analysis', {
                detail: { mode: this.state.currentMode }
            }));
            
            // Hide loading screen after a delay (fallback mechanism)
            this.loadingTimeout = setTimeout(() => {
                this.hideLoadingScreen();
            }, 2000);
            
        } catch (error) {
            console.error('Start analysis error:', error);
            this.showErrorMessage('Failed to start analysis');
            this.resetUIState();
        }
    }
    
    /**
     * Handle stop analysis
     */
    handleStopAnalysis() {
        // Update UI state
        this.setState({
            isAnalyzing: false,
            sessionStartTime: null
        });
        
        // Update buttons
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        this.elements.screenshotBtn.disabled = true;
        
        // Reset displays
        this.updateStatusDisplay(0, 'Stopped');
        this.updateScoreDisplay(null);
        
        // Dispatch stop event
        window.dispatchEvent(new CustomEvent('ui-stop-analysis'));
        
    }
    
    /**
     * Handle take screenshot
     */
    handleTakeScreenshot() {
        if (!this.state.isAnalyzing) {return;}
        
        // Add visual feedback
        this.addScreenshotFlash();
        
        // Dispatch screenshot event
        window.dispatchEvent(new CustomEvent('ui-take-screenshot'));
        
        // Show notification
        this.showNotification('📸 Screenshot saved!', 'success');
    }
    
    /**
     * Add screenshot flash effect
     */
    addScreenshotFlash() {
        const flash = document.createElement('div');
        flash.className = 'screenshot-flash';
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            z-index: 9999;
            opacity: 0.8;
            pointer-events: none;
            animation: flash 0.2s ease-out;
        `;
        
        document.body.appendChild(flash);
        
        setTimeout(() => {
            document.body.removeChild(flash);
        }, 200);
    }
    
    /**
     * Handle mode change
     */
    handleModeChange(mode) {
        this.setState({ currentMode: mode });
        
        // Show mode-specific UI elements
        this.updateModeSpecificUI(mode);
        
        // Dispatch mode change event
        window.dispatchEvent(new CustomEvent('ui-mode-changed', {
            detail: { mode }
        }));
        
    }
    
    /**
     * Update mode-specific UI elements
     */
    updateModeSpecificUI(mode) {
        // Show/hide GPU-specific controls
        const gpuControls = document.querySelectorAll('.gpu-only');
        gpuControls.forEach(element => {
            element.style.display = mode === 'gpu' ? 'block' : 'none';
        });
        
        // Update performance overlay based on mode
        if (mode === 'basic') {
            this.hidePerformanceOverlay();
        } else {
            this.showPerformanceOverlay();
        }
    }
    
    /**
     * Show settings modal
     */
    showSettingsModal() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.classList.add('active');
            this.loadCurrentSettings();
        }
    }
    
    /**
     * Hide settings modal
     */
    hideSettingsModal() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.classList.remove('active');
        }
    }
    
    /**
     * Load current settings into modal
     */
    loadCurrentSettings() {
        const config = window.ProPostureConfig;
        
        if (this.elements.cameraResolution) {
            const resolution = config.get('camera.resolution');
            this.elements.cameraResolution.value = `${resolution.width}x${resolution.height}`;
        }
        
        if (this.elements.detectionConfidence) {
            this.elements.detectionConfidence.value = config.get('analysis.detectionConfidence');
            if (this.elements.confidenceValue) {
                this.elements.confidenceValue.textContent = config.get('analysis.detectionConfidence');
            }
        }
        
        if (this.elements.showPerformance) {
            this.elements.showPerformance.checked = config.get('ui.showPerformanceOverlay');
        }
        
        if (this.elements.autoScreenshot) {
            this.elements.autoScreenshot.checked = config.get('analytics.autoSave');
        }
    }
    
    /**
     * Save settings
     */
    saveSettings() {
        const config = window.ProPostureConfig;
        
        try {
            // Camera resolution
            if (this.elements.cameraResolution) {
                const [width, height] = this.elements.cameraResolution.value.split('x').map(Number);
                config.set('camera.resolution', { width, height });
            }
            
            // Detection confidence
            if (this.elements.detectionConfidence) {
                config.set('analysis.detectionConfidence', parseFloat(this.elements.detectionConfidence.value));
            }
            
            // UI settings
            if (this.elements.showPerformance) {
                config.set('ui.showPerformanceOverlay', this.elements.showPerformance.checked);
            }
            
            if (this.elements.autoScreenshot) {
                config.set('analytics.autoSave', this.elements.autoScreenshot.checked);
            }
            
            this.showNotification('⚙️ Settings saved!', 'success');
            this.hideSettingsModal();
            
        } catch (error) {
            console.error('Settings save error:', error);
            this.showNotification('❌ Failed to save settings', 'error');
        }
    }
    
    /**
     * Reset settings to defaults
     */
    resetSettings() {
        if (confirm('Reset all settings to defaults?')) {
            window.ProPostureConfig.reset();
            this.loadCurrentSettings();
            this.showNotification('🔄 Settings reset to defaults', 'info');
        }
    }
    
    /**
     * Show loading screen
     */
    showLoadingScreen(message = 'Loading...') {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.classList.remove('hidden');
            if (this.elements.loadingStatus) {
                this.elements.loadingStatus.textContent = message;
            }
        }
    }
    
    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.classList.add('hidden');
        }
    }
    
    /**
     * Update status display
     */
    updateStatusDisplay(fps, status) {
        if (this.elements.fpsDisplay) {
            this.elements.fpsDisplay.textContent = fps.toFixed(1);
        }
        
        if (this.elements.postureStatus) {
            this.elements.postureStatus.textContent = status;
            
            // Update color based on status
            const colors = {
                'Excellent': '#10b981',
                'Good': '#3b82f6',
                'Fair': '#f59e0b',
                'Poor': '#ef4444',
                'Error': '#ef4444',
                'Stopped': '#64748b'
            };
            
            this.elements.postureStatus.style.color = colors[status] || '#64748b';
        }
    }
    
    /**
     * Update score display
     */
    updateScoreDisplay(score) {
        if (score === null) {
            if (this.elements.scoreDisplay) {
                this.elements.scoreDisplay.textContent = '--';
            }
            if (this.elements.mainScore) {
                this.elements.mainScore.textContent = '--';
            }
            return;
        }
        
        // Update score displays
        if (this.elements.scoreDisplay) {
            this.elements.scoreDisplay.textContent = score.toFixed(0);
        }
        
        if (this.elements.mainScore) {
            this.elements.mainScore.textContent = score.toFixed(0);
        }
        
        // Animate score circle
        this.animateScoreCircle(score);
        
        // Update score color class
        this.updateScoreColorClass(score);
        
        this.state.lastScore = score;
    }
    
    /**
     * Animate score circle
     */
    animateScoreCircle(score) {
        if (!this.elements.scoreCircle) {return;}
        
        const percentage = Math.min(100, Math.max(0, score));
        
        // Animate the conic gradient
        this.elements.scoreCircle.style.setProperty('--score-percentage', `${percentage}%`);
        
        // Add animation class
        this.elements.scoreCircle.classList.add('score-updating');
        
        setTimeout(() => {
            this.elements.scoreCircle.classList.remove('score-updating');
        }, 500);
    }
    
    /**
     * Update score color class
     */
    updateScoreColorClass(score) {
        if (!this.elements.scoreCircle) {return;}
        
        // Remove existing score classes
        this.elements.scoreCircle.classList.remove(
            'score-excellent', 'score-good', 'score-fair', 'score-poor'
        );
        
        // Add appropriate class
        if (score > 85) {
            this.elements.scoreCircle.classList.add('score-excellent');
        } else if (score > 70) {
            this.elements.scoreCircle.classList.add('score-good');
        } else if (score > 55) {
            this.elements.scoreCircle.classList.add('score-fair');
        } else {
            this.elements.scoreCircle.classList.add('score-poor');
        }
    }
    
    /**
     * Update detailed metrics
     */
    updateDetailedMetrics(metrics = {}) {
        const metricElements = {
            headAlignment: this.elements.headAlignment,
            shoulderLevel: this.elements.shoulderLevel,
            forwardHead: this.elements.forwardHead
        };
        
        for (const [key, element] of Object.entries(metricElements)) {
            if (element && metrics[key] !== undefined) {
                element.textContent = `${metrics[key].toFixed(0)}%`;
                
                // Add color coding
                const value = metrics[key];
                if (value > 80) {
                    element.style.color = '#10b981';
                } else if (value > 60) {
                    element.style.color = '#f59e0b';
                } else {
                    element.style.color = '#ef4444';
                }
            }
        }
    }
    
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(metrics = {}) {
        if (this.elements.processingTime && metrics.processingTime) {
            this.elements.processingTime.textContent = `${metrics.processingTime.toFixed(1)}ms`;
        }
        
        if (this.elements.frameCount) {
            this.state.frameCount++;
            this.elements.frameCount.textContent = this.state.frameCount.toString();
        }
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Auto-remove
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    /**
     * Show error message
     */
    showErrorMessage(message) {
        this.showNotification(`❌ ${message}`, 'error', 5000);
    }
    
    /**
     * Toggle performance overlay
     */
    togglePerformanceOverlay() {
        const current = window.ProPostureConfig.get('ui.showPerformanceOverlay');
        window.ProPostureConfig.set('ui.showPerformanceOverlay', !current);
        
        if (!current) {
            this.showPerformanceOverlay();
        } else {
            this.hidePerformanceOverlay();
        }
    }
    
    /**
     * Show performance overlay
     */
    showPerformanceOverlay() {
        if (this.elements.statusOverlay) {
            this.elements.statusOverlay.style.display = 'flex';
        }
    }
    
    /**
     * Hide performance overlay
     */
    hidePerformanceOverlay() {
        if (this.elements.statusOverlay) {
            this.elements.statusOverlay.style.display = 'none';
        }
    }
    
    /**
     * Show help modal
     */
    showHelpModal() {
        // Create help modal if it doesn't exist
        let helpModal = document.getElementById('helpModal');
        
        if (!helpModal) {
            helpModal = document.createElement('div');
            helpModal.id = 'helpModal';
            helpModal.className = 'modal';
            helpModal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>📚 Help & Shortcuts</h3>
                        <button class="close-btn" onclick="this.closest('.modal').classList.remove('active')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <h4>🎮 Keyboard Shortcuts</h4>
                        <ul>
                            <li><kbd>Space</kbd> - Take Screenshot</li>
                            <li><kbd>S</kbd> - Start/Stop Analysis</li>
                            <li><kbd>H</kbd> - Show This Help</li>
                            <li><kbd>Esc</kbd> - Close Modals</li>
                            <li><kbd>Ctrl+P</kbd> - Toggle Performance Overlay</li>
                        </ul>
                        
                        <h4>📊 Analysis Modes</h4>
                        <ul>
                            <li><strong>Basic:</strong> Simple face detection for basic posture assessment</li>
                            <li><strong>Advanced:</strong> MediaPipe pose detection for comprehensive analysis</li>
                            <li><strong>GPU:</strong> WebGL-accelerated processing for maximum performance</li>
                        </ul>
                        
                        <h4>💡 Tips</h4>
                        <ul>
                            <li>Ensure good lighting for optimal detection</li>
                            <li>Position yourself in the center of the frame</li>
                            <li>Maintain 2-3 feet distance from camera</li>
                            <li>Keep your shoulders and head visible</li>
                        </ul>
                    </div>
                </div>
            `;
            document.body.appendChild(helpModal);
        }
        
        helpModal.classList.add('active');
    }
    
    /**
     * Hide all modals
     */
    hideAllModals() {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
    }
    
    /**
     * Handle camera initialized event
     */
    handleCameraInitialized(_event) {
        if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
            this.loadingTimeout = null;
        }
        this.hideLoadingScreen();
        this.showNotification('📷 Camera initialized successfully!', 'success');
    }
    
    /**
     * Handle MediaPipe initialized event
     */
    handleMediaPipeInitialized(_event) {
        if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
            this.loadingTimeout = null;
        }
        this.hideLoadingScreen();
        this.showNotification('🧠 MediaPipe initialized successfully!', 'success');
    }
    
    /**
     * Handle camera error event
     */
    handleCameraError(event) {
        this.hideLoadingScreen();
        this.resetUIState();
        this.showErrorMessage(`Camera error: ${event.detail.message}`);
    }
    
    /**
     * Handle analysis result event
     */
    handleAnalysisResult(event) {
        const result = event.detail;
        
        if (result.score !== null) {
            this.updateScoreDisplay(result.score);
            this.updateStatusDisplay(result.fps || 0, result.status);
            this.updateDetailedMetrics(result.detailedMetrics);
            this.updatePerformanceMetrics(result);
        }
    }
    
    /**
     * Handle config changed event
     */
    handleConfigChanged(event) {
        const { path, value } = event.detail;
        
        // Update UI based on config changes
        if (path === 'ui.showPerformanceOverlay') {
            if (value) {
                this.showPerformanceOverlay();
            } else {
                this.hidePerformanceOverlay();
            }
        }
    }
    
    /**
     * Handle page unload
     */
    handlePageUnload() {
        // Stop any ongoing analysis
        if (this.state.isAnalyzing) {
            this.handleStopAnalysis();
        }
        
        // Save current state
        localStorage.setItem('ui-state', JSON.stringify(this.state));
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.updateResponsiveUI();
        }, 250);
    }
    
    /**
     * Update responsive UI
     */
    updateResponsiveUI() {
        const isMobile = window.innerWidth < 768;
        
        // Adjust UI for mobile
        if (isMobile) {
            this.hidePerformanceOverlay();
        } else if (window.ProPostureConfig.get('ui.showPerformanceOverlay')) {
            this.showPerformanceOverlay();
        }
    }
    
    /**
     * Reset UI state
     */
    resetUIState() {
        this.setState({
            isAnalyzing: false,
            sessionStartTime: null,
            frameCount: 0
        });
        
        // Reset buttons
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        this.elements.screenshotBtn.disabled = true;
        
        // Reset displays
        this.updateStatusDisplay(0, 'Ready');
        this.updateScoreDisplay(null);
        this.updateDetailedMetrics({});
    }
    
    /**
     * Set UI state
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
    }
    
    /**
     * Get UI state
     */
    getState() {
        return { ...this.state };
    }
    
    /**
     * Destroy UI manager
     */
    destroy() {
        // Remove event listeners
        this.eventListeners.forEach((listener, element) => {
            element.removeEventListener(listener.type, listener.handler);
        });
        
        // Clear intervals/timeouts
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        // Clear animation frames
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
    }
}

// Export UI manager
window.UIManager = UIManager;
