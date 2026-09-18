/**
 * ==========================================================================
 * BLOGVERSE - AUTHENTICATION & SESSION MANAGER
 * Manages user accounts, demo logins, registration, and active sessions
 * ==========================================================================
 */

const AUTH_KEYS = {
  CURRENT_USER: "blogverse_current_user",
  USERS_LIST: "blogverse_users"
};

class AuthManager {
  constructor() {
    this.initUsers();
  }

  initUsers() {
    if (!localStorage.getItem(AUTH_KEYS.USERS_LIST)) {
      localStorage.setItem(AUTH_KEYS.USERS_LIST, JSON.stringify(SEED_USERS));
    }
  }

  getRegisteredUsers() {
    try {
      const users = localStorage.getItem(AUTH_KEYS.USERS_LIST);
      return users ? JSON.parse(users) : [];
    } catch (e) {
      return SEED_USERS;
    }
  }

  getCurrentUser() {
    try {
      const user = localStorage.getItem(AUTH_KEYS.CURRENT_USER);
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  }

  isAuthenticated() {
    return !!this.getCurrentUser();
  }

  login(email, password) {
    const users = this.getRegisteredUsers();
    // In our client-side demo, we match by email
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return { success: false, message: "User with this email not found." };
    }

    // Set session
    localStorage.setItem(AUTH_KEYS.CURRENT_USER, JSON.stringify(user));
    return { success: true, user };
  }

  loginAsDemo() {
    const demoUser = SEED_USERS[0]; // Alex Rivera
    localStorage.setItem(AUTH_KEYS.CURRENT_USER, JSON.stringify(demoUser));
    return demoUser;
  }

  register(newUserData) {
    const users = this.getRegisteredUsers();
    const emailExists = users.some(u => u.email.toLowerCase() === newUserData.email.toLowerCase().trim());
    if (emailExists) {
      return { success: false, message: "Email is already registered. Please log in." };
    }

    const newUser = {
      id: "user-" + Date.now(),
      name: newUserData.name.trim(),
      email: newUserData.email.toLowerCase().trim(),
      avatar: newUserData.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80",
      role: newUserData.role || "Creator & Tech Enthusiast",
      bio: newUserData.bio || "Writer and reader on Blogverse.",
      joinedDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })
    };

    users.push(newUser);
    localStorage.setItem(AUTH_KEYS.USERS_LIST, JSON.stringify(users));
    localStorage.setItem(AUTH_KEYS.CURRENT_USER, JSON.stringify(newUser));

    return { success: true, user: newUser };
  }

  logout() {
    localStorage.removeItem(AUTH_KEYS.CURRENT_USER);
  }
}

const auth = new AuthManager();
