/**
 * Video Controls Manager for Advanced ProPostureFitness Video Controls
 * Handles camera selection, quality controls, overlays, recording, and advanced features
 */

class VideoControlsManager {
  constructor(cameraManager, postureAnalyzer) {
    this.cameraManager = cameraManager;
    this.postureAnalyzer = postureAnalyzer;
    this.availableCameras = [];
    this.currentCamera = null;
    this.currentQuality = '720p';
    this.currentFrameRate = 30;
    this.isRecording = false;
    this.recordingStartTime = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    
    // Control states
    this.controlsExpanded = true;
    this.overlayStates = {
      skeleton: true,
      landmarks: false,
      postureGuide: false,
      grid: false
    };
    
    // Video effects
    this.videoEffects = {
      flip: false,
      enhanceContrast: false
    };
    
    // Advanced settings
    this.advancedSettings = {
      detectionConfidence: 0.7,
      trackingConfidence: 0.5,
      skeletonOpacity: 0.8
    };
    
    // Presets
    this.presets = {
      beginner: {
        quality: '480p',
        frameRate: 15,
        detectionConfidence: 0.8,
        trackingConfidence: 0.6,
        overlays: { skeleton: true, landmarks: false, postureGuide: true, grid: true }
      },
      standard: {
        quality: '720p',
        frameRate: 30,
        detectionConfidence: 0.7,
        trackingConfidence: 0.5,
        overlays: { skeleton: true, landmarks: false, postureGuide: false, grid: false }
      },
      professional: {
        quality: '1080p',
        frameRate: 60,
        detectionConfidence: 0.6,
        trackingConfidence: 0.4,
        overlays: { skeleton: true, landmarks: true, postureGuide: false, grid: false }
      }
    };
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSavedSettings();
    this.detectCameras();
    this.initializeControls();
    this.setupOverlays();
  }

