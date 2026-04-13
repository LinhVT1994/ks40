# Article Rating — Implementation Plan

> Đánh giá bài viết theo hướng **🅐 5-sao cổ điển + review ngắn**, có gating đọc ≥70%, notification cho tác giả, và author dashboard.

**Ngày lập:** 2026-04-12
**Owner:** TBD
**Liên quan:** `docs/seo-audit-2026-04.md` (mục AggregateRating JSON-LD sẽ được hưởng lợi)

---

## Scope

### In scope
- [x] Rating 1–5 sao + text review ngắn (tùy chọn)
- [x] Gating: chỉ user đã đọc `readHistory.progress ≥ 70` mới rate được
- [x] 1 rating / user / bài, edit được (update-in-place, không insert mới)
- [x] Không cho rate bài của chính mình
- [x] Notification cho tác giả khi có rating mới / rating bị cập nhật
- [x] Author dashboard: xem tổng quan rating bài của mình
- [x] JSON-LD `AggregateRating` → rich snippet ⭐ SERP
- [x] Distribution bar (1★ → 5★ count) public dưới mỗi bài
- [x] Hiển thị trung bình + count ở card bài (ArticleCard) — optional phase 2

### Out of scope (phase sau)
- [ ] Multi-dimension rating (độ dễ hiểu / hữu ích / chiều sâu / thực tế)
- [ ] Review moderation (flag spam, admin xóa)
- [ ] Reply của author vào review
- [ ] Like / helpful vote trên review
- [ ] Cho phép rate **book** / **chapter** (hiện chỉ article)

---

## UX / UI

### 1. Vị trí
Dưới `ArticleResources`, trên `ArticleComments` — cuối bài nhưng trước comment thread.

### 2. Trạng thái
| Điều kiện | Hiển thị |
|---|---|
| Chưa login | "Đăng nhập để đánh giá" + avg rating read-only |
| Đã login, là tác giả | "Đây là bài của bạn" + avg rating read-only (không cho rate) |
| Đã login, chưa đọc đủ 70% | Disabled: "Đọc thêm X% để đánh giá" + progress bar nhỏ |
| Đã login, đủ điều kiện, chưa rate | 5 sao trống clickable + textarea optional |
| Đã login, đã rate | 5 sao với giá trị đã chọn + text hiện tại + nút "Chỉnh sửa" / "Xóa đánh giá" |

### 3. Component structure
```
ArticleRating (new)
├── AverageDisplay       — ⭐ 4.6 / 5 · 128 đánh giá + distribution bar
├── RatingForm           — 5 sao hover / click + textarea + submit
└── UserReviewSummary    — review của chính user + edit/delete actions
```

### 4. Interaction details
- Hover sao → preview fill, click → chọn. Có thể click lại sao đã chọn để hạ (ví dụ từ 4→3).
- Text review `maxLength={300}`, counter góc dưới.
- Submit button chỉ enable khi `score > 0` (text optional).
- Optimistic update với `useTransition` + revert nếu action fail.
- Toast `sonner` on success/error.
- Edit mode inline: bấm "Chỉnh sửa" → form hiện lại với giá trị cũ.
- Delete confirm: bấm "Xóa đánh giá" → toast confirm action trước khi gọi server.

### 5. Distribution bar
```
5 ★ ████████████░░ 72%
4 ★ ████░░░░░░░░░░ 18%
3 ★ ██░░░░░░░░░░░░  6%
2 ★ █░░░░░░░░░░░░░  3%
1 ★ ░░░░░░░░░░░░░░  1%
```
Tailwind bar dùng `bg-yellow-400` + width % — không cần chart lib.

---

## Data model

### Schema mới

```prisma
model ArticleRating {
  userId    String
  articleId String
  score     Int       // 1..5, @db.SmallInt
  review    String?   // max 300 chars, enforce ở app
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  user    User    @relation(fields: [userId],    references: [id], onDelete: Cascade)
  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@id([userId, articleId])
  @@index([articleId])
  @@index([userId])
}
```

### Relation thêm vào `User` và `Article`
```prisma
model User    { ... ratings ArticleRating[] }
model Article { ... ratings ArticleRating[] }
```

### Migration
`npx prisma db push` (consistent với migration pattern hiện tại của project — DB đã có drift) hoặc `prisma migrate dev --name add_article_rating` nếu muốn migration file chuẩn chỉnh.

