# Hướng dẫn cấu hình Firebase Auth — Quản lý Công trường

## 1. Tạo dự án Firebase
1. Vào https://console.firebase.google.com
2. **Add project** → đặt tên (vd: `quanlycongtruongntcons`)
3. Tắt/bật Google Analytics tùy chọn → Create

## 2. Thêm Web App
1. Project Overview → biểu tượng **Web**
2. App nickname: `qlct-web`
3. Copy object `firebaseConfig` (apiKey, authDomain, …)

## 3. Bật Email/Password Auth
1. **Build → Authentication → Get started**
2. Tab **Sign-in method** → **Email/Password** → Enable → Save

## 4. Tạo user Chỉ huy trưởng
1. Authentication → **Users** → **Add user**
2. Email: `lehuutri@congtruong.vn` (hoặc email thật)
3. Password: tối thiểu 6 ký tự

## 5. Cấu hình biến môi trường
### Local
```bash
cp .env.example .env.local
# Sửa các giá trị VITE_FIREBASE_* trong .env.local
npm install
npm run dev
```

### Vercel
Project Settings → Environment Variables → thêm 6 biến `VITE_FIREBASE_*` → Redeploy

## 6. Firestore profile (users/{uid})
```json
{
  "email": "lehuutri@congtruong.vn",
  "displayName": "Lê Hữu Trí",
  "role": "admin",
  "teamIds": [],
  "projectId": "project-dathanh-001",
  "isActive": true
}
```

`role`: `admin` | `editor` | `viewer`

## 7. Kiểm tra
- Không có `.env` → app chạy **Demo**
- Có `.env` hợp lệ → đăng nhập **Firebase Auth**

## Tài khoản demo (chưa cấu hình Firebase)
| Email | Password | Role |
|-------|----------|------|
| lehuutri@congtruong.vn | admin123 | admin |
| dotruong@congtruong.vn | editor123 | editor |
| chudautu@example.com | viewer123 | viewer |
