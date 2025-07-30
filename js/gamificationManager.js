/**
 * Gamification Manager for ProPostureFitness
 * Handles achievements, streaks, points, levels, and motivational features
 */

class GamificationManager {
  constructor(apiService, metricsManager, alertsManager) {
    this.api = apiService;
    this.metricsManager = metricsManager;
    this.alertsManager = alertsManager;
    
    // Player stats
    this.playerStats = {
      level: 1,
      experience: 0,
      totalPoints: 0,
      sessionsCompleted: 0,
      totalTime: 0,
      bestStreak: 0,
      currentStreak: 0,
      achievements: [],
      badges: [],
      lastSessionDate: null
    };
    
    // Current session tracking
    this.currentSession = {
      startTime: null,
      duration: 0,
      averageScore: 0,
      goodPostureTime: 0,
      pointsEarned: 0,
      achievementsUnlocked: [],
      isActive: false
    };
    
    // Point system
    this.pointRules = {
      goodPosture: 1,        // 1 point per second of good posture (>70%)
      excellentPosture: 2,   // 2 points per second of excellent posture (>85%)
      sessionComplete: 50,   // 50 points for completing a session
      streakBonus: 25,       // 25 points per day in streak
      achievementBonus: 100, // 100 points per achievement
      dailyGoal: 200,        // 200 points for reaching daily goal
      weeklyGoal: 1000       // 1000 points for reaching weekly goal
    };
    
    // Level system
    this.levelSystem = {
      baseExp: 1000,         // Experience needed for level 2
      expMultiplier: 1.5,    // Multiplier for each level
      maxLevel: 50,
      levelNames: {
        1: 'Novice', 5: 'Apprentice', 10: 'Student', 15: 'Practitioner',
        20: 'Expert', 25: 'Master', 30: 'Grandmaster', 35: 'Legend',
        40: 'Champion', 45: 'Elite', 50: 'Posture Perfectionist'
      }
    };
    
    // Achievements system
    this.achievements = {
      // Time-based achievements
      first_session: {
        id: 'first_session',
        name: 'First Steps',
        description: 'Complete your first posture session',
        icon: '🎯',
        points: 100,
        category: 'milestone',
        condition: (stats) => stats.sessionsCompleted >= 1
      },
      
      consistent_week: {
        id: 'consistent_week',
        name: 'Week Warrior',
        description: 'Maintain good posture for 7 days in a row',
        icon: '🔥',
        points: 500,
        category: 'streak',
        condition: (stats) => stats.currentStreak >= 7
      },
      
      posture_master: {
        id: 'posture_master',
        name: 'Posture Master',
        description: 'Achieve 90%+ average posture score in a session',
        icon: '👑',
        points: 300,
        category: 'performance',
        condition: (session) => session.averageScore >= 90
      },
      
      marathon_session: {
        id: 'marathon_session',
        name: 'Marathon Sitter',
        description: 'Complete a 2-hour session with 80%+ good posture',
        icon: '🏃‍♂️',
        points: 400,
        category: 'endurance',
        condition: (session) => session.duration >= 7200000 && session.goodPostureTime / session.duration >= 0.8
      },
      
      early_bird: {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Start a session before 8 AM',
        icon: '🌅',
        points: 150,
        category: 'time',
        condition: () => new Date().getHours() < 8
      },
      
      night_owl: {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Complete a session after 10 PM',
        icon: '🦉',
        points: 150,
        category: 'time',
        condition: () => new Date().getHours() >= 22
      },
      
      perfect_posture: {
        id: 'perfect_posture',
        name: 'Perfect Posture',
        description: 'Maintain 100% posture score for 5 minutes',
        icon: '💎',
        points: 250,
        category: 'performance',
        condition: 'special' // Handled separately
      },
      
      centurion: {
        id: 'centurion',
        name: 'Centurion',
        description: 'Complete 100 posture sessions',
        icon: '🏛️',
        points: 1000,
        category: 'milestone',
        condition: (stats) => stats.sessionsCompleted >= 100
      },
      
      streak_legend: {
        id: 'streak_legend',
        name: 'Streak Legend',
        description: 'Maintain a 30-day streak',
        icon: '⚡',
        points: 2000,
        category: 'streak',
        condition: (stats) => stats.currentStreak >= 30
      },
      
      point_collector: {
        id: 'point_collector',
        name: 'Point Collector',
        description: 'Earn 10,000 total points',
        icon: '💰',
        points: 500,
        category: 'milestone',
        condition: (stats) => stats.totalPoints >= 10000
      }
    };
    
    // Badge system
    this.badges = {
      daily_goal: { name: 'Daily Champion', icon: '🌟', description: 'Reached daily point goal' },
      weekly_goal: { name: 'Weekly Hero', icon: '🏆', description: 'Reached weekly point goal' },
      perfect_week: { name: 'Perfect Week', icon: '💫', description: '7 perfect days in a row' },
      improvement: { name: 'Getting Better', icon: '📈', description: 'Improved posture score by 20%' },
      consistency: { name: 'Consistent', icon: '🎯', description: 'Completed 5 sessions this week' }
    };
    
    // Goal system
    this.goals = {
      daily: {
        pointsTarget: 500,
        timeTarget: 3600000, // 1 hour
        sessionsTarget: 2
      },
      weekly: {
        pointsTarget: 3000,
        timeTarget: 21600000, // 6 hours
        sessionsTarget: 10
      }
    };
    
    // Motivation messages
    this.motivationMessages = {
      levelUp: [
        "🎉 Level up! You're becoming a posture pro!",
        '🚀 New level achieved! Your dedication is paying off!',
        '⭐ Congratulations on reaching level {level}!',
        '🎯 Level {level} unlocked! Keep up the great work!'
      ],
      achievement: [
        '🏆 Achievement unlocked: {name}!',
        "💪 You've earned the {name} achievement!",
        '🌟 Incredible! {name} achievement completed!',
        '🎊 Congratulations on earning {name}!'
      ],
      streak: [
        "🔥 {days} day streak! You're on fire!",
        '⚡ Amazing {days} day streak! Keep it going!',
        "🎯 {days} days in a row! You're unstoppable!",
        '💫 {days} day streak! Consistency is key!'
      ],
      encouragement: [
        '💪 Great posture! Keep it up!',
        "🌟 You're doing amazing! Stay strong!",
        "🎯 Perfect form! You're a natural!",
        '⭐ Excellent work! Your posture is improving!'
      ]
    };
    
    this.init();
  }

