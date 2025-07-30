/**
 * API Service for ProPostureFitness Backend Integration
 * Handles all HTTP requests and WebSocket connections
 */

class APIService {
  constructor() {
    this.baseURL = 'http://localhost:5001/api';
    this.token = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    this.socket = null;
    this.currentUser = null;
    this.currentSessionId = null;
    this.offlineMode = false;
    
    // Auto-refresh token when it expires
    this.setupTokenRefresh();
    
    // Check if backend is available
    this.checkBackendStatus();
  }

  // Check if backend is available
  async checkBackendStatus() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`, {
        method: 'GET',
        timeout: 3000
      });
      this.offlineMode = !response.ok;
    } catch (_error) {
      this.offlineMode = true;
    }
  }

  // Mock responses for offline mode
  getMockResponse(endpoint, options) {
    // Handle different endpoints with appropriate mock data
    if (endpoint === '/auth/login') {
      const body = JSON.parse(options.body || '{}');
      const { email, password } = body;
      
      // Check for admin credentials
      if (email === 'admin@proposturefitness.com' && password === 'admin123') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            message: 'Login successful',
            tokens: {
              accessToken: `mock_admin_token_${Date.now()}`,
              refreshToken: `mock_refresh_token_${Date.now()}`
            },
            user: {
              id: 'admin_001',
              email: 'admin@proposturefitness.com',
              username: 'admin',
              firstName: 'Admin',
              lastName: 'User',
              role: 'admin',
              isAdmin: true
            }
          })
        });
      }
      
      // Check for demo credentials
      if (email === 'demo@proposturefitness.com' && password === 'demo123456') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            message: 'Demo login successful',
            tokens: {
              accessToken: `mock_demo_token_${Date.now()}`,
              refreshToken: `mock_demo_refresh_${Date.now()}`
            },
            user: {
              id: 'demo_001',
              email: 'demo@proposturefitness.com',
              username: 'demo',
              firstName: 'Demo',
              lastName: 'User',
              role: 'user',
              isAdmin: false
            }
          })
        });
      }
      
      // Invalid credentials
      return Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          message: 'Invalid email or password'
        })
      });
    }
    
    if (endpoint === '/auth/register') {
      const body = JSON.parse(options.body || '{}');
      const userData = body;
      
      // Create new user (in offline mode, just return success)
      return Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          success: true,
          message: 'Registration successful',
          tokens: {
            accessToken: `mock_token_${Date.now()}`,
            refreshToken: `mock_refresh_${Date.now()}`
          },
          user: {
            id: `user_${Date.now()}`,
            email: userData.email,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: 'user',
            isAdmin: false,
            height: userData.height,
            weight: userData.weight,
            gender: userData.gender
          }
        })
      });
    }
    
    // Default mock response for other endpoints
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        message: 'Running in offline mode',
        data: {}
      })
    });
  }

  // Authentication Headers
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic request method with error handling
  async request(endpoint, options = {}) {
    // If in offline mode, return mock responses
    if (this.offlineMode) {
      const mockResponse = await this.getMockResponse(endpoint, options);
      return await this.handleResponse(mockResponse);
    }

    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401 && this.refreshToken) {
        // Try to refresh token
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the original request
          config.headers.Authorization = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, config);
          return await this.handleResponse(retryResponse);
        }
      }
      
      return await this.handleResponse(response);
      
    } catch (error) {
      console.error('API Request failed:', error);
      throw new Error(`Network error: ${error.message}`);
    }
  }

  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Request failed');
    }
    
    return data;
  }

  // Token Management
  setTokens(accessToken, refreshToken) {
    this.token = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.currentUser = null;
  }

  async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    
    // Refresh failed, clear tokens
    this.clearTokens();
    return false;
  }

  setupTokenRefresh() {
    // Check token expiry every 5 minutes
    setInterval(() => {
      if (this.token && this.refreshToken) {
        try {
          const payload = JSON.parse(atob(this.token.split('.')[1]));
          const expiryTime = payload.exp * 1000;
          const currentTime = Date.now();
          
          // Refresh if token expires in next 5 minutes
          if (expiryTime - currentTime < 5 * 60 * 1000) {
            this.refreshAccessToken();
          }
        } catch (error) {
          console.error('Error checking token expiry:', error);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Authentication API
  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    this.currentUser = data.user;
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    this.currentUser = data.user;
    return data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout request failed:', error);
    }
    
    this.clearTokens();
    this.disconnectWebSocket();
  }

  async changePassword(currentPassword, newPassword) {
    return await this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  // User Profile API
  async getProfile() {
    const data = await this.request('/users/profile');
    this.currentUser = data.user;
    return data;
  }

  async updateProfile(profileData) {
    const data = await this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    this.currentUser = data.user;
    return data;
  }

  async getUserStats(period = 'daily') {
    return await this.request(`/users/stats?period=${period}`);
  }

  async getUserGoals() {
    return await this.request('/users/goals');
  }

  async createGoal(goalData) {
    return await this.request('/users/goals', {
      method: 'POST',
      body: JSON.stringify(goalData)
    });
  }

  async updateGoal(goalId, goalData) {
    return await this.request(`/users/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(goalData)
    });
  }

  // Posture Sessions API
  async getPostureSessions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/posture/sessions?${queryString}`);
  }

  async getPostureSession(sessionId) {
    return await this.request(`/posture/sessions/${sessionId}`);
  }

  async createPostureSession(sessionData) {
    const data = await this.request('/posture/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
    this.currentSessionId = data.session.id;
    return data;
  }

  async updatePostureSession(sessionId, sessionData) {
    return await this.request(`/posture/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(sessionData)
    });
  }

  async deletePostureSession(sessionId) {
    return await this.request(`/posture/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  }

  async addPostureData(postureData) {
    return await this.request('/posture/data', {
      method: 'POST',
      body: JSON.stringify(postureData)
    });
  }

  async getSessionData(sessionId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/posture/sessions/${sessionId}/data?${queryString}`);
  }

  // Analytics API
  async getAnalyticsDashboard(period = '30d') {
    return await this.request(`/analytics/dashboard?period=${period}`);
  }

  async getPostureAnalysis(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/analytics/posture-analysis?${queryString}`);
  }

  async getProgressData(metric = 'score', period = '30d') {
    return await this.request(`/analytics/progress?metric=${metric}&period=${period}`);
  }

  async compareSessions(sessionIds) {
    return await this.request(`/analytics/compare?sessionIds=${sessionIds.join(',')}`);
  }

  // WebSocket Connection
  connectWebSocket() {
    if (!this.token) {
      console.error('Cannot connect WebSocket: No authentication token');
      return;
    }

    if (this.socket && this.socket.connected) {
      return;
    }

    // Import Socket.IO (assuming it's loaded globally)
    // eslint-disable-next-line no-undef
    this.socket = io('http://localhost:5001', {
      auth: {
        token: this.token
      },
      transports: ['websocket', 'polling']
    });

    this.setupWebSocketListeners();
  }

  setupWebSocketListeners() {
    if (!this.socket) {return;}

    this.socket.on('connect', () => {
      this.onWebSocketConnected();
    });

    this.socket.on('disconnect', (reason) => {
      this.onWebSocketDisconnected(reason);
    });

    this.socket.on('connected', (_data) => {
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Real-time posture data
    this.socket.on('posture_data', (data) => {
      this.onPostureDataReceived(data);
    });

    this.socket.on('posture_alert', (alert) => {
      this.onPostureAlert(alert);
    });

    // Session events
    this.socket.on('session_started', (data) => {
      this.onSessionStarted(data);
    });

    this.socket.on('session_ended', (data) => {
      this.onSessionEnded(data);
    });

    // Goal events
    this.socket.on('goal_achieved', (data) => {
      this.onGoalAchieved(data);
    });

    this.socket.on('goal_progress', (data) => {
      this.onGoalProgress(data);
    });
  }

  // WebSocket Methods
  joinSession(sessionId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_session', { sessionId });
    }
  }

  leaveSession(sessionId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_session', { sessionId });
    }
  }

  startPostureStreaming(sessionId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('posture_stream_start', { sessionId });
    }
  }

  stopPostureStreaming() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('posture_stream_stop');
    }
  }

  sendPostureData(postureData) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('posture_data_stream', postureData);
    }
  }

  updateGoalProgress(goalId, currentValue) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('goal_progress_update', { goalId, currentValue });
    }
  }

  disconnectWebSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Event Handlers (to be overridden by UI components)
  onWebSocketConnected() {
    // Override in UI components
  }

  onWebSocketDisconnected(_reason) {
    // Override in UI components
  }

  onPostureDataReceived(_data) {
    // Override in UI components
  }

  onPostureAlert(_alert) {
    // Override in UI components
  }

  onSessionStarted(_data) {
    // Override in UI components
  }

  onSessionEnded(_data) {
    // Override in UI components
  }

  onGoalAchieved(_data) {
    // Override in UI components
  }

  onGoalProgress(_data) {
    // Override in UI components
  }

  // Utility Methods
  isAuthenticated() {
    return !!this.token;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getCurrentSessionId() {
    return this.currentSessionId;
  }
}

// Create global instance
const apiService = new APIService();

// Export for ES6 modules
export default apiService;

// Also make available globally
window.APIService = apiService;
