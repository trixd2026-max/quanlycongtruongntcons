# Tính năng đã bổ sung (1–4)

## 1. Firestore realtime
- `src/lib/firestoreSync.ts`: onSnapshot teams/workers/transactions/locks/shifts/progress/audit
- Ghi KPI, khóa tuần, cài đặt project → Firestore
- Nút **Đẩy dữ liệu lên Firestore** trong Cài đặt

## 2. Tiến độ + An toàn đầy đủ
- ProgressPage: hạng mục, KH/TT, %, trạng thái, CRUD theo tuần
- SafetyPage: ghi nhận vi phạm, ảnh, thống kê theo tổ

## 3. Firebase Storage
- `src/lib/storageService.ts`: upload ảnh, fallback base64
- KPI + An toàn dùng upload này

## 4. User + Audit
- Cài đặt: tạo tài khoản (email/password + role)
- Audit log: khóa tuần, nhập điểm, sync, tạo user
- `firestore.rules` + `storage.rules`

## Việc cần làm trên Firebase Console
1. Build → Firestore → Create database (nếu chưa)
2. Publish `firestore.rules`
3. Build → Storage → Get started → publish `storage.rules`
4. Authentication → Email/Password đã bật
