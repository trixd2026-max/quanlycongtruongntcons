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
    case 'auth/invalid-email': return 'Email không hợp lệ';
    case 'auth/user-disabled': return 'Tài khoản đã bị vô hiệu hóa';
    case 'auth/user-not-found': return 'Không tìm thấy tài khoản với email này';
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Email hoặc mật khẩu không đúng';
    case 'auth/email-already-in-use': return 'Email đã được sử dụng';
    case 'auth/weak-password': return 'Mật khẩu quá yếu (tối thiểu 6 ký tự)';
    case 'auth/too-many-requests': return 'Thử quá nhiều lần. Vui lòng đợi rồi thử lại';
    case 'auth/network-request-failed': return 'Lỗi mạng. Kiểm tra kết nối Internet';
    case 'auth/operation-not-allowed': return 'Phương thức đăng nhập Email/Password chưa được bật trên Firebase Console';
    default: return `Lỗi xác thực (${code})`;
  }
}

async function loadUserProfile(uid: string, email: string, displayName: string): Promise<AppUser> {
  const db = getFirebaseDb();
  let role: UserRole = EMAIL_ROLE_MAP[email.toLowerCase()] || 'viewer';
  let teamIds: string[] | undefined;
  let projectId = 'default';

  if (db) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const data = snap.data();
        if (data.role) role = data.role as UserRole;
        if (data.teamIds) teamIds = data.teamIds as string[];
        if (data.projectId) projectId = data.projectId as string;
        if (data.displayName) displayName = data.displayName as string;
      } else {
        await setDoc(doc(db, 'users', uid), {
          email,
          displayName,
          role,
          teamIds: teamIds || [],
          projectId,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch {
      // Firestore chưa cấu hình / rules chặn
    }
  }

  return {
    id: uid,
    email,
    displayName: displayName || email.split('@')[0],
    role,
    teamIds,
    projectId,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
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
    const appUser = await loadUserProfile(
      u.uid,
      u.email || email,
      u.displayName || email.split('@')[0]
    );
    return { ok: true, message: 'Đăng nhập Firebase thành công', user: appUser };
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
  const db = getFirebaseDb();
  if (!auth) return { ok: false, message: 'Không khởi tạo được Firebase Auth' };

  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    const uid = cred.user.uid;
    if (db) {
      await setDoc(doc(db, 'users', uid), {
        email: email.trim(),
        displayName: displayName || email.split('@')[0],
        role,
        teamIds: [],
        projectId: 'default',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    const appUser = await loadUserProfile(uid, email.trim(), displayName || email.split('@')[0]);
    appUser.role = role;
    return { ok: true, message: 'Tạo tài khoản thành công', user: appUser };
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code || 'unknown';
    return { ok: false, message: mapFirebaseError(code) };
  }
}

export async function firebaseLogout(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) await fbSignOut(auth);
}

export function subscribeAuth(
  onUser: (user: AppUser | null) => void
): Unsubscribe | null {
  const auth = getFirebaseAuth();
  if (!auth) return null;

  return onAuthStateChanged(auth, async (fbUser: User | null) => {
    if (!fbUser) {
      onUser(null);
      return;
    }
    const appUser = await loadUserProfile(
      fbUser.uid,
      fbUser.email || '',
      fbUser.displayName || fbUser.email?.split('@')[0] || 'User'
    );
    onUser(appUser);
  });
}
