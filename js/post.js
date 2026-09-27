/**
 * ==========================================================================
 * BLOGVERSE - ARTICLE READER & ENGAGEMENT CONTROLLER
 * Full article viewer, markdown parsing, comments, likes, bookmarks, share.
 * Updated to use async API calls.
 * ==========================================================================
 */

let currentPost = null;

document.addEventListener("DOMContentLoaded", () => {
  loadArticle();
  initReadingProgressBar();
});

function initReadingProgressBar() {
  const progressBar = document.getElementById("reading-progress");
  if (!progressBar) return;

  window.addEventListener("scroll", () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight > 0) {
      const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
      progressBar.style.width = `${progress}%`;
    }
  }, { passive: true });
}

async function loadArticle() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");

  if (!postId) {
    window.location.href = "index.html";
    return;
  }

  try {
    const res = await api.posts.getById(postId);
    currentPost = res.post;

    if (!currentPost) {
      showNotFound();
      return;
    }

    // Set document title
    document.title = `${currentPost.title} - Blogverse`;

    // Render Header
    const titleEl = document.getElementById("article-title");
    const categoryBadge = document.getElementById("article-category-badge");
    const authorAvatar = document.getElementById("article-author-avatar");
    const authorName = document.getElementById("article-author-name");
    const authorRole = document.getElementById("article-author-role");
    const metaDate = document.getElementById("article-date");
    const metaRead = document.getElementById("article-read-time");
    const coverImg = document.getElementById("article-cover");
    const bodyEl = document.getElementById("article-body");

    if (titleEl) titleEl.textContent = currentPost.title;
    if (categoryBadge) categoryBadge.textContent = currentPost.category;

    const author = currentPost.author || {
      name: "Blogverse Author",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80",
      role: "Writer & Contributor",
    };

    if (authorAvatar) authorAvatar.src = author.avatar;
    if (authorName) authorName.textContent = author.name;
    if (authorRole) authorRole.textContent = author.role || "Writer";
    if (metaDate) metaDate.textContent = currentPost.publishedDate;
    if (metaRead) metaRead.textContent = currentPost.readTime || "4 min read";

    if (coverImg) {
      coverImg.src = currentPost.coverImage;
      coverImg.alt = currentPost.title;
    }

    if (bodyEl) {
      bodyEl.innerHTML = simpleMarkdownToHtml(currentPost.content);
    }

    // Author Bio Card
    const bioAvatar = document.getElementById("bio-author-avatar");
    const bioName = document.getElementById("bio-author-name");
    const bioRole = document.getElementById("bio-author-role");
    const bioDesc = document.getElementById("bio-author-desc");

    if (bioAvatar) bioAvatar.src = author.avatar;
    if (bioName) bioName.textContent = author.name;
    if (bioRole) bioRole.textContent = author.role || "Writer";
    if (bioDesc) bioDesc.textContent = author.bio || "Writing about technology, design, and continuous learning.";

    // Initialize engagement controls
    initLikeButton();
    initBookmarkButton();
    initShareButton();
    initCommentForm();
    updateLikeDisplay();
    updateBookmarkDisplay();
    renderComments();
    renderRelatedPosts();

  } catch (error) {
    console.error("Load article error:", error);
    showNotFound();
  }
}

function showNotFound() {
  const wrapper = document.getElementById("article-main-wrapper");
  if (wrapper) {
    wrapper.innerHTML = `
      <div class="empty-state" style="padding: 6rem 1rem;">
        <div class="empty-icon">📖</div>
        <h2>Article Not Found</h2>
        <p>The story you are looking for may have been removed or does not exist.</p>
        <a href="index.html" class="btn btn-primary" style="margin-top: 1.5rem;">Return to Homepage</a>
      </div>
    `;
  }
}

function updateLikeDisplay() {
  if (!currentPost) return;
  const userId = api.auth.getCurrentUser()?.id;
  const isLiked = userId && currentPost.likes && currentPost.likes.includes(userId);
  const likeBtn = document.getElementById("post-like-btn");
  const countEl = document.getElementById("post-like-count");

  if (countEl) countEl.textContent = (currentPost.likes || []).length;
  if (likeBtn) {
    if (isLiked) {
      likeBtn.classList.add("liked");
      likeBtn.querySelector("i").className = "fa-solid fa-heart";
    } else {
      likeBtn.classList.remove("liked");
      likeBtn.querySelector("i").className = "fa-regular fa-heart";
    }
  }
}

function initLikeButton() {
  const likeBtn = document.getElementById("post-like-btn");
  if (!likeBtn) return;

  likeBtn.addEventListener("click", async () => {
    if (!api.auth.isAuthenticated()) {
      showToast("Please sign in to like articles.", "info");
      return;
    }

    likeBtn.disabled = true;
    try {
      const res = await storage.toggleLike(currentPost._id);
      // Update local post state
      const userId = api.auth.getCurrentUser()?.id;
      if (res.liked) {
        if (!currentPost.likes.includes(userId)) currentPost.likes.push(userId);
      } else {
        currentPost.likes = currentPost.likes.filter(id => id !== userId);
      }
      updateLikeDisplay();
      showToast(res.liked ? "Liked article!" : "Removed like", "info");
    } catch (error) {
      showToast(error.message || "Failed to update like.", "error");
    } finally {
      likeBtn.disabled = false;
    }
  });
}

