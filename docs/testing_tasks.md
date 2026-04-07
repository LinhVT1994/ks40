# Testing Tasks – Article Creation

> Dựa trên: [article_creation_test_plan.md](./article_creation_test_plan.md)  
> Tool: **Vitest** (unit/component) · **Playwright** (E2E)  
> File test: `__tests__/actions/article.test.ts`

---

## Unit Tests – `createArticleAction`

### Happy path
- [x] U1 – Tạo bài viết hợp lệ, status `PUBLISHED` → trả về `{ success: true, id }`, emit event
- [x] U2 – Status `SCHEDULED` → không emit event
- [ ] U3 – Tags mới → upsert và liên kết đúng
- [ ] U4 – Tags đã tồn tại → không tạo trùng
- [ ] U5 – Có `resources` → tạo và liên kết với article

### Lỗi & edge cases
- [x] U6 – Slug đã tồn tại → `{ success: false, error: 'Slug đã tồn tại.' }`
- [x] U7 – Không phải ADMIN → throw `Unauthorized`
- [ ] U8 – `content` rỗng → `readTime` = 1
- [ ] U9 – `title` rỗng → vẫn ghi DB (validate ở client)

### Hàm `toSlug`
- [ ] U10 – Tiếng Việt có dấu: `"Học DevOps"` → `"hoc-devops"`
- [ ] U11 – Ký tự đặc biệt: `"React 18 & Node.js!"` → `"react-18-nodejs"`
- [ ] U12 – Khoảng trắng nhiều: `"Hello   World"` → `"hello-world"`

---

## Component Tests – Wizard Steps

### Step 1 – `ArticleStep1`
- [ ] C1 – Nhập tiêu đề → slug tự điền
- [ ] C2 – Sửa slug thủ công → không bị override
- [ ] C3 – Thiếu tiêu đề → nút "Tiếp theo" disabled
- [ ] C4 – Upload ảnh cover → preview hiển thị
- [ ] C5 – Thêm / xóa tag hoạt động đúng

### Step 2 – `ArticleStep2`
- [ ] C6 – Editor hiển thị, nhập nội dung được
- [ ] C7 – "Quay lại" → về Step 1, không mất data
- [ ] C8 – Nội dung rỗng → vẫn qua được Step 3

### Step 3 – `ArticleStep3`
- [ ] C9  – "Đăng ngay" → không hiện date picker
- [ ] C10 – "Hẹn giờ" → date picker xuất hiện
- [ ] C11 – Hẹn giờ không chọn ngày → block submit
- [ ] C12 – Thêm tài nguyên → hiện trong danh sách
- [ ] C13 – Submit → gọi `createArticleAction` đúng data
- [ ] C14 – Action thành công → redirect `/admin/documents`
- [ ] C15 – Action thất bại → hiện thông báo lỗi

---

## E2E Tests – Playwright

- [ ] E1 – Happy path: đăng ngay → bài xuất hiện trong danh sách
- [ ] E2 – Hẹn giờ → status `SCHEDULED`
- [ ] E3 – Slug trùng → hiện lỗi ở bài thứ 2
- [ ] E4 – Chưa đăng nhập → redirect về login
- [ ] E5 – Quay lại Step 1 → data còn nguyên
- [ ] E6 – Đính kèm file ở Step 3 → resource lưu vào DB

---

## Ghi chú
- Chạy unit test: `npm test`
- Chạy 1 file: `npx vitest run __tests__/actions/article.test.ts`
- Watch mode: `npm run test:watch`
