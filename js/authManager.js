/**
 * Authentication Manager for ProPostureFitness
 * Handles login/register UI and user session management
 */

class AuthManager {
  constructor(apiService) {
    this.api = apiService;
    this.isAuthUIVisible = false;
    this.onAuthStateChange = null; // Callback for auth state changes
    
    this.init();
  }

  init() {
    this.createAuthUI();
    this.setupEventListeners();
    
    // Check if user is already authenticated
    if (this.api.isAuthenticated()) {
      this.loadUserProfile();
    } else {
      this.showAuthUI();
    }
  }

  createAuthUI() {
    // Create auth modal overlay
    const authOverlay = document.createElement('div');
    authOverlay.id = 'auth-overlay';
    authOverlay.className = 'auth-overlay';
    authOverlay.innerHTML = `
      <div class="auth-modal">
        <div class="auth-header">
          <h2 id="auth-title">Welcome to ProPostureFitness</h2>
          <div class="auth-tabs">
            <button id="login-tab" class="auth-tab active">Login</button>
            <button id="register-tab" class="auth-tab">Register</button>
          </div>
        </div>
        
        <div class="auth-content">
          <!-- Login Form -->
          <form id="login-form" class="auth-form active">
            <div class="form-group">
              <label for="login-email">Email</label>
              <input type="email" id="login-email" required placeholder="Enter your email" value="admin@proposturefitness.com">
            </div>
            <div class="form-group">
              <label for="login-password">Password</label>
              <input type="password" id="login-password" required placeholder="Enter your password" value="admin123">
            </div>
            <button type="submit" class="auth-btn primary">Login</button>
            <button type="button" id="skip-auth-btn" class="auth-btn secondary">Skip & Continue (Demo Mode)</button>
            <div class="demo-account">
              <p>Admin Account:</p>
              <small>Email: admin@proposturefitness.com</small><br>
              <small>Password: admin123</small>
              <hr style="margin: 10px 0;">
              <p>Demo Account:</p>
              <small>Email: demo@proposturefitness.com</small><br>
              <small>Password: demo123456</small>
            </div>
          </form>

          <!-- Register Form -->
          <form id="register-form" class="auth-form">
            <div class="form-row">
              <div class="form-group">
                <label for="register-firstname">First Name</label>
                <input type="text" id="register-firstname" placeholder="First name">
              </div>
              <div class="form-group">
                <label for="register-lastname">Last Name</label>
                <input type="text" id="register-lastname" placeholder="Last name">
              </div>
            </div>
            <div class="form-group">
              <label for="register-username">Username</label>
              <input type="text" id="register-username" required placeholder="Choose a username">
            </div>
            <div class="form-group">
              <label for="register-email">Email</label>
              <input type="email" id="register-email" required placeholder="Enter your email">
            </div>
            <div class="form-group">
              <label for="register-password">Password</label>
              <input type="password" id="register-password" required placeholder="Choose a password (min 8 characters)">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="register-height">Height (cm)</label>
                <input type="number" id="register-height" placeholder="175" min="100" max="250">
              </div>
              <div class="form-group">
                <label for="register-weight">Weight (kg)</label>
                <input type="number" id="register-weight" placeholder="70" min="30" max="200">
              </div>
            </div>
            <div class="form-group">
              <label for="register-gender">Gender</label>
              <select id="register-gender">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button type="submit" class="auth-btn primary">Create Account</button>
          </form>
        </div>

        <div class="auth-loading" id="auth-loading" style="display: none;">
          <div class="spinner"></div>
          <p>Processing...</p>
        </div>

        <div class="auth-error" id="auth-error" style="display: none;">
          <p id="auth-error-message"></p>
          <button id="auth-error-close" class="auth-btn secondary">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(authOverlay);
    this.addAuthStyles();
  }

  addAuthStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .auth-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
      }

      .auth-modal {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 480px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      }

      .auth-header {
        padding: 24px 24px 0;
        text-align: center;
      }

      .auth-header h2 {
        margin: 0 0 20px;
        color: #333;
        font-size: 24px;
      }

      .auth-tabs {
        display: flex;
        border-bottom: 1px solid #eee;
      }

      .auth-tab {
        flex: 1;
        padding: 12px;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 16px;
        color: #666;
        border-bottom: 2px solid transparent;
        transition: all 0.3s ease;
      }

      .auth-tab.active {
        color: #007bff;
        border-bottom-color: #007bff;
      }

      .auth-content {
        padding: 24px;
      }

      .auth-form {
        display: none;
      }

      .auth-form.active {
        display: block;
      }

      .form-row {
        display: flex;
        gap: 12px;
      }

      .form-group {
        margin-bottom: 16px;
        flex: 1;
      }

      .form-group label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        color: #333;
      }

      .form-group input,
      .form-group select {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
        transition: border-color 0.3s ease;
      }

      .form-group input:focus,
      .form-group select:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
      }

      .auth-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 100%;
        margin-top: 8px;
      }

      .auth-btn.primary {
        background: #007bff;
        color: white;
      }

      .auth-btn.primary:hover {
        background: #0056b3;
      }

      .auth-btn.secondary {
        background: #6c757d;
        color: white;
      }

      .auth-btn.secondary:hover {
        background: #545b62;
      }

      .demo-account {
        margin-top: 16px;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 6px;
        text-align: center;
      }

      .demo-account p {
        margin: 0 0 4px;
        font-weight: 500;
        color: #495057;
      }

      .demo-account small {
        color: #6c757d;
      }

      .auth-loading {
        padding: 40px;
        text-align: center;
        color: #666;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .auth-error {
        padding: 24px;
        text-align: center;
        background: #f8d7da;
        color: #721c24;
        border-radius: 6px;
        margin: 16px 24px;
      }

      .auth-error p {
        margin: 0 0 16px;
      }

      .user-info {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .user-info .user-name {
        font-weight: 500;
        color: #333;
      }

      .user-info .logout-btn {
        padding: 6px 12px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }

      .user-info .logout-btn:hover {
        background: #c82333;
      }
    `;
    document.head.appendChild(style);
  }

