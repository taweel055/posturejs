/**
 * Exercise Recommendation Manager for ProPostureFitness
 * Provides exercise recommendations, tips, and guided routines based on posture analysis
 */

class ExerciseRecommendationManager {
  constructor(postureAnalyzer, alertsManager, metricsManager) {
    this.postureAnalyzer = postureAnalyzer;
    this.alertsManager = alertsManager;
    this.metricsManager = metricsManager;
    
    // Exercise database organized by posture issues
    this.exerciseDatabase = {
      forwardHead: {
        name: 'Forward Head Posture',
        severity: 'moderate',
        exercises: [
          {
            id: 'chin_tuck',
            name: 'Chin Tuck Exercise',
            category: 'stretching',
            duration: 30,
            repetitions: 10,
            description: 'Gently pull your chin back while keeping your head level',
            instructions: [
              'Sit or stand with your back straight',
              'Look straight ahead',
              'Slowly pull your chin back to create a double chin',
              'Hold for 5 seconds',
              'Repeat 10 times'
            ],
            benefits: 'Strengthens deep neck flexors and reduces forward head posture',
            difficulty: 'beginner',
            videoUrl: null,
            imageUrl: null
          },
          {
            id: 'neck_stretches',
            name: 'Upper Trapezius Stretch',
            category: 'stretching',
            duration: 60,
            repetitions: 3,
            description: 'Stretch the tight neck and shoulder muscles',
            instructions: [
              'Sit upright and tilt your head to the right',
              'Gently pull your head with your right hand',
              'Hold for 30 seconds',
              'Repeat on the other side',
              'Do 3 sets per side'
            ],
            benefits: 'Releases tension in neck and upper trapezius muscles',
            difficulty: 'beginner',
            videoUrl: null,
            imageUrl: null
          },
          {
            id: 'deep_neck_flexor',
            name: 'Deep Neck Flexor Strengthening',
            category: 'strengthening',
            duration: 45,
            repetitions: 15,
            description: 'Strengthen the muscles that support proper head position',
            instructions: [
              'Lie on your back with knees bent',
              'Tuck your chin to create a double chin',
              'Lift your head slightly off the ground',
              'Hold for 3 seconds',
              'Lower slowly and repeat'
            ],
            benefits: 'Builds strength in deep neck flexor muscles',
            difficulty: 'intermediate',
            videoUrl: null,
            imageUrl: null
          }
        ]
      },
      
      roundedShoulders: {
        name: 'Rounded Shoulders',
        severity: 'common',
        exercises: [
          {
            id: 'doorway_chest_stretch',
            name: 'Doorway Chest Stretch',
            category: 'stretching',
            duration: 60,
            repetitions: 3,
            description: 'Open up tight chest muscles that pull shoulders forward',
            instructions: [
              'Stand in a doorway with arms at 90 degrees',
              'Place forearms against the door frame',
              'Step forward gently to feel stretch in chest',
              'Hold for 30 seconds',
              'Repeat 3 times'
            ],
            benefits: 'Stretches pectoralis major and minor muscles',
            difficulty: 'beginner',
            videoUrl: null,
            imageUrl: null
          },
          {
            id: 'wall_slides',
            name: 'Wall Slides',
            category: 'strengthening',
            duration: 90,
            repetitions: 15,
            description: 'Strengthen upper back muscles and improve shoulder blade control',
            instructions: [
              'Stand with your back against a wall',
              'Place arms in a "goal post" position against the wall',
              'Slowly slide arms up and down the wall',
              'Keep contact with wall throughout movement',
              'Perform 15 repetitions'
            ],
            benefits: 'Strengthens rhomboids and middle trapezius',
            difficulty: 'beginner',
            videoUrl: null,
            imageUrl: null
          },
          {
            id: 'band_pull_aparts',
            name: 'Resistance Band Pull-Aparts',
            category: 'strengthening',
            duration: 60,
            repetitions: 20,
            description: 'Strengthen posterior deltoids and rhomboids',
            instructions: [
              'Hold resistance band at shoulder height',
              'Keep arms straight and pull band apart',
              'Squeeze shoulder blades together',
              'Return to start position slowly',
              'Repeat 20 times'
            ],
            benefits: 'Strengthens upper back and improves posture',
            difficulty: 'intermediate',
            videoUrl: null,
            imageUrl: null
          }
        ]
      },
      
      shoulderImbalance: {
        name: 'Shoulder Height Imbalance',
        severity: 'moderate',
        exercises: [
          {
            id: 'single_shoulder_rolls',
            name: 'Single Shoulder Rolls',
            category: 'mobility',
            duration: 60,
            repetitions: 10,
            description: 'Mobilize individual shoulders to correct imbalances',
            instructions: [
              'Focus on the higher shoulder',
              'Roll shoulder backwards in slow circles',
              'Perform 10 backward rolls',
              'Then do 10 forward rolls',
              'Repeat for the other shoulder'
            ],
            benefits: 'Improves shoulder mobility and reduces tension',
            difficulty: 'beginner',
            videoUrl: null,
            imageUrl: null
          },
          {
            id: 'unilateral_lat_stretch',
            name: 'Unilateral Lat Stretch',
            category: 'stretching',
            duration: 45,
            repetitions: 3,
            description: 'Stretch the latissimus dorsi muscle individually',
            instructions: [
              'Reach one arm overhead and lean to opposite side',
              'Feel stretch along the side of your torso',
              'Hold for 15 seconds',
              'Focus more on the tight side',
              'Repeat 3 times per side'
            ],
            benefits: 'Releases lateral trunk tightness',
            difficulty: 'beginner',
            videoUrl: null,
            imageUrl: null
          }
        ]
      },
      
      hipImbalance: {
        name: 'Hip Alignment Issues',
        severity: 'moderate',
        exercises: [
          {
            id: 'hip_flexor_stretch',
            name: 'Hip Flexor Stretch',
            category: 'stretching',
            duration: 60,
            repetitions: 3,
            description: 'Stretch tight hip flexors that affect pelvic position',
            instructions: [
              'Kneel in a lunge position',
              'Push hips forward while keeping back straight',
              'Feel stretch in front of back leg hip',
              'Hold for 30 seconds',
              'Switch sides and repeat'
            ],
            benefits: 'Releases hip flexor tightness and improves pelvic alignment',
            difficulty: 'beginner',
            videoUrl: null,
            imageUrl: null
          },
          {
            id: 'glute_bridges',
            name: 'Glute Bridge',
            category: 'strengthening',
            duration: 90,
            repetitions: 15,
            description: 'Strengthen glutes to support proper hip alignment',
            instructions: [
              'Lie on back with knees bent',
              'Squeeze glutes and lift hips up',
              'Create straight line from knees to shoulders',
              'Hold for 2 seconds at top',
              'Lower slowly and repeat'
            ],
            benefits: 'Strengthens glutes and improves hip stability',
            difficulty: 'beginner',
            videoUrl: null,
            imageUrl: null
          }
        ]
      },
      
      overallPosture: {
        name: 'General Posture Improvement',
        severity: 'mild',
        exercises: [
          {
            id: 'cat_cow',
            name: 'Cat-Cow Stretch',
            category: 'mobility',
            duration: 90,
            repetitions: 10,
            description: 'Improve spinal mobility and awareness',
            instructions: [
              'Start on hands and knees',
              'Arch back and look up (cow pose)',
              'Round back and tuck chin (cat pose)',
              'Move slowly between positions',
              'Repeat 10 times'
            ],
            benefits: 'Improves spinal flexibility and posture awareness',
            difficulty: 'beginner',
            videoUrl: null,
            imageUrl: null
          },
          {
            id: 'plank',
            name: 'Modified Plank',
            category: 'strengthening',
            duration: 60,
            repetitions: 1,
            description: 'Build core strength to support good posture',
            instructions: [
              'Start in push-up position or on knees',
              'Keep body in straight line',
              'Engage core muscles',
              'Hold for 30-60 seconds',
              'Rest and repeat if desired'
            ],
            benefits: 'Strengthens core muscles that support posture',
            difficulty: 'intermediate',
            videoUrl: null,
            imageUrl: null
          },
          {
            id: 'thoracic_extension',
            name: 'Thoracic Spine Extension',
            category: 'mobility',
            duration: 60,
            repetitions: 8,
            description: 'Improve upper back mobility',
            instructions: [
              'Sit in chair with hands behind head',
              'Gently arch upper back over chair',
              'Look up toward ceiling',
              'Hold for 3 seconds',
              'Return to neutral and repeat'
            ],
            benefits: 'Increases thoracic spine extension and reduces hunching',
            difficulty: 'beginner',
            videoUrl: null,
            imageUrl: null
          }
        ]
      }
    };
    
    // Daily tips and reminders
    this.dailyTips = [
      {
        category: 'ergonomics',
        title: 'Monitor Height Check',
        tip: 'Your monitor should be at eye level. The top of the screen should be at or slightly below eye level.',
        frequency: 'daily'
      },
      {
        category: 'breaks',
        title: 'Take Movement Breaks',
        tip: 'Stand up and move for 2-3 minutes every 30 minutes to prevent muscle stiffness.',
        frequency: 'hourly'
      },
      {
        category: 'stretching',
        title: 'Neck Rotation',
        tip: 'Gently turn your head left and right, holding for 5 seconds each side.',
        frequency: 'hourly'
      },
      {
        category: 'strengthening',
        title: 'Shoulder Blade Squeezes',
        tip: 'Pull your shoulder blades together and hold for 5 seconds. Repeat 10 times.',
        frequency: 'daily'
      },
      {
        category: 'awareness',
        title: 'Posture Check',
        tip: 'Ask yourself: Are my ears over my shoulders? Are my shoulders over my hips?',
        frequency: 'hourly'
      },
      {
        category: 'breathing',
        title: 'Deep Breathing',
        tip: 'Take 5 deep breaths, expanding your chest and engaging your diaphragm.',
        frequency: 'hourly'
      },
      {
        category: 'hydration',
        title: 'Stay Hydrated',
        tip: 'Drinking water regularly gives you natural break reminders and keeps joints lubricated.',
        frequency: 'daily'
      }
    ];
    
    // Workout programs
    this.workoutPrograms = {
      beginner: {
        name: 'Beginner Posture Program',
        duration: '2 weeks',
        frequency: 'Daily (10-15 minutes)',
        difficulty: 'beginner',
        goals: ['Improve posture awareness', 'Basic strengthening', 'Establish routine'],
        weeks: [
          {
            week: 1,
            focus: 'Awareness and Mobility',
            dailyRoutine: ['chin_tuck', 'neck_stretches', 'cat_cow', 'shoulder_rolls']
          },
          {
            week: 2,
            focus: 'Adding Strength',
            dailyRoutine: ['chin_tuck', 'wall_slides', 'glute_bridges', 'cat_cow', 'plank']
          }
        ]
      },
      intermediate: {
        name: 'Intermediate Posture Correction',
        duration: '4 weeks',
        frequency: '5 days per week (15-20 minutes)',
        difficulty: 'intermediate',
        goals: ['Correct specific imbalances', 'Build strength', 'Advanced awareness'],
        weeks: [
          {
            week: 1,
            focus: 'Assessment and Foundation',
            dailyRoutine: ['deep_neck_flexor', 'doorway_chest_stretch', 'wall_slides', 'hip_flexor_stretch']
          },
          {
            week: 2,
            focus: 'Targeted Strengthening',
            dailyRoutine: ['band_pull_aparts', 'deep_neck_flexor', 'glute_bridges', 'thoracic_extension']
          },
          {
            week: 3,
            focus: 'Integration and Balance',
            dailyRoutine: ['chin_tuck', 'wall_slides', 'single_shoulder_rolls', 'plank', 'cat_cow']
          },
          {
            week: 4,
            focus: 'Maintenance and Progression',
            dailyRoutine: ['band_pull_aparts', 'deep_neck_flexor', 'unilateral_lat_stretch', 'glute_bridges']
          }
        ]
      }
    };
    
    // Current user state
    this.userProfile = {
      level: 'beginner',
      currentProgram: null,
      completedExercises: [],
      preferences: {
        exerciseReminders: true,
        tipFrequency: 'hourly',
        preferredDifficulty: 'beginner'
      }
    };
    
    // Recommendation state
    this.currentRecommendations = [];
    this.lastPostureAnalysis = null;
    this.recommendationHistory = [];
    
    this.init();
  }

