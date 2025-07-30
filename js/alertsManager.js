/**
 * Alerts Manager for ProPostureFitness
 * Handles real-time posture alerts, notifications, and feedback system
 */

class AlertsManager {
  constructor(apiService, metricsManager) {
    this.api = apiService;
    this.metricsManager = metricsManager;
    
    // Alert state
    this.isAlertsEnabled = true;
    this.alertThresholds = {
      poorPosture: 40,     // Score below 40% triggers immediate alert
      fairPosture: 60,     // Score below 60% triggers warning
      goodPosture: 70,     // Score above 70% is considered good
      excellentPosture: 85 // Score above 85% is excellent
    };
    
    // Alert timing
    this.alertIntervals = {
      immediate: 0,        // Immediate alerts for critical issues
      warning: 30000,      // 30 seconds for warnings
      reminder: 300000,    // 5 minutes for reminders
      encouragement: 600000 // 10 minutes for positive feedback
    };
    
    // Alert history and state
    this.alertHistory = [];
    this.lastAlerts = new Map();
    this.consecutiveAlerts = new Map();
    this.alertCounts = {
      poor: 0,
      fair: 0,
      good: 0,
      excellent: 0
    };
    
    // Sound settings
    this.soundEnabled = true;
    this.soundVolume = 0.5;
    this.audioContext = null;
    
    // Notification permissions
    this.notificationPermission = 'default';
    
    // Break reminders
    this.breakReminders = {
      enabled: true,
      interval: 1800000, // 30 minutes
      lastReminder: 0
    };
    
    // Progressive alerts
    this.progressiveAlerts = {
      enabled: true,
      escalationSteps: [
        { duration: 30000, type: 'gentle' },    // 30s gentle reminder
        { duration: 60000, type: 'warning' },   // 1min warning
        { duration: 120000, type: 'urgent' },   // 2min urgent
        { duration: 300000, type: 'critical' }  // 5min critical
      ],
      currentStep: 0,
      startTime: null
    };
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.loadSettings();
    await this.requestNotificationPermission();
    this.setupAudioContext();
    this.startAlertMonitoring();
    this.setupBreakReminders();
  }

  setupEventListeners() {
    // Listen for metrics updates
    if (this.metricsManager) {
      // Override the metricsManager's updateMetrics to include alert checking
      const originalUpdateMetrics = this.metricsManager.updateMetrics.bind(this.metricsManager);
      this.metricsManager.updateMetrics = (metrics) => {
        originalUpdateMetrics(metrics);
        this.processMetricsForAlerts(metrics);
      };
    }

    // Settings controls
    document.getElementById('alertsEnabled')?.addEventListener('change', (e) => {
      this.toggleAlerts(e.target.checked);
    });

    document.getElementById('soundEnabled')?.addEventListener('change', (e) => {
      this.toggleSound(e.target.checked);
    });

    document.getElementById('breakRemindersEnabled')?.addEventListener('change', (e) => {
      this.toggleBreakReminders(e.target.checked);
    });

    // Threshold controls
    document.getElementById('poorPostureThreshold')?.addEventListener('input', (e) => {
      this.updateThreshold('poorPosture', parseInt(e.target.value, 10));
    });

    document.getElementById('fairPostureThreshold')?.addEventListener('input', (e) => {
      this.updateThreshold('fairPosture', parseInt(e.target.value, 10));
    });
  }

  async requestNotificationPermission() {
    if ('Notification' in window) {
      this.notificationPermission = await Notification.requestPermission();
    }
  }

  setupAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  processMetricsForAlerts(metrics) {
    if (!this.isAlertsEnabled) {return;}

    const score = metrics.postureScore || 0;
    const timestamp = Date.now();

    // Determine alert level
    const alertLevel = this.determineAlertLevel(score);
    
    // Check for progressive alerts
    if (this.shouldTriggerAlert(alertLevel, timestamp)) {
      this.triggerAlert(alertLevel, score, metrics);
    }

    // Update progressive alert tracking
    this.updateProgressiveAlerts(alertLevel, timestamp);

    // Check for break reminders
    this.checkBreakReminders(timestamp);

    // Store alert data
    this.recordAlertData(alertLevel, score, timestamp);
  }

  determineAlertLevel(score) {
    if (score < this.alertThresholds.poorPosture) {return 'poor';}
    if (score < this.alertThresholds.fairPosture) {return 'fair';}
    if (score < this.alertThresholds.goodPosture) {return 'warning';}
    if (score >= this.alertThresholds.excellentPosture) {return 'excellent';}
    return 'good';
  }

