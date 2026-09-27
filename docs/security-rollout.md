# SEO và bảo mật — checklist triển khai

## Thay đổi trong mã nguồn

- Đóng API seed; mọi thao tác quản trị đã rà soát yêu cầu quyền server-side. Action đọc bài không nhận role từ client; tương tác không nhận userId từ client. Hàm tạo thông báo được chuyển thành module `server-only`, không còn public Server Action.
- Đọc tài liệu qua `/api/download/resource/:id` và `/api/download/shared/:id`: kiểm tra phiên, audience, trạng thái bài và hạn gói chia sẻ mỗi lần tải. Không gửi storage URL xuống trang tải. File được trả dạng attachment, no-store, nosniff.
- Upload tài liệu mới vào `storage/private` hoặc container Azure riêng `private-documents` (cấu hình bằng `AZURE_PRIVATE_CONTAINER_NAME`). Không dùng chung container public chứa ảnh. File cũ local vẫn đọc được qua API; đường public bị chặn ở proxy và image optimizer.
- Phiên bị từ chối khi tài khoản khóa/xóa, lỗi DB, hoặc password hash thay đổi. JWT cũ không có credential version cần đăng nhập lại. Session không nhận quyền/onboarding do client tự khai.
- Reset token lưu SHA-256, chỉ dùng một lần qua transaction; link reset cũ trước bản vá cần yêu cầu lại. Không in link reset vào log.
- Giới hạn đăng nhập: 10 lần/email/15 phút; đăng ký/quên/reset: 5 lần/định danh/15 phút. Có giới hạn toàn cục 600 lần/loại/15 phút chống tạo vô hạn định danh. Counter atomic trong bảng `SiteConfig`, dùng chung các replica và fail-closed nếu DB lỗi. Cần điều chỉnh giới hạn theo lưu lượng, thêm WAF/IP limit ở reverse proxy để tránh một tác nhân làm hết quota toàn cục. Có thể dọn riêng các row `rate-limit:%` cũ hơn 24h bằng job quản trị; không dọn các key cấu hình khác.
- Escape JSON-LD, sanitize Markdown, chặn raw HTML trong ghi chú; chỉ cho iframe YouTube/Vimeo hợp lệ. Security headers có CSP, nosniff, frame-ancestors, referrer policy, permissions policy và HSTS production. CSP hiện cho inline script để tương thích hydration/analytics; đây là lớp phòng vệ bổ sung, không thay thế sanitizer. `script-src-attr 'none'` chặn event handler inline.
- Canonical dùng chung `NEXT_PUBLIC_BASE_URL`; sửa OG glossary, title lặp, sitemap chỉ gồm glossary PUBLISHED và bỏ trang auth. Trang auth/nội bộ/tải file noindex.

## Trước khi đưa lên production

1. Đặt `NEXT_PUBLIC_BASE_URL` đúng HTTPS domain, không dùng host request để tạo reset URL. Bảo đảm `AUTH_SECRET` đủ mạnh và DB có bảng `SiteConfig` sẵn có. Không có schema migration mới.
2. Chạy `npm ci`, `npm test`, `npm run build`, `npm audit`. Các overrides bảo mật được ghim trong package.json: deepmerge-ts cho Prisma config, mysql2 cho Prisma CLI, esbuild cho công cụ build. Prisma vẫn cùng major 7; phải chạy lại generate/build khi nâng các gói này.
3. Mount `storage/private` vào volume bền vững nếu dùng local storage; standalone phải chạy với working directory/mount nhất quán. Không expose volume này bằng Nginx/CDN. Đặt giới hạn request body ở reverse proxy tối đa 200MB (giới hạn app còn kiểm tra số file và tổng dung lượng).
4. Chạy read-only inventory: `npx tsx scripts/audit-document-storage.ts`. Script không in URL hay secrets, không sửa dữ liệu. Exit 2 nếu còn remote legacy/URL chưa hỗ trợ.
5. **Azure cũ:** app không thể thu hồi URL public bằng một thay đổi route. Trước khi khẳng định tài liệu đã kín, sao lưu DB/blob, copy riêng các blob tài liệu `files/` và `shared/` sang container private, kiểm tra checksum/quyền, cập nhật URL bản ghi sang `azure-private:<key>`, rồi thu hồi/xóa chính xác bản public cũ sau xác nhận. Purge CDN/cache liên quan. Không đổi ACL container ảnh dùng chung và không xóa blob chưa xác minh. Không có thao tác cloud/migration tự động trong bản vá này.
6. Với file local cũ, Nginx/CDN phải chặn `/uploads/files/` và `/uploads/shared/` kể cả khi có static alias bypass Next. Mẫu Nginx đã bổ sung trong hướng dẫn deploy. Dọn cache công khai đã tồn tại; bản sao người khác đã tải trước đây không thể thu hồi.
7. Kiểm tra production: guest/member không tải được PREMIUM/PRIVATE/draft; gói hết hạn trả 404; ADMIN tải bình thường; khóa tài khoản/đổi mật khẩu vô hiệu hóa phiên; đăng nhập Google; email reset; preview ảnh và iframe vẫn hoạt động. Tài liệu đã xóa khỏi DB sẽ không tải được qua API; blob được giữ để phục hồi, cần chính sách retention riêng.

## Tài liệu tham chiếu

- [Next.js JSON-LD](https://nextjs.org/docs/app/guides/json-ld)
- [Next.js data security](https://nextjs.org/docs/app/guides/data-security)
- [Next.js security headers](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers)
- [Deepmerge-ts 8.0 migration/security notes](https://github.com/RebeccaStevens/deepmerge-ts/releases/tag/v8.0.0)