  init() {
    this.loadUserProfile();
    this.setupEventListeners();
    this.startTipScheduler();
    this.generateInitialRecommendations();
  }

  setupEventListeners() {
    // Listen for posture analysis updates
    window.addEventListener('analysis-result', (event) => {
      this.analyzePostureForRecommendations(event.detail);
    });

    // Setup UI event listeners
    document.addEventListener('DOMContentLoaded', () => {
      this.setupExerciseUI();
    });

    // Listen for session events
    window.addEventListener('session-started', () => {
      this.onSessionStart();
    });

    window.addEventListener('session-ended', () => {
      this.onSessionEnd();
    });
  }

  analyzePostureForRecommendations(postureData) {
    this.lastPostureAnalysis = postureData;
    
    // Analyze posture issues and generate recommendations
    const issues = this.identifyPostureIssues(postureData);
    const recommendations = this.generateRecommendations(issues);
    
    // Update current recommendations
    this.currentRecommendations = recommendations;
    
    // Update UI
    this.updateRecommendationsDisplay();
    
    // Show urgent recommendations if needed
    this.checkForUrgentRecommendations(issues);
  }

  identifyPostureIssues(postureData) {
    const issues = [];
    
    // Check for forward head posture
    if (postureData.headPosition && postureData.headPosition.forwardDistance > 2) {
      issues.push({
        type: 'forwardHead',
        severity: postureData.headPosition.forwardDistance > 5 ? 'severe' : 'moderate',
        value: postureData.headPosition.forwardDistance
      });
    }
    
    // Check for rounded shoulders
    if (postureData.shoulderAlignment && postureData.shoulderAlignment.roundedness > 15) {
      issues.push({
        type: 'roundedShoulders',
        severity: postureData.shoulderAlignment.roundedness > 25 ? 'severe' : 'moderate',
        value: postureData.shoulderAlignment.roundedness
      });
    }
    
    // Check for shoulder height imbalance
    if (postureData.shoulderAlignment && Math.abs(postureData.shoulderAlignment.heightDifference) > 1) {
      issues.push({
        type: 'shoulderImbalance',
        severity: Math.abs(postureData.shoulderAlignment.heightDifference) > 2 ? 'severe' : 'moderate',
        value: postureData.shoulderAlignment.heightDifference
      });
    }
    
    // Check for hip imbalance
    if (postureData.hipAlignment && Math.abs(postureData.hipAlignment.difference) > 1) {
      issues.push({
        type: 'hipImbalance',
        severity: Math.abs(postureData.hipAlignment.difference) > 2 ? 'severe' : 'moderate',
        value: postureData.hipAlignment.difference
      });
    }
    
    return issues;
  }

