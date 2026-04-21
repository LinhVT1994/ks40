import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const slugify = (text: string) =>
  text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const articles = [
  {
    title: 'Làm chủ TypeScript: Từ cơ bản đến nâng cao',
    topicSlug: 'cong-nghe-thong-tin-lap-trinh',
    summary: 'Hướng dẫn toàn diện về TypeScript — từ kiểu dữ liệu cơ bản, generics, đến các pattern nâng cao trong dự án thực tế.',
    overview: `**TypeScript** là ngôn ngữ lập trình mạnh mẽ, mở rộng JavaScript với hệ thống kiểu tĩnh. Bài viết này sẽ đưa bạn từ những khái niệm cơ bản nhất đến các kỹ thuật nâng cao được sử dụng trong các dự án production.

Bạn sẽ hiểu được *tại sao* TypeScript lại trở thành tiêu chuẩn trong phát triển web hiện đại và cách áp dụng nó hiệu quả.`,
    objectives: `- Nắm vững hệ thống kiểu dữ liệu của TypeScript
- Sử dụng Generics để viết code tái sử dụng
- Áp dụng Utility Types vào dự án thực tế
- Cấu hình tsconfig.json đúng cách`,
    content: `## Giới thiệu TypeScript

TypeScript là một ngôn ngữ lập trình được phát triển bởi Microsoft, ra mắt năm 2012. Nó là superset của JavaScript, nghĩa là mọi code JavaScript hợp lệ đều là TypeScript hợp lệ.

> "TypeScript is JavaScript with syntax for types." — TypeScript Documentation

---

## Tại sao nên dùng TypeScript?

Có nhiều lý do khiến TypeScript trở nên phổ biến:

1. **Phát hiện lỗi sớm**: Trình biên dịch bắt lỗi trước khi runtime
2. **IntelliSense tốt hơn**: IDE hỗ trợ autocomplete chính xác hơn
3. **Refactoring an toàn**: Đổi tên biến/hàm không lo bỏ sót
4. **Documentation sống**: Types chính là tài liệu của code

---

## Các kiểu dữ liệu cơ bản

\`\`\`typescript
// Primitive types
let name: string = "Alice";
let age: number = 30;
let isActive: boolean = true;

// Arrays
let scores: number[] = [95, 87, 92];
let tags: Array<string> = ["ts", "js", "react"];

// Tuple
let point: [number, number] = [10, 20];

// Union types
let id: string | number = "user_123";
id = 456; // cũng hợp lệ

// Literal types
type Direction = "north" | "south" | "east" | "west";
let dir: Direction = "north";
\`\`\`

---

## Interface vs Type Alias

Đây là câu hỏi phổ biến trong cộng đồng TypeScript:

\`\`\`typescript
// Interface — có thể extend và merge
interface User {
  id: string;
  name: string;
  email: string;
}

interface AdminUser extends User {
  permissions: string[];
}

// Type alias — linh hoạt hơn với union/intersection
type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
};

type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
\`\`\`

---

## Generics

Generics cho phép viết code linh hoạt và tái sử dụng:

\`\`\`typescript
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

const firstNum = first([1, 2, 3]);     // number | undefined
const firstStr = first(["a", "b"]);   // string | undefined

// Generic constraints
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: "Bob" };
const userName = getProperty(user, "name"); // string
// getProperty(user, "age"); // ❌ Error: "age" không tồn tại
\`\`\`

---

## Utility Types

TypeScript cung cấp nhiều utility types hữu ích:

| Utility Type | Mô tả |
|---|---|
| \`Partial<T>\` | Tất cả properties trở thành optional |
| \`Required<T>\` | Tất cả properties trở thành required |
| \`Pick<T, K>\` | Chọn một số properties từ T |
| \`Omit<T, K>\` | Loại bỏ một số properties từ T |
| \`Record<K, V>\` | Tạo object type với key K và value V |
| \`Readonly<T>\` | Tất cả properties trở thành readonly |

\`\`\`typescript
interface Article {
  id: string;
  title: string;
  content: string;
  publishedAt: Date;
  authorId: string;
}

// Khi update, không cần tất cả fields
type UpdateArticleDto = Partial<Omit<Article, "id" | "authorId">>;

// Preview card chỉ cần một số fields
type ArticleCard = Pick<Article, "id" | "title" | "publishedAt">;
\`\`\`

---

## Kết luận

TypeScript không chỉ là JavaScript với types — nó là một bộ công cụ mạnh mẽ giúp viết code có chất lượng cao hơn. Đầu tư thời gian học TypeScript sẽ trả về gấp nhiều lần trong các dự án dài hạn.`,
    tags: ['JavaScript', 'Git'],
    readTime: 12,
    audience: 'PUBLIC' as const,
  },
  {
    title: 'Docker cho Developer: Containerize ứng dụng Node.js',
    topicSlug: 'cong-nghe-thong-tin-devops-cloud',
    summary: 'Học cách đóng gói ứng dụng Node.js với Docker, tạo multi-stage builds, và triển khai với Docker Compose.',
    overview: `**Docker** đã thay đổi cách chúng ta xây dựng và triển khai phần mềm. Thay vì lo lắng về "works on my machine", containerization đảm bảo ứng dụng chạy nhất quán ở mọi môi trường.

Bài viết này hướng dẫn thực hành từ Dockerfile đầu tiên đến setup production-ready với Docker Compose.`,
    objectives: `- Hiểu kiến trúc và các khái niệm cốt lõi của Docker
- Viết Dockerfile tối ưu cho Node.js
- Sử dụng multi-stage builds để giảm image size
- Setup môi trường dev với Docker Compose`,
    content: `## Docker là gì?

Docker là nền tảng containerization cho phép đóng gói ứng dụng cùng với toàn bộ dependencies vào một **container** độc lập.

### Container vs Virtual Machine

| | Container | VM |
|---|---|---|
| Startup time | Giây | Phút |
| Size | MB | GB |
| Isolation | Process-level | OS-level |
| Overhead | Thấp | Cao |

---

## Dockerfile cơ bản

\`\`\`dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["node", "src/index.js"]
\`\`\`

---

## Multi-stage Build

Multi-stage build giúp tạo image production nhỏ hơn đáng kể:

\`\`\`dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
\`\`\`

Kết quả: image production chỉ ~120MB thay vì ~800MB.

---

## Docker Compose

\`\`\`yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
\`\`\`

---

## .dockerignore

Luôn tạo file \`.dockerignore\` để tránh copy file không cần thiết:

\`\`\`
node_modules
.git
.env
dist
*.log
README.md
\`\`\`

---

## Các lệnh Docker thường dùng

\`\`\`bash
# Build image
docker build -t my-app:latest .

# Run container
docker run -p 3000:3000 --env-file .env my-app:latest

# Xem logs
docker logs -f container_name

# Exec vào container
docker exec -it container_name sh

# Docker Compose
docker compose up -d
docker compose logs -f app
docker compose down -v
\`\`\``,
    tags: ['Docker', 'Linux'],
    readTime: 15,
    audience: 'PUBLIC' as const,
  },
  {
    title: 'Thiết kế RESTful API chuẩn với Node.js và Express',
    topicSlug: 'cong-nghe-thong-tin-lap-trinh',
    summary: 'Hướng dẫn thiết kế API RESTful chuyên nghiệp: cấu trúc URL, HTTP methods, status codes, authentication, và error handling.',
    overview: `Một **RESTful API** tốt là nền tảng của mọi ứng dụng web hiện đại. Bài viết này đi sâu vào các nguyên tắc thiết kế API, từ convention đặt tên đến bảo mật và versioning.`,
    objectives: `- Nắm vững các nguyên tắc REST
- Thiết kế URL hierarchy hợp lý
- Xử lý authentication với JWT
- Implement error handling nhất quán`,
    content: `## Nguyên tắc REST

REST (Representational State Transfer) dựa trên 6 ràng buộc kiến trúc:

1. **Client-Server**: Tách biệt UI và data storage
2. **Stateless**: Mỗi request chứa đủ thông tin để xử lý
3. **Cacheable**: Response phải định nghĩa khả năng cache
4. **Uniform Interface**: Interface nhất quán giữa components
5. **Layered System**: Client không biết đang kết nối trực tiếp hay qua proxy
6. **Code on Demand** (optional): Server có thể gửi executable code

---

## Thiết kế URL

\`\`\`
# ✅ Tốt — danh từ số nhiều, lowercase
GET    /articles
GET    /articles/:id
POST   /articles
PUT    /articles/:id
PATCH  /articles/:id
DELETE /articles/:id

# Nested resources
GET    /articles/:id/comments
POST   /articles/:id/comments
DELETE /articles/:id/comments/:commentId

# ❌ Tránh — động từ trong URL
GET    /getArticles
POST   /createArticle
GET    /article_list
\`\`\`

---

## HTTP Status Codes

| Code | Ý nghĩa | Dùng khi |
|---|---|---|
| 200 | OK | GET, PUT thành công |
| 201 | Created | POST tạo resource mới |
| 204 | No Content | DELETE thành công |
| 400 | Bad Request | Input không hợp lệ |
| 401 | Unauthorized | Chưa đăng nhập |
| 403 | Forbidden | Không có quyền |
| 404 | Not Found | Resource không tồn tại |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit |
| 500 | Internal Server Error | Lỗi server |

---

## Error Response Format

Luôn trả về error theo format nhất quán:

\`\`\`typescript
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>; // validation errors
  };
}

// Ví dụ validation error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": {
      "email": ["Email không đúng định dạng"],
      "password": ["Mật khẩu phải có ít nhất 8 ký tự"]
    }
  }
}
\`\`\`

---

## JWT Authentication

\`\`\`typescript
import jwt from 'jsonwebtoken';

// Tạo token
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET!,
  { expiresIn: '7d' }
);

// Middleware xác thực
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};
\`\`\`

---

## API Versioning

\`\`\`
# URL versioning (phổ biến nhất)
/api/v1/articles
/api/v2/articles

# Header versioning
Accept: application/vnd.myapi.v2+json

# Query param versioning
/api/articles?version=2
\`\`\`

Khuyến nghị dùng **URL versioning** vì dễ test và debug nhất.`,
    tags: ['REST API', 'JavaScript'],
    readTime: 10,
    audience: 'PUBLIC' as const,
  },
  {
    title: 'Hiểu sâu về Git: Workflow và best practices',
    topicSlug: 'cong-nghe-thong-tin-lap-trinh',
    summary: 'Từ git init đến advanced workflows: branching strategy, rebase vs merge, hooks, và quy trình làm việc nhóm hiệu quả.',
    overview: `**Git** là công cụ không thể thiếu với mọi lập trình viên. Nhưng phần lớn chúng ta chỉ dùng được khoảng 20% khả năng của Git. Bài viết này đào sâu vào những tính năng ít được biết đến nhưng cực kỳ hữu ích.`,
    objectives: `- Hiểu Git internals để dùng đúng và hiệu quả
- Áp dụng Gitflow và trunk-based development
- Dùng rebase tương tác để làm sạch lịch sử commit
- Setup Git hooks để tự động hóa quy trình`,
    content: `## Git Internals

Trước khi học các lệnh nâng cao, hãy hiểu Git lưu trữ dữ liệu như thế nào.

Git không lưu **diff** (sự khác biệt) — nó lưu **snapshots** (ảnh chụp toàn bộ trạng thái). Mỗi commit là một pointer đến snapshot đó.

\`\`\`
commit → tree → blob
         ↓
         tree → blob
                blob
\`\`\`

---

## Branching Strategy

### Gitflow
Phù hợp với release cycle rõ ràng:

\`\`\`
main          ●───────────────────────●
              ↑                       ↑
hotfix        └─●─┘               ●───┘
                                  ↑
release                       ●───●
                              ↑
develop   ●───●───●───●───●───●
              ↑       ↑
feature   ●───●   ●───●
\`\`\`

### Trunk-Based Development
Phù hợp với CI/CD và deploy thường xuyên:
- Tất cả đều merge vào \`main\` trực tiếp
- Branch tồn tại không quá 1-2 ngày
- Feature flags để ẩn tính năng chưa sẵn sàng

---

## Rebase tương tác

\`\`\`bash
# Squash 3 commits cuối thành 1
git rebase -i HEAD~3

# Trong editor, thay "pick" bằng:
# s (squash) — gộp vào commit trước
# r (reword) — sửa commit message
# d (drop) — xóa commit
# f (fixup) — gộp, bỏ message

pick abc123 feat: add user model
s   def456 fix: typo in user model
s   ghi789 fix: missing validation
\`\`\`

---

## Commit Message Convention

\`\`\`
<type>(<scope>): <description>

[optional body]

[optional footer]
\`\`\`

Types: \`feat\`, \`fix\`, \`docs\`, \`style\`, \`refactor\`, \`test\`, \`chore\`

\`\`\`bash
# ✅ Tốt
feat(auth): implement JWT refresh token rotation
fix(articles): prevent duplicate slug on concurrent requests
docs(api): add authentication examples to README

# ❌ Tránh
fix bug
update code
WIP
\`\`\`

---

## Git Hooks

Tự động kiểm tra trước khi commit:

\`\`\`bash
# .git/hooks/pre-commit
#!/bin/sh
npm run lint --silent
npm run typecheck --silent

if [ $? -ne 0 ]; then
  echo "❌ Lint hoặc typecheck thất bại. Commit bị hủy."
  exit 1
fi
\`\`\`

Dùng **Husky** để quản lý hooks dễ dàng hơn:

\`\`\`json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint --edit $1"
    }
  }
}
\`\`\`

---

## Các lệnh ít được biết nhưng hữu ích

\`\`\`bash
# Tìm commit gây ra bug với binary search
git bisect start
git bisect bad HEAD
git bisect good v1.0.0

# Xem ai viết dòng code nào
git blame -L 10,20 src/auth.ts

# Tìm tất cả commits có chứa string
git log -S "secretKey" --all

# Lưu thay đổi tạm thời
git stash push -m "WIP: feature/new-login" --include-untracked

# Cherry-pick một commit từ branch khác
git cherry-pick abc123
\`\`\``,
    tags: ['Git'],
    readTime: 13,
    audience: 'PUBLIC' as const,
  },
  {
    title: 'SQL Performance Tuning: Tối ưu truy vấn database',
    topicSlug: 'cong-nghe-thong-tin-khoa-hoc-du-lieu',
    summary: 'Kỹ thuật tối ưu hóa truy vấn SQL: indexing strategy, query execution plan, N+1 problem, và caching layer.',
    overview: `Database performance thường là điểm nghẽn cổ chai của ứng dụng. **Query optimization** không chỉ là thêm index — đó là hiểu sâu cách database engine hoạt động và đưa ra quyết định phù hợp.`,
    objectives: `- Đọc và hiểu Execution Plan
- Thiết kế index strategy phù hợp
- Giải quyết N+1 query problem
- Implement query caching hiệu quả`,
    content: `## Execution Plan

Trước khi tối ưu, phải hiểu database đang làm gì:

\`\`\`sql
-- PostgreSQL
EXPLAIN ANALYZE
SELECT u.name, COUNT(a.id) as article_count
FROM users u
LEFT JOIN articles a ON a.author_id = u.id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id, u.name
ORDER BY article_count DESC
LIMIT 10;
\`\`\`

Kết quả điển hình:
\`\`\`
Sort  (cost=1250.45..1252.95 rows=1000) (actual time=45.2..45.4 rows=10)
  ->  HashAggregate  (cost=1100.00..1200.00)
        ->  Hash Left Join  (cost=50.00..980.00)
              Hash Cond: (a.author_id = u.id)
              ->  Seq Scan on articles  (cost=0..500.00)    ← ⚠️ Sequential scan!
              ->  Hash
                    ->  Index Scan on users  (cost=0..45.00)
\`\`\`

**Sequential scan** trên bảng lớn là dấu hiệu cần thêm index.

---

## Index Strategy

\`\`\`sql
-- Index đơn
CREATE INDEX idx_articles_author_id ON articles(author_id);

-- Composite index — thứ tự quan trọng!
-- Query: WHERE status = 'PUBLISHED' AND topic_id = ? ORDER BY published_at DESC
CREATE INDEX idx_articles_status_topic_date
ON articles(status, topic_id, published_at DESC);

-- Partial index — chỉ index subset
CREATE INDEX idx_articles_published
ON articles(published_at DESC)
WHERE status = 'PUBLISHED';

-- Covering index — tránh table lookup
CREATE INDEX idx_articles_list
ON articles(status, published_at DESC)
INCLUDE (id, title, summary, author_id);
\`\`\`

---

## N+1 Query Problem

\`\`\`typescript
// ❌ N+1: 1 query lấy articles + N queries lấy author
const articles = await db.article.findMany({ take: 20 });
for (const article of articles) {
  article.author = await db.user.findUnique({
    where: { id: article.authorId }
  });
}

// ✅ Eager loading — 1 query JOIN
const articles = await db.article.findMany({
  take: 20,
  include: { author: true }
});

// ✅ Hoặc DataLoader pattern cho GraphQL
const userLoader = new DataLoader(async (userIds: string[]) => {
  const users = await db.user.findMany({
    where: { id: { in: userIds } }
  });
  return userIds.map(id => users.find(u => u.id === id));
});
\`\`\`

---

## Pagination: OFFSET vs Cursor

\`\`\`sql
-- ❌ OFFSET pagination — chậm khi offset lớn
SELECT * FROM articles
ORDER BY published_at DESC
LIMIT 20 OFFSET 10000;  -- Phải đọc qua 10000 rows!

-- ✅ Cursor-based pagination
SELECT * FROM articles
WHERE published_at < '2024-01-15 10:30:00'  -- cursor
ORDER BY published_at DESC
LIMIT 20;
\`\`\`

---

## Query Caching với Redis

\`\`\`typescript
const CACHE_TTL = 300; // 5 phút

async function getPopularArticles() {
  const cacheKey = 'articles:popular';

  // Kiểm tra cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Query database
  const articles = await db.article.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { viewCount: 'desc' },
    take: 10,
  });

  // Lưu cache
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(articles));

  return articles;
}
\`\`\``,
    tags: ['SQL', 'Python'],
    readTime: 14,
    audience: 'MEMBERS' as const,
  },
  {
    title: 'Machine Learning cơ bản với Python và scikit-learn',
    topicSlug: 'cong-nghe-thong-tin-tri-tue-nhan-tao',
    summary: 'Xây dựng model machine learning đầu tiên: từ data preprocessing, feature engineering đến evaluation và deployment.',
    overview: `**Machine Learning** không còn là lĩnh vực chỉ dành cho các nhà khoa học. Với Python và scikit-learn, bạn có thể xây dựng các mô hình dự đoán chất lượng cao chỉ với vài chục dòng code.`,
    objectives: `- Hiểu pipeline ML: data → model → evaluation
- Xử lý và chuẩn bị dữ liệu đúng cách
- So sánh và chọn thuật toán phù hợp
- Đánh giá và cải thiện model performance`,
    content: `## Machine Learning Pipeline

\`\`\`
Raw Data → Data Cleaning → Feature Engineering →
Model Training → Evaluation → Deployment → Monitoring
\`\`\`

---

## Data Preprocessing

\`\`\`python
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split

# Load data
df = pd.read_csv('data.csv')

# Kiểm tra missing values
print(df.isnull().sum())

# Điền missing values
df['age'].fillna(df['age'].median(), inplace=True)
df['category'].fillna('Unknown', inplace=True)

# Encode categorical variables
le = LabelEncoder()
df['category_encoded'] = le.fit_transform(df['category'])

# Feature và target
X = df.drop('target', axis=1)
y = df['target']

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Normalize features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)  # Dùng fit từ train set!
\`\`\`

---

## So sánh các thuật toán

\`\`\`python
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, roc_auc_score

models = {
    'Logistic Regression': LogisticRegression(max_iter=1000),
    'Decision Tree': DecisionTreeClassifier(max_depth=5),
    'Random Forest': RandomForestClassifier(n_estimators=100),
    'Gradient Boosting': GradientBoostingClassifier(n_estimators=100),
}

results = {}
for name, model in models.items():
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]

    results[name] = {
        'accuracy': (y_pred == y_test).mean(),
        'auc_roc': roc_auc_score(y_test, y_prob),
    }
    print(f"\\n{name}:")
    print(classification_report(y_test, y_pred))
\`\`\`

---

## Hyperparameter Tuning

\`\`\`python
from sklearn.model_selection import GridSearchCV

param_grid = {
    'n_estimators': [100, 200, 300],
    'max_depth': [3, 5, 7, None],
    'min_samples_split': [2, 5, 10],
}

grid_search = GridSearchCV(
    RandomForestClassifier(),
    param_grid,
    cv=5,              # 5-fold cross validation
    scoring='roc_auc',
    n_jobs=-1,         # Dùng tất cả CPU cores
    verbose=2
)

grid_search.fit(X_train_scaled, y_train)
print(f"Best params: {grid_search.best_params_}")
print(f"Best AUC: {grid_search.best_score_:.4f}")
\`\`\`

---

## Lưu và load model

\`\`\`python
import joblib

# Lưu model và scaler
joblib.dump(grid_search.best_estimator_, 'model.pkl')
joblib.dump(scaler, 'scaler.pkl')

# Load và dùng
model = joblib.load('model.pkl')
scaler = joblib.load('scaler.pkl')

def predict(features: dict) -> float:
    X = pd.DataFrame([features])
    X_scaled = scaler.transform(X)
    return model.predict_proba(X_scaled)[0][1]
\`\`\``,
    tags: ['Python'],
    readTime: 16,
    audience: 'MEMBERS' as const,
  },
  {
    title: 'Bảo mật Web Application: OWASP Top 10',
    topicSlug: 'cong-nghe-thong-tin-an-ninh-mang',
    summary: 'Tìm hiểu 10 lỗ hổng bảo mật web phổ biến nhất theo OWASP và cách phòng chống hiệu quả trong dự án thực tế.',
    overview: `**OWASP Top 10** là danh sách 10 rủi ro bảo mật phổ biến nhất trong ứng dụng web. Hiểu rõ và phòng chống chúng là trách nhiệm của mọi developer.`,
    objectives: `- Nhận biết các dạng tấn công phổ biến
- Implement các biện pháp bảo vệ phù hợp
- Code review với tư duy bảo mật
- Setup security headers đúng cách`,
    content: `## 1. Broken Access Control

Lỗi phổ biến nhất: user có thể truy cập tài nguyên không thuộc về họ.

\`\`\`typescript
// ❌ Lỗi: chỉ check đăng nhập, không check ownership
app.get('/api/articles/:id', authenticate, async (req, res) => {
  const article = await db.article.findUnique({ where: { id: req.params.id } });
  res.json(article);
});

// ✅ Luôn verify ownership
app.get('/api/articles/:id', authenticate, async (req, res) => {
  const article = await db.article.findFirst({
    where: {
      id: req.params.id,
      authorId: req.user.id  // Chỉ trả về bài của chính họ
    }
  });
  if (!article) return res.status(404).json({ error: 'Not found' });
  res.json(article);
});
\`\`\`

---

## 2. SQL Injection

\`\`\`typescript
// ❌ Tuyệt đối không làm thế này
const result = await db.$queryRawUnsafe(
  \`SELECT * FROM users WHERE email = '\${email}'\`
);
// Input: ' OR '1'='1 → đọc toàn bộ users!

// ✅ Dùng parameterized query
const result = await db.$queryRaw\`
  SELECT * FROM users WHERE email = \${email}
\`;
// Hoặc ORM với typed query
const user = await db.user.findFirst({ where: { email } });
\`\`\`

---

## 3. XSS (Cross-Site Scripting)

\`\`\`typescript
// ❌ Render HTML không sanitize
function ArticleContent({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// ✅ Sanitize trước khi render
import DOMPurify from 'dompurify';

function ArticleContent({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['class', 'id', 'href', 'src', 'alt'],
  });
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
\`\`\`

---

## 4. Security Headers

\`\`\`typescript
// Dùng helmet.js cho Express
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'nonce-{RANDOM}'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.example.com'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
\`\`\`

---

## 5. Rate Limiting

\`\`\`typescript
import rateLimit from 'express-rate-limit';

// Giới hạn API calls
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100,
  message: { error: 'Too many requests' },
  standardHeaders: true,
});

// Giới hạm ketat hơn cho auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 10,
  message: { error: 'Too many login attempts' },
  skipSuccessfulRequests: true,
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
\`\`\``,
    tags: ['CompTIA Security+', 'CISSP'],
    readTime: 11,
    audience: 'PUBLIC' as const,
  },
  {
    title: 'Next.js 15 App Router: Server Components và Data Fetching',
    topicSlug: 'cong-nghe-thong-tin-lap-trinh',
    summary: 'Khai thác tối đa Next.js 15 App Router: React Server Components, Streaming, Suspense, và chiến lược caching.',
    overview: `**Next.js App Router** đánh dấu bước chuyển đổi lớn nhất trong lịch sử React — từ client-side rendering sang server-first architecture. Bài viết này giải thích tường tận cách hoạt động và best practices.`,
    objectives: `- Phân biệt Server Components và Client Components
- Implement data fetching patterns hiệu quả
- Sử dụng Suspense và Streaming
- Tối ưu performance với caching`,
    content: `## Server vs Client Components

\`\`\`typescript
// Server Component (mặc định trong App Router)
// - Không có state, hooks, event handlers
// - Render trên server, gửi HTML về client
// - Có thể fetch data trực tiếp

async function ArticleList() {
  // Fetch trực tiếp trong component — không cần useEffect!
  const articles = await db.article.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: 10,
  });

  return (
    <ul>
      {articles.map(a => <ArticleCard key={a.id} article={a} />)}
    </ul>
  );
}

// Client Component — cần 'use client' directive
'use client';

import { useState } from 'react';

function LikeButton({ articleId, initialCount }: Props) {
  const [count, setCount] = useState(initialCount);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      ❤️ {count}
    </button>
  );
}
\`\`\`

---

## Data Fetching Patterns

\`\`\`typescript
// Parallel fetching — tất cả fetch đồng thời
export default async function ArticlePage({ params }: Props) {
  const [article, comments, relatedArticles] = await Promise.all([
    getArticle(params.slug),
    getComments(params.slug),
    getRelatedArticles(params.slug),
  ]);

  return <Article article={article} comments={comments} related={relatedArticles} />;
}

// Sequential fetching — khi có dependency
async function UserProfile({ userId }: Props) {
  const user = await getUser(userId);
  const posts = await getPosts(user.id); // Cần userId

  return <Profile user={user} posts={posts} />;
}
\`\`\`

---

## Streaming với Suspense

\`\`\`typescript
import { Suspense } from 'react';

export default function ArticlePage() {
  return (
    <main>
      {/* Render ngay lập tức */}
      <ArticleHero />

      {/* Stream sau khi có data */}
      <Suspense fallback={<CommentsSkeletion />}>
        <Comments /> {/* Async Server Component */}
      </Suspense>

      <Suspense fallback={<RelatedSkeleton />}>
        <RelatedArticles />
      </Suspense>
    </main>
  );
}
\`\`\`

---

## Caching Strategy

\`\`\`typescript
// Revalidate theo thời gian
const data = await fetch('/api/articles', {
  next: { revalidate: 3600 } // Cache 1 giờ
});

// Revalidate theo tag
const data = await fetch('/api/articles', {
  next: { tags: ['articles'] }
});

// Invalidate cache từ Server Action
import { revalidateTag } from 'next/cache';

async function publishArticle(id: string) {
  await db.article.update({ where: { id }, data: { status: 'PUBLISHED' } });
  revalidateTag('articles'); // Xóa cache liên quan
}

// Opt out khỏi cache
const data = await fetch('/api/articles', {
  cache: 'no-store' // Dynamic data
});
\`\`\``,
    tags: ['JavaScript'],
    readTime: 13,
    audience: 'PUBLIC' as const,
  },
  {
    title: 'Thiết kế hệ thống: Event-Driven Architecture',
    topicSlug: 'cong-nghe-thong-tin-lap-trinh',
    summary: 'Xây dựng hệ thống có khả năng mở rộng cao với Event-Driven Architecture: message queues, event sourcing, và CQRS pattern.',
    overview: `**Event-Driven Architecture (EDA)** cho phép các service giao tiếp thông qua events thay vì direct calls. Kết quả là hệ thống linh hoạt, dễ mở rộng và có fault tolerance cao hơn.`,
    objectives: `- Hiểu lợi ích và trade-off của EDA
- Implement message queue với RabbitMQ/Kafka
- Áp dụng Event Sourcing pattern
- Thiết kế CQRS cho read/write separation`,
    content: `## Tại sao Event-Driven?

### Vấn đề với Synchronous Calls

\`\`\`
User → OrderService → PaymentService → InventoryService → NotificationService
                      ↑ nếu service này down, toàn bộ flow fail
\`\`\`

### Event-Driven Solution

\`\`\`
User → OrderService → publishes "OrderCreated" event

PaymentService (subscribes to "OrderCreated")
InventoryService (subscribes to "OrderCreated")  → Độc lập, parallel
NotificationService (subscribes to "OrderPaid")
\`\`\`

---

## Implement với RabbitMQ

\`\`\`typescript
import amqp from 'amqplib';

// Publisher
class EventBus {
  private channel: amqp.Channel;

  async publish(exchange: string, routingKey: string, event: object) {
    await this.channel.assertExchange(exchange, 'topic', { durable: true });

    this.channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, contentType: 'application/json' }
    );
  }
}

// Sau khi tạo order
await eventBus.publish('orders', 'order.created', {
  id: order.id,
  userId: order.userId,
  items: order.items,
  totalAmount: order.totalAmount,
  createdAt: new Date().toISOString(),
});

// Subscriber (Payment Service)
await channel.assertQueue('payment-service', { durable: true });
await channel.bindQueue('payment-service', 'orders', 'order.created');

channel.consume('payment-service', async (msg) => {
  if (!msg) return;

  const event = JSON.parse(msg.content.toString());
  try {
    await processPayment(event);
    channel.ack(msg);
  } catch (error) {
    // Retry hoặc dead letter queue
    channel.nack(msg, false, false);
  }
});
\`\`\`

---

## Event Sourcing

Thay vì lưu trạng thái hiện tại, lưu lịch sử events:

\`\`\`typescript
// Events
type OrderEvent =
  | { type: 'OrderCreated'; data: { userId: string; items: Item[] } }
  | { type: 'OrderPaid'; data: { paymentId: string; amount: number } }
  | { type: 'OrderShipped'; data: { trackingNumber: string } }
  | { type: 'OrderCancelled'; data: { reason: string } };

// Reconstruct current state từ events
function applyEvent(state: Order, event: OrderEvent): Order {
  switch (event.type) {
    case 'OrderCreated':
      return { ...state, status: 'PENDING', ...event.data };
    case 'OrderPaid':
      return { ...state, status: 'PAID', paymentId: event.data.paymentId };
    case 'OrderShipped':
      return { ...state, status: 'SHIPPED', trackingNumber: event.data.trackingNumber };
    case 'OrderCancelled':
      return { ...state, status: 'CANCELLED' };
  }
}

async function getOrder(orderId: string): Promise<Order> {
  const events = await db.orderEvent.findMany({
    where: { orderId },
    orderBy: { createdAt: 'asc' }
  });

  return events.reduce(applyEvent, {} as Order);
}
\`\`\`

---

## CQRS Pattern

\`\`\`typescript
// Command side — write, emit events
async function placeOrder(command: PlaceOrderCommand) {
  const order = Order.create(command);
  await orderRepository.save(order);
  await eventBus.publish('orders', 'order.created', order.toEvent());
  return order.id;
}

// Query side — read, optimized views
// Maintain denormalized read model
async function updateOrderReadModel(event: OrderCreatedEvent) {
  await readDb.orderView.upsert({
    where: { id: event.id },
    create: {
      id: event.id,
      userId: event.userId,
      status: 'PENDING',
      itemCount: event.items.length,
      totalAmount: event.totalAmount,
      createdAt: event.createdAt,
    },
    update: {},
  });
}
\`\`\``,
    tags: ['REST API'],
    readTime: 18,
    audience: 'PREMIUM' as const,
  },
  {
    title: 'Revit cho Kỹ sư xây dựng: Hướng dẫn toàn diện',
    topicSlug: 'xay-dung-bim-bim-cad',
    summary: 'Từ cơ bản đến nâng cao trong Revit: tạo family, quản lý phối hợp MEP-Structure-Architecture, và xuất bản vẽ chuẩn.',
    overview: `**Revit** của Autodesk là phần mềm BIM (Building Information Modeling) hàng đầu thế giới. Khác với AutoCAD 2D truyền thống, Revit xây dựng mô hình 3D thông minh chứa đầy đủ thông tin về vật liệu, khối lượng, và tiến độ.`,
    objectives: `- Setup dự án Revit đúng chuẩn từ đầu
- Tạo và chỉnh sửa Family cho cấu kiện đặc biệt
- Phối hợp mô hình với các bộ môn khác
- Xuất bản vẽ và báo cáo khối lượng`,
    content: `## Tại sao BIM thay thế CAD truyền thống?

| Tiêu chí | AutoCAD 2D | Revit BIM |
|---|---|---|
| Phối hợp | Khó, thủ công | Tự động, real-time |
| Khối lượng | Tính tay | Tự động từ mô hình |
| Xung đột | Phát hiện muộn | Clash detection tức thời |
| Thay đổi | Cập nhật nhiều bản vẽ | Thay đổi 1 lần, tự cập nhật |
| 4D/5D | Không hỗ trợ | Tích hợp tiến độ và chi phí |

---

## Cấu trúc dự án Revit

\`\`\`
Project Browser
├── Views
│   ├── Floor Plans (Mặt bằng)
│   │   ├── Level 1 - Structural
│   │   └── Level 1 - Architectural
│   ├── Sections (Mặt cắt)
│   ├── Elevations (Mặt đứng)
│   └── 3D Views
├── Schedules (Bảng thống kê)
│   ├── Door Schedule
│   └── Column Schedule
├── Sheets (Tờ bản vẽ)
│   ├── A-001 Mặt bằng kiến trúc
│   └── S-001 Mặt bằng kết cấu
└── Families (Thư viện cấu kiện)
\`\`\`

---

## Tạo Structural Family

Khi thư viện có sẵn không phù hợp tiêu chuẩn Việt Nam, cần tự tạo:

\`\`\`
Bước 1: File → New → Family → Structural Framing - Beams
Bước 2: Sketch profile mặt cắt dầm (VD: H300x150x6.5x9)
Bước 3: Tạo Type Parameters:
         - h (Overall Height): Instance
         - bf (Flange Width): Instance
         - tf (Flange Thickness): Type
         - tw (Web Thickness): Type
Bước 4: Gán Structural Material parameter
Bước 5: Load Into Project
\`\`\`

---

## Phối hợp mô hình (Coordination)

\`\`\`
Structural Model (S)
    ↓ Link vào
Architectural Model (A)  ← Owner file
    ↑ Link vào
MEP Model (M)
    ↓
Navisworks (.nwf) → Clash Detection
\`\`\`

**Clash Detection trong Navisworks:**
- Hard Clash: Hai cấu kiện chiếm cùng không gian (ống MEP xuyên qua dầm)
- Soft Clash: Khoảng hở không đủ (dầm cách trần < 200mm)
- Workflow Clash: Tiến độ thi công xung đột

---

## Shared Coordinates

Bắt buộc setup khi làm việc nhóm:

\`\`\`
1. Mở Architectural model (host model)
2. Manage → Coordinates → Acquire Coordinates
   (từ survey point đã được khảo sát thực địa)
3. Mọi model link vào đều dùng "Auto - By Shared Coordinates"
   → Tất cả đều nằm đúng vị trí thực địa
\`\`\`

---

## Xuất IFC cho collaboration

\`\`\`
File → Export → IFC
Settings:
  - IFC Version: IFC 2x3 (tương thích rộng nhất)
  - File Type: IFC
  - Space Boundaries: None (trừ energy analysis)
  - Export: Current View / Visible Elements Only
\`\`\`

IFC là định dạng mở, cho phép chia sẻ mô hình với phần mềm khác (Tekla, Bentley, ArchiCAD).`,
    tags: ['Revit', 'BIM & CAD', 'Thiết kế BIM'],
    readTime: 14,
    audience: 'PUBLIC' as const,
  },
  {
    title: 'React Performance: Tối ưu rendering và bundle size',
    topicSlug: 'cong-nghe-thong-tin-lap-trinh',
    summary: 'Kỹ thuật tối ưu React app: memo, useMemo, useCallback, lazy loading, code splitting, và profiling với React DevTools.',
    overview: `Performance không phải thêm vào sau — nó phải là một phần trong thiết kế từ đầu. Bài viết này tổng hợp các kỹ thuật tối ưu React thực tế, từ micro-optimization đến kiến trúc cấp cao.`,
    objectives: `- Identify performance bottlenecks với React DevTools Profiler
- Dùng memo, useMemo, useCallback đúng chỗ
- Implement code splitting và lazy loading
- Tối ưu bundle size với tree shaking`,
    content: `## Đo lường trước khi tối ưu

Rule số 1: **Đừng tối ưu sớm**. Dùng React DevTools Profiler để tìm bottleneck thực sự.

\`\`\`
React DevTools → Profiler → Record → Thao tác → Stop
→ Xem "Flamegraph": component nào render lâu nhất
→ Xem "Ranked": top components theo thời gian render
\`\`\`

---

## React.memo

Tránh re-render không cần thiết:

\`\`\`typescript
// ❌ ArticleCard re-render mỗi khi parent re-render
function ArticleCard({ article }: { article: Article }) {
  return <div>{article.title}</div>;
}

// ✅ Chỉ re-render khi article thay đổi
const ArticleCard = React.memo(({ article }: { article: Article }) => {
  return <div>{article.title}</div>;
});

// Custom comparison (dùng khi shallow equality không đủ)
const ArticleCard = React.memo(
  ({ article }) => <div>{article.title}</div>,
  (prev, next) => prev.article.id === next.article.id &&
                  prev.article.updatedAt === next.article.updatedAt
);
\`\`\`

---

## useMemo và useCallback

\`\`\`typescript
function ArticleList({ articles, searchQuery }: Props) {
  // ✅ Cache kết quả filter — chỉ tính lại khi articles hoặc searchQuery thay đổi
  const filteredArticles = useMemo(
    () => articles.filter(a =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [articles, searchQuery]
  );

  // ✅ Stable reference cho callback — không tạo function mới mỗi render
  const handleLike = useCallback((articleId: string) => {
    likeArticle(articleId);
  }, []); // Deps rỗng = chỉ tạo 1 lần

  return (
    <div>
      {filteredArticles.map(a => (
        <ArticleCard key={a.id} article={a} onLike={handleLike} />
      ))}
    </div>
  );
}
\`\`\`

> ⚠️ Đừng dùng useMemo/useCallback cho mọi thứ — có overhead. Chỉ dùng khi computation tốn kém hoặc cần referential equality.

---

## Code Splitting

\`\`\`typescript
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const RichTextEditor = lazy(() => import('./RichTextEditor'));
const ChartDashboard = lazy(() => import('./ChartDashboard'));

function ArticleEditor() {
  const [mode, setMode] = useState<'read' | 'edit'>('read');

  return (
    <div>
      {mode === 'edit' && (
        <Suspense fallback={<EditorSkeleton />}>
          <RichTextEditor /> {/* Chỉ load khi cần */}
        </Suspense>
      )}
    </div>
  );
}
\`\`\`

---

## Virtual List

Với danh sách dài (1000+ items), dùng virtualization:

\`\`\`typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function ArticleVirtualList({ articles }: { articles: Article[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: articles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // estimated row height
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              transform: \`translateY(\${virtualItem.start}px)\`,
            }}
          >
            <ArticleCard article={articles[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
\`\`\``,
    tags: ['JavaScript'],
    readTime: 12,
    audience: 'MEMBERS' as const,
  },
  {
    title: 'Thiết kế UI/UX: Nguyên tắc cơ bản và Design System',
    topicSlug: 'cong-nghe-thong-tin-thiet-ke-ui-ux',
    summary: 'Tìm hiểu các nguyên tắc thiết kế UI/UX hiện đại, xây dựng Design System, và công cụ Figma trong quy trình thực tế.',
    overview: `**Design System** là tập hợp nhất quán các nguyên tắc, components và patterns cho phép team thiết kế và phát triển nhanh hơn, đồng nhất hơn. Bài viết này hướng dẫn xây dựng từ đầu.`,
    objectives: `- Áp dụng 8 nguyên tắc UX Gestalt vào thiết kế
- Xây dựng Color System và Typography Scale
- Tạo Component Library trong Figma
- Handoff thiết kế cho developer hiệu quả`,
    content: `## 8 Nguyên tắc Gestalt trong UI

### 1. Proximity (Gần nhau)
Các elements gần nhau được coi là liên quan:
\`\`\`
❌ Label    Input

✅
Label
Input  ← gần nhau → chúng liên quan
\`\`\`

### 2. Similarity (Tương đồng)
Elements có cùng style được coi là cùng nhóm.

### 3. Continuity (Liên tục)
Mắt người theo đường thẳng và đường cong.

---

## Spacing System (8px Grid)

\`\`\`
Base unit: 4px
Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128

// Tailwind equivalent
gap-1 = 4px
gap-2 = 8px
gap-3 = 12px
gap-4 = 16px
gap-6 = 24px
gap-8 = 32px
\`\`\`

---

## Color System

\`\`\`
Primary Color
├── 50  (lightest background)
├── 100 (hover background)
├── 200 (border, subtle)
├── 300 (disabled)
├── 400 (placeholder)
├── 500 (default — main color)
├── 600 (hover)
├── 700 (pressed/active)
├── 800 (dark text on light)
└── 900 (darkest)

Semantic Colors:
- success: green-500 (#22c55e)
- warning: amber-500 (#f59e0b)
- error:   red-500 (#ef4444)
- info:    blue-500 (#3b82f6)
\`\`\`

---

## Typography Scale

\`\`\`
Display:  48px / 56px / font-black / tracking-tight
H1:       36px / 44px / font-bold
H2:       28px / 36px / font-bold
H3:       22px / 32px / font-semibold
H4:       18px / 28px / font-semibold
Body L:   18px / 28px / font-normal
Body:     16px / 24px / font-normal
Body S:   14px / 20px / font-normal
Caption:  12px / 16px / font-medium
Overline: 11px / 16px / font-bold / tracking-widest / uppercase
\`\`\`

---

## Component Anatomy

Mỗi component nên có đủ states:

\`\`\`
Button states:
├── Default
├── Hover
├── Active/Pressed
├── Focused (keyboard navigation)
├── Disabled
└── Loading

Input states:
├── Empty
├── Filled
├── Focused
├── Error (+ error message)
├── Success
└── Disabled
\`\`\`

---

## Figma Handoff Checklist

Trước khi bàn giao cho developer:

- [ ] Tất cả màu sắc dùng từ Color Styles
- [ ] Font dùng Text Styles
- [ ] Spacing dùng Auto Layout với fixed gap
- [ ] Components có đủ states và variants
- [ ] Assets được export đúng format (SVG cho icons, WebP cho images)
- [ ] Responsive breakpoints được thiết kế (mobile/tablet/desktop)
- [ ] Prototype flow cho user testing`,
    tags: ['Figma'],
    readTime: 10,
    audience: 'PUBLIC' as const,
  },
  {
    title: 'Kỹ năng đọc và phân tích bản vẽ kết cấu',
    topicSlug: 'xay-dung-bim-ket-cau',
    summary: 'Hướng dẫn đọc và phân tích bản vẽ kết cấu công trình: từ bản vẽ móng, cột, dầm đến bảng thống kê thép.',
    overview: `Đọc bản vẽ kết cấu là kỹ năng cốt lõi của mọi kỹ sư xây dựng. Bài viết này hướng dẫn hệ thống hóa cách đọc và kiểm tra bản vẽ kết cấu theo tiêu chuẩn Việt Nam hiện hành.`,
    objectives: `- Đọc hiểu ký hiệu và quy ước trong bản vẽ kết cấu
- Phân tích bản vẽ móng và kiểm tra điều kiện địa chất
- Đọc bảng thống kê thép và kiểm tra số lượng
- Phát hiện xung đột giữa bản vẽ kiến trúc và kết cấu`,
    content: `## Hệ thống ký hiệu trong bản vẽ kết cấu

### Ký hiệu thép
\`\`\`
Thép nhóm AI (CB240-T): φ (phi thường)
Thép nhóm AII (CB300-V): Φ (phi gân)
Thép nhóm AIII (CB400-V): Φ (phi gân, phổ biến nhất hiện nay)

Ví dụ đọc ký hiệu:
6Φ20 → 6 thanh thép gân đường kính 20mm
Φ8a150 → Thép đai đường kính 8mm, bước 150mm
\`\`\`

---

## Bản vẽ móng

### Thứ tự đọc:
1. **Mặt bằng móng**: Vị trí và loại móng (đơn, băng, bè, cọc)
2. **Mặt cắt móng**: Kích thước, chiều sâu đặt móng
3. **Chi tiết thép**: Lớp bảo vệ, cách bố trí cốt thép
4. **Thuyết minh**: Tiêu chuẩn thiết kế, cấp độ bền bê tông

\`\`\`
Móng đơn M1 (ký hiệu trên bản vẽ):
- Kích thước: 1500×1500×600mm
- Cốt thép đáy: Φ16a150 hai lớp
- Cổ móng: 400×400mm, 4Φ20 + Φ8a200
- Lớp bảo vệ: 40mm (tiếp xúc đất)
- Bê tông: B20 (M250)
\`\`\`

---

## Bản vẽ cột

\`\`\`
Mặt cắt cột C1-3 (tầng 1-3):
┌─────────────────┐
│  4Φ22           │  ← 4 thanh thép dọc
│  + 4Φ20         │  ← 4 thanh góc
│  Đai: Φ8a100    │  ← Thép đai dày ở vùng nút
│  Φ8a200 (giữa) │
│  350×350mm      │
└─────────────────┘

Lưu ý: Vùng nút (đầu và chân cột) phải đặt đai dày hơn
theo TCVN 5574:2018
\`\`\`

---

## Kiểm tra xung đột với bản vẽ kiến trúc

Các điểm xung đột phổ biến cần kiểm tra:

| Hạng mục | Kiến trúc | Kết cấu | Vấn đề thường gặp |
|---|---|---|---|
| Cổ cột | Ghi 200×200 | Thiết kế 300×300 | Không đủ diện tích đặt thép |
| Chiều cao tầng | H=3500 | H=3200 | Dầm chìm xuống thấp |
| Vị trí cửa | Cửa sổ 1200mm | Dầm chạy qua | Không thi công được |
| Sàn mái | Dốc thoát nước | Sàn phẳng | Phải có lớp tạo dốc |

---

## Bảng thống kê thép

\`\`\`
Cách kiểm tra bảng thống kê:

1. Chọn 1 cấu kiện (VD: Dầm D1)
2. Đếm số thanh thép trên bản vẽ
3. So sánh với số lượng trong bảng
4. Tính kiểm lại trọng lượng:

   G = n × L × γ

   Với: γ (kg/m) = 0.00617 × d²

   Ví dụ: 4Φ20, L=5.5m
   γ = 0.00617 × 400 = 2.47 kg/m
   G = 4 × 5.5 × 2.47 = 54.3 kg
\`\`\``,
    tags: ['Đọc bản vẽ kỹ thuật', 'Tính toán kết cấu'],
    readTime: 12,
    audience: 'PUBLIC' as const,
  },
  {
    title: 'PostgreSQL nâng cao: Window Functions và CTEs',
    topicSlug: 'cong-nghe-thong-tin-khoa-hoc-du-lieu',
    summary: 'Khai thác sức mạnh của PostgreSQL: Window Functions để phân tích dữ liệu, CTEs cho query phức tạp, và Full Text Search.',
    overview: `PostgreSQL là một trong những RDBMS mạnh mẽ nhất hiện nay. Bài viết này đi sâu vào các tính năng nâng cao giúp viết query ngắn hơn, rõ ràng hơn, và hiệu quả hơn.`,
    objectives: `- Sử dụng Window Functions cho phân tích dữ liệu
- Viết CTE (Common Table Expression) đệ quy
- Implement Full Text Search bằng tsvector
- Tận dụng JSONB cho dữ liệu bán cấu trúc`,
    content: `## Window Functions

Window functions tính toán trên một tập hàng liên quan mà không gộp chúng lại:

\`\`\`sql
-- Xếp hạng bài viết trong mỗi topic
SELECT
  title,
  topic_id,
  view_count,
  RANK() OVER (PARTITION BY topic_id ORDER BY view_count DESC) as rank_in_topic,
  ROW_NUMBER() OVER (ORDER BY view_count DESC) as overall_rank,
  SUM(view_count) OVER (PARTITION BY topic_id) as topic_total_views,
  view_count::float / SUM(view_count) OVER (PARTITION BY topic_id) * 100 as topic_view_pct
FROM articles
WHERE status = 'PUBLISHED';
\`\`\`

---

## LAG / LEAD — So sánh với hàng trước/sau

\`\`\`sql
-- Tăng trưởng view theo tháng
WITH monthly_views AS (
  SELECT
    DATE_TRUNC('month', published_at) as month,
    COUNT(*) as article_count,
    SUM(view_count) as total_views
  FROM articles
  WHERE status = 'PUBLISHED'
  GROUP BY 1
)
SELECT
  month,
  total_views,
  LAG(total_views) OVER (ORDER BY month) as prev_month_views,
  total_views - LAG(total_views) OVER (ORDER BY month) as growth,
  ROUND(
    (total_views - LAG(total_views) OVER (ORDER BY month))::numeric /
    NULLIF(LAG(total_views) OVER (ORDER BY month), 0) * 100,
    1
  ) as growth_pct
FROM monthly_views
ORDER BY month;
\`\`\`

---

## CTE Đệ quy — Duyệt cây topic

\`\`\`sql
-- Lấy toàn bộ subtree của một topic
WITH RECURSIVE topic_tree AS (
  -- Base case: topic gốc
  SELECT id, label, slug, parent_id, 0 as depth
  FROM topics
  WHERE slug = 'cong-nghe-thong-tin'

  UNION ALL

  -- Recursive case: children
  SELECT t.id, t.label, t.slug, t.parent_id, tt.depth + 1
  FROM topics t
  INNER JOIN topic_tree tt ON t.parent_id = tt.id
)
SELECT
  REPEAT('  ', depth) || label as indented_label,
  slug,
  depth
FROM topic_tree
ORDER BY depth, label;
\`\`\`

---

## Full Text Search

\`\`\`sql
-- Tạo tsvector column
ALTER TABLE articles
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(content, '')), 'C')
) STORED;

CREATE INDEX idx_articles_search ON articles USING GIN(search_vector);

-- Query
SELECT title, ts_rank(search_vector, query) as rank
FROM articles, to_tsquery('simple', 'typescript & react') query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 10;
\`\`\`

---

## JSONB

\`\`\`sql
-- Lưu metadata linh hoạt
ALTER TABLE articles ADD COLUMN metadata JSONB DEFAULT '{}';

-- Query vào JSONB
SELECT title, metadata->>'readingLevel' as level
FROM articles
WHERE metadata @> '{"tags": ["advanced"]}'
  AND (metadata->>'wordCount')::int > 2000;

-- Index cho JSONB
CREATE INDEX idx_articles_metadata ON articles USING GIN(metadata);
\`\`\``,
    tags: ['SQL', 'Python'],
    readTime: 15,
    audience: 'MEMBERS' as const,
  },
  {
    title: 'Kiểm thử phần mềm: Unit Test, Integration Test và E2E',
    topicSlug: 'cong-nghe-thong-tin-kiem-thu-phan-mem',
    summary: 'Xây dựng chiến lược kiểm thử toàn diện: viết unit test với Vitest, integration test với database thật, và E2E test với Playwright.',
    overview: `**Testing pyramid** là nền tảng của chất lượng phần mềm. Đầu tư vào automated testing từ đầu giúp phát hiện lỗi sớm, refactor tự tin, và deploy thường xuyên hơn.`,
    objectives: `- Xây dựng testing strategy phù hợp với dự án
- Viết unit test có giá trị thực sự
- Setup integration test với database thật
- Implement E2E test với Playwright`,
    content: `## Testing Pyramid

\`\`\`
        /\\
       /  \\
      / E2E \\         ← ít nhất, chậm nhất, tốn nhất
     /--------\\
    /Integration\\     ← trung bình
   /------------\\
  /  Unit Tests  \\    ← nhiều nhất, nhanh nhất, rẻ nhất
 /________________\\
\`\`\`

---

## Unit Test với Vitest

\`\`\`typescript
// src/lib/slugify.test.ts
import { describe, it, expect } from 'vitest';
import { slugify, parseHeadings } from './slugify';

describe('slugify', () => {
  it('converts Vietnamese text to slug', () => {
    expect(slugify('Xin chào thế giới')).toBe('xin-chao-the-gioi');
  });

  it('handles đ character', () => {
    expect(slugify('Đây là test')).toBe('day-la-test');
  });

  it('removes consecutive hyphens', () => {
    expect(slugify('hello   world')).toBe('hello-world');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  hello  ')).toBe('hello');
  });
});

describe('parseHeadings', () => {
  it('extracts h2 headings from HTML', () => {
    const html = '<h2>Introduction</h2><p>text</p><h3>Details</h3>';
    const headings = parseHeadings(html);

    expect(headings).toHaveLength(2);
    expect(headings[0]).toEqual({ level: 2, text: 'Introduction', id: 'introduction' });
    expect(headings[1]).toEqual({ level: 3, text: 'Details', id: 'details' });
  });
});
\`\`\`

---

## Integration Test

\`\`\`typescript
// src/features/articles/actions/article.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db';
import { createArticleAction, getArticleBySlugAction } from './article';

// Dùng database thật (test database), không mock!
describe('article actions', () => {
  let testUserId: string;
  let testTopicId: string;

  beforeEach(async () => {
    // Tạo test data
    const user = await db.user.create({
      data: { email: 'test@test.com', name: 'Test User' }
    });
    testUserId = user.id;

    const topic = await db.topic.create({
      data: { slug: 'test-topic', label: 'Test Topic', enabled: true, order: 999 }
    });
    testTopicId = topic.id;
  });

  afterEach(async () => {
    // Cleanup
    await db.article.deleteMany({ where: { authorId: testUserId } });
    await db.user.delete({ where: { id: testUserId } });
    await db.topic.delete({ where: { id: testTopicId } });
  });

  it('creates article with correct slug', async () => {
    const result = await createArticleAction({
      title: 'Test Article Title',
      content: '<p>Content</p>',
      topicId: testTopicId,
      authorId: testUserId,
    });

    expect(result.success).toBe(true);
    expect(result.data?.slug).toBe('test-article-title');
  });

  it('prevents duplicate slug', async () => {
    // Tạo bài đầu tiên
    await createArticleAction({ title: 'Same Title', topicId: testTopicId, authorId: testUserId });

    // Tạo bài thứ hai cùng title
    const result = await createArticleAction({ title: 'Same Title', topicId: testTopicId, authorId: testUserId });

    // Slug phải được suffix
    expect(result.data?.slug).toMatch(/same-title-\d+/);
  });
});
\`\`\`

---

## E2E Test với Playwright

\`\`\`typescript
// tests/e2e/article.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Article Detail Page', () => {
  test('renders article content correctly', async ({ page }) => {
    await page.goto('/article/huong-dan-typescript');

    // Kiểm tra title
    await expect(page.locator('h1')).toContainText('TypeScript');

    // TOC hiển thị
    const toc = page.locator('[data-testid="floating-toc"]');
    await expect(toc).toBeVisible();

    // Click TOC item → scroll đến heading
    await toc.locator('a').first().click();
    const firstHeading = page.locator('h2').first();
    await expect(firstHeading).toBeInViewport();
  });

  test('like button requires authentication', async ({ page }) => {
    await page.goto('/article/huong-dan-typescript');
    await page.locator('[data-testid="like-button"]').click();

    // Redirect đến login
    await expect(page).toHaveURL(/.*login.*/);
  });
});
\`\`\``,
    tags: ['Git', 'Thuật toán & Cấu trúc dữ liệu'],
    readTime: 14,
    audience: 'PUBLIC' as const,
  },
  {
    title: 'Kubernetes cho Developer: Deploy ứng dụng production',
    topicSlug: 'cong-nghe-thong-tin-devops-cloud',
    summary: 'Triển khai ứng dụng lên Kubernetes: Pods, Deployments, Services, Ingress, và CI/CD pipeline với GitHub Actions.',
    overview: `**Kubernetes (K8s)** là hệ thống orchestration container tiêu chuẩn de-facto cho production. Bài viết này hướng dẫn thực hành từ deploy đầu tiên đến setup autoscaling và rolling updates.`,
    objectives: `- Hiểu các K8s objects cơ bản: Pod, Deployment, Service
- Expose ứng dụng ra ngoài với Ingress
- Quản lý config và secrets an toàn
- Setup CI/CD pipeline với GitHub Actions`,
    content: `## Kubernetes Architecture

\`\`\`
Control Plane                    Worker Nodes
┌─────────────────────┐         ┌──────────────┐
│  API Server         │────────→│  kubelet     │
│  etcd               │         │  kube-proxy  │
│  Scheduler          │         │  container   │
│  Controller Manager │         │  runtime     │
└─────────────────────┘         └──────────────┘
\`\`\`

---

## Deployment

\`\`\`yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0  # Zero downtime deployment
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app
          image: ghcr.io/myorg/my-app:v1.2.3
          ports:
            - containerPort: 3000
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "500m"
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database-url
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
\`\`\`

---

## Service và Ingress

\`\`\`yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 3000

---
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts:
        - myapp.example.com
      secretName: myapp-tls
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app-service
                port:
                  number: 80
\`\`\`

---

## GitHub Actions CI/CD

\`\`\`yaml
# .github/workflows/deploy.yml
name: Deploy to Kubernetes

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build and push Docker image
        run: |
          echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker build -t ghcr.io/${{ github.repository }}:${{ github.sha }} .
          docker push ghcr.io/${{ github.repository }}:${{ github.sha }}

      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v4
        with:
          namespace: production
          manifests: k8s/
          images: ghcr.io/${{ github.repository }}:${{ github.sha }}
\`\`\``,
    tags: ['Docker', 'AWS', 'Linux'],
    readTime: 17,
    audience: 'PREMIUM' as const,
  },
  {
    title: 'Tài chính cá nhân cho người đi làm: Quản lý và đầu tư',
    topicSlug: 'tai-chinh-ngan-hang-dau-tu',
    summary: 'Hệ thống quản lý tài chính cá nhân: ngân sách 50/30/20, quỹ khẩn cấp, đầu tư chứng khoán cơ bản, và kế hoạch FIRE.',
    overview: `Quản lý tài chính không phải chỉ là tiết kiệm tiền — đó là **xây dựng tự do tài chính** một cách có hệ thống. Bài viết này cung cấp framework thực tế áp dụng ngay từ tháng này.`,
    objectives: `- Xây dựng ngân sách cá nhân theo nguyên tắc 50/30/20
- Tạo quỹ khẩn cấp đủ 3-6 tháng chi tiêu
- Hiểu cơ bản về đầu tư chứng khoán và ETF
- Lập kế hoạch nghỉ hưu sớm (FIRE)`,
    content: `## Tại sao cần quản lý tài chính?

> "Đừng tiết kiệm những gì còn lại sau khi chi tiêu; hãy chi tiêu những gì còn lại sau khi tiết kiệm." — Warren Buffett

Phần lớn người đi làm gặp phải vòng lặp:

\`\`\`
Nhận lương → Chi tiêu → Hết tiền → Chờ lương
\`\`\`

Mục tiêu của chúng ta: phá vỡ vòng lặp này.

---

## Quy tắc 50/30/20

Phân bổ thu nhập sau thuế:

| Danh mục | % | Ví dụ (15tr/tháng) |
|---|---|---|
| **Nhu cầu thiết yếu** (50%) | 50% | 7.5 triệu |
| Tiền thuê nhà/vay mua nhà | | 3.5 triệu |
| Ăn uống | | 2.5 triệu |
| Đi lại, điện nước | | 1.5 triệu |
| **Mong muốn** (30%) | 30% | 4.5 triệu |
| Giải trí, du lịch | | 2 triệu |
| Quần áo, mua sắm | | 1.5 triệu |
| Nhà hàng, cafe | | 1 triệu |
| **Tiết kiệm & Đầu tư** (20%) | 20% | 3 triệu |
| Quỹ khẩn cấp | | 1.5 triệu |
| Đầu tư | | 1.5 triệu |

---

## Quỹ khẩn cấp

**Mục tiêu**: 3-6 tháng chi tiêu cơ bản

\`\`\`
Chi tiêu cơ bản/tháng: 7.5 triệu
Quỹ khẩn cấp mục tiêu: 7.5 × 6 = 45 triệu

Gửi tiết kiệm ngân hàng (không phải đầu tư!)
→ Lãi suất 6%/năm
→ Rút được ngay khi cần
→ KHÔNG dùng cho mục đích khác
\`\`\`

**Tại sao quan trọng?** Quỹ khẩn cấp giúp bạn không phải bán tháo đầu tư khi có sự cố.

---

## Đầu tư cho người mới bắt đầu

### Index Fund / ETF

Thay vì chọn cổ phiếu riêng lẻ (rủi ro cao), đầu tư vào toàn bộ thị trường:

\`\`\`
VN-Index ETF (VFMVN30, FUEVFVND):
- Đầu tư vào 30 cổ phiếu hàng đầu Việt Nam
- Phí quản lý thấp: 0.5-0.8%/năm
- Đã bao gồm đa dạng hóa tự động

Dollar Cost Averaging (DCA):
→ Mua đều đặn mỗi tháng, bất kể giá cao hay thấp
→ Giảm rủi ro timing the market
→ Lợi nhuận từ compound interest dài hạn
\`\`\`

### Lãi kép — Sức mạnh của thời gian

\`\`\`
Đầu tư 1.5 triệu/tháng, lợi suất 10%/năm:

5 năm:  ~115 triệu    (bỏ vào: 90 triệu)
10 năm: ~305 triệu   (bỏ vào: 180 triệu)
20 năm: ~1.14 tỷ     (bỏ vào: 360 triệu)
30 năm: ~3.4 tỷ      (bỏ vào: 540 triệu)
\`\`\`

---

## FIRE — Financial Independence, Retire Early

\`\`\`
Tỷ lệ tiết kiệm cao → Nghỉ hưu sớm hơn

Tiết kiệm 10% → Nghỉ hưu sau ~43 năm
Tiết kiệm 25% → Nghỉ hưu sau ~32 năm
Tiết kiệm 50% → Nghỉ hưu sau ~17 năm
Tiết kiệm 75% → Nghỉ hưu sau ~7 năm

Quy tắc 4%: Khi tài sản = 25× chi tiêu/năm
→ Có thể nghỉ hưu, rút 4%/năm mà không cạn tiền

Ví dụ: Chi tiêu 10 triệu/tháng = 120 triệu/năm
→ Cần: 120 × 25 = 3 tỷ để nghỉ hưu
\`\`\``,
    tags: ['Đầu tư'],
    readTime: 11,
    audience: 'PUBLIC' as const,
  },
  {
    title: 'Tâm lý học trong thiết kế sản phẩm: Nudge Theory',
    topicSlug: 'cong-nghe-thong-tin-thiet-ke-ui-ux',
    summary: 'Ứng dụng tâm lý học hành vi vào thiết kế UX: Nudge Theory, Dark Patterns, cognitive biases, và ethical design.',
    overview: `**Nudge Theory** cho rằng thiết kế có thể "hướng dẫn" người dùng đưa ra lựa chọn tốt hơn mà không ép buộc. Bài viết này khám phá cách ứng dụng tâm lý học hành vi vào UX design một cách có đạo đức.`,
    objectives: `- Hiểu các cognitive biases ảnh hưởng đến UX
- Áp dụng Nudge Theory tích cực vào thiết kế
- Nhận biết và tránh Dark Patterns
- Đo lường hiệu quả của behavioral design`,
    content: `## Cognitive Biases trong UX

### 1. Loss Aversion (Sợ mất mát)

> Người ta sợ mất hơn là vui khi được, tỷ lệ 2:1

\`\`\`
❌ "Đăng ký Premium để có thêm tính năng"
✅ "Bạn đang mất quyền truy cập vào 5 tính năng quan trọng"

❌ "Dùng thử 30 ngày"
✅ "Bắt đầu miễn phí — không mất gì nếu không thích"
\`\`\`

---

### 2. Social Proof (Bằng chứng xã hội)

\`\`\`
"1,247 người đang xem bài viết này"
"★★★★★ 4.8/5 (2,341 đánh giá)"
"Nguyễn Văn A và 12 người bạn đã thích bài này"
\`\`\`

---

### 3. Scarcity (Khan hiếm) và Urgency (Cấp bách)

\`\`\`
"Chỉ còn 3 chỗ"
"Ưu đãi kết thúc trong 23:45:12"
"Hết hạn lúc nửa đêm"

⚠️ Ranh giới mỏng với Dark Pattern — chỉ dùng khi thật sự đúng sự thật
\`\`\`

---

## Nudge Theory trong Practice

### Default Effect

Lựa chọn mặc định có tỷ lệ được chọn cao hơn nhiều:

\`\`\`
Đăng ký nhận newsletter:
❌ Default: không đăng ký → 15% opt-in rate
✅ Default: đăng ký → 85% opt-in rate (ethical nếu rõ ràng)

Notification settings:
❌ Tất cả ON mặc định → Người dùng bực bội, uninstall
✅ Chỉ ON những notification quan trọng nhất
\`\`\`

---

### Anchoring Effect

Số đầu tiên nhìn thấy ảnh hưởng đến đánh giá:

\`\`\`
Pricing page:
┌─────────────┬─────────────┬─────────────┐
│ Basic: 99k  │ Pro: 199k   │ Enterprise  │
│             │  ← BEST     │ Liên hệ     │
│ 5 features  │  VALUE →    │             │
│             │ 20 features │ Unlimited   │
└─────────────┴─────────────┴─────────────┘
         ↑ Pro trông hợp lý vì có Enterprise bên cạnh
\`\`\`

---

## Dark Patterns — Biết để tránh

Dark patterns là thiết kế cố tình đánh lừa người dùng:

| Pattern | Ví dụ | Vấn đề |
|---|---|---|
| Roach Motel | Đăng ký dễ, hủy khó | Lừa dối |
| Confirmshaming | "Không, tôi không muốn tiết kiệm" | Thao túng cảm xúc |
| Hidden Costs | Phí bất ngờ ở checkout | Thiếu trung thực |
| Disguised Ads | Quảng cáo trông như kết quả tự nhiên | Lừa dối |
| Forced Continuity | Miễn phí → tự động tính phí | Mất tin tưởng |

---

## Ethical Design Checklist

Trước khi implement behavioral design, hỏi:

- [ ] Người dùng có được lợi hay chỉ công ty?
- [ ] Người dùng có hiểu mình đang làm gì không?
- [ ] Có dễ hoàn tác lựa chọn không?
- [ ] Bạn có thoải mái nếu mẹ/bạn bè nhìn thấy điều này không?`,
    tags: ['Figma'],
    readTime: 9,
    audience: 'PUBLIC' as const,
  },
  {
    title: 'CI/CD Pipeline: Tự động hóa quy trình phát triển',
    topicSlug: 'cong-nghe-thong-tin-devops-cloud',
    summary: 'Xây dựng CI/CD pipeline hoàn chỉnh với GitHub Actions: automated testing, code quality gates, staging deployment, và production release.',
    overview: `**CI/CD** (Continuous Integration/Continuous Delivery) là xương sống của DevOps hiện đại. Pipeline tốt giúp team deploy nhiều lần mỗi ngày với độ tin cậy cao và rủi ro thấp.`,
    objectives: `- Thiết kế pipeline CI/CD phù hợp với quy mô team
- Implement automated testing và quality gates
- Deploy tự động lên staging và production
- Monitor và rollback khi có sự cố`,
    content: `## CI vs CD vs CD

- **CI** (Continuous Integration): Merge code thường xuyên, chạy test tự động
- **CD** (Continuous Delivery): Code luôn sẵn sàng deploy, bấm nút là xong
- **CD** (Continuous Deployment): Deploy tự động không cần can thiệp thủ công

---

## Pipeline hoàn chỉnh với GitHub Actions

\`\`\`yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io

jobs:
  # ─── Stage 1: Code Quality ───────────────────────────
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  # ─── Stage 2: Testing ────────────────────────────────
  test:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/testdb
      - run: npm test -- --coverage
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/testdb
      - uses: codecov/codecov-action@v4

  # ─── Stage 3: Build ──────────────────────────────────
  build:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4
      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ github.repository }}
          tags: |
            type=sha,prefix=sha-
            type=ref,event=branch
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ─── Stage 4: Deploy Staging ─────────────────────────
  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          curl -X POST ${{ secrets.DEPLOY_WEBHOOK_STAGING }} \\
            -H "Authorization: Bearer ${{ secrets.DEPLOY_TOKEN }}" \\
            -d '{"image": "${{ needs.build.outputs.image-tag }}"}'

      - name: Run smoke tests
        run: |
          sleep 30  # Chờ deploy xong
          curl -f https://staging.myapp.com/api/health || exit 1

  # ─── Stage 5: Deploy Production ──────────────────────
  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment:
      name: production
      url: https://myapp.com
    steps:
      - name: Deploy to production
        run: |
          curl -X POST ${{ secrets.DEPLOY_WEBHOOK_PROD }} \\
            -H "Authorization: Bearer ${{ secrets.DEPLOY_TOKEN }}" \\
            -d '{"image": "${{ needs.build.outputs.image-tag }}"}'
\`\`\`

---

## Branch Protection Rules

\`\`\`yaml
# Cấu hình trong GitHub Settings → Branches
Branch: main
Rules:
  ✅ Require a pull request before merging
     - Required approving reviews: 1
  ✅ Require status checks to pass:
     - lint-and-typecheck
     - test
  ✅ Require branches to be up to date
  ✅ Include administrators
  ✅ Restrict who can push (optional)
\`\`\``,
    tags: ['Docker', 'Git', 'AWS'],
    readTime: 16,
    audience: 'MEMBERS' as const,
  },
  {
    title: 'Quản lý dự án Agile: Scrum trong thực tế',
    topicSlug: 'kinh-doanh-quan-tri-quan-ly-van-hanh',
    summary: 'Áp dụng Scrum framework vào dự án phát triển phần mềm: ceremonies, artifacts, roles, và cách đo lường velocity thực tế.',
    overview: `**Scrum** là framework phát triển sản phẩm Agile phổ biến nhất thế giới. Nhưng Scrum "trên sách" và Scrum "trong thực tế" thường khác nhau đáng kể. Bài viết này chia sẻ kinh nghiệm áp dụng thực tế.`,
    objectives: `- Hiểu Scrum Framework và sự khác nhau với Waterfall
- Tổ chức Sprint Planning, Daily Standup hiệu quả
- Ước lượng Story Points thực tế
- Sử dụng Jira để quản lý backlog`,
    content: `## Scrum vs Waterfall

\`\`\`
Waterfall:                  Scrum:
┌──────────┐               Sprint 1 (2 tuần)
│ Analysis │               ┌─────────────────┐
└────┬─────┘               │ Plan → Build    │
     ↓                     │ → Test → Review │
┌──────────┐               └───────┬─────────┘
│  Design  │                       ↓
└────┬─────┘               Sprint 2 (2 tuần)
     ↓                     ┌─────────────────┐
┌──────────┐               │ Plan → Build    │
│   Dev    │               │ → Test → Review │
└────┬─────┘               └───────┬─────────┘
     ↓                             ↓
┌──────────┐                    ...
│ Testing  │
└────┬─────┘
     ↓
┌──────────┐
│ Release  │               → Feedback sớm hơn
└──────────┘               → Thích nghi với thay đổi
\`\`\`

---

## Scrum Roles

| Role | Trách nhiệm |
|---|---|
| **Product Owner** | Định nghĩa và ưu tiên backlog, đại diện stakeholders |
| **Scrum Master** | Facilitate ceremonies, remove impediments, coach team |
| **Dev Team** | Self-organizing team, cross-functional (3-9 người) |

---

## Ceremonies

### Sprint Planning (2-4 giờ/sprint)

\`\`\`
Câu hỏi cần trả lời:
1. Sprint Goal là gì?
2. Những User Stories nào vào sprint?
3. Story Points tổng = Velocity của team

Velocity điển hình:
- Team 5 người, Sprint 2 tuần
- Velocity: 30-50 points/sprint
\`\`\`

### Daily Standup (15 phút)

3 câu hỏi, không quá 15 phút:
1. Hôm qua tôi đã làm gì?
2. Hôm nay tôi sẽ làm gì?
3. Có blocking issue nào không?

> Standup là sync point, không phải status report cho manager.

### Sprint Review vs Retrospective

\`\`\`
Sprint Review (với stakeholders):
→ Demo những gì đã build
→ Thu thập feedback
→ Adjust Product Backlog

Sprint Retrospective (chỉ team):
→ Cái gì đã tốt?
→ Cái gì cần cải thiện?
→ Action items cụ thể cho sprint tiếp
\`\`\`

---

## Story Points và Fibonacci

\`\`\`
Dùng Fibonacci: 1, 2, 3, 5, 8, 13, 21

1 point:  Thay đổi nhỏ, < 2 giờ
2 points: Task đơn giản, nửa ngày
3 points: Task trung bình, 1 ngày
5 points: Task phức tạp, 2-3 ngày
8 points: Task lớn, cần chia nhỏ hơn
13+:      Quá lớn, phải chia thành nhiều stories

Lưu ý: Story Points đo EFFORT, không phải TIME
\`\`\`

---

## User Story tốt

\`\`\`
Định dạng: As a [role], I want [feature] so that [benefit]

❌ Kém:
"Thêm nút share"

✅ Tốt:
"As a reader, I want to share an article to Facebook
so that my friends can read interesting content too"

Acceptance Criteria:
- Share button hiển thị trên mọi article
- Click → mở Facebook share dialog với URL và preview
- Nếu không đăng nhập Facebook → redirect đến FB login
- Share count tăng lên sau khi share thành công
\`\`\``,
    tags: ['Quản lý rủi ro', 'Lãnh đạo công trường'],
    readTime: 10,
    audience: 'PUBLIC' as const,
  },
  {
    title: 'Redis: Caching và Session Management cho ứng dụng scale',
    topicSlug: 'cong-nghe-thong-tin-quan-tri-he-thong',
    summary: 'Implement Redis cache layer cho ứng dụng Node.js: caching strategies, session store, pub/sub, và Redis Cluster khi scale.',
    overview: `**Redis** là in-memory data store nhanh nhất hiện nay — sub-millisecond latency. Bài viết này hướng dẫn implement Redis layer để giảm database load và cải thiện response time đáng kể.`,
    objectives: `- Thiết kế caching strategy phù hợp
- Implement Cache-Aside, Write-Through patterns
- Dùng Redis cho session management
- Setup Pub/Sub cho real-time features`,
    content: `## Redis vs Memcached

| | Redis | Memcached |
|---|---|---|
| Data structures | String, Hash, List, Set, ZSet, Stream | String only |
| Persistence | RDB + AOF | Không |
| Pub/Sub | Có | Không |
| Cluster | Native | Third-party |
| Lua scripting | Có | Không |
| Use case | Đa dạng | Đơn giản cache |

---

## Cache-Aside Pattern

\`\`\`typescript
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

async function getArticle(slug: string) {
  const cacheKey = \`article:\${slug}\`;

  // 1. Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached); // Cache hit!
  }

  // 2. Cache miss — fetch from DB
  const article = await db.article.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: { author: true, topic: true, tags: { include: { tag: true } } },
  });

  if (!article) return null;

  // 3. Store in cache
  await redis.setEx(
    cacheKey,
    3600, // TTL: 1 giờ
    JSON.stringify(article)
  );

  return article;
}

// Invalidate cache khi article thay đổi
async function invalidateArticleCache(slug: string) {
  await redis.del(\`article:\${slug}\`);
  await redis.del('articles:featured');
  await redis.del('articles:latest');
}
\`\`\`

---

## Các Data Structure của Redis

\`\`\`typescript
// Hash — lưu object mà không cần serialize
await redis.hSet(\`user:\${userId}\`, {
  name: 'Alice',
  email: 'alice@example.com',
  role: 'ADMIN',
});
const name = await redis.hGet(\`user:\${userId}\`, 'name');

// Sorted Set — leaderboard, trending
await redis.zAdd('articles:trending', [
  { score: 1250, value: 'article-id-1' },
  { score: 980, value: 'article-id-2' },
]);
const top10 = await redis.zRange('articles:trending', 0, 9, { REV: true });

// Set — unique visitors, tags
await redis.sAdd(\`article:\${id}:viewers\`, userId);
const uniqueViewers = await redis.sCard(\`article:\${id}:viewers\`);
\`\`\`

---

## Session Management

\`\`\`typescript
import session from 'express-session';
import RedisStore from 'connect-redis';

app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    sameSite: 'strict',
  },
}));
\`\`\`

---

## Pub/Sub — Real-time Notifications

\`\`\`typescript
// Publisher (khi có comment mới)
async function onNewComment(articleId: string, comment: Comment) {
  await redis.publish(
    \`article:\${articleId}:comments\`,
    JSON.stringify({ type: 'NEW_COMMENT', data: comment })
  );
}

// Subscriber (WebSocket server)
const subscriber = redis.duplicate();
await subscriber.connect();

await subscriber.subscribe(\`article:\${articleId}:comments\`, (message) => {
  const event = JSON.parse(message);
  // Broadcast đến tất cả clients đang xem bài này
  io.to(\`article:\${articleId}\`).emit('new-comment', event.data);
});
\`\`\``,
    tags: ['Linux', 'AWS'],
    readTime: 13,
    audience: 'MEMBERS' as const,
  },
];

