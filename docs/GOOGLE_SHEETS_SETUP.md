# Google Sheets + bảo mật API key

## Biến môi trường

```env
VITE_SHEETS_WEBAPP_URL=https://script.google.com/macros/s/xxxxx/exec
VITE_SHEETS_API_KEY=chuoi-bi-mat-it-nhat-12-ky-tu
```

`VITE_SHEETS_API_KEY` phải trùng `SECRET_API_KEY` trong `docs/apps-script/Code.gs`.

## Deploy

1. Sheet → Apps Script → dán Code.gs → đổi SECRET_API_KEY
2. Deploy Web app → Anyone → copy URL /exec
3. Vercel env + Redeploy

## Tài khoản

Chỉ user trong sheet **Users**. Không còn Demo login trên giao diện.
Đổi mật khẩu mặc định ngay sau khi chạy lần đầu.

Thêm user: dòng mới trên sheet Users với JSON có email, password, role, isActive.