  generateRecommendations(issues) {
    const recommendations = [];
    
    // Generate exercise recommendations based on identified issues
    issues.forEach(issue => {
      const exerciseGroup = this.exerciseDatabase[issue.type];
      if (exerciseGroup) {
        // Select appropriate exercises based on severity and user level
        const suitableExercises = this.selectSuitableExercises(exerciseGroup.exercises, issue.severity);
        
        recommendations.push({
          category: 'exercise',
          issue: exerciseGroup.name,
          severity: issue.severity,
          exercises: suitableExercises,
          priority: this.calculatePriority(issue),
          timestamp: Date.now()
        });
      }
    });
    
    // Add general posture exercises if no specific issues found
    if (issues.length === 0) {
      const generalExercises = this.selectSuitableExercises(
        this.exerciseDatabase.overallPosture.exercises, 
        'mild'
      );
      
      recommendations.push({
        category: 'maintenance',
        issue: 'General Posture Maintenance',
        severity: 'mild',
        exercises: generalExercises,
        priority: 'low',
        timestamp: Date.now()
      });
    }
    
    // Add ergonomic tips
    recommendations.push({
      category: 'tip',
      content: this.selectRelevantTip(issues),
      priority: 'medium',
      timestamp: Date.now()
    });
    
    return recommendations;
  }

