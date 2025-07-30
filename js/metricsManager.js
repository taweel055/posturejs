/**
 * Metrics Manager for Expanded Live Dashboard
 * Handles real-time metrics, graphs, session management, and insights
 */

class MetricsManager {
  constructor(apiService, postureAnalyzer) {
    this.api = apiService;
    this.postureAnalyzer = postureAnalyzer;
    
    // Session state
    this.isSessionActive = false;
    this.sessionStartTime = null;
    this.sessionId = null;
    this.isPaused = false;
    
    // Metrics data
    this.currentMetrics = {
      postureScore: 0,
      headPosition: 0,
      shoulderAlignment: 0,
      spineCurvature: 0,
      headTiltAngle: 0,
      neckAngle: 0,
      shoulderSlope: 0,
      spineAlignment: 0,
      forwardHeadDistance: 0,
      shoulderHeightDiff: 0,
      hipAlignment: 0,
      fps: 0,
      processingTime: 0,
      frameCount: 0,
      cpuUsage: 0,
      alertCount: 0
    };
    
    // Historical data for trends
    this.metricsHistory = [];
    this.maxHistorySize = 300; // 5 minutes at 1 point per second
    this.lastUpdateTime = 0;
    
    // Graph settings
    this.graphSettings = {
      timeRange: 5, // minutes
      isPaused: false,
      showLegend: true
    };
    
    // Performance monitoring
    this.performanceData = {
      fpsHistory: [],
      lastFpsUpdate: Date.now()
    };
    
    // Insights
    this.insights = {
      current: [],
      lastAnalysis: 0,
      analysisInterval: 10000 // 10 seconds
    };
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeUI();
    this.startMetricsUpdates();
    this.setupGraphCanvas();
    this.generateInitialInsights();
  }

  setupEventListeners() {
    // Dashboard controls
    document.getElementById('expandDashboard')?.addEventListener('click', () => {
      this.toggleDashboardExpansion();
    });
    
    document.getElementById('resetMetrics')?.addEventListener('click', () => {
      this.resetMetrics();
    });
    
    document.getElementById('exportData')?.addEventListener('click', () => {
      this.exportData();
    });

    // Session controls
    document.getElementById('startSession')?.addEventListener('click', () => {
      this.startSession();
    });
    
    document.getElementById('pauseSession')?.addEventListener('click', () => {
      this.togglePause();
    });
    
    document.getElementById('endSession')?.addEventListener('click', () => {
      this.endSession();
    });
    
    document.getElementById('saveReport')?.addEventListener('click', () => {
      this.saveReport();
    });

    // Graph controls
    document.getElementById('pauseGraph')?.addEventListener('click', () => {
      this.toggleGraphPause();
    });
    
    document.getElementById('clearGraph')?.addEventListener('click', () => {
      this.clearGraph();
    });
    
    document.getElementById('graphTimeRange')?.addEventListener('change', (e) => {
      this.changeTimeRange(parseInt(e.target.value, 10));
    });

    // Listen for analyzer updates
    if (this.postureAnalyzer) {
      this.postureAnalyzer.onMetricsUpdate = (metrics) => {
        this.updateMetrics(metrics);
      };
    }
  }

  initializeUI() {
    // Set initial values
    this.updateScoreDisplay(0);
    this.updateSessionStatus('Ready');
    this.updatePerformanceStatus('Optimal');
    
    // Initialize trend indicators
    this.updateTrendArrow('→', 0);
    
    // Initialize rings and bars
    this.updatePostureRing(0);
    this.updateBreakdownBars({
      headPosition: 0,
      shoulderAlignment: 0,
      spineCurvature: 0
    });
  }

  startMetricsUpdates() {
    // Update metrics every second
    setInterval(() => {
      if (this.isSessionActive && !this.isPaused) {
        this.updateSessionTimer();
        this.calculatePosturePercentage();
        this.updateCpuUsage();
        this.analyzeInsights();
      }
    }, 1000);

    // Update graph every 2 seconds
    setInterval(() => {
      if (this.isSessionActive && !this.graphSettings.isPaused) {
        this.updateGraph();
      }
    }, 2000);

    // Update FPS graph more frequently
    setInterval(() => {
      this.updateFpsGraph();
    }, 100);
  }

  setupGraphCanvas() {
    const canvas = document.getElementById('postureGraph');
    if (!canvas) {return;}

    this.graphCtx = canvas.getContext('2d');
    
    // Enable interactive features
    this.setupGraphInteractivity();
    this.initializeGraph();
  }

