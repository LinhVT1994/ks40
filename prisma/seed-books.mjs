import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:password@localhost:5466/ks40?schema=public' });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

// Slugify helper
function slugify(text) {
  return text
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'heading';
}

async function main() {
  // Get admin user
  const admin = await db.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true, name: true } });
  if (!admin) { console.error('No admin user found'); process.exit(1); }
  console.log(`Using author: ${admin.name} (${admin.id})`);

  // ── Book 1: System Design ─────────────────────────────────────
  const book1 = await db.book.upsert({
    where: { slug: 'system-design-cho-developer' },
    update: {},
    create: {
      title: 'System Design cho Developer',
      slug: 'system-design-cho-developer',
      description: 'Hướng dẫn toàn diện về thiết kế hệ thống phân tán — từ các khái niệm cơ bản đến kiến trúc thực tế của các hệ thống triệu người dùng.',
      cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop',
      audience: 'MEMBERS',
      published: true,
      authorId: admin.id,
    },
  });
  console.log(`Book 1: ${book1.title}`);

  const chapters1 = [
    {
      title: 'Giới thiệu về System Design',
      order: 1, isFree: true,
      content: `# Giới thiệu về System Design

System Design là quá trình xác định **kiến trúc**, **các thành phần**, **modules**, **interfaces** và **dữ liệu** để thỏa mãn các yêu cầu cụ thể.

## Tại sao cần học System Design?

Khi ứng dụng của bạn phát triển từ vài trăm lên hàng triệu người dùng, bạn sẽ gặp phải những vấn đề mà lúc đầu không nghĩ tới:

- **Hiệu năng** giảm sút khi tải cao
- **Database** trở thành bottleneck
- **Single point of failure** gây downtime
- Chi phí infrastructure tăng mất kiểm soát

## Các khái niệm cốt lõi

### Scalability (Khả năng mở rộng)

\`\`\`
Vertical Scaling (Scale Up): Nâng cấp phần cứng hiện có
  → Thêm RAM, CPU mạnh hơn
  → Giới hạn bởi hardware ceiling

Horizontal Scaling (Scale Out): Thêm nhiều máy chủ
  → Phân tải qua nhiều instances
  → Không giới hạn về lý thuyết
\`\`\`

### Reliability (Độ tin cậy)

Hệ thống cần tiếp tục hoạt động đúng ngay cả khi có sự cố — phần cứng hỏng, phần mềm lỗi, hay lỗi con người.

### Availability (Tính sẵn sàng)

> **99.9% uptime** = ~8.7 giờ downtime/năm
> **99.99% uptime** = ~52 phút downtime/năm
> **99.999% uptime** = ~5 phút downtime/năm

## Bắt đầu từ đâu?

Trong các chương tiếp theo, chúng ta sẽ đi qua:

1. Load Balancing & Caching
2. Database sharding & replication
3. Message queues & event-driven architecture
4. Microservices vs Monolith
5. Case study: Thiết kế hệ thống như Twitter, YouTube
`,
    },
    {
      title: 'Load Balancing & Caching',
      order: 2, isFree: true,
      content: `# Load Balancing & Caching

Hai kỹ thuật nền tảng giúp hệ thống xử lý tải lớn và phản hồi nhanh.

## Load Balancing

Load Balancer phân phối traffic đến nhiều server, ngăn một server duy nhất bị quá tải.

### Các thuật toán phổ biến

\`\`\`
Round Robin     → Lần lượt từng server
Least Conn.     → Server ít kết nối nhất
IP Hash         → Cùng client → cùng server
Weighted        → Server mạnh nhận nhiều traffic hơn
\`\`\`

### Layer 4 vs Layer 7

| | L4 (Transport) | L7 (Application) |
|---|---|---|
| Dựa trên | IP + Port | HTTP header, URL, cookies |
| Tốc độ | Nhanh hơn | Chậm hơn một chút |
| Tính năng | Đơn giản | A/B testing, SSL termination |

## Caching

> "There are only two hard things in Computer Science: cache invalidation and naming things."

### Cache Hierarchy

\`\`\`
Client Cache (Browser)
    ↓
CDN Cache (Cloudflare, CloudFront)
    ↓
Load Balancer Cache
    ↓
Application Cache (Redis, Memcached)
    ↓
Database Cache (Query cache)
    ↓
Database
\`\`\`

### Cache Strategies

**Cache-Aside (Lazy Loading)**
\`\`\`python
def get_user(user_id):
    user = cache.get(f"user:{user_id}")
    if user is None:
        user = db.query("SELECT * FROM users WHERE id = ?", user_id)
        cache.set(f"user:{user_id}", user, ttl=3600)
    return user
\`\`\`

**Write-Through**: Ghi vào cache và DB đồng thời
**Write-Back**: Ghi vào cache trước, sync DB sau (nhanh hơn nhưng risk mất data)

### Cache Invalidation

Đây là bài toán khó nhất. Các chiến lược:
- **TTL (Time To Live)**: Tự động hết hạn sau X giây
- **Event-based**: Invalidate khi data thay đổi
- **Cache versioning**: Đổi key khi data thay đổi
`,
    },
    {
      title: 'Database Sharding & Replication',
      order: 3, isFree: false,
      content: `# Database Sharding & Replication

Khi một database server không đủ để xử lý tải, ta cần phân tán data ra nhiều node.

## Replication

Sao chép data từ một Primary node sang nhiều Replica node.

### Master-Slave (Primary-Replica)

\`\`\`
                    ┌─────────────┐
    Write ──────►  │   Primary   │
                    └──────┬──────┘
                           │ Replicate
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌─────────┐
 Read ─►│ Replica │  │ Replica │  │ Replica │
        └─────────┘  └─────────┘  └─────────┘
\`\`\`

**Ưu điểm:**
- Read scaling tốt
- Failover khi primary down

**Nhược điểm:**
- Replication lag (inconsistency tạm thời)
- Write vẫn là single point

## Sharding (Horizontal Partitioning)

Chia data ra nhiều database server dựa trên một **shard key**.

### Range-based Sharding

\`\`\`
User ID 1-1M     → Shard 1
User ID 1M-2M    → Shard 2
User ID 2M-3M    → Shard 3
\`\`\`

**Vấn đề**: Hotspot — nếu user mới đều vào Shard 3, load không đều.

### Hash-based Sharding

\`\`\`javascript
shard_id = hash(user_id) % num_shards
\`\`\`

**Phân phối đều hơn**, nhưng khó thêm/bớt shard (consistent hashing giải quyết điều này).

### Consistent Hashing

Dùng virtual nodes trên một ring để:
- Phân phối đều
- Khi thêm/xóa node, chỉ ảnh hưởng node lân cận

## Khi nào dùng gì?

| Tình huống | Giải pháp |
|---|---|
| Read nhiều, write ít | Replication |
| Data quá lớn cho 1 server | Sharding |
| Cần high availability | Cả hai |
`,
    },
    {
      title: 'Message Queues & Event-Driven Architecture',
      order: 4, isFree: false,
      content: `# Message Queues & Event-Driven Architecture

Decoupling các service bằng async messaging — nền tảng của microservices hiện đại.

## Tại sao cần Message Queue?

Trong kiến trúc synchronous:

\`\`\`
User → API → Email Service → SMS Service → Push Service → Response
         ↓ (3 giây chờ đợi)
\`\`\`

Với Message Queue:

\`\`\`
User → API → Queue → Response ngay lập tức (50ms)
              ↓
         Workers xử lý async:
         - Email Worker
         - SMS Worker
         - Push Worker
\`\`\`

## Kafka vs RabbitMQ vs SQS

| | Kafka | RabbitMQ | AWS SQS |
|---|---|---|---|
| Model | Log-based | Message broker | Managed queue |
| Throughput | Rất cao (triệu msg/s) | Cao | Cao |
| Message retention | Lâu dài | Cho đến khi consume | 14 ngày |
| Replay | ✓ | ✗ | ✗ |
| Use case | Event streaming | Task queue | Cloud-native |

## Event-Driven Architecture

### Event Sourcing

Thay vì lưu trạng thái hiện tại, lưu **chuỗi sự kiện** đã xảy ra:

\`\`\`
Events:
1. OrderCreated  { orderId: 123, items: [...] }
2. PaymentMade   { orderId: 123, amount: 500000 }
3. OrderShipped  { orderId: 123, trackingId: "ABC" }

Current State = Replay all events
\`\`\`

**Lợi ích:**
- Full audit trail
- Time travel debugging
- Dễ rebuild projections

### CQRS (Command Query Responsibility Segregation)

Tách riêng:
- **Command side**: Ghi data (xử lý business logic phức tạp)
- **Query side**: Đọc data (tối ưu cho read performance)

\`\`\`
Command → Write Model → Events → Read Model (denormalized)
                                      ↑
                              Query reads from here
\`\`\`
`,
    },
    {
      title: 'Case Study: Thiết kế URL Shortener',
      order: 5, isFree: false,
      content: `# Case Study: Thiết kế URL Shortener

Bài tập kinh điển trong system design interview — đơn giản nhưng bộc lộ nhiều vấn đề thực tế.

## Yêu cầu

**Functional:**
- Tạo short URL từ long URL
- Redirect từ short → long URL
- Custom alias (tuỳ chọn)
- Thống kê click

**Non-functional:**
- 100M URL/ngày được tạo
- 10:1 read/write ratio → 1B reads/ngày
- URL tồn tại 5 năm → 100M × 365 × 5 = 182B records

## Ước lượng capacity

\`\`\`
Write: 100M/day = ~1,160 writes/second
Read:  1B/day   = ~11,600 reads/second

Storage per URL: ~500 bytes
Total: 182B × 500 bytes = ~91 TB
\`\`\`

## Thiết kế API

\`\`\`
POST /api/shorten
Body: { longUrl: "https://...", customAlias?: "mylink", expiresAt?: "2025-01-01" }
Response: { shortUrl: "https://short.ly/abc123" }

GET /{shortCode}
Response: 301 Redirect → longUrl
\`\`\`

## Tạo Short Code

### Option 1: MD5 Hash

\`\`\`python
import hashlib
import base64

def generate_short_code(long_url):
    hash = hashlib.md5(long_url.encode()).digest()
    encoded = base64.urlsafe_b64encode(hash)[:6]
    return encoded.decode()
\`\`\`

Vấn đề: Collision khi scale lớn.

### Option 2: Base62 Counter

\`\`\`
ID: 1  → "000001"
ID: 2  → "000002"
...
ID: 3521614606207 → "zzzzzz"
\`\`\`

**62^6 = 56 tỷ combinations** — đủ dùng nhiều năm.

## Kiến trúc hệ thống

\`\`\`
                    ┌──────────────┐
User ──────────────►│ Load Balancer│
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ API      │ │ API      │ │ API      │
        │ Server   │ │ Server   │ │ Server   │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │             │             │
             └─────────────┼─────────────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
        ┌──────────┐             ┌──────────┐
        │  Redis   │             │ Postgres │
        │  Cache   │             │   DB     │
        └──────────┘             └──────────┘
\`\`\`

## Tối ưu Redirect (Hot Path)

\`\`\`
1. Request đến: GET /abc123
2. Check Redis cache → HIT → 301 Redirect (< 1ms)
3. Cache MISS → Query Postgres → Cache kết quả → Redirect
\`\`\`

Cache TTL: 24h cho URL được truy cập nhiều.

## Xử lý khi hết cache?

Dùng **Bloom Filter** để kiểm tra URL có tồn tại không trước khi query DB → tiết kiệm 90% DB queries cho invalid URLs.
`,
    },
  ];

  for (const ch of chapters1) {
    const slug = slugify(ch.title);
    await db.chapter.upsert({
      where: { bookId_slug: { bookId: book1.id, slug } },
      update: { title: ch.title, content: ch.content, order: ch.order, isFree: ch.isFree },
      create: { bookId: book1.id, title: ch.title, slug, content: ch.content, order: ch.order, isFree: ch.isFree },
    });
    console.log(`  Chapter ${ch.order}: ${ch.title}`);
  }

  // ── Book 2: Frontend Fundamentals ────────────────────────────────
  const book2 = await db.book.upsert({
    where: { slug: 'frontend-fundamentals' },
    update: {},
    create: {
      title: 'Frontend Fundamentals',
      slug: 'frontend-fundamentals',
      description: 'Nắm vững nền tảng HTML, CSS, JavaScript và React để xây dựng giao diện web chuyên nghiệp.',
      cover: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2670&auto=format&fit=crop',
      audience: 'PUBLIC',
      published: true,
      authorId: admin.id,
    },
  });
  console.log(`\nBook 2: ${book2.title}`);

  const chapters2 = [
    {
      title: 'HTML Semantic & Accessibility',
      order: 1, isFree: true,
      content: `# HTML Semantic & Accessibility

HTML không chỉ là markup — viết HTML đúng cách giúp SEO tốt hơn, screen reader hiểu được, và code dễ bảo trì.

## Semantic HTML

Dùng đúng tag có nghĩa thay vì \`<div>\` cho mọi thứ:

\`\`\`html
<!-- ❌ Non-semantic -->
<div class="header">
  <div class="nav">
    <div class="nav-item"><a href="/">Home</a></div>
  </div>
</div>
<div class="main">
  <div class="article">
    <div class="title">Tiêu đề bài viết</div>
    <div class="content">Nội dung...</div>
  </div>
</div>

<!-- ✅ Semantic -->
<header>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>
<main>
  <article>
    <h1>Tiêu đề bài viết</h1>
    <p>Nội dung...</p>
  </article>
</main>
\`\`\`

## ARIA Labels

Khi semantic HTML không đủ:

\`\`\`html
<!-- Button chỉ có icon -->
<button aria-label="Đóng dialog">
  <svg>...</svg>
</button>

<!-- Loading state -->
<div role="status" aria-live="polite">
  Đang tải...
</div>

<!-- Landmark roles -->
<div role="search">
  <input type="search" aria-label="Tìm kiếm bài viết" />
</div>
\`\`\`

## Checklist Accessibility

- [ ] Tất cả images có \`alt\` text có nghĩa
- [ ] Form inputs có \`<label>\` liên kết
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] Keyboard navigable (Tab, Enter, Escape)
- [ ] Focus visible (không xóa outline)
- [ ] Heading hierarchy đúng (h1 → h2 → h3)
`,
    },
    {
      title: 'CSS Modern Layout: Flexbox & Grid',
      order: 2, isFree: true,
      content: `# CSS Modern Layout: Flexbox & Grid

Hai hệ thống layout mạnh mẽ nhất trong CSS hiện đại.

## Flexbox — Layout 1 chiều

Tối ưu cho layout theo hàng hoặc cột.

\`\`\`css
.container {
  display: flex;
  flex-direction: row;     /* row | column */
  justify-content: center; /* main axis */
  align-items: center;     /* cross axis */
  gap: 1rem;
  flex-wrap: wrap;
}

/* Flex item */
.item {
  flex: 1;        /* grow, shrink, basis */
  flex-grow: 1;   /* Chiếm phần còn lại */
  flex-shrink: 0; /* Không co lại */
  flex-basis: 200px;
}
\`\`\`

### Centering với Flexbox

\`\`\`css
/* Căn giữa hoàn hảo */
.center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
\`\`\`

## CSS Grid — Layout 2 chiều

Tối ưu cho layout phức tạp theo cả hàng lẫn cột.

\`\`\`css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto;
  gap: 2rem;
}

/* Responsive grid không cần media query */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}
\`\`\`

### Grid Areas — Layout phức tạp

\`\`\`css
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar main    main"
    "footer footer footer";
  grid-template-columns: 250px 1fr 1fr;
  grid-template-rows: 64px 1fr 60px;
  min-height: 100vh;
}

header { grid-area: header; }
aside  { grid-area: sidebar; }
main   { grid-area: main; }
footer { grid-area: footer; }
\`\`\`

## Khi nào dùng Flexbox vs Grid?

| Flexbox | Grid |
|---------|------|
| Navigation bar | Page layout |
| Card content | Image gallery |
| Button groups | Dashboard |
| Centering | Complex forms |
`,
    },
    {
      title: 'JavaScript: Async/Await & Event Loop',
      order: 3, isFree: false,
      content: `# JavaScript: Async/Await & Event Loop

Hiểu sâu cách JavaScript xử lý bất đồng bộ.

## Event Loop

JavaScript là single-threaded nhưng không bị block nhờ Event Loop.

\`\`\`
Call Stack          Web APIs            Callback Queue
─────────           ────────            ──────────────
console.log ──►     setTimeout ──►      callback()
fetchData   ──►     fetch() ──────►     response handler
                    DOM events ──►      click handler
                                              │
                              ◄── Event Loop ─┘
                              (khi call stack trống)
\`\`\`

### Microtask vs Macrotask Queue

\`\`\`javascript
console.log('1');

setTimeout(() => console.log('2'), 0);  // Macrotask

Promise.resolve()
  .then(() => console.log('3'));  // Microtask

console.log('4');

// Output: 1, 4, 3, 2
// Microtask queue được ưu tiên hơn Macrotask!
\`\`\`

## Promise

\`\`\`javascript
// Promise chain
fetch('/api/user')
  .then(res => res.json())
  .then(user => fetch(\`/api/posts?userId=\${user.id}\`))
  .then(res => res.json())
  .catch(err => console.error(err));

// Promise.all — chạy song song
const [user, posts, comments] = await Promise.all([
  fetch('/api/user').then(r => r.json()),
  fetch('/api/posts').then(r => r.json()),
  fetch('/api/comments').then(r => r.json()),
]);

// Promise.allSettled — không throw nếu có lỗi
const results = await Promise.allSettled([
  fetchUser(),
  fetchPosts(),
]);
\`\`\`

## Async/Await

\`\`\`javascript
// ✅ Clean async code
async function loadUserData(userId) {
  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const [posts, followers] = await Promise.all([
      db.post.findMany({ where: { authorId: userId } }),
      db.follow.count({ where: { followingId: userId } }),
    ]);

    return { user, posts, followerCount: followers };
  } catch (error) {
    logger.error('Failed to load user data', { userId, error });
    throw error;
  }
}
\`\`\`

## Common Mistakes

\`\`\`javascript
// ❌ Await trong loop — sequential (chậm)
for (const id of userIds) {
  const user = await fetchUser(id); // Chờ từng cái
}

// ✅ Parallel — nhanh hơn N lần
const users = await Promise.all(userIds.map(id => fetchUser(id)));
\`\`\`
`,
    },
  ];

  for (const ch of chapters2) {
    const slug = slugify(ch.title);
    await db.chapter.upsert({
      where: { bookId_slug: { bookId: book2.id, slug } },
      update: { title: ch.title, content: ch.content, order: ch.order, isFree: ch.isFree },
      create: { bookId: book2.id, title: ch.title, slug, content: ch.content, order: ch.order, isFree: ch.isFree },
    });
    console.log(`  Chapter ${ch.order}: ${ch.title}`);
  }

  console.log('\n✅ Seed complete!');
  console.log(`  Book 1: /books/system-design-cho-developer (5 chapters)`);
  console.log(`  Book 2: /books/frontend-fundamentals (3 chapters)`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
