# SEO Audit & Plan — 2026-04-11

> Audit thực trạng SEO của Lenote và đề xuất kế hoạch fix.
> Bổ sung cho `docs/seo-tasks.md` (file đó là roadmap, file này là audit hiện trạng).

## TL;DR

| Mức độ | Số lượng |
|---|---|
| 🔴 Bug / blocker  | 4 |
| 🟠 High impact    | 6 |
| 🟡 Medium / nice  | 8 |

Kiến trúc SEO cơ bản đã có (sitemap, robots, dynamic metadata, JSON-LD, OG image generator, content gate). Phần lớn vấn đề nằm ở **chi tiết triển khai** không khớp giữa các file → ảnh hưởng index, branding, performance.

---

## 🔴 Bug / Blocker — phải sửa trước khi làm SEO push

### B1. `generateMetadata` của article không respect `audience`
**File:** `src/app/(member)/article/[slug]/page.tsx:40`
```ts
robots: { index: true, follow: true },
```
Hiện trạng: **mọi** bài viết (kể cả `audience === 'PRIVATE'`) đều `index: true`. Điều này phá thẳng yêu cầu trong `seo-tasks.md` mục 1: *"robots: noindex nếu audience === 'PRIVATE'"*.

**Hậu quả:** bài PRIVATE có thể bị Google index → leak nội dung nội bộ.

**Fix:**
```ts
const isPrivate = article.audience === 'PRIVATE';
robots: isPrivate
  ? { index: false, follow: false }
  : { index: true,  follow: true },
```

### B2. `NEXT_PUBLIC_BASE_URL` fallback **khác nhau** giữa các file
| File | Fallback |
|---|---|
| `src/app/layout.tsx:13`              | `https://lenote.dev` |
| `src/app/(member)/article/[slug]/page.tsx:23` | `https://lenote.dev` |
| `src/app/sitemap.ts:4`               | `https://ks40.academy` |
| `src/app/robots.ts:3`                | `https://ks40.academy` |

**Hậu quả:** Khi env var không set (preview / staging / lỡ deploy), `sitemap.xml` và `robots.txt` sẽ trỏ tới domain **khác** với `metadataBase` của các trang → Google nhận URL không khớp canonical, sitemap unreachable.

**Fix:** Tập trung vào 1 hằng số duy nhất:

```ts
// src/lib/seo.ts
export const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://lenote.dev';
```
Rồi import từ tất cả các file trên. Xoá fallback rải rác.

### B3. Branding không nhất quán: "Lenote" vs "KS4.0 Academy"
| Vị trí | Tên dùng |
|---|---|
| `layout.tsx` `metadata.title.default` | **Lenote** |
| `layout.tsx` `keywords[0]`            | `KS4.0` |
| `layout.tsx` `authors[].name`         | **KS4.0 Academy** |
| `layout.tsx` `twitter.title`          | **KS4.0 Academy** |
| `article/[slug]/page.tsx` JSON-LD `publisher.name` | **KS4.0 Academy** |
| `manifest.ts` `name`                  | **Lenote** |
| `og/route.tsx`                        | **Lenote** |

**Hậu quả:** Google Knowledge Graph, social card preview, breadcrumb hiển thị 2 brand → confuse user, loãng entity recognition.

**Fix:** Chọn 1 brand chính (theo manifest/og/title hiện tại có vẻ đang về **Lenote**), update `twitter.title`, `authors`, `publisher`, `keywords` cho khớp.

### B4. `<link>` Material Icons render-blocking
**File:** `src/app/layout.tsx:64`
```tsx
<head>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
</head>
```
**Hậu quả:** Render-blocking CSS từ third party → ảnh hưởng **LCP** (Core Web Vital ranking factor). Đặc biệt nghiêm trọng vì `next/font` đã được dùng cho Inter ở ngay trên — không có lý do dùng fonts.googleapis cho icons.

**Fix:** Hoặc (a) bỏ Material Icons hoàn toàn nếu codebase đã dùng `lucide-react`, hoặc (b) thay bằng `next/font/google` import + `display: swap`.

---

## 🟠 High impact

### H1. 19 file dùng `<img>` thay vì `next/image`
Grep: `<img` xuất hiện trong 19 file (admin + member + shared). Bao gồm `BookCard`, `BookHero`, `Avatar`, `MarkdownViewer`, profile pages, books pages…

**Hậu quả:**
- Không có lazy loading mặc định → tải ảnh dưới fold ngay từ đầu, hỏng LCP & FCP.
- Không serve AVIF/WebP responsive → tốn băng thông.
- CLS cao vì không có `width/height` placeholder.

**Fix:** Migrate sang `next/image` theo nhóm ưu tiên:
1. Above-the-fold: `ArticleHero` cover, `BookHero`, `Avatar` trên list view, thumbnail card.
2. Trong `MarkdownViewer` — cần custom renderer vì markdown trả về `<img>`.

### H2. JSON-LD article — `image` có thể là URL tương đối
**File:** `article/[slug]/page.tsx:113`
```ts
...(image && { image }),
```
Trong khi `image` lấy từ `data.thumbnail ?? data.cover` — đây có thể là path tương đối `/uploads/...`. Schema.org yêu cầu **absolute URL**.

**Fix:**
```ts
const absImage = image
  ? (image.startsWith('http') ? image : `${BASE_URL}${image}`)
  : null;
```

Ngoài ra nên bổ sung:
- `dateModified` (từ `updatedAt`)
- `mainEntityOfPage: { '@type': 'WebPage', '@id': url }`
- `wordCount` (đếm từ `content`)
- `inLanguage: 'vi-VN'`

### H3. Sitemap thiếu `/topic/[slug]` và `/profile/[id]` của tác giả publish bài
**File:** `src/app/sitemap.ts`