  setupGraphInteractivity() {
    const canvas = document.getElementById('postureGraph');
    if (!canvas) {return;}

    // Graph interaction state
    this.graphInteraction = {
      isHovering: false,
      mouseX: 0,
      mouseY: 0,
      hoveredPoint: null,
      selectedSeries: new Set(['postureScore', 'headPosition', 'shoulderAlignment']),
      zoomLevel: 1,
      panOffset: { x: 0, y: 0 }
    };

    // Mouse move for hover effects
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.graphInteraction.mouseX = e.clientX - rect.left;
      this.graphInteraction.mouseY = e.clientY - rect.top;
      this.graphInteraction.isHovering = true;
      
      this.handleGraphHover();
    });

    // Mouse leave
    canvas.addEventListener('mouseleave', () => {
      this.graphInteraction.isHovering = false;
      this.graphInteraction.hoveredPoint = null;
      this.updateGraph();
    });

    // Click for data point selection
    canvas.addEventListener('click', (e) => {
      this.handleGraphClick(e);
    });

    // Wheel for zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.handleGraphZoom(e);
    });

    // Legend interactivity
    this.setupLegendInteractivity();
  }

  setupLegendInteractivity() {
    const legend = document.querySelector('.graph-legend');
    if (!legend) {return;}

    legend.addEventListener('click', (e) => {
      const legendItem = e.target.closest('.legend-item');
      if (!legendItem) {return;}

      const seriesName = this.getLegendSeriesName(legendItem);
      this.toggleSeries(seriesName);
    });
  }

  getLegendSeriesName(legendItem) {
    const text = legendItem.querySelector('span')?.textContent;
    const seriesMap = {
      'Posture Score': 'postureScore',
      'Head Position': 'headPosition',
      'Shoulder Alignment': 'shoulderAlignment'
    };
    return seriesMap[text] || text;
  }

  toggleSeries(seriesName) {
    if (this.graphInteraction.selectedSeries.has(seriesName)) {
      this.graphInteraction.selectedSeries.delete(seriesName);
    } else {
      this.graphInteraction.selectedSeries.add(seriesName);
    }
    
    this.updateLegendDisplay();
    this.updateGraph();
  }

  updateLegendDisplay() {
    const legendItems = document.querySelectorAll('.legend-item');
    legendItems.forEach(item => {
      const seriesName = this.getLegendSeriesName(item);
      const isSelected = this.graphInteraction.selectedSeries.has(seriesName);
      
      item.style.opacity = isSelected ? '1' : '0.5';
      item.style.cursor = 'pointer';
    });
  }

  handleGraphHover() {
    const canvas = this.graphCtx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    
    // Find nearest data point
    const nearestPoint = this.findNearestDataPoint(
      this.graphInteraction.mouseX,
      this.graphInteraction.mouseY,
      width,
      height
    );

    if (nearestPoint && nearestPoint.distance < 20) {
      this.graphInteraction.hoveredPoint = nearestPoint;
      this.showTooltip(nearestPoint);
    } else {
      this.graphInteraction.hoveredPoint = null;
      this.hideTooltip();
    }

    this.updateGraph();
  }

  findNearestDataPoint(mouseX, mouseY, canvasWidth, canvasHeight) {
    const data = this.metricsHistory;
    if (data.length < 2) {return null;}

    let nearest = null;
    let minDistance = Infinity;

    data.forEach((point, index) => {
      this.graphInteraction.selectedSeries.forEach(metric => {
        const x = (index / (data.length - 1)) * canvasWidth;
        const y = canvasHeight - ((point[metric] || 0) / 100) * canvasHeight;
        
        const distance = Math.sqrt(
          Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2)
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearest = {
            point,
            metric,
            x,
            y,
            distance,
            index
          };
        }
      });
    });

    return nearest;
  }

  showTooltip(pointData) {
    let tooltip = document.getElementById('graphTooltip');
    
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'graphTooltip';
      tooltip.style.cssText = `
        position: absolute;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 12px;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        pointer-events: none;
        font-size: 14px;
        max-width: 200px;
      `;
      document.body.appendChild(tooltip);
    }

    const canvas = document.getElementById('postureGraph');
    const rect = canvas.getBoundingClientRect();
    
    tooltip.style.left = `${rect.left + pointData.x + 10}px`;
    tooltip.style.top = `${rect.top + pointData.y - 10}px`;
    tooltip.style.display = 'block';

    const timestamp = new Date(pointData.point.timestamp).toLocaleTimeString();
    const value = Math.round(pointData.point[pointData.metric] || 0);
    
    tooltip.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px;">${timestamp}</div>
      <div style="color: var(--text-secondary);">
        ${this.getMetricDisplayName(pointData.metric)}: ${value}%
      </div>
    `;
  }

  hideTooltip() {
    const tooltip = document.getElementById('graphTooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  getMetricDisplayName(metric) {
    const displayNames = {
      postureScore: 'Posture Score',
      headPosition: 'Head Position',
      shoulderAlignment: 'Shoulder Alignment'
    };
    return displayNames[metric] || metric;
  }

  handleGraphClick(event) {
    // Implementation for graph click actions (e.g., set time marker)
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    
    // Set time marker at clicked position
    this.graphInteraction.timeMarker = x;
    this.updateGraph();
  }

  handleGraphZoom(event) {
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    this.graphInteraction.zoomLevel *= zoomFactor;
    
    // Clamp zoom level
    this.graphInteraction.zoomLevel = Math.max(0.5, Math.min(3, this.graphInteraction.zoomLevel));
    
    this.updateGraph();
  }

  initializeGraph() {
    if (!this.graphCtx) {return;}

    const canvas = this.graphCtx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    this.graphCtx.clearRect(0, 0, width, height);

    // Draw grid
    this.drawGrid();
    
    // Draw axes
    this.drawAxes();
    
    // Initialize legend display
    this.updateLegendDisplay();
  }

  drawGrid() {
    const canvas = this.graphCtx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    this.graphCtx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    this.graphCtx.lineWidth = 1;

    // Vertical grid lines
    for (let x = 0; x <= width; x += width / 10) {
      this.graphCtx.beginPath();
      this.graphCtx.moveTo(x, 0);
      this.graphCtx.lineTo(x, height);
      this.graphCtx.stroke();
    }

    // Horizontal grid lines
    for (let y = 0; y <= height; y += height / 5) {
      this.graphCtx.beginPath();
      this.graphCtx.moveTo(0, y);
      this.graphCtx.lineTo(width, y);
      this.graphCtx.stroke();
    }
  }

  drawAxes() {
    const canvas = this.graphCtx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    this.graphCtx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    this.graphCtx.lineWidth = 2;

    // Y-axis
    this.graphCtx.beginPath();
    this.graphCtx.moveTo(0, 0);
    this.graphCtx.lineTo(0, height);
    this.graphCtx.stroke();

    // X-axis
    this.graphCtx.beginPath();
    this.graphCtx.moveTo(0, height);
    this.graphCtx.lineTo(width, height);
    this.graphCtx.stroke();
  }

  updateMetrics(metrics) {
    if (!metrics) {return;}

    // Update current metrics
    Object.assign(this.currentMetrics, metrics);

    // Update UI elements
    this.updateScoreDisplay(metrics.postureScore || 0);
    this.updateBreakdownBars({
      headPosition: metrics.headPosition || 0,
      shoulderAlignment: metrics.shoulderAlignment || 0,
      spineCurvature: metrics.spineCurvature || 0
    });

    // Update angle measurements
    this.updateAngleMeasurements({
      headTiltAngle: metrics.headTiltAngle || 0,
      neckAngle: metrics.neckAngle || 0,
      shoulderSlope: metrics.shoulderSlope || 0,
      spineAlignment: metrics.spineAlignment || 0
    });

    // Update distance measurements
    this.updateDistanceMeasurements({
      forwardHeadDistance: metrics.forwardHeadDistance || 0,
      shoulderHeightDiff: metrics.shoulderHeightDiff || 0,
      hipAlignment: metrics.hipAlignment || 0
    });

    // Update performance metrics
    this.updatePerformanceMetrics({
      fps: metrics.fps || 0,
      processingTime: metrics.processingTime || 0,
      frameCount: metrics.frameCount || 0
    });

    // Store for historical analysis
    this.storeMetricsData(metrics);

    // Send to backend if session is active
    if (this.isSessionActive && this.sessionId) {
      this.sendMetricsToBackend(metrics);
    }
  }

  updateScoreDisplay(score) {
    const scoreValue = document.getElementById('mainScoreValue');
    const scoreCircle = document.getElementById('mainScoreCircle');
    
    if (scoreValue) {
      scoreValue.textContent = Math.round(score);
    }
    
    if (scoreCircle) {
      scoreCircle.style.setProperty('--score', score);
      
      // Update color based on score
      let color = '#10b981'; // green
      if (score < 50) {color = '#ef4444';} // red
      else if (score < 70) {color = '#f59e0b';} // yellow
      
      scoreCircle.style.background = `conic-gradient(${color} 0deg, ${color} ${score * 3.6}deg, var(--border-color) ${score * 3.6}deg)`;
    }

    // Update trend
    this.updateTrend(score);
  }

  updateTrend(currentScore) {
    const history = this.metricsHistory;
    if (history.length < 2) {return;}

    const previousScore = history[history.length - 2]?.postureScore || 0;
    const change = currentScore - previousScore;
    const changePercent = previousScore > 0 ? (change / previousScore) * 100 : 0;

    let arrow = '→';
    let className = '';
    
    if (change > 1) {
      arrow = '↗';
      className = 'up';
    } else if (change < -1) {
      arrow = '↘';
      className = 'down';
    }

    this.updateTrendArrow(arrow, changePercent, className);
  }

  updateTrendArrow(arrow, changePercent, className = '') {
    const trendArrow = document.getElementById('trendArrow');
    const trendValue = document.getElementById('trendValue');
    
    if (trendArrow) {
      trendArrow.textContent = arrow;
      trendArrow.className = `trend-arrow ${className}`;
    }
    
    if (trendValue) {
      const sign = changePercent > 0 ? '+' : '';
      trendValue.textContent = `${sign}${changePercent.toFixed(1)}%`;
    }
  }

  updateBreakdownBars(values) {
    Object.keys(values).forEach(key => {
      const bar = document.getElementById(`${key}Bar`);
      const valueEl = document.getElementById(`${key}Value`);
      
      if (bar) {
        bar.style.width = `${Math.min(100, Math.max(0, values[key]))}%`;
        
        // Update color based on value
        let color = '#2563eb'; // blue
        if (values[key] > 80) {color = '#10b981';} // green
        else if (values[key] < 50) {color = '#ef4444';} // red
        else if (values[key] < 70) {color = '#f59e0b';} // yellow
        
        bar.style.backgroundColor = color;
      }
      
      if (valueEl) {
        valueEl.textContent = `${Math.round(values[key])}%`;
      }
    });
  }

  updateAngleMeasurements(angles) {
    Object.keys(angles).forEach(key => {
      const valueEl = document.getElementById(key);
      const indicator = document.getElementById(key.replace('Angle', 'Indicator'));
      
      if (valueEl) {
        valueEl.textContent = `${Math.round(angles[key])}°`;
      }
      
      if (indicator) {
        indicator.style.setProperty('--angle', `${angles[key]}deg`);
      }
    });
  }

  updateDistanceMeasurements(distances) {
    Object.keys(distances).forEach(key => {
      const valueEl = document.getElementById(key);
      const bar = document.getElementById(`${key}Bar`);
      
      if (valueEl) {
        valueEl.textContent = `${Math.round(distances[key])}cm`;
      }
      
      if (bar) {
        const percentage = Math.min(100, (distances[key] / 10) * 100); // Assume 10cm is 100%
        bar.style.width = `${percentage}%`;
        
        // Color based on distance (red for high distances)
        if (distances[key] > 7) {
          bar.classList.add('high');
        } else {
          bar.classList.remove('high');
        }
      }
    });
  }

  updatePerformanceMetrics(performance) {
    // Update FPS
    const fpsEl = document.getElementById('liveFPS');
    if (fpsEl) {
      fpsEl.textContent = Math.round(performance.fps);
    }

    // Update processing time
    const processingEl = document.getElementById('liveProcessingTime');
    if (processingEl) {
      processingEl.textContent = `${Math.round(performance.processingTime)}ms`;
    }

    // Update frame count
    const frameEl = document.getElementById('liveFrameCount');
    if (frameEl) {
      frameEl.textContent = performance.frameCount.toLocaleString();
    }

    // Store FPS for graph
    this.performanceData.fpsHistory.push({
      time: Date.now(),
      fps: performance.fps
    });

    // Keep only last 100 FPS readings
    if (this.performanceData.fpsHistory.length > 100) {
      this.performanceData.fpsHistory.shift();
    }
  }

  updateFpsGraph() {
    const fpsGraph = document.getElementById('fpsGraph');
    if (!fpsGraph) {return;}

    const canvas = fpsGraph.querySelector('canvas');
    if (!canvas) {return;}

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const history = this.performanceData.fpsHistory;
    if (history.length < 2) {return;}

    // Draw FPS line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const maxFps = 60;
    history.forEach((point, index) => {
      const x = (index / (history.length - 1)) * width;
      const y = height - (point.fps / maxFps) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }

  updateCpuUsage() {
    // Simulate CPU usage calculation
    const cpuUsage = Math.random() * 30 + 10; // 10-40%
    
    const cpuEl = document.getElementById('cpuUsage');
    const cpuBar = document.getElementById('cpuUsageBar');
    
    if (cpuEl) {
      cpuEl.textContent = `${Math.round(cpuUsage)}%`;
    }
    
    if (cpuBar) {
      cpuBar.style.width = `${cpuUsage}%`;
      
      if (cpuUsage > 70) {
        cpuBar.classList.add('high');
      } else {
        cpuBar.classList.remove('high');
      }
    }
  }

  updateSessionTimer() {
    if (!this.sessionStartTime) {return;}

    const now = Date.now();
    const elapsed = now - this.sessionStartTime;
    
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const durationEl = document.getElementById('sessionDurationLive');
    if (durationEl) {
      durationEl.textContent = timeString;
    }
  }

  calculatePosturePercentage() {
    if (this.metricsHistory.length === 0) {return;}

    const goodPostureFrames = this.metricsHistory.filter(m => m.postureScore >= 70).length;
    const totalFrames = this.metricsHistory.length;
    const percentage = totalFrames > 0 ? (goodPostureFrames / totalFrames) * 100 : 0;

    // Update UI
    const percentageEl = document.getElementById('posturePercentage');
    if (percentageEl) {
      percentageEl.textContent = `${Math.round(percentage)}%`;
    }

    this.updatePostureRing(percentage);

    // Calculate good posture time
    const goodTime = (percentage / 100) * (Date.now() - this.sessionStartTime);
    const goodHours = Math.floor(goodTime / 3600000);
    const goodMinutes = Math.floor((goodTime % 3600000) / 60000);
    const goodSeconds = Math.floor((goodTime % 60000) / 1000);
    
    const goodTimeString = `${goodHours.toString().padStart(2, '0')}:${goodMinutes.toString().padStart(2, '0')}:${goodSeconds.toString().padStart(2, '0')}`;
    
    const goodTimeEl = document.getElementById('goodPostureTime');
    if (goodTimeEl) {
      goodTimeEl.textContent = goodTimeString;
    }
  }

  updatePostureRing(percentage) {
    const ringFill = document.getElementById('postureRingFill');
    if (ringFill) {
      const circumference = 2 * Math.PI * 15.9155;
      const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
      ringFill.setAttribute('stroke-dasharray', strokeDasharray);

      // Update color
      let color = '#10b981'; // green
      if (percentage < 50) {color = '#ef4444';} // red
      else if (percentage < 70) {color = '#f59e0b';} // yellow
      
      ringFill.setAttribute('stroke', color);
    }
  }

  storeMetricsData(metrics) {
    const dataPoint = {
      timestamp: Date.now(),
      ...metrics
    };

    this.metricsHistory.push(dataPoint);

    // Keep only data within time range
    const timeRange = this.graphSettings.timeRange * 60 * 1000; // Convert to milliseconds
    const cutoff = Date.now() - timeRange;
    
    this.metricsHistory = this.metricsHistory.filter(point => point.timestamp >= cutoff);
  }

  updateGraph() {
    if (!this.graphCtx || this.metricsHistory.length < 2) {return;}

    const canvas = this.graphCtx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    // Clear and redraw grid
    this.initializeGraph();

    // Draw only selected data lines
    const seriesColors = {
      postureScore: '#10b981',
      headPosition: '#f59e0b', 
      shoulderAlignment: '#3b82f6'
    };

    this.graphInteraction.selectedSeries.forEach(metric => {
      const color = seriesColors[metric] || '#666';
      this.drawDataLine(metric, color, width, height);
    });

    // Draw time marker if set
    if (this.graphInteraction.timeMarker) {
      this.drawTimeMarker(this.graphInteraction.timeMarker, height);
    }

    // Highlight hovered point
    if (this.graphInteraction.hoveredPoint) {
      this.drawHoverHighlight(this.graphInteraction.hoveredPoint);
    }
  }

  drawDataLine(metric, color, width, height) {
    const data = this.metricsHistory;
    if (data.length < 2) {return;}

    this.graphCtx.strokeStyle = color;
    this.graphCtx.lineWidth = 2;
    this.graphCtx.beginPath();

    data.forEach((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((point[metric] || 0) / 100) * height;
      
      if (index === 0) {
        this.graphCtx.moveTo(x, y);
      } else {
        this.graphCtx.lineTo(x, y);
      }
    });

    this.graphCtx.stroke();
  }

  drawTimeMarker(x, height) {
    this.graphCtx.strokeStyle = '#ef4444';
    this.graphCtx.lineWidth = 2;
    this.graphCtx.setLineDash([5, 5]);
    
    this.graphCtx.beginPath();
    this.graphCtx.moveTo(x, 0);
    this.graphCtx.lineTo(x, height);
    this.graphCtx.stroke();
    
    this.graphCtx.setLineDash([]); // Reset dash
  }

  drawHoverHighlight(pointData) {
    // Draw highlight circle
    this.graphCtx.fillStyle = '#ffffff';
    this.graphCtx.strokeStyle = '#000000';
    this.graphCtx.lineWidth = 2;
    
    this.graphCtx.beginPath();
    this.graphCtx.arc(pointData.x, pointData.y, 6, 0, 2 * Math.PI);
    this.graphCtx.fill();
    this.graphCtx.stroke();
    
    // Draw crosshair
    this.graphCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    this.graphCtx.lineWidth = 1;
    this.graphCtx.setLineDash([2, 2]);
    
    const canvas = this.graphCtx.canvas;
    
    // Vertical line
    this.graphCtx.beginPath();
    this.graphCtx.moveTo(pointData.x, 0);
    this.graphCtx.lineTo(pointData.x, canvas.height);
    this.graphCtx.stroke();
    
    // Horizontal line
    this.graphCtx.beginPath();
    this.graphCtx.moveTo(0, pointData.y);
    this.graphCtx.lineTo(canvas.width, pointData.y);
    this.graphCtx.stroke();
    
    this.graphCtx.setLineDash([]); // Reset dash
  }

  analyzeInsights() {
    const now = Date.now();
    if (now - this.insights.lastAnalysis < this.insights.analysisInterval) {return;}

    this.insights.lastAnalysis = now;
    this.generateInsights();
  }

  generateInsights() {
    const insights = [];
    const currentScore = this.currentMetrics.postureScore;
    const history = this.metricsHistory.slice(-10); // Last 10 data points

    // Primary insight based on current score
    if (currentScore >= 80) {
      insights.push({
        type: 'positive',
        icon: '🎯',
        title: 'Excellent posture!',
        message: 'Your alignment is within optimal range.'
      });
    } else if (currentScore >= 70) {
      insights.push({
        type: 'neutral',
        icon: '👍',
        title: 'Good posture',
        message: 'Minor adjustments could improve your score.'
      });
    } else if (currentScore >= 50) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Posture needs attention',
        message: 'Consider adjusting your position.'
      });
    } else {
      insights.push({
        type: 'error',
        icon: '🚨',
        title: 'Poor posture detected',
        message: 'Please correct your position immediately.'
      });
    }

    // Trend-based insights
    if (history.length >= 5) {
      const recent = history.slice(-3);
      const earlier = history.slice(-6, -3);
      
      const recentAvg = recent.reduce((sum, p) => sum + p.postureScore, 0) / recent.length;
      const earlierAvg = earlier.reduce((sum, p) => sum + p.postureScore, 0) / earlier.length;
      
      if (recentAvg > earlierAvg + 5) {
        insights.push({
          type: 'recommendation',
          icon: '📈',
          title: 'Improving trend',
          message: 'Your posture is getting better. Keep it up!'
        });
      } else if (recentAvg < earlierAvg - 5) {
        insights.push({
          type: 'recommendation',
          icon: '📉',
          title: 'Declining trend',
          message: 'Take a break and reset your position.'
        });
      }
    }

    // Specific recommendations
    if (this.currentMetrics.forwardHeadDistance > 5) {
      insights.push({
        type: 'recommendation',
        icon: '💡',
        title: 'Forward head posture',
        message: 'Try moving your monitor higher to reduce neck strain.'
      });
    }

    if (this.currentMetrics.shoulderHeightDiff > 3) {
      insights.push({
        type: 'recommendation',
        icon: '💡',
        title: 'Uneven shoulders',
        message: 'Check your chair height and arm position.'
      });
    }

    this.displayInsights(insights);
  }

  generateInitialInsights() {
    this.displayInsights([
      {
        type: 'positive',
        icon: '🎯',
        title: 'Ready to start',
        message: 'Begin a session to track your posture metrics.'
      },
      {
        type: 'recommendation',
        icon: '💡',
        title: 'Pro tip',
        message: 'Position your screen at eye level for optimal posture.'
      }
    ]);
  }

  displayInsights(insights) {
    const primaryInsight = document.getElementById('primaryInsight');
    const recommendationInsight = document.getElementById('recommendationInsight');

    if (insights.length > 0 && primaryInsight) {
      const insight = insights[0];
      primaryInsight.className = `insight-item ${insight.type}`;
      primaryInsight.querySelector('.insight-icon').textContent = insight.icon;
      primaryInsight.querySelector('.insight-text').innerHTML = `<strong>${insight.title}</strong> ${insight.message}`;
    }

    if (insights.length > 1 && recommendationInsight) {
      const insight = insights[1];
      recommendationInsight.className = `insight-item ${insight.type}`;
      recommendationInsight.querySelector('.insight-icon').textContent = insight.icon;
      recommendationInsight.querySelector('.insight-text').textContent = insight.message;
    }
  }

  async startSession() {
    try {
      // Create session in backend
      const sessionData = {
        sessionName: `Posture Session ${new Date().toLocaleString()}`,
        sessionNotes: 'Live dashboard session'
      };

      if (this.api && this.api.isAuthenticated()) {
        const response = await this.api.createPostureSession(sessionData);
        this.sessionId = response.session.id;
      }

      // Start local session
      this.isSessionActive = true;
      this.sessionStartTime = Date.now();
      this.isPaused = false;

      // Reset metrics
      this.resetMetrics();

      // Update UI
      this.updateSessionButtons();
      this.updateSessionStatus('Active');

    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start session. Starting local session only.');
      
      // Start local session anyway
      this.isSessionActive = true;
      this.sessionStartTime = Date.now();
      this.updateSessionButtons();
      this.updateSessionStatus('Active (Local)');
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    
    const pauseBtn = document.getElementById('pauseSession');
    if (pauseBtn) {
      pauseBtn.textContent = this.isPaused ? '▶️ Resume' : '⏸️ Pause';
    }
    
    this.updateSessionStatus(this.isPaused ? 'Paused' : 'Active');
  }

  async endSession() {
    try {
      // End session in backend
      if (this.sessionId && this.api && this.api.isAuthenticated()) {
        await this.api.updatePostureSession(this.sessionId, {
          endTime: new Date().toISOString(),
          sessionNotes: 'Session completed via dashboard'
        });
      }

      // End local session
      this.isSessionActive = false;
      this.isPaused = false;
      this.sessionStartTime = null;

      // Update UI
      this.updateSessionButtons();
      this.updateSessionStatus('Completed');

      // Show session summary
      this.showSessionSummary();

      this.sessionId = null;
    } catch (error) {
      console.error('Failed to end session:', error);
      
      // End local session anyway
      this.isSessionActive = false;
      this.updateSessionButtons();
      this.updateSessionStatus('Ended');
    }
  }

  updateSessionButtons() {
    const startBtn = document.getElementById('startSession');
    const pauseBtn = document.getElementById('pauseSession');
    const endBtn = document.getElementById('endSession');

    if (startBtn) {startBtn.disabled = this.isSessionActive;}
    if (pauseBtn) {pauseBtn.disabled = !this.isSessionActive;}
    if (endBtn) {endBtn.disabled = !this.isSessionActive;}
  }

  updateSessionStatus(status) {
    const statusEl = document.getElementById('sessionStatus');
    if (statusEl) {
      statusEl.textContent = status;
      
      // Update color based on status
      statusEl.className = 'measurement-status';
      if (status === 'Active') {
        statusEl.classList.add('success');
      } else if (status === 'Paused') {
        statusEl.classList.add('warning');
      } else if (status.includes('Error')) {
        statusEl.classList.add('error');
      }
    }
  }

  updatePerformanceStatus(status) {
    const statusEl = document.getElementById('performanceStatus');
    if (statusEl) {
      statusEl.textContent = status;
    }
  }

  showSessionSummary() {
    const summary = this.generateSessionSummary();
    
    // Create modal or alert with summary
    const summaryText = `
