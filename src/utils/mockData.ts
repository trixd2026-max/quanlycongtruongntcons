import type { Project, Team, Worker, ScoreRule, AppUser, GradeThresholds } from '../types';

export const DEFAULT_GRADE_THRESHOLDS: GradeThresholds = {
  xuatSac: 40, tot: 25, kha: 15, dat: 5,
};

/** Du lieu mau cong truong Truong Tieu hoc Da Thanh */
export function createMockProject(): Project {
  return {
    id: 'project-dathanh-001',
    name: 'Xay dung truong tieu hoc Da Thanh',
    packageName: 'Goi thau xay dung',
    commanderName: 'Le Huu Tri',
    phone: '0389216492',
    phase: '2019-2020',
    startDateWeek1: '2019-01-07',
    totalWeeks: 52,
    shiftsPerDay: 2,
    slogan: 'An toan la tren het - Chat luong tao uy tin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  };
}

export function createMockTeams(projectId: string): Team[] {
  return ['To Be tong', 'To Cop pha', 'To Cot thep', 'To Dien nuoc'].map((name, i) => ({
    id: `team-${i + 1}`,
    projectId,
    name,
    description: `${name} - Doi thi cong chinh`,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export function createMockWorkers(projectId: string, teams: Team[]): Worker[] {
  const data = [
    { code: 'CN001', fullName: 'Tran Van Hung', teamIdx: 0, position: 'To truong' },
    { code: 'CN002', fullName: 'Le Thi Hoa', teamIdx: 0, position: 'Cong nhan' },
    { code: 'CN003', fullName: 'Pham Van Duc', teamIdx: 0, position: 'Cong nhan' },
    { code: 'CN004', fullName: 'Nguyen Thi Lan', teamIdx: 1, position: 'To truong' },
    { code: 'CN005', fullName: 'Hoang Van Nam', teamIdx: 1, position: 'Cong nhan' },
    { code: 'CN006', fullName: 'Vu Thi Mai', teamIdx: 1, position: 'Cong nhan' },
    { code: 'CN007', fullName: 'Do Van Tuan', teamIdx: 2, position: 'To truong' },
    { code: 'CN008', fullName: 'Bui Thi Huong', teamIdx: 2, position: 'Cong nhan' },
    { code: 'CN009', fullName: 'Ngo Van Khoa', teamIdx: 2, position: 'Cong nhan' },
    { code: 'CN010', fullName: 'Ly Van Binh', teamIdx: 3, position: 'To truong' },
    { code: 'CN011', fullName: 'Trinh Thi Nga', teamIdx: 3, position: 'Ky thuat vien' },
    { code: 'CN012', fullName: 'Phan Van Long', teamIdx: 3, position: 'An toan vien' },
  ];
  return data.map((w, i) => ({
    id: `worker-${i + 1}`,
    projectId,
    code: w.code,
    fullName: w.fullName,
    birthDate: `198${5 + (i % 10)}-0${(i % 9) + 1}-15`,
    gender: i % 3 === 0 ? ('female' as const) : ('male' as const),
    teamId: teams[w.teamIdx].id,
    position: w.position,
    phone: `09${String(10000000 + i * 111).slice(0, 8)}`,
    safetyCard: `BHLD-${w.code}`,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export function createMockScoreRules(projectId: string): ScoreRule[] {
  const rules: Omit<ScoreRule, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[] = [
    { name: 'Tac phong BHLD chuan muc xuat sac', category: 'bonus', points: 5, color: '#38a169', allowEditor: true, countAsViolation: false, isActive: true },
    { name: 'Co sang kien cai tien ky thuat / an toan', category: 'bonus', points: 10, color: '#38a169', allowEditor: true, countAsViolation: false, isActive: true },
    { name: 'Hoan thanh vuot tien do hang muc', category: 'bonus', points: 10, color: '#38a169', allowEditor: true, countAsViolation: false, isActive: true },
    { name: 'Phat hien va canh bao nguy co mat an toan', category: 'bonus', points: 15, color: '#38a169', allowEditor: true, countAsViolation: false, isActive: true },
    { name: 'Truc ca an toan / Ve sinh 5S xuat sac', category: 'bonus', points: 5, color: '#38a169', allowEditor: true, countAsViolation: false, isActive: true },
    { name: 'To doi dat 100% quan so chuyen can tuan', category: 'attendance', points: 10, color: '#3182ce', allowEditor: false, countAsViolation: false, isActive: true },
    { name: 'Khong doi mu bao ho / Khong deo day an toan', category: 'penalty', points: -10, color: '#e53e3e', allowEditor: true, countAsViolation: true, isActive: true },
    { name: 'Su dung ruou bia, chat kich thich', category: 'penalty', points: -20, color: '#e53e3e', allowEditor: true, countAsViolation: true, isActive: true },
    { name: 'Di tre / Vang mat ca khong ly do', category: 'penalty', points: -5, color: '#dd6b20', allowEditor: true, countAsViolation: false, isActive: true },
    { name: 'Vi pham quy dinh PCCC / Hut thuoc sai noi', category: 'penalty', points: -10, color: '#e53e3e', allowEditor: true, countAsViolation: true, isActive: true },
    { name: 'Thi cong sai ban ve / Loi chat luong', category: 'progress', points: -15, color: '#e53e3e', allowEditor: true, countAsViolation: false, isActive: true },
    { name: 'Lam hong / That thoat vat tu, thiet bi', category: 'penalty', points: -10, color: '#e53e3e', allowEditor: true, countAsViolation: true, isActive: true },
    { name: 'Khong don dep ve sinh sau ca', category: 'penalty', points: -5, color: '#dd6b20', allowEditor: true, countAsViolation: false, isActive: true },
    { name: 'Bi lap bien ban vi pham ATLD', category: 'safety', points: -20, color: '#c53030', allowEditor: true, countAsViolation: true, isActive: true },
  ];
  return rules.map((r, i) => ({
    ...r,
    id: `rule-${i + 1}`,
    projectId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export function createMockAdmin(projectId: string): AppUser {
  return {
    id: 'user-admin-001',
    email: 'lehuutri@congtruong.vn',
    displayName: 'Le Huu Tri',
    role: 'admin',
    projectId,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function getGrade(
  points: number,
  thresholds: GradeThresholds = DEFAULT_GRADE_THRESHOLDS,
  hasData = true
): string {
  if (!hasData) return 'Chua du du lieu';
  if (points >= thresholds.xuatSac) return 'Xuat sac';
  if (points >= thresholds.tot) return 'Tot';
  if (points >= thresholds.kha) return 'Kha';
  if (points >= thresholds.dat) return 'Dat';
  return 'Chua dat';
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'Xuat sac':
    case 'Xuất sắc': return 'bg-green-600 text-white';
    case 'Tot':
    case 'Tốt': return 'bg-blue-600 text-white';
    case 'Kha':
    case 'Khá': return 'bg-cyan-600 text-white';
    case 'Dat':
    case 'Đạt': return 'bg-yellow-500 text-white';
    case 'Chua dat':
    case 'Chưa đạt': return 'bg-red-600 text-white';
    default: return 'bg-gray-400 text-white';
  }
}