Hiện chỉ có `/`, `/login`, `/register`, `/article/[slug]`. Bỏ lỡ:
- Trang topic (gateway URL được crawl rất tốt cho category SEO).
- Profile tác giả (E-E-A-T signal quan trọng).
- Trang `/topics`, `/books`, `/books/[slug]` nếu public.

**Fix:** Thêm topic & author routes vào `sitemap()`.

### H4. Trang topic thiếu canonical, OG, image
**File:** `src/app/(member)/topic/[slug]/page.tsx:12-20`

```ts
return {
  title: `${topic.label} | Lenote`,
  description: `Khám phá các bài viết về ${topic.label} trên Lenote`,
};
```
Thiếu: `alternates.canonical`, `openGraph`, `twitter`, `robots`, OG image (có thể tận dụng `/og?title=...&color=...`).

### H5. Home page `/` không có metadata riêng cho landing
**File:** `src/app/(member)/page.tsx`

Khi guest truy cập, render `<LandingPage />` nhưng metadata vẫn dùng `default` của root layout. Trang landing nên có:
- `title` mô tả value proposition (vd "Lenote — Học công nghệ đỉnh cao")
- `description` dài khoảng 150-160 ký tự, có CTA
- OG image landing riêng

### H6. `icons` đều là `/logo.png` (1200×1200)
**File:** `src/app/layout.tsx:42-45`
```ts
icons: { icon: '/logo.png', shortcut: '/logo.png', apple: '/logo.png' },
```
Đã có `icon-192.png`, `icon-512.png` trong `public/` (do manifest dùng), favicon.ico tồn tại. Dùng logo 1200×1200 cho favicon → browser scale xấu, tốn KB.

**Fix:**
```ts
icons: {
  icon:     [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
             { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
  shortcut: '/favicon.ico',
  apple:    '/icon-512.png',
},
```

---

## 🟡 Medium / Nice-to-have

### M1. Thiếu `export const viewport` (Next 15+)
Next mới khuyến nghị tách `viewport` khỏi `metadata`. Hiện không khai báo → màu theme bar trên mobile mặc định.

```ts
// layout.tsx
export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
};
```

### M2. Twitter card thiếu `creator`/`site` handle
Không có `@handle` → Twitter không attribute card về account.

### M3. Sitemap không phân chunk khi >50k URLs
Hiện trả tất cả articles 1 sitemap. Nếu nội dung tăng, vượt 50k Google sẽ reject. Plan dùng `generateSitemaps()` của Next khi article > 5000.

### M4. Robots disallow nội bộ chưa khớp với seo-tasks
`seo-tasks.md` ghi disallow `/dashboard/`, file thực tế `robots.ts:10` không có. Nếu không có route `/dashboard` thì OK, nhưng nên thống nhất tài liệu vs code.

### M5. Trang `bookmarks/history/notifications/settings` không có metadata noindex
Hiện chỉ chặn ở `robots.txt` (Disallow). Nên bổ sung `metadata.robots = { index: false }` để chắc — nhiều bot bypass robots.txt.

### M6. Manifest `theme_color` không khớp `viewport.themeColor` (chưa có)
Sau khi thêm M1 thì sync giá trị `#6366f1`.

### M7. JSON-LD `Organization` ở root layout không có `sameAs`
**File:** `layout.tsx:73`
```ts
sameAs: [],
```
Trống. Thêm Twitter, GitHub, LinkedIn → giúp Knowledge Graph link entity.

### M8. `getArticlePreviewAction` cần đảm bảo đủ ~300 chữ thật để Google index
Verify rằng preview content render trong HTML SSR (không phải sau client hydration). Nếu rendered server-side với truncate đúng → OK; nếu phải JS load thêm → mất giá trị SEO.

---

## Roadmap đề xuất

### Sprint 1 — Blocker fix (1 buổi)
1. **B1** noindex private articles
2. **B2** centralize `SITE_URL` ở `src/lib/seo.ts`, refactor 4 file
3. **B3** thống nhất brand → "Lenote"
4. **B4** loại Material Icons hoặc convert sang `next/font`

### Sprint 2 — High impact (1-2 ngày)
5. **H6** fix icons mapping
6. **H2** absolute URL + bổ sung field cho JSON-LD article
7. **H3** sitemap thêm topic + author routes
8. **H4** topic page metadata đầy đủ
9. **H5** landing page metadata riêng

### Sprint 3 — Performance (cần đo, ước lượng 2-3 ngày)
10. **H1** migrate `<img>` → `next/image`, ưu tiên above-the-fold
11. **M1** `export const viewport`
12. Đo Lighthouse trước/sau, target LCP < 2.5s, CLS < 0.1

### Sprint 4 — Polish
13. **M3** `generateSitemaps()` chunking khi cần
14. **M5** noindex meta cho member-only pages
15. **M7** populate `Organization.sameAs`
16. **M2** Twitter handle
17. **M8** verify preview content trong SSR HTML

---

## Verification checklist (sau khi fix)

- [ ] `curl -s https://lenote.dev/sitemap.xml | head` — đúng domain, có topic + profile
- [ ] `curl -s https://lenote.dev/robots.txt` — sitemap URL khớp
- [ ] `curl -s https://lenote.dev/article/{slug-private} | grep noindex` — private thấy noindex
- [ ] [Rich Results Test](https://search.google.com/test/rich-results) — Article schema pass
- [ ] [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [ ] Lighthouse SEO ≥ 95, Performance ≥ 80
- [ ] OG image preview trên Twitter Card Validator + Facebook Sharing Debugger
- [ ] Search Console: submit sitemap, request indexing 5 bài top
- [ ] Branding entity duy nhất ("Lenote") trong tất cả meta + schema + manifest
