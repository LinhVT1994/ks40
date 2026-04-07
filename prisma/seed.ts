import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  // ── Users ──────────────────────────────────────────────────────
  const adminPassword   = await bcrypt.hash('admin123', 12);
  const memberPassword  = await bcrypt.hash('member123', 12);
  const premiumPassword = await bcrypt.hash('premium123', 12);

  const admin = await db.user.upsert({
    where:  { email: 'admin@ks40.com' },
    update: {},
    create: {
      email:    'admin@ks40.com',
      name:     'Admin KS40',
      password: adminPassword,
      role:     'ADMIN',
      status:   'ACTIVE',
      bio:      'Quản trị viên hệ thống KS40 Academy.',
      image:    'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  });

  const fakeMembers = [
    { email: 'member@ks40.com',   name: 'Linh VT',         role: 'MEMBER'  as const, password: memberPassword,  bio: 'Software Engineer đang học System Design.',        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=linh' },
    { email: 'premium@ks40.com',  name: 'Minh Trần',       role: 'PREMIUM' as const, password: premiumPassword, bio: 'Senior Backend Engineer tại một fintech startup.',  image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=minh' },
    { email: 'huy@ks40.com',      name: 'Huy Nguyễn',      role: 'MEMBER'  as const, password: memberPassword,  bio: 'DevOps engineer, đang nghiên cứu Kubernetes.',      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huy' },
    { email: 'trang@ks40.com',    name: 'Trang Lê',         role: 'MEMBER'  as const, password: memberPassword,  bio: 'Frontend developer, yêu thích React và UX design.', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=trang' },
    { email: 'dat@ks40.com',      name: 'Đạt Phạm',        role: 'PREMIUM' as const, password: premiumPassword, bio: 'Data Scientist, đang làm với LLM và RAG systems.',   image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dat' },
    { email: 'nam@ks40.com',      name: 'Nam Võ',           role: 'MEMBER'  as const, password: memberPassword,  bio: 'Fullstack developer, thích viết về Web3.',           image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nam' },
    { email: 'thu@ks40.com',      name: 'Thu Hoàng',       role: 'MEMBER'  as const, password: memberPassword,  bio: 'Backend engineer, chuyên PostgreSQL performance.',   image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=thu' },
  ];

  const users: typeof admin[] = [admin];
  for (const m of fakeMembers) {
    const u = await db.user.upsert({
      where:  { email: m.email },
      update: {},
      create: { ...m, status: 'ACTIVE' },
    });
    users.push(u);
    // Onboarding
    await db.userOnboarding.upsert({
      where:  { userId: u.id },
      update: {},
      create: {
        userId:              u.id,
        occupation:          ['DEVELOPER', 'DEVOPS_ENGINEER', 'DATA_SCIENTIST', 'STUDENT'][Math.floor(Math.random() * 4)] as 'DEVELOPER' | 'DEVOPS_ENGINEER' | 'DATA_SCIENTIST' | 'STUDENT',
        interestedCategories: ['BACKEND', 'FRONTEND', 'DEVOPS', 'AI_ML', 'SYSTEM_DESIGN'].slice(0, Math.floor(Math.random() * 3) + 2) as ('BACKEND' | 'FRONTEND' | 'DEVOPS' | 'AI_ML' | 'SYSTEM_DESIGN')[],
        completedAt:         new Date(),
      },
    });
  }

  // Onboarding cho admin
  await db.userOnboarding.upsert({
    where:  { userId: admin.id },
    update: {},
    create: {
      userId:              admin.id,
      occupation:          'DEVELOPER',
      interestedCategories: ['SYSTEM_DESIGN', 'BACKEND', 'DEVOPS'],
      completedAt:         new Date(),
    },
  });

  // ── Follows ────────────────────────────────────────────────────
  const followPairs = [
    [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], // all follow admin
    [1, 2], [1, 4], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 1],
    [2, 5], [3, 6], [4, 7],
  ];
  for (const [fi, ti] of followPairs) {
    await db.follow.upsert({
      where:  { followerId_followingId: { followerId: users[fi].id, followingId: users[ti].id } },
      update: {},
      create: { followerId: users[fi].id, followingId: users[ti].id },
    }).catch(() => {});
  }

  // ── Tags ───────────────────────────────────────────────────────
  const tagNames = ['CI/CD', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis',
    'React', 'Next.js', 'TypeScript', 'System Design', 'Microservices',
    'Machine Learning', 'LLM', 'Blockchain', 'Web3', 'Performance'];

  const tags: Record<string, string> = {};
  for (const name of tagNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const tag = await db.tag.upsert({
      where:  { slug },
      update: {},
      create: { name, slug },
    });
    tags[name] = tag.id;
  }

  // ── SiteConfig ─────────────────────────────────────────────────
  await db.siteConfig.upsert({
    where:  { key: 'article_categories' },
    update: {},
    create: {
      key:   'article_categories',
      value: [
        { value: 'SYSTEM_DESIGN', label: 'System Design', emoji: '🏗️',  color: 'purple',  enabled: true },
        { value: 'BACKEND',       label: 'Backend',       emoji: '⚙️',   color: 'blue',    enabled: true },
        { value: 'FRONTEND',      label: 'Frontend',      emoji: '🎨',   color: 'pink',    enabled: true },
        { value: 'DEVOPS',        label: 'DevOps',        emoji: '🚀',   color: 'orange',  enabled: true },
        { value: 'AI_ML',         label: 'AI / ML',       emoji: '🤖',   color: 'green',   enabled: true },
        { value: 'BLOCKCHAIN',    label: 'Blockchain',    emoji: '⛓️',   color: 'yellow',  enabled: true },
        { value: 'OTHER',         label: 'Khác',          emoji: '📦',   color: 'slate',   enabled: false },
      ],
    },
  });

  // ── Series ─────────────────────────────────────────────────────
  const systemDesignSeries = await db.series.upsert({
    where:  { slug: 'system-design-masterclass' },
    update: {},
    create: {
      title:       'System Design Masterclass',
      slug:        'system-design-masterclass',
      description: 'Series bài học thiết kế hệ thống từ cơ bản đến nâng cao, chuẩn bị cho interview tại Big Tech.',
      audience:    'MEMBERS',
    },
  });

  // ── Articles ───────────────────────────────────────────────────
  const articles = [
    {
      title:     'CI/CD Pipeline với GitHub Actions: Từ Zero đến Production',
      slug:      'cicd-pipeline-github-actions',
      thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=600&auto=format&fit=crop',
      cover:     'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=1400&auto=format&fit=crop',
      summary:   'Hướng dẫn xây dựng CI/CD pipeline hoàn chỉnh với GitHub Actions, từ chạy test đến deploy tự động lên cloud.',
      content:   `## Giới thiệu\n\nCI/CD (Continuous Integration / Continuous Deployment) là nền tảng của DevOps hiện đại. Bài viết này hướng dẫn bạn xây dựng pipeline hoàn chỉnh với GitHub Actions.\n\n## GitHub Actions là gì?\n\nGitHub Actions là nền tảng CI/CD tích hợp sẵn trong GitHub, cho phép bạn tự động hóa build, test và deploy.\n\n## Cấu trúc workflow\n\n\`\`\`yaml\nname: CI/CD Pipeline\non:\n  push:\n    branches: [main]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - run: npm ci\n      - run: npm test\n\`\`\`\n\n## Deploy lên production\n\nSau khi test pass, pipeline tự động deploy lên server thông qua SSH hoặc cloud provider.\n\n## Kết luận\n\nCI/CD giúp team phát triển nhanh hơn và giảm thiểu lỗi khi deploy.`,
      category:  'DEVOPS'        as const,
      badges:    ['HOT', 'NEW']  as const,
      audience:  'PUBLIC'        as const,
      status:    'PUBLISHED'     as const,
      readTime:  8,
      tags:      ['CI/CD', 'Docker'],
    },
    {
      title:     'System Design: Thiết kế hệ thống URL Shortener',
      slug:      'system-design-url-shortener',
      thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop',
      cover:     'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1400&auto=format&fit=crop',
      summary:   'Phân tích và thiết kế hệ thống rút gọn URL có thể xử lý hàng triệu request mỗi ngày.',
      content:   `## Yêu cầu hệ thống\n\n**Functional Requirements:**\n- Tạo short URL từ long URL\n- Redirect từ short URL về long URL\n- Thống kê lượt click\n\n**Non-functional Requirements:**\n- 100M URL/ngày\n- Độ trễ < 100ms\n- Uptime 99.9%\n\n## Ước tính capacity\n\n- Write: 100M/day = ~1200 RPS\n- Read: 10:1 ratio = 12000 RPS\n- Storage: 100M * 500 bytes * 365 days * 5 years = ~90TB\n\n## High-level Design\n\n\`\`\`\nClient → Load Balancer → API Servers → Cache (Redis) → Database\n\`\`\`\n\n## Database Schema\n\n\`\`\`sql\nCREATE TABLE urls (\n  id BIGINT PRIMARY KEY,\n  short_code VARCHAR(8) UNIQUE,\n  long_url TEXT,\n  created_at TIMESTAMP\n);\n\`\`\`\n\n## Kết luận\n\nURL Shortener là bài toán kinh điển trong System Design interviews.`,
      category:  'SYSTEM_DESIGN'           as const,
      badges:    ['TRENDING', 'FEATURED']  as const,
      audience:  'MEMBERS'                 as const,
      status:    'PUBLISHED'               as const,
      readTime:  12,
      tags:      ['System Design', 'Redis', 'PostgreSQL'],
      seriesId:  systemDesignSeries.id,
      seriesOrder: 1,
    },
    {
      title:     'Làm chủ TypeScript: Advanced Types cho Developer',
      slug:      'typescript-advanced-types',
      thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=600&auto=format&fit=crop',
      cover:     'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1400&auto=format&fit=crop',
      summary:   'Khám phá các kỹ thuật TypeScript nâng cao: Conditional Types, Mapped Types, Template Literal Types.',
      content:   `## Tại sao cần Advanced Types?\n\nKhi project lớn dần, TypeScript cơ bản không đủ để đảm bảo type safety. Advanced Types giúp bạn viết code linh hoạt hơn.\n\n## Conditional Types\n\n\`\`\`typescript\ntype IsArray<T> = T extends any[] ? true : false;\ntype A = IsArray<string[]>; // true\ntype B = IsArray<string>;   // false\n\`\`\`\n\n## Mapped Types\n\n\`\`\`typescript\ntype Readonly<T> = {\n  readonly [K in keyof T]: T[K];\n};\n\`\`\`\n\n## Template Literal Types\n\n\`\`\`typescript\ntype EventName = \`on\${Capitalize<string>}\`;\n// onCLick, onChange, onSubmit...\n\`\`\`\n\n## Infer keyword\n\n\`\`\`typescript\ntype ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;\n\`\`\`\n\n## Kết luận\n\nMastering TypeScript advanced types giúp code của bạn robust và maintainable hơn.`,
      category:  'FRONTEND'  as const,
      badges:    ['NEW']      as const,
      audience:  'MEMBERS'   as const,
      status:    'PUBLISHED' as const,
      readTime:  10,
      tags:      ['TypeScript', 'React'],
    },
    {
      title:     'Microservices vs Monolith: Khi nào nên chọn gì?',
      slug:      'microservices-vs-monolith',
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop',
      cover:     'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1400&auto=format&fit=crop',
      summary:   'So sánh hai kiến trúc phổ biến và hướng dẫn ra quyết định phù hợp với từng giai đoạn phát triển.',
      content:   `## Monolith Architecture\n\nMọi thứ trong một codebase duy nhất. Đơn giản khi bắt đầu, nhưng khó scale khi lớn dần.\n\n**Ưu điểm:**\n- Đơn giản để phát triển\n- Dễ debug và test\n- Deployment đơn giản\n\n**Nhược điểm:**\n- Khó scale từng phần\n- Rủi ro khi deploy\n- Tech stack bị lock-in\n\n## Microservices Architecture\n\nTách thành các service nhỏ, độc lập, giao tiếp qua API hoặc message queue.\n\n**Ưu điểm:**\n- Scale độc lập từng service\n- Deploy nhanh và an toàn\n- Tech stack linh hoạt\n\n**Nhược điểm:**\n- Phức tạp về infrastructure\n- Distributed system challenges\n- Cần DevOps mature\n\n## Khi nào chọn Microservices?\n\nChỉ nên chuyển sang Microservices khi team đủ lớn (>10 engineers) và đã cảm thấy pain với Monolith.\n\n## Kết luận\n\nBắt đầu với Monolith, migrate sang Microservices khi cần thiết.`,
      category:  'SYSTEM_DESIGN'   as const,
      badges:    ['FEATURED']       as const,
      audience:  'PUBLIC'           as const,
      status:    'PUBLISHED'        as const,
      readTime:  15,
      tags:      ['System Design', 'Microservices'],
      seriesId:  systemDesignSeries.id,
      seriesOrder: 2,
    },
    {
      title:     'Xây dựng RAG System với LLM: Hướng dẫn thực tế',
      slug:      'rag-system-llm-practical',
      thumbnail: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&auto=format&fit=crop',
      cover:     'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1400&auto=format&fit=crop',
      summary:   'Tìm hiểu cách xây dựng Retrieval-Augmented Generation system để tăng độ chính xác của LLM.',
      content:   `## RAG là gì?\n\nRAG (Retrieval-Augmented Generation) kết hợp retrieval từ knowledge base với generation của LLM để tạo ra câu trả lời chính xác hơn.\n\n## Kiến trúc RAG\n\n\`\`\`\nQuestion → Embedding → Vector Search → Context + Question → LLM → Answer\n\`\`\`\n\n## Các bước xây dựng\n\n1. **Indexing**: Chunk documents, tạo embeddings, lưu vào vector store\n2. **Retrieval**: Embed query, tìm top-k similar chunks\n3. **Generation**: Kết hợp context + query, gửi lên LLM\n\n## Code example với LangChain\n\n\`\`\`python\nfrom langchain.chains import RetrievalQA\n\nqa = RetrievalQA.from_chain_type(\n  llm=ChatOpenAI(),\n  retriever=vectorstore.as_retriever()\n)\nresult = qa.run("What is RAG?")\n\`\`\`\n\n## Kết luận\n\nRAG là pattern quan trọng khi muốn LLM trả lời dựa trên dữ liệu riêng của bạn.`,
      category:  'AI_ML'               as const,
      badges:    ['HOT', 'TRENDING']   as const,
      audience:  'PREMIUM'             as const,
      status:    'PUBLISHED'           as const,
      readTime:  20,
      tags:      ['Machine Learning', 'LLM'],
    },
    {
      title:     'Docker & Kubernetes: Deploy ứng dụng Next.js lên production',
      slug:      'docker-kubernetes-nextjs-production',
      thumbnail: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=600&auto=format&fit=crop',
      cover:     'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=1400&auto=format&fit=crop',
      summary:   'Hướng dẫn từng bước containerize Next.js app và deploy lên Kubernetes cluster.',
      content:   `## Dockerfile cho Next.js\n\n\`\`\`dockerfile\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM node:20-alpine AS runner\nWORKDIR /app\nCOPY --from=builder /app/.next ./.next\nCOPY --from=builder /app/node_modules ./node_modules\nEXPOSE 3000\nCMD ["npm", "start"]\n\`\`\`\n\n## Kubernetes Deployment\n\n\`\`\`yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: nextjs-app\nspec:\n  replicas: 3\n  template:\n    spec:\n      containers:\n      - name: nextjs\n        image: myapp:latest\n        ports:\n        - containerPort: 3000\n\`\`\`\n\n## Kết luận\n\nContainerization giúp deployment nhất quán và dễ scale.`,
      category:  'DEVOPS'           as const,
      badges:    ['NEW', 'HOT']     as const,
      audience:  'MEMBERS'          as const,
      status:    'PUBLISHED'        as const,
      readTime:  18,
      tags:      ['Docker', 'Kubernetes', 'Next.js'],
    },
    {
      title:     'Smart Contract với Solidity: Viết DeFi Protocol đơn giản',
      slug:      'smart-contract-solidity-defi',
      thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&auto=format&fit=crop',
      cover:     'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1400&auto=format&fit=crop',
      summary:   'Tìm hiểu cách viết smart contract bằng Solidity và triển khai DeFi lending protocol.',
      content:   `## Solidity là gì?\n\nSolidity là ngôn ngữ lập trình smart contract chạy trên Ethereum Virtual Machine (EVM).\n\n## Smart Contract đơn giản\n\n\`\`\`solidity\n// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract SimpleStorage {\n  uint256 private value;\n  \n  function setValue(uint256 _value) public {\n    value = _value;\n  }\n  \n  function getValue() public view returns (uint256) {\n    return value;\n  }\n}\n\`\`\`\n\n## DeFi Lending\n\nProtocol cho phép user deposit collateral và borrow tokens với lãi suất.\n\n## Kết luận\n\nSolidity và DeFi mở ra nhiều cơ hội cho developer Web3.`,
      category:  'BLOCKCHAIN'      as const,
      badges:    ['TRENDING']       as const,
      audience:  'MEMBERS'          as const,
      status:    'PUBLISHED'        as const,
      readTime:  14,
      tags:      ['Blockchain', 'Web3'],
    },
    {
      title:     'PostgreSQL Performance Tuning: Tối ưu query cho hệ thống lớn',
      slug:      'postgresql-performance-tuning',
      thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop',
      cover:     'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1400&auto=format&fit=crop',
      summary:   'Các kỹ thuật tối ưu PostgreSQL từ index strategy đến query planning và connection pooling.',
      content:   `## Tại sao query chậm?\n\nQuery chậm thường do thiếu index, bad query plan, hoặc N+1 problem.\n\n## EXPLAIN ANALYZE\n\n\`\`\`sql\nEXPLAIN ANALYZE\nSELECT * FROM articles\nWHERE category = 'DEVOPS'\nORDER BY published_at DESC;\n\`\`\`\n\n## Index Strategy\n\n\`\`\`sql\n-- Composite index\nCREATE INDEX idx_articles_category_published\nON articles(category, published_at DESC);\n\n-- Partial index\nCREATE INDEX idx_articles_published\nON articles(published_at)\nWHERE status = 'PUBLISHED';\n\`\`\`\n\n## Connection Pooling với PgBouncer\n\nGiảm overhead tạo connection bằng cách pool connections.\n\n## Kết luận\n\nPerformance tuning là kỹ năng quan trọng cho backend engineer.`,
      category:  'BACKEND'               as const,
      badges:    ['FEATURED', 'HOT']     as const,
      audience:  'PREMIUM'               as const,
      status:    'PUBLISHED'             as const,
      readTime:  16,
      tags:      ['PostgreSQL', 'Performance'],
    },
    {
      title:     'Redis Deep Dive: Caching, Pub/Sub và Stream',
      slug:      'redis-deep-dive-caching-pubsub-stream',
      thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&sat=-50',
      cover:     'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1400&auto=format&fit=crop&sat=-50',
      summary:   'Khám phá sâu về Redis — từ caching chiến lược đến Pub/Sub messaging và Redis Streams cho real-time data.',
      content:   `## Redis là gì?\n\nRedis (Remote Dictionary Server) là in-memory data store cực nhanh, thường dùng làm cache, message broker và session store.\n\n## Caching Strategies\n\n### Cache-Aside\n\`\`\`python\ndef get_user(user_id):\n    cached = redis.get(f"user:{user_id}")\n    if cached:\n        return json.loads(cached)\n    user = db.query(User).get(user_id)\n    redis.setex(f"user:{user_id}", 3600, json.dumps(user))\n    return user\n\`\`\`\n\n### Write-Through\nGhi vào cache và DB cùng lúc, đảm bảo consistency.\n\n## Pub/Sub\n\n\`\`\`python\n# Publisher\nredis.publish('notifications', json.dumps({'type': 'new_message', 'userId': 123}))\n\n# Subscriber\npubsub = redis.pubsub()\npubsub.subscribe('notifications')\nfor message in pubsub.listen():\n    handle(message)\n\`\`\`\n\n## Redis Streams\n\nStreams cho phép lưu trữ và xử lý event log với consumer groups, tương tự Kafka nhưng đơn giản hơn.\n\n## Kết luận\n\nRedis là công cụ đa năng không thể thiếu trong stack của mọi backend engineer.`,
      category:  'BACKEND'   as const,
      badges:    ['HOT']      as const,
      audience:  'MEMBERS'   as const,
      status:    'PUBLISHED' as const,
      readTime:  14,
      tags:      ['Redis', 'Performance'],
    },
    {
      title:     'Next.js App Router: Server Components và Data Fetching',
      slug:      'nextjs-app-router-server-components',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop',
      cover:     'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1400&auto=format&fit=crop',
      summary:   'Hiểu sâu về React Server Components trong Next.js App Router — khi nào dùng, lợi ích và những cạm bẫy cần tránh.',
      content:   `## Server Components vs Client Components\n\nNext.js App Router mặc định là Server Component. Chỉ thêm \`"use client"\` khi cần interactivity.\n\n## Khi nào dùng Server Component?\n\n- Fetch data từ DB/API\n- Đọc environment variables\n- Không cần state, effects, browser APIs\n\n## Data Fetching\n\n\`\`\`tsx\n// Server Component - fetch trực tiếp\nasync function ArticlePage({ params }) {\n  const article = await db.article.findUnique({\n    where: { slug: params.slug }\n  });\n  return <ArticleContent article={article} />;\n}\n\`\`\`\n\n## Caching và Revalidation\n\n\`\`\`tsx\n// Revalidate mỗi 60 giây\nexport const revalidate = 60;\n\n// Revalidate theo tag\nimport { revalidateTag } from 'next/cache';\nrevalidateTag('articles');\n\`\`\`\n\n## Streaming với Suspense\n\n\`\`\`tsx\n<Suspense fallback={<ArticleSkeleton />}>\n  <ArticleContent />\n</Suspense>\n\`\`\`\n\n## Kết luận\n\nApp Router thay đổi cách chúng ta nghĩ về data fetching — ưu tiên server-side để giảm bundle size và tăng performance.`,
      category:  'FRONTEND'             as const,
      badges:    ['NEW', 'TRENDING']    as const,
      audience:  'PUBLIC'               as const,
      status:    'PUBLISHED'            as const,
      readTime:  11,
      tags:      ['Next.js', 'React', 'TypeScript'],
    },
    {
      title:     'Thiết kế API RESTful chuẩn — Best Practices 2025',
      slug:      'restful-api-best-practices-2025',
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop',
      cover:     'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400&auto=format&fit=crop',
      summary:   'Tổng hợp các best practices thiết kế RESTful API: versioning, error handling, pagination, authentication và documentation.',
      content:   `## Naming Conventions\n\nDùng danh từ số nhiều, lowercase, dấu gạch ngang:\n\`\`\`\nGET  /api/v1/articles\nGET  /api/v1/articles/:id\nPOST /api/v1/articles\nPUT  /api/v1/articles/:id\nDELETE /api/v1/articles/:id\n\`\`\`\n\n## HTTP Status Codes\n\n| Code | Meaning |\n|------|--------|\n| 200 | OK |\n| 201 | Created |\n| 400 | Bad Request |\n| 401 | Unauthorized |\n| 403 | Forbidden |\n| 404 | Not Found |\n| 500 | Internal Server Error |\n\n## Error Response Format\n\n\`\`\`json\n{\n  "error": {\n    "code": "VALIDATION_ERROR",\n    "message": "Email is invalid",\n    "details": [{ "field": "email", "message": "Must be a valid email" }]\n  }\n}\n\`\`\`\n\n## Pagination\n\n\`\`\`json\n{\n  "data": [...],\n  "pagination": {\n    "page": 1,\n    "limit": 20,\n    "total": 150,\n    "totalPages": 8\n  }\n}\n\`\`\`\n\n## Versioning\n\nDùng URL versioning: \`/api/v1/\`, \`/api/v2/\` để backward compatibility.\n\n## Kết luận\n\nAPI tốt là API mà developer không cần đọc docs vẫn hiểu được.`,
      category:  'BACKEND'       as const,
      badges:    ['FEATURED']     as const,
      audience:  'PUBLIC'         as const,
      status:    'PUBLISHED'      as const,
      readTime:  9,
      tags:      ['TypeScript', 'Performance'],
    },
    {
      title:     'Tailwind CSS v4: Những thay đổi lớn bạn cần biết',
      slug:      'tailwind-css-v4-changes',
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop',
      cover:     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&auto=format&fit=crop',
      summary:   'Tailwind CSS v4 mang đến CSS-first configuration, Lightning CSS engine và nhiều cải tiến hiệu năng đáng kể.',
      content:   `## CSS-First Configuration\n\nTailwind v4 bỏ \`tailwind.config.js\`, thay bằng cấu hình trực tiếp trong CSS:\n\n\`\`\`css\n@import "tailwindcss";\n\n@theme {\n  --color-primary: #3b82f6;\n  --font-display: "Inter", sans-serif;\n}\n\`\`\`\n\n## Lightning CSS Engine\n\nTailwind v4 dùng Lightning CSS thay vì PostCSS, build nhanh hơn ~10x.\n\n## Custom Variants\n\n\`\`\`css\n@custom-variant dark (&:is(.dark *));\n@custom-variant hover (&:hover);\n\`\`\`\n\n## Utility Classes mới\n\n- \`text-balance\`, \`text-pretty\`\n- \`inset-shadow-*\`\n- \`field-sizing-content\`\n- Dynamic values: \`grid-cols-[repeat(auto-fill,minmax(200px,1fr))]\`\n\n## Migration từ v3\n\nDùng upgrade tool: \`npx @tailwindcss/upgrade\`\n\n## Kết luận\n\nTailwind v4 là bước tiến lớn về DX và performance.`,
      category:  'FRONTEND'          as const,
      badges:    ['NEW', 'HOT']       as const,
      audience:  'PUBLIC'             as const,
      status:    'PUBLISHED'          as const,
      readTime:  7,
      tags:      ['React', 'TypeScript'],
    },
    {
      title:     'Event-Driven Architecture với Apache Kafka',
      slug:      'event-driven-architecture-kafka',
      thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop',
      cover:     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&auto=format&fit=crop',
      summary:   'Xây dựng hệ thống microservices loosely coupled với Kafka — producer, consumer, partitions và exactly-once semantics.',
      content:   `## Tại sao Event-Driven?\n\nThay vì gọi API trực tiếp giữa services (tight coupling), EDA dùng events để giao tiếp — loosely coupled, dễ scale.\n\n## Kafka Core Concepts\n\n- **Topic**: Kênh chứa events\n- **Partition**: Phân mảnh topic để scale\n- **Consumer Group**: Nhóm consumer xử lý song song\n- **Offset**: Vị trí đọc trong partition\n\n## Producer\n\n\`\`\`python\nfrom kafka import KafkaProducer\nimport json\n\nproducer = KafkaProducer(\n    bootstrap_servers=['localhost:9092'],\n    value_serializer=lambda v: json.dumps(v).encode()\n)\n\nproducer.send('user-events', {\n    'type': 'USER_REGISTERED',\n    'userId': '123',\n    'email': 'user@example.com'\n})\n\`\`\`\n\n## Consumer\n\n\`\`\`python\nfrom kafka import KafkaConsumer\n\nconsumer = KafkaConsumer(\n    'user-events',\n    group_id='email-service',\n    bootstrap_servers=['localhost:9092']\n)\n\nfor message in consumer:\n    event = json.loads(message.value)\n    if event['type'] == 'USER_REGISTERED':\n        send_welcome_email(event['email'])\n\`\`\`\n\n## Exactly-Once Semantics\n\nKafka hỗ trợ idempotent producer và transactional API để đảm bảo mỗi event chỉ được xử lý đúng một lần.\n\n## Kết luận\n\nKafka là backbone của nhiều hệ thống phân tán lớn như LinkedIn, Uber, Netflix.`,
      category:  'SYSTEM_DESIGN'   as const,
      badges:    ['TRENDING']       as const,
      audience:  'PREMIUM'          as const,
      status:    'PUBLISHED'        as const,
      readTime:  18,
      tags:      ['Microservices', 'System Design'],
      seriesId:  systemDesignSeries.id,
      seriesOrder: 3,
    },
    {
      title:     'Prompt Engineering nâng cao: Chain-of-Thought và Few-Shot',
      slug:      'prompt-engineering-chain-of-thought',
      thumbnail: 'https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=600&auto=format&fit=crop',
      cover:     'https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=1400&auto=format&fit=crop',
      summary:   'Kỹ thuật viết prompt nâng cao để tối ưu output từ LLM — Chain-of-Thought, Few-Shot, Self-Consistency và Tree-of-Thought.',
      content:   `## Zero-Shot vs Few-Shot\n\n**Zero-Shot**: Đặt câu hỏi trực tiếp không có ví dụ.\n\n**Few-Shot**: Cung cấp 2-5 ví dụ trước câu hỏi để guide model.\n\n\`\`\`\nPhân loại cảm xúc:\n"Tôi rất vui" → Tích cực\n"Tệ quá" → Tiêu cực\n"Bình thường" → Trung lập\n"Hôm nay tôi mệt" → ?\n\`\`\`\n\n## Chain-of-Thought (CoT)\n\nYêu cầu model giải thích từng bước trước khi trả lời:\n\n\`\`\`\nHãy suy nghĩ từng bước:\n1. Phân tích vấn đề\n2. Liệt kê các phương án\n3. Đánh giá từng phương án\n4. Đưa ra kết luận\n\`\`\`\n\n## Self-Consistency\n\nGenerate nhiều CoT paths, lấy kết quả đa số (majority voting).\n\n## Tree-of-Thought\n\nMở rộng CoT thành cây quyết định, explore nhiều nhánh tư duy song song.\n\n## ReAct Pattern\n\nKết hợp Reasoning + Acting — model vừa suy nghĩ vừa gọi tools.\n\n## Kết luận\n\nPrompt engineering là kỹ năng thiết yếu khi làm việc với LLM trong production.`,
      category:  'AI_ML'                as const,
      badges:    ['HOT', 'FEATURED']    as const,
      audience:  'MEMBERS'              as const,
      status:    'PUBLISHED'            as const,
      readTime:  12,
      tags:      ['Machine Learning', 'LLM'],
    },
    {
      title:     'gRPC vs REST: Khi nào nên chọn gì?',
      slug:      'grpc-vs-rest-comparison',
      thumbnail: 'https://images.unsplash.com/photo-1623282033815-40b05d96c903?w=600&auto=format&fit=crop',
      cover:     'https://images.unsplash.com/photo-1623282033815-40b05d96c903?w=1400&auto=format&fit=crop',
      summary:   'So sánh chi tiết gRPC và REST — hiệu năng, use cases, pros/cons và khi nào nên dùng cái nào trong microservices.',
      content:   `## REST\n\nHTTP/1.1, JSON, stateless, dễ debug, widely supported.\n\n**Dùng khi:**\n- Public API\n- Browser clients\n- Simple CRUD operations\n\n## gRPC\n\nHTTP/2, Protocol Buffers, strongly typed, bidirectional streaming.\n\n**Dùng khi:**\n- Internal microservices\n- High-performance requirements\n- Streaming data\n- Polyglot environments\n\n## Performance so sánh\n\n| Metric | REST/JSON | gRPC/Protobuf |\n|--------|-----------|---------------|\n| Payload size | 100% | ~30% |\n| Serialization | Chậm | Nhanh 5-10x |\n| Latency | Cao hơn | Thấp hơn |\n\n## Proto Definition\n\n\`\`\`protobuf\nsyntax = "proto3";\n\nservice ArticleService {\n  rpc GetArticle (GetArticleRequest) returns (Article);\n  rpc ListArticles (ListRequest) returns (stream Article);\n}\n\nmessage Article {\n  string id = 1;\n  string title = 2;\n  string content = 3;\n}\n\`\`\`\n\n## Kết luận\n\nDùng REST cho public API, gRPC cho internal service-to-service communication cần hiệu năng cao.`,
      category:  'BACKEND'   as const,
      badges:    ['NEW']      as const,
      audience:  'MEMBERS'   as const,
      status:    'PUBLISHED' as const,
      readTime:  10,
      tags:      ['Microservices', 'Performance'],
    },
    {
      title:     'Zero-Knowledge Proof: Toán học đằng sau Web3 Privacy',
      slug:      'zero-knowledge-proof-web3-privacy',
      thumbnail: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=600&auto=format&fit=crop',
      cover:     'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=1400&auto=format&fit=crop',
      summary:   'Hiểu ZK-Proof từ nền tảng toán học đến ứng dụng thực tế trong blockchain — zk-SNARKs, zk-STARKs và ZK-Rollups.',
      content:   `## ZK-Proof là gì?\n\nZero-Knowledge Proof là cách chứng minh bạn biết một điều gì đó mà không tiết lộ thông tin đó.\n\n**Ví dụ**: Chứng minh bạn biết password mà không cần gửi password.\n\n## Ba tính chất\n\n1. **Completeness**: Prover trung thực luôn thuyết phục được Verifier\n2. **Soundness**: Prover gian lận không thể thuyết phục Verifier\n3. **Zero-Knowledge**: Verifier không học được gì ngoài tính đúng đắn\n\n## zk-SNARKs\n\n**S**uccinct **N**on-interactive **AR**guments of **K**nowledge\n\n- Proof size nhỏ, verify nhanh\n- Cần trusted setup\n- Dùng trong Zcash, Polygon\n\n## zk-STARKs\n\n- Không cần trusted setup\n- Quantum-resistant\n- Proof size lớn hơn\n- Dùng trong StarkNet\n\n## ZK-Rollups\n\nLayer 2 scaling solution: batch nhiều transactions, generate ZK proof, submit lên L1.\n\n## Kết luận\n\nZK-Proof là breakthrough công nghệ quan trọng nhất của blockchain trong thập kỷ này.`,
      category:  'BLOCKCHAIN'              as const,
      badges:    ['FEATURED', 'TRENDING']  as const,
      audience:  'PREMIUM'                 as const,
      status:    'PUBLISHED'               as const,
      readTime:  20,
      tags:      ['Blockchain', 'Web3'],
    },
    {
      title:     'Monitoring & Observability: Prometheus, Grafana và OpenTelemetry',
      slug:      'monitoring-observability-prometheus-grafana',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop',
      cover:     'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&auto=format&fit=crop',
      summary:   'Xây dựng hệ thống observability hoàn chỉnh với ba trụ cột: Metrics (Prometheus), Logs (Loki) và Traces (Jaeger).',
      content:   `## Ba trụ cột của Observability\n\n1. **Metrics**: Số liệu theo thời gian (CPU, memory, request rate)\n2. **Logs**: Sự kiện có cấu trúc từ application\n3. **Traces**: Luồng request qua các services\n\n## Prometheus\n\n\`\`\`yaml\n# prometheus.yml\nscrape_configs:\n  - job_name: 'api'\n    static_configs:\n      - targets: ['api:3000']\n\`\`\`\n\n## Custom Metrics trong Node.js\n\n\`\`\`typescript\nimport { Counter, Histogram } from 'prom-client';\n\nconst httpRequests = new Counter({\n  name: 'http_requests_total',\n  labelNames: ['method', 'route', 'status']\n});\n\nconst responseTime = new Histogram({\n  name: 'http_response_time_seconds',\n  buckets: [0.1, 0.5, 1, 2, 5]\n});\n\`\`\`\n\n## Grafana Dashboard\n\nVisualize metrics với PromQL queries, alerting rules và notification channels.\n\n## OpenTelemetry\n\nStandard cho distributed tracing — tự động instrument frameworks phổ biến.\n\n## Kết luận\n\nObservability không phải luxury, đó là requirement cho production systems.`,
      category:  'DEVOPS'    as const,
      badges:    ['NEW']      as const,
      audience:  'MEMBERS'   as const,
      status:    'PUBLISHED' as const,
      readTime:  13,
      tags:      ['Docker', 'Kubernetes', 'Performance'],
    },
    {
      title:     'Database Sharding: Chia nhỏ dữ liệu để scale',
      slug:      'database-sharding-guide',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop',
      cover:     'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&auto=format&fit=crop',
      summary:   'Tìm hiểu các chiến lược database sharding — horizontal partitioning, consistent hashing và cross-shard queries.',
      content:   `## Khi nào cần Sharding?\n\nKhi một database không đủ xử lý:\n- Hàng tỷ records\n- Hàng nghìn write/second\n- Dataset không fit vào một machine\n\n## Sharding Strategies\n\n### Range-Based\nPhân vùng theo range của shard key:\n\`\`\`\nShard 1: user_id 1 - 1,000,000\nShard 2: user_id 1,000,001 - 2,000,000\n\`\`\`\n\n### Hash-Based\n\`\`\`python\nshard_id = hash(user_id) % num_shards\n\`\`\`\n\n### Consistent Hashing\nThêm/bớt shard mà không cần rehash toàn bộ data.\n\n## Cross-Shard Queries\n\nVấn đề lớn nhất của sharding — queries cần join data từ nhiều shards. Giải pháp:\n- Scatter-gather: query tất cả shards, merge kết quả\n- Denormalization: duplicate data để tránh cross-shard join\n\n## Vitess\n\nKhông tự implement sharding — dùng Vitess (MySQL) hoặc Citus (PostgreSQL).\n\n## Kết luận\n\nSharding là last resort. Trước tiên hãy thử read replicas, caching và query optimization.`,
      category:  'SYSTEM_DESIGN'               as const,
      badges:    ['TRENDING', 'FEATURED']       as const,
      audience:  'PREMIUM'                      as const,
      status:    'PUBLISHED'                    as const,
      readTime:  17,
      tags:      ['System Design', 'PostgreSQL'],
      seriesId:  systemDesignSeries.id,
      seriesOrder: 4,
    },
  ];

  const createdArticles: { id: string }[] = [];
  for (const data of articles) {
    const { tags: tagNames, badges, seriesId, seriesOrder, ...rest } = data as typeof data & { seriesId?: string; seriesOrder?: number };

    const article = await db.article.upsert({
      where:  { slug: rest.slug },
      update: { thumbnail: rest.thumbnail, cover: rest.cover, seriesId: seriesId ?? null, seriesOrder: seriesOrder ?? null },
      create: {
        ...rest,
        badges:      [...badges],
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        authorId:    admin.id,
        viewCount:   Math.floor(Math.random() * 5000) + 100,
        seriesId:    seriesId ?? null,
        seriesOrder: seriesOrder ?? null,
      },
    });
    createdArticles.push(article);

    for (const tagName of tagNames) {
      const tagId = tags[tagName];
      if (!tagId) continue;
      await db.articleTag.upsert({
        where:  { articleId_tagId: { articleId: article.id, tagId } },
        update: {},
        create: { articleId: article.id, tagId },
      });
    }
  }

  // ── Likes ──────────────────────────────────────────────────────
  for (const article of createdArticles) {
    const likers = users.filter(() => Math.random() > 0.4);
    for (const user of likers) {
      await db.like.upsert({
        where:  { userId_articleId: { userId: user.id, articleId: article.id } },
        update: {},
        create: { userId: user.id, articleId: article.id },
      });
    }
  }

  // ── Bookmarks ──────────────────────────────────────────────────
  for (const article of createdArticles) {
    const bookmarkers = users.filter(() => Math.random() > 0.6);
    for (const user of bookmarkers) {
      await db.bookmark.upsert({
        where:  { userId_articleId: { userId: user.id, articleId: article.id } },
        update: {},
        create: { userId: user.id, articleId: article.id },
      });
    }
  }

  // ── Read History ───────────────────────────────────────────────
  for (const article of createdArticles) {
    const readers = users.filter(() => Math.random() > 0.3);
    for (const user of readers) {
      await db.readHistory.upsert({
        where:  { userId_articleId: { userId: user.id, articleId: article.id } },
        update: {},
        create: {
          userId:    user.id,
          articleId: article.id,
          progress:  Math.random() > 0.5 ? 1.0 : parseFloat((Math.random() * 0.9 + 0.1).toFixed(2)),
        },
      });
    }
  }

  // ── Comments ───────────────────────────────────────────────────
  const commentTexts = [
    'Bài viết rất hay và chi tiết! Cảm ơn tác giả đã chia sẻ.',
    'Mình đã apply theo hướng dẫn này và thấy hiệu quả rõ rệt.',
    'Có thể giải thích thêm về phần này không? Mình chưa hiểu lắm.',
    'Phần code example rất dễ hiểu, cảm ơn!',
    'Đây là một trong những bài viết hay nhất mình đọc về chủ đề này.',
    'Mình đang làm dự án về chủ đề tương tự, bài này giúp ích nhiều lắm.',
    'Rất mong có thêm bài viết về các chủ đề liên quan.',
    'Tuyệt vời! Đã bookmark lại để đọc kỹ hơn.',
    'Ngoài ra còn có một số cách khác hay hơn, nhưng cách này đơn giản và dễ implement.',
    'Bài viết giải thích rất dễ hiểu cho người mới bắt đầu.',
  ];

  for (const article of createdArticles) {
    const numComments = Math.floor(Math.random() * 4) + 1;
    const commenters  = [...users].sort(() => Math.random() - 0.5).slice(0, numComments);

    const topLevelComments: { id: string }[] = [];
    for (const user of commenters) {
      const c = await db.comment.create({
        data: {
          content:   commentTexts[Math.floor(Math.random() * commentTexts.length)],
          articleId: article.id,
          authorId:  user.id,
          status:    'VISIBLE',
        },
      });
      topLevelComments.push(c);
    }

    // Replies cho comment đầu tiên
    if (topLevelComments.length > 0 && Math.random() > 0.5) {
      const replier = users[Math.floor(Math.random() * users.length)];
      await db.comment.create({
        data: {
          content:   'Cảm ơn bạn! Mình sẽ cố gắng giải thích rõ hơn ở bài tiếp theo.',
          articleId: article.id,
          authorId:  admin.id,
          parentId:  topLevelComments[0].id,
          status:    'VISIBLE',
        },
      });
      if (Math.random() > 0.5) {
        await db.comment.create({
          data: {
            content:   'Cảm ơn admin đã giải thích thêm!',
            articleId: article.id,
            authorId:  replier.id,
            parentId:  topLevelComments[0].id,
            status:    'VISIBLE',
          },
        });
      }
    }
  }

  // ── Notifications ──────────────────────────────────────────────
  for (const user of users.slice(1)) {
    await db.notification.create({
      data: {
        type:    'SYSTEM',
        title:   'Chào mừng đến với KS40 Academy!',
        message: 'Khám phá các bài viết kỹ thuật chất lượng cao và nâng tầm kỹ năng của bạn.',
        link:    '/',
        userId:  user.id,
        read:    false,
      },
    });

    if (Math.random() > 0.5) {
      await db.notification.create({
        data: {
          type:    'NEW_ARTICLE',
          title:   'Bài viết mới vừa được đăng',
          message: 'Có bài viết mới trong chủ đề bạn quan tâm.',
          link:    '/article/' + createdArticles[Math.floor(Math.random() * createdArticles.length)].id,
          userId:  user.id,
          read:    Math.random() > 0.5,
        },
      });
    }
  }

  console.log('✅ Seed xong:');
  console.log('   Tài khoản:');
  console.log('     admin@ks40.com    / admin123   (ADMIN)');
  console.log('     member@ks40.com   / member123  (MEMBER)');
  console.log('     premium@ks40.com  / premium123 (PREMIUM)');
  console.log('     huy@ks40.com      / member123  (MEMBER)');
  console.log('     trang@ks40.com    / member123  (MEMBER)');
  console.log('     dat@ks40.com      / premium123 (PREMIUM)');
  console.log('     nam@ks40.com      / member123  (MEMBER)');
  console.log('     thu@ks40.com      / member123  (MEMBER)');
  console.log(`   ${articles.length} bài viết, 1 series, ${tagNames.length} tags`);
  console.log('   Likes, bookmarks, read history, comments, follows, notifications đã được tạo');
}

main().finally(() => db.$disconnect());
