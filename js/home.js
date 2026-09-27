/**
 * ==========================================================================
 * BLOGVERSE - HOME PAGE LOGIC
 * Dynamic feed rendering, category filters, instant search, and sorting.
 * Updated to use async API calls.
 * ==========================================================================
 */

const CATEGORIES = ["All", "Tech & AI", "Web Dev", "Design Systems", "Productivity", "Career"];

let currentCategory = "All";
let searchQuery = "";
let currentSort = "latest";
let searchDebounceTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  initCategoryTabs();
  initSearchAndSort();
  renderFeed();
});

function initCategoryTabs() {
  const container = document.getElementById("category-tabs-container");
  if (!container) return;

  container.innerHTML = CATEGORIES.map(cat => `
    <button class="category-tab ${cat === currentCategory ? "active" : ""}" data-category="${cat}">
      ${cat}
    </button>
  `).join("");

  container.addEventListener("click", (e) => {
    const tab = e.target.closest(".category-tab");
    if (!tab) return;

    document.querySelectorAll(".category-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentCategory = tab.dataset.category;
    renderFeed();
  });
}

function initSearchAndSort() {
  const searchInput = document.getElementById("search-input");
  const sortSelect = document.getElementById("sort-select");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      // Debounce search to avoid API calls on every keystroke
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => renderFeed(), 400);
    });

    window.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderFeed();
    });
  }
}

async function renderFeed() {
  const gridContainer = document.getElementById("blog-grid");
  const resultCount = document.getElementById("result-count");

  // Show loading skeleton
  if (gridContainer) {
    gridContainer.innerHTML = `
      <div class="loading-skeleton" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-dim);">
        <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
        Loading articles...
      </div>
    `;
  }

  try {
    // Map UI sort values to API sort params
    const sortMap = { latest: "newest", views: "mostViewed", likes: "mostLiked" };

    const params = {
      sort: sortMap[currentSort] || "newest",
      category: currentCategory !== "All" ? currentCategory : undefined,
      search: searchQuery || undefined,
    };

    const data = await storage.getAllPosts(params);
    const allPosts = data;

    // Render Featured Post (only if not searching)
    renderFeaturedPost(allPosts);

    if (resultCount) {
      resultCount.textContent = `Showing ${allPosts.length} article${allPosts.length === 1 ? "" : "s"}`;
    }

    if (!gridContainer) return;

    if (allPosts.length === 0) {
      gridContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No articles found</h3>
          <p>Try refining your search terms or selecting a different category.</p>
          <button class="btn btn-secondary btn-sm" style="margin-top: 1rem;" onclick="resetFilters()">Reset Filters</button>
        </div>
      `;
      return;
    }

    gridContainer.innerHTML = allPosts.map(post => {
      const authorName = post.author ? post.author.name : "Anonymous";
      const authorAvatar = post.author
        ? post.author.avatar
        : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80";

      return `
        <article class="blog-card animate-fade-in" data-id="${post._id}">
          <div class="card-img-wrap">
            <img src="${post.coverImage}" alt="${post.title}" class="card-img" loading="lazy">
            <span class="badge card-category-floating">${post.category}</span>
          </div>
          <div class="card-body">
            <div class="card-meta-top">
              <span><i class="fa-regular fa-calendar"></i> ${post.publishedDate}</span>
              <span>•</span>
              <span><i class="fa-regular fa-clock"></i> ${post.readTime || "4 min read"}</span>
            </div>
            <h3 class="card-title">
              <a href="post.html?id=${post._id}">${post.title}</a>
            </h3>
            <p class="card-excerpt">${post.excerpt}</p>
            <div class="card-footer">
              <div class="author-meta">
                <img src="${authorAvatar}" alt="${authorName}" class="author-thumb">
                <div>
                  <div class="author-name">${authorName}</div>
                </div>
              </div>
              <div class="card-stats">
                <span class="card-stat-item" title="Views">
                  <i class="fa-regular fa-eye"></i> ${post.views || 0}
                </span>
                <span class="card-stat-item" title="Likes">
                  <i class="fa-regular fa-heart"></i> ${(post.likes || []).length}
                </span>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join("");

  } catch (error) {
    console.error("Feed load error:", error);
    if (gridContainer) {
      gridContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-icon">⚠️</div>
          <h3>Failed to load articles</h3>
          <p>${error.message || "Please check your connection and try again."}</p>
          <button class="btn btn-primary btn-sm" style="margin-top: 1rem;" onclick="renderFeed()">Retry</button>
        </div>
      `;
    }
  }
}

function renderFeaturedPost(allPosts) {
  const container = document.getElementById("featured-post-container");
  if (!container) return;

  if (searchQuery) {
    container.style.display = "none";
    return;
  }
  container.style.display = "block";

  const featured = allPosts.find(p => p.isFeatured) || allPosts[0];
  if (!featured) {
    container.style.display = "none";
    return;
  }

  const authorName = featured.author ? featured.author.name : "Featured Creator";
  const authorAvatar = featured.author
    ? featured.author.avatar
    : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80";

  container.innerHTML = `
    <div class="featured-post-card animate-fade-in">
      <div class="featured-img-wrap">
        <img src="${featured.coverImage}" alt="${featured.title}" class="featured-img">
      </div>
      <div class="featured-content">
        <div class="featured-tag-row">
          <span class="badge badge-cyan"><i class="fa-solid fa-bolt"></i> Featured Story</span>
          <span class="badge">${featured.category}</span>
        </div>
        <h2 class="featured-title">
          <a href="post.html?id=${featured._id}">${featured.title}</a>
        </h2>
        <p class="featured-excerpt">${featured.excerpt}</p>
        <div class="card-footer" style="padding-top: 1.25rem;">
          <div class="author-meta">
            <img src="${authorAvatar}" alt="${authorName}" class="author-thumb">
            <div>
              <div class="author-name">${authorName}</div>
              <div class="card-read-time">${featured.publishedDate} • ${featured.readTime || "5 min read"}</div>
            </div>
          </div>
          <a href="post.html?id=${featured._id}" class="btn btn-primary btn-sm">
            <span>Read Story</span>
            <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </div>
    </div>
  `;
}

function resetFilters() {
  currentCategory = "All";
  searchQuery = "";
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";
  initCategoryTabs();
  renderFeed();
}

window.resetFilters = resetFilters;
