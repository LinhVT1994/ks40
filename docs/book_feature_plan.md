# Book Feature — Kế hoạch triển khai

**Mục tiêu:** Thêm content type **Book** — dạng ebook/tutorial dài, chia thành chapters, đọc tuần tự.
**Phân biệt với Series:** Series = tập hợp Articles độc lập; Book = nội dung liên tục, viết trực tiếp trong hệ thống, có flow đọc rõ ràng.

---

## 1. Database Schema

### Thêm vào `prisma/schema.prisma`

```prisma
model Book {
  id          String          @id @default(cuid())
  title       String
  slug        String          @unique
  description String?         @db.Text
  cover       String?
  audience    ArticleAudience @default(PUBLIC)
  published   Boolean         @default(false)
  authorId    String
  author      User            @relation(fields: [authorId], references: [id])
  chapters    Chapter[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([slug])
  @@index([authorId])
}

model Chapter {
  id        String   @id @default(cuid())
  bookId    String
  book      Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  title     String
  slug      String
  content   String   @db.Text
  order     Int
  isFree    Boolean  @default(false) // chapter đầu xem thử miễn phí
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  readHistories BookReadHistory[]

  @@unique([bookId, slug])
  @@unique([bookId, order])
  @@index([bookId])
}

model BookReadHistory {
  userId    String
  bookId    String
  chapterId String
  chapter   Chapter  @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  readAt    DateTime @default(now())

  @@id([userId, chapterId])
  @@index([userId, bookId])
}
```

> **Lưu ý:** Thêm `books BookReadHistory[]` vào model `User`.

---

## 2. File Structure

```
src/
├── features/
│   ├── admin/
│   │   ├── actions/
│   │   │   └── book.ts               ← CRUD actions cho Book + Chapter
│   │   └── components/
│   │       ├── BookClient.tsx         ← Admin list + create/edit modal
│   │       ├── BookEditorClient.tsx   ← Editor chapters (drag-to-reorder)
│   │       └── ChapterEditorModal.tsx ← Modal soạn nội dung chapter
│   └── member/
│       ├── actions/
│       │   └── book.ts               ← getBook, getChapter, saveProgress
│       └── components/
│           ├── BookCard.tsx           ← Card hiển thị ở trang /books
│           ├── BookHero.tsx           ← Landing page của 1 book
│           ├── ChapterSidebar.tsx     ← TOC chapters khi đọc
│           └── ChapterReader.tsx      ← Nội dung chapter + nav prev/next
├── app/
│   ├── (admin)/admin/documents/
│   │   └── page.tsx                  ← Thêm tab "Books"
│   └── (member)/
│       ├── books/
│       │   └── page.tsx              ← Danh sách books
│       └── books/[slug]/
│           ├── page.tsx              ← Landing page book
│           └── [chapterSlug]/
│               └── page.tsx          ← Đọc chapter
```

---

## 3. Admin — Quản lý Books

### Tab trong `/admin/documents`
Thêm tab thứ 3 cạnh "Bài viết" và "Series": **"Books"**

### Trang list Books (`BookClient`)
- Bảng: Title, Số chapters, Audience, Published, Actions
- Nút **"Tạo book mới"** → modal nhập Title, Slug (auto), Description, Cover, Audience
- Nút **"Sửa chapters"** → điều hướng sang trang editor riêng

### Trang editor chapters (`/admin/books/[id]/chapters`)
- Danh sách chapters có thể **kéo thả** để sắp xếp lại `order`
- Mỗi chapter: Title, isFree toggle, nút Edit / Delete
- Nút **"Thêm chapter"** → modal soạn markdown + preview

---

## 4. Member — Đọc Book

### `/books` — Danh sách
- Grid `BookCard`: Cover, Title, Author, số chapters, Audience badge
- Filter theo audience (PUBLIC / MEMBERS / PREMIUM)

### `/books/[slug]` — Landing page
- Hero: Cover lớn, Title, Description, Author
- Danh sách chapters (click → đọc)
- Chapter `isFree` hiện nút "Đọc thử", còn lại gate theo audience
- Nút CTA: "Bắt đầu đọc" → chapter đầu tiên

