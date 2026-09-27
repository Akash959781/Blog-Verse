/**
 * ==========================================================================
 * BLOGVERSE - BLOG POST STUDIO & EDITOR CONTROLLER
 * Form validation, formatting toolbar, live markdown preview, cover presets.
 * Updated to use async API calls.
 * ==========================================================================
 */

let isEditMode = false;
let editingPostId = null;
let postTags = [];

const PRESET_COVERS = [
  { label: "Coding & Tech", url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80" },
  { label: "AI & Neural", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80" },
  { label: "Design System", url: "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=1200&q=80" },
  { label: "Minimalist Desk", url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80" },
  { label: "Collaboration", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80" }
];

document.addEventListener("DOMContentLoaded", async () => {
  initUserSession();
  initEditor();
  initCoverPresets();
  initTagInput();
  initToolbar();
  initPreviewToggle();
  await checkEditMode();
});

function initUserSession() {
  if (!api.auth.isAuthenticated()) {
    // Redirect to login if not authenticated
    showToast("Please sign in to create articles.", "info");
    setTimeout(() => { window.location.href = "login.html"; }, 1000);
  }
}

async function checkEditMode() {
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("edit");
  if (!editId) return;

  try {
    const res = await api.posts.getById(editId);
    const post = res.post;
    if (!post) {
      showToast("Article not found for editing", "error");
      return;
    }

    isEditMode = true;
    editingPostId = editId;

    const editorTitle = document.getElementById("editor-page-title");
    if (editorTitle) editorTitle.textContent = "Edit Article";
    document.getElementById("post-title-input").value = post.title;
    document.getElementById("post-category-select").value = post.category;
    document.getElementById("post-excerpt-input").value = post.excerpt;
    document.getElementById("post-cover-input").value = post.coverImage;
    document.getElementById("post-content-input").value = post.content;

    if (post.tags && Array.isArray(post.tags)) {
      postTags = [...post.tags];
      renderTags();
    }

    updateCoverPreview(post.coverImage);
    updateWordCount();
    updateLivePreview();

  } catch (error) {
    showToast("Failed to load article for editing.", "error");
  }
}

function initEditor() {
  const contentInput = document.getElementById("post-content-input");
  const coverInput = document.getElementById("post-cover-input");
  const titleInput = document.getElementById("post-title-input");

  if (contentInput) {
    contentInput.addEventListener("input", () => {
      updateWordCount();
      updateLivePreview();
    });
  }

  if (titleInput) {
    titleInput.addEventListener("input", updateLivePreview);
  }

  if (coverInput) {
    coverInput.addEventListener("input", () => {
      updateCoverPreview(coverInput.value.trim());
    });
  }

  const publishBtn = document.getElementById("publish-btn");
  const draftBtn = document.getElementById("save-draft-btn");

  if (publishBtn) {
    publishBtn.addEventListener("click", () => handleSavePost("published"));
  }
  if (draftBtn) {
    draftBtn.addEventListener("click", () => handleSavePost("draft"));
  }
}

function initCoverPresets() {
  const container = document.getElementById("cover-presets-container");
  if (!container) return;

  container.innerHTML = PRESET_COVERS.map(p => `
    <button type="button" class="btn btn-secondary btn-sm" data-url="${p.url}" style="font-size: 0.78rem; padding: 0.3rem 0.65rem;">
      ${p.label}
    </button>
  `).join("");

  container.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const url = btn.dataset.url;
    document.getElementById("post-cover-input").value = url;
    updateCoverPreview(url);
  });
}

function updateCoverPreview(url) {
  const img = document.getElementById("cover-preview-img");
  const placeholder = document.getElementById("cover-preview-placeholder");

  if (url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:"))) {
    img.src = url;
    img.style.display = "block";
    placeholder.style.display = "none";
  } else {
    img.style.display = "none";
    placeholder.style.display = "flex";
  }
}

function initTagInput() {
  const input = document.getElementById("tag-input-field");
  if (!input) return;

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = input.value.trim().replace(/^#/, "");
      if (val && !postTags.includes(val)) {
        postTags.push(val);
        input.value = "";
        renderTags();
      }
    }
  });
}

function renderTags() {
  const container = document.getElementById("tag-pills-list");
  if (!container) return;

  container.innerHTML = postTags.map((tag, idx) => `
    <span class="tag-pill-removable">
      #${tag}
      <button type="button" class="tag-pill-remove-btn" onclick="removeTag(${idx})">&times;</button>
    </span>
  `).join("");
}

window.removeTag = function(idx) {
  postTags.splice(idx, 1);
  renderTags();
};