  shouldTriggerAlert(alertLevel, timestamp) {
    const lastAlert = this.lastAlerts.get(alertLevel) || 0;
    const interval = this.getAlertInterval(alertLevel);
    
    return (timestamp - lastAlert) >= interval;
  }

  getAlertInterval(alertLevel) {
    switch (alertLevel) {
      case 'poor': return this.alertIntervals.immediate;
      case 'fair': return this.alertIntervals.warning;
      case 'warning': return this.alertIntervals.warning;
      case 'good': return this.alertIntervals.encouragement;
      case 'excellent': return this.alertIntervals.encouragement;
      default: return this.alertIntervals.warning;
    }
  }

  async triggerAlert(alertLevel, score, metrics) {
    const timestamp = Date.now();
    
    // Create alert object
    const alert = {
      id: `alert_${timestamp}`,
      level: alertLevel,
      score,
      timestamp,
      metrics,
      message: this.generateAlertMessage(alertLevel, score, metrics),
      actions: this.generateAlertActions(alertLevel)
    };

    // Display visual alert
    this.showVisualAlert(alert);

    // Play sound if enabled
    if (this.soundEnabled) {
      this.playAlertSound(alertLevel);
    }

    // Show browser notification
    if (this.notificationPermission === 'granted') {
      this.showBrowserNotification(alert);
    }

    // Send to header notifications
    this.addToHeaderNotifications(alert);

    // Update alert tracking
    this.lastAlerts.set(alertLevel, timestamp);
    this.alertCounts[alertLevel]++;
    this.alertHistory.push(alert);

    // Keep history manageable
    if (this.alertHistory.length > 100) {
      this.alertHistory.shift();
    }

    // Send to backend if available
    if (this.api && this.api.isAuthenticated()) {
      this.sendAlertToBackend(alert);
    }

  }

  generateAlertMessage(alertLevel, score, metrics) {
    const messages = {
      poor: [
        `Poor posture detected (${Math.round(score)}%). Please adjust your position.`,
        `Time to sit up straight! Your posture score is ${Math.round(score)}%.`,
        `Posture alert: ${Math.round(score)}%. Check your alignment.`
      ],
      fair: [
        `Your posture could improve (${Math.round(score)}%). Small adjustments can help.`,
        `Posture reminder: ${Math.round(score)}%. Try sitting up straighter.`,
        `Consider adjusting your position. Current score: ${Math.round(score)}%.`
      ],
      warning: [
        `Posture needs attention (${Math.round(score)}%). Take a moment to realign.`,
        `Your posture is slipping (${Math.round(score)}%). Time for an adjustment.`
      ],
      good: [
        `Good posture! Keep it up (${Math.round(score)}%).`,
        `Nice work maintaining good posture (${Math.round(score)}%).`
      ],
      excellent: [
        `Excellent posture! (${Math.round(score)}%) You're doing great!`,
        `Perfect posture maintained (${Math.round(score)}%). Outstanding!`,
        `Stellar posture work! ${Math.round(score)}% - keep it going!`
      ]
    };

    const levelMessages = messages[alertLevel] || messages.fair;
    const randomMessage = levelMessages[Math.floor(Math.random() * levelMessages.length)];

    // Add specific advice based on metrics
    if (metrics.forwardHeadDistance > 5) {
      return `${randomMessage} Try moving your monitor higher to reduce neck strain.`;
    }
    if (metrics.shoulderHeightDiff > 3) {
      return `${randomMessage} Check your chair height and arm position.`;
    }

    return randomMessage;
  }

  generateAlertActions(alertLevel) {
    const actions = {
      poor: [
        { text: 'Fix Posture', action: 'guidance' },
        { text: 'Take Break', action: 'break' },
        { text: 'Dismiss', action: 'dismiss' }
      ],
      fair: [
        { text: 'Show Tips', action: 'tips' },
        { text: 'Dismiss', action: 'dismiss' }
      ],
      warning: [
        { text: 'Adjust Position', action: 'guidance' },
        { text: 'Dismiss', action: 'dismiss' }
      ],
      good: [
        { text: 'Great!', action: 'dismiss' }
      ],
      excellent: [
        { text: 'Awesome!', action: 'dismiss' }
      ]
    };

    return actions[alertLevel] || actions.fair;
  }

