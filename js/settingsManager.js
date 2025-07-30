/**
 * Settings and Preferences Manager for ProPostureFitness
 * Handles application settings, user preferences, and configuration management
 */

class SettingsManager {
  constructor(apiService, videoControlsManager, alertsManager) {
    this.api = apiService;
    this.videoControlsManager = videoControlsManager;
    this.alertsManager = alertsManager;
    
    // Default settings structure
    this.defaultSettings = {
      // Application preferences
      application: {
        theme: 'auto', // 'light', 'dark', 'auto'
        language: 'en',
        autoStart: false,
        showWelcomeScreen: true,
        enableTooltips: true,
        compactMode: false
      },
      
      // Video and camera settings
      video: {
        cameraId: 'default',
        resolution: '720p',
        frameRate: 30,
        flipVideo: false,
        enhanceContrast: false,
        autoAdjustExposure: true,
        lowLightMode: false
      },
      
      // Analysis settings
      analysis: {
        mode: 'advanced', // 'basic', 'advanced', 'gpu'
        detectionConfidence: 0.7,
        trackingConfidence: 0.5,
        modelComplexity: 1, // 0=lite, 1=full, 2=heavy
        smoothLandmarks: true,
        enableFaceDetection: true,
        minDetectionConfidence: 0.5
      },
      
      // Overlay and visual settings
      overlays: {
        showSkeleton: true,
        showLandmarks: false,
        showPostureGuide: false,
        showGrid: false,
        skeletonOpacity: 0.8,
        guideOpacity: 0.6,
        showPerformanceOverlay: true,
        showStatusOverlay: true,
        overlayPosition: 'top-right' // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
      },
      
      // Alerts and notifications
      alerts: {
        enablePostureAlerts: true,
        alertFrequency: 'medium', // 'low', 'medium', 'high'
        alertSound: true,
        alertVibration: false,
        alertThreshold: 60, // Posture score threshold for alerts
        enableBreakReminders: true,
        breakInterval: 30, // minutes
        enableTips: true,
        tipFrequency: 'hourly' // 'disabled', 'hourly', 'daily'
      },
      
      // Session settings
      sessions: {
        autoSaveReports: true,
        sessionTimeout: 30, // minutes of inactivity
        includeScreenshots: false,
        exportFormat: 'pdf', // 'pdf', 'csv', 'json'
        defaultSessionDuration: 60, // minutes
        enableSessionGoals: true
      },
      
      // Gamification settings
      gamification: {
        enabled: true,
        showAchievements: true,
        showProgress: true,
        enableLevels: true,
        shareAchievements: false,
        competitiveMode: false,
        dailyGoals: true
      },
      
      // Exercise preferences
      exercises: {
        enabled: true,
        difficultyLevel: 'beginner', // 'beginner', 'intermediate', 'advanced'
        reminderFrequency: 'hourly',
        autoStartTimer: false,
        showInstructions: true,
        enableProgressTracking: true,
        preferredCategories: ['stretching', 'strengthening']
      },
      
      // Privacy and data settings
      privacy: {
        allowTelemetry: true,
        saveLocalData: true,
        shareAnalytics: false,
        autoBackup: false,
        dataRetentionDays: 30,
        requireAuthForData: false
      },
      
      // Performance settings
      performance: {
        enableGPUAcceleration: 'auto', // 'auto', 'enabled', 'disabled'
        maxFrameRate: 30,
        reduceMotion: false,
        lowPowerMode: false,
        enableCaching: true,
        optimizeForBattery: false
      },
      
      // Accessibility settings
      accessibility: {
        highContrast: false,
        largeText: false,
        reduceAnimations: false,
        enableScreenReader: false,
        keyboardNavigation: true,
        focusIndicators: true,
        colorBlindMode: 'none' // 'none', 'protanopia', 'deuteranopia', 'tritanopia'
      }
    };
    
    // Current settings (deep copy of defaults)
    this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
    
    // Settings validation rules
    this.validationRules = {
      'video.resolution': ['480p', '720p', '1080p', '4k'],
      'video.frameRate': [15, 24, 30, 60],
      'analysis.mode': ['basic', 'advanced', 'gpu'],
      'analysis.detectionConfidence': { min: 0.1, max: 1.0 },
      'analysis.trackingConfidence': { min: 0.1, max: 1.0 },
      'analysis.modelComplexity': [0, 1, 2],
      'overlays.skeletonOpacity': { min: 0.1, max: 1.0 },
      'overlays.guideOpacity': { min: 0.1, max: 1.0 },
      'alerts.alertThreshold': { min: 0, max: 100 },
      'alerts.breakInterval': { min: 5, max: 120 },
      'sessions.sessionTimeout': { min: 5, max: 180 },
      'sessions.defaultSessionDuration': { min: 10, max: 480 },
      'privacy.dataRetentionDays': { min: 1, max: 365 }
    };
    
    // Settings UI elements
    this.settingsModal = null;
    this.currentTab = 'general';
    this.unsavedChanges = false;
    
    // Event handlers
    this.eventHandlers = new Map();
    
    this.init();
  }