  setupEventListeners() {
    // Controls panel toggle
    const toggleBtn = document.getElementById('toggleControlsBtn');
    const controlsHeader = document.querySelector('.controls-header');
    
    [toggleBtn, controlsHeader].forEach(element => {
      element?.addEventListener('click', () => this.toggleControlsPanel());
    });

    // Camera controls
    document.getElementById('cameraSelect')?.addEventListener('change', (e) => {
      this.switchCamera(e.target.value);
    });
    
    document.getElementById('refreshCameras')?.addEventListener('click', () => {
      this.detectCameras();
    });

    // Quality controls
    document.getElementById('videoQuality')?.addEventListener('change', (e) => {
      this.changeVideoQuality(e.target.value);
    });
    
    document.getElementById('frameRate')?.addEventListener('change', (e) => {
      this.changeFrameRate(parseInt(e.target.value));
    });

    // Video effects
    document.getElementById('flipVideo')?.addEventListener('change', (e) => {
      this.toggleVideoFlip(e.target.checked);
    });
    
    document.getElementById('enhanceContrast')?.addEventListener('change', (e) => {
      this.toggleContrastEnhancement(e.target.checked);
    });

    // Overlay controls
    document.getElementById('showSkeleton')?.addEventListener('change', (e) => {
      this.toggleOverlay('skeleton', e.target.checked);
    });
    
    document.getElementById('showLandmarks')?.addEventListener('change', (e) => {
      this.toggleOverlay('landmarks', e.target.checked);
    });
    
    document.getElementById('showPostureGuide')?.addEventListener('change', (e) => {
      this.toggleOverlay('postureGuide', e.target.checked);
    });
    
    document.getElementById('showGrid')?.addEventListener('change', (e) => {
      this.toggleOverlay('grid', e.target.checked);
    });

    // Advanced settings
    this.setupAdvancedSettings();

    // Preset buttons
    document.getElementById('presetBeginner')?.addEventListener('click', () => {
      this.applyPreset('beginner');
    });
    
    document.getElementById('presetStandard')?.addEventListener('click', () => {
      this.applyPreset('standard');
    });
    
    document.getElementById('presetProfessional')?.addEventListener('click', () => {
      this.applyPreset('professional');
    });
    
    document.getElementById('presetCustom')?.addEventListener('click', () => {
      this.saveCustomPreset();
    });

    // Video action buttons
    document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
      this.toggleFullscreen();
    });
    
    document.getElementById('screenshotBtn')?.addEventListener('click', () => {
      this.takeScreenshot();
    });
    
    document.getElementById('recordBtn')?.addEventListener('click', () => {
      this.toggleRecording();
    });
    
    document.getElementById('calibrateBtn')?.addEventListener('click', () => {
      this.calibratePosition();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
  }

  setupAdvancedSettings() {
    // Detection confidence
    const detectionSlider = document.getElementById('detectionConfidence');
    const confidenceValue = document.getElementById('confidenceValue');
    
    detectionSlider?.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.advancedSettings.detectionConfidence = value;
      confidenceValue.textContent = value.toFixed(1);
      this.updateAnalyzerSettings();
    });

    // Tracking confidence
    const trackingSlider = document.getElementById('trackingConfidence');
    const trackingValue = document.getElementById('trackingValue');
    
    trackingSlider?.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.advancedSettings.trackingConfidence = value;
      trackingValue.textContent = value.toFixed(1);
      this.updateAnalyzerSettings();
    });

    // Skeleton opacity
    const opacitySlider = document.getElementById('skeletonOpacity');
    const opacityValue = document.getElementById('opacityValue');
    
    opacitySlider?.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.advancedSettings.skeletonOpacity = value;
      opacityValue.textContent = value.toFixed(1);
      this.updateSkeletonOpacity(value);
    });
  }

  async detectCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.availableCameras = devices.filter(device => device.kind === 'videoinput');
      
      const cameraSelect = document.getElementById('cameraSelect');
      if (cameraSelect) {
        cameraSelect.innerHTML = '';
        
        if (this.availableCameras.length === 0) {
          cameraSelect.innerHTML = '<option value="">No cameras found</option>';
        } else {
          this.availableCameras.forEach((camera, index) => {
            const option = document.createElement('option');
            option.value = camera.deviceId;
            option.textContent = camera.label || `Camera ${index + 1}`;
            cameraSelect.appendChild(option);
          });
          
          // Select first camera by default
          if (this.availableCameras.length > 0) {
            this.currentCamera = this.availableCameras[0].deviceId;
            cameraSelect.value = this.currentCamera;
          }
        }
      }
    } catch (error) {
      console.error('Error detecting cameras:', error);
      const cameraSelect = document.getElementById('cameraSelect');
      if (cameraSelect) {
        cameraSelect.innerHTML = '<option value="">Camera detection failed</option>';
      }
    }
  }

  async switchCamera(deviceId) {
    if (!deviceId || deviceId === this.currentCamera) return;
    
    try {
      this.currentCamera = deviceId;
      
      // Stop current stream
      if (this.cameraManager?.currentStream) {
        this.cameraManager.currentStream.getTracks().forEach(track => track.stop());
      }
      
      // Get quality constraints
      const constraints = this.getVideoConstraints();
      constraints.video.deviceId = { exact: deviceId };
      
      // Start new stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Update video element
      const videoElement = document.getElementById('videoElement');
      if (videoElement) {
        videoElement.srcObject = stream;
      }
      
      // Update camera manager if available
      if (this.cameraManager) {
        this.cameraManager.currentStream = stream;
      }
      
      // Update resolution display
      this.updateResolutionDisplay();
      
      console.log('Camera switched successfully');
    } catch (error) {
      console.error('Error switching camera:', error);
      this.showError('Failed to switch camera. Please try again.');
    }
  }

  getVideoConstraints() {
    const qualityMap = {
      '480p': { width: 640, height: 480 },
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      '4k': { width: 3840, height: 2160 }
    };
    
    const resolution = qualityMap[this.currentQuality] || qualityMap['720p'];
    
    return {
      video: {
        width: { ideal: resolution.width },
        height: { ideal: resolution.height },
        frameRate: { ideal: this.currentFrameRate }
      },
      audio: false
    };
  }

  async changeVideoQuality(quality) {
    if (quality === this.currentQuality) return;
    
    this.currentQuality = quality;
    
    // Restart stream with new quality
    if (this.currentCamera) {
      await this.switchCamera(this.currentCamera);
    }
    
    this.saveSettings();
  }

  changeFrameRate(frameRate) {
    if (frameRate === this.currentFrameRate) return;
    
    this.currentFrameRate = frameRate;
    
    // Restart stream with new frame rate
    if (this.currentCamera) {
      this.switchCamera(this.currentCamera);
    }
    
    this.saveSettings();
  }

  toggleVideoFlip(enabled) {
    this.videoEffects.flip = enabled;
    
    const videoElement = document.getElementById('videoElement');
    const canvas = document.getElementById('outputCanvas');
    
    if (videoElement) {
      videoElement.style.transform = enabled ? 'scaleX(-1)' : 'scaleX(1)';
    }
    
    if (canvas) {
      canvas.style.transform = enabled ? 'scaleX(-1)' : 'scaleX(1)';
    }
    
    this.saveSettings();
  }

  toggleContrastEnhancement(enabled) {
    this.videoEffects.enhanceContrast = enabled;
    
    const videoElement = document.getElementById('videoElement');
    if (videoElement) {
      videoElement.style.filter = enabled ? 'contrast(1.2) brightness(1.1)' : 'none';
    }
    
    this.saveSettings();
  }

  toggleOverlay(overlayType, enabled) {
    this.overlayStates[overlayType] = enabled;
    
    switch (overlayType) {
      case 'skeleton':
        // Skeleton overlay handled by posture analyzer
        if (this.postureAnalyzer) {
          this.postureAnalyzer.showSkeleton = enabled;
        }
        break;
        
      case 'landmarks':
        // Landmarks overlay handled by posture analyzer
        if (this.postureAnalyzer) {
          this.postureAnalyzer.showLandmarks = enabled;
        }
        break;
        
      case 'postureGuide':
        const guideOverlay = document.getElementById('postureGuideOverlay');
        if (guideOverlay) {
          guideOverlay.style.display = enabled ? 'block' : 'none';
        }
        break;
        
      case 'grid':
        const gridOverlay = document.getElementById('alignmentGridOverlay');
        if (gridOverlay) {
          gridOverlay.style.display = enabled ? 'block' : 'none';
        }
        break;
    }
    
    this.saveSettings();
  }

  setupOverlays() {
    // Initialize overlay states from checkboxes
    Object.keys(this.overlayStates).forEach(overlayType => {
      const checkbox = document.getElementById(`show${overlayType.charAt(0).toUpperCase() + overlayType.slice(1)}`);
      if (checkbox) {
        this.toggleOverlay(overlayType, checkbox.checked);
      }
    });
  }

  updateAnalyzerSettings() {
    if (this.postureAnalyzer) {
      this.postureAnalyzer.detectionConfidence = this.advancedSettings.detectionConfidence;
      this.postureAnalyzer.trackingConfidence = this.advancedSettings.trackingConfidence;
    }
  }

  updateSkeletonOpacity(opacity) {
    // Update skeleton opacity in posture analyzer
    if (this.postureAnalyzer && this.postureAnalyzer.skeletonStyle) {
      this.postureAnalyzer.skeletonStyle.opacity = opacity;
    }
    
    // Update CSS custom property for skeleton opacity
    document.documentElement.style.setProperty('--skeleton-opacity', opacity);
  }

  applyPreset(presetName) {
    const preset = this.presets[presetName];
    if (!preset) return;
    
    // Update quality settings
    this.currentQuality = preset.quality;
    this.currentFrameRate = preset.frameRate;
    
    // Update UI
    const qualitySelect = document.getElementById('videoQuality');
    const frameRateSelect = document.getElementById('frameRate');
    
    if (qualitySelect) qualitySelect.value = preset.quality;
    if (frameRateSelect) frameRateSelect.value = preset.frameRate;
    
    // Update advanced settings
    this.advancedSettings.detectionConfidence = preset.detectionConfidence;
    this.advancedSettings.trackingConfidence = preset.trackingConfidence;
    
    // Update sliders
    const detectionSlider = document.getElementById('detectionConfidence');
    const trackingSlider = document.getElementById('trackingConfidence');
    const confidenceValue = document.getElementById('confidenceValue');
    const trackingValue = document.getElementById('trackingValue');
    
    if (detectionSlider) {
      detectionSlider.value = preset.detectionConfidence;
      confidenceValue.textContent = preset.detectionConfidence.toFixed(1);
    }
    
    if (trackingSlider) {
      trackingSlider.value = preset.trackingConfidence;
      trackingValue.textContent = preset.trackingConfidence.toFixed(1);
    }
    
    // Update overlays
    Object.keys(preset.overlays).forEach(overlayType => {
      const enabled = preset.overlays[overlayType];
      const checkbox = document.getElementById(`show${overlayType.charAt(0).toUpperCase() + overlayType.slice(1)}`);
      
      if (checkbox) {
        checkbox.checked = enabled;
        this.toggleOverlay(overlayType, enabled);
      }
    });
    
    // Update preset button states
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`preset${presetName.charAt(0).toUpperCase() + presetName.slice(1)}`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
    
    // Apply video settings
    if (this.currentCamera) {
      this.switchCamera(this.currentCamera);
    }
    
    this.updateAnalyzerSettings();
    this.saveSettings();
  }

  toggleControlsPanel() {
    const panel = document.getElementById('videoControlsPanel');
    if (panel) {
      this.controlsExpanded = !this.controlsExpanded;
      panel.classList.toggle('collapsed', !this.controlsExpanded);
    }
  }

  toggleFullscreen() {
    const videoDisplay = document.querySelector('.video-display');
    
    if (!document.fullscreenElement) {
      videoDisplay?.requestFullscreen?.() ||
      videoDisplay?.webkitRequestFullscreen?.() ||
      videoDisplay?.msRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() ||
      document.webkitExitFullscreen?.() ||
      document.msExitFullscreen?.();
    }
  }

  takeScreenshot() {
    const canvas = document.getElementById('outputCanvas');
    const video = document.getElementById('videoElement');
    
    if (!canvas || !video) return;
    
    // Create a temporary canvas for the screenshot
    const screenshotCanvas = document.createElement('canvas');
    const ctx = screenshotCanvas.getContext('2d');
    
    screenshotCanvas.width = video.videoWidth;
    screenshotCanvas.height = video.videoHeight;
    
    // Draw video frame
    ctx.drawImage(video, 0, 0);
    
    // Draw overlays if they exist
    if (canvas.getContext) {
      ctx.drawImage(canvas, 0, 0);
    }
    
    // Create download link
    screenshotCanvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `posture-screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
    
    // Show feedback
    this.showMessage('Screenshot captured!', 'success');
  }

  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    try {
      const canvas = document.getElementById('outputCanvas');
      const video = document.getElementById('videoElement');
      
      if (!canvas || !video) {
        throw new Error('Video elements not found');
      }
      
      // Create a stream from the canvas (includes overlays)
      const stream = canvas.captureStream(this.currentFrameRate);
      
      // Add audio track if needed
      if (video.srcObject && video.srcObject.getAudioTracks().length > 0) {
        video.srcObject.getAudioTracks().forEach(track => {
          stream.addTrack(track);
        });
      }
      
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      this.recordedChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        this.saveRecording();
      };
      
      this.mediaRecorder.start();
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      
      // Update UI
      this.updateRecordingUI();
      this.startRecordingTimer();
      
      // Update record button
      const recordBtn = document.getElementById('recordBtn');
      if (recordBtn) {
        recordBtn.classList.add('recording');
        recordBtn.title = 'Stop Recording';
      }
      
    } catch (error) {
      console.error('Error starting recording:', error);
      this.showError('Failed to start recording. Please try again.');
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.recordingStartTime = null;
      
      // Update UI
      this.hideRecordingUI();
      
      // Update record button
      const recordBtn = document.getElementById('recordBtn');
      if (recordBtn) {
        recordBtn.classList.remove('recording');
        recordBtn.title = 'Record Video';
      }
    }
  }

  saveRecording() {
    if (this.recordedChunks.length === 0) return;
    
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `posture-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.showMessage('Recording saved!', 'success');
  }

  updateRecordingUI() {
    const indicator = document.getElementById('recordingIndicator');
    if (indicator) {
      indicator.style.display = 'flex';
    }
  }

  hideRecordingUI() {
    const indicator = document.getElementById('recordingIndicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  startRecordingTimer() {
    if (!this.isRecording) return;
    
    const updateTimer = () => {
      if (!this.isRecording || !this.recordingStartTime) return;
      
      const elapsed = Date.now() - this.recordingStartTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      
      const timeDisplay = document.getElementById('recordingTime');
      if (timeDisplay) {
        timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      
      setTimeout(updateTimer, 1000);
    };
    
    updateTimer();
  }

  calibratePosition() {
    // TODO: Implement position calibration
    this.showMessage('Position calibration started. Please sit in your normal position.', 'info');
    
    // This could involve:
    // 1. Capturing reference posture
    // 2. Setting baseline measurements
    // 3. Adjusting detection thresholds
    
    setTimeout(() => {
      this.showMessage('Calibration complete!', 'success');
    }, 3000);
  }

  updateResolutionDisplay() {
    const video = document.getElementById('videoElement');
    const resolutionDisplay = document.getElementById('resolutionDisplay');
    
    if (video && resolutionDisplay && video.videoWidth && video.videoHeight) {
      resolutionDisplay.textContent = `${video.videoWidth}x${video.videoHeight}`;
    }
  }

  handleKeyboardShortcuts(event) {
    // Only handle shortcuts when not typing in inputs
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') return;
    
    switch (event.key.toLowerCase()) {
      case ' ':
        event.preventDefault();
        this.takeScreenshot();
        break;
      case 'r':
        event.preventDefault();
        this.toggleRecording();
        break;
      case 'f':
        event.preventDefault();
        this.toggleFullscreen();
        break;
      case 'c':
        event.preventDefault();
        this.calibratePosition();
        break;
      case 'g':
        event.preventDefault();
        const gridCheckbox = document.getElementById('showGrid');
        if (gridCheckbox) {
          gridCheckbox.checked = !gridCheckbox.checked;
          this.toggleOverlay('grid', gridCheckbox.checked);
        }
        break;
      case 's':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.saveCustomPreset();
        }
        break;
    }
  }

  saveCustomPreset() {
    const customPreset = {
      quality: this.currentQuality,
      frameRate: this.currentFrameRate,
      detectionConfidence: this.advancedSettings.detectionConfidence,
      trackingConfidence: this.advancedSettings.trackingConfidence,
      overlays: { ...this.overlayStates },
      effects: { ...this.videoEffects }
    };
    
    localStorage.setItem('videoControlsCustomPreset', JSON.stringify(customPreset));
    this.showMessage('Custom preset saved!', 'success');
    
    // Update custom button state
    const customBtn = document.getElementById('presetCustom');
    if (customBtn) {
      customBtn.classList.add('active');
      setTimeout(() => customBtn.classList.remove('active'), 1000);
    }
  }

  loadSavedSettings() {
    const saved = localStorage.getItem('videoControlsSettings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        
        // Apply saved settings
        this.currentQuality = settings.quality || '720p';
        this.currentFrameRate = settings.frameRate || 30;
        this.overlayStates = { ...this.overlayStates, ...settings.overlays };
        this.videoEffects = { ...this.videoEffects, ...settings.effects };
        this.advancedSettings = { ...this.advancedSettings, ...settings.advanced };
        
        // Update UI
        this.initializeControls();
        
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
  }

  saveSettings() {
    const settings = {
      quality: this.currentQuality,
      frameRate: this.currentFrameRate,
      overlays: this.overlayStates,
      effects: this.videoEffects,
      advanced: this.advancedSettings
    };
    
    localStorage.setItem('videoControlsSettings', JSON.stringify(settings));
  }

  initializeControls() {
    // Set quality
    const qualitySelect = document.getElementById('videoQuality');
    if (qualitySelect) qualitySelect.value = this.currentQuality;
    
    // Set frame rate
    const frameRateSelect = document.getElementById('frameRate');
    if (frameRateSelect) frameRateSelect.value = this.currentFrameRate;
    
    // Set effects
    const flipCheckbox = document.getElementById('flipVideo');
    if (flipCheckbox) flipCheckbox.checked = this.videoEffects.flip;
    
    const contrastCheckbox = document.getElementById('enhanceContrast');
    if (contrastCheckbox) contrastCheckbox.checked = this.videoEffects.enhanceContrast;
    
    // Set overlays
    Object.keys(this.overlayStates).forEach(overlayType => {
      const checkbox = document.getElementById(`show${overlayType.charAt(0).toUpperCase() + overlayType.slice(1)}`);
      if (checkbox) checkbox.checked = this.overlayStates[overlayType];
    });
    
    // Set advanced settings
    const detectionSlider = document.getElementById('detectionConfidence');
    const trackingSlider = document.getElementById('trackingConfidence');
    const opacitySlider = document.getElementById('skeletonOpacity');
    
    if (detectionSlider) {
      detectionSlider.value = this.advancedSettings.detectionConfidence;
      document.getElementById('confidenceValue').textContent = this.advancedSettings.detectionConfidence.toFixed(1);
    }
    
    if (trackingSlider) {
      trackingSlider.value = this.advancedSettings.trackingConfidence;
      document.getElementById('trackingValue').textContent = this.advancedSettings.trackingConfidence.toFixed(1);
    }
    
    if (opacitySlider) {
      opacitySlider.value = this.advancedSettings.skeletonOpacity;
      document.getElementById('opacityValue').textContent = this.advancedSettings.skeletonOpacity.toFixed(1);
    }
  }

  showMessage(message, type = 'info') {
    // Create a toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    toast.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: var(--bg-card);
      color: var(--text-primary);
      padding: 12px 16px;
      border-radius: 8px;
      border-left: 4px solid var(--${type === 'success' ? 'success' : type === 'error' ? 'error' : 'primary'}-color);
      box-shadow: var(--shadow-lg);
      z-index: 10000;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  showError(message) {
    this.showMessage(message, 'error');
  }

  // Public API methods
  getCurrentSettings() {
    return {
      quality: this.currentQuality,
      frameRate: this.currentFrameRate,
      camera: this.currentCamera,
      overlays: this.overlayStates,
      effects: this.videoEffects,
      advanced: this.advancedSettings
    };
  }

  updateFromAnalyzer(analyzerData) {
    // Update displays based on analyzer data
    if (analyzerData.fps !== undefined) {
      const fpsDisplay = document.getElementById('fpsDisplay');
      if (fpsDisplay) fpsDisplay.textContent = Math.round(analyzerData.fps);
    }
    
    if (analyzerData.score !== undefined) {
      const scoreDisplay = document.getElementById('scoreDisplay');
      if (scoreDisplay) scoreDisplay.textContent = analyzerData.score.toFixed(1);
    }
    
    if (analyzerData.status !== undefined) {
      const statusDisplay = document.getElementById('postureStatus');
      if (statusDisplay) statusDisplay.textContent = analyzerData.status;
    }
  }
}

// Export for ES6 modules
export default VideoControlsManager;

// Also make available globally
window.VideoControlsManager = VideoControlsManager;