### NotificationType
Mở rộng enum:
```prisma
enum NotificationType {
  LIKE
  COMMENT_REPLY
  FOLLOW
  ARTICLE_PUBLISHED
  RATING              // ← mới
}
```

---

## Server actions

File mới: `src/features/articles/actions/rating.ts`

### 1. `getArticleRatingSummaryAction(articleId)`
Trả:
```ts
{
  averageScore: number;      // 4.62 (2dp)
  totalCount:   number;
  distribution: [number, number, number, number, number]; // count theo 1★→5★
  userRating:   { score: number; review: string | null } | null;
  canRate:      { eligible: boolean; reason?: 'unauthenticated' | 'is_author' | 'not_enough_progress'; progress?: number };
}
```
- Dùng ở article page để render initial state (server component).
- Query gồm: avg + count + groupBy score + findUnique cho user hiện tại + check readHistory.

### 2. `upsertRatingAction(articleId, score, review?)`
- Auth required, return `{ success, error? }`
- Validate:
  - `score ∈ [1,5]`
  - `review?.trim().length ≤ 300`
  - User không phải author (`article.authorId !== userId`)
  - `readHistory.progress ≥ 70` (`findUnique({ userId_articleId })`)
- `db.articleRating.upsert(...)` — insert or update
- **Notification**: nếu là rating **mới** (không phải update), gọi `createNotificationAction(authorId, 'RATING', 'X đã đánh giá bài viết của bạn N sao', { message, link })` — fire-and-forget với try/catch (pattern đã chuẩn hóa)
- **Event bus**: emit `RATING_POSTED` để Activity Log + analytics (optional phase 1)
- `revalidatePath('/article/[slug]')`

### 3. `deleteRatingAction(articleId)`
- Auth required
- Xóa `articleRating` theo compound key
- Revalidate

### 4. Event bus (mở rộng `src/lib/events/bus.ts`)
```ts
EVENTS.RATING_POSTED = 'rating.posted'
```

---

## Author dashboard

### Route mới
`src/app/(member)/write/ratings/page.tsx` — hoặc lồng vào trang `/write` hiện có (profile member có "Bài viết của tôi"?). Cần verify route hiện tại trước khi quyết định.

### Nội dung
1. **Tổng quan** (card header):
   - Tổng rating nhận được
   - Điểm trung bình toàn bộ bài
   - Số bài có ≥1 rating
2. **Bảng per-article**:
   | Bài viết | Avg | Count | Dist (mini bar) | Rating gần nhất |
   |---|:-:|:-:|---|---|
   Sort by avg desc / count desc / recent
3. **Recent reviews feed**:
   - List 20 review gần nhất có text (không chỉ score)
   - Hiển thị: avatar + name + bài + score + text + thời gian
   - Click → đi tới bài viết neo tại rating đó

### Server action
`getAuthorRatingsAction(options)` — filter theo `article.authorId = userId`, aggregate + join.

### Access control
Check role OR canWrite — tái dùng pattern `/write/*` hiện tại.

---

## SEO — AggregateRating JSON-LD

Trong `src/app/(member)/article/[slug]/page.tsx`, khi render `BlogPosting` schema, **chỉ khi `totalCount > 0`** mới chèn:

```ts
...(ratingSummary.totalCount > 0 && {
  aggregateRating: {
    '@type':      'AggregateRating',
    ratingValue:  ratingSummary.averageScore,
    reviewCount:  ratingSummary.totalCount,
    bestRating:   5,
    worstRating:  1,
  },
}),
```

→ Google hiển thị sao vàng trên SERP (rich snippet). **Phải có ≥1 rating** mới được hợp lệ.

Reference: `docs/seo-audit-2026-04.md` mục H2 đã ghi nhận thiếu aggregate rating.

---

## Test plan

### Unit tests (`__tests__/actions/rating.test.ts`)
Pattern giống `article.test.ts`:

