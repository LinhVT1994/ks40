# Cập nhật Lenote khi đã có database

Tài liệu này dành cho **cập nhật ứng dụng**, không phải khởi tạo hệ thống. Bản thay đổi UI/SEO/security/profile OG này không sửa `prisma/schema.prisma`, không thêm migration và không sửa `docker-compose.yml`.

## Những gì phải giữ nguyên

- `DATABASE_URL` đang trỏ tới database thật; không thay bằng URL ví dụ trong README.
- `AUTH_SECRET`, Google OAuth, email và Azure credentials hiện có.
- Dữ liệu PostgreSQL/volume Docker; thư mục ảnh/tài liệu đang sử dụng.
- `.env` production. Không chép `.env` từ máy dev và không chạy `cp .env.example .env` đè lên file đang có.

**Không chạy** `prisma migrate reset`, `prisma db push --force-reset`, `prisma db push --accept-data-loss`, `prisma db seed`, `prisma migrate dev`, `docker compose down -v`, hay script seed trong lần cập nhật này. Không cần `prisma db push` hoặc `prisma migrate deploy` cho chính bản vá này. Nếu database production thiếu bảng/cột của phiên bản trước, dừng lại để kiểm tra schema/history, không tự reset để chữa lỗi.

`npm ci` chạy postinstall `prisma generate`; `npm run build` cũng chạy `prisma generate`. Các lệnh đó tạo Prisma Client trong ứng dụng, **không tạo/xóa bảng hoặc chạy seed**. Build có đọc DB để tạo sitemap.

## 1. Chuẩn bị trước khi cập nhật

1. Tạo snapshot/backup PostgreSQL bằng công cụ đang dùng; kiểm tra backup đọc được. Không có thao tác backup/restore nào được tự chạy từ dự án.
2. Sao lưu `.env` và uploads ngoài thư mục build/release; không đưa backup chứa dữ liệu vào Git hoặc web root.
3. Xác định nơi đang lưu file thật. Khi chạy standalone, Next đổi working directory sang `.next/standalone`; file upload có thể đang nằm trong `.next/standalone/public/uploads` hoặc `.next/standalone/storage/private`, không nhất thiết ở project root. **Không build đè release đang giữ những file duy nhất này.** Chuyển/mount chúng vào thư mục persistent sau khi đã kiểm tra và sao lưu, hoặc dùng release mới trỏ tới vị trí hiện có.
4. Dùng Node.js 22.12+ hoặc Node.js 24 LTS phù hợp với Prisma 7; không cần nâng database PostgreSQL.
5. Production phải có `NEXT_PUBLIC_BASE_URL=https://domain-cua-ban` khi build; `AUTH_URL`/`NEXTAUTH_URL` trỏ đúng domain. Giữ nguyên secret và DB URL. Không in `.env` vào log.

## 2. Lấy code và build

Commit nằm ở nhánh `release-mvp`. Commit local chưa đồng nghĩa đã push. Trên máy phát triển, khi đã kiểm tra đúng remote:

```bash
git push origin release-mvp
```

Nếu quy trình deploy đang có đã build trong một release riêng và giữ uploads/DB ở persistent storage, cập nhật bằng quy trình đó. Phần build tương ứng:

```bash
git status --short
git pull --ff-only origin release-mvp
npm ci
npm test
npm run build -- --webpack
```

Chỉ pull vào đúng nhánh/thư mục ứng dụng đã xác nhận. Nếu server có thay đổi local hoặc pull không fast-forward được: dừng lại, không `reset --hard`/`git clean` để ép deploy. `--webpack` là phương án build đã kiểm chứng cho bản này; không tác động DB. Build thất bại thì giữ nguyên bản đang phục vụ.

## 3. VPS/PM2/Nginx: chạy standalone đúng cách

Nếu deploy trên VPS, dùng một **release mới chưa chạy và không chứa dữ liệu upload duy nhất**. Không thay cấu hình PM2 bằng tên giả định: kiểm tra `pm2 list` và `pm2 describe TEN_APP` trước.