  selectSuitableExercises(exercises, severity) {
    const userLevel = this.userProfile.level;
    const maxExercises = severity === 'severe' ? 4 : 3;
    
    // Filter exercises by difficulty and select top exercises
    const suitableExercises = exercises.filter(exercise => {
      if (userLevel === 'beginner') {
        return exercise.difficulty === 'beginner';
      } else if (userLevel === 'intermediate') {
        return exercise.difficulty === 'beginner' || exercise.difficulty === 'intermediate';
      }
      return true;
    });
    
    return suitableExercises.slice(0, maxExercises);
  }

  calculatePriority(issue) {
    if (issue.severity === 'severe') return 'high';
    if (issue.severity === 'moderate') return 'medium';
    return 'low';
  }

  selectRelevantTip(issues) {
    // Select tip based on identified issues
    if (issues.some(issue => issue.type === 'forwardHead')) {
      return this.dailyTips.find(tip => tip.category === 'ergonomics');
    }
    
    if (issues.some(issue => issue.type === 'roundedShoulders')) {
      return this.dailyTips.find(tip => tip.category === 'strengthening');
    }
    
    // Default to random tip
    return this.dailyTips[Math.floor(Math.random() * this.dailyTips.length)];
  }

  checkForUrgentRecommendations(issues) {
    const severeIssues = issues.filter(issue => issue.severity === 'severe');
    
    if (severeIssues.length > 0 && this.alertsManager) {
      const message = `Severe posture issues detected. Immediate attention recommended.`;
      
      this.alertsManager.showVisualAlert({
        id: 'severe_posture_alert',
        level: 'warning',
        message: message,
        timestamp: Date.now(),
        actions: [
          { text: 'View Exercises', action: () => this.showRecommendationModal() },
          { text: 'Dismiss', action: 'dismiss' }
        ]
      });
    }
  }

