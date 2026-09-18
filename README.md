# Blogverse - Responsive Blog Web Application

A modern, responsive, multi-page Technical Blog Web Application built with **HTML5**, **Vanilla CSS3** (featuring dark/light theme switching, glassmorphism, and responsive grid layouts), and **ES6 JavaScript** (powered by a client-side `localStorage` data engine).

---

## 🚀 Quick Start & Local Development Setup

You can run this project locally using any of the simple options below:

### Option 1: Python Built-in Static Server (Recommended)
Python is already installed on most systems and requires zero extra packages:
```bash
# In this project root directory:
python -m http.server 3000
```
Then open your browser and navigate to:
👉 **`http://localhost:3000`**

### Option 2: Node.js Static Server
If you prefer Node.js:
```bash
npx serve .
# or
node -e "const http=require('http'),fs=require('fs'),path=require('path');http.createServer((req,res)=>{let f=path.join('.',req.url==='/'?'index.html':req.url.split('?')[0]);fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end('Not found');}else{res.writeHead(200);res.end(d);}})}).listen(3000,()=>console.log('Server running on http://localhost:3000'));"
```

### Option 3: Direct Browser Launch
Simply double-click `index.html` to open it in Google Chrome, Microsoft Edge, Brave, or Firefox. All features, styling, and `localStorage` persistence will work right away.

---

## 🧭 Application Structure & Pages

The application is organized into 5 core interactive pages plus a dedicated story reader view:

| Page | File | Description |
| :--- | :--- | :--- |
| **Home** | `index.html` | Featured hero story, dynamic category filter tabs, live search, sort options (Latest, Most Viewed, Most Liked), blog cards grid, and newsletter subscription. |
| **Login** | `login.html` | Glassmorphic auth card, floating labels, show/hide password toggle, input validation, and **1-Click Demo Login** button for instant testing. |
| **Register** | `register.html` | Sign up with real-time password strength meter, password confirmation matching, and interactive avatar picker. |
| **Dashboard** | `dashboard.html` | Creator studio displaying analytics metrics (Total Articles, Views, Likes, Bookmarks), post status tabs (All, Published, Drafts), and post management table with Edit & Delete modal. |
| **Create & Edit Blog** | `create-blog.html` | Rich writing studio featuring cover image URL with real-time preview & presets, tag pills input, formatting toolbar, live word counter & reading time estimate, and **live side-by-side markdown reader preview**. |
| **Post Reader** | `post.html` | Full article reading experience with formatted headings, code snippets, blockquotes, author bio card, interactive Like counter, Bookmark toggle, Share link, and dynamic Comments section. |

---

## 📚 What You'll Learn: Core Concepts Breakdown

### 1. HTML5 Fundamentals
- **Semantic Structure**: Proper usage of `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, and `<footer>` rather than generic `<div>` soup.
- **Accessible Forms**: Inputs connected with `<label for="...">`, descriptive `aria-label` attributes, and built-in HTML5 form constraints (`required`, `type="email"`, `type="search"`).
- **SEO Optimization**: Meta descriptions, OpenGraph tags, semantic heading hierarchies (`<h1>` through `<h3>`).

### 2. CSS3 & Design System Architecture
- **Design Tokens (CSS Variables)**: Centralized `:root` color palettes, border radiuses, typography stacks, and transition curves defined in [`css/style.css`](css/style.css).
- **Dark & Light Mode Switching**: Implemented cleanly using `[data-theme="light"]` and `[data-theme="dark"]` attribute selectors without duplicating rules.
- **Glassmorphism & Depth**: Multi-layered shadows and `backdrop-filter: blur(16px)` for modern frosted-glass cards and sticky navbars.
- **Fluid Layouts**: Modern CSS Grid (`repeat(auto-fill, minmax(340px, 1fr))`) and Flexbox for responsive alignment across mobile, tablet, and widescreen viewports.
- **Micro-animations**: Smooth hover elevation (`transform: translateY(-5px)`), button glow shadows, and animated modals/toasts.

### 3. JavaScript (ES6+) Functionality
- **Client-Side Persistence (`localStorage`)**: In [`js/storage.js`](js/storage.js), articles, comments, bookmarks, and likes are saved and loaded reliably across sessions.
- **Mock Authentication**: [`js/auth.js`](js/auth.js) manages user sessions, registration, and quick demo logins without requiring a backend database server.
- **Dynamic DOM Manipulation**: Creating and updating elements on the fly, updating reaction counters, and appending comments instantaneously.
- **URL Search Parameters**: Using `new URLSearchParams(window.location.search)` in [`js/post.js`](js/post.js) and [`js/editor.js`](js/editor.js) to pass article IDs dynamically between pages (`post.html?id=post-1` or `create-blog.html?edit=post-1`).
- **Markdown Parsing**: A lightweight converter in [`js/editor.js`](js/editor.js) turns user markdown (`## Heading`, `**bold**`, `> quote`, ````code````) into styled HTML elements.

---

## 🎨 Demo Accounts Pre-Configured

You can log in instantly by clicking **"1-Click Demo Login"** on `login.html`, or using:
- **Email**: `alex@example.com`
- **Password**: Any password (e.g. `demo1234`)

You can also register a brand new account on `register.html` with your custom name, email, and avatar!