  async init() {
    this.loadPlayerStats();
    this.setupEventListeners();
    this.updateUI();
    this.startTracking();
  }

  setupEventListeners() {
    // Listen for session events
    if (this.metricsManager) {
      // Monitor session start/end
      const originalStartSession = this.metricsManager.startSession.bind(this.metricsManager);
      this.metricsManager.startSession = async () => {
        await originalStartSession();
        this.startGameSession();
      };

      const originalEndSession = this.metricsManager.endSession.bind(this.metricsManager);
      this.metricsManager.endSession = async () => {
        await this.endGameSession();
        await originalEndSession();
      };
    }

    // Listen for metrics updates for real-time point tracking
    window.addEventListener('analysis-result', (event) => {
      this.processMetricsForGamification(event.detail);
    });

    // Daily reset check
    this.checkDailyReset();
    setInterval(() => this.checkDailyReset(), 60000); // Check every minute
  }

  startGameSession() {
    this.currentSession = {
      startTime: Date.now(),
      duration: 0,
      averageScore: 0,
      goodPostureTime: 0,
      pointsEarned: 0,
      achievementsUnlocked: [],
      isActive: true,
      scores: [],
      perfectPostureStreak: 0,
      maxPerfectStreak: 0
    };

    this.updateUI();
  }

