# 📚 Hướng dẫn Soạn thảo Nội dung Premium (RichMD) trên Lenote

Chào mừng bạn đến với hệ thống RichMD — bộ cú pháp Markdown nâng cao được thiết kế riêng cho Lenote để tạo ra những bài viết có trải nghiệm đọc "Zero Distraction" và thẩm mỹ Premium.

---

## 1. Typography & Nhấn mạnh

### 🖋️ Drop Cap (Phóng to chữ cái đầu)
Tạo điểm nhấn nghệ thuật cho đoạn văn mở đầu bài viết hoặc các chương mới.

- **Cú pháp:** Viết `[!DROP-CAP]` ngay trước chữ cái đầu tiên của đoạn văn.
- **Lưu ý:** Phải viết trên cùng một dòng với nội dung đoạn văn.

**Ví dụ:**
```markdown
[!DROP-CAP] Chào mừng bạn đến với thế giới của những bài viết chất lượng cao...
```

---

## 2. Hệ thống Callouts (Hộp thông tin)

Giúp làm nổi bật các loại thông tin khác nhau với màu sắc và icon riêng biệt.

- **Cú pháp chung:**
```markdown
> [!LOẠI]
> Nội dung thông báo ở đây.
```

- **Các loại hỗ trợ:**
  - `[!NOTE]`: Thông tin bổ sung (Xanh dương).
  - `[!TIP]`: Mẹo nhỏ, ý tưởng (Xanh lá).
  - `[!IMPORTANT]`: Quan trọng, cần nhớ (Tím).
  - `[!WARNING]`: Lưu ý, cảnh báo nhẹ (Vàng).
  - `[!CAUTION]`: Cảnh báo nguy hiểm, rủi ro (Đỏ).

---

## 3. Nội dung Thu gọn (Collapsible Details)

Dùng để ẩn đi những thông tin chi tiết, giải thích dài dòng để bài viết gọn gàng hơn.

- **Cú pháp:**
```markdown
> [!DETAILS] Tiêu đề của hộp nội dung
> Nội dung chi tiết sẽ được ẩn đi. 
> Bạn có thể viết nhiều dòng ở đây.
```

---

## 4. Hình ảnh & GIF Premium

Hệ thống đã được tích hợp bộ lọc thông minh cho hình ảnh.

### 🖼️ Ảnh thông thường
- Dùng nút **Image** trên toolbar hoặc cú pháp: `![Mô tả ảnh](url)`.
- Hệ thống tự động nén ảnh (WebP/JPG) để tối ưu tốc độ.

### 🎞️ Ảnh GIF (Ảnh động)
- **Upload:** Sử dụng cùng nút **Image**. Hệ thống tự nhận diện đuôi `.gif` và **giữ nguyên gốc (không nén)** để bảo toàn chuyển động.
- **Tính năng tự động:**
  - Gắn nhãn **"GIF"** ở góc ảnh.
  - Hiệu ứng **"XEM GIF"** khi di chuột vào.
  - Lightbox toàn màn hình cực nhạy (Đóng bằng dấu **X**, phím **ESC**, hoặc click ra ngoài).

---

## 5. Trình bày Bảng (Tables)

Hỗ trợ đầy đủ định dạng bảng GFM (GitHub Flavored Markdown).

- **Căn lề:**
  - `:---` : Căn trái.
  - `---:` : Căn phải.
  - `:---:` : Căn giữa.

**Ví dụ:**
```markdown
| Tính năng | Trạng thái | Ghi chú |
| :--- | :---: | ---: |
| Drop Cap | Sẵn sàng | Đẹp |
| Callouts | Sẵn sàng | Tiện |
```

---

## 6. Mẹo nhỏ (Pro Tips)

1. **Khoảng cách:** Hệ thống đã tối ưu margins. Đừng lo lắng về việc bài viết quá thưa, chúng mình đã ép sát các thành phần theo phong cách "Compact Design".
2. **Font chữ:** Toàn bộ văn bản sử dụng font weight **500 (Medium)** để tạo cảm giác sang trọng và dễ đọc trên mọi màn hình.
3. **Glossary:** Mọi từ ngữ chuyên môn sẽ được tự động gạch chân và có liên kết đến từ điển Glossary nếu bạn đã định nghĩa chúng.

---
*Chúc bạn có những trải nghiệm biên tập tuyệt vời trên Lenote!*
