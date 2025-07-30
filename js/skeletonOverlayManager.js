/**
 * Skeleton Overlay Manager for Real-time Posture Visualization
 * Handles skeleton rendering, posture guides, and visual feedback overlays
 */

class SkeletonOverlayManager {
  constructor(postureAnalyzer, videoControlsManager) {
    this.postureAnalyzer = postureAnalyzer;
    this.videoControlsManager = videoControlsManager;
    
    // Canvas contexts
    this.overlayCanvas = null;
    this.overlayCtx = null;
    this.guideCanvas = null;
    this.guideCtx = null;
    
    // Skeleton settings
    this.skeletonSettings = {
      showSkeleton: true,
      showLandmarks: false,
      showConnections: true,
      skeletonOpacity: 0.8,
      landmarkSize: 3,
      connectionWidth: 2,
      colors: {
        good: '#10b981',      // Green for good posture
        warning: '#f59e0b',   // Yellow for fair posture
        poor: '#ef4444',      // Red for poor posture
        neutral: '#64748b'    // Gray for neutral
      }
    };
    
    // Posture guide settings
    this.guideSettings = {
      showGuides: false,
      showAlignmentGrid: false,
      showPostureZones: false,
      showRealTimeGuides: true,
      guideOpacity: 0.6,
      gridSpacing: 50,
      zoneColors: {
        good: 'rgba(16, 185, 129, 0.2)',
        warning: 'rgba(245, 158, 11, 0.2)',
        poor: 'rgba(239, 68, 68, 0.2)'
      }
    };
    
    // MediaPipe pose connections
    this.poseConnections = [
      [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],  // Left arm
      [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],            // Right arm
      [11, 23], [12, 24], [23, 24],                                // Torso
      [23, 25], [25, 27], [27, 29], [29, 31],                     // Left leg
      [24, 26], [26, 28], [28, 30], [30, 32],                     // Right leg
      [27, 29], [28, 30]                                           // Feet
    ];
    
    // Ideal posture reference points
    this.idealPosture = {
      headAlignment: { x: 0.5, y: 0.15 },      // Relative to canvas
      shoulderAlignment: { x: 0.5, y: 0.25 },
      spineAlignment: { x: 0.5, y: 0.5 },
      hipAlignment: { x: 0.5, y: 0.75 }
    };
    
    // Real-time posture data
    this.currentPose = null;
    this.postureQuality = 'neutral';
    this.lastUpdate = 0;
    
    // Animation settings
    this.animationFrame = null;
    this.isAnimating = false;
    
    this.init();
  }

  init() {
    this.setupCanvases();
    this.setupEventListeners();
    this.loadSettings();
    this.startRenderLoop();
  }

  setupCanvases() {
    // Get or create overlay canvas
    this.overlayCanvas = document.getElementById('overlayCanvas');
    if (!this.overlayCanvas) {
      this.overlayCanvas = document.createElement('canvas');
      this.overlayCanvas.id = 'overlayCanvas';
      this.overlayCanvas.style.position = 'absolute';
      this.overlayCanvas.style.top = '0';
      this.overlayCanvas.style.left = '0';
      this.overlayCanvas.style.pointerEvents = 'none';
      this.overlayCanvas.style.zIndex = '10';
      
      const videoContainer = document.querySelector('.video-display');
      if (videoContainer) {
        videoContainer.appendChild(this.overlayCanvas);
      }
    }
    
    this.overlayCtx = this.overlayCanvas.getContext('2d');
    
    // Create guide canvas for static guides
    this.guideCanvas = document.createElement('canvas');
    this.guideCanvas.style.position = 'absolute';
    this.guideCanvas.style.top = '0';
    this.guideCanvas.style.left = '0';
    this.guideCanvas.style.pointerEvents = 'none';
    this.guideCanvas.style.zIndex = '5';
    
    this.guideCtx = this.guideCanvas.getContext('2d');
    
    const videoContainer = document.querySelector('.video-display');
    if (videoContainer) {
      videoContainer.appendChild(this.guideCanvas);
    }
    
    this.resizeCanvases();
  }

