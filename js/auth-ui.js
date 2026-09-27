/**
 * ==========================================================================
 * BLOGVERSE - AUTHENTICATION UI CONTROLLER
 * Form validation, password visibility toggle, avatar picker & demo login.
 * Updated to use async API calls instead of synchronous localStorage auth.
 * ==========================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  initPasswordToggles();
  initLoginForm();
  initRegisterForm();
  initDemoLogin();
});

function initPasswordToggles() {
  const toggleBtns = document.querySelectorAll(".input-toggle-btn");
  toggleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        btn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
      } else {
        input.type = "password";
        btn.innerHTML = '<i class="fa-regular fa-eye"></i>';
      }
    });
  });
}

function initDemoLogin() {
  const demoBtns = document.querySelectorAll(".demo-login-btn");
  demoBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "Signing in...";

      try {
        const res = await auth.loginAsDemo();
        showToast(`Welcome back, ${res.user.name}!`, "success");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 700);
      } catch (error) {
        showToast(error.message || "Demo login failed. Please try again.", "error");
        btn.disabled = false;
        btn.textContent = "1-Click Demo Login";
      }
    });
  });
}

function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    const errorAlert = document.getElementById("auth-error-alert");
    const submitBtn = form.querySelector("[type=submit]");

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      showError(errorAlert, "Please enter both email and password.");
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Signing in...';

    try {
      const res = await auth.login(email, password);
      showToast(`Welcome back, ${res.user.name}!`, "success");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 700);
    } catch (error) {
      showError(errorAlert, error.message || "Login failed. Please try again.");
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

function initRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  // Selected avatar state
  let selectedAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80";

  const avatarOpts = document.querySelectorAll(".avatar-opt");
  avatarOpts.forEach(opt => {
    opt.addEventListener("click", () => {
      avatarOpts.forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      selectedAvatar = opt.dataset.avatar;
    });
  });

  // Password strength indicator
  const passInput = document.getElementById("register-password");
  const strengthIndicator = document.getElementById("strength-indicator");

  if (passInput && strengthIndicator) {
    passInput.addEventListener("input", () => {
      const val = passInput.value;
      let score = 0;
      if (val.length >= 6) score += 25;
      if (/[A-Z]/.test(val)) score += 25;
      if (/[0-9]/.test(val)) score += 25;
      if (/[^A-Za-z0-9]/.test(val)) score += 25;

      strengthIndicator.style.width = score + "%";
      if (score < 50) {
        strengthIndicator.style.backgroundColor = "var(--accent-rose)";
      } else if (score < 75) {
        strengthIndicator.style.backgroundColor = "var(--accent-amber)";
      } else {
        strengthIndicator.style.backgroundColor = "var(--accent-emerald)";
      }
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("register-name");
    const emailInput = document.getElementById("register-email");
    const passwordInput = document.getElementById("register-password");
    const confirmInput = document.getElementById("register-confirm");
    const termsInput = document.getElementById("register-terms");
    const errorAlert = document.getElementById("auth-error-alert");
    const submitBtn = form.querySelector("[type=submit]");

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    if (!name || !email || !password) {
      showError(errorAlert, "Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      showError(errorAlert, "Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirm) {
      showError(errorAlert, "Passwords do not match.");
      return;
    }

    if (termsInput && !termsInput.checked) {
      showError(errorAlert, "Please agree to the Terms of Service.");
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Creating account...';

    try {
      const res = await auth.register({
        name,
        email,
        password,
        avatar: selectedAvatar,
        role: "Writer & Developer",
      });

      showToast("Account created successfully! Welcome to Blogverse.", "success");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 700);
    } catch (error) {
      showError(errorAlert, error.message || "Registration failed. Please try again.");
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

function showError(el, message) {
  if (!el) {
    showToast(message, "error");
    return;
  }
  el.textContent = message;
  el.style.display = "block";
}