function initToolbar() {
  const buttons = document.querySelectorAll(".toolbar-btn");
  const textarea = document.getElementById("post-content-input");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      insertFormatting(textarea, action);
      updateWordCount();
      updateLivePreview();
    });
  });
}

function insertFormatting(textarea, action) {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);
  let replacement = "";

  switch (action) {
    case "bold":    replacement = `**${selected || "bold text"}**`; break;
    case "italic":  replacement = `*${selected || "italic text"}*`; break;
    case "h2":      replacement = `\n## ${selected || "Section Heading"}\n`; break;
    case "h3":      replacement = `\n### ${selected || "Subheading"}\n`; break;
    case "quote":   replacement = `\n> ${selected || "Inspiring quote here"}\n`; break;
    case "code":    replacement = `\n\`\`\`javascript\n${selected || "// Code snippet here"}\n\`\`\`\n`; break;
    case "list":    replacement = `\n- ${selected || "Key takeaway point"}\n`; break;
    case "link":    replacement = `[${selected || "Link text"}](https://example.com)`; break;
    default: return;
  }

  textarea.setRangeText(replacement, start, end, "end");
  textarea.focus();
}

function updateWordCount() {
  const text = document.getElementById("post-content-input").value;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));

  const wordsEl = document.getElementById("word-count-badge");
  const readTimeEl = document.getElementById("read-time-badge");

  if (wordsEl) wordsEl.textContent = `${words} words`;
  if (readTimeEl) readTimeEl.textContent = `${minutes} min read`;
}

function initPreviewToggle() {
  const toggleBtn = document.getElementById("toggle-preview-layout-btn");
  const container = document.getElementById("editor-main-container");

  if (toggleBtn && container) {
    toggleBtn.addEventListener("click", () => {
      container.classList.toggle("single-pane");
      const isSplit = !container.classList.contains("single-pane");
      toggleBtn.innerHTML = isSplit
        ? '<i class="fa-solid fa-columns"></i> Side-by-Side'
        : '<i class="fa-regular fa-square"></i> Full Width';
    });
  }
}

function updateLivePreview() {
  const title = document.getElementById("post-title-input").value || "Article Title Preview";
  const content = document.getElementById("post-content-input").value || "Your formatted content will appear here in real time...";

  const previewTitle = document.getElementById("preview-title");
  const previewBody = document.getElementById("preview-body");

  if (previewTitle) previewTitle.textContent = title;
  if (previewBody) previewBody.innerHTML = simpleMarkdownToHtml(content);
}

// Lightweight, safe markdown-to-HTML converter
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

async function handleSavePost(status = "published") {
  const title = document.getElementById("post-title-input").value.trim();
  const category = document.getElementById("post-category-select").value;
  const excerpt = document.getElementById("post-excerpt-input").value.trim();
  let coverImage = document.getElementById("post-cover-input").value.trim();
  const content = document.getElementById("post-content-input").value.trim();

  if (!title) { showToast("Please provide a title for your article.", "error"); return; }
  if (!content) { showToast("Article content cannot be empty.", "error"); return; }
  if (!coverImage) { coverImage = PRESET_COVERS[0].url; }

  const publishBtn = document.getElementById("publish-btn");
  const draftBtn = document.getElementById("save-draft-btn");
  const activeBtn = status === "published" ? publishBtn : draftBtn;

  if (activeBtn) {
    activeBtn.disabled = true;
    activeBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';
  }

  const postData = {
    title,
    category,
    tags: postTags.length > 0 ? postTags : [category],
    excerpt: excerpt || content.substring(0, 140) + "...",
    coverImage,
    content,
    status,
  };

  try {
    if (isEditMode) {
      const updated = await storage.updatePost(editingPostId, postData);
      if (updated) {
        showToast(status === "draft" ? "Draft updated!" : "Article published successfully!", "success");
        setTimeout(() => {
          window.location.href = `post.html?id=${editingPostId}`;
        }, 700);
      }
    } else {
      const created = await storage.createPost(postData);
      if (created) {
        showToast(status === "draft" ? "Saved as draft!" : "Article published successfully!", "success");
        setTimeout(() => {
          window.location.href = `post.html?id=${created._id}`;
        }, 700);
      }
    }
  } catch (error) {
    showToast(error.message || "Failed to save article. Please try again.", "error");
    if (activeBtn) {
      activeBtn.disabled = false;
      activeBtn.innerHTML = status === "published"
        ? '<i class="fa-solid fa-paper-plane"></i> Publish Article'
        : '<i class="fa-regular fa-floppy-disk"></i> Save Draft';
    }
  }
}