  resizeCanvases() {
    const video = document.getElementById('videoElement');
    if (!video) return;
    
    const rect = video.getBoundingClientRect();
    
    // Resize overlay canvas
    this.overlayCanvas.width = video.videoWidth || rect.width;
    this.overlayCanvas.height = video.videoHeight || rect.height;
    this.overlayCanvas.style.width = rect.width + 'px';
    this.overlayCanvas.style.height = rect.height + 'px';
    
    // Resize guide canvas
    this.guideCanvas.width = this.overlayCanvas.width;
    this.guideCanvas.height = this.overlayCanvas.height;
    this.guideCanvas.style.width = rect.width + 'px';
    this.guideCanvas.style.height = rect.height + 'px';
    
    // Redraw static guides
    this.drawStaticGuides();
  }

  setupEventListeners() {
    // Video resize events
    const video = document.getElementById('videoElement');
    if (video) {
      video.addEventListener('loadedmetadata', () => {
        this.resizeCanvases();
      });
      
      video.addEventListener('resize', () => {
        this.resizeCanvases();
      });
    }

    // Window resize
    window.addEventListener('resize', () => {
      this.resizeCanvases();
    });

    // Listen for posture data updates
    window.addEventListener('analysis-result', (event) => {
      this.updatePoseData(event.detail);
    });

    // Settings controls - integrate with existing video controls
    if (this.videoControlsManager) {
      // Override the existing toggle methods to include skeleton overlay
      const originalToggleOverlay = this.videoControlsManager.toggleOverlay.bind(this.videoControlsManager);
      this.videoControlsManager.toggleOverlay = (overlayType, enabled) => {
        originalToggleOverlay(overlayType, enabled);
        this.handleOverlayToggle(overlayType, enabled);
      };
    }
  }

  handleOverlayToggle(overlayType, enabled) {
    switch (overlayType) {
      case 'skeleton':
        this.skeletonSettings.showSkeleton = enabled;
        break;
      case 'landmarks':
        this.skeletonSettings.showLandmarks = enabled;
        break;
      case 'postureGuide':
        this.guideSettings.showGuides = enabled;
        this.drawStaticGuides();
        break;
      case 'grid':
        this.guideSettings.showAlignmentGrid = enabled;
        this.drawStaticGuides();
        break;
    }
    
    this.saveSettings();
  }

  updatePoseData(analysisResult) {
    if (!analysisResult || !analysisResult.landmarks) return;
    
    this.currentPose = analysisResult.landmarks;
    this.postureQuality = this.determinePostureQuality(analysisResult.score);
    this.lastUpdate = Date.now();
  }

  determinePostureQuality(score) {
    if (score >= 80) return 'good';
    if (score >= 60) return 'warning';
    if (score < 40) return 'poor';
    return 'warning';
  }

  startRenderLoop() {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    const render = () => {
      this.renderFrame();
      if (this.isAnimating) {
        this.animationFrame = requestAnimationFrame(render);
      }
    };
    
    render();
  }

