import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  Project, Team, Worker, ScoreRule, ScoreTransaction, TeamBonus,
  WeeklyLock, AppUser, ConnectionStatus, DashboardStats, WeekRange, GradeThresholds,
  ShiftAssignment, DemoAccount,
} from '../types';
import {
  createMockProject, createMockTeams, createMockWorkers,
  createMockScoreRules, createMockAdmin, DEFAULT_GRADE_THRESHOLDS,
} from '../utils/mockData';
import { addDays, format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface AppState {
  project: Project | null;
  teams: Team[];
  workers: Worker[];
  scoreRules: ScoreRule[];
  transactions: ScoreTransaction[];
  teamBonuses: TeamBonus[];
  locks: WeeklyLock[];
  shiftAssignments: ShiftAssignment[];
  currentUser: AppUser | null;
  connectionStatus: ConnectionStatus;
  selectedWeek: number;
  selectedMonth: number;
  gradeThresholds: GradeThresholds;
  isDemoMode: boolean;
}

interface AppContextType extends AppState {
  setSelectedWeek: (w: number) => void;
  setSelectedMonth: (m: number) => void;
  addWorker: (w: Omit<Worker, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWorker: (id: string, data: Partial<Worker>) => void;
  deleteWorker: (id: string) => void;
  addTeam: (name: string) => void;
  updateTeam: (id: string, data: Partial<Team>) => void;
  addTransaction: (tx: Omit<ScoreTransaction, 'id' | 'createdAt'>) => void;
  undoTransaction: (id: string) => void;
  lockWeek: (week: number) => void;
  unlockWeek: (week: number) => void;
  isWeekLocked: (week: number) => boolean;
  updateProject: (data: Partial<Project>) => void;
  updateScoreRule: (id: string, data: Partial<ScoreRule>) => void;
  addScoreRule: (rule: Omit<ScoreRule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addTeamBonus: (bonus: Omit<TeamBonus, 'id' | 'createdAt'>) => void;
  assignShift: (a: Omit<ShiftAssignment, 'id' | 'createdAt'>) => void;
  removeShiftAssignment: (id: string) => void;
  getWeekRange: (weekNumber: number) => WeekRange;
  getWorkerWeekPoints: (workerId: string, week: number) => { plus: number; minus: number; total: number };
  getTeamWeekPoints: (teamId: string, week: number) => { personal: number; bonus: number; total: number };
  getDashboardStats: () => DashboardStats;
  getVisibleWorkers: () => Worker[];
  getVisibleTeams: () => Team[];
  clearDemoData: () => void;
  seedDemoData: () => void;
  loginAs: (role: 'admin' | 'editor' | 'viewer') => void;
  loginWithPassword: (email: string, password: string) => { ok: boolean; message: string };
  logout: () => void;
  demoAccounts: DemoAccount[];
}

const AppContext = createContext<AppContextType | null>(null);
const STORAGE_KEY = 'qlct_demo_data_v3';
const AUTH_KEY = 'qlct_auth_session_v1';

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'lehuutri@congtruong.vn', password: 'admin123', displayName: 'L\u00ea H\u1eefu Tr\u00ed', role: 'admin' },
  { email: 'dotruong@congtruong.vn', password: 'editor123', displayName: 'Tr\u1ea7n V\u0103n H\u00f9ng (\u0110\u1ed9i tr\u01b0\u1edfng)', role: 'editor', teamIds: ['team-1'] },
  { email: 'chudautu@example.com', password: 'viewer123', displayName: 'Ch\u1ee7 \u0111\u1ea7u t\u01b0 / T\u01b0 v\u1ea5n', role: 'viewer' },
];

function userFromAccount(acc: DemoAccount, projectId: string): AppUser {
  return {
    id: `user-${acc.role}-${acc.email}`,
    email: acc.email,
    displayName: acc.displayName,
    role: acc.role,
    teamIds: acc.teamIds,
    projectId,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    let currentUser: AppUser | null = null;
    try {
      const authSaved = localStorage.getItem(AUTH_KEY);
      if (authSaved) currentUser = JSON.parse(authSaved);
    } catch { /* ignore */ }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          shiftAssignments: parsed.shiftAssignments || [],
          currentUser: currentUser ?? parsed.currentUser ?? null,
          connectionStatus: 'not_configured' as ConnectionStatus,
          isDemoMode: true,
        };
      } catch { /* ignore */ }
    }
    return {
      project: null, teams: [], workers: [], scoreRules: [], transactions: [],
      teamBonuses: [], locks: [], shiftAssignments: [],
      currentUser, connectionStatus: 'not_configured' as ConnectionStatus,
      selectedWeek: 1, selectedMonth: 1, gradeThresholds: DEFAULT_GRADE_THRESHOLDS, isDemoMode: true,
    };
  });

  useEffect(() => {
    if (state.isDemoMode && state.project) {
      const toSave = {
        project: state.project, teams: state.teams, workers: state.workers,
        scoreRules: state.scoreRules, transactions: state.transactions, teamBonuses: state.teamBonuses,
        locks: state.locks, shiftAssignments: state.shiftAssignments,
        selectedWeek: state.selectedWeek, selectedMonth: state.selectedMonth,
        gradeThresholds: state.gradeThresholds, isDemoMode: true,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
    if (state.currentUser) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(state.currentUser));
    }
  }, [state]);

  const seedDemoData = useCallback(() => {
    const project = createMockProject();
    const teams = createMockTeams(project.id);
    const workers = createMockWorkers(project.id, teams);
    const scoreRules = createMockScoreRules(project.id);
    const admin = createMockAdmin(project.id);
    setState(prev => ({
      ...prev, project, teams, workers, scoreRules, transactions: [], teamBonuses: [],
      locks: [], shiftAssignments: [],
      currentUser: prev.currentUser ?? admin,
      connectionStatus: 'not_configured', isDemoMode: true, selectedWeek: 1,
    }));
  }, []);

  const clearDemoData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(s => ({
      project: null, teams: [], workers: [], scoreRules: [], transactions: [], teamBonuses: [],
      locks: [], shiftAssignments: [], currentUser: s.currentUser, connectionStatus: 'not_configured',
      selectedWeek: 1, selectedMonth: 1, gradeThresholds: DEFAULT_GRADE_THRESHOLDS, isDemoMode: true,
    }));
  }, []);

  useEffect(() => {
    if (!state.project && state.isDemoMode) seedDemoData();
  }, []);

  const getWeekRange = useCallback((weekNumber: number): WeekRange => {
    if (!state.project) return { weekNumber, startDate: '', endDate: '', days: [] };
    const start = parseISO(state.project.startDateWeek1);
    const weekStart = addDays(start, (weekNumber - 1) * 7);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i);
      return { date: format(d, 'yyyy-MM-dd'), dayOfWeek: i, label: format(d, 'EEEE dd/MM', { locale: vi }) };
    });
    return {
      weekNumber, startDate: format(weekStart, 'yyyy-MM-dd'),
      endDate: format(addDays(weekStart, 6), 'yyyy-MM-dd'), days,
    };
  }, [state.project]);

  const getWorkerWeekPoints = useCallback((workerId: string, week: number) => {
    const txs = state.transactions.filter(t => t.workerId === workerId && t.weekNumber === week && !t.isUndone);
    const plus = txs.filter(t => t.points > 0).reduce((s, t) => s + t.points, 0);
    const minus = txs.filter(t => t.points < 0).reduce((s, t) => s + t.points, 0);
    return { plus, minus, total: plus + minus };
  }, [state.transactions]);

  const getTeamWeekPoints = useCallback((teamId: string, week: number) => {
    const workerIds = state.workers.filter(w => w.teamId === teamId && w.isActive).map(w => w.id);
    const personal = workerIds.reduce((sum, wid) => sum + getWorkerWeekPoints(wid, week).total, 0);
    const bonus = state.teamBonuses.filter(b => b.teamId === teamId && b.weekNumber === week).reduce((s, b) => s + b.points, 0);
    return { personal, bonus, total: personal + bonus };
  }, [state.workers, state.teamBonuses, getWorkerWeekPoints]);

  const getVisibleWorkers = useCallback(() => {
    const active = state.workers.filter(w => w.isActive);
    if (!state.currentUser) return active;
    if (state.currentUser.role === 'admin' || state.currentUser.role === 'viewer') return active;
    const tids = state.currentUser.teamIds || [];
    if (!tids.length) return active;
    return active.filter(w => tids.includes(w.teamId));
  }, [state.workers, state.currentUser]);

  const getVisibleTeams = useCallback(() => {
    const active = state.teams.filter(t => t.isActive);
    if (!state.currentUser) return active;
    if (state.currentUser.role === 'admin' || state.currentUser.role === 'viewer') return active;
    const tids = state.currentUser.teamIds || [];
    if (!tids.length) return active;
    return active.filter(t => tids.includes(t.id));
  }, [state.teams, state.currentUser]);

  const getDashboardStats = useCallback((): DashboardStats => {
    const visibleWorkers = getVisibleWorkers();
    const week = state.selectedWeek;
    const safetyViolations = state.transactions.filter(
      t => t.weekNumber === week && !t.isUndone && (t.category === 'safety' || (t.category === 'penalty' && t.points < 0))
        && visibleWorkers.some(w => w.id === t.workerId)
    ).length;

    const teamRankings = getVisibleTeams().map(team => {
      const pts = getTeamWeekPoints(team.id, week);
      const violations = state.transactions.filter(t => t.teamId === team.id && t.weekNumber === week && !t.isUndone && t.points < 0).length;
      return {
        teamId: team.id, teamName: team.name, personalPoints: pts.personal, teamBonus: pts.bonus,
        totalPoints: pts.total, rank: 0, violationCount: violations, attendanceScore: 0,
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints || a.violationCount - b.violationCount)
      .map((t, i) => ({ ...t, rank: i + 1 }));

    const enteredIds = new Set(state.transactions.filter(t => t.weekNumber === week && !t.isUndone).map(t => t.workerId));
    const missing = visibleWorkers.filter(w => !enteredIds.has(w.id));
    const alerts = missing.slice(0, 20).map(w => ({
      id: `missing-${w.id}-w${week}`,
      type: 'missing_data' as const,
      severity: 'medium' as const,
      message: `${w.fullName} (${w.code}) ch\u01b0a c\u00f3 nh\u1eadt k\u00fd KPI tu\u1ea7n ${week}`,
      workerId: w.id,
      teamId: w.teamId,
    }));

    return {
      totalWorkers: visibleWorkers.length,
      totalSafetyViolations: safetyViolations,
      totalQualityIssues: state.transactions.filter(t => t.category === 'progress' && t.weekNumber === week && !t.isUndone).length,
      teamRankings,
      totalPersonalPoints: teamRankings.reduce((s, t) => s + t.personalPoints, 0),
      totalTeamBonus: teamRankings.reduce((s, t) => s + t.teamBonus, 0),
      dataEntryProgress: {
        entered: enteredIds.size,
        total: visibleWorkers.length,
        percent: visibleWorkers.length ? Math.round((enteredIds.size / visibleWorkers.length) * 100) : 0,
      },
      alerts,
    };
  }, [state, getTeamWeekPoints, getVisibleWorkers, getVisibleTeams]);

  const isWeekLocked = useCallback((week: number) => {
    return state.locks.some(l => l.weekNumber === week && !l.date && l.isLocked);
  }, [state.locks]);

  const value: AppContextType = {
    ...state,
    demoAccounts: DEMO_ACCOUNTS,
    setSelectedWeek: (w) => setState(s => ({ ...s, selectedWeek: w })),
    setSelectedMonth: (m) => setState(s => ({ ...s, selectedMonth: m })),
    addWorker: (w) => setState(s => ({
      ...s, workers: [...s.workers, { ...w, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
    })),
    updateWorker: (id, data) => setState(s => ({
      ...s, workers: s.workers.map(w => w.id === id ? { ...w, ...data, updatedAt: new Date().toISOString() } : w),
    })),
    deleteWorker: (id) => setState(s => ({
      ...s, workers: s.workers.map(w => w.id === id ? { ...w, isActive: false } : w),
    })),
    addTeam: (name) => setState(s => ({
      ...s, teams: [...s.teams, {
        id: uuidv4(), projectId: s.project!.id, name, isActive: true,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }],
    })),
    updateTeam: (id, data) => setState(s => ({
      ...s, teams: s.teams.map(t => t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t),
    })),
    addTransaction: (tx) => {
      if (isWeekLocked(tx.weekNumber)) return;
      setState(s => ({
        ...s, transactions: [...s.transactions, { ...tx, id: uuidv4(), createdAt: new Date().toISOString() }],
      }));
    },
    undoTransaction: (id) => setState(s => ({
      ...s, transactions: s.transactions.map(t => t.id === id ? { ...t, isUndone: true } : t),
    })),
    lockWeek: (week) => setState(s => ({
      ...s, locks: [...s.locks.filter(l => !(l.weekNumber === week && !l.date)), {
        id: `${s.project!.id}_w${week}`, projectId: s.project!.id, weekNumber: week,
        isLocked: true, lockedAt: new Date().toISOString(), lockedBy: s.currentUser?.id,
      }],
    })),
    unlockWeek: (week) => setState(s => ({
      ...s, locks: s.locks.map(l => l.weekNumber === week && !l.date
        ? { ...l, isLocked: false, unlockedAt: new Date().toISOString(), unlockedBy: s.currentUser?.id } : l),
    })),
    isWeekLocked,
    updateProject: (data) => setState(s => ({
      ...s, project: s.project ? { ...s.project, ...data, updatedAt: new Date().toISOString() } : null,
    })),
    updateScoreRule: (id, data) => setState(s => ({
      ...s, scoreRules: s.scoreRules.map(r => r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r),
    })),
    addScoreRule: (rule) => setState(s => ({
      ...s, scoreRules: [...s.scoreRules, {
        ...rule, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }],
    })),
    addTeamBonus: (bonus) => setState(s => ({
      ...s, teamBonuses: [...s.teamBonuses, { ...bonus, id: uuidv4(), createdAt: new Date().toISOString() }],
    })),
    assignShift: (a) => setState(s => {
      const filtered = s.shiftAssignments.filter(
        x => !(x.date === a.date && x.shiftKey === a.shiftKey && x.workerId === a.workerId)
      );
      return {
        ...s,
        shiftAssignments: [...filtered, { ...a, id: uuidv4(), createdAt: new Date().toISOString() }],
      };
    }),
    removeShiftAssignment: (id) => setState(s => ({
      ...s, shiftAssignments: s.shiftAssignments.filter(x => x.id !== id),
    })),
    getWeekRange, getWorkerWeekPoints, getTeamWeekPoints, getDashboardStats,
    getVisibleWorkers, getVisibleTeams,
    clearDemoData, seedDemoData,
    loginAs: (role) => {
      if (!state.project) return;
      const acc = DEMO_ACCOUNTS.find(a => a.role === role) || DEMO_ACCOUNTS[0];
      const teamIds = role === 'editor' ? state.teams.slice(0, 1).map(t => t.id) : acc.teamIds;
      setState(s => ({
        ...s,
        currentUser: { ...userFromAccount({ ...acc, teamIds }, state.project!.id), teamIds },
      }));
    },
    loginWithPassword: (email, password) => {
      const acc = DEMO_ACCOUNTS.find(
        a => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
      );
      if (!acc) return { ok: false, message: 'Email ho\u1eb7c m\u1eadt kh\u1ea9u kh\u00f4ng \u0111\u00fang' };
      if (!state.project) return { ok: false, message: 'Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u d\u1ef1 \u00e1n' };
      const teamIds = acc.role === 'editor' ? state.teams.slice(0, 1).map(t => t.id) : acc.teamIds;
      setState(s => ({
        ...s,
        currentUser: { ...userFromAccount({ ...acc, teamIds }, state.project!.id), teamIds },
      }));
      return { ok: true, message: '\u0110\u0103ng nh\u1eadp th\u00e0nh c\u00f4ng' };
    },
    logout: () => {
      localStorage.removeItem(AUTH_KEY);
      setState(s => ({ ...s, currentUser: null }));
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
