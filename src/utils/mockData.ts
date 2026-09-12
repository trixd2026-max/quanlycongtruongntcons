import type { Project, Team, Worker, ScoreRule, AppUser, GradeThresholds } from '../types';

export const DEFAULT_GRADE_THRESHOLDS: GradeThresholds = {
  xuatSac: 40, tot: 25, kha: 15, dat: 5,
};

/** Dữ liệu mẫu công trường Trường Tiểu học Đa Thanh */
export function createMockProject(): Project {
  return {
    id: 'project-dathanh-001',
    name: 'Xây dựng trường tiểu học Đa Thanh',
    packageName: 'Gói thầu xây dựng',
    commanderName: 'Lê Hữu Trí',
    phone: '0389216492',
    phase: '2019-2020',
    startDateWeek1: '2019-01-07',
    totalWeeks: 52,
    shiftsPerDay: 2,
    slogan: 'An toàn là trên hết - Chất lượng tạo uy tín',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  };
}

export function createMockTeams(projectId: string): Team[] {
  return ['Tổ Bê tông', 'Tổ Cốp pha', 'Tổ Cốt thép', 'Tổ Điện nước'].map((name, i) => ({
    id: `team-${i + 1}`,
    projectId,
    name,
    description: `${name} - Đội thi công chính`,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export function createMockWorkers(projectId: string, teams: Team[]): Worker[] {
  const data = [
    { code: 'CN001', fullName: 'Trần Văn Hùng', teamIdx: 0, position: 'Tổ trưởng' },
    { code: 'CN002', fullName: 'Lê Thị Hoa', teamIdx: 0, position: 'Công nhân' },
    { code: 'CN003', fullName: 'Phạm Văn Đức', teamIdx: 0, position: 'Công nhân' },
    { code: 'CN004', fullName: 'Nguyễn Thị Lan', teamIdx: 1, position: 'Tổ trưởng' },
    { code: 'CN005', fullName: 'Hoàng Văn Nam', teamIdx: 1, position: 'Công nhân' },
    { code: 'CN006', fullName: 'Vũ Thị Mai', teamIdx: 1, position: 'Công nhân' },
    { code: 'CN007', fullName: 'Đỗ Văn Tuấn', teamIdx: 2, position: 'Tổ trưởng' },
    { code: 'CN008', fullName: 'Bùi Thị Hương', teamIdx: 2, position: 'Công nhân' },
    { code: 'CN009', fullName: 'Ngô Văn Khoa', teamIdx: 2, position: 'Công nhân' },
    { code: 'CN010', fullName: 'Lý Văn Bình', teamIdx: 3, position: 'Tổ trưởng' },
    { code: 'CN011', fullName: 'Trịnh Thị Nga', teamIdx: 3, position: 'Kỹ thuật viên' },
    { code: 'CN012', fullName: 'Phan Văn Long', teamIdx: 3, position: 'An toàn viên' },
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
    { name: 'Tác phong BHLĐ chuẩn mực xuất sắc', category: 'bonus', points: 5, color: '#38a169', allowEditor: true, countAsViolation: false, isActive: true },
    { name: 'Có sáng kiến cải tiến kỹ thuật / an toàn', category: 'bonus', points: 10, color: '#38a169', allowEditor: true, countAsViolation: false, isActive: true },
    { name: 'Hoàn thành vượt tiến độ hạng mục', category: 'bonus', points: 10, color: '#38a169', allowEditor: true, countAsViolation: false, isActive: true },
    { name: 'Phát hiện và cảnh báo nguy cơ mất an toàn', category: 'bonus', points: 15, color: '#38a169', allowEditor: true, countAsViolation: false, isActive: true },
    { name: 'Trực ca an toàn / Vệ sinh 5S xuất sắc', category: 'bonus', points: 5, color: '#38a169', allowEditor: true, countAsViolation: false, isActive: true },
    { name: 'Tổ đội đạt 100% quân số chuyên cần tuần', category: 'attendance', points: 10, color: '#3182ce', allowEditor: false, countAsViolation: false, isActive: true },
    { name: 'Không đội mũ bảo hộ / Không đeo dây an toàn', category: 'penalty', points: -10, color: '#e53e3e', allowEditor: true, countAsViolation: true, isActive: true },
    { name: 'Sử dụng rượu bia, chất kích thích', category: 'penalty', points: -20, color: '#e53e3e', allowEditor: true, countAsViolation: true, isActive: true },
    { name: 'Đi trễ / Vắng mặt ca không lý do', category: 'penalty', points: -5, color: '#dd6b20', allowEditor: true, countAsViolation: false, isActive: true },
    { name: 'Vi phạm quy định PCCC / Hút thuốc sai nơi', category: 'penalty', points: -10, color: '#e53e3e', allowEditor: true, countAsViolation: true, isActive: true },
    { name: 'Thi công sai bản vẽ / Lỗi chất lượng', category: 'progress', points: -15, color: '#e53e3e', allowEditor: true, countAsViolation: false, isActive: true },
    { name: 'Làm hỏng / Thất thoát vật tư, thiết bị', category: 'penalty', points: -10, color: '#e53e3e', allowEditor: true, countAsViolation: true, isActive: true },
    { name: 'Không dọn dẹp vệ sinh sau ca', category: 'penalty', points: -5, color: '#dd6b20', allowEditor: true, countAsViolation: false, isActive: true },
    { name: 'Bị lập biên bản vi phạm ATLĐ', category: 'safety', points: -20, color: '#c53030', allowEditor: true, countAsViolation: true, isActive: true },
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
    displayName: 'Lê Hữu Trí',
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
  if (!hasData) return 'Chưa đủ dữ liệu';
  if (points >= thresholds.xuatSac) return 'Xuất sắc';
  if (points >= thresholds.tot) return 'Tốt';
  if (points >= thresholds.kha) return 'Khá';
  if (points >= thresholds.dat) return 'Đạt';
  return 'Chưa đạt';
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'Xuất sắc': return 'bg-green-600 text-white';
    case 'Tốt': return 'bg-blue-600 text-white';
    case 'Khá': return 'bg-cyan-600 text-white';
    case 'Đạt': return 'bg-yellow-500 text-white';
    case 'Chưa đạt': return 'bg-red-600 text-white';
    default: return 'bg-gray-400 text-white';
  }
}
