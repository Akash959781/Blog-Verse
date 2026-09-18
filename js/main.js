/**
 * ==========================================================================
 * BLOGVERSE - GLOBAL UI CONTROLLER & COMMON UTILITIES
 * Theme toggling, header state, mobile drawer, toasts, modals
 * ==========================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNavigation();
  initToastContainer();
});

/* --- Theme Management --- */
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeToggleIcons(savedTheme);

  const toggleBtns = document.querySelectorAll(".theme-toggle-btn");
  toggleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const nextTheme = current === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", nextTheme);
      localStorage.setItem(STORAGE_KEYS.THEME, nextTheme);
      updateThemeToggleIcons(nextTheme);
      showToast(`Switched to ${nextTheme} mode`, "info");
    });
  });
}

function updateThemeToggleIcons(theme) {
  const toggleBtns = document.querySelectorAll(".theme-toggle-btn");
  toggleBtns.forEach(btn => {
    btn.innerHTML = theme === "light" 
      ? '<i class="fa-solid fa-moon"></i>' 
      : '<i class="fa-solid fa-sun"></i>';
    btn.setAttribute("title", `Switch to ${theme === "light" ? "Dark" : "Light"} Mode`);
  });
}

/* --- Dynamic Navigation & User Dropdown --- */
function initNavigation() {
  const user = auth.getCurrentUser();
  const navActions = document.getElementById("nav-user-area");
  const mobileNavLinks = document.getElementById("nav-links");
  const hamburgerBtn = document.getElementById("hamburger-btn");

  // Mobile menu toggle
  if (hamburgerBtn && mobileNavLinks) {
    hamburgerBtn.addEventListener("click", () => {
      mobileNavLinks.classList.toggle("open");
      const isOpen = mobileNavLinks.classList.contains("open");
      hamburgerBtn.innerHTML = isOpen 
        ? '<i class="fa-solid fa-xmark"></i>' 
        : '<i class="fa-solid fa-bars"></i>';
    });
  }

  // Active link detection based on window.location
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const links = document.querySelectorAll(".nav-link");
  links.forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentPath || (currentPath === "" && href === "index.html")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Render User Actions in Header
  if (navActions) {
    if (user) {
      navActions.innerHTML = `
        <a href="create-blog.html" class="btn btn-primary btn-sm">
          <i class="fa-solid fa-pen-nib"></i>
          <span>Write</span>
        </a>
        <div class="user-menu" id="user-menu-container">
          <button class="user-pill" id="user-pill-btn" aria-label="User menu">
            <img src="${user.avatar}" alt="${user.name}" class="user-avatar">
            <span class="user-pill-name">${user.name.split(" ")[0]}</span>
            <i class="fa-solid fa-angle-down" style="font-size: 0.75rem; color: var(--text-dim);"></i>
          </button>
          <div class="user-dropdown" id="user-dropdown-menu">
            <div style="padding: 0.5rem 0.85rem; border-bottom: 1px solid var(--border-color); margin-bottom: 0.25rem;">
              <div style="font-weight: 700; color: var(--text-main); font-size: 0.9rem;">${user.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-dim); overflow: hidden; text-overflow: ellipsis;">${user.email}</div>
            </div>
            <a href="dashboard.html" class="dropdown-item">
              <i class="fa-solid fa-table-columns"></i>
              <span>Dashboard</span>
            </a>
            <a href="create-blog.html" class="dropdown-item">
              <i class="fa-solid fa-plus"></i>
              <span>Create New Post</span>
            </a>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" id="nav-logout-btn" style="color: var(--accent-rose);">
              <i class="fa-solid fa-arrow-right-from-bracket"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      `;

      // Dropdown toggle
      const pillBtn = document.getElementById("user-pill-btn");
      const dropdown = document.getElementById("user-dropdown-menu");
      if (pillBtn && dropdown) {
        pillBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          dropdown.classList.toggle("show");
        });

        document.addEventListener("click", () => {
          dropdown.classList.remove("show");
        });
      }

      // Logout handler
      const logoutBtn = document.getElementById("nav-logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
          auth.logout();
          showToast("Signed out successfully", "info");
          setTimeout(() => {
            window.location.href = "index.html";
          }, 600);
        });
      }
    } else {
      navActions.innerHTML = `
        <a href="login.html" class="btn btn-outline btn-sm">Sign In</a>
        <a href="register.html" class="btn btn-primary btn-sm">Get Started</a>
      `;
    }
  }

  // Footer newsletter subscription
  const newsletterForm = document.getElementById("newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("newsletter-email");
      if (emailInput && emailInput.value) {
        showToast("Thanks for subscribing to our newsletter!", "success");
        emailInput.value = "";
      }
    });
  }
}

/* --- Toast Notification Engine --- */
function initToastContainer() {
  if (!document.getElementById("toast-container")) {
    const container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
}

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container") || document.body;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  const iconMap = {
    success: '<i class="fa-solid fa-circle-check" style="color: var(--accent-emerald);"></i>',
    error: '<i class="fa-solid fa-circle-exclamation" style="color: var(--accent-rose);"></i>',
    info: '<i class="fa-solid fa-circle-info" style="color: var(--primary);"></i>'
  };

  toast.innerHTML = `
    ${iconMap[type] || iconMap.info}
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* --- Modal Helpers --- */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }
}
