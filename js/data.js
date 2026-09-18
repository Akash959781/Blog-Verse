/**
 * ==========================================================================
 * BLOGVERSE - SEED DATA & MOCK DATABASE
 * Initial rich sample blog articles, categories, and author accounts
 * ==========================================================================
 */

const SEED_USERS = [
  {
    id: "user-1",
    name: "Alex Rivera",
    email: "alex@example.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
    role: "Senior Frontend Engineer & Designer",
    bio: "Passionate about building fluid, accessible, and delightful digital experiences.",
    joinedDate: "Jan 2025"
  },
  {
    id: "user-2",
    name: "Sophia Chen",
    email: "sophia@example.com",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80",
    role: "AI Researcher & Tech Writer",
    bio: "Exploring the convergence of generative artificial intelligence, robotics, and creative software.",
    joinedDate: "Feb 2025"
  },
  {
    id: "user-3",
    name: "Marcus Vance",
    email: "marcus@example.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
    role: "UI/UX Architect",
    bio: "Crafting design systems that scale seamlessly across multi-platform enterprise products.",
    joinedDate: "Mar 2025"
  }
];

const CATEGORIES = [
  "All",
  "Tech & AI",
  "Web Dev",
  "Design Systems",
  "Productivity",
  "Career"
];

const SEED_POSTS = [
  {
    id: "post-1",
    title: "Building Next-Generation Web Apps with Modern CSS & JavaScript",
    slug: "building-next-generation-web-apps",
    category: "Web Dev",
    tags: ["CSS3", "JavaScript", "Frontend", "Performance"],
    coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    excerpt: "Modern CSS has evolved into a powerhouse featuring native nesting, cascade layers, container queries, and fluid typography. Discover how to leverage these tools to build lightning-fast web applications.",
    content: `## The Modern Frontend Renaissance

The modern web development ecosystem has undergone an extraordinary evolution. Not long ago, developers relied on heavyweight CSS preprocessors, extensive runtime polyfills, and monolithic framework setups just to achieve responsive design and clean components.

Today, native **HTML5** and **CSS3** capabilities provide unparalleled power, performance, and flexibility. Let's look at what's transforming modern frontend development.

### 1. Native Nesting and Modern CSS Architecture

CSS nesting is now natively supported across all modern browsers. This allows you to write cleaner, scoped stylesheet rules without requiring build-step overhead:

\`\`\`css
.card {
  background: var(--bg-surface);
  border-radius: 12px;
  
  & .card-title {
    font-size: 1.25rem;
    color: var(--primary);
  }

  &:hover {
    transform: translateY(-4px);
  }
}
\`\`\`

### 2. Micro-Interactions & Fluid Typography

Modern interfaces demand dynamic micro-interactions. Using CSS Custom Properties (variables) combined with \`clamp()\` yields smooth responsive typography that automatically scales across mobile and ultrawide screens:

> "True digital polish isn't about flashy gimmicks; it's about subtle, thoughtful interactions that make users feel confident in every click."

### 3. Client-Side State with LocalStorage

For rapid prototyping and offline-first interfaces, the browser's native \`localStorage\` API provides reliable synchronous key-value storage. By designing clean data adapters, you can simulate robust full-stack workflows entirely on the client.

### Conclusion

Mastering the foundational trifecta—HTML for structure, CSS for presentation, and JavaScript for behavior—remains the single highest-leverage skill in frontend engineering. Dive deep into the core fundamentals and you will build faster, more resilient web apps.`,
    author: SEED_USERS[0],
    publishedDate: "Sep 15, 2026",
    status: "published",
    readTime: "5 min read",
    views: 1420,
    likes: 89,
    isFeatured: true,
    comments: [
      {
        id: "c-1",
        userName: "Elena Rostova",
        userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
        date: "Sep 16, 2026",
        text: "Incredible breakdown! The native CSS nesting feature alone has saved our team hundreds of lines of build config."
      },
      {
        id: "c-2",
        userName: "Devon Miles",
        userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
        date: "Sep 17, 2026",
        text: "The clamp() tip for typography scales was a game changer for our responsive design system."
      }
    ]
  },
  {
    id: "post-2",
    title: "The Rise of Autonomous AI Agents in Everyday Software Development",
    slug: "rise-of-autonomous-ai-agents",
    category: "Tech & AI",
    tags: ["AI", "MachineLearning", "Automation", "Future"],
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    excerpt: "How autonomous coding agents and LLM-driven developer workflows are shifting programming from manual typing to high-level system orchestration.",
    content: `## Beyond Copilots: The Next Frontier of AI Engineering

Software engineering is undergoing its most profound transformation since the invention of high-level programming languages. We are moving rapidly from autocomplete helpers to autonomous agents capable of multi-step execution.

### Architectural Orchestration

Modern AI assistants can analyze repository structure, propose comprehensive implementation plans, execute code edits, run automated unit tests, and verify results in simulated browser environments.

\`\`\`javascript
// Autonomous task loop conceptual model
async function executeAgentWorkflow(goal) {
  const plan = await createImplementationPlan(goal);
  const reviewed = await obtainApproval(plan);
  if (reviewed) {
    await executeSteps(plan.steps);
    await verifyDeliverables();
  }
}
\`\`\`

### The Human in the Loop

Contrary to dystopian tropes, the primary role of the developer is evolving into that of an **Architect and Conductor**. You define the problem domain, review proposed system designs, guide edge cases, and uphold visual and architectural excellence.

> "The engineers of tomorrow won't just write functions; they will design systems, coordinate intelligent agents, and curate world-class user experiences."

Stay curious and embrace these tools to amplify your creative capabilities!`,
    author: SEED_USERS[1],
    publishedDate: "Sep 12, 2026",
    status: "published",
    readTime: "4 min read",
    views: 2150,
    likes: 142,
    isFeatured: false,
    comments: [
      {
        id: "c-3",
        userName: "Liam O'Connor",
        userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80",
        date: "Sep 13, 2026",
        text: "Thought-provoking read! Pair programming with autonomous agents has completely changed my daily workflow."
      }
    ]
  },
  {
    id: "post-3",
    title: "Mastering Design Systems: Tokens, Glassmorphism, and Visual Harmony",
    slug: "mastering-design-systems",
    category: "Design Systems",
    tags: ["Design", "UIUX", "ColorTheory", "DesignTokens"],
    coverImage: "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=1200&q=80",
    excerpt: "A comprehensive guide on establishing scalable design tokens, harmonious contrast ratios, and modern glassmorphic surface depth in your web projects.",
    content: `## The Anatomy of an Exceptional Design System

A great web application is instantly recognizable by its visual rhythm and cohesive hierarchy. When colors, margins, font weights, and elevations align into an intentional design language, users instinctively feel that the product is trustworthy and refined.

### 1. Semantic Design Tokens

Avoid hardcoding hex codes across stylesheets. Instead, structure your tokens into semantic layers:

1. **Primitive Tokens**: Pure palette definitions (e.g. \`--indigo-500: #6366f1\`).
2. **Semantic Tokens**: Functional intent (e.g. \`--primary-action: var(--indigo-500)\`).
3. **Component Tokens**: Specific component bindings (e.g. \`--btn-primary-bg: var(--primary-action)\`).

### 2. Glassmorphism Done Right

Frosted glass adds sophisticated tactile depth when used sparingly:

\`\`\`css
.glass-card {
  background: rgba(16, 23, 38, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
\`\`\`

Subtle borders and delicate drop shadows prevent glass elements from washing out on varying backgrounds.`,
    author: SEED_USERS[2],
    publishedDate: "Sep 08, 2026",
    status: "published",
    readTime: "6 min read",
    views: 980,
    likes: 64,
    isFeatured: false,
    comments: []
  },
  {
    id: "post-4",
    title: "Deep Work for Developers: How to Protect Flow State in a Distracted World",
    slug: "deep-work-for-developers",
    category: "Productivity",
    tags: ["Focus", "Productivity", "Mindset", "Habits"],
    coverImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
    excerpt: "Practical strategies to eliminate context switching, structure uninterrupted focus blocks, and write higher quality code with less mental fatigue.",
    content: `## Guarding Your Flow State

In modern software development, focus is the rarest and most valuable currency. Complex problem solving requires loading large mental dependency graphs into active working memory.

### The Cost of Context Switching

Every notification, chat ping, or impromptu check-in costs up to 20 minutes of cognitive recovery time. 

### Actionable Strategies

- **Time-Boxed Focus Windows**: 90-minute uninterrupted sprints with zero notifications.
- **Async Communication First**: Document decisions in writing instead of calling quick meetings.
- **End-of-Day Shutdown**: Write down tomorrow's primary objective before closing your editor.

Cultivate your deep work habits and your output quality will soar.`,
    author: SEED_USERS[0],
    publishedDate: "Sep 03, 2026",
    status: "published",
    readTime: "4 min read",
    views: 1640,
    likes: 118,
    isFeatured: false,
    comments: []
  },
  {
    id: "post-5",
    title: "From Junior to Senior Engineer: The Skills That Actually Matter",
    slug: "from-junior-to-senior-engineer",
    category: "Career",
    tags: ["Career", "Mentorship", "Engineering", "Leadership"],
    coverImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    excerpt: "Why technical prowess is only table stakes, and how communication, empathy, system architecture, and mentorship drive career acceleration.",
    content: `## What Seniority Really Means

When you begin your coding journey, success is measured by getting your code to compile and pass tests. But as you transition into senior leadership roles, your primary leverage shifts from individual lines of code to organizational clarity.

### Core Pillars of Senior Engineering

1. **Clear Technical Communication**: Writing readable pull requests, lucid architecture docs, and constructive code reviews.
2. **Pragmatic Simplicity**: Choosing boring, battle-tested solutions over shiny, unvetted dependencies.
3. **Elevating Others**: Mentoring junior engineers and unblocking team members.

> "A great senior developer doesn't just write clever solutions; they ensure that the whole team can understand, maintain, and build upon them."`,
    author: SEED_USERS[1],
    publishedDate: "Aug 28, 2026",
    status: "published",
    readTime: "5 min read",
    views: 3410,
    likes: 210,
    isFeatured: false,
    comments: []
  }
];