  setupEventListeners() {
    // Tab switching
    document.getElementById('login-tab').addEventListener('click', () => {
      this.switchTab('login');
    });

    document.getElementById('register-tab').addEventListener('click', () => {
      this.switchTab('register');
    });

    // Form submissions
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    document.getElementById('register-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister();
    });

    // Skip authentication button
    document.getElementById('skip-auth-btn').addEventListener('click', () => {
      this.skipAuthentication();
    });

    // Error close
    document.getElementById('auth-error-close').addEventListener('click', () => {
      this.hideError();
    });
  }

  switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`${tab}-tab`).classList.add('active');

    // Update forms
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById(`${tab}-form`).classList.add('active');

    // Update title
    const title = tab === 'login' ? 'Welcome Back' : 'Create Account';
    document.getElementById('auth-title').textContent = title;
  }

  async handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      this.showError('Please fill in all fields');
      return;
    }

    this.showLoading();

    try {
      const response = await this.api.login(email, password);
      console.log('Login successful:', response);
      
      this.hideAuthUI();
      this.showUserInfo();
      
      // Connect WebSocket
      this.api.connectWebSocket();
      
      // Trigger auth state change callback
      if (this.onAuthStateChange) {
        this.onAuthStateChange(true, response.user);
      }

    } catch (error) {
      console.error('Login failed:', error);
      this.showError(error.message || 'Login failed. Please try again.');
    } finally {
      this.hideLoading();
    }
  }

  async handleRegister() {
    const userData = {
      username: document.getElementById('register-username').value,
      email: document.getElementById('register-email').value,
      password: document.getElementById('register-password').value,
      firstName: document.getElementById('register-firstname').value,
      lastName: document.getElementById('register-lastname').value,
      height: parseFloat(document.getElementById('register-height').value) || undefined,
      weight: parseFloat(document.getElementById('register-weight').value) || undefined,
      gender: document.getElementById('register-gender').value || undefined
    };

    if (!userData.username || !userData.email || !userData.password) {
      this.showError('Please fill in all required fields');
      return;
    }

    if (userData.password.length < 8) {
      this.showError('Password must be at least 8 characters long');
      return;
    }

    this.showLoading();

    try {
      const response = await this.api.register(userData);
      console.log('Registration successful:', response);
      
      this.hideAuthUI();
      this.showUserInfo();
      
      // Connect WebSocket
      this.api.connectWebSocket();
      
      // Trigger auth state change callback
      if (this.onAuthStateChange) {
        this.onAuthStateChange(true, response.user);
      }

    } catch (error) {
      console.error('Registration failed:', error);
      this.showError(error.message || 'Registration failed. Please try again.');
    } finally {
      this.hideLoading();
    }
  }

  skipAuthentication() {
    console.log('Skipping authentication - entering demo mode');
    
    // Set demo user data
    const demoUser = {
      id: 'demo_user',
      email: 'demo@proposturefitness.com',
      username: 'demo',
      firstName: 'Demo',
      lastName: 'User',
      role: 'user',
      isAdmin: false
    };
    
    // Set demo token
    this.api.token = 'demo_token_' + Date.now();
    this.api.currentUser = demoUser;
    localStorage.setItem('access_token', this.api.token);
    localStorage.setItem('demo_mode', 'true');
    
    this.hideAuthUI();
    this.showUserInfo();
    
    // Trigger auth state change callback
    if (this.onAuthStateChange) {
      this.onAuthStateChange(true, demoUser);
    }
  }

  async loadUserProfile() {
    try {
      const response = await this.api.getProfile();
      this.showUserInfo();
      
      // Connect WebSocket
      this.api.connectWebSocket();
      
      // Trigger auth state change callback
      if (this.onAuthStateChange) {
        this.onAuthStateChange(true, response.user);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      this.showAuthUI();
    }
  }

  showAuthUI() {
    document.getElementById('auth-overlay').style.display = 'flex';
    this.isAuthUIVisible = true;
  }

  hideAuthUI() {
    document.getElementById('auth-overlay').style.display = 'none';
    this.isAuthUIVisible = false;
  }

  showUserInfo() {
    const user = this.api.getCurrentUser();
    if (!user) return;

    // Remove existing old user info overlay if it exists
    const existing = document.getElementById('user-info');
    if (existing) existing.remove();

    // The new header will handle user info display
    // Just trigger the auth state change callback for header integration
    if (this.onAuthStateChange) {
      this.onAuthStateChange(true, user);
    }
  }

  async handleLogout() {
    try {
      await this.api.logout();
      
      // Remove user info
      const userInfo = document.getElementById('user-info');
      if (userInfo) userInfo.remove();
      
      // Show auth UI
      this.showAuthUI();
      
      // Clear forms
      document.getElementById('login-form').reset();
      document.getElementById('register-form').reset();
      
      // Trigger auth state change callback
      if (this.onAuthStateChange) {
        this.onAuthStateChange(false, null);
      }
      
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  showLoading() {
    document.querySelector('.auth-content').style.display = 'none';
    document.getElementById('auth-loading').style.display = 'block';
  }

  hideLoading() {
    document.querySelector('.auth-content').style.display = 'block';
    document.getElementById('auth-loading').style.display = 'none';
  }

  showError(message) {
    document.getElementById('auth-error-message').textContent = message;
    document.getElementById('auth-error').style.display = 'block';
  }

  hideError() {
    document.getElementById('auth-error').style.display = 'none';
  }

  // Public methods
  isAuthenticated() {
    return this.api.isAuthenticated();
  }

  getCurrentUser() {
    return this.api.getCurrentUser();
  }

  setAuthStateChangeCallback(callback) {
    this.onAuthStateChange = callback;
  }
}

export default AuthManager;