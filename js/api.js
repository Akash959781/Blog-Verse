/**
 * ==========================================================================
 * BLOGVERSE - API CLIENT
 * Centralized HTTP client that replaces all localStorage data operations.
 * Manages JWT token storage, auth headers, and all API calls.
 * ==========================================================================
 *
 * HOW TO USE:
 *   await api.auth.login(email, password)
 *   await api.posts.getAll({ category: "Tech & AI" })
 *   await api.posts.create({ title, content, ... })
 */

// ─── Backend API URL ─────────────────────────────────────────────────────────
const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  !window.location.hostname ||
  window.location.protocol === "file:"
    ? "http://localhost:5000"
    : window.location.origin;

const TOKEN_KEY = "blogverse_token";
const USER_KEY = "blogverse_current_user";

// ─── Core HTTP Helper ─────────────────────────────────────────────────────────
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getHeaders(requiresAuth = false) {
    const headers = { "Content-Type": "application/json" };
    if (requiresAuth) {
      const token = this.getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(method, endpoint, { body, auth = false, params } = {}) {
    let url = `${this.baseURL}${endpoint}`;

    // Append query params
    if (params) {
      const queryString = new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).filter(
            ([, v]) => v !== undefined && v !== null && v !== ""
          )
        )
      ).toString();
      if (queryString) url += `?${queryString}`;
    }

    const options = {
      method,
      headers: this.getHeaders(auth),
    };

    if (body) options.body = JSON.stringify(body);

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        // Handle 401 unauthorized — clear token and redirect to login
        if (response.status === 401) {
          this.clearToken();
          const currentPage = window.location.pathname;
          const protectedPages = ["/dashboard.html", "/create-blog.html"];
          if (protectedPages.some((p) => currentPage.includes(p))) {
            window.location.href = "login.html";
          }
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(
          `Cannot connect to backend server at ${this.baseURL}. Please ensure your Node.js server is running on port 5000.`
        );
      }
      throw error;
    }
  }

  get(endpoint, options) {
    return this.request("GET", endpoint, options);
  }
  post(endpoint, options) {
    return this.request("POST", endpoint, options);
  }
  put(endpoint, options) {
    return this.request("PUT", endpoint, options);
  }
  delete(endpoint, options) {
    return this.request("DELETE", endpoint, options);
  }
}

// ─── Instantiate core client ──────────────────────────────────────────────────
const _client = new ApiClient(API_BASE_URL);

// ─── API Namespaces ───────────────────────────────────────────────────────────
const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    /**
     * Register a new user account
     * @param {{ name, email, password, avatar?, role?, bio? }} data
     */
    async register(data) {
      const res = await _client.post("/api/auth/register", { body: data });
      if (res.token) {
        _client.setToken(res.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      }
      return res;
    },

    /**
     * Login with email and password
     * @param {string} email
     * @param {string} password
     */
    async login(email, password) {
      const res = await _client.post("/api/auth/login", {
        body: { email, password },
      });
      if (res.token) {
        _client.setToken(res.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      }
      return res;
    },

    /** Get current authenticated user profile */
    async me() {
      const res = await _client.get("/api/auth/me", { auth: true });
      if (res.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      }
      return res;
    },

    /**
     * Update the current user's profile
     * @param {{ name?, avatar?, role?, bio? }} data
     */
    async updateProfile(data) {
      const res = await _client.put("/api/auth/me", { body: data, auth: true });
      if (res.token) {
        _client.setToken(res.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      }
      return res;
    },

    /** Logout — clears token and cached user */
    logout() {
      _client.clearToken();
    },

    /** Get cached user from localStorage (synchronous, no API call) */
    getCurrentUser() {
      try {
        const u = localStorage.getItem(USER_KEY);
        return u ? JSON.parse(u) : null;
      } catch {
        return null;
      }
    },

    /** Check if user is logged in (has a token) */
    isAuthenticated() {
      return !!_client.getToken();
    },
  },

  // ── Posts ─────────────────────────────────────────────────────────────────
  posts: {
    /**
     * Get all posts
     * @param {{ category?, search?, sort?, page?, limit?, author?, status? }} params
     */
    async getAll(params = {}) {
      return _client.get("/api/posts", { params });
    },

    /**
     * Get a single post by MongoDB ID
     * @param {string} id
     */
    async getById(id) {
      return _client.get(`/api/posts/${id}`);
    },

    /**
     * Create a new post (requires auth)
     * @param {{ title, excerpt, content, category, tags?, coverImage?, status? }} data
     */
    async create(data) {
      return _client.post("/api/posts", { body: data, auth: true });
    },

    /**
     * Update an existing post (requires auth, author only)
     * @param {string} id
     * @param {object} data
     */
    async update(id, data) {
      return _client.put(`/api/posts/${id}`, { body: data, auth: true });
    },

    /**
     * Delete a post (requires auth, author only)
     * @param {string} id
     */
    async delete(id) {
      return _client.delete(`/api/posts/${id}`, { auth: true });
    },

    /**
     * Toggle like on a post (requires auth)
     * @param {string} id
     */
    async toggleLike(id) {
      return _client.post(`/api/posts/${id}/like`, { auth: true });
    },

    /**
     * Toggle bookmark on a post (requires auth)
     * @param {string} id
     */
    async toggleBookmark(id) {
      return _client.post(`/api/posts/${id}/bookmark`, { auth: true });
    },

    /**
     * Add a comment to a post (requires auth)
     * @param {string} id
     * @param {string} text
     */
    async addComment(id, text) {
      return _client.post(`/api/posts/${id}/comments`, {
        body: { text },
        auth: true,
      });
    },
  },
};

// ─── Expose globally ───────────────────────────────────────────────────────────
window.api = api;
window.API_BASE_URL = API_BASE_URL;