async function main() {
  console.log('🌱 Seeding articles...');

  // Lấy admin user
  const admin = await db.user.findFirst({ where: { email: 'admin@lenote.dev' } });
  if (!admin) {
    throw new Error('Admin user không tồn tại. Hãy chạy seed.ts trước.');
  }

  // Lấy tất cả topics
  const topics = await db.topic.findMany();
  const topicBySlug = Object.fromEntries(topics.map(t => [t.slug, t]));

  // Lấy tất cả tags
  const allTags = await db.tag.findMany();
  const tagByName = Object.fromEntries(allTags.map(t => [t.name, t]));

  let created = 0;
  const now = new Date();

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    const topic = topicBySlug[a.topicSlug];
    if (!topic) {
      console.warn(`⚠️  Topic không tồn tại: ${a.topicSlug} — bỏ qua "${a.title}"`);
      continue;
    }

    const slug = slugify(a.title);
    const publishedAt = new Date(now.getTime() - (articles.length - i) * 2 * 24 * 60 * 60 * 1000);

    const existing = await db.article.findUnique({ where: { slug } });
    if (existing) {
      console.log(`⏭️  Bỏ qua (đã tồn tại): ${a.title}`);
      continue;
    }

    const article = await db.article.create({
      data: {
        title: a.title,
        slug,
        summary: a.summary,
        overview: a.overview ?? null,
        objectives: a.objectives ?? null,
        content: a.content,
        topicId: topic.id,
        authorId: admin.id,
        status: 'PUBLISHED',
        audience: a.audience,
        readTime: a.readTime,
        publishedAt,
        viewCount: Math.floor(Math.random() * 2000) + 100,
        tags: {
          create: a.tags
            .filter(name => tagByName[name])
            .map(name => ({ tagId: tagByName[name].id })),
        },
      },
    });

    console.log(`✅ Tạo: ${article.title}`);
    created++;
  }

  console.log(`\n🎉 Hoàn thành! Đã tạo ${created}/${articles.length} bài viết.`);
}

main().catch(console.error).finally(() => db.$disconnect());
