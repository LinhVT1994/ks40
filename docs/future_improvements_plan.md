# KS4.0 Academy: Future Improvements & Scaling Roadmap

Dự án KS4.0 hiện tại đã đạt mức độ hoàn thiện xuất sắc về tính năng (Functional MVP) và giao diện (UI/UX). Để tiến tới Launching thành một nền tảng thực sự đáp ứng chuẩn **Production**, đây là kế hoạch 4 bước chiến lược để mở rộng (Scale).

---

## 🚀 Phase 1: Tối ưu hoá Database bằng Caching & Redis

**Vấn đề:** Các thuật toán đề xuất "Trending", đếm số lượt View, Like đang được tính toán và lưu trực tiếp xuống Database. Khi có quá nhiều User thao tác cùng lúc, Postgres Query sẽ bị nghẽn (Bottle-neck).

**Giải pháp:**
1. Khởi tạo một Redis Database (đề xuất: **Upstash Redis** vì có latency cực thấp và tương thích chuẩn Serverless).
2. Xây dựng Data Access Layer (DAL) trong Next.js để đọc danh sách bài viết từ Cache. Khi Cache miss mới chọc xuống Postgres.
3. Khi người dùng tăng View/Like, cập nhật nhanh lên Redis (O(1)).
4. Chạy một Cronjob đồng bộ dữ liệu View/Like từ Redis xuống lại Postgres 15 phút một lần để Persistent Data.

---

## 🖼️ Phase 2: Hệ thống quản lý File & Media (Azure Blob Storage)

**Vấn đề:** Tính năng Upload ảnh Thumbnail / Cover cho khóa học và Bài Báo đang được thiết kế dạng base64 file truyền thống. Chứa dữ liệu ảnh trực tiếp vào database text sẽ làm phình DB, tốn băng thông truy vấn, và render rất chậm.

**Giải pháp:**
1. Khởi tạo một **Storage Account** và thiết lập Container trên nền tảng **Microsoft Azure Blob Storage**.
2. Tại màn hình Tạo/Sửa bài viết: Server-side API cài đặt bộ SDK `@azure/storage-blob` để Controller cấp phát một mã **SAS Token** giới hạn thời gian.
3. Khi người dùng submit ảnh bằng component Dropzone, trình duyệt sẽ gọi Browser Direct API (`PUT`) đẩy file thẳng lên Container của Azure thông qua mã Token kia. Đảm bảo cấu trúc Server Next.js không tốn byte băng thông nào cho việc đọc/truyền I/O files nặng nề.
4. Đổi cột `thumbnail`, `cover` trong Database thành chuẩn `String (URL)`.
5. Ảnh fetch từ Data về Front-end sẽ đi qua `<Image />` có cấu hình Remote Patterns (`azureedge.net` hoặc Blob CDN) để Next.js hỗ trợ nén (compress WebP) tự động, giúp tốc độ load page tăng x3 lần.

---

## 🔎 Phase 3: SEO Tối đa hóa X-Ray & Metadata (Open Graph)

**Vấn đề:** Khi share link các bài báo trên nền tảng (Zalo, Facebook, LinkedIn, Google Search), chúng ta chỉ đang hiển thị Default Title chứ chưa bắt được dữ liệu Metadata sâu của bài báo (Tên bài tựa, hình ảnh thumbnail lớn, bài tóm tắt).

**Giải pháp:**
1. Tại file `app/[slug]/page.tsx`, sử dụng API `generateMetadata` của Next.js App Router.
2. Khi Bot Crawler (Facebook/Google) truy cập, Server tiến hành fetch Article từ DB, và render các tag `<meta property="og:title">`, `<meta property="og:image">` tương ứng.
3. Sinh (Generate) thẻ `robots.txt` và sơ đồ trang web `sitemap.xml` tự động khi thêm/sửa/xoá bài viết. 

---

## 🔔 Phase 4: Hệ thống Real-time Notifications (WebSockets)

**Vấn đề:** Cơ chế Event Bus (`bus.ts`) chúng ta làm rất chuẩn để tạo Audit Log/Activities (không làm chậm request người dùng). Nhưng quản trị viên vẫn phải *F5* trang Dashboard để xem những Activity mới nhất.

**Giải pháp:**
1. Sử dụng thư viện **Pusher** hoặc **Socket.io**.
2. Bên trong listener `events/listeners.ts`, ngay sau bước ghi vào DB -> Bắn Trigger Socket theo kênh (Channel) đến browser của các Admin đang online.
3. Ở phía Front-end (`AdminLayout` hoặc `ActivityFeed`), viết Component gắn Hook `useEffect` listen Socket Event để Push phần tử mới vào Array hiển thị, hoặc gióng một thông báo Notification Toast (chuông rêng) ở thanh Header.
4. Trải nghiệm Dashboard từ đó sẽ hoàn toàn "Real-time" giống hệt Facebook/Lazada.