  async endGameSession() {
    if (!this.currentSession.isActive) {return;}

    const sessionData = this.calculateSessionResults();
    
    // Award session completion points
    this.awardPoints(this.pointRules.sessionComplete, 'Session completed');
    
    // Update player stats
    this.updatePlayerStats(sessionData);
    
    // Check for achievements
    await this.checkAchievements(sessionData);
    
    // Update streak
    this.updateStreak();
    
    // Check for level up
    this.checkLevelUp();
    
    // Show session summary
    this.showSessionSummary(sessionData);
    
    // Save progress
    this.savePlayerStats();
    
    this.currentSession.isActive = false;
    this.updateUI();
  }

  calculateSessionResults() {
    const endTime = Date.now();
    const duration = endTime - this.currentSession.startTime;
    const scores = this.currentSession.scores;
    
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0;
    
    const goodScores = scores.filter(score => score >= 70);
    const excellentScores = scores.filter(score => score >= 85);
    
    return {
      duration,
      averageScore,
      goodPostureTime: this.currentSession.goodPostureTime,
      goodPosturePercentage: scores.length > 0 ? (goodScores.length / scores.length) * 100 : 0,
      excellentPosturePercentage: scores.length > 0 ? (excellentScores.length / scores.length) * 100 : 0,
      pointsEarned: this.currentSession.pointsEarned,
      maxPerfectStreak: this.currentSession.maxPerfectStreak
    };
  }

  processMetricsForGamification(metrics) {
    if (!this.currentSession.isActive) {return;}

    const score = metrics.postureScore || 0;
    this.currentSession.scores.push(score);
    
    // Award points for good posture
    if (score >= 85) {
      this.awardPoints(this.pointRules.excellentPosture / 60, 'Excellent posture'); // Per second
      this.currentSession.perfectPostureStreak++;
      this.currentSession.maxPerfectStreak = Math.max(
        this.currentSession.maxPerfectStreak, 
        this.currentSession.perfectPostureStreak
      );
    } else if (score >= 70) {
      this.awardPoints(this.pointRules.goodPosture / 60, 'Good posture'); // Per second
      this.currentSession.goodPostureTime += 1000; // Approximate 1 second
      this.currentSession.perfectPostureStreak = 0;
    } else {
      this.currentSession.perfectPostureStreak = 0;
    }

    // Check for perfect posture achievement (5 minutes = 300 seconds)
    if (this.currentSession.perfectPostureStreak >= 300) {
      this.unlockAchievement('perfect_posture');
      this.currentSession.perfectPostureStreak = 0; // Reset to prevent multiple triggers
    }

    this.updateUI();
  }

  awardPoints(points, reason = '') {
    this.currentSession.pointsEarned += points;
    this.playerStats.totalPoints += points;
    this.playerStats.experience += points;
    
    if (reason) {
      this.showPointsEarned(points, reason);
    }
  }

  updatePlayerStats(sessionData) {
    this.playerStats.sessionsCompleted++;
    this.playerStats.totalTime += sessionData.duration;
    this.playerStats.lastSessionDate = new Date().toDateString();
  }

  updateStreak() {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (this.playerStats.lastSessionDate === yesterday) {
      // Continuing streak
      this.playerStats.currentStreak++;
    } else if (this.playerStats.lastSessionDate !== today) {
      // Streak broken or starting new
      this.playerStats.currentStreak = 1;
    }
    
    // Update best streak
    this.playerStats.bestStreak = Math.max(this.playerStats.bestStreak, this.playerStats.currentStreak);
    
    // Award streak bonus points
    if (this.playerStats.currentStreak > 1) {
      const bonusPoints = this.pointRules.streakBonus * this.playerStats.currentStreak;
      this.awardPoints(bonusPoints, `${this.playerStats.currentStreak} day streak!`);
      this.showStreakMessage(this.playerStats.currentStreak);
    }
  }