Standalone cần đủ `.next/static`, `public`, font OG đã được tracing và môi trường production. Chép static trong release mới:

```bash
mkdir -p .next/standalone/.next/static
cp -a .next/static/. .next/standalone/.next/static/
mkdir -p .next/standalone/public
cp -a public/. .next/standalone/public/
```

Không dùng bản sao uploads trong release làm nơi lưu lâu dài. Đặt các liên kết/mount sau tới **đúng thư mục hiện có đã xác nhận**, không trỏ tới thư mục rỗng:

| Đường dẫn trong standalone | Đích persistent |
| --- | --- |
| `.next/standalone/public/uploads` | Thư mục uploads đang dùng |
| `.next/standalone/storage/private` | Thư mục tài liệu private bền vững |

Nếu đích trong release đã tồn tại, kiểm tra và giữ lại bản sao trước khi thay bằng symlink; không dùng `rm -rf` hoặc `ln -sfn` để ép ghi đè. Với Azure, giữ nguyên connection string/container ảnh; container tài liệu private dùng tên khác, mặc định `private-documents`.

Ví dụ **chỉ dùng sau khi thay đường dẫn/tên ứng dụng cho đúng server**, khởi động thử release mới ở cổng 3001 bằng user dịch vụ hiện có:

```bash
NODE_ENV=production HOSTNAME=127.0.0.1 PORT=3001 \
node --env-file=/duong-dan/env-production-hien-co \
  /duong-dan/release-moi/.next/standalone/server.js
```

Kiểm tra ứng dụng ở cổng thử. Sau đó cập nhật PM2 trỏ tới `server.js` của release mới với env/cổng production hiện tại và restart đúng app. Không restart/recreate container database. Lưu cấu hình PM2 khi bản mới khỏe. Không chạy `next start` cho cấu hình standalone; dùng `server.js` đã build. File `.env` có thể được Next copy vào artifact: artifact phải là riêng tư, không phục vụ trực tiếp qua Nginx/CDN.

Nginx phải proxy qua app, chặn hai đường tài liệu legacy (kể cả khi có static alias):

```nginx
location ^~ /uploads/files/ { return 404; }
location ^~ /uploads/shared/ { return 404; }
```

Chỉ reload Nginx sau `nginx -t` thành công. Giữ các cấu hình TLS/domain đang hoạt động; không thay cả virtual host bằng mẫu.

## 4. Docker hoặc nền tảng khác

`docker-compose.yml` trong repo hiện **chỉ khai báo PostgreSQL**, không có service web. Không chạy lại compose như một cách deploy giao diện. Dùng pipeline/container ứng dụng hiện có, giữ nguyên DB connection và volumes; nếu muốn dựng service web mới, cần cấu hình riêng trước. Với Vercel, dùng environment production và external DB hiện có, không dùng local filesystem làm persistent storage.

## 5. Kiểm tra và rollback

- `/explore`, `/robots.txt`, `/sitemap.xml` trả 200; profile có `og:image` và ảnh PNG 1200×630.
- Đăng nhập bằng tài khoản đang có, kiểm tra số lượng bài/người dùng và tải một file có sẵn. Bản vá yêu cầu phiên cũ đăng nhập lại; link reset mật khẩu phát hành trước bản vá phải yêu cầu lại.
- Chạy `npx tsx scripts/audit-document-storage.ts` bằng environment production để kiểm kê **chỉ đọc**, không in URL/secret và không đổi DB. Nếu còn tài liệu Azure public cũ, xem [security-rollout.md](security-rollout.md) trước khi kết luận đã khóa hoàn toàn quyền tải.
- Nếu bản mới lỗi: trỏ process/reverse proxy về release cũ và restart **ứng dụng**. Giữ nguyên DB, env và persistent storage; không restore DB cũ đè lên dữ liệu mới chỉ để rollback code.

## Tham khảo chính thức

- [Next.js standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [PM2 application configuration](https://pm2.keymetrics.io/docs/usage/application-declaration/)
