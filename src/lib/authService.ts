import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from './firebase';
import type { AppUser, UserRole } from '../types';

const EMAIL_ROLE_MAP: Record<string, UserRole> = {
  'lehuutri@congtruong.vn': 'admin',
  'admin@congtruong.vn': 'admin',
  'dotruong@congtruong.vn': 'editor',
  'chudautu@example.com': 'viewer',
};

function mapFirebaseError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Email không hợp lệ';
    case 'auth/user-disabled':
      return 'Tài khoản đã bị vô hiệu hóa';
    case 'auth/user-not-found':
      return 'Không tìm thấy tài khoản với email này';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email hoặc mật khẩu không đúng';
    case 'auth/email-already-in-use':
      return 'Email đã được sử dụng';
    case 'auth/weak-password':
      return 'Mật khẩu quá yếu (tối thiểu 6 ký tự)';
    case 'auth/too-many-requests':
      return 'Thử quá nhiều lần. Vui lòng đợi rồi thử lại';
    case 'auth/network-request-failed':
      return 'Lỗi mạng. Kiểm tra kết nối Internet';
    case 'auth/operation-not-allowed':
      return 'Phương thức đăng nhập Email/Password chưa được bật trên Firebase Console';
    default:
      return `Lỗi xác thực (${code})`;
  }
}

function quickUserFromAuth(uid: string, email: string, displayName?: string | null): AppUser {
  const role: UserRole = EMAIL_ROLE_MAP[email.toLowerCase()] || 'admin';
  return {
    id: uid,
    email,
    displayName: displayName || email.split('@')[0] || 'User',
    role,
    teamIds: role === 'editor' ? ['team-1'] : undefined,
    projectId: 'project-dathanh-001',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise.then((v) => v as T | null).catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

async function enrichFromFirestore(base: AppUser): Promise<AppUser> {
  const db = getFirebaseDb();
  if (!db) return base;
  try {
    const snap = await withTimeout(getDoc(doc(db, 'users', base.id)), 2500);
    if (snap && snap.exists()) {
      const data = snap.data();
      return {
        ...base,
        role: (data.role as UserRole) || base.role,
        teamIds: (data.teamIds as string[]) || base.teamIds,
        projectId: (data.projectId as string) || base.projectId,
        displayName: (data.displayName as string) || base.displayName,
      };
    }
    void setDoc(doc(db, 'users', base.id), {
      email: base.email,
      displayName: base.displayName,
      role: base.role,
      teamIds: base.teamIds || [],
      projectId: base.projectId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).catch(() => {});
  } catch {
    /* ignore */
  }
  return base;
}

export async function firebaseLogin(
  email: string,
  password: string
): Promise<{ ok: boolean; message: string; user?: AppUser }> {
  if (!isFirebaseConfigured()) {
    return { ok: false, message: 'Firebase chưa được cấu hình' };
  }
  const auth = getFirebaseAuth();
  if (!auth) return { ok: false, message: 'Không khởi tạo được Firebase Auth' };

  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const u = cred.user;
    const quick = quickUserFromAuth(u.uid, u.email || email, u.displayName);
    void enrichFromFirestore(quick);
    return { ok: true, message: 'Đăng nhập Firebase thành công', user: quick };
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code || 'unknown';
    return { ok: false, message: mapFirebaseError(code) };
  }
}

export async function firebaseRegister(
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'viewer'
): Promise<{ ok: boolean; message: string; user?: AppUser }> {
  if (!isFirebaseConfigured()) {
    return { ok: false, message: 'Firebase chưa được cấu hình' };
  }
  const auth = getFirebaseAuth();
  if (!auth) return { ok: false, message: 'Không khởi tạo được Firebase Auth' };

  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName) {
      try {
        await updateProfile(cred.user, { displayName });
      } catch {
        /* ignore */
      }
    }
    const quick = quickUserFromAuth(cred.user.uid, email.trim(), displayName || email.split('@')[0]);
    quick.role = role;
    void enrichFromFirestore(quick);
    return { ok: true, message: 'Tạo tài khoản thành công', user: quick };
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code || 'unknown';
    return { ok: false, message: mapFirebaseError(code) };
  }
}

export async function firebaseLogout(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) await fbSignOut(auth);
}

export function subscribeAuth(onUser: (user: AppUser | null) => void): Unsubscribe | null {
  const auth = getFirebaseAuth();
  if (!auth) return null;

  return onAuthStateChanged(auth, (fbUser: User | null) => {
    if (!fbUser) {
      onUser(null);
      return;
    }
    const quick = quickUserFromAuth(
      fbUser.uid,
      fbUser.email || '',
      fbUser.displayName || fbUser.email?.split('@')[0] || 'User'
    );
    onUser(quick);
    void enrichFromFirestore(quick).then((enriched) => {
      if (enriched.role !== quick.role || enriched.displayName !== quick.displayName) {
        onUser(enriched);
      }
    });
  });
}
