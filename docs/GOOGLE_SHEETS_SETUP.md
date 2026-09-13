# Hướng dẫn liên kết Google Sheets (thay Firebase Console)

Ứng dụng lưu dữ liệu công trường trên **Google Sheets** qua **Apps Script Web App** — không bắt buộc Firebase Console.

## Bước 1 — Tạo Google Sheet

1. Mở https://sheets.google.com → **Blank spreadsheet**
2. Đặt tên: `QL Công trường Đa Thanh`

## Bước 2 — Gắn Apps Script

1. Trong Sheet: **Extensions (Tiện ích mở rộng)** → **Apps Script**
2. Xóa code mặc định, dán toàn bộ file `docs/apps-script/Code.gs` trong repo
3. **Save** (Ctrl+S)

## Bước 3 — Deploy Web App

1. **Deploy** → **New deployment**
2. Type: **Web app**
3. **Execute as**: Me
4. **Who has access**: **Anyone**
5. **Deploy** → Authorize
6. Copy URL `https://script.google.com/macros/s/xxxxxxxx/exec`

## Bước 4 — Cấu hình web app

### Local `.env.local`

```env
VITE_SHEETS_WEBAPP_URL=https://script.google.com/macros/s/xxxxxxxx/exec
```

### Vercel

Settings → Environment Variables → thêm `VITE_SHEETS_WEBAPP_URL` → Redeploy.

## Tài khoản mặc định (sheet Users)

| Email | Mật khẩu | Role |
|-------|----------|------|
| lehuutri@congtruong.vn | admin123 | admin |
| dotruong@congtruong.vn | editor123 | editor |

## Đồng bộ

Trong app: **Cài đặt** → **Đồng bộ đám mây** để đẩy dữ liệu lên Sheet.
