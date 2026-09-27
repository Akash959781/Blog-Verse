/**
 * ==========================================================================
 * BLOGVERSE - IN-MEMORY DATA STORE & MONGOOSE-COMPATIBLE ADAPTER
 * Provides zero-configuration, instant execution when MongoDB is not connected.
 * Fully supports User Registration, Login, JWT tokens, and Blog Posts CRUD.
 * ==========================================================================
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { DEMO_USERS, getSeedPosts } = require("./seedData");

// Generate 24-hex-char MongoDB ObjectId-like string
function generateId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const random = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
  return timestamp + random;
}

class InMemoryStore {
  constructor() {
    this.users = [];
    this.posts = [];
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    // Seed users with pre-hashed passwords
    for (const u of DEMO_USERS) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(u.password, salt);
      this.users.push({
        ...u,
        _id: u._id,
        password: hashedPassword,
        bookmarks: [...u.bookmarks],
      });
    }

    const userIds = this.users.map((u) => u._id);
    const seedPosts = getSeedPosts(userIds);
    for (const p of seedPosts) {
      this.posts.push({
        ...p,
        _id: p._id,
        likes: [...p.likes],
        comments: p.comments.map((c) => ({ ...c })),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    this.initialized = true;
    console.log(`📦 In-Memory Store initialized with ${this.users.length} users and ${this.posts.length} blog posts.`);
  }

  _wrapUser(user) {
    if (!user) return null;
    const store = this;
    const userDoc = {
      ...user,
      id: user._id,
      comparePassword: async function (enteredPassword) {
        return bcrypt.compare(enteredPassword, user.password);
      },
      generateJWT: function () {
        return jwt.sign(
          {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
          },
          process.env.JWT_SECRET || "blogverse_super_secret_jwt_key_development_2026",
          { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );
      },
      toSafeObject: function () {
        const copy = { ...user, id: user._id };
        delete copy.password;
        return copy;
      },
      save: async function () {
        const idx = store.users.findIndex((u) => u._id.toString() === user._id.toString());
        if (idx !== -1) {
          store.users[idx] = { ...store.users[idx], ...user };
        }
        return store._wrapUser(store.users[idx]);
      },
      select: function () {
        return this;
      },
      populate: async function (field) {
        if (field === "bookmarks") {
          this.bookmarks = store.posts
            .filter((p) => (user.bookmarks || []).some((b) => b.toString() === p._id.toString()))
            .map((p) => ({
              id: p._id,
              _id: p._id,
              title: p.title,
              slug: p.slug,
              coverImage: p.coverImage,
              category: p.category,
              publishedDate: p.publishedDate,
            }));
        }
        return this;
      },
    };

    return userDoc;
  }

  _wrapPost(post) {
    if (!post) return null;
    const store = this;
    const postDoc = {
      ...post,
      id: post._id,
      get likesCount() {
        return (this.likes || []).length;
      },
      save: async function () {
        const idx = store.posts.findIndex((p) => p._id.toString() === post._id.toString());
        if (idx !== -1) {
          post.updatedAt = new Date();
          store.posts[idx] = { ...store.posts[idx], ...post };
          return store._wrapPost(store.posts[idx]);
        }
        return this;
      },
      deleteOne: async function () {
        store.posts = store.posts.filter((p) => p._id.toString() !== post._id.toString());
        return { acknowledged: true, deletedCount: 1 };
      },
      populate: async function (field, select) {
        if (field === "author") {
          const authorUser = store.users.find(
            (u) => u._id.toString() === (post.author?._id || post.author || "").toString()
          );
          if (authorUser) {
            this.author = {
              _id: authorUser._id,
              id: authorUser._id,
              name: authorUser.name,
              email: authorUser.email,
              avatar: authorUser.avatar,
              role: authorUser.role,
              bio: authorUser.bio,
              joinedDate: authorUser.joinedDate,
            };
          }
        }
        return this;
      },
    };

    return postDoc;
  }

  // ── User Operations ───────────────────────────────────────────────────────
  findUserOne(criteria) {
    const store = this;
    const promise = (async () => {
      await store.init();
      let found = null;
      if (criteria.email) {
        const email = criteria.email.toLowerCase().trim();
        found = store.users.find((u) => u.email.toLowerCase() === email);
      } else if (criteria._id) {
        found = store.users.find((u) => u._id.toString() === criteria._id.toString());
      }
      return store._wrapUser(found);
    })();

    promise.select = function () {
      return promise;
    };
    promise.populate = function (field, select) {
      const p = promise.then(async (u) => {
        if (!u) return null;
        return u.populate(field, select);
      });
      p.select = function () {
        return p;
      };
      p.populate = promise.populate;
      return p;
    };
    return promise;
  }

  findUserById(id) {
    const store = this;
    const promise = (async () => {
      await store.init();
      const user = store.users.find((u) => u._id.toString() === id.toString());
      return store._wrapUser(user);
    })();

    promise.select = function () {
      return promise;
    };
    promise.populate = function (field, select) {
      const p = promise.then(async (u) => {
        if (!u) return null;
        return u.populate(field, select);
      });
      p.select = function () {
        return p;
      };
      p.populate = promise.populate;
      return p;
    };
    return promise;
  }

  async createUser(data) {
    await this.init();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const newUser = {
      _id: generateId(),
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      avatar:
        data.avatar ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80",
      role: data.role || "Creator & Tech Enthusiast",
      bio: data.bio || "Writer and reader on Blogverse.",
      joinedDate: new Date().toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      bookmarks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.push(newUser);
    return this._wrapUser(newUser);
  }

  async findUserByIdAndUpdate(id, updates, options = {}) {
    await this.init();
    const idx = this.users.findIndex((u) => u._id.toString() === id.toString());
    if (idx === -1) return null;

    this.users[idx] = {
      ...this.users[idx],
      ...updates,
      updatedAt: new Date(),
    };

    return this._wrapUser(this.users[idx]);
  }

  // ── Post Operations ───────────────────────────────────────────────────────
  _filterPosts(filter = {}) {
    return this.posts.filter((p) => {
      if (filter.status && p.status !== filter.status) return false;
      if (filter.category && filter.category !== "All" && p.category !== filter.category)
        return false;
      if (filter.author && p.author.toString() !== filter.author.toString()) return false;
      if (filter.$text && filter.$text.$search) {
        const query = filter.$text.$search.toLowerCase();
        const inTitle = p.title.toLowerCase().includes(query);
        const inExcerpt = (p.excerpt || "").toLowerCase().includes(query);
        const inContent = (p.content || "").toLowerCase().includes(query);
        if (!inTitle && !inExcerpt && !inContent) return false;
      }
      return true;
    });
  }

  async countPostDocuments(filter) {
    await this.init();
    return this._filterPosts(filter).length;
  }

  findPosts(filter) {
    const store = this;
    let sortObj = { createdAt: -1 };
    let skipCount = 0;
    let limitCount = 50;
    let populateFields = [];

    const queryPromise = async () => {
      await store.init();
      let matches = store._filterPosts(filter);

      // Sorting
      if (sortObj.createdAt === 1) {
        matches.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else if (sortObj.createdAt === -1) {
        matches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortObj.views === -1) {
        matches.sort((a, b) => (b.views || 0) - (a.views || 0));
      }

      // Pagination
      matches = matches.slice(skipCount, skipCount + limitCount);

      // Wrap documents and populate
      const results = [];
      for (const p of matches) {
        const wrapped = store._wrapPost(p);
        if (populateFields.includes("author")) {
          await wrapped.populate("author");
        }
        results.push(wrapped);
      }
      return results;
    };

    const chainable = {
      populate(field) {
        populateFields.push(field);
        return chainable;
      },
      sort(obj) {
        sortObj = obj || sortObj;
        return chainable;
      },
      skip(n) {
        skipCount = Number(n) || 0;
        return chainable;
      },
      limit(n) {
        limitCount = Number(n) || 50;
        return chainable;
      },
      select() {
        return chainable;
      },
      then(onResolve, onReject) {
        return queryPromise().then(onResolve, onReject);
      },
    };

    return chainable;
  }

  findPostById(id) {
    const store = this;
    const promise = (async () => {
      await store.init();
      const post = store.posts.find((p) => p._id.toString() === id.toString());
      return store._wrapPost(post);
    })();

    promise.populate = function (field, select) {
      const p = promise.then(async (post) => {
        if (!post) return null;
        return post.populate(field, select);
      });
      p.populate = promise.populate;
      return p;
    };
    return promise;
  }

  async createPost(data) {
    await this.init();
    const slug =
      data.slug ||
      data.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();

    const wordCount = (data.content || "").split(/\s+/).length;
    const minutes = Math.ceil(wordCount / 200);

    const newPost = {
      _id: generateId(),
      title: data.title,
      slug,
      category: data.category,
      tags: data.tags || [],
      coverImage:
        data.coverImage ||
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
      excerpt: data.excerpt,
      content: data.content,
      author: data.author,
      publishedDate: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: data.status || "published",
      readTime: `${minutes} min read`,
      views: 0,
      likes: [],
      isFeatured: data.isFeatured || false,
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.posts.unshift(newPost);
    return this._wrapPost(newPost);
  }
}

const memoryStore = new InMemoryStore();

module.exports = {
  memoryStore,
  User: {
    findOne: (crit) => memoryStore.findUserOne(crit),
    findById: (id) => memoryStore.findUserById(id),
    create: (data) => memoryStore.createUser(data),
    findByIdAndUpdate: (id, up, opt) => memoryStore.findUserByIdAndUpdate(id, up, opt),
  },
  Post: {
    find: (filter) => memoryStore.findPosts(filter),
    findById: (id) => memoryStore.findPostById(id),
    countDocuments: (filter) => memoryStore.countPostDocuments(filter),
    create: (data) => memoryStore.createPost(data),
  },
};