  showVisualAlert(alert) {
    // Create or update alert popup
    let alertPopup = document.getElementById('postureAlert');
    
    if (!alertPopup) {
      alertPopup = document.createElement('div');
      alertPopup.id = 'postureAlert';
      alertPopup.className = 'posture-alert-popup';
      document.body.appendChild(alertPopup);
    }

    // Set alert styling based on level
    alertPopup.className = `posture-alert-popup alert-${alert.level}`;
    
    alertPopup.innerHTML = `
      <div class="alert-content">
        <div class="alert-icon">${this.getAlertIcon(alert.level)}</div>
        <div class="alert-message">
          <div class="alert-title">${this.getAlertTitle(alert.level)}</div>
          <div class="alert-text">${alert.message}</div>
        </div>
        <div class="alert-actions">
          ${alert.actions.map(action => 
            `<button class="alert-action-btn" data-action="${action.action}">${action.text}</button>`
          ).join('')}
        </div>
        <button class="alert-close-btn" data-action="dismiss">&times;</button>
      </div>
    `;

    // Add event listeners
    alertPopup.querySelectorAll('.alert-action-btn, .alert-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleAlertAction(action, alert);
      });
    });

    // Show with animation
    alertPopup.style.display = 'block';
    setTimeout(() => alertPopup.classList.add('show'), 10);

    // Auto-hide positive alerts
    if (alert.level === 'good' || alert.level === 'excellent') {
      setTimeout(() => this.hideAlert(), 3000);
    }
  }

  getAlertIcon(level) {
    const icons = {
      poor: '🚨',
      fair: '⚠️',
      warning: '💡',
      good: '👍',
      excellent: '🎯'
    };
    return icons[level] || '💡';
  }

  getAlertTitle(level) {
    const titles = {
      poor: 'Posture Alert',
      fair: 'Posture Reminder',
      warning: 'Posture Check',
      good: 'Good Posture!',
      excellent: 'Excellent Posture!'
    };
    return titles[level] || 'Posture Update';
  }

  handleAlertAction(action, _alert) {
    switch (action) {
      case 'guidance':
        this.showPostureGuidance();
        break;
      case 'tips':
        this.showPostureTips();
        break;
      case 'break':
        this.suggestBreak();
        break;
      case 'dismiss':
      default:
        this.hideAlert();
        break;
    }
  }

  hideAlert() {
    const alertPopup = document.getElementById('postureAlert');
    if (alertPopup) {
      alertPopup.classList.remove('show');
      setTimeout(() => {
        alertPopup.style.display = 'none';
      }, 300);
    }
  }

  playAlertSound(alertLevel) {
    if (!this.audioContext) {return;}

    // Generate different tones for different alert levels
    const frequencies = {
      poor: 220,      // Low tone for poor posture
      fair: 330,      // Mid tone for fair posture
      warning: 440,   // Standard tone for warnings
      good: 523,      // Higher tone for good posture
      excellent: 659  // Highest tone for excellent posture
    };

    const frequency = frequencies[alertLevel] || 440;
    const duration = alertLevel === 'poor' ? 0.5 : 0.2;

    this.generateTone(frequency, duration);
  }

  generateTone(frequency, duration) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.soundVolume * 0.1, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  showBrowserNotification(alert) {
    new Notification(alert.message, {
      icon: '/assets/favicon.ico',
      badge: '/assets/favicon.ico',
      tag: 'posture-alert',
      renotify: true,
      requireInteraction: alert.level === 'poor'
    });
  }

  addToHeaderNotifications(alert) {
    // Add to header notifications system
    if (window.headerManager) {
      window.headerManager.addNotification({
        id: alert.id,
        type: alert.level,
        title: this.getAlertTitle(alert.level),
        message: alert.message,
        timestamp: alert.timestamp,
        read: false
      });
    }
  }

  updateProgressiveAlerts(alertLevel, timestamp) {
    if (!this.progressiveAlerts.enabled) {return;}

    if (alertLevel === 'poor' || alertLevel === 'fair') {
      // Start or continue progressive alert tracking
      if (!this.progressiveAlerts.startTime) {
        this.progressiveAlerts.startTime = timestamp;
        this.progressiveAlerts.currentStep = 0;
      }

      const duration = timestamp - this.progressiveAlerts.startTime;
      const steps = this.progressiveAlerts.escalationSteps;
      
      // Check if we should escalate
      for (let i = this.progressiveAlerts.currentStep; i < steps.length; i++) {
        if (duration >= steps[i].duration) {
          this.progressiveAlerts.currentStep = i + 1;
          this.triggerProgressiveAlert(steps[i].type, duration);
        }
      }
    } else {
      // Reset progressive alerts for good posture
      this.progressiveAlerts.startTime = null;
      this.progressiveAlerts.currentStep = 0;
    }
  }

  triggerProgressiveAlert(type, duration) {
    const minutes = Math.floor(duration / 60000);
    const message = `Poor posture for ${minutes} minute${minutes !== 1 ? 's' : ''}. ${this.getProgressiveMessage(type)}`;
    
    this.showVisualAlert({
      id: `progressive_${Date.now()}`,
      level: type === 'critical' ? 'poor' : 'fair',
      message,
      timestamp: Date.now(),
      actions: this.generateAlertActions('poor')
    });
  }

  getProgressiveMessage(type) {
    const messages = {
      gentle: 'Consider adjusting your position.',
      warning: 'Please take action to improve your posture.',
      urgent: 'Your posture needs immediate attention!',
      critical: 'Critical: Take a break and reset your position!'
    };
    return messages[type] || messages.gentle;
  }

  checkBreakReminders(timestamp) {
    if (!this.breakReminders.enabled) {return;}

    const timeSinceLastReminder = timestamp - this.breakReminders.lastReminder;
    
    if (timeSinceLastReminder >= this.breakReminders.interval) {
      this.triggerBreakReminder();
      this.breakReminders.lastReminder = timestamp;
    }
  }

  triggerBreakReminder() {
    const alert = {
      id: `break_${Date.now()}`,
      level: 'reminder',
      message: 'Time for a posture break! Stand up, stretch, and reset your position.',
      timestamp: Date.now(),
      actions: [
        { text: 'Start Break', action: 'break' },
        { text: 'Remind Later', action: 'snooze' },
        { text: 'Dismiss', action: 'dismiss' }
      ]
    };

    this.showVisualAlert(alert);
  }

  showPostureGuidance() {
    // Show posture guidance modal/overlay
    // This would open a guidance modal with posture tips
  }

  showPostureTips() {
    // Show posture tips
    // This would display contextual tips
  }

  suggestBreak() {
    // Suggest break activities
    // This would show break exercise suggestions
  }

  recordAlertData(alertLevel, score, timestamp) {
    // Record for analytics
    const _data = {
      level: alertLevel,
      score,
      timestamp,
      sessionId: this.metricsManager?.sessionId
    };

    // Could be used for reporting and analysis
  }

  async sendAlertToBackend(alert) {
    try {
      await this.api.logAlert({
        alertId: alert.id,
        level: alert.level,
        score: alert.score,
        message: alert.message,
        timestamp: alert.timestamp,
        sessionId: this.metricsManager?.sessionId
      });
    } catch (error) {
      console.error('Failed to send alert to backend:', error);
    }
  }

  startAlertMonitoring() {
    // Start monitoring loop
    setInterval(() => {
      this.checkSystemHealth();
    }, 10000); // Check every 10 seconds
  }

  checkSystemHealth() {
    // Monitor system health and trigger alerts if needed
    // This could check for camera disconnection, poor performance, etc.
  }

  setupBreakReminders() {
    // Initialize break reminder system
    this.breakReminders.lastReminder = Date.now();
  }

  // Settings methods
  toggleAlerts(enabled) {
    this.isAlertsEnabled = enabled;
    this.saveSettings();
  }

  toggleSound(enabled) {
    this.soundEnabled = enabled;
    this.saveSettings();
  }

  toggleBreakReminders(enabled) {
    this.breakReminders.enabled = enabled;
    this.saveSettings();
  }

  updateThreshold(type, value) {
    this.alertThresholds[type] = value;
    this.saveSettings();
  }

  saveSettings() {
    const settings = {
      isAlertsEnabled: this.isAlertsEnabled,
      alertThresholds: this.alertThresholds,
      soundEnabled: this.soundEnabled,
      soundVolume: this.soundVolume,
      breakReminders: this.breakReminders,
      progressiveAlerts: this.progressiveAlerts
    };

    localStorage.setItem('postureAlertsSettings', JSON.stringify(settings));
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('postureAlertsSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        Object.assign(this, settings);
      }
    } catch (error) {
      console.error('Failed to load alert settings:', error);
    }
  }

  // Public API
  getAlertHistory() {
    return [...this.alertHistory];
  }

  getAlertStats() {
    return {
      counts: { ...this.alertCounts },
      totalAlerts: this.alertHistory.length,
      recentAlerts: this.alertHistory.slice(-10)
    };
  }

  clearAlertHistory() {
    this.alertHistory = [];
    this.alertCounts = { poor: 0, fair: 0, good: 0, excellent: 0 };
  }
}

// Export for ES6 modules
export default AlertsManager;

// Also make available globally
window.AlertsManager = AlertsManager;
