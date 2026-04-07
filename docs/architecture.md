# Feature-Driven Architecture

Dựa trên các file giao diện hiện có trong thư mục `design/` (`login.html`, `register.html`, `member/dashboard.html`) và yêu cầu mở rộng, hệ thống được thiết kế xoay quanh 3 nhóm chức năng chính: **Xác thực (Auth)**, **Thành viên (Member/Dashboard)**, và **Quản trị (Admin)**.

Mục tiêu của thiết kế hướng chức năng (Feature-Driven Architecture) là gom nhóm tất cả các phần code liên quan đến một tính năng cụ thể vào cùng một thư mục, giúp dự án dễ dàng bảo trì và mở rộng (scale) khi số lượng tính năng tăng lên.

## Cấu Trúc Đề Xuất

Dự án sử dụng Next.js App Router, được tổ chức trong thư mục `src/` với trung tâm là thư mục `features/`:

```text
src/
├── app/                    # Next.js App Router (Chỉ chứa routing và các layout chính)
│   ├── (auth)/             # Route group cho Authentication
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (member)/           # Route group cho Member/Dashboard
│   │   ├── dashboard/page.tsx
│   │   └── layout.tsx      # Layout dùng chung cho member (sidebar, header...)
│   ├── (admin)/            # Route group cho Admin
│   │   ├── dashboard/page.tsx
│   │   └── layout.tsx      # Layout riêng cho admin
│   ├── globals.css         # CSS toàn cục (Tailwind)
│   └── layout.tsx          # Root Layout
│
├── features/               # CHỨA LOGIC CHÍNH - Chia theo từng chức năng độc lập
│   ├── auth/               # Feature: Xác thực người dùng
│   │   ├── components/     # Các component riêng cho auth (LoginForm, RegisterForm...)
│   │   ├── actions/        # Server Actions để xử lý logic (login, register)
│   │   ├── api/            # Functions gọi API external (nếu có)
│   │   ├── types/          # Types/Interfaces (ví dụ: User, LoginCredentials)
│   │   └── hooks/          # Custom hooks riêng cho auth
│   │
│   ├── member/             # Feature: Khu vực member/dashboard
│   │   ├── components/     # (DashboardWidget, ProfileCard...)
│   │   ├── actions/        # Server actions (updateProfile, getUserData)
│   │   ├── api/
│   │   └── types/
│   │
│   └── admin/              # Feature: Quản trị viên
│       ├── components/     # Các component dùng riêng trong admin
│       ├── actions/
│       ├── api/
│       └── types/
│
├── components/             # Shared Components (Dùng chung cho TOÀN DỰ ÁN)
│   ├── ui/                 # Các UI component cơ bản (Button, Input, Modal, Card...)
│   └── layout/             # Header, Footer, Sidebar dùng chung
│
├── lib/                    # Shared Utilities (Dùng chung cho toàn dự án)
│   ├── utils.ts            # Các helper functions (formatDate, cn cho Tailwind...)
│   └── constants.ts        # Các hằng số toàn cục
│
└── types/                  # Global Types (Types dùng chung, không thuộc feature nào)
```

## Ưu Điểm
1. **Tính Đóng Gói Cao (Encapsulation):** Mọi logic của tính năng đều nằm gọn trong `src/features/[feature-name]/`. Khi chỉnh sửa, gỡ bỏ hay copy sang dự án khác, lập trình viên không cần nhảy qua lại nhiều thư mục rải rác.
2. **App Router Gọn Gàng:** Thư mục `src/app/` đơn thuần chỉ đóng vai trò phân luồng đường dẫn (Routes) và import các View Component từ `src/features/` vào hiển thị. Mọi logic phức tạp sẽ không nằm trong `page.tsx` hay `layout.tsx`.
3. **Kiểm Soát Phụ Thuộc (Dependency Control):** Hạn chế các tính năng import chéo lẫn nhau (ví dụ file trong `member` hạn chế import trực tiếp từ file trong `admin`), giảm rủi ro Spaghetti Code. Khi cần dùng chung, tính năng đưa các logic đó ra `src/components/`, `src/lib/` hoặc module chung. 
