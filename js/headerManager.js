/**
 * Header Manager for Enhanced ProPostureFitness Header
 * Handles theme switching, language selection, notifications, and user profile dropdown
 */

class HeaderManager {
  constructor(apiService, authManager) {
    this.api = apiService;
    this.authManager = authManager;
    this.currentLanguage = 'en';
    this.theme = localStorage.getItem('theme') || 'dark';
    this.notifications = [];
    this.unreadCount = 0;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupTheme();
    this.setupLanguage();
    this.loadNotifications();
    this.setupWebSocketHandlers();
    this.setupConnectionStatus();
    
    // Integrate with auth manager
    if (this.authManager) {
      this.authManager.onAuthStateChange = (isAuthenticated, user) => {
        this.handleAuthStateChange(isAuthenticated, user);
      };
    }
  }

  setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle?.addEventListener('click', () => this.toggleTheme());

    // Language selector
    const languageBtn = document.getElementById('languageBtn');
    const languageDropdown = document.getElementById('languageDropdown');
    
    languageBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown(languageDropdown);
    });

    // Language options
    const langOptions = document.querySelectorAll('.lang-option');
    langOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        const lang = e.currentTarget.dataset.lang;
        this.changeLanguage(lang);
      });
    });

    // Notifications
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationsDropdown = document.getElementById('notificationsDropdown');
    
    notificationBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown(notificationsDropdown);
      this.markNotificationsAsRead();
    });

    const markAllRead = document.getElementById('markAllRead');
    markAllRead?.addEventListener('click', () => this.markAllNotificationsRead());

    // User profile dropdown
    const userProfileBtn = document.getElementById('userProfileBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    userProfileBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown(userDropdown);
      userProfileBtn.classList.toggle('active');
    });

    // User dropdown menu items
    this.setupUserDropdownItems();

    // Settings button
    const headerSettingsBtn = document.getElementById('headerSettingsBtn');
    headerSettingsBtn?.addEventListener('click', () => {
      document.getElementById('settingsBtn')?.click(); // Trigger existing settings modal
    });

    // Auth button
    const authBtn = document.getElementById('authBtn');
    authBtn?.addEventListener('click', () => {
      this.authManager?.showAuthUI();
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      this.closeAllDropdowns();
    });

    // Prevent dropdown close when clicking inside
    const dropdowns = document.querySelectorAll('.language-dropdown, .notifications-dropdown, .user-dropdown');
    dropdowns.forEach(dropdown => {
      dropdown.addEventListener('click', (e) => e.stopPropagation());
    });
  }

  setupUserDropdownItems() {
    // View Profile
    document.getElementById('viewProfile')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.viewProfile();
    });

    // Edit Profile
    document.getElementById('editProfile')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.editProfile();
    });

    // View Stats
    document.getElementById('viewStats')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.viewStats();
    });

    // Manage Goals
    document.getElementById('manageGoals')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.manageGoals();
    });

    // Account Settings
    document.getElementById('accountSettings')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.accountSettings();
    });

    // Help & Support
    document.getElementById('helpSupport')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.helpSupport();
    });

    // Logout
    document.getElementById('headerLogout')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.logout();
    });
  }

  setupTheme() {
    document.body.className = this.theme === 'light' ? 'light-theme' : '';
    this.updateThemeToggle();
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', this.theme);
    document.body.className = this.theme === 'light' ? 'light-theme' : '';
    this.updateThemeToggle();
    
    // Emit theme change event
    this.emitEvent('themeChanged', { theme: this.theme });
  }

  updateThemeToggle() {
    const lightIcon = document.querySelector('.theme-icon.light');
    const darkIcon = document.querySelector('.theme-icon.dark');
    
    if (this.theme === 'light') {
      lightIcon.style.display = 'none';
      darkIcon.style.display = 'inline';
    } else {
      lightIcon.style.display = 'inline';
      darkIcon.style.display = 'none';
    }
  }

  setupLanguage() {
    const savedLang = localStorage.getItem('language') || 'en';
    this.changeLanguage(savedLang);
  }

  changeLanguage(lang) {
    this.currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // Update language button text
    const langText = document.querySelector('.lang-text');
    const langMap = {
      en: 'EN',
      es: 'ES', 
      fr: 'FR',
      ar: 'AR'
    };
    
    if (langText) {
      langText.textContent = langMap[lang] || 'EN';
    }

    // Close dropdown
    this.closeAllDropdowns();
    
    // Apply language to page (basic implementation)
    this.applyLanguage(lang);
    
    // Emit language change event
    this.emitEvent('languageChanged', { language: lang });
  }

  applyLanguage(lang) {
    // Basic language application - in a real app, you'd use i18n library
    const translations = {
      en: {
        connected: 'Connected',
        disconnected: 'Disconnected',
        connecting: 'Connecting...',
        notifications: 'Notifications',
        markAllRead: 'Mark all read',
        viewAllNotifications: 'View all notifications',
        login: 'Login',
        logout: 'Logout'
      },
      es: {
        connected: 'Conectado',
        disconnected: 'Desconectado', 
        connecting: 'Conectando...',
        notifications: 'Notificaciones',
        markAllRead: 'Marcar como leído',
        viewAllNotifications: 'Ver todas las notificaciones',
        login: 'Iniciar sesión',
        logout: 'Cerrar sesión'
      },
      fr: {
        connected: 'Connecté',
        disconnected: 'Déconnecté',
        connecting: 'Connexion...',
        notifications: 'Notifications', 
        markAllRead: 'Tout marquer comme lu',
        viewAllNotifications: 'Voir toutes les notifications',
        login: 'Se connecter',
        logout: 'Se déconnecter'
      },
      ar: {
        connected: 'متصل',
        disconnected: 'غير متصل',
        connecting: 'جاري الاتصال...',
        notifications: 'الإشعارات',
        markAllRead: 'تحديد الكل كمقروء',
        viewAllNotifications: 'عرض جميع الإشعارات',
        login: 'تسجيل الدخول',
        logout: 'تسجيل الخروج'
      }
    };

    const t = translations[lang] || translations.en;
    
    // Update status text
    const statusText = document.querySelector('.status-text');
    if (statusText && statusText.textContent.includes('Connected')) {
      statusText.textContent = t.connected;
    }

    // Update other translatable elements
    document.querySelector('.notifications-header h4')?.replaceWith(Object.assign(document.createElement('h4'), { textContent: t.notifications }));
    document.querySelector('.mark-all-read')?.replaceWith(Object.assign(document.createElement('button'), { 
      className: 'mark-all-read', 
      textContent: t.markAllRead,
      onclick: () => this.markAllNotificationsRead()
    }));
    
    // Apply RTL for Arabic
    if (lang === 'ar') {
      document.dir = 'rtl';
      document.body.classList.add('rtl');
    } else {
      document.dir = 'ltr';
      document.body.classList.remove('rtl');
    }
  }

  async loadNotifications() {
    try {
      if (!this.api.isAuthenticated()) return;
      
      // Get notifications from backend
      const response = await this.api.request('/users/notifications');
      this.notifications = response.notifications || [];
      this.updateNotificationUI();
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Fallback to sample notifications
      this.loadSampleNotifications();
    }
  }

  loadSampleNotifications() {
    this.notifications = [
      {
        id: 1,
        title: 'Welcome to ProPostureFitness!',
        message: 'Start your first session to begin tracking your posture.',
        type: 'welcome',
        isRead: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Posture Alert',
        message: 'Poor posture detected. Take a break and adjust your position.',
        type: 'posture_alert',
        isRead: false,
        createdAt: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
      },
      {
        id: 3,
        title: 'Goal Achievement',
        message: 'Congratulations! You\'ve reached your daily posture goal.',
        type: 'achievement',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      }
    ];
    this.updateNotificationUI();
  }

  updateNotificationUI() {
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
    
    // Update badge
    const badge = document.getElementById('notificationBadge');
    if (badge) {
      badge.textContent = this.unreadCount;
      badge.className = this.unreadCount > 0 ? 'notification-badge has-notifications' : 'notification-badge';
    }

    // Update notifications list
    this.renderNotificationsList();
  }

  renderNotificationsList() {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;

    if (this.notifications.length === 0) {
      notificationsList.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
          <p>No notifications yet</p>
        </div>
      `;
      return;
    }

    notificationsList.innerHTML = this.notifications.map(notification => `
      <div class="notification-item ${!notification.isRead ? 'unread' : ''}" data-id="${notification.id}">
        <div class="notification-content">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-message">${notification.message}</div>
          <div class="notification-time">${this.formatTime(notification.createdAt)}</div>
        </div>
      </div>
    `).join('');

    // Add click handlers
    notificationsList.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = parseInt(item.dataset.id);
        this.markNotificationAsRead(id);
      });
    });
  }

  formatTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  }

  markNotificationsAsRead() {
    // Mark visible notifications as read when dropdown is opened
    const unreadNotifications = this.notifications.filter(n => !n.isRead);
    unreadNotifications.forEach(notification => {
      notification.isRead = true;
    });
    this.updateNotificationUI();
  }

  markNotificationAsRead(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      this.updateNotificationUI();
      
      // Send to backend
      if (this.api.isAuthenticated()) {
        this.api.request(`/users/notifications/${id}/read`, { method: 'PUT' }).catch(console.error);
      }
    }
  }

  async markAllNotificationsRead() {
    this.notifications.forEach(notification => {
      notification.isRead = true;
    });
    this.updateNotificationUI();

    // Send to backend
    if (this.api.isAuthenticated()) {
      try {
        await this.api.request('/users/notifications/read-all', { method: 'PUT' });
      } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
      }
    }
  }

  addNotification(notification) {
    this.notifications.unshift({
      id: Date.now(),
      isRead: false,
      createdAt: new Date().toISOString(),
      ...notification
    });
    this.updateNotificationUI();

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/favicon.ico'
      });
    }
  }

  setupConnectionStatus() {
    this.updateConnectionStatus('connecting');
    
    // Monitor WebSocket connection
    if (this.api.socket) {
      this.api.socket.on('connect', () => {
        this.updateConnectionStatus('connected');
      });
      
      this.api.socket.on('disconnect', () => {
        this.updateConnectionStatus('disconnected');
      });
    }
  }

  updateConnectionStatus(status) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    if (statusDot) {
      statusDot.className = `status-dot ${status}`;
    }
    
    if (statusText) {
      const statusMap = {
        connected: 'Connected',
        disconnected: 'Disconnected', 
        connecting: 'Connecting...'
      };
      statusText.textContent = statusMap[status] || 'Unknown';
    }
  }

  setupWebSocketHandlers() {
    if (!this.api.socket) return;

    // Handle real-time notifications
    this.api.socket.on('notification', (notification) => {
      this.addNotification(notification);
    });

    // Handle posture alerts
    this.api.socket.on('posture_alert', (alert) => {
      this.addNotification({
        title: 'Posture Alert',
        message: alert.message || 'Poor posture detected. Please adjust your position.',
        type: 'posture_alert'
      });
    });

    // Handle goal achievements
    this.api.socket.on('goal_achieved', (goal) => {
      this.addNotification({
        title: 'Goal Achieved!',
        message: `Congratulations! You've achieved your ${goal.type} goal.`,
        type: 'achievement'
      });
    });
  }

  handleAuthStateChange(isAuthenticated, user) {
    const userProfileContainer = document.getElementById('userProfileContainer');
    const authBtn = document.getElementById('authBtn');

    if (isAuthenticated && user) {
      // Show user profile, hide auth button
      userProfileContainer.style.display = 'block';
      authBtn.style.display = 'none';
      
      // Update user info
      this.updateUserInfo(user);
      
      // Load notifications
      this.loadNotifications();
    } else {
      // Hide user profile, show auth button
      userProfileContainer.style.display = 'none';
      authBtn.style.display = 'block';
      
      // Clear notifications
      this.notifications = [];
      this.updateNotificationUI();
    }
  }

  updateUserInfo(user) {
    // Generate user initials
    const initials = this.generateInitials(user.firstName, user.lastName, user.username);
    
    // Update all user initials
    document.querySelectorAll('.user-initials').forEach(el => {
      el.textContent = initials;
    });
    
    // Update user names
    const headerUserName = document.getElementById('headerUserName');
    const dropdownUserName = document.getElementById('dropdownUserName');
    const displayName = user.firstName || user.username || 'User';
    
    if (headerUserName) headerUserName.textContent = displayName;
    if (dropdownUserName) dropdownUserName.textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
    
    // Update email
    const dropdownUserEmail = document.getElementById('dropdownUserEmail');
    if (dropdownUserEmail) dropdownUserEmail.textContent = user.email;
  }

  generateInitials(firstName, lastName, username) {
    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    } else if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    } else if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return 'U';
  }

  toggleDropdown(dropdown) {
    // Close other dropdowns first
    this.closeAllDropdowns();
    
    // Toggle the target dropdown
    if (dropdown) {
      dropdown.classList.toggle('active');
    }
  }

  closeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.language-dropdown, .notifications-dropdown, .user-dropdown');
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('active');
    });
    
    // Remove active state from user profile button
    const userProfileBtn = document.getElementById('userProfileBtn');
    userProfileBtn?.classList.remove('active');
  }

  // User dropdown actions
  async viewProfile() {
    this.closeAllDropdowns();
    console.log('View Profile clicked');
    // TODO: Implement profile view modal/page
  }

  async editProfile() {
    this.closeAllDropdowns();
    console.log('Edit Profile clicked');
    // TODO: Implement profile edit modal/page
  }

  async viewStats() {
    this.closeAllDropdowns();
    console.log('View Stats clicked');
    // TODO: Implement stats view modal/page
  }

  async manageGoals() {
    this.closeAllDropdowns();
    console.log('Manage Goals clicked');
    // TODO: Implement goals management modal/page
  }

  async accountSettings() {
    this.closeAllDropdowns();
    console.log('Account Settings clicked');
    // TODO: Implement account settings modal/page
  }

  async helpSupport() {
    this.closeAllDropdowns();
    console.log('Help & Support clicked');
    // TODO: Implement help/support modal/page
  }

  async logout() {
    this.closeAllDropdowns();
    await this.authManager?.handleLogout();
  }

  // Utility method to emit custom events
  emitEvent(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });
    document.dispatchEvent(event);
  }

  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }
}

// Export for ES6 modules
export default HeaderManager;

// Also make available globally
window.HeaderManager = HeaderManager;