export type UserRole = 'admin' | 'editor' | 'viewer';
export type ScoreCategory = 'bonus' | 'penalty' | 'attendance' | 'safety' | 'progress' | 'team_bonus';
export type ConnectionStatus = 'connecting' | 'synced' | 'offline' | 'pending' | 'error' | 'not_configured';

export interface Project {
  id: string;
  name: string;
  packageName: string;
  commanderName: string;
  phone?: string;
  phase: string;
  startDateWeek1: string;
  totalWeeks: number;
  shiftsPerDay: number;
  slogan: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  teamIds?: string[];
  projectId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Worker {
  id: string;
  projectId: string;
  code: string;
  fullName: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  teamId: string;
  position: string;
  phone?: string;
  safetyCard?: string;
  medicalNote?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScoreRule {
  id: string;
  projectId: string;
  name: string;
  category: ScoreCategory;
  points: number;
  color: string;
  icon?: string;
  allowEditor: boolean;
  countAsViolation: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScoreTransaction {
  id: string;
  projectId: string;
  workerId: string;
  teamId: string;
  weekNumber: number;
  date: string;
  ruleId: string;
  ruleName: string;
  category: ScoreCategory;
  points: number;
  note?: string;
  evidenceUrl?: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  isUndone?: boolean;
}

export interface TeamBonus {
  id: string;
  projectId: string;
  teamId: string;
  weekNumber: number;
  points: number;
  reason: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

export interface WeeklyLock {
  id: string;
  projectId: string;
  weekNumber: number;
  date?: string;
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  unlockedAt?: string;
  unlockedBy?: string;
}

export interface GradeThresholds {
  xuatSac: number;
  tot: number;
  kha: number;
  dat: number;
}

export interface DashboardStats {
  totalWorkers: number;
  totalSafetyViolations: number;
  totalQualityIssues: number;
  teamRankings: TeamRanking[];
  totalPersonalPoints: number;
  totalTeamBonus: number;
  dataEntryProgress: { entered: number; total: number; percent: number };
  alerts: AlertItem[];
}

export interface TeamRanking {
  teamId: string;
  teamName: string;
  personalPoints: number;
  teamBonus: number;
  totalPoints: number;
  rank: number;
  violationCount: number;
  attendanceScore: number;
}

export interface AlertItem {
  id: string;
  type: 'safety' | 'progress' | 'missing_data' | 'other';
  severity: 'high' | 'medium' | 'low';
  message: string;
  workerId?: string;
  teamId?: string;
}

export interface WeekRange {
  weekNumber: number;
  startDate: string;
  endDate: string;
  days: { date: string; dayOfWeek: number; label: string }[];
}

export interface ShiftAssignment {
  id: string;
  projectId: string;
  weekNumber: number;
  date: string;
  shiftKey: string;
  workerId: string;
  teamId: string;
  note?: string;
  createdAt: string;
  createdBy: string;
}

export interface DemoAccount {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  teamIds?: string[];
}
