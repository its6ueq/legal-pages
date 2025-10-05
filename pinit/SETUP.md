# Hướng dẫn Setup GitHub Pages

Hướng dẫn chi tiết để tạo repository mới và deploy lên GitHub Pages.

## 🚀 Bước 1: Tạo Repository mới trên GitHub

1. Đăng nhập vào [GitHub](https://github.com)
2. Click nút **"New"** hoặc **"+"** ở góc trên phải
3. Chọn **"New repository"**
4. Đặt tên repository: `pinit-legal-pages` (hoặc tên khác bạn muốn)
5. Chọn **Public** (bắt buộc cho GitHub Pages miễn phí)
6. **KHÔNG** tick vào "Add a README file" (vì chúng ta đã có sẵn)
7. Click **"Create repository"**

## 📁 Bước 2: Upload files lên GitHub

### Cách 1: Sử dụng Git Command Line

```bash
# Di chuyển vào thư mục pinit-legal-pages
cd pinit-legal-pages

# Khởi tạo git repository
git init

# Thêm tất cả files
git add .

# Commit đầu tiên
git commit -m "Initial commit: Add legal pages for PinIt app"

# Thêm remote origin (thay YOUR_USERNAME bằng username GitHub của bạn)
git remote add origin https://github.com/YOUR_USERNAME/pinit-legal-pages.git

# Đổi branch thành main (nếu cần)
git branch -M main

# Push lên GitHub
git push -u origin main
```

### Cách 2: Upload trực tiếp trên GitHub

1. Vào repository vừa tạo trên GitHub
2. Click **"uploading an existing file"**
3. Kéo thả tất cả files từ thư mục `pinit-legal-pages` vào
4. Viết commit message: "Add legal pages for PinIt app"
5. Click **"Commit changes"**

## 🌐 Bước 3: Kích hoạt GitHub Pages

1. Vào repository trên GitHub
2. Click tab **"Settings"**
3. Scroll xuống phần **"Pages"** ở sidebar bên trái
4. Trong phần **"Source"**, chọn **"Deploy from a branch"**
5. Chọn branch **"main"** và folder **"/ (root)"**
6. Click **"Save"**

## ✅ Bước 4: Kiểm tra website

1. Sau vài phút, GitHub sẽ build website
2. URL sẽ có dạng: `https://YOUR_USERNAME.github.io/pinit-legal-pages/`
3. Kiểm tra các trang:
   - `https://YOUR_USERNAME.github.io/pinit-legal-pages/` (trang chủ)
   - `https://YOUR_USERNAME.github.io/pinit-legal-pages/privacy-policy.html`
   - `https://YOUR_USERNAME.github.io/pinit-legal-pages/terms-of-service.html`

## 🔧 Tùy chỉnh Domain (Tùy chọn)

Nếu bạn có domain riêng:

1. Vào **Settings** > **Pages**
2. Trong phần **"Custom domain"**, nhập domain của bạn
3. Tạo file `CNAME` trong repository với nội dung là domain của bạn
4. Cấu hình DNS của domain trỏ về GitHub Pages

## 📝 Cập nhật nội dung

Để cập nhật nội dung website:

1. Chỉnh sửa files HTML/MD
2. Commit và push lên GitHub:
   ```bash
   git add .
   git commit -m "Update content"
   git push
   ```
3. GitHub sẽ tự động rebuild website

## 🔗 Links hữu ích

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Custom Domain Setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [GitHub Desktop](https://desktop.github.com/) (GUI cho Git)

## 🆘 Troubleshooting

### Website không hiển thị
- Kiểm tra repository có public không
- Đợi 5-10 phút để GitHub build
- Kiểm tra tab Actions để xem build status

### 404 Error
- Đảm bảo file `index.html` có trong root directory
- Kiểm tra tên file có đúng không (case-sensitive)

### CSS/JS không load
- Kiểm tra đường dẫn relative trong HTML
- Đảm bảo tất cả files đã được upload

---

**Lưu ý**: Thay `YOUR_USERNAME` bằng username GitHub thực tế của bạn trong tất cả các lệnh và URL.