  // UI Management Methods
  updateRecommendationsDisplay() {
    this.updateQuickTips();
    this.updateExerciseRecommendations();
    this.updateProgressTracking();
  }

  updateProgressTracking() {
    // Update exercise progress displays
    const todayCountEl = document.getElementById('todayExerciseCount');
    const streakEl = document.getElementById('exerciseStreak');
    
    if (todayCountEl) {
      const todayCount = this.getTodayExerciseCount();
      todayCountEl.textContent = todayCount;
    }
    
    if (streakEl) {
      const streak = this.getExerciseStreak();
      streakEl.textContent = `${streak} days`;
    }
  }

  getTodayExerciseCount() {
    const today = new Date().toDateString();
    return this.userProfile.completedExercises.filter(ex => 
      new Date(ex.timestamp).toDateString() === today
    ).length;
  }

  updateQuickTips() {
    const tipsContainer = document.getElementById('quickTipsContainer');
    if (!tipsContainer) return;
    
    const tipRecommendations = this.currentRecommendations.filter(rec => rec.category === 'tip');
    
    tipsContainer.innerHTML = '';
    
    tipRecommendations.forEach(recommendation => {
      const tipElement = this.createTipElement(recommendation.content);
      tipsContainer.appendChild(tipElement);
    });
  }

  createTipElement(tip) {
    const div = document.createElement('div');
    div.className = 'quick-tip-item';
    
    div.innerHTML = `
      <div class="tip-icon">${this.getTipIcon(tip.category)}</div>
      <div class="tip-content">
        <div class="tip-title">${tip.title}</div>
        <div class="tip-text">${tip.tip}</div>
      </div>
      <div class="tip-actions">
        <button class="tip-btn done-btn" onclick="this.markTipComplete('${tip.category}')">
          <span>✓</span>
        </button>
        <button class="tip-btn dismiss-btn" onclick="this.dismissTip('${tip.category}')">
          <span>×</span>
        </button>
      </div>
    `;
    
    return div;
  }

  getTipIcon(category) {
    const icons = {
      ergonomics: '🖥️',
      breaks: '⏰',
      stretching: '🤸‍♀️',
      strengthening: '💪',
      awareness: '🧠',
      breathing: '🫁',
      hydration: '💧'
    };
    
    return icons[category] || '💡';
  }

