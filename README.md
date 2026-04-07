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
