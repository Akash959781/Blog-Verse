/**
 * ==========================================================================
 * BLOGVERSE - CREATOR DASHBOARD CONTROLLER
 * Analytics metrics, post management table, drafts, delete confirmation
 * ==========================================================================
 */

let activePostToDelete = null;
let currentTab = "all";

document.addEventListener("DOMContentLoaded", () => {
  ensureAuthenticated();
  renderDashboardProfile();
  renderMetrics();
  renderPostsTable();
  initDeleteModal();
  initFilterTabs();
});

function ensureAuthenticated() {
  const user = auth.getCurrentUser();
  if (!user) {
    // If user accesses dashboard directly without logging in, auto-log in as demo user for great UX
    auth.loginAsDemo();
    showToast("Logged in as Alex Rivera (Demo Account)", "info");
  }
}

function renderDashboardProfile() {
  const user = auth.getCurrentUser();
  if (!user) return;

  const avatarEl = document.getElementById("dash-avatar");
  const nameEl = document.getElementById("dash-name");
  const roleEl = document.getElementById("dash-role");
  const dateEl = document.getElementById("dash-joined");

  if (avatarEl) avatarEl.src = user.avatar;
  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = user.role || "Creator";
  if (dateEl) dateEl.textContent = `Member since ${user.joinedDate || "2025"}`;
}

function renderMetrics() {
  const user = auth.getCurrentUser();
  const allPosts = storage.getAllPosts();
  
  // Posts by this user
  const userPosts = allPosts.filter(p => p.author && p.author.id === user.id);
  
  const totalViews = userPosts.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalLikes = userPosts.reduce((acc, p) => acc + (p.likes || 0), 0);
  
  // Bookmarks
  const bookmarks = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARKS) || "[]");
  const userBookmarks = bookmarks.filter(b => b.startsWith(`${user.id}_`));

  document.getElementById("metric-posts").textContent = userPosts.length;
  document.getElementById("metric-views").textContent = totalViews.toLocaleString();
  document.getElementById("metric-likes").textContent = totalLikes.toLocaleString();
  document.getElementById("metric-bookmarks").textContent = userBookmarks.length;
}

function initFilterTabs() {
  const tabs = document.querySelectorAll(".dash-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentTab = tab.dataset.tab;
      renderPostsTable();
    });
  });
}

function renderPostsTable() {
  const user = auth.getCurrentUser();
  const allPosts = storage.getAllPosts();
  let userPosts = allPosts.filter(p => p.author && p.author.id === user.id);

  if (currentTab === "published") {
    userPosts = userPosts.filter(p => p.status !== "draft");
  } else if (currentTab === "draft") {
    userPosts = userPosts.filter(p => p.status === "draft");
  }

  const tableBody = document.getElementById("posts-table-body");
  const emptyState = document.getElementById("dash-empty-state");

  if (!tableBody) return;

  if (userPosts.length === 0) {
    tableBody.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  tableBody.innerHTML = userPosts.map(post => {
    const isDraft = post.status === "draft";
    return `
      <tr>
        <td>
          <div class="table-post-title">
            <img src="${post.coverImage || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=120&q=80'}" alt="" class="table-thumb">
            <div>
              <a href="post.html?id=${post.id}" style="color: var(--text-main); font-weight: 600;">
                ${post.title}
              </a>
              <div style="font-size: 0.78rem; color: var(--text-dim); margin-top: 0.2rem;">
                ${post.readTime || "4 min read"}
              </div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge">${post.category}</span>
        </td>
        <td>
          <span class="status-pill ${isDraft ? 'status-draft' : 'status-published'}">
            ${isDraft ? 'Draft' : 'Published'}
          </span>
        </td>
        <td>${post.views || 0}</td>
        <td>${post.likes || 0}</td>
        <td>${post.publishedDate}</td>
        <td>
          <div class="table-actions">
            <a href="post.html?id=${post.id}" class="btn btn-secondary btn-sm" title="View Article">
              <i class="fa-regular fa-eye"></i>
            </a>
            <a href="create-blog.html?edit=${post.id}" class="btn btn-secondary btn-sm" title="Edit Article">
              <i class="fa-regular fa-pen-to-square"></i>
            </a>
            <button class="btn btn-danger btn-sm" onclick="confirmDelete('${post.id}')" title="Delete Article">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function initDeleteModal() {
  const cancelBtn = document.getElementById("cancel-delete-btn");
  const confirmBtn = document.getElementById("confirm-delete-btn");

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      closeModal("delete-modal");
      activePostToDelete = null;
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      if (activePostToDelete) {
        storage.deletePost(activePostToDelete);
        showToast("Article deleted successfully", "success");
        closeModal("delete-modal");
        activePostToDelete = null;
        renderMetrics();
        renderPostsTable();
      }
    });
  }
}

// Global hook for table row delete button
window.confirmDelete = function(postId) {
  activePostToDelete = postId;
  openModal("delete-modal");
};