  updateExerciseRecommendations() {
    const exerciseContainer = document.getElementById('exerciseRecommendationsContainer');
    if (!exerciseContainer) return;
    
    const exerciseRecommendations = this.currentRecommendations.filter(rec => 
      rec.category === 'exercise' || rec.category === 'maintenance'
    );
    
    exerciseContainer.innerHTML = '';
    
    exerciseRecommendations.forEach(recommendation => {
      const recommendationElement = this.createExerciseRecommendationElement(recommendation);
      exerciseContainer.appendChild(recommendationElement);
    });
  }

  createExerciseRecommendationElement(recommendation) {
    const div = document.createElement('div');
    div.className = `exercise-recommendation ${recommendation.priority}-priority`;
    
    div.innerHTML = `
      <div class="recommendation-header">
        <div class="issue-info">
          <h4>${recommendation.issue}</h4>
          <span class="severity-badge ${recommendation.severity}">${recommendation.severity}</span>
        </div>
        <div class="recommendation-actions">
          <button class="rec-btn start-btn" onclick="exerciseRecommendationManager.startExerciseRoutine('${recommendation.issue}')">
            Start Routine
          </button>
        </div>
      </div>
      <div class="exercises-list">
        ${recommendation.exercises.map(exercise => this.createExerciseItemHTML(exercise)).join('')}
      </div>
    `;
    
    return div;
  }

  createExerciseItemHTML(exercise) {
    return `
      <div class="exercise-item" data-exercise-id="${exercise.id}">
        <div class="exercise-info">
          <div class="exercise-name">${exercise.name}</div>
          <div class="exercise-details">
            <span class="duration">${exercise.duration}s</span>
            <span class="reps">${exercise.repetitions} reps</span>
            <span class="difficulty ${exercise.difficulty}">${exercise.difficulty}</span>
          </div>
          <div class="exercise-description">${exercise.description}</div>
        </div>
        <div class="exercise-actions">
          <button class="exercise-btn info-btn" onclick="exerciseRecommendationManager.showExerciseDetails('${exercise.id}')">
            ℹ️
          </button>
          <button class="exercise-btn start-btn" onclick="exerciseRecommendationManager.startExercise('${exercise.id}')">
            ▶️
          </button>
        </div>
      </div>
    `;
  }

  // Exercise execution methods
  startExercise(exerciseId) {
    const exercise = this.findExerciseById(exerciseId);
    if (!exercise) return;
    
    this.showExerciseModal(exercise);
  }

  startExerciseRoutine(issueType) {
    const recommendation = this.currentRecommendations.find(rec => rec.issue === issueType);
    if (!recommendation) return;
    
    this.showRoutineModal(recommendation);
  }

  showExerciseDetails(exerciseId) {
    const exercise = this.findExerciseById(exerciseId);
    if (!exercise) return;
    
    this.showExerciseDetailsModal(exercise);
  }

  findExerciseById(exerciseId) {
    for (const category of Object.values(this.exerciseDatabase)) {
      const exercise = category.exercises.find(ex => ex.id === exerciseId);
      if (exercise) return exercise;
    }
    return null;
  }

  showExerciseModal(exercise) {
    // Create and show exercise execution modal
    const modal = this.createExerciseModal(exercise);
    document.body.appendChild(modal);
    modal.classList.add('show');
    
    // Start exercise timer if applicable
    if (exercise.duration) {
      this.startExerciseTimer(exercise.duration);
    }
  }

