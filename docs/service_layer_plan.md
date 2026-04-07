# Kế hoạch thêm Service Layer

**Ngày:** 2026-04-06

## Vấn đề hiện tại

Actions đang làm quá nhiều việc cùng lúc:
- Validate input
- Kiểm tra authorization
- Gọi Prisma trực tiếp
- Business logic (scoring, filtering, recommendations)
- Side effects (notifications, events, cache invalidation)
- Transform data (DTOs)

Hiện có **27 action files** (~2,692 LOC) trải đều trên 6 feature modules, tất cả gọi `db.*` trực tiếp — không có abstraction layer nào.

---

## Kiến trúc mục tiêu

```
Client/Page
    ↓
Action (Server Action)       ← chỉ: validate input, auth check, call service, revalidate
    ↓
Service                      ← business logic + side effects
    ↓
Prisma (db.*)                ← raw DB
```

---

## Cấu trúc thư mục đề xuất

```
src/services/
├── article/
│   ├── article.service.ts        # CRUD, filtering, recommendation scoring
│   ├── comment.service.ts        # threaded comments
│   ├── like.service.ts           # like/unlike + trigger notification
│   └── bookmark.service.ts
├── user/
│   ├── auth.service.ts           # register, hash password, create onboarding
│   ├── profile.service.ts        # read/update profile
│   └── follow.service.ts         # follow/unfollow + trigger notification
├── admin/
│   ├── user-management.service.ts
│   ├── content.service.ts        # article + book CRUD từ admin
│   └── analytics.service.ts      # stats, counts
├── notification/
│   └── notification.service.ts   # create, push SSE, mark-read
└── shared/
    ├── access-control.service.ts  # getAudienceFilter(), requireAdmin()
    └── pagination.service.ts      # helper dùng chung
```

---

## Nguyên tắc phân chia trách nhiệm

| Layer | Làm gì | Không làm gì |
|---|---|---|
| **Action** | Parse FormData, validate schema (zod), kiểm tra session, gọi service, `revalidatePath()` | Gọi `db.*` trực tiếp, business logic |
| **Service** | Gọi `db.*`, business logic, emit events, tạo notification | Không biết `FormData`, không `revalidatePath()` |
| **Prisma** | Raw query | — |

---

## Thứ tự migrate

### Giai đoạn 1 — Shared & Notification (ít deps nhất)
1. `shared/access-control.service.ts` — extract `getAudienceFilter()`, `requireAdmin()`
2. `notification/notification.service.ts` — extract `createNotificationAction()` (đang bị gọi chéo giữa các actions)

### Giai đoạn 2 — Article (phức tạp nhất, lợi nhất)
3. `article/article.service.ts` — query filtering, scoring, recommendation
4. `article/like.service.ts`, `comment.service.ts`, `bookmark.service.ts`

### Giai đoạn 3 — User
5. `user/auth.service.ts` — register, password hash
6. `user/profile.service.ts`, `follow.service.ts`

### Giai đoạn 4 — Admin
7. `admin/user-management.service.ts`, `content.service.ts`, `analytics.service.ts`

---

## Ví dụ minh họa (before/after)

**Trước** — `like.ts` action làm tất cả:
```ts
export async function likeArticleAction(articleId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  const existing = await db.like.findUnique({ where: { ... } });
  if (existing) {
    await db.like.delete({ where: { ... } });
  } else {
    await db.like.create({ data: { ... } });
    await createNotificationAction(...);  // gọi action khác
  }
  revalidatePath('/article/' + articleId);
}
```

**Sau** — action mỏng, service xử lý logic:
```ts
// like.ts action
export async function likeArticleAction(articleId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  await likeService.toggle(session.user.id, articleId);
  revalidatePath('/article/' + articleId);
}
```

```ts
// like.service.ts
export const likeService = {
  async toggle(userId: string, articleId: string) {
    const existing = await db.like.findUnique({ where: { ... } });
    if (existing) {
      await db.like.delete({ where: { ... } });
    } else {
      await db.like.create({ data: { ... } });
      await notificationService.create(...);  // service gọi service
    }
  }
}
```

---

## Lưu ý khi implement

- **Không wrap Prisma vào repository class** — service object (plain object với methods) là đủ, không cần Repository pattern với quy mô hiện tại
- **Service không nhận `FormData`** — action parse trước, service nhận typed params
- **Validate bằng Zod ở action layer**, service trust input đã sạch
- **Migrate từng file một**, không rewrite hàng loạt — mỗi service xong thì action tương ứng mới cập nhật
- **Không tạo abstraction cho abstraction** — chỉ extract khi logic thực sự bị duplicate hoặc quá phức tạp để test trong action
