# SNS Feature Plan - KS40

Tài liệu này phác thảo các tính năng chia sẻ mạng xã hội (SNS) nhằm tăng cường khả năng lan tỏa và nhận diện thương hiệu cho hệ thống tri thức KS40.

## 1. Shareable Milestone (Cột mốc tri thức)
Đây là tính năng chủ đạo giúp người dùng tự hào về quá trình tích lũy tri thức của mình và chia sẻ nó với cộng đồng.

### Ý tưởng cốt lõi
Ghi nhận các thành tựu của người dùng trong hệ thống và chuyển đổi chúng thành các hình ảnh (Social Cards) bắt mắt để chia sẻ trên LinkedIn, Facebook, Instagram.

### Các loại cột mốc (Milestones)
*   **Topic Completion**: Khi người dùng hoàn thành việc đọc toàn bộ bài viết trong một Chủ đề (Topic).
*   **Reading Streak**: Hoàn thành việc đọc hàng ngày liên tục trong 7, 30, 100 ngày.
*   **Knowledge Volume**: Đạt được số lượng bài đọc nhất định (ví dụ: "Đã tiếp nhận 50 đơn vị tri thức mới").
*   **Contribution Impact**: Đối với tác giả, khi bài viết đạt được số lượt thích hoặc lưu lại lớn.

### Thành phần hiển thị trên Milestone Card
*   **Visual Style**: Minimalist, Premium (Zinc/Dark mode), phông chữ Sans-serif hiện đại.
*   **Nội dung**: 
    *   Tên người dùng + Avatar.
    *   Tên thành tựu (ví dụ: "Master of Terminal Benchmarking").
    *   Một câu trích dẫn ngẫu nhiên từ hệ thống hoặc thông số thống kê.
    *   QR Code dẫn về hồ sơ cá nhân hoặc bài viết liên quan.
    *   Logo KS40 tinh tế.

### Luồng người dùng (User Flow)
1. Hệ thống phát hiện sự kiện đạt cột mốc.
2. Một thông báo (Toast hoặc Modal) hiện ra chúc mừng.
3. Người dùng nhấn nút "Chia sẻ thành tựu".
4. Hệ thống render ảnh (sử dụng `satori` hoặc `html-to-image`).
5. Người dùng có thể tải ảnh về hoặc chia sẻ trực tiếp qua Web Share API.

---

## 2. Các ý tưởng bổ trợ (Future Scope)

### Highlight-to-Share (Social Quote)
*   Cho phép bôi đen văn bản và tạo ảnh trích dẫn (Social Card) ngay lập tức.
*   Tối ưu cho việc chia sẻ các "châm ngôn tri thức" lên Stories.

### Premium Knowledge Card (Export Article)
*   Tạo ảnh poster tóm tắt cho toàn bộ bài viết.
*   Bao gồm Title, Author, Quick Overview và QR Code.

### LinkedIn Automated Hook
*   Soạn sẵn caption chuyên nghiệp dựa trên tóm tắt AI để người dùng đăng bài nhanh chóng.

---

## 3. Knowledge Slideshow (TikTok/Reels Mode)
**Status**: Core Engine Implemented (v1.0)
**Goal**: Transform articles into high-quality 9:16 vertical carousels.

### Features
- [x] Auto-extraction of key insights (H2 + Paragraph).
- [x] High-res Image Export (PNG + ZIP).
- [x] TikTok-style Full-screen Preview with Touch Navigation.
- [x] Dynamic Backgrounds (Article images + Fallback library).
- [ ] **Slideshow Studio (Phase 2)**: 
    - Custom Theme Editor (Colors, Gradients, Overlays).
    - Branding Controls (Author Handle, Website URL, Logo).
    - Layout Presets (Top-aligned, Centered, Split).
    - Content Editor (Edit slide text directly before export).

---

## 4. Slideshow Studio Architecture
**Concept**: A professional workspace for authors to "brand" their knowledge content.

### Workspace Components
- **Canvas (9:16)**: Central live preview of the current slide.
- **Style Inspector**: Sidebar for adjusting colors, fonts, and background blur.
- **Content Manager**: Quick-edit list for slide titles and descriptions.
- **Export Panel**: Advanced export options (Quality, Frame selection).

### Technology Stack
- **State**: React Context for real-time synchronization.
- **Rendering**: `html-to-image` for high-fidelity snapshots.
- **Persistence**: Save user's "Design Presets" to the database.