  createExerciseModal(exercise) {
    const modal = document.createElement('div');
    modal.className = 'modal exercise-modal';
    modal.id = 'exerciseModal';
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${exercise.name}</h3>
          <button class="close-btn" onclick="exerciseRecommendationManager.closeExerciseModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="exercise-info">
            <div class="exercise-meta">
              <span class="duration">${exercise.duration}s</span>
              <span class="reps">${exercise.repetitions} reps</span>
              <span class="category">${exercise.category}</span>
            </div>
            <p class="description">${exercise.description}</p>
          </div>
          
          <div class="exercise-instructions">
            <h4>Instructions:</h4>
            <ol>
              ${exercise.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
            </ol>
          </div>
          
          <div class="exercise-timer" id="exerciseTimer" style="display: none;">
            <div class="timer-display">
              <span class="time-remaining" id="timeRemaining">${exercise.duration}</span>
              <span class="timer-label">seconds remaining</span>
            </div>
            <div class="timer-controls">
              <button class="timer-btn" id="pauseTimer">Pause</button>
              <button class="timer-btn" id="resetTimer">Reset</button>
            </div>
          </div>
          
          <div class="exercise-benefits">
            <h4>Benefits:</h4>
            <p>${exercise.benefits}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="exerciseRecommendationManager.markExerciseComplete('${exercise.id}')">
            Mark Complete
          </button>
          <button class="btn btn-secondary" onclick="exerciseRecommendationManager.startExerciseTimer(${exercise.duration})">
            Start Timer
          </button>
          <button class="btn btn-secondary" onclick="exerciseRecommendationManager.closeExerciseModal()">
            Close
          </button>
        </div>
      </div>
    `;
    
    return modal;
  }

  startExerciseTimer(duration) {
    const timerElement = document.getElementById('exerciseTimer');
    const timeDisplay = document.getElementById('timeRemaining');
    
    if (!timerElement || !timeDisplay) return;
    
    timerElement.style.display = 'block';
    
    let timeLeft = duration;
    timeDisplay.textContent = timeLeft;
    
    const timer = setInterval(() => {
      timeLeft--;
      timeDisplay.textContent = timeLeft;
      
      if (timeLeft <= 0) {
        clearInterval(timer);
        this.onExerciseTimerComplete();
      }
    }, 1000);
    
    // Store timer reference for pause/reset functionality
    this.currentTimer = timer;
  }

  onExerciseTimerComplete() {
    // Show completion notification
    if (this.alertsManager) {
      this.alertsManager.showVisualAlert({
        id: 'exercise_complete',
        level: 'success',
        message: '🎉 Exercise completed! Great job!',
        timestamp: Date.now(),
        actions: [{ text: 'Awesome!', action: 'dismiss' }]
      });
    }
    
    // Play completion sound (if available)
    this.playCompletionSound();
  }

  markExerciseComplete(exerciseId) {
    // Track completed exercise
    this.userProfile.completedExercises.push({
      exerciseId,
      timestamp: Date.now(),
      sessionId: this.getCurrentSessionId()
    });
    
    this.saveUserProfile();
    this.closeExerciseModal();
    
    // Show success message
    if (this.alertsManager) {
      this.alertsManager.showVisualAlert({
        id: 'exercise_marked_complete',
        level: 'success',
        message: 'Exercise marked as complete! Keep up the great work!',
        timestamp: Date.now(),
        actions: [{ text: 'Thanks!', action: 'dismiss' }]
      });
    }
  }

  closeExerciseModal() {
    const modal = document.getElementById('exerciseModal');
    if (modal) {
      if (this.currentTimer) {
        clearInterval(this.currentTimer);
        this.currentTimer = null;
      }
      modal.remove();
    }
  }

  // Tip scheduling and management
  startTipScheduler() {
    // Schedule tips based on user preferences
    const frequency = this.userProfile.preferences.tipFrequency;
    
    if (frequency === 'hourly') {
      setInterval(() => this.showScheduledTip(), 60 * 60 * 1000); // Every hour
    } else if (frequency === 'daily') {
      setInterval(() => this.showScheduledTip(), 24 * 60 * 60 * 1000); // Every day
    }
  }

  showScheduledTip() {
    const tip = this.selectRandomTip();
    this.showTipNotification(tip);
  }

  selectRandomTip() {
    return this.dailyTips[Math.floor(Math.random() * this.dailyTips.length)];
  }

  showTipNotification(tip) {
    if (this.alertsManager) {
      this.alertsManager.showVisualAlert({
        id: `tip_${tip.category}_${Date.now()}`,
        level: 'info',
        message: `💡 ${tip.title}: ${tip.tip}`,
        timestamp: Date.now(),
        actions: [
          { text: 'Got it!', action: 'dismiss' },
          { text: 'Show More Tips', action: () => this.showTipsModal() }
        ]
      });
    }
  }

  // Session integration
  onSessionStart() {
    // Generate session-specific recommendations
    this.generateSessionRecommendations();
    
    // Reset exercise tracking for this session
    this.currentSessionExercises = [];
  }

  onSessionEnd() {
    // Show session summary with exercise recommendations
    this.showSessionExerciseSummary();
  }

  generateSessionRecommendations() {
    // This could be based on previous session data or current posture state
    const quickExercises = [
      this.exerciseDatabase.overallPosture.exercises[0], // Cat-cow
      this.exerciseDatabase.forwardHead.exercises[0]     // Chin tuck
    ];
    
    this.currentSessionExercises = quickExercises;
    this.updateSessionExerciseDisplay();
  }

  updateSessionExerciseDisplay() {
    const container = document.getElementById('sessionExercisesContainer');
    if (!container) return;
    
    container.innerHTML = `
      <h4>Recommended for this session:</h4>
      ${this.currentSessionExercises.map(exercise => `
        <div class="session-exercise">
          <span>${exercise.name}</span>
          <button onclick="exerciseRecommendationManager.startExercise('${exercise.id}')">Start</button>
        </div>
      `).join('')}
    `;
  }

  // Data persistence
  saveUserProfile() {
    localStorage.setItem('exerciseUserProfile', JSON.stringify(this.userProfile));
  }

  loadUserProfile() {
    try {
      const saved = localStorage.getItem('exerciseUserProfile');
      if (saved) {
        Object.assign(this.userProfile, JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load exercise user profile:', error);
    }
  }

  generateInitialRecommendations() {
    // Generate some initial recommendations for new users
    if (this.currentRecommendations.length === 0) {
      this.currentRecommendations = [{
        category: 'maintenance',
        issue: 'Welcome! Let\'s improve your posture',
        severity: 'mild',
        exercises: this.exerciseDatabase.overallPosture.exercises.slice(0, 2),
        priority: 'medium',
        timestamp: Date.now()
      }];
      
      this.updateRecommendationsDisplay();
    }
  }

  setupExerciseUI() {
    // This method would be called after DOM is loaded to set up UI elements
    // Add exercise recommendations panel to the page if it doesn't exist
    this.ensureUIElements();
  }

  ensureUIElements() {
    // Add containers for exercise recommendations if they don't exist
    if (!document.getElementById('exerciseRecommendationsContainer')) {
      const container = document.createElement('div');
      container.id = 'exerciseRecommendationsContainer';
      container.className = 'exercise-recommendations';
      
      // Try to add to insights panel or create new section
      const insightsPanel = document.querySelector('.insights-panel');
      if (insightsPanel) {
        insightsPanel.appendChild(container);
      }
    }
  }

  // Utility methods
  getCurrentSessionId() {
    return this.metricsManager?.getCurrentSessionId() || Date.now().toString();
  }

  playCompletionSound() {
    // Play a subtle completion sound if audio is enabled
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+LyvmsdBTiK3PPTfiwGH3vN8OSWQAoU');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore errors if audio is blocked
    } catch (error) {
      // Audio not supported or blocked
    }
  }

  // Public API
  getRecommendations() {
    return [...this.currentRecommendations];
  }

  getUserProfile() {
    return { ...this.userProfile };
  }

  updateUserLevel(level) {
    this.userProfile.level = level;
    this.saveUserProfile();
    this.generateInitialRecommendations();
  }

  setTipFrequency(frequency) {
    this.userProfile.preferences.tipFrequency = frequency;
    this.saveUserProfile();
  }

  getCompletedExercisesCount() {
    return this.userProfile.completedExercises.length;
  }

  getExerciseStreak() {
    // Calculate current exercise streak based on completed exercises
    const today = new Date().toDateString();
    const recent = this.userProfile.completedExercises.filter(ex => 
      new Date(ex.timestamp).toDateString() === today
    );
    return recent.length;
  }
}

// Export for ES6 modules
export default ExerciseRecommendationManager;

// Also make available globally
window.ExerciseRecommendationManager = ExerciseRecommendationManager;