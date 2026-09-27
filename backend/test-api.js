/**
 * Automated Verification Script for Blog-Verse REST APIs
 */

const BASE_URL = "http://localhost:5000";

async function runTests() {
  console.log("🧪 Starting Blog-Verse API automated verification...\n");
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}\n   Error: ${err.message}`);
      failed++;
    }
  }

  let testUserToken = null;
  let testUserId = null;
  let createdPostId = null;

  // 1. Health check
  await test("GET /api/health", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.status.includes("Blog-Verse API is running")) {
      throw new Error("Unexpected health response: " + JSON.stringify(data));
    }
  });

  // 2. Demo User Login
  await test("POST /api/auth/login (Demo account Alex Rivera)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alex@example.com",
        password: "Demo@1234",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) {
      throw new Error(data.message || `Status ${res.status}`);
    }
    if (data.user.email !== "alex@example.com") {
      throw new Error("User email mismatch");
    }
  });

  // 3. User Registration
  const testEmail = `newuser_${Date.now()}@example.com`;
  await test("POST /api/auth/register (New user registration)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Developer",
        email: testEmail,
        password: "Password123!",
        role: "Full Stack Engineer",
        bio: "Testing the Blog-Verse REST APIs",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) {
      throw new Error(data.message || `Status ${res.status}`);
    }
    testUserToken = data.token;
    testUserId = data.user.id || data.user._id;
  });

  // 4. User Login with new account
  await test("POST /api/auth/login (Login with newly registered user)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "Password123!",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) {
      throw new Error(data.message || `Status ${res.status}`);
    }
    testUserToken = data.token;
  });

  // 5. GET /api/auth/me (Protected Profile)
  await test("GET /api/auth/me (Protected user profile)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const data = await res.json();
    if (!res.ok || !data.user) {
      throw new Error(data.message || `Status ${res.status}`);
    }
    if (data.user.email !== testEmail) {
      throw new Error("Email mismatch in profile");
    }
  });

  // 6. Create Blog API
  await test("POST /api/posts (Create Blog)", async () => {
    const res = await fetch(`${BASE_URL}/api/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        title: "Building Microservices with Node.js & Express",
        category: "Web Dev",
        tags: ["NodeJS", "Express", "Backend", "APIs"],
        excerpt: "An architectural deep-dive into modular REST APIs with Express.",
        content: `## Microservice Foundations\n\nBuilding decoupled, scalable APIs requires modular routing, robust input validation, and secure authentication.\n\n### Core Benefits\n- Independent scaling\n- Fault isolation\n- Rapid deployment cycles`,
        coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
        status: "published",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.post) {
      throw new Error(data.message || `Status ${res.status}`);
    }
    createdPostId = data.post.id || data.post._id;
  });

  // 7. Get All Blogs
  await test("GET /api/posts (List all blogs)", async () => {
    const res = await fetch(`${BASE_URL}/api/posts`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.posts)) {
      throw new Error(data.message || `Status ${res.status}`);
    }
    if (data.posts.length < 1) {
      throw new Error("No posts returned");
    }
  });

  // 8. Get Single Blog by ID
  await test("GET /api/posts/:id (Fetch single created blog)", async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${createdPostId}`);
    const data = await res.json();
    if (!res.ok || !data.post) {
      throw new Error(data.message || `Status ${res.status}`);
    }
    if (data.post.title !== "Building Microservices with Node.js & Express") {
      throw new Error("Title mismatch");
    }
  });

  // 9. Like Blog Post
  await test("POST /api/posts/:id/like (Toggle like)", async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${createdPostId}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const data = await res.json();
    if (!res.ok || !data.success || data.liked !== true) {
      throw new Error(data.message || `Status ${res.status}`);
    }
  });

  // 10. Add Comment
  await test("POST /api/posts/:id/comments (Add comment)", async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${createdPostId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        text: "Outstanding article! Clear architecture and great code snippets.",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.comment) {
      throw new Error(data.message || `Status ${res.status}`);
    }
  });

  console.log(`\n===========================================`);
  console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log(`===========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