function updateBookmarkDisplay() {
  if (!currentPost) return;
  const user = api.auth.getCurrentUser();
  const bookmarks = user?.bookmarks || [];
  const isBookmarked = bookmarks.some(b =>
    (typeof b === "string" ? b : b._id || b) === currentPost._id
  );
  const bkmBtn = document.getElementById("post-bookmark-btn");

  if (bkmBtn) {
    if (isBookmarked) {
      bkmBtn.classList.add("bookmarked");
      bkmBtn.querySelector("i").className = "fa-solid fa-bookmark";
    } else {
      bkmBtn.classList.remove("bookmarked");
      bkmBtn.querySelector("i").className = "fa-regular fa-bookmark";
    }
  }
}

function initBookmarkButton() {
  const bkmBtn = document.getElementById("post-bookmark-btn");
  if (!bkmBtn) return;

  bkmBtn.addEventListener("click", async () => {
    if (!api.auth.isAuthenticated()) {
      showToast("Please sign in to bookmark articles.", "info");
      return;
    }

    bkmBtn.disabled = true;
    try {
      const res = await storage.toggleBookmark(currentPost._id);
      // Refresh user profile to get updated bookmarks
      await api.auth.me();
      updateBookmarkDisplay();
      showToast(res.bookmarked ? "Article bookmarked!" : "Bookmark removed", "info");
    } catch (error) {
      showToast(error.message || "Failed to update bookmark.", "error");
    } finally {
      bkmBtn.disabled = false;
    }
  });
}

function initShareButton() {
  const shareBtn = document.getElementById("post-share-btn");
  if (!shareBtn) return;

  shareBtn.addEventListener("click", () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard!", "success");
    } else {
      showToast("Sharing URL: " + window.location.href, "info");
    }
  });
}

function renderComments() {
  const listEl = document.getElementById("comments-list");
  const countBadge = document.getElementById("comments-count-badge");
  const comments = currentPost?.comments || [];

  if (countBadge) countBadge.textContent = comments.length;
  if (!listEl) return;

  if (comments.length === 0) {
    listEl.innerHTML = `
      <p style="color: var(--text-dim); text-align: center; padding: 1.5rem;">
        No thoughts shared yet. Be the first to start the conversation!
      </p>
    `;
    return;
  }

  listEl.innerHTML = comments.map(c => `
    <div class="comment-card animate-fade-in">
      <div class="comment-user-row">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <img src="${c.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}" alt="${c.userName}" class="comment-avatar">
          <div>
            <div class="comment-name">${c.userName}</div>
            <div class="comment-date">${c.date}</div>
          </div>
        </div>
      </div>
      <p style="color: var(--text-main); font-size: 0.95rem; line-height: 1.6;">${c.text}</p>
    </div>
  `).join("");
}

function initCommentForm() {
  const form = document.getElementById("comment-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const textarea = document.getElementById("comment-text-input");
    const submitBtn = form.querySelector("[type=submit]");
    const text = textarea.value.trim();

    if (!text) {
      showToast("Please write a comment before submitting.", "error");
      return;
    }

    if (!api.auth.isAuthenticated()) {
      showToast("Please sign in to post comments.", "info");
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Posting...';

    try {
      const res = await storage.addComment(currentPost._id, { text });
      if (res) {
        if (!currentPost.comments) currentPost.comments = [];
        currentPost.comments.push(res);
        renderComments();
        textarea.value = "";
        showToast("Comment added!", "success");
      }
    } catch (error) {
      showToast(error.message || "Failed to post comment.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

async function renderRelatedPosts() {
  const container = document.getElementById("related-posts-grid");
  if (!container) return;

  try {
    const allPosts = await storage.getAllPosts({ limit: 4 });
    const related = allPosts.filter(p => p._id !== currentPost._id).slice(0, 3);

    container.innerHTML = related.map(p => `
      <article class="blog-card" style="box-shadow: var(--shadow-sm);">
        <div class="card-img-wrap" style="height: 160px;">
          <img src="${p.coverImage}" alt="${p.title}" class="card-img">
          <span class="badge card-category-floating">${p.category}</span>
        </div>
        <div class="card-body" style="padding: 1.25rem;">
          <h4 class="card-title" style="font-size: 1.05rem;">
            <a href="post.html?id=${p._id}">${p.title}</a>
          </h4>
          <div class="card-footer" style="padding-top: 0.75rem; margin-top: auto;">
            <span style="font-size: 0.8rem; color: var(--text-dim);">${p.readTime || "4 min read"}</span>
            <a href="post.html?id=${p._id}" style="font-size: 0.82rem; font-weight: 600;">Read &rarr;</a>
          </div>
        </div>
      </article>
    `).join("");
  } catch (e) {
    console.warn("Could not load related posts:", e.message);
  }
}

// ─── Markdown Parser (unchanged, shared with editor.js) ────────────────────
function simpleMarkdownToHtml(markdown) {
  if (!markdown) return "";
  let html = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  html = html.replace(/^&gt; (.*$)/gim, "<blockquote>$1</blockquote>");
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  html = html.replace(/^\- (.*$)/gim, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>");

  html = html.split(/\n{2,}/).map(para => {
    if (para.startsWith("<h") || para.startsWith("<blockquote") || para.startsWith("<pre") || para.startsWith("<ul")) {
      return para;
    }
    return `<p>${para.replace(/\n/g, "<br>")}</p>`;
  }).join("\n");

  return html;
}
