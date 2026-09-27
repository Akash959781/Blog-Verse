/**
 * ==========================================================================
 * BLOGVERSE - AUTHENTICATION & SESSION MANAGER (Hybrid API + Local Fallback)
 * Delegates to api.js for server operations, with instant local fallback
 * if the backend server is temporarily unreachable.
 * ==========================================================================
 */

const AUTH_KEYS = {
  THEME: "blogverse_theme",
  TOKEN: "blogverse_token",
  USER: "blogverse_current_user",
};

const auth = {
  /** Returns the cached user object from localStorage */
  getCurrentUser() {
    return api.auth.getCurrentUser();
  },

  /** True if user has an active session */
  isAuthenticated() {
    return api.auth.isAuthenticated();
  },

  /**
   * Login — calls the backend API first; falls back to local user store if network offline
   */
  async login(email, password) {
    try {
      return await api.auth.login(email, password);
    } catch (error) {
      // If error is network unreachable, provide local fallback
      if (error.message && error.message.includes("Cannot connect")) {
        console.warn("Backend unavailable. Attempting offline authentication:", error.message);
        return this._localLogin(email, password);
      }
      throw error;
    }
  },

  /**
   * Demo login — 1-click login as Alex Rivera
   */
  async loginAsDemo() {
    try {
      return await api.auth.login("alex@example.com", "Demo@1234");
    } catch (error) {
      if (error.message && error.message.includes("Cannot connect")) {
        console.warn("Backend offline. Logging in via offline demo session.");
        return this._localDemoLogin();
      }
      throw error;
    }
  },

  /**
   * Register new user account
   */
  async register(userData) {
    try {
      return await api.auth.register(userData);
    } catch (error) {
      if (error.message && error.message.includes("Cannot connect")) {
        console.warn("Backend offline. Creating local account session.");
        return this._localRegister(userData);
      }
      throw error;
    }
  },

  /** Logout */
  logout() {
    api.auth.logout();
  },

  // ── Local Offline Auth Helpers ────────────────────────────────────────────
  _localLogin(email, password) {
    const demoUser = typeof window.SEED_USERS !== "undefined"
      ? window.SEED_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase())
      : null;

    const user = demoUser || {
      id: "user-" + Date.now(),
      name: email.split("@")[0],
      email: email,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
      role: "Member",
      bio: "Local session",
      joinedDate: "Today",
    };

    const token = "offline_jwt_token_" + Date.now();
    localStorage.setItem(AUTH_KEYS.TOKEN, token);
    localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
    return { success: true, token, user };
  },

  _localDemoLogin() {
    const alex = {
      id: "650000000000000000000001",
      name: "Alex Rivera",
      email: "alex@example.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
      role: "Senior Frontend Engineer & Designer",
      bio: "Passionate about building fluid, accessible, and delightful digital experiences.",
      joinedDate: "Jan 2025",
    };
    const token = "offline_jwt_token_alex";
    localStorage.setItem(AUTH_KEYS.TOKEN, token);
    localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(alex));
    return { success: true, token, user: alex };
  },

  _localRegister(userData) {
    const newUser = {
      id: "user-" + Date.now(),
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
      role: userData.role || "Creator",
      bio: userData.bio || "Member",
      joinedDate: "Today",
    };
    const token = "offline_jwt_token_" + Date.now();
    localStorage.setItem(AUTH_KEYS.TOKEN, token);
    localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(newUser));
    return { success: true, token, user: newUser };
  },
};

// Expose globally
window.auth = auth;
