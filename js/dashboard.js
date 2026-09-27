/**
 * ==========================================================================
 * BLOGVERSE - CREATOR DASHBOARD CONTROLLER
 * Analytics metrics, post management table, drafts, delete confirmation.
 * Updated to use async API calls.
 * ==========================================================================
 */

let activePostToDelete = null;
let currentTab = "all";

document.addEventListener("DOMContentLoaded", async () => {
  ensureAuthenticated();
  renderDashboardProfile();
  await loadDashboardData();
  initDeleteModal();
  initFilterTabs();
});

function ensureAuthenticated() {
  if (!api.auth.isAuthenticated()) {
    showToast("Please sign in to access your dashboard.", "info");
    setTimeout(() => { window.location.href = "login.html"; }, 800);
  }
}

function renderDashboardProfile() {
  const user = api.auth.getCurrentUser();
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

async function loadDashboardData() {
  const user = api.auth.getCurrentUser();
  if (!user) return;

  try {
    // Fetch the user's posts (all statuses)
    const data = await api.posts.getAll({ author: user.id });
    const userPosts = data.posts || [];

    renderMetrics(userPosts, user);
    renderPostsTable(userPosts);
  } catch (error) {
    console.error("Dashboard load error:", error);
    showToast("Failed to load dashboard data.", "error");
  }
}

function renderMetrics(userPosts, user) {
  const totalViews = userPosts.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalLikes = userPosts.reduce((acc, p) => acc + (p.likes?.length || 0), 0);
  const bookmarksCount = user.bookmarks?.length || 0;

  const metricPosts = document.getElementById("metric-posts");
  const metricViews = document.getElementById("metric-views");
  const metricLikes = document.getElementById("metric-likes");
  const metricBookmarks = document.getElementById("metric-bookmarks");

  if (metricPosts) metricPosts.textContent = userPosts.length;
  if (metricViews) metricViews.textContent = totalViews.toLocaleString();
  if (metricLikes) metricLikes.textContent = totalLikes.toLocaleString();
  if (metricBookmarks) metricBookmarks.textContent = bookmarksCount;
}

function initFilterTabs() {
  const tabs = document.querySelectorAll(".dash-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", async () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentTab = tab.dataset.tab;
      await loadDashboardData();
    });
  });
}

function renderPostsTable(allPosts) {
  let userPosts = [...allPosts];

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
              <a href="post.html?id=${post._id}" style="color: var(--text-main); font-weight: 600;">
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
          <span class="status-pill ${isDraft ? "status-draft" : "status-published"}">
            ${isDraft ? "Draft" : "Published"}
          </span>
        </td>
        <td>${post.views || 0}</td>
        <td>${(post.likes || []).length}</td>
        <td>${post.publishedDate}</td>
        <td>
          <div class="table-actions">
            <a href="post.html?id=${post._id}" class="btn btn-secondary btn-sm" title="View Article">
              <i class="fa-regular fa-eye"></i>
            </a>
            <a href="create-blog.html?edit=${post._id}" class="btn btn-secondary btn-sm" title="Edit Article">
              <i class="fa-regular fa-pen-to-square"></i>
            </a>
            <button class="btn btn-danger btn-sm" onclick="confirmDelete('${post._id}')" title="Delete Article">
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
    confirmBtn.addEventListener("click", async () => {
      if (!activePostToDelete) return;

      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Deleting...';

      try {
        await storage.deletePost(activePostToDelete);
        showToast("Article deleted successfully", "success");
        closeModal("delete-modal");
        activePostToDelete = null;
        await loadDashboardData();
      } catch (error) {
        showToast(error.message || "Failed to delete article.", "error");
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fa-regular fa-trash-can"></i> Delete';
      }
    });
  }
}

// Global hook for table row delete button
window.confirmDelete = function(postId) {
  activePostToDelete = postId;
  openModal("delete-modal");
};