### `/books/[slug]/[chapterSlug]` — Reader
```
┌─────────────────────────────────────────────┐
│  [Sidebar TOC]  │  [Chapter content]         │
│                 │                            │
│  ● Chapter 1    │  # Tiêu đề chapter         │
│  ● Chapter 2 ←  │                            │
│  ○ Chapter 3    │  Nội dung markdown...      │
│  ○ Chapter 4    │                            │
│                 │  ← Prev    Next →          │
└─────────────────────────────────────────────┘
```

**Sidebar (`ChapterSidebar`):**
- Danh sách tất cả chapters
- Highlight chapter đang đọc
- Icon check ✓ cho chapter đã đọc (từ `BookReadHistory`)
- Thu gọn được trên mobile (drawer)

**Footer navigation:**
- Prev chapter / Next chapter
- Tên chapter kế tiếp

**Reading progress:**
- Khi đọc xong 1 chapter (scroll xuống cuối) → tự động ghi `BookReadHistory`
- Quay lại landing page: hiện "Tiếp tục đọc → Chapter X"

---

## 5. Content Gating

| Chapter | `isFree` | Audience book | Hiển thị |
|---------|----------|---------------|----------|
| Chapter 1 | `true` | bất kỳ | Tất cả đọc được |
| Chapter N | `false` | PUBLIC | Tất cả đọc được |
| Chapter N | `false` | MEMBERS | Phải đăng nhập + role MEMBER+ |
| Chapter N | `false` | PREMIUM | Phải có role PREMIUM |

Dùng lại `ContentGate` component đang có sẵn.

---

## 6. Focus Mode

Chapter reader tự động tương thích Focus Mode vì dùng cùng `data-focus-*` attributes:
- Wrap content bằng `data-focus-prose`
- Wrap sidebar bằng `data-focus-hide`
- `<FocusMode readTime={chapter.readTime} headings={headings} />`

---

## 7. Actions cần implement

### Admin (`src/features/admin/actions/book.ts`)
```ts
createBookAction(data: BookFormData)
updateBookAction(id, data: BookFormData)
deleteBookAction(id)
getAllBooksAction()                         // admin list

createChapterAction(bookId, data)
updateChapterAction(id, data)
deleteChapterAction(id)
reorderChaptersAction(bookId, orders: {id, order}[])
```

### Member (`src/features/member/actions/book.ts`)
```ts
getBooksAction()                           // list published books
getBookBySlugAction(slug)                  // landing page
getChapterAction(bookSlug, chapterSlug)    // reader — check access
saveChapterProgressAction(chapterId)       // ghi read history
getBookProgressAction(userId, bookId)      // % chapters đã đọc
```

---

## 8. Thứ tự triển khai

### Bước 1 — Schema & Migration
- [ ] Thêm `Book`, `Chapter`, `BookReadHistory` vào schema
- [ ] `prisma db push`

### Bước 2 — Admin CRUD
- [ ] `src/features/admin/actions/book.ts`
- [ ] `BookClient.tsx` — list + create/edit modal
- [ ] Tab "Books" trong `/admin/documents`

### Bước 3 — Admin Chapter Editor
- [ ] Route `/admin/books/[id]/chapters`
- [ ] `BookEditorClient.tsx` — drag-to-reorder + CRUD chapters
- [ ] `ChapterEditorModal.tsx` — markdown editor + preview

### Bước 4 — Member Reader
- [ ] `src/features/member/actions/book.ts`
- [ ] `/books` page + `BookCard`
- [ ] `/books/[slug]` landing page + `BookHero`
- [ ] `/books/[slug]/[chapterSlug]` reader + `ChapterSidebar` + `ChapterReader`

### Bước 5 — Reading Progress
- [ ] Auto-save khi scroll xuống cuối chapter
- [ ] "Tiếp tục đọc" button trên landing page
- [ ] Checkmark trên TOC sidebar

### Bước 6 — Polish
- [ ] Focus Mode integration
- [ ] SEO metadata cho book và chapter pages
- [ ] Mobile responsive (drawer TOC)
- [ ] Thêm Books vào MemberHeader navigation

---

## 9. Ước tính độ phức tạp

| Bước | Mức độ |
|------|--------|
| Schema | Thấp |
| Admin CRUD | Trung bình |
| Chapter Editor | Trung bình (drag-to-reorder) |
| Member Reader | Trung bình |
| Reading Progress | Thấp |
| Polish / Focus Mode | Thấp |