| ID | Mô tả |
|---|---|
| R1 | `upsert` thành công với user đủ điều kiện (đọc ≥70%, không phải author) |
| R2 | Reject khi chưa login → `{ success: false }` |
| R3 | Reject khi user là author của bài |
| R4 | Reject khi `progress < 70` |
| R5 | Reject khi `score` ngoài [1,5] |
| R6 | Reject khi `review.length > 300` |
| R7 | Update rating cũ (upsert existing) → KHÔNG emit notification mới |
| R8 | Insert rating mới → EMIT notification tới author |
| R9 | `delete` rating của chính user thành công |
| R10 | `delete` rating user khác → fail |
| R11 | `getArticleRatingSummaryAction` trả đúng distribution + avg |
| R12 | `canRate.reason = 'is_author'` khi user là tác giả |

### Manual test (sau khi có UI)
1. Mở bài, chưa đọc đủ → form disabled + progress hint
2. Scroll đọc đến >70% → form enable (phải trigger lại `upsertReadHistoryAction` tự động — đã có)
3. Chọn 4 sao + text → submit → thấy thay đổi realtime
4. Refresh → thấy rating đã lưu
5. Edit → đổi sang 5 sao → submit → update
6. Login account khác, vào bài đó → thấy avg tăng
7. Tác giả nhận notification realtime (SSE đã có sẵn)
8. Delete → avg cập nhật

---

## Files ảnh hưởng

### New
- `prisma/schema.prisma` (+ `ArticleRating` model, `+ RATING` vào enum `NotificationType`)
- `src/features/articles/actions/rating.ts`
- `src/features/member/components/ArticleRating.tsx` (client component chính)
- `src/features/member/components/ArticleRating/AverageDisplay.tsx` (sub)
- `src/features/member/components/ArticleRating/RatingForm.tsx` (sub)
- `src/features/member/components/ArticleRating/RatingDistribution.tsx` (sub)
- `src/app/(member)/write/ratings/page.tsx` (author dashboard)
- `__tests__/actions/rating.test.ts`

### Modified
- `src/app/(member)/article/[slug]/page.tsx` — fetch rating summary, render `<ArticleRating />`, include `AggregateRating` vào JSON-LD
- `src/lib/events/bus.ts` — thêm `RATING_POSTED`
- `src/features/notifications/actions/notification.ts` — nếu cần format đặc biệt cho type RATING (likely không)
- `prisma/seed.ts` — optional, seed vài rating để dev

---

## Implementation order (suggested)

### Sprint A — Backend foundation (0.5 ngày)
1. Schema + `db push` + `generate`
2. `rating.ts` actions (4 hàm)
3. Unit tests R1–R12
4. Verify `tsc` + test pass

### Sprint B — Article page UI (0.5 ngày)
5. `ArticleRating` + 3 sub-components
6. Tích hợp vào `article/[slug]/page.tsx` (server fetch summary, pass xuống client)
7. Optimistic update + toast
8. AggregateRating JSON-LD

### Sprint C — Notification + Event (0.2 ngày)
9. Thêm enum `RATING`, gọi `createNotificationAction` trong `upsertRatingAction`
10. Verify SSE push hoạt động với type mới (có thể cần icon trong UI notification dropdown)

### Sprint D — Author dashboard (0.5 ngày)
11. `getAuthorRatingsAction`
12. Trang `/write/ratings`
13. Link vào header / sidebar của khu vực author

### Sprint E — Polish
14. Hiển thị avg + count nhỏ trên `ArticleCard` (optional)
15. Seed data cho dev
16. Manual QA checklist

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| User rate ẩu không đọc bài → signal kém | Gating `progress ≥ 70%` (readHistory đã có) |
| Thay đổi liên tục → spam notification | Chỉ notify khi rating **mới**, không notify trên update |
| DB drift (vì project đã drift) | Dùng `db push` thay vì `migrate dev` — đã có precedent |
| AggregateRating JSON-LD invalid khi 0 rating | Conditional — chỉ render khi `totalCount > 0` |
| Rate bài mình (author) bẻ gian điểm | Block ở cả UI và server validation |
| Progress chưa được update kịp khi user scroll | Đã có `upsertReadHistoryAction` — verify nó trigger đủ sớm |

---

## Confirmed

- [x] Gating 70% — **giữ nguyên 70%**
- [x] Review text tối đa **300 ký tự** — OK
- [x] Author dashboard → **tab "Đánh giá" trong `/profile/[id]`** (không dùng `/write/ratings`)
- [x] Phase 1 **có** hiển thị avg star trên ArticleCard
- [x] Admin moderation **có** ở phase 1 (ẩn/hiện + xóa vĩnh viễn)
