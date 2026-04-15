# KS40

Nền tảng đọc và chia sẻ bài viết kỹ thuật, xây dựng bằng Next.js 15 App Router.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Server Actions)
- **Auth:** NextAuth v5 (Credentials + Google OAuth)
- **Database:** PostgreSQL + Prisma ORM
- **Styling:** Tailwind CSS v4
- **Runtime:** Node.js 20+

---

## Yêu cầu

- Node.js >= 20
- npm >= 10
- Docker (để chạy PostgreSQL)

---

## Cài đặt & Build

### 1. Clone và cài dependencies

```bash
git clone <repo-url>
cd KS40
npm install
```

### 2. Cấu hình biến môi trường

```bash
cp .env.example .env
```

Chỉnh sửa `.env` với các giá trị phù hợp:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=ks40
DATABASE_URL="postgresql://postgres:password@localhost:5466/ks40?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="your-secret-here"

# Google OAuth (tùy chọn)
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."

# Resend (email, tùy chọn)
RESEND_API_KEY="..."
```

### 3. Khởi động database

```bash
docker compose up -d
```

PostgreSQL sẽ chạy tại `localhost:5466`.

### 4. Khởi tạo database

```bash
# Đẩy schema Prisma lên DB và generate client
npx prisma db push
```

### 5. Chạy môi trường development

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

---

## Build production

```bash
npm run build
npm run start
```

---

## Deploy

App được cấu hình với `output: 'standalone'` — Next.js tự đóng gói toàn bộ dependency cần thiết vào `.next/standalone`, không cần `node_modules` trên server.

### Chuẩn bị chung

1. Build trên máy local (hoặc CI):
   ```bash
   npm run build
   ```

2. Copy các thư mục sau lên server:
   ```
   .next/standalone/   ← app đã bundle (bao gồm server.js)
   .next/static/       → copy vào .next/standalone/.next/static/
   public/             → copy vào .next/standalone/public/
   ```

   Hoặc dùng script:
   ```bash
   cp -r .next/static   .next/standalone/.next/static
   cp -r public         .next/standalone/public
   ```

3. Cấu hình biến môi trường trên server (xem phần **Biến môi trường** ở trên). Tối thiểu cần:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` — URL thực tế của app (ví dụ `https://ks40.example.com`)

---

### Tùy chọn 1: Chạy thẳng với Node.js + PM2

Phù hợp khi deploy lên VPS (Ubuntu, Debian...).

```bash
# Cài PM2 (một lần)
npm install -g pm2

# Khởi động app
pm2 start .next/standalone/server.js --name ks40

# Tự khởi động lại khi server reboot
pm2 startup
pm2 save

# Xem logs
pm2 logs ks40

# Restart / reload không downtime
pm2 reload ks40
```

---

### Tùy chọn 2: Docker

Tạo `Dockerfile` tại root:

```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

Build và chạy:

```bash
# Build image (sau khi đã npm run build)
docker build -t ks40 .

# Chạy container (truyền env qua file)
docker run -d \
  --name ks40 \
  -p 3000:3000 \
  --env-file .env.production \
  ks40
```

---

### Tùy chọn 3: Vercel

```bash
npm install -g vercel
vercel --prod
```

Vercel tự detect Next.js, không cần cấu hình thêm. Thêm biến môi trường tại **Project Settings → Environment Variables**.

---

## Logging

App dùng **pino** để ghi structured log. Mỗi entry có đầy đủ context (module, userId, event...).

### Dev — log có màu, dễ đọc

```bash
npm run dev
```

```
10:30:00 INFO  Server khởi động  runtime=nodejs
10:30:05 INFO  auth/login  Đăng nhập  email=user@example.com
10:30:05 WARN  auth/login  Đăng nhập thất bại: sai email hoặc mật khẩu
```

### Production — JSON output

```bash
npm start
# hoặc với PM2:
pm2 logs ks40
```

```json
{"level":30,"time":"2026-04-15T10:30:00.000Z","module":"auth/login","email":"user@example.com","msg":"Đăng nhập"}
{"level":40,"time":"2026-04-15T10:30:05.000Z","module":"auth/login","email":"user@example.com","msg":"Đăng nhập thất bại: sai email hoặc mật khẩu"}
```

### Lọc log nhanh

```bash
# Chỉ xem lỗi (level 50 = error)
pm2 logs ks40 --raw | grep '"level":50'

# Lọc theo module
pm2 logs ks40 --raw | grep '"module":"auth'

# Lọc theo userId
pm2 logs ks40 --raw | grep '"userId":"abc123"'

# Lọc event listener failures
pm2 logs ks40 --raw | grep '"module":"events/listeners'
```

### Biến môi trường cho logging

| Biến | Giá trị | Mô tả |
|------|---------|-------|
| `LOG_LEVEL` | `debug` / `info` / `warn` / `error` | Mặc định: `info` (production), `debug` (dev) |

---

## Các lệnh hữu ích

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy dev server (hot reload) |
| `npm run build` | Build production |
| `npm run start` | Chạy production server |
| `npm run lint` | Kiểm tra lỗi ESLint |
| `npm run test` | Chạy unit tests (Vitest) |
| `npm run test:watch` | Chạy tests ở chế độ watch |
| `npx prisma studio` | Mở Prisma Studio để xem DB |
| `npx prisma db push` | Sync schema Prisma → DB |
| `npx prisma generate` | Generate Prisma Client |

---

## Cấu trúc thư mục

```
src/
├── app/                  # Next.js App Router (pages, layouts, API routes)
│   ├── (auth)/           # Trang đăng nhập, đăng ký
│   ├── (member)/         # Trang dành cho người dùng
│   ├── (admin)/          # Trang quản trị
│   └── api/              # API routes
├── features/             # Tính năng theo domain
│   ├── articles/
│   ├── auth/
│   ├── member/
│   ├── admin/
│   └── notifications/
├── components/           # UI components dùng chung
├── lib/                  # Tiện ích (db, auth, email...)
└── middleware.ts         # Auth middleware
docs/                     # Tài liệu kỹ thuật và kế hoạch
prisma/                   # Schema và migrations
```
