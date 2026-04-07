# Test Plan: Tạo Bài Viết (Article Creation)

## Tổng quan
Flow tạo bài viết gồm **3 bước (wizard)**:
- **Step 1** – Thông tin cơ bản (tiêu đề, slug, category, tags, ảnh, tóm tắt)
- **Step 2** – Nội dung (rich text editor, overview, objectives)
- **Step 3** – Xuất bản (audience, lịch đăng, tài nguyên đính kèm)

Server action chính: `createArticleAction(data: ArticleFormData)`

---

## 1. Unit Tests – Server Action (`createArticleAction`)

### 1.1 Happy path
| # | Test | Kết quả mong đợi |
|---|------|-----------------|
| U1 | Tạo bài viết với đủ thông tin hợp lệ, status `PUBLISHED` | Trả về `{ success: true, id }`, ghi DB, emit `ARTICLE_PUBLISHED` |
| U2 | Tạo bài viết với status `SCHEDULED` + `publishedAt` | Không emit event, publishedAt lưu đúng |
| U3 | Truyền `tags` mới chưa tồn tại | Tags được upsert và liên kết đúng |
| U4 | Truyền `tags` đã tồn tại trong DB | Không tạo trùng tag, dùng lại id |
| U5 | Truyền `resources` (tài nguyên đính kèm) | Resources được tạo và liên kết với article |

### 1.2 Lỗi & edge cases
| # | Test | Kết quả mong đợi |
|---|------|-----------------|
| U6 | Slug đã tồn tại trong DB | Trả về `{ success: false, error: 'Slug đã tồn tại.' }` |
| U7 | Gọi action khi không phải ADMIN | Throw `Error('Unauthorized')` |
| U8 | `content` rỗng | Lưu với content = `''`, `readTime` = 1 |
| U9 | `title` rỗng | Ghi DB không validate (validation ở client) |

### 1.3 Hàm `toSlug`
| # | Test | Input → Output |
|---|------|---------------|
| U10 | Chuỗi tiếng Việt có dấu | `"Học DevOps"` → `"hoc-devops"` |
| U11 | Ký tự đặc biệt | `"React 18 & Node.js!"` → `"react-18-nodejs"` |
| U12 | Khoảng trắng nhiều | `"Hello   World"` → `"hello-world"` |

---

## 2. Integration Tests – API / DB

| # | Test | Kiểm tra |
|---|------|---------|
| I1 | Tạo article → kiểm tra DB có record đúng | Các field khớp với input |
| I2 | Tạo article → `revalidatePath` được gọi | Cache `/admin/documents` và `/dashboard` invalidate |
| I3 | Tạo article published → event bus emit | `ARTICLE_PUBLISHED` event được gửi với đúng payload |
| I4 | Tạo 2 article cùng slug | Bài thứ 2 bị block, trả về error |

---

## 3. Component Tests – Wizard Steps

### Step 1 – `ArticleStep1`
| # | Test |
|---|------|
| C1 | Nhập tiêu đề → slug tự điền |
| C2 | Chỉnh slug thủ công → không bị override khi tiêu đề đổi |
| C3 | Không có tiêu đề → nút "Tiếp theo" disabled |
| C4 | Upload ảnh cover → preview hiển thị |
| C5 | Thêm / xóa tag hoạt động đúng |

### Step 2 – `ArticleStep2`
| # | Test |
|---|------|
| C6 | Editor hiển thị đúng, nhập nội dung được |
| C7 | Nút "Quay lại" → về Step 1 không mất dữ liệu |
| C8 | Nội dung rỗng → vẫn cho "Tiếp theo" (validated ở Step 3) |

### Step 3 – `ArticleStep3`
| # | Test |
|---|------|
| C9 | Chọn "Đăng ngay" → không hiện date picker |
| C10 | Chọn "Hẹn giờ" → date picker xuất hiện |
| C11 | Hẹn giờ nhưng không chọn ngày → block submit |
| C12 | Thêm tài nguyên đính kèm → hiển thị trong danh sách |
| C13 | Nhấn "Xuất bản" → gọi `createArticleAction` với đúng data |
| C14 | Action thành công → redirect `/admin/documents` |
| C15 | Action thất bại → hiển thị thông báo lỗi |

---

## 4. E2E Tests (Playwright / Cypress)

| # | Kịch bản | Bước |
|---|---------|------|
| E1 | **Happy path – Đăng ngay** | Đăng nhập admin → Vào `/admin/articles/new` → Điền Step 1 → Điền Step 2 → Chọn "Đăng ngay" → Submit → Kiểm tra redirect và bài xuất hiện trong danh sách |
| E2 | **Happy path – Hẹn giờ** | Như E1, chọn "Hẹn giờ" → đặt ngày tương lai → Submit → Kiểm tra status `SCHEDULED` |
| E3 | **Slug trùng** | Tạo 2 bài cùng tiêu đề → Bài 2 hiện thông báo lỗi slug |
| E4 | **Không phải admin** | Truy cập `/admin/articles/new` khi chưa login → Redirect về login |
| E5 | **Bảo toàn state** | Điền Step 1 → qua Step 2 → Quay lại → Data Step 1 còn nguyên |
| E6 | **Với tài nguyên đính kèm** | Đính kèm file ở Step 3 → Submit → Kiểm tra resource trong DB |

---

## 5. Công cụ đề xuất

| Layer | Tool |
|-------|------|
| Unit | **Jest** + `@testing-library/react` |
| Server action mock | **jest-mock** + Prisma mock (`@prisma/client/testing`) |
| E2E | **Playwright** (đã phù hợp với Next.js App Router) |
| DB test | Prisma với test DB riêng hoặc `jest-mock-extended` |

---

## 6. Thứ tự ưu tiên

1. 🔴 **Cao** – U1, U6, U7, E1, E4 (core flow + security)
2. 🟡 **Trung** – U2, U3, C1–C5, E2, E5
3. 🟢 **Thấp** – U10–U12 (utility functions), E6