  stopRenderLoop() {
    this.isAnimating = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  renderFrame() {
    if (!this.overlayCtx) return;
    
    // Clear overlay canvas
    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    
    // Render skeleton if enabled and pose data available
    if (this.skeletonSettings.showSkeleton && this.currentPose) {
      this.drawSkeleton();
    }
    
    // Render landmarks if enabled
    if (this.skeletonSettings.showLandmarks && this.currentPose) {
      this.drawLandmarks();
    }
    
    // Render real-time posture guides
    if (this.guideSettings.showRealTimeGuides && this.currentPose) {
      this.drawRealTimeGuides();
    }
  }

  drawSkeleton() {
    if (!this.currentPose || !this.overlayCtx) return;
    
    const ctx = this.overlayCtx;
    const color = this.skeletonSettings.colors[this.postureQuality];
    
    // Set drawing properties
    ctx.globalAlpha = this.skeletonSettings.skeletonOpacity;
    ctx.strokeStyle = color;
    ctx.lineWidth = this.skeletonSettings.connectionWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw pose connections
    if (this.skeletonSettings.showConnections) {
      this.poseConnections.forEach(([startIdx, endIdx]) => {
        const startLandmark = this.currentPose[startIdx];
        const endLandmark = this.currentPose[endIdx];
        
        if (startLandmark && endLandmark && 
            startLandmark.visibility > 0.5 && endLandmark.visibility > 0.5) {
          
          const startX = startLandmark.x * this.overlayCanvas.width;
          const startY = startLandmark.y * this.overlayCanvas.height;
          const endX = endLandmark.x * this.overlayCanvas.width;
          const endY = endLandmark.y * this.overlayCanvas.height;
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      });
    }
    
    ctx.globalAlpha = 1.0;
  }

  drawLandmarks() {
    if (!this.currentPose || !this.overlayCtx) return;
    
    const ctx = this.overlayCtx;
    const color = this.skeletonSettings.colors[this.postureQuality];
    const size = this.skeletonSettings.landmarkSize;
    
    ctx.globalAlpha = this.skeletonSettings.skeletonOpacity;
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    this.currentPose.forEach((landmark, index) => {
      if (landmark.visibility > 0.5) {
        const x = landmark.x * this.overlayCanvas.width;
        const y = landmark.y * this.overlayCanvas.height;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
    });
    
    ctx.globalAlpha = 1.0;
  }

  drawStaticGuides() {
    if (!this.guideCtx) return;
    
    // Clear guide canvas
    this.guideCtx.clearRect(0, 0, this.guideCanvas.width, this.guideCanvas.height);
    
    // Draw alignment grid
    if (this.guideSettings.showAlignmentGrid) {
      this.drawAlignmentGrid();
    }
    
    // Draw posture zones
    if (this.guideSettings.showGuides) {
      this.drawPostureZones();
      this.drawIdealPostureGuide();
    }
  }

  drawAlignmentGrid() {
    const ctx = this.guideCtx;
    const width = this.guideCanvas.width;
    const height = this.guideCanvas.height;
    const spacing = this.guideSettings.gridSpacing;
    
    ctx.globalAlpha = this.guideSettings.guideOpacity * 0.5;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // Vertical lines
    for (let x = spacing; x < width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = spacing; y < height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Center lines (stronger)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    
    // Vertical center line
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    
    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;
  }

  drawPostureZones() {
    const ctx = this.guideCtx;
    const width = this.guideCanvas.width;
    const height = this.guideCanvas.height;
    
    ctx.globalAlpha = this.guideSettings.guideOpacity;
    
    // Good posture zone (center area)
    ctx.fillStyle = this.guideSettings.zoneColors.good;
    ctx.fillRect(width * 0.4, height * 0.1, width * 0.2, height * 0.8);
    
    // Warning zones (slightly off-center)
    ctx.fillStyle = this.guideSettings.zoneColors.warning;
    ctx.fillRect(width * 0.3, height * 0.1, width * 0.1, height * 0.8);
    ctx.fillRect(width * 0.6, height * 0.1, width * 0.1, height * 0.8);
    
    // Poor posture zones (far from center)
    ctx.fillStyle = this.guideSettings.zoneColors.poor;
    ctx.fillRect(0, height * 0.1, width * 0.3, height * 0.8);
    ctx.fillRect(width * 0.7, height * 0.1, width * 0.3, height * 0.8);
    
    ctx.globalAlpha = 1.0;
  }

  drawIdealPostureGuide() {
    const ctx = this.guideCtx;
    const width = this.guideCanvas.width;
    const height = this.guideCanvas.height;
    
    ctx.globalAlpha = this.guideSettings.guideOpacity;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    
    // Draw ideal spine line
    const centerX = width * this.idealPosture.spineAlignment.x;
    const headY = height * this.idealPosture.headAlignment.y;
    const hipY = height * this.idealPosture.hipAlignment.y;
    
    ctx.beginPath();
    ctx.moveTo(centerX, headY);
    ctx.lineTo(centerX, hipY);
    ctx.stroke();
    
    // Draw ideal shoulder line
    const shoulderY = height * this.idealPosture.shoulderAlignment.y;
    const shoulderWidth = width * 0.3;
    
    ctx.beginPath();
    ctx.moveTo(centerX - shoulderWidth / 2, shoulderY);
    ctx.lineTo(centerX + shoulderWidth / 2, shoulderY);
    ctx.stroke();
    
    // Draw reference points
    ctx.fillStyle = '#10b981';
    ctx.globalAlpha = 0.8;
    
    // Head reference
    ctx.beginPath();
    ctx.arc(centerX, headY, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Shoulder references
    ctx.beginPath();
    ctx.arc(centerX - shoulderWidth / 2, shoulderY, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(centerX + shoulderWidth / 2, shoulderY, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;
  }

  drawRealTimeGuides() {
    if (!this.currentPose || !this.overlayCtx) return;
    
    const ctx = this.overlayCtx;
    
    // Draw posture deviation indicators
    this.drawPostureDeviationIndicators();
    
    // Draw real-time feedback arrows
    this.drawCorrectiveArrows();
  }

  drawPostureDeviationIndicators() {
    const ctx = this.overlayCtx;
    
    // Get key landmarks
    const nose = this.currentPose[0];
    const leftShoulder = this.currentPose[11];
    const rightShoulder = this.currentPose[12];
    
    if (!nose || !leftShoulder || !rightShoulder) return;
    
    // Calculate deviations
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    
    const headDeviation = {
      x: nose.x - shoulderCenter.x,
      y: nose.y - shoulderCenter.y
    };
    
    // Draw deviation indicator for forward head posture
    if (Math.abs(headDeviation.x) > 0.02) { // Threshold for deviation
      const color = Math.abs(headDeviation.x) > 0.05 ? '#ef4444' : '#f59e0b';
      
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      
      const noseX = nose.x * this.overlayCanvas.width;
      const noseY = nose.y * this.overlayCanvas.height;
      const idealX = shoulderCenter.x * this.overlayCanvas.width;
      
      ctx.beginPath();
      ctx.moveTo(noseX, noseY);
      ctx.lineTo(idealX, noseY);
      ctx.stroke();
      
      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;
    }
  }

  drawCorrectiveArrows() {
    const ctx = this.overlayCtx;
    
    // Get key landmarks
    const nose = this.currentPose[0];
    const leftShoulder = this.currentPose[11];
    const rightShoulder = this.currentPose[12];
    
    if (!nose || !leftShoulder || !rightShoulder) return;
    
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    
    // Forward head correction arrow
    const headDeviation = nose.x - shoulderCenter.x;
    
    if (Math.abs(headDeviation) > 0.03) {
      const arrowColor = headDeviation > 0 ? '#ef4444' : '#10b981';
      const direction = headDeviation > 0 ? -1 : 1;
      
      const startX = nose.x * this.overlayCanvas.width;
      const startY = nose.y * this.overlayCanvas.height;
      const endX = startX + (direction * 30);
      const endY = startY;
      
      this.drawArrow(ctx, startX, startY, endX, endY, arrowColor);
    }
    
    // Shoulder level correction arrows
    const shoulderSlope = Math.abs(leftShoulder.y - rightShoulder.y);
    
    if (shoulderSlope > 0.02) {
      const higherShoulder = leftShoulder.y < rightShoulder.y ? leftShoulder : rightShoulder;
      const lowerShoulder = leftShoulder.y < rightShoulder.y ? rightShoulder : leftShoulder;
      
      const higherX = higherShoulder.x * this.overlayCanvas.width;
      const higherY = higherShoulder.y * this.overlayCanvas.height;
      const lowerX = lowerShoulder.x * this.overlayCanvas.width;
      const lowerY = lowerShoulder.y * this.overlayCanvas.height;
      
      // Arrow pointing down for higher shoulder
      this.drawArrow(ctx, higherX, higherY, higherX, higherY + 20, '#f59e0b');
      
      // Arrow pointing up for lower shoulder
      this.drawArrow(ctx, lowerX, lowerY, lowerX, lowerY - 20, '#f59e0b');
    }
  }

  drawArrow(ctx, startX, startY, endX, endY, color) {
    const headLength = 10;
    const angle = Math.atan2(endY - startY, endX - startX);
    
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    
    // Draw arrow line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Draw arrow head
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle - Math.PI / 6),
      endY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - headLength * Math.cos(angle + Math.PI / 6),
      endY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    
    ctx.globalAlpha = 1.0;
  }

  // Settings management
  updateSkeletonSettings(settings) {
    Object.assign(this.skeletonSettings, settings);
    this.saveSettings();
  }

  updateGuideSettings(settings) {
    Object.assign(this.guideSettings, settings);
    this.drawStaticGuides();
    this.saveSettings();
  }

  toggleSkeleton(enabled) {
    this.skeletonSettings.showSkeleton = enabled;
    this.saveSettings();
  }

  toggleLandmarks(enabled) {
    this.skeletonSettings.showLandmarks = enabled;
    this.saveSettings();
  }

  toggleGuides(enabled) {
    this.guideSettings.showGuides = enabled;
    this.drawStaticGuides();
    this.saveSettings();
  }

  toggleGrid(enabled) {
    this.guideSettings.showAlignmentGrid = enabled;
    this.drawStaticGuides();
    this.saveSettings();
  }

  setSkeletonOpacity(opacity) {
    this.skeletonSettings.skeletonOpacity = Math.max(0, Math.min(1, opacity));
    this.saveSettings();
  }

  setGuideOpacity(opacity) {
    this.guideSettings.guideOpacity = Math.max(0, Math.min(1, opacity));
    this.drawStaticGuides();
    this.saveSettings();
  }

  saveSettings() {
    const settings = {
      skeletonSettings: this.skeletonSettings,
      guideSettings: this.guideSettings
    };
    
    localStorage.setItem('skeletonOverlaySettings', JSON.stringify(settings));
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('skeletonOverlaySettings');
      if (saved) {
        const settings = JSON.parse(saved);
        Object.assign(this.skeletonSettings, settings.skeletonSettings || {});
        Object.assign(this.guideSettings, settings.guideSettings || {});
      }
    } catch (error) {
      console.error('Failed to load skeleton overlay settings:', error);
    }
  }

  // Public API
  isVisible() {
    return this.isAnimating;
  }

  show() {
    this.overlayCanvas.style.display = 'block';
    this.guideCanvas.style.display = 'block';
    this.startRenderLoop();
  }

  hide() {
    this.overlayCanvas.style.display = 'none';
    this.guideCanvas.style.display = 'none';
    this.stopRenderLoop();
  }

  getSettings() {
    return {
      skeleton: { ...this.skeletonSettings },
      guides: { ...this.guideSettings }
    };
  }

  destroy() {
    this.stopRenderLoop();
    
    if (this.overlayCanvas && this.overlayCanvas.parentNode) {
      this.overlayCanvas.parentNode.removeChild(this.overlayCanvas);
    }
    
    if (this.guideCanvas && this.guideCanvas.parentNode) {
      this.guideCanvas.parentNode.removeChild(this.guideCanvas);
    }
  }
}

// Export for ES6 modules
export default SkeletonOverlayManager;

// Also make available globally
window.SkeletonOverlayManager = SkeletonOverlayManager;