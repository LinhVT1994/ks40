# SEO Implementation Tasks

## Chiến lược theo audience

| Audience | Index | Content hiển thị | Ghi chú |
|----------|-------|-----------------|---------|
| `PUBLIC` | ✅ Full | Toàn bộ | SEO đầy đủ |
| `MEMBERS` | ✅ Partial | ~300 chữ đầu + blur gate | `isAccessibleForFree: false` |
| `PREMIUM` | ✅ Partial | ~300 chữ đầu + blur gate | `isAccessibleForFree: false` |
| `PRIVATE` | ❌ Noindex | Không hiển thị | `robots: noindex` |

---

## Phase 1 — Core (High Impact)

### 1. Dynamic Metadata cho Article Page
- [x] Tạo `generateMetadata` trong `src/app/(member)/article/[slug]/page.tsx`
  - [x] Dynamic `title` và `description` từ article data
  - [x] Open Graph: `og:title`, `og:description`, `og:image` (thumbnail/cover), `og:type: article`
  - [x] Twitter Card: `twitter:card`, `twitter:title`, `twitter:image`
  - [x] `publishedTime`, `authors`, `tags` trong `openGraph.article`
  - [x] `robots: noindex` nếu `audience === 'PRIVATE'`
  - [x] Fallback nếu article không tồn tại (404)

### 2. Content Gate cho bài MEMBERS / PREMIUM
- [x] Chỉ trả về ~300 chữ đầu khi chưa đăng nhập / chưa đủ quyền (`getArticlePreviewAction`)
  - [x] Server-side truncate content trước khi render
  - [x] Fade gradient + CTA đăng nhập / nâng cấp
  - [x] Google crawl được title, description, ~300 chữ preview
- [x] Tạo component `ContentGate`
  - [x] Fade overlay + nút "Đăng nhập" / "Đăng ký miễn phí" / "Nâng cấp Premium"

### 3. Sitemap động
- [x] Tạo `src/app/sitemap.ts`
  - [x] Lấy tất cả published article slugs từ DB (bỏ `PRIVATE`)
  - [x] Static routes: `/`, `/login`, `/register`
  - [x] `lastModified` từ `updatedAt`, `priority` theo audience

### 4. Robots.txt
- [x] Tạo `src/app/robots.ts`
  - [x] Allow: `/article/`, `/profile/`, `/`
  - [x] Disallow: `/admin/`, `/dashboard/`, `/api/`
  - [x] Khai báo sitemap URL

### 5. Root Layout Metadata nâng cao
- [x] Cập nhật `src/app/layout.tsx`
  - [x] `metadataBase` với domain từ `NEXT_PUBLIC_BASE_URL`
  - [x] `title.template` cho các trang con
  - [x] Open Graph + Twitter Card mặc định
  - [x] `keywords`, `authors`, `creator`

---

## Phase 2 — Rich Snippets & Technical SEO

### 6. JSON-LD Structured Data cho Article
- [x] Tạo component `JsonLd` (`src/components/shared/JsonLd.tsx`)
- [x] Schema `BlogPosting`: `headline`, `description`, `image`, `author`, `datePublished`, `url`
- [x] `isAccessibleForFree: false` + `hasPart.cssSelector` cho bài MEMBERS/PREMIUM
- [x] Schema `BreadcrumbList`: Home > Category > Article
- [ ] Schema `Organization` ở root layout

### 7. Canonical URL
- [x] `alternates.canonical` trong `generateMetadata` của article page
- [x] `alternates.canonical` trong `generateMetadata` của profile page
- [ ] Canonical mặc định ở root layout

### 8. Metadata cho các page còn lại
- [x] Profile page (`/profile/[id]`) — title, description, OG, Twitter
- [ ] Shared docs page (`/shared/docs/[slug]`) — nếu muốn public index

---

## Phase 3 — Optional / Nice-to-have

### 9. Open Graph Image tự động
- [x] Tạo `src/app/og/route.tsx` dùng `next/og`
  - [x] Generate ảnh OG động với title + author + category badge
  - [x] Fallback cho article page khi không có thumbnail/cover

### 10. PWA Manifest
- [x] Tạo `src/app/manifest.ts`
  - [x] `name`, `short_name`, `icons`, `theme_color`, `background_color`
  - [ ] Thêm file `public/icon-192.png` và `public/icon-512.png`

### 11. Performance SEO
- [ ] Kiểm tra Core Web Vitals (LCP, CLS, FID)
- [ ] Lazy load images với `next/image` đầy đủ
- [ ] Review bundle size với `@next/bundle-analyzer`

---

## Notes
- **Quan trọng**: Truncate content server-side, không dùng JS hide — Google đọc được JS nhưng không đáng tin cậy bằng HTML
- **Không dùng** `display: none` cho phần content ẩn — Google có thể bỏ qua, dùng blur/opacity thay thế
- `isAccessibleForFree: false` trong JSON-LD báo hiệu Google đây là paywall hợp lệ, tránh bị penalize
- `metadataBase` cần set đúng domain production trước khi deploy
- Phase 1 (#1–5) đủ để Google index và hiển thị bài trên SERP
- Phase 2 (#6–8) giúp xuất hiện rich snippets
