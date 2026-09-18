/**
 * ==========================================================================
 * BLOGVERSE - HOME PAGE LOGIC
 * Dynamic feed rendering, category filters, instant search, and sorting
 * ==========================================================================
 */

let currentCategory = "All";
let searchQuery = "";
let currentSort = "latest";

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
      searchQuery = e.target.value.toLowerCase().trim();
      renderFeed();
    });

    // Global keyboard shortcut: Cmd+K / Ctrl+K
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

function renderFeed() {
  const allPosts = storage.getAllPosts().filter(p => p.status !== "draft");
  
  // Filter by category
  let filtered = allPosts;
  if (currentCategory !== "All") {
    filtered = filtered.filter(p => p.category === currentCategory);
  }

  // Filter by search query
  if (searchQuery) {
    filtered = filtered.filter(p => {
      const matchTitle = p.title.toLowerCase().includes(searchQuery);
      const matchExcerpt = p.excerpt.toLowerCase().includes(searchQuery);
      const matchTags = p.tags && p.tags.some(t => t.toLowerCase().includes(searchQuery));
      const matchAuthor = p.author && p.author.name.toLowerCase().includes(searchQuery);
      return matchTitle || matchExcerpt || matchTags || matchAuthor;
    });
  }

  // Sort
  if (currentSort === "latest") {
    filtered.sort((a, b) => new Date(b.publishedDate || 0) - new Date(a.publishedDate || 0));
  } else if (currentSort === "views") {
    filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
  } else if (currentSort === "likes") {
    filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }

  // Render Featured Post (only if not searching/filtering specific categories, or pick the first matching)
  renderFeaturedPost(allPosts);

  // Render Grid
  const gridContainer = document.getElementById("blog-grid");
  const resultCount = document.getElementById("result-count");

  if (resultCount) {
    resultCount.textContent = `Showing ${filtered.length} article${filtered.length === 1 ? "" : "s"}`;
  }

  if (!gridContainer) return;

  if (filtered.length === 0) {
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

  gridContainer.innerHTML = filtered.map(post => {
    const isBookmarked = storage.isPostBookmarked(post.id);
    const authorName = post.author ? post.author.name : "Anonymous";
    const authorAvatar = post.author ? post.author.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80";

    return `
      <article class="blog-card animate-fade-in" data-id="${post.id}">
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
            <a href="post.html?id=${post.id}">${post.title}</a>
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
                <i class="fa-regular fa-heart"></i> ${post.likes || 0}
              </span>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderFeaturedPost(allPosts) {
  const container = document.getElementById("featured-post-container");
  if (!container) return;

  // Don't show hero featured if user is actively searching with a query
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
  const authorAvatar = featured.author ? featured.author.avatar : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80";

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
          <a href="post.html?id=${featured.id}">${featured.title}</a>
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
          <a href="post.html?id=${featured.id}" class="btn btn-primary btn-sm">
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