  async checkAchievements(sessionData) {
    const newAchievements = [];
    
    for (const [id, achievement] of Object.entries(this.achievements)) {
      if (this.playerStats.achievements.includes(id)) {continue;}
      
      let unlocked = false;
      
      if (achievement.condition === 'special') {
        // Special achievements handled separately
        continue;
      } else if (typeof achievement.condition === 'function') {
        if (achievement.category === 'performance' || achievement.category === 'endurance') {
          unlocked = achievement.condition(sessionData);
        } else {
          unlocked = achievement.condition(this.playerStats);
        }
      }
      
      if (unlocked) {
        await this.unlockAchievement(id);
        newAchievements.push(achievement);
      }
    }
    
    return newAchievements;
  }

  async unlockAchievement(achievementId) {
    if (this.playerStats.achievements.includes(achievementId)) {return;}
    
    const achievement = this.achievements[achievementId];
    if (!achievement) {return;}
    
    this.playerStats.achievements.push(achievementId);
    this.currentSession.achievementsUnlocked.push(achievement);
    
    // Award achievement points
    this.awardPoints(achievement.points, `Achievement: ${achievement.name}`);
    
    // Show achievement notification
    this.showAchievementUnlocked(achievement);
    
    // Send to backend if available
    if (this.api && this.api.isAuthenticated()) {
      try {
        await this.api.unlockAchievement({
          achievementId,
          name: achievement.name,
          points: achievement.points,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to sync achievement:', error);
      }
    }
  }

  checkLevelUp() {
    const newLevel = this.calculateLevel(this.playerStats.experience);
    
    if (newLevel > this.playerStats.level) {
      const oldLevel = this.playerStats.level;
      this.playerStats.level = newLevel;
      
      this.showLevelUp(oldLevel, newLevel);
      
      // Award level up bonus
      this.awardPoints(newLevel * 50, `Level ${newLevel} reached!`);
    }
  }

  calculateLevel(experience) {
    let level = 1;
    let expRequired = this.levelSystem.baseExp;
    
    while (experience >= expRequired && level < this.levelSystem.maxLevel) {
      experience -= expRequired;
      level++;
      expRequired = Math.floor(expRequired * this.levelSystem.expMultiplier);
    }
    
    return level;
  }

  getExperienceToNextLevel() {
    if (this.playerStats.level >= this.levelSystem.maxLevel) {return 0;}
    
    let totalExpForCurrentLevel = 0;
    let expRequired = this.levelSystem.baseExp;
    
    for (let i = 1; i < this.playerStats.level; i++) {
      totalExpForCurrentLevel += expRequired;
      expRequired = Math.floor(expRequired * this.levelSystem.expMultiplier);
    }
    
    const expIntoCurrentLevel = this.playerStats.experience - totalExpForCurrentLevel;
    return expRequired - expIntoCurrentLevel;
  }

  // UI Update Methods
  updateUI() {
    this.updateLevelDisplay();
    this.updatePointsDisplay();
    this.updateStreakDisplay();
    this.updateProgressBars();
    this.updateAchievementsList();
  }

  updateLevelDisplay() {
    const levelEl = document.getElementById('playerLevel');
    const levelNameEl = document.getElementById('playerLevelName');
    const expEl = document.getElementById('playerExp');
    const expBarEl = document.getElementById('expProgressBar');
    
    if (levelEl) {levelEl.textContent = this.playerStats.level;}
    
    if (levelNameEl) {
      const levelName = this.levelSystem.levelNames[this.playerStats.level] || 'Practitioner';
      levelNameEl.textContent = levelName;
    }
    
    if (expEl) {
      const expToNext = this.getExperienceToNextLevel();
      expEl.textContent = `${expToNext} XP to next level`;
    }
    
    if (expBarEl) {
      const expToNext = this.getExperienceToNextLevel();
      const totalExpForLevel = this.calculateExpForLevel(this.playerStats.level + 1) - this.calculateExpForLevel(this.playerStats.level);
      const progress = ((totalExpForLevel - expToNext) / totalExpForLevel) * 100;
      expBarEl.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
  }

  calculateExpForLevel(level) {
    let totalExp = 0;
    let expRequired = this.levelSystem.baseExp;
    
    for (let i = 1; i < level; i++) {
      totalExp += expRequired;
      expRequired = Math.floor(expRequired * this.levelSystem.expMultiplier);
    }
    
    return totalExp;
  }

  updatePointsDisplay() {
    const pointsEl = document.getElementById('totalPoints');
    const sessionPointsEl = document.getElementById('sessionPoints');
    
    if (pointsEl) {pointsEl.textContent = Math.floor(this.playerStats.totalPoints).toLocaleString();}
    if (sessionPointsEl) {sessionPointsEl.textContent = Math.floor(this.currentSession.pointsEarned);}
  }

  updateStreakDisplay() {
    const streakEl = document.getElementById('currentStreak');
    const bestStreakEl = document.getElementById('bestStreak');
    
    if (streakEl) {streakEl.textContent = `${this.playerStats.currentStreak} days`;}
    if (bestStreakEl) {bestStreakEl.textContent = `${this.playerStats.bestStreak} days`;}
  }

  updateProgressBars() {
    // Daily progress
    const dailyPointsEl = document.getElementById('dailyProgress');
    if (dailyPointsEl) {
      const dailyPoints = this.getDailyPoints();
      const progress = (dailyPoints / this.goals.daily.pointsTarget) * 100;
      dailyPointsEl.style.width = `${Math.min(100, progress)}%`;
    }
    
    // Weekly progress
    const weeklyPointsEl = document.getElementById('weeklyProgress');
    if (weeklyPointsEl) {
      const weeklyPoints = this.getWeeklyPoints();
      const progress = (weeklyPoints / this.goals.weekly.pointsTarget) * 100;
      weeklyPointsEl.style.width = `${Math.min(100, progress)}%`;
    }
  }

  updateAchievementsList() {
    const achievementsContainer = document.getElementById('achievementsList');
    if (!achievementsContainer) {return;}
    
    achievementsContainer.innerHTML = '';
    
    // Show unlocked achievements
    this.playerStats.achievements.forEach(achievementId => {
      const achievement = this.achievements[achievementId];
      if (achievement) {
        const achievementEl = this.createAchievementElement(achievement, true);
        achievementsContainer.appendChild(achievementEl);
      }
    });
    
    // Show locked achievements (preview)
    const lockedAchievements = Object.values(this.achievements)
      .filter(a => !this.playerStats.achievements.includes(a.id))
      .slice(0, 5); // Show first 5 locked achievements
    
    lockedAchievements.forEach(achievement => {
      const achievementEl = this.createAchievementElement(achievement, false);
      achievementsContainer.appendChild(achievementEl);
    });
  }

  createAchievementElement(achievement, unlocked) {
    const div = document.createElement('div');
    div.className = `achievement-item ${unlocked ? 'unlocked' : 'locked'}`;
    
    div.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-info">
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-description">${achievement.description}</div>
        <div class="achievement-points">${achievement.points} points</div>
      </div>
      ${unlocked ? '<div class="achievement-status">✓</div>' : '<div class="achievement-status">🔒</div>'}
    `;
    
    return div;
  }

  // Notification Methods
  showPointsEarned(points, reason) {
    this.showFloatingNotification(`+${Math.floor(points)} points`, reason, 'points');
  }

  showAchievementUnlocked(achievement) {
    const message = this.getRandomMessage('achievement', { name: achievement.name });
    this.showFloatingNotification(achievement.icon, message, 'achievement');
    
    // Also show in alerts system if available
    if (this.alertsManager) {
      this.alertsManager.showVisualAlert({
        id: `achievement_${achievement.id}`,
        level: 'excellent',
        message: `🏆 Achievement Unlocked: ${achievement.name}! +${achievement.points} points`,
        timestamp: Date.now(),
        actions: [{ text: 'Awesome!', action: 'dismiss' }]
      });
    }
  }

  showLevelUp(oldLevel, newLevel) {
    const message = this.getRandomMessage('levelUp', { level: newLevel });
    this.showFloatingNotification('🎉', message, 'levelup');
  }

  showStreakMessage(days) {
    const message = this.getRandomMessage('streak', { days });
    this.showFloatingNotification('🔥', message, 'streak');
  }

  showFloatingNotification(icon, message, type) {
    const notification = document.createElement('div');
    notification.className = `floating-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-message">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  showSessionSummary(sessionData) {
    const summary = {
      duration: this.formatDuration(sessionData.duration),
      averageScore: Math.round(sessionData.averageScore),
      pointsEarned: Math.floor(sessionData.pointsEarned),
      achievementsUnlocked: this.currentSession.achievementsUnlocked.length,
      streakDays: this.playerStats.currentStreak
    };
    
    // Create modal or update UI with session summary
    
    // Could implement a modal here
    this.showFloatingNotification('🎯', 
      `Session Complete! ${summary.pointsEarned} points earned`, 'session-complete');
  }

  getRandomMessage(type, data = {}) {
    const messages = this.motivationMessages[type] || [];
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    // Replace placeholders
    return message.replace(/\{(\w+)\}/g, (match, key) => data[key] || match);
  }

  // Utility Methods
  formatDuration(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  getDailyPoints() {
    // This would calculate points earned today
    // For now, return current session points as approximation
    return this.currentSession.pointsEarned;
  }

  getWeeklyPoints() {
    // This would calculate points earned this week
    // For now, return approximation
    return this.currentSession.pointsEarned * 7; // Approximate
  }

  checkDailyReset() {
    const today = new Date().toDateString();
    const lastCheck = localStorage.getItem('lastDailyCheck');
    
    if (lastCheck !== today) {
      this.performDailyReset();
      localStorage.setItem('lastDailyCheck', today);
    }
  }

  performDailyReset() {
    // Reset daily goals, award daily badges, etc.
  }

  startTracking() {
    // Start periodic tracking and updates
    setInterval(() => {
      if (this.currentSession.isActive) {
        this.updateUI();
      }
    }, 1000);
  }

  // Data Persistence
  savePlayerStats() {
    const data = {
      playerStats: this.playerStats,
      lastSaved: Date.now()
    };
    
    localStorage.setItem('gamificationData', JSON.stringify(data));
    
    // Sync with backend if available
    if (this.api && this.api.isAuthenticated()) {
      this.syncWithBackend();
    }
  }

  loadPlayerStats() {
    try {
      const saved = localStorage.getItem('gamificationData');
      if (saved) {
        const data = JSON.parse(saved);
        Object.assign(this.playerStats, data.playerStats || {});
      }
    } catch (error) {
      console.error('Failed to load gamification data:', error);
    }
  }

  async syncWithBackend() {
    try {
      await this.api.syncGamificationData(this.playerStats);
    } catch (error) {
      console.error('Failed to sync gamification data:', error);
    }
  }

  // Public API
  getPlayerStats() {
    return { ...this.playerStats };
  }

  getCurrentSession() {
    return { ...this.currentSession };
  }

  getAchievements() {
    return Object.values(this.achievements);
  }

  getUnlockedAchievements() {
    return this.playerStats.achievements.map(id => this.achievements[id]).filter(Boolean);
  }

  manuallyAwardPoints(points, reason = '') {
    this.awardPoints(points, reason);
    this.savePlayerStats();
  }

  resetProgress() {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      this.playerStats = {
        level: 1,
        experience: 0,
        totalPoints: 0,
        sessionsCompleted: 0,
        totalTime: 0,
        bestStreak: 0,
        currentStreak: 0,
        achievements: [],
        badges: [],
        lastSessionDate: null
      };
      
      this.savePlayerStats();
      this.updateUI();
    }
  }
}

// Export for ES6 modules
export default GamificationManager;

// Also make available globally
window.GamificationManager = GamificationManager;
