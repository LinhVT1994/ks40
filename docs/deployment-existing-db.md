# Cập nhật Lenote khi đã có database

Tài liệu này dành cho **cập nhật ứng dụng**, không phải khởi tạo hệ thống.

> **Bản đặt lịch tư vấn (10/2026) có 5 migration mới** (`20261001000000` → `20261001040000`): thêm bảng `ConsultationSettings`, `Consultation`, enum `ConsultationStatus` và 6 giá trị mới cho `NotificationType`. Tất cả chỉ **thêm** bảng/cột/giá trị enum, không đụng dữ liệu đang có (migration `…020000` chỉ chuyển dữ liệu trong cột `blockedDates` mới thêm ở `…010000` rồi bỏ cột đó). **Bắt buộc chạy trước khi restart app.** Sau khi deploy, admin cần nhập tài khoản ngân hàng nhận tiền thì tác giả mới đặt giá được. Xem [mục 3](#3-migration-database) và [mục 3b](#3b-cấu-hình-sau-deploy-đặt-lịch-tư-vấn). Bản này không sửa `docker-compose.yml`, không cần biến môi trường hay cron mới.
>
> **Bản cập nhật ảnh bìa trang cá nhân (09/2026) có migration mới:** `20260928000000_add_user_cover_image` thêm cột `User.coverImage` (TEXT, cho phép NULL). Migration chỉ **thêm** cột, không xóa/sửa dữ liệu, nhưng **bắt buộc chạy trước khi restart app** — code mới truy vấn cột này, thiếu cột thì trang hồ sơ, `/me`, cài đặt và ảnh OG profile sẽ lỗi. Xem [mục 3](#3-migration-database). Bản này không sửa `docker-compose.yml`.

## Những gì phải giữ nguyên

- `DATABASE_URL` đang trỏ tới database thật; không thay bằng URL ví dụ trong README.
- `AUTH_SECRET`, Google OAuth, email và Azure credentials hiện có.
- Dữ liệu PostgreSQL/volume Docker; thư mục ảnh/tài liệu đang sử dụng.
- `.env` production. Không chép `.env` từ máy dev và không chạy `cp .env.example .env` đè lên file đang có.

**Không chạy** `prisma migrate reset`, `prisma db push --force-reset`, `prisma db push --accept-data-loss`, `prisma db seed`, `prisma migrate dev`, `docker compose down -v`, hay script seed trong lần cập nhật này. Không dùng `prisma db push`. Bản cập nhật cần đúng một lệnh ghi DB là `prisma migrate deploy` (thêm `migrate resolve` nếu glossary đang pending), chỉ chạy sau khi đã kiểm tra `prisma migrate status` theo [mục 3](#3-migration-database). Nếu database production thiếu bảng/cột của phiên bản trước, dừng lại để kiểm tra schema/history, không tự reset để chữa lỗi.

`npm ci` chạy postinstall `prisma generate`; `npm run build` cũng chạy `prisma generate`. Các lệnh đó tạo Prisma Client trong ứng dụng, **không tạo/xóa bảng hoặc chạy seed**. Build có đọc DB để tạo sitemap.

## 1. Chuẩn bị trước khi cập nhật

1. Tạo snapshot/backup PostgreSQL bằng công cụ đang dùng; kiểm tra backup đọc được. Không có thao tác backup/restore nào được tự chạy từ dự án.
2. Sao lưu `.env` và uploads ngoài thư mục build/release; không đưa backup chứa dữ liệu vào Git hoặc web root.
3. Xác định nơi đang lưu file thật. Khi chạy standalone, Next đổi working directory sang `.next/standalone`; file upload có thể đang nằm trong `.next/standalone/public/uploads` hoặc `.next/standalone/storage/private`, không nhất thiết ở project root. **Không build đè release đang giữ những file duy nhất này.** Chuyển/mount chúng vào thư mục persistent sau khi đã kiểm tra và sao lưu, hoặc dùng release mới trỏ tới vị trí hiện có.
4. Dùng Node.js 22.12+ hoặc Node.js 24 LTS phù hợp với Prisma 7; không cần nâng database PostgreSQL.
5. Production phải có `NEXT_PUBLIC_BASE_URL=https://domain-cua-ban` khi build; `AUTH_URL`/`NEXTAUTH_URL` trỏ đúng domain. Giữ nguyên secret và DB URL. Không in `.env` vào log.

## 2. Lấy code và build

Commit nằm ở nhánh `release-mvp`. Commit local chưa đồng nghĩa đã push. Tính năng đặt lịch tư vấn đang ở nhánh `feature/consultation-booking`: cần merge vào `release-mvp` (qua PR hoặc `git merge` trên máy phát triển) trước khi deploy theo các bước dưới. Trên máy phát triển, khi đã kiểm tra đúng remote:

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

Chỉ pull vào đúng nhánh/thư mục ứng dụng đã xác nhận. Nếu server có thay đổi local hoặc pull không fast-forward được: dừng lại, không `reset --hard`/`git clean` để ép deploy. `--webpack` là phương án build đã kiểm chứng cho bản này; không tác động DB. Build thất bại thì giữ nguyên bản đang phục vụ — **chưa chạy migration khi build chưa thành công**.

## 3. Migration database

Thứ tự: **build thành công → backup → `migrate status` → `migrate deploy` → restart app**. Các migration chỉ thêm bảng/cột (cột mới cho phép NULL hoặc có default) nên app cũ đang chạy không bị ảnh hưởng trong lúc chờ restart.

Chạy trong thư mục release mới, với environment production (đúng `DATABASE_URL`):

```bash
npx prisma migrate status
```

Các migration có thể đang pending (tùy lần deploy trước đã tới đâu):

| Migration | Nội dung |
| --- | --- |
| `20260429000000_add_glossary_term` | Bảng thuật ngữ — **xem lưu ý bên dưới**, thường phải `resolve` thay vì chạy. |
| `20260928000000_add_user_cover_image` | Cột `User.coverImage`. |
| `20261001000000_add_consultations` | Bảng `ConsultationSettings`, `Consultation`, enum `ConsultationStatus`, 4 loại thông báo tư vấn, unique index chống đặt trùng giờ. |
| `20261001010000_add_consultation_blocked_dates` | Cột tạm `blockedDates` (bị thay ở migration sau). |
| `20261001020000_consultation_date_overrides` | Cột `dateOverrides` (giờ riêng theo ngày), chuyển dữ liệu từ `blockedDates` rồi bỏ cột đó. |
| `20261001030000_consultation_meeting_url` | Cột `Consultation.meetingUrl` (link họp từng buổi). |
| `20261001040000_consultation_payments` | Giá (`price`), mã thanh toán (`paymentCode`, unique), các mốc thanh toán/hoàn tiền, trạng thái `AWAITING_PAYMENT`, 2 loại thông báo thanh toán; tạo lại unique index để chỗ đang giữ (chờ thanh toán) cũng chặn đặt trùng. |

Xử lý **đúng một** trong các trường hợp:

| `migrate status` báo chưa áp dụng | Việc cần làm |
| --- | --- |
| Chỉ các migration trong bảng trên, **không có** glossary | Chạy `npx prisma migrate deploy`. |
| Có cả `20260429000000_add_glossary_term` | Kiểm tra DB trước (bên dưới). Migration glossary **không chạy lại được** (`CREATE TABLE` sẽ lỗi nếu bảng đã có). |
| Migration không có trong bảng trên, hoặc báo drift/failed | Dừng lại, không deploy. Không `migrate reset`/`db push` để chữa. |

Kiểm tra **chỉ đọc** trạng thái các bảng/cột. Script không in secret và không đổi DB:

```bash
npx tsx scripts/check-migration-state.ts
```

- Glossary đang pending và **`glossaryTables.state: "all"`** (cả 3 bảng đã có, thường do trước đây dùng `db push`): đánh dấu migration glossary là đã áp dụng (chỉ ghi vào bảng lịch sử `_prisma_migrations`, không đổi schema), rồi deploy phần còn lại:
  ```bash
  npx prisma migrate resolve --applied 20260429000000_add_glossary_term
  npx prisma migrate deploy
  ```
- **`glossaryTables.state: "none"`:** chạy `npx prisma migrate deploy` bình thường, lệnh sẽ tạo glossary cùng các migration còn lại.
- **`glossaryTables.state: "partial"`:** dừng lại, kiểm tra thủ công. Không tự tạo/xóa bảng.
- **`consultations.state` trước khi deploy** phải là `"none"` (lần đầu lên bản tư vấn) hoặc khớp với những migration tư vấn đã áp dụng. Nếu thấy bảng tư vấn đã có mà `migrate status` vẫn báo `20261001000000_add_consultations` pending: dừng lại, không `resolve` — schema đó không do migration tạo ra.

Sau khi deploy, `npx prisma migrate status` phải báo `Database schema is up to date!` và chạy lại script phải thấy `"userCoverImageColumn": true` và `"consultations": { …, "state": "all" }`. Chỉ khi đó mới restart app ở bước tiếp theo.

> Đã thử trên bản sao schema của `release-mvp`: `migrate deploy` áp dụng đủ 5 migration tư vấn, sau đó `prisma migrate diff` giữa DB và `schema.prisma` trống (không lệch).

Ảnh bìa tải lên dùng cùng nơi lưu với avatar: Azure container ảnh hiện có (thư mục `covers/`), hoặc `public/uploads/covers` nếu không cấu hình Azure — thư mục này nằm trong `public/uploads` đã mount persistent ở mục 4, không cần thêm mount mới.

## 3b. Cấu hình sau deploy: đặt lịch tư vấn

Không có biến môi trường mới. Email thông báo đặt lịch dùng cấu hình Resend hiện có; giữ chỗ hết hạn được xử lý tự động khi có người mở trang (không cần cron).

1. Đăng nhập tài khoản **ADMIN** → **Admin → Thanh toán** (`/admin/payments`).
2. Mục **Tài khoản nhận tiền**: chọn ngân hàng, nhập số tài khoản và tên chủ tài khoản (tự viết hoa, bỏ dấu), bấm **Lưu tài khoản**. Ảnh QR xem trước phải hiện đúng ngân hàng/chủ tài khoản — quét thử bằng app ngân hàng để chắc tên hiển thị đúng. Tài khoản được lưu trong bảng `SiteConfig` (key `consultation_payment`), không phải trong `.env`.
3. Chưa nhập tài khoản thì mọi buổi tư vấn là **miễn phí**: tác giả không đặt giá được, quy trình đặt lịch chạy như bản miễn phí.

Vận hành hằng ngày (admin):

- Tab **Chờ đối chiếu**: đối chiếu sao kê theo **mã thanh toán** (`LNxxxxxx`, là nội dung chuyển khoản) và số tiền. Đúng → **Đã nhận tiền** (yêu cầu mới tới tác giả). Không thấy giao dịch → **×** kèm lý do (giải phóng chỗ, báo cho người đặt).
- Tab **Cần hoàn tiền**: các buổi đã trả tiền nhưng bị tác giả từ chối/bị hủy, hoặc người đặt chuyển tiền sau khi hết 30 phút giữ chỗ. Chuyển trả thủ công cho người đặt rồi bấm **Đã hoàn tiền**.
- Tiền trả cho tác giả được xử lý ngoài hệ thống; hệ thống chỉ ghi nhận tiền vào và hoàn tiền.

Ảnh QR lấy từ `img.vietqr.io`; CSP hiện tại (`img-src … https:`) đã cho phép, không cần sửa Nginx/CSP.

## 4. VPS/PM2/Nginx: chạy standalone đúng cách

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

## 5. Docker hoặc nền tảng khác

`docker-compose.yml` trong repo hiện **chỉ khai báo PostgreSQL**, không có service web. Không chạy lại compose như một cách deploy giao diện. Dùng pipeline/container ứng dụng hiện có, giữ nguyên DB connection và volumes; nếu muốn dựng service web mới, cần cấu hình riêng trước. Với Vercel, dùng environment production và external DB hiện có, không dùng local filesystem làm persistent storage.

## 6. Kiểm tra và rollback

- `/explore`, `/robots.txt`, `/sitemap.xml` trả 200; profile có `og:image` và ảnh PNG 1200×630.
- Ảnh bìa: mở `/@username` của một tài khoản có sẵn (hiện nền mặc định, không lỗi). Đăng nhập, vào **Cài đặt → Hồ sơ → Ảnh bìa**: chọn một nền có sẵn, tải thử một ảnh, rồi "Về nền mặc định"; mỗi lần đổi, trang `/me` và ảnh OG `/og/profile/<id>` cập nhật theo.
- Avatar: đổi avatar rồi mở một bài viết của chính tài khoản đó — avatar tác giả phải đổi ngay (không chờ cache 1 giờ). Với tài khoản Google: đăng xuất, đăng nhập lại bằng Google, avatar/tên đã đặt trên Lenote phải được giữ nguyên. Nếu avatar đã bị ảnh Google ghi đè từ bản cũ, tải lại avatar một lần.
- Đặt lịch tư vấn (dùng tài khoản thử, xóa sau khi kiểm tra):
  - Tài khoản có quyền viết: **menu tài khoản → Lịch tư vấn → Thiết lập nhận tư vấn**, kéo chọn một khung giờ trên lịch, lưu; mở **Cài đặt**, bật nhận đặt lịch và đặt giá (ví dụ 10.000đ).
  - Tài khoản khác: mở trang cá nhân tác giả → **Đặt lịch tư vấn** → chọn giờ → nhập câu hỏi → **Tiếp tục thanh toán**: phải hiện QR, số tiền và mã `LN…`. Bấm **Tôi đã chuyển khoản**.
  - Admin: `/admin/payments` thấy mã đó ở **Chờ đối chiếu** → **Đã nhận tiền**; tác giả nhận thông báo và email, thấy yêu cầu ở tab **Lịch hẹn**.
  - Tác giả từ chối → admin thấy ở **Cần hoàn tiền** → **Đã hoàn tiền**. Sau đó đặt lại giá về giá thật hoặc 0.
- Đăng nhập bằng tài khoản đang có, kiểm tra số lượng bài/người dùng và tải một file có sẵn. Bản vá yêu cầu phiên cũ đăng nhập lại; link reset mật khẩu phát hành trước bản vá phải yêu cầu lại.
- Chạy `npx tsx scripts/audit-document-storage.ts` bằng environment production để kiểm kê **chỉ đọc**, không in URL/secret và không đổi DB. Nếu còn tài liệu Azure public cũ, xem [security-rollout.md](security-rollout.md) trước khi kết luận đã khóa hoàn toàn quyền tải.
- Nếu bản mới lỗi: trỏ process/reverse proxy về release cũ và restart **ứng dụng**. Giữ nguyên DB, env và persistent storage; không restore DB cũ đè lên dữ liệu mới chỉ để rollback code. Code cũ bỏ qua cột `coverImage` và các bảng/cột tư vấn, nên **không cần và không được** xóa cột, bảng hay migration khi rollback.
- Rollback từ bản tư vấn về bản cũ: Prisma Client cũ **không đọc được** thông báo mang loại mới (`CONSULTATION_*`), nên chuông/trang thông báo của người đã nhận các thông báo này sẽ lỗi. Chỉ khi thực sự rollback, chuyển các thông báo đó sang loại `SYSTEM` (giữ nguyên nội dung, không xóa):
  ```sql
  UPDATE "Notification" SET type = 'SYSTEM' WHERE type::text LIKE 'CONSULTATION\_%';
  ```
  Nếu còn khoản đang chờ đối chiếu hoặc cần hoàn tiền (`/admin/payments`), ghi lại danh sách trước khi rollback để xử lý thủ công — code cũ không có màn hình này.

## Tham khảo chính thức

- [Next.js standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [PM2 application configuration](https://pm2.keymetrics.io/docs/usage/application-declaration/)