  init() {
    this.loadSettings();
    this.createSettingsModal();
    this.setupEventListeners();
    this.applySettings();
  }

  setupEventListeners() {
    // Settings button click
    const settingsBtn = document.getElementById('headerSettingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openSettings());
    }

    // Alternative settings button
    const altSettingsBtn = document.getElementById('settingsBtn');
    if (altSettingsBtn) {
      altSettingsBtn.addEventListener('click', () => this.openSettings());
    }

    // Listen for theme system changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => this.handleSystemThemeChange());
    }

    // Listen for settings changes from other components
    window.addEventListener('settings-changed', (event) => {
      this.handleExternalSettingsChange(event.detail);
    });

    // Keyboard shortcuts for settings
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.key === ',') {
        event.preventDefault();
        this.openSettings();
      }
      
      if (event.key === 'Escape' && this.isSettingsOpen()) {
        this.closeSettings();
      }
    });
  }

  // Settings Modal Creation
  createSettingsModal() {
    this.settingsModal = document.createElement('div');
    this.settingsModal.className = 'modal settings-modal';
    this.settingsModal.id = 'settingsModal';
    
    this.settingsModal.innerHTML = `
      <div class="modal-content settings-content">
        <div class="settings-header">
          <h3>⚙️ Settings & Preferences</h3>
          <div class="settings-header-actions">
            <button class="settings-btn reset-btn" id="resetAllSettings" title="Reset to Defaults">
              <span>🔄</span>
            </button>
            <button class="settings-btn export-btn" id="exportSettings" title="Export Settings">
              <span>📤</span>
            </button>
            <button class="settings-btn import-btn" id="importSettings" title="Import Settings">
              <span>📥</span>
            </button>
            <button class="close-btn" id="closeSettingsModal">&times;</button>
          </div>
        </div>
        
        <div class="settings-body">
          <!-- Settings Navigation -->
          <div class="settings-nav">
            <div class="nav-item active" data-tab="general">
              <span class="nav-icon">🎛️</span>
              <span class="nav-label">General</span>
            </div>
            <div class="nav-item" data-tab="video">
              <span class="nav-icon">📹</span>
              <span class="nav-label">Video & Camera</span>
            </div>
            <div class="nav-item" data-tab="analysis">
              <span class="nav-icon">🔍</span>
              <span class="nav-label">Analysis</span>
            </div>
            <div class="nav-item" data-tab="overlays">
              <span class="nav-icon">🎭</span>
              <span class="nav-label">Overlays</span>
            </div>
            <div class="nav-item" data-tab="alerts">
              <span class="nav-icon">🔔</span>
              <span class="nav-label">Alerts</span>
            </div>
            <div class="nav-item" data-tab="sessions">
              <span class="nav-icon">📊</span>
              <span class="nav-label">Sessions</span>
            </div>
            <div class="nav-item" data-tab="exercises">
              <span class="nav-icon">🤸‍♀️</span>
              <span class="nav-label">Exercises</span>
            </div>
            <div class="nav-item" data-tab="privacy">
              <span class="nav-icon">🔒</span>
              <span class="nav-label">Privacy</span>
            </div>
            <div class="nav-item" data-tab="accessibility">
              <span class="nav-icon">♿</span>
              <span class="nav-label">Accessibility</span>
            </div>
          </div>
          
          <!-- Settings Content -->
          <div class="settings-content-area">
            <div id="settingsTabContent">
              <!-- Content will be dynamically generated -->
            </div>
          </div>
        </div>
        
        <div class="settings-footer">
          <div class="settings-status" id="settingsStatus">
            <span class="status-text">Ready</span>
          </div>
          <div class="settings-actions">
            <button class="btn btn-secondary" id="cancelSettings">Cancel</button>
            <button class="btn btn-primary" id="saveSettings">Save Changes</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.settingsModal);
    this.setupModalEventListeners();
  }

  setupModalEventListeners() {
    // Close modal
    const closeBtn = this.settingsModal.querySelector('#closeSettingsModal');
    closeBtn?.addEventListener('click', () => this.closeSettings());

    // Save settings
    const saveBtn = this.settingsModal.querySelector('#saveSettings');
    saveBtn?.addEventListener('click', () => this.saveSettings());

    // Cancel changes
    const cancelBtn = this.settingsModal.querySelector('#cancelSettings');
    cancelBtn?.addEventListener('click', () => this.cancelSettings());

    // Reset settings
    const resetBtn = this.settingsModal.querySelector('#resetAllSettings');
    resetBtn?.addEventListener('click', () => this.resetToDefaults());

    // Export settings
    const exportBtn = this.settingsModal.querySelector('#exportSettings');
    exportBtn?.addEventListener('click', () => this.exportSettings());

    // Import settings
    const importBtn = this.settingsModal.querySelector('#importSettings');
    importBtn?.addEventListener('click', () => this.importSettings());

    // Tab navigation
    const navItems = this.settingsModal.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Click outside to close
    this.settingsModal.addEventListener('click', (event) => {
      if (event.target === this.settingsModal) {
        this.closeSettings();
      }
    });
  }

  // Settings Management
  openSettings(tab = 'general') {
    this.currentTab = tab;
    this.loadCurrentSettings();
    this.renderTabContent();
    this.settingsModal.classList.add('show');
    this.switchTab(tab);
  }

  closeSettings() {
    if (this.unsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    this.settingsModal.classList.remove('show');
    this.unsavedChanges = false;
  }

  switchTab(tab) {
    // Update navigation
    const navItems = this.settingsModal.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tab);
    });

    this.currentTab = tab;
    this.renderTabContent();
  }

  renderTabContent() {
    const contentArea = this.settingsModal.querySelector('#settingsTabContent');
    
    switch (this.currentTab) {
      case 'general':
        contentArea.innerHTML = this.renderGeneralSettings();
        break;
      case 'video':
        contentArea.innerHTML = this.renderVideoSettings();
        break;
      case 'analysis':
        contentArea.innerHTML = this.renderAnalysisSettings();
        break;
      case 'overlays':
        contentArea.innerHTML = this.renderOverlaySettings();
        break;
      case 'alerts':
        contentArea.innerHTML = this.renderAlertSettings();
        break;
      case 'sessions':
        contentArea.innerHTML = this.renderSessionSettings();
        break;
      case 'exercises':
        contentArea.innerHTML = this.renderExerciseSettings();
        break;
      case 'privacy':
        contentArea.innerHTML = this.renderPrivacySettings();
        break;
      case 'accessibility':
        contentArea.innerHTML = this.renderAccessibilitySettings();
        break;
    }

    this.bindSettingControls();
  }

  renderGeneralSettings() {
    return `
      <div class="settings-section">
        <h4>🎨 Appearance</h4>
        <div class="setting-item">
          <label for="themeSelect">Theme</label>
          <select id="themeSelect" data-setting="application.theme">
            <option value="auto">Auto (System)</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div class="setting-item">
          <label for="languageSelect">Language</label>
          <select id="languageSelect" data-setting="application.language">
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="application.compactMode">
            <span>Compact Mode</span>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <h4>🚀 Startup</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="application.autoStart">
            <span>Auto-start analysis on load</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="application.showWelcomeScreen">
            <span>Show welcome screen</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="application.enableTooltips">
            <span>Enable tooltips</span>
          </label>
        </div>
      </div>
    `;
  }

  renderVideoSettings() {
    return `
      <div class="settings-section">
        <h4>📷 Camera</h4>
        <div class="setting-item">
          <label for="cameraSelect">Camera Device</label>
          <select id="cameraSelect" data-setting="video.cameraId">
            <option value="default">Default Camera</option>
          </select>
          <button class="refresh-btn" onclick="settingsManager.refreshCameraList()">🔄</button>
        </div>
        <div class="setting-item">
          <label for="resolutionSelect">Resolution</label>
          <select id="resolutionSelect" data-setting="video.resolution">
            <option value="480p">480p (640x480)</option>
            <option value="720p">720p (1280x720)</option>
            <option value="1080p">1080p (1920x1080)</option>
            <option value="4k">4K (3840x2160)</option>
          </select>
        </div>
        <div class="setting-item">
          <label for="frameRateSelect">Frame Rate</label>
          <select id="frameRateSelect" data-setting="video.frameRate">
            <option value="15">15 FPS</option>
            <option value="24">24 FPS</option>
            <option value="30">30 FPS</option>
            <option value="60">60 FPS</option>
          </select>
        </div>
      </div>

      <div class="settings-section">
        <h4>🎨 Video Effects</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="video.flipVideo">
            <span>Mirror video horizontally</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="video.enhanceContrast">
            <span>Enhance contrast</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="video.autoAdjustExposure">
            <span>Auto-adjust exposure</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="video.lowLightMode">
            <span>Low light mode</span>
          </label>
        </div>
      </div>
    `;
  }

  renderAnalysisSettings() {
    return `
      <div class="settings-section">
        <h4>🔍 Detection Settings</h4>
        <div class="setting-item">
          <label for="analysisMode">Analysis Mode</label>
          <select id="analysisMode" data-setting="analysis.mode">
            <option value="basic">Basic (Fast)</option>
            <option value="advanced">Advanced (Accurate)</option>
            <option value="gpu">GPU Accelerated</option>
          </select>
        </div>
        <div class="setting-item">
          <label for="detectionConfidence">Detection Confidence</label>
          <input type="range" id="detectionConfidence" data-setting="analysis.detectionConfidence" 
                 min="0.1" max="1.0" step="0.1">
          <span class="range-value"></span>
        </div>
        <div class="setting-item">
          <label for="trackingConfidence">Tracking Confidence</label>
          <input type="range" id="trackingConfidence" data-setting="analysis.trackingConfidence" 
                 min="0.1" max="1.0" step="0.1">
          <span class="range-value"></span>
        </div>
        <div class="setting-item">
          <label for="modelComplexity">Model Complexity</label>
          <select id="modelComplexity" data-setting="analysis.modelComplexity">
            <option value="0">Lite (Fast)</option>
            <option value="1">Full (Balanced)</option>
            <option value="2">Heavy (Accurate)</option>
          </select>
        </div>
      </div>

      <div class="settings-section">
        <h4>⚙️ Advanced</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="analysis.smoothLandmarks">
            <span>Smooth landmark detection</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="analysis.enableFaceDetection">
            <span>Enable face detection</span>
          </label>
        </div>
        <div class="setting-item">
          <label for="minDetectionConfidence">Minimum Detection Confidence</label>
          <input type="range" id="minDetectionConfidence" data-setting="analysis.minDetectionConfidence" 
                 min="0.1" max="1.0" step="0.1">
          <span class="range-value"></span>
        </div>
      </div>
    `;
  }

  renderOverlaySettings() {
    return `
      <div class="settings-section">
        <h4>🎭 Visual Overlays</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="overlays.showSkeleton">
            <span>Show skeleton overlay</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="overlays.showLandmarks">
            <span>Show pose landmarks</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="overlays.showPostureGuide">
            <span>Show posture guide</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="overlays.showGrid">
            <span>Show alignment grid</span>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <h4>🎨 Opacity Settings</h4>
        <div class="setting-item">
          <label for="skeletonOpacity">Skeleton Opacity</label>
          <input type="range" id="skeletonOpacity" data-setting="overlays.skeletonOpacity" 
                 min="0.1" max="1.0" step="0.1">
          <span class="range-value"></span>
        </div>
        <div class="setting-item">
          <label for="guideOpacity">Guide Opacity</label>
          <input type="range" id="guideOpacity" data-setting="overlays.guideOpacity" 
                 min="0.1" max="1.0" step="0.1">
          <span class="range-value"></span>
        </div>
      </div>

      <div class="settings-section">
        <h4>📊 Information Overlays</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="overlays.showPerformanceOverlay">
            <span>Show performance metrics</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="overlays.showStatusOverlay">
            <span>Show status information</span>
          </label>
        </div>
        <div class="setting-item">
          <label for="overlayPosition">Overlay Position</label>
          <select id="overlayPosition" data-setting="overlays.overlayPosition">
            <option value="top-left">Top Left</option>
            <option value="top-right">Top Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
          </select>
        </div>
      </div>
    `;
  }

  renderAlertSettings() {
    return `
      <div class="settings-section">
        <h4>🔔 Posture Alerts</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="alerts.enablePostureAlerts">
            <span>Enable posture alerts</span>
          </label>
        </div>
        <div class="setting-item">
          <label for="alertFrequency">Alert Frequency</label>
          <select id="alertFrequency" data-setting="alerts.alertFrequency">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div class="setting-item">
          <label for="alertThreshold">Alert Threshold (Posture Score)</label>
          <input type="range" id="alertThreshold" data-setting="alerts.alertThreshold" 
                 min="0" max="100" step="5">
          <span class="range-value"></span>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="alerts.alertSound">
            <span>Alert sound</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="alerts.alertVibration">
            <span>Alert vibration (if supported)</span>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <h4>⏰ Break Reminders</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="alerts.enableBreakReminders">
            <span>Enable break reminders</span>
          </label>
        </div>
        <div class="setting-item">
          <label for="breakInterval">Break Interval (minutes)</label>
          <input type="range" id="breakInterval" data-setting="alerts.breakInterval" 
                 min="5" max="120" step="5">
          <span class="range-value"></span>
        </div>
      </div>

      <div class="settings-section">
        <h4>💡 Tips and Guidance</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="alerts.enableTips">
            <span>Enable posture tips</span>
          </label>
        </div>
        <div class="setting-item">
          <label for="tipFrequency">Tip Frequency</label>
          <select id="tipFrequency" data-setting="alerts.tipFrequency">
            <option value="disabled">Disabled</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
          </select>
        </div>
      </div>
    `;
  }

  renderSessionSettings() {
    return `
      <div class="settings-section">
        <h4>📊 Session Management</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="sessions.autoSaveReports">
            <span>Auto-save session reports</span>
          </label>
        </div>
        <div class="setting-item">
          <label for="sessionTimeout">Session Timeout (minutes)</label>
          <input type="range" id="sessionTimeout" data-setting="sessions.sessionTimeout" 
                 min="5" max="180" step="5">
          <span class="range-value"></span>
        </div>
        <div class="setting-item">
          <label for="defaultSessionDuration">Default Session Duration (minutes)</label>
          <input type="range" id="defaultSessionDuration" data-setting="sessions.defaultSessionDuration" 
                 min="10" max="480" step="10">
          <span class="range-value"></span>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="sessions.enableSessionGoals">
            <span>Enable session goals</span>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <h4>📄 Export Settings</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="sessions.includeScreenshots">
            <span>Include screenshots in reports</span>
          </label>
        </div>
        <div class="setting-item">
          <label for="exportFormat">Default Export Format</label>
          <select id="exportFormat" data-setting="sessions.exportFormat">
            <option value="pdf">PDF Report</option>
            <option value="csv">CSV Data</option>
            <option value="json">JSON Data</option>
          </select>
        </div>
      </div>
    `;
  }

  renderExerciseSettings() {
    return `
      <div class="settings-section">
        <h4>🤸‍♀️ Exercise Preferences</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="exercises.enabled">
            <span>Enable exercise recommendations</span>
          </label>
        </div>
        <div class="setting-item">
          <label for="difficultyLevel">Difficulty Level</label>
          <select id="difficultyLevel" data-setting="exercises.difficultyLevel">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div class="setting-item">
          <label for="reminderFrequency">Exercise Reminder Frequency</label>
          <select id="reminderFrequency" data-setting="exercises.reminderFrequency">
            <option value="disabled">Disabled</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
          </select>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="exercises.autoStartTimer">
            <span>Auto-start exercise timer</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="exercises.showInstructions">
            <span>Show detailed instructions</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="exercises.enableProgressTracking">
            <span>Enable progress tracking</span>
          </label>
        </div>
      </div>
    `;
  }

  renderPrivacySettings() {
    return `
      <div class="settings-section">
        <h4>🔒 Data Privacy</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="privacy.allowTelemetry">
            <span>Allow anonymous usage analytics</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="privacy.saveLocalData">
            <span>Save data locally</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="privacy.shareAnalytics">
            <span>Share analytics for product improvement</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="privacy.autoBackup">
            <span>Auto-backup data to cloud</span>
          </label>
        </div>
        <div class="setting-item">
          <label for="dataRetentionDays">Data Retention (days)</label>
          <input type="range" id="dataRetentionDays" data-setting="privacy.dataRetentionDays" 
                 min="1" max="365" step="1">
          <span class="range-value"></span>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="privacy.requireAuthForData">
            <span>Require authentication for data access</span>
          </label>
        </div>
      </div>
    `;
  }

  renderAccessibilitySettings() {
    return `
      <div class="settings-section">
        <h4>♿ Accessibility Options</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="accessibility.highContrast">
            <span>High contrast mode</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="accessibility.largeText">
            <span>Large text</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="accessibility.reduceAnimations">
            <span>Reduce animations</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="accessibility.enableScreenReader">
            <span>Screen reader support</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="accessibility.keyboardNavigation">
            <span>Enhanced keyboard navigation</span>
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" data-setting="accessibility.focusIndicators">
            <span>Enhanced focus indicators</span>
          </label>
        </div>
        <div class="setting-item">
          <label for="colorBlindMode">Color blind support</label>
          <select id="colorBlindMode" data-setting="accessibility.colorBlindMode">
            <option value="none">None</option>
            <option value="protanopia">Protanopia</option>
            <option value="deuteranopia">Deuteranopia</option>
            <option value="tritanopia">Tritanopia</option>
          </select>
        </div>
      </div>
    `;
  }

  bindSettingControls() {
    const controls = this.settingsModal.querySelectorAll('[data-setting]');
    
    controls.forEach(control => {
      const settingPath = control.dataset.setting;
      const currentValue = this.getNestedValue(this.settings, settingPath);
      
      // Set current value
      if (control.type === 'checkbox') {
        control.checked = currentValue;
      } else if (control.type === 'range') {
        control.value = currentValue;
        this.updateRangeValue(control);
      } else {
        control.value = currentValue;
      }
      
      // Bind change events
      control.addEventListener('change', (event) => {
        this.handleSettingChange(settingPath, event.target);
      });

      // Special handling for range inputs
      if (control.type === 'range') {
        control.addEventListener('input', (event) => {
          this.updateRangeValue(event.target);
        });
      }
    });
  }

  handleSettingChange(settingPath, control) {
    let value = control.value;
    
    if (control.type === 'checkbox') {
      value = control.checked;
    } else if (control.type === 'range') {
      value = parseFloat(control.value);
    } else if (!isNaN(control.value) && control.value !== '') {
      value = parseFloat(control.value);
    }
    
    // Validate the value
    if (!this.validateSetting(settingPath, value)) {
      this.showSettingsError(`Invalid value for ${settingPath}`);
      return;
    }
    
    // Update settings
    this.setNestedValue(this.settings, settingPath, value);
    this.unsavedChanges = true;
    this.updateSettingsStatus('Modified');
    
    // Apply setting immediately if it's a visual setting
    this.applyImmediateSetting(settingPath, value);
  }

  applyImmediateSetting(settingPath, value) {
    // Apply certain settings immediately for better UX
    const category = settingPath.split('.')[0];
    
    switch (category) {
      case 'application':
        if (settingPath === 'application.theme') {
          this.applyTheme(value);
        }
        break;
      case 'accessibility':
        this.applyAccessibilitySettings();
        break;
      case 'overlays':
        this.applyOverlaySettings();
        break;
    }
  }

  validateSetting(settingPath, value) {
    const rule = this.validationRules[settingPath];
    
    if (!rule) return true;
    
    if (Array.isArray(rule)) {
      return rule.includes(value);
    }
    
    if (typeof rule === 'object' && rule.min !== undefined && rule.max !== undefined) {
      return value >= rule.min && value <= rule.max;
    }
    
    return true;
  }

  updateRangeValue(rangeInput) {
    const valueSpan = rangeInput.parentNode.querySelector('.range-value');
    if (valueSpan) {
      valueSpan.textContent = rangeInput.value;
    }
  }

  // Settings persistence
  saveSettings() {
    try {
      // Validate all settings
      const isValid = this.validateAllSettings();
      
      if (!isValid) {
        this.showSettingsError('Some settings have invalid values. Please check and try again.');
        return;
      }
      
      // Save to localStorage
      localStorage.setItem('proPostureSettings', JSON.stringify(this.settings));
      
      // Apply all settings
      this.applySettings();
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('settings-saved', {
        detail: { settings: this.settings }
      }));
      
      this.unsavedChanges = false;
      this.updateSettingsStatus('Saved successfully');
      
      // Show success message
      if (this.alertsManager) {
        this.alertsManager.showVisualAlert({
          id: 'settings_saved',
          level: 'success',
          message: 'Settings saved successfully!',
          timestamp: Date.now(),
          actions: [{ text: 'OK', action: 'dismiss' }]
        });
      }
      
      // Close modal after successful save
      setTimeout(() => this.closeSettings(), 1000);
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showSettingsError('Failed to save settings. Please try again.');
    }
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('proPostureSettings');
      if (saved) {
        const savedSettings = JSON.parse(saved);
        this.settings = this.mergeSettings(this.defaultSettings, savedSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
    }
  }

  loadCurrentSettings() {
    // Load fresh copy for editing
    this.editingSettings = JSON.parse(JSON.stringify(this.settings));
  }

  cancelSettings() {
    this.settings = JSON.parse(JSON.stringify(this.editingSettings));
    this.unsavedChanges = false;
    this.closeSettings();
  }

  resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
      this.renderTabContent();
      this.unsavedChanges = true;
      this.updateSettingsStatus('Reset to defaults');
    }
  }

  // Settings application
  applySettings() {
    this.applyTheme(this.settings.application.theme);
    this.applyVideoSettings();
    this.applyAnalysisSettings();
    this.applyOverlaySettings();
    this.applyAlertSettings();
    this.applyAccessibilitySettings();
    this.applyPerformanceSettings();
  }

  applyTheme(theme) {
    const body = document.body;
    
    body.classList.remove('theme-light', 'theme-dark');
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      body.classList.add(`theme-${theme}`);
    }
  }

  applyVideoSettings() {
    if (this.videoControlsManager) {
      // Apply video settings through video controls manager
      const videoSettings = this.settings.video;
      
      // These would be applied when video is initialized
      this.videoControlsManager.updateSettings?.(videoSettings);
    }
  }

  applyAnalysisSettings() {
    // Apply analysis settings to posture analyzer
    const analysisSettings = this.settings.analysis;
    
    window.dispatchEvent(new CustomEvent('analysis-settings-changed', {
      detail: analysisSettings
    }));
  }

  applyOverlaySettings() {
    // Apply overlay settings
    const overlaySettings = this.settings.overlays;
    
    window.dispatchEvent(new CustomEvent('overlay-settings-changed', {
      detail: overlaySettings
    }));
  }

  applyAlertSettings() {
    if (this.alertsManager) {
      const alertSettings = this.settings.alerts;
      this.alertsManager.updateSettings?.(alertSettings);
    }
  }

  applyAccessibilitySettings() {
    const a11ySettings = this.settings.accessibility;
    const body = document.body;
    
    body.classList.toggle('high-contrast', a11ySettings.highContrast);
    body.classList.toggle('large-text', a11ySettings.largeText);
    body.classList.toggle('reduce-animations', a11ySettings.reduceAnimations);
    body.classList.toggle('keyboard-navigation', a11ySettings.keyboardNavigation);
    
    // Apply color blind mode
    body.className = body.className.replace(/color-blind-\w+/, '');
    if (a11ySettings.colorBlindMode !== 'none') {
      body.classList.add(`color-blind-${a11ySettings.colorBlindMode}`);
    }
  }

  applyPerformanceSettings() {
    const perfSettings = this.settings.performance;
    
    window.dispatchEvent(new CustomEvent('performance-settings-changed', {
      detail: perfSettings
    }));
  }

  // Utility methods
  validateAllSettings() {
    for (const [path, rule] of Object.entries(this.validationRules)) {
      const value = this.getNestedValue(this.settings, path);
      if (!this.validateSetting(path, value)) {
        return false;
      }
    }
    return true;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((o, p) => o && o[p], obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const nested = keys.reduce((o, k) => o[k] = o[k] || {}, obj);
    nested[lastKey] = value;
  }

  mergeSettings(defaults, saved) {
    const merged = JSON.parse(JSON.stringify(defaults));
    
    function deepMerge(target, source) {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          target[key] = target[key] || {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
    
    deepMerge(merged, saved);
    return merged;
  }

  updateSettingsStatus(message) {
    const statusElement = this.settingsModal.querySelector('#settingsStatus .status-text');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  showSettingsError(message) {
    this.updateSettingsStatus(`Error: ${message}`);
    
    if (this.alertsManager) {
      this.alertsManager.showVisualAlert({
        id: 'settings_error',
        level: 'error',
        message: message,
        timestamp: Date.now(),
        actions: [{ text: 'OK', action: 'dismiss' }]
      });
    }
  }

  // Import/Export functionality
  exportSettings() {
    const dataStr = JSON.stringify(this.settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `proposture-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }

  importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedSettings = JSON.parse(e.target.result);
            this.settings = this.mergeSettings(this.defaultSettings, importedSettings);
            this.renderTabContent();
            this.unsavedChanges = true;
            this.updateSettingsStatus('Settings imported');
          } catch (error) {
            this.showSettingsError('Invalid settings file');
          }
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  }

  // External event handlers
  handleSystemThemeChange() {
    if (this.settings.application.theme === 'auto') {
      this.applyTheme('auto');
    }
  }

  handleExternalSettingsChange(changes) {
    // Handle settings changes from other components
    Object.assign(this.settings, changes);
    this.saveSettings();
  }

  // Public API
  getSetting(path) {
    return this.getNestedValue(this.settings, path);
  }

  setSetting(path, value) {
    if (this.validateSetting(path, value)) {
      this.setNestedValue(this.settings, path, value);
      this.applyImmediateSetting(path, value);
      return true;
    }
    return false;
  }

  getAllSettings() {
    return JSON.parse(JSON.stringify(this.settings));
  }

  resetSetting(path) {
    const defaultValue = this.getNestedValue(this.defaultSettings, path);
    this.setNestedValue(this.settings, path, defaultValue);
    this.applyImmediateSetting(path, defaultValue);
  }

  isSettingsOpen() {
    return this.settingsModal.classList.contains('show');
  }

  // Additional utility methods
  refreshCameraList() {
    // This would be implemented to refresh the camera device list
    console.log('Refreshing camera list...');
    // Integration with camera manager would go here
  }

  // Cleanup
  destroy() {
    if (this.settingsModal && this.settingsModal.parentNode) {
      this.settingsModal.parentNode.removeChild(this.settingsModal);
    }
  }
}

// Export for ES6 modules
export default SettingsManager;

// Also make available globally
window.SettingsManager = SettingsManager;