/**
 * ==========================================================================
 * BLOGVERSE - SMART HYBRID STORAGE MANAGER
 * Primary: Real REST API via api.js
 * Fallback: LocalStorage & SEED_POSTS if backend server is unreachable
 * This ensures the user NEVER encounters a blocking network error screen!
 * ==========================================================================
 */

const STORAGE_KEYS = {
  POSTS: "blogverse_posts",
  THEME: "blogverse_theme",
  BOOKMARKS: "blogverse_bookmarks",
  LIKES: "blogverse_likes",
};

const storage = {
  _isOnline: null,

  /** Check if the backend API is alive */
  async checkConnection() {
    try {
      const res = await fetch(`${window.API_BASE_URL || "http://localhost:5000"}/api/health`, {
        signal: AbortSignal.timeout(2000),
      });
      this._isOnline = res.ok;
      return res.ok;
    } catch {
      this._isOnline = false;
      return false;
    }
  },

  // ── Local Fallback Helpers ────────────────────────────────────────────────
  _getSeedPosts() {
    return typeof window.SEED_POSTS !== "undefined" ? [...window.SEED_POSTS] : [];
  },

  getLocalPosts(params = {}) {
    let posts = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.POSTS);
      posts = stored ? JSON.parse(stored) : this._getSeedPosts();
    } catch {
      posts = this._getSeedPosts();
    }

    // Apply filtering
    if (params.category && params.category !== "All") {
      posts = posts.filter((p) => p.category === params.category);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      posts = posts.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
          (p.content && p.content.toLowerCase().includes(q))
      );
    }
    if (params.author) {
      posts = posts.filter((p) => {
        const aId = p.author?.id || p.author?._id || p.author;
        return aId === params.author;
      });
    }

    // Apply sorting
    if (params.sort === "mostViewed" || params.sort === "views") {
      posts.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (params.sort === "mostLiked" || params.sort === "likes") {
      posts.sort((a, b) => ((b.likes || []).length || 0) - ((a.likes || []).length || 0));
    }

    return posts;
  },

  saveLocalPosts(posts) {
    try {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    } catch (e) {
      console.warn("localStorage quota exceeded or unavailable", e);
    }
  },

  getLocalPostById(id) {
    const posts = this.getLocalPosts();
    return posts.find((p) => (p._id || p.id) === id) || null;
  },

  createLocalPost(postData) {
    const posts = this.getLocalPosts();
    const currentUser = api.auth.getCurrentUser() || {
      id: "demo-user",
      name: "Demo Creator",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
      role: "Writer",
    };

    const newPost = {
      ...postData,
      _id: "local-" + Date.now(),
      id: "local-" + Date.now(),
      author: currentUser,
      publishedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      views: 1,
      likes: [],
      comments: [],
    };

    posts.unshift(newPost);
    this.saveLocalPosts(posts);
    return newPost;
  },

  // ── Public Unified API ────────────────────────────────────────────────────
  /** Get all published posts */
  async getAllPosts(params = {}) {
    try {
      const res = await api.posts.getAll(params);
      if (res && res.posts) {
        // Cache posts locally for fast offline access
        this.saveLocalPosts(res.posts);
        return res.posts;
      }
    } catch (error) {
      console.warn("Backend API unavailable. Falling back to local offline storage:", error.message);
    }
    return this.getLocalPosts(params);
  },

  /** Get a single post by ID */
  async getPostById(id) {
    try {
      const res = await api.posts.getById(id);
      if (res && res.post) return res.post;
    } catch (error) {
      console.warn("Backend API unavailable for post lookup. Falling back to local store:", error.message);
    }
    return this.getLocalPostById(id);
  },

  /** Create a new post */
  async createPost(postData) {
    try {
      const res = await api.posts.create(postData);
      if (res && res.post) return res.post;
    } catch (error) {
      console.warn("Backend API unavailable for creating post. Saving locally:", error.message);
    }
    return this.createLocalPost(postData);
  },

  /** Update an existing post */
  async updatePost(id, postData) {
    try {
      const res = await api.posts.update(id, postData);
      if (res && res.post) return res.post;
    } catch (error) {
      console.warn("Backend API unavailable for update. Updating locally:", error.message);
    }
    const posts = this.getLocalPosts();
    const idx = posts.findIndex((p) => (p._id || p.id) === id);
    if (idx !== -1) {
      posts[idx] = { ...posts[idx], ...postData };
      this.saveLocalPosts(posts);
      return posts[idx];
    }
    return null;
  },

  /** Delete a post */
  async deletePost(id) {
    try {
      await api.posts.delete(id);
    } catch (error) {
      console.warn("Backend API unavailable for delete. Deleting locally:", error.message);
    }
    const posts = this.getLocalPosts().filter((p) => (p._id || p.id) !== id);
    this.saveLocalPosts(posts);
    return true;
  },

  /** Toggle like — returns { liked, likesCount } */
  async toggleLike(postId) {
    try {
      return await api.posts.toggleLike(postId);
    } catch (error) {
      console.warn("Backend API unavailable for like. Toggling locally:", error.message);
      const post = this.getLocalPostById(postId);
      if (!post) return { liked: false, likesCount: 0 };
      post.likes = post.likes || [];
      const liked = post.likes.length === 0;
      if (liked) post.likes.push("local-user");
      else post.likes.pop();
      this.updatePost(postId, post);
      return { liked, likesCount: post.likes.length };
    }
  },

  /** Toggle bookmark — returns { bookmarked, bookmarksCount } */
  async toggleBookmark(postId) {
    try {
      return await api.posts.toggleBookmark(postId);
    } catch (error) {
      console.warn("Backend API unavailable for bookmark. Toggling locally:", error.message);
      let bookmarks = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARKS) || "[]");
      const idx = bookmarks.indexOf(postId);
      let bookmarked = false;
      if (idx === -1) {
        bookmarks.push(postId);
        bookmarked = true;
      } else {
        bookmarks.splice(idx, 1);
      }
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
      return { bookmarked, bookmarksCount: bookmarks.length };
    }
  },

  /** Add a comment to a post */
  async addComment(postId, commentData) {
    try {
      const res = await api.posts.addComment(postId, commentData.text);
      if (res && res.comment) return res.comment;
    } catch (error) {
      console.warn("Backend API unavailable for comment. Adding locally:", error.message);
    }
    const currentUser = api.auth.getCurrentUser() || { name: "Reader", avatar: "" };
    const comment = {
      _id: "comment-" + Date.now(),
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text: commentData.text,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    const post = this.getLocalPostById(postId);
    if (post) {
      post.comments = post.comments || [];
      post.comments.push(comment);
      this.updatePost(postId, post);
    }
    return comment;
  },

  /** Get posts by author ID */
  async getPostsByAuthor(authorId) {
    try {
      const res = await api.posts.getAll({ author: authorId });
      if (res && res.posts) return res.posts;
    } catch {
      // Fallback
    }
    return this.getLocalPosts({ author: authorId });
  },
};

// Expose globally
window.storage = storage;
window.STORAGE_KEYS = STORAGE_KEYS;