Session Summary:
Duration: ${summary.duration}
Average Score: ${summary.averageScore}%
Good Posture: ${summary.goodPostureTime} (${summary.goodPosturePercentage}%)
Alerts: ${summary.alertCount}
    `;
    
    alert(summaryText);
  }

  generateSessionSummary() {
    const duration = this.sessionStartTime ? Date.now() - this.sessionStartTime : 0;
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    const averageScore = this.metricsHistory.length > 0 
      ? this.metricsHistory.reduce((sum, m) => sum + m.postureScore, 0) / this.metricsHistory.length
      : 0;
    
    const goodFrames = this.metricsHistory.filter(m => m.postureScore >= 70).length;
    const goodPercentage = this.metricsHistory.length > 0 ? (goodFrames / this.metricsHistory.length) * 100 : 0;
    
    return {
      duration: `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      averageScore: Math.round(averageScore),
      goodPostureTime: Math.round((goodPercentage / 100) * duration / 1000),
      goodPosturePercentage: Math.round(goodPercentage),
      alertCount: this.currentMetrics.alertCount
    };
  }

  async sendMetricsToBackend(metrics) {
    if (!this.api || !this.api.isAuthenticated() || !this.sessionId) {return;}

    try {
      await this.api.addPostureData({
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        postureScore: metrics.postureScore,
        headAngle: metrics.headTiltAngle,
        shoulderAngle: metrics.shoulderSlope,
        spineAngle: metrics.spineAlignment,
        isGoodPosture: metrics.postureScore >= 70
      });
    } catch (error) {
      console.error('Failed to send metrics to backend:', error);
    }
  }

  resetMetrics() {
    this.metricsHistory = [];
    this.performanceData.fpsHistory = [];
    this.currentMetrics.alertCount = 0;
    
    // Reset UI
    this.updateScoreDisplay(0);
    this.updateBreakdownBars({
      headPosition: 0,
      shoulderAlignment: 0,
      spineCurvature: 0
    });
    
    this.clearGraph();
    this.generateInitialInsights();
  }

  toggleGraphPause() {
    this.graphSettings.isPaused = !this.graphSettings.isPaused;
    
    const pauseBtn = document.getElementById('pauseGraph');
    if (pauseBtn) {
      pauseBtn.textContent = this.graphSettings.isPaused ? '▶️' : '⏸️';
    }
  }

  clearGraph() {
    this.metricsHistory = [];
    this.initializeGraph();
  }

  changeTimeRange(minutes) {
    this.graphSettings.timeRange = minutes;
    
    // Update header text
    const graphHeader = document.querySelector('.graph-header h4');
    if (graphHeader) {
      const timeText = minutes === 1 ? '1 Minute' : 
                     minutes < 60 ? `${minutes} Minutes` : 
                     `${minutes / 60} Hour${minutes > 60 ? 's' : ''}`;
      graphHeader.textContent = `📈 Posture Trend (Last ${timeText})`;
    }
    
    // Filter existing data
    const timeRange = minutes * 60 * 1000;
    const cutoff = Date.now() - timeRange;
    this.metricsHistory = this.metricsHistory.filter(point => point.timestamp >= cutoff);
    
    this.updateGraph();
  }

  toggleDashboardExpansion() {
    // Toggle fullscreen-like expansion
    const dashboard = document.querySelector('.metrics-dashboard');
    if (dashboard) {
      dashboard.classList.toggle('expanded');
    }
  }

  async saveReport() {
    const summary = this.generateSessionSummary();
    const reportData = {
      summary,
      metrics: this.metricsHistory,
      timestamp: new Date().toISOString()
    };

    // Create downloadable report
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `posture-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  async exportData() {
    const _data = {
      session: {
        id: this.sessionId,
        startTime: this.sessionStartTime,
        isActive: this.isSessionActive
      },
      metrics: this.currentMetrics,
      history: this.metricsHistory,
      summary: this.generateSessionSummary()
    };

    // Create CSV export
    const csv = this.convertToCSV(this.metricsHistory);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `posture-data-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  convertToCSV(data) {
    if (data.length === 0) {return '';}

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header] || '').join(','))
    ].join('\n');

    return csvContent;
  }

  // Public API
  getCurrentMetrics() {
    return { ...this.currentMetrics };
  }

  getSessionInfo() {
    return {
      isActive: this.isSessionActive,
      sessionId: this.sessionId,
      startTime: this.sessionStartTime,
      duration: this.sessionStartTime ? Date.now() - this.sessionStartTime : 0
    };
  }

  getMetricsHistory() {
    return [...this.metricsHistory];
  }
}

// Export for ES6 modules
export default MetricsManager;

// Also make available globally
window.MetricsManager = MetricsManager;
