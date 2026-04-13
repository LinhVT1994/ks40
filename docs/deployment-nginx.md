# Hướng dẫn Deploy Next.js với Nginx & PM2

Tài liệu này hướng dẫn cách triển khai ứng dụng **KS40** lên server Linux (Ubuntu/Debian) sử dụng Nginx làm Reverse Proxy và PM2 để quản lý process.

## 1. Chuẩn bị Server

Đảm bảo server đã cài đặt các thành phần sau:
- Node.js (phiên bản >= 20)
- npm hoặc yarn
- Nginx
- PM2 (`npm install -g pm2`)

## 2. Xây dựng ứng dụng (Build)

Tại thư mục gốc của dự án trên server, thực hiện các bước sau:

```bash
# 1. Cài đặt dependencies
npm install

# 2. Tạo file .env production
cp .env.example .env
# Chỉnh sửa .env phù hợp với môi trường production (DATABASE_URL, NEXTAUTH_URL, v.v.)

# 3. Build ứng dụng
npm run build
```

> [!TIP]
> Dự án đã được cấu hình `output: 'standalone'` trong `next.config.ts`. Điều này giúp tạo ra một bản build gọn nhẹ hơn tại thư mục `.next/standalone`.

## 3. Chạy ứng dụng với PM2

Sử dụng PM2 để đảm bảo ứng dụng luôn chạy ngầm và tự khởi động lại nếu server bị reboot.

```bash
# Tạo file ecosystem.config.js hoặc chạy trực tiếp:
pm2 start .next/standalone/server.js --name "ks40-app"
```

Kiểm tra trạng thái:
```bash
pm2 status
pm2 save
pm2 startup
```

## 4. Cấu hình Nginx làm Reverse Proxy

Tạo file cấu hình mới cho site của bạn:

```bash
sudo nano /etc/nginx/sites-available/ks40
```

Dán nội dung sau (thay đổi `yourdomain.com` bằng domain thật của bạn):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Tối ưu cho Next.js static files
    location /_next/static {
        alias /path/to/your/project/.next/static;
        expires 365d;
        access_log off;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Giới hạn dung lượng upload (nếu cần)
    client_max_body_size 10M;
}
```

Kích hoạt cấu hình và kiểm tra:
```bash
sudo ln -s /etc/nginx/sites-available/ks40 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 5. Thiết lập SSL (HTTPS) với Certbot

Khuyến khích sử dụng HTTPS để bảo mật dữ liệu người dùng.

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Certbot sẽ tự động cập nhật cấu hình Nginx của bạn để hỗ trợ HTTPS và tự động gia hạn chứng chỉ.

## 6. Một số lệnh hữu ích

- **Xem log ứng dụng:** `pm2 logs ks40-app`
- **Restart ứng dụng:** `pm2 restart ks40-app`
- **Xem log Nginx:** `sudo tail -f /var/log/nginx/error.log`

---
> [!IMPORTANT]
> Đừng quên mở cổng 80 (HTTP) và 443 (HTTPS) trên firewall của server (UFW hoặc AWS Security Group).
