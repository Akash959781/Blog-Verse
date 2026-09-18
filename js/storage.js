/**
 * ==========================================================================
 * BLOGVERSE - LOCAL STORAGE DATA MANAGER
 * Synchronous client-side persistence for blogs, comments, likes & bookmarks
 * ==========================================================================
 */

const STORAGE_KEYS = {
  POSTS: "blogverse_posts",
  BOOKMARKS: "blogverse_bookmarks",
  LIKES: "blogverse_likes",
  THEME: "blogverse_theme"
};

class StorageManager {
  constructor() {
    this.initStorage();
  }

  initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(SEED_POSTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BOOKMARKS)) {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LIKES)) {
      localStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify([]));
    }
  }

  // Get all posts
  getAllPosts() {
    try {
      const posts = localStorage.getItem(STORAGE_KEYS.POSTS);
      return posts ? JSON.parse(posts) : [];
    } catch (e) {
      console.error("Error reading posts from storage:", e);
      return [];
    }
  }

  // Get a single post by id
  getPostById(id) {
    const posts = this.getAllPosts();
    return posts.find(p => p.id === id) || null;
  }

  // Save new post
  createPost(newPost) {
    const posts = this.getAllPosts();
    const postWithDefaults = {
      id: "post-" + Date.now(),
      views: 1,
      likes: 0,
      comments: [],
      publishedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: newPost.status || "published",
      isFeatured: false,
      ...newPost
    };
    posts.unshift(postWithDefaults);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    return postWithDefaults;
  }

  // Update existing post
  updatePost(id, updatedFields) {
    const posts = this.getAllPosts();
    const index = posts.findIndex(p => p.id === id);
    if (index === -1) return null;

    posts[index] = { ...posts[index], ...updatedFields };
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    return posts[index];
  }

  // Delete post
  deletePost(id) {
    let posts = this.getAllPosts();
    posts = posts.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    return true;
  }

  // Increment view count
  incrementView(id) {
    const posts = this.getAllPosts();
    const post = posts.find(p => p.id === id);
    if (post) {
      post.views = (post.views || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    }
  }

  // Toggle Like
  toggleLike(postId, userId = "guest") {
    const posts = this.getAllPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return { liked: false, count: 0 };

    let userLikes = JSON.parse(localStorage.getItem(STORAGE_KEYS.LIKES) || "[]");
    const likeKey = `${userId}_${postId}`;
    const alreadyLiked = userLikes.includes(likeKey);

    if (alreadyLiked) {
      userLikes = userLikes.filter(k => k !== likeKey);
      post.likes = Math.max(0, (post.likes || 1) - 1);
    } else {
      userLikes.push(likeKey);
      post.likes = (post.likes || 0) + 1;
    }

    localStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify(userLikes));
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));

    return { liked: !alreadyLiked, count: post.likes };
  }

  isPostLiked(postId, userId = "guest") {
    const userLikes = JSON.parse(localStorage.getItem(STORAGE_KEYS.LIKES) || "[]");
    return userLikes.includes(`${userId}_${postId}`);
  }

  // Add Comment
  addComment(postId, commentData) {
    const posts = this.getAllPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return null;

    const comment = {
      id: "c-" + Date.now(),
      userName: commentData.userName || "Anonymous Reader",
      userAvatar: commentData.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      text: commentData.text
    };

    if (!post.comments) post.comments = [];
    post.comments.push(comment);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    return comment;
  }

  // Toggle Bookmark
  toggleBookmark(postId, userId = "guest") {
    let bookmarks = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARKS) || "[]");
    const itemKey = `${userId}_${postId}`;
    const isBookmarked = bookmarks.includes(itemKey);

    if (isBookmarked) {
      bookmarks = bookmarks.filter(k => k !== itemKey);
    } else {
      bookmarks.push(itemKey);
    }

    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    return !isBookmarked;
  }

  isPostBookmarked(postId, userId = "guest") {
    const bookmarks = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARKS) || "[]");
    return bookmarks.includes(`${userId}_${postId}`);
  }

  // Get posts authored by a user
  getPostsByAuthor(authorId) {
    const posts = this.getAllPosts();
    return posts.filter(p => p.author && p.author.id === authorId);
  }
}

// Global instance
const storage = new StorageManager();
