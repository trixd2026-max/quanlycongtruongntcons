import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  Project, Team, Worker, ScoreRule, ScoreTransaction, TeamBonus,
  WeeklyLock, AppUser, ConnectionStatus, DashboardStats, WeekRange, GradeThresholds,
  ShiftAssignment, DemoAccount, ProgressItem, AuditLog,
} from '../types';
import {
  createMockProject, createMockTeams, createMockWorkers,
  createMockScoreRules, createMockAdmin, DEFAULT_GRADE_THRESHOLDS,
} from '../utils/mockData';
import { addDays, format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { isFirebaseConfigured } from '../lib/firebase';
import { firebaseLogin, firebaseLogout, firebaseRegister, subscribeAuth } from '../lib/authService';
import {
  fsSet, fsDelete, fsSaveProject, fsAddAudit, subscribeProjectData, seedProjectToFirestore,
} from '../lib/firestoreSync';

interface AppState {
  project: Project | null;
  teams: Team[];
  workers: Worker[];
  scoreRules: ScoreRule[];
  transactions: ScoreTransaction[];
  teamBonuses: TeamBonus[];
  locks: WeeklyLock[];
  shiftAssignments: ShiftAssignment[];
  progressItems: ProgressItem[];
  auditLogs: AuditLog[];
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
  addProgressItem: (item: Omit<ProgressItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProgressItem: (id: string, data: Partial<ProgressItem>) => void;
  deleteProgressItem: (id: string) => void;
  pushAudit: (action: string, detail: string, entityType?: string, entityId?: string) => void;
  syncToCloud: () => Promise<void>;
  getWeekRange: (weekNumber: number) => WeekRange;
  getWorkerWeekPoints: (workerId: string, week: number) => { plus: number; minus: number; total: number };
  getTeamWeekPoints: (teamId: string, week: number) => { personal: number; bonus: number; total: number };
  getDashboardStats: () => DashboardStats;
  getVisibleWorkers: () => Worker[];
  getVisibleTeams: () => Team[];
  clearDemoData: () => void;
  seedDemoData: () => void;
  loginAs: (role: 'admin' | 'editor' | 'viewer') => void;
  loginWithPassword: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  registerWithPassword: (email: string, password: string, displayName: string, role?: 'admin' | 'editor' | 'viewer') => Promise<{ ok: boolean; message: string }>;
  firebaseEnabled: boolean;
  logout: () => void;
  demoAccounts: DemoAccount[];
}

const AppContext = createContext<AppContextType | null>(null);
const STORAGE_KEY = 'qlct_demo_data_v3';
const AUTH_KEY = 'qlct_auth_session_v1';

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'lehuutri@congtruong.vn', password: 'admin123', displayName: 'Le Huu Tri', role: 'admin' },
  { email: 'dotruong@congtruong.vn', password: 'editor123', displayName: 'Tran Van Hung (Doi truong)', role: 'editor', teamIds: ['team-1'] },
  { email: 'chudautu@example.com', password: 'viewer123', displayName: 'Chu dau tu / Tu van', role: 'viewer' },
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
          progressItems: parsed.progressItems || [],
          auditLogs: parsed.auditLogs || [],
          teams: parsed.teams || [],
          workers: parsed.workers || [],
          currentUser: currentUser ?? parsed.currentUser ?? null,
          connectionStatus: 'not_configured' as ConnectionStatus,
          isDemoMode: true,
        };
      } catch { /* ignore */ }
    }
    return {
      project: null, teams: [], workers: [], scoreRules: [], transactions: [],
      teamBonuses: [], locks: [], shiftAssignments: [], progressItems: [], auditLogs: [],
      currentUser, connectionStatus: 'not_configured' as ConnectionStatus,
      selectedWeek: 1, selectedMonth: 1, gradeThresholds: DEFAULT_GRADE_THRESHOLDS, isDemoMode: true,
    };
  });

  useEffect(() => {
    if (state.project) {
      const toSave = {
        project: state.project, teams: state.teams, workers: state.workers,
        scoreRules: state.scoreRules, transactions: state.transactions, teamBonuses: state.teamBonuses,
        locks: state.locks, shiftAssignments: state.shiftAssignments,
        progressItems: state.progressItems || [], auditLogs: state.auditLogs || [],
        selectedWeek: state.selectedWeek, selectedMonth: state.selectedMonth,
        gradeThresholds: state.gradeThresholds, isDemoMode: state.isDemoMode,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
    if (state.currentUser) localStorage.setItem(AUTH_KEY, JSON.stringify(state.currentUser));
  }, [state]);

  const seedDemoData = useCallback(() => {
    const project = createMockProject();
    const teams = createMockTeams(project.id);
    const workers = createMockWorkers(project.id, teams);
    const scoreRules = createMockScoreRules(project.id);
    const admin = createMockAdmin(project.id);
    setState(prev => ({
      ...prev, project, teams, workers, scoreRules, transactions: [], teamBonuses: [],
      locks: [], shiftAssignments: [], progressItems: [], auditLogs: [],
      currentUser: prev.currentUser ?? admin,
      connectionStatus: isFirebaseConfigured() ? 'synced' : 'not_configured',
      isDemoMode: !isFirebaseConfigured(),
      selectedWeek: 1,
    }));
    if (isFirebaseConfigured()) {
      void seedProjectToFirestore({ project, teams, workers, scoreRules });
    }
  }, []);

  const clearDemoData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(s => ({
      project: null, teams: [], workers: [], scoreRules: [], transactions: [], teamBonuses: [],
      locks: [], shiftAssignments: [], progressItems: [], auditLogs: [], currentUser: s.currentUser,
      connectionStatus: isFirebaseConfigured() ? 'synced' : 'not_configured',
      selectedWeek: 1, selectedMonth: 1, gradeThresholds: DEFAULT_GRADE_THRESHOLDS,
      isDemoMode: !isFirebaseConfigured(),
    }));
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setState(s => ({ ...s, connectionStatus: 'not_configured', isDemoMode: true }));
      return;
    }
    setState(s => ({ ...s, connectionStatus: 'connecting', isDemoMode: false }));
    const unsub = subscribeAuth((user) => {
      setState(s => ({ ...s, currentUser: user, connectionStatus: 'synced', isDemoMode: false }));
    });
    return () => { unsub && unsub(); };
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured() || !state.project?.id) return;
    const projectId = state.project.id;
    const unsubs = subscribeProjectData(projectId, {
      onProject: (proj) => { if (proj) setState(s => ({ ...s, project: proj, connectionStatus: 'synced' })); },
      onTeams: (teams) => setState(s => {
        if ((!teams || teams.length === 0) && (s.teams?.length || 0) > 0) {
          void seedProjectToFirestore({ project: s.project!, teams: s.teams, workers: s.workers, scoreRules: s.scoreRules });
          return { ...s, connectionStatus: 'synced' };
        }
        if (teams && teams.length > 0) return { ...s, teams, connectionStatus: 'synced' };
        return { ...s, connectionStatus: 'synced' };
      }),
      onWorkers: (workers) => setState(s => {
        if ((!workers || workers.length === 0) && (s.workers?.length || 0) > 0) return { ...s, connectionStatus: 'synced' };
        if (workers && workers.length > 0) return { ...s, workers, connectionStatus: 'synced' };
        return { ...s, connectionStatus: 'synced' };
      }),
      onRules: (scoreRules) => setState(s => {
        if ((!scoreRules || scoreRules.length === 0) && (s.scoreRules?.length || 0) > 0) return { ...s, connectionStatus: 'synced' };
        if (scoreRules && scoreRules.length > 0) return { ...s, scoreRules, connectionStatus: 'synced' };
        return { ...s, connectionStatus: 'synced' };
      }),
      onTransactions: (transactions) => setState(s => ({ ...s, transactions: transactions?.length ? transactions : s.transactions, connectionStatus: 'synced' })),
      onLocks: (locks) => setState(s => ({ ...s, locks: locks?.length ? locks : s.locks, connectionStatus: 'synced' })),
      onShifts: (shiftAssignments) => setState(s => ({ ...s, shiftAssignments: shiftAssignments?.length ? shiftAssignments : s.shiftAssignments, connectionStatus: 'synced' })),
      onProgress: (progressItems) => setState(s => ({ ...s, progressItems: progressItems?.length ? progressItems : (s.progressItems || []), connectionStatus: 'synced' })),
      onBonuses: (teamBonuses) => setState(s => ({ ...s, teamBonuses: teamBonuses?.length ? teamBonuses : s.teamBonuses, connectionStatus: 'synced' })),
      onAudit: (auditLogs) => {
        const sorted = [...(auditLogs || [])].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setState(s => ({ ...s, auditLogs: sorted.length ? sorted.slice(0, 200) : (s.auditLogs || []), connectionStatus: 'synced' }));
      },
      onError: () => setState(s => ({ ...s, connectionStatus: 'error' })),
    });
    return () => unsubs.forEach(u => u());
  }, [state.project?.id]);

  useEffect(() => { if (!state.project) seedDemoData(); }, []);

  const getWeekRange = useCallback((weekNumber: number): WeekRange => {
    if (!state.project) return { weekNumber, startDate: '', endDate: '', days: [] };
    const start = parseISO(state.project.startDateWeek1);
    const weekStart = addDays(start, (weekNumber - 1) * 7);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i);
      return { date: format(d, 'yyyy-MM-dd'), dayOfWeek: i, label: format(d, 'EEEE dd/MM', { locale: vi }) };
    });
    return { weekNumber, startDate: format(weekStart, 'yyyy-MM-dd'), endDate: format(addDays(weekStart, 6), 'yyyy-MM-dd'), days };
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
      return { teamId: team.id, teamName: team.name, personalPoints: pts.personal, teamBonus: pts.bonus, totalPoints: pts.total, rank: 0, violationCount: violations, attendanceScore: 0 };
    }).sort((a, b) => b.totalPoints - a.totalPoints || a.violationCount - b.violationCount).map((t, i) => ({ ...t, rank: i + 1 }));
    const enteredIds = new Set(state.transactions.filter(t => t.weekNumber === week && !t.isUndone).map(t => t.workerId));
    const missing = visibleWorkers.filter(w => !enteredIds.has(w.id));
    const alerts = missing.slice(0, 20).map(w => ({
      id: `missing-${w.id}-w${week}`, type: 'missing_data' as const, severity: 'medium' as const,
      message: `${w.fullName} (${w.code}) chua co nhat ky KPI tuan ${week}`, workerId: w.id, teamId: w.teamId,
    }));
    return {
      totalWorkers: visibleWorkers.length, totalSafetyViolations: safetyViolations,
      totalQualityIssues: state.transactions.filter(t => t.category === 'progress' && t.weekNumber === week && !t.isUndone).length,
      teamRankings,
      totalPersonalPoints: teamRankings.reduce((s, t) => s + t.personalPoints, 0),
      totalTeamBonus: teamRankings.reduce((s, t) => s + t.teamBonus, 0),
      dataEntryProgress: { entered: enteredIds.size, total: visibleWorkers.length, percent: visibleWorkers.length ? Math.round((enteredIds.size / visibleWorkers.length) * 100) : 0 },
      alerts,
    };
  }, [state, getTeamWeekPoints, getVisibleWorkers, getVisibleTeams]);

  const isWeekLocked = useCallback((week: number) => state.locks.some(l => l.weekNumber === week && !l.date && l.isLocked), [state.locks]);

  const value: AppContextType = {
    ...state,
    progressItems: state.progressItems || [],
    auditLogs: state.auditLogs || [],
    demoAccounts: DEMO_ACCOUNTS,
    firebaseEnabled: isFirebaseConfigured(),
    setSelectedWeek: (w) => setState(s => ({ ...s, selectedWeek: w })),
    setSelectedMonth: (m) => setState(s => ({ ...s, selectedMonth: m })),
    addWorker: (w) => setState(s => {
      const row = { ...w, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      if (s.project) void fsSet(s.project.id, 'workers', row.id, row as unknown as Record<string, unknown>);
      return { ...s, workers: [...s.workers, row] };
    }),
    updateWorker: (id, data) => setState(s => {
      const workers = s.workers.map(w => w.id === id ? { ...w, ...data, updatedAt: new Date().toISOString() } : w);
      const row = workers.find(w => w.id === id);
      if (row && s.project) void fsSet(s.project.id, 'workers', id, row as unknown as Record<string, unknown>);
      return { ...s, workers };
    }),
    deleteWorker: (id) => setState(s => {
      const workers = s.workers.map(w => w.id === id ? { ...w, isActive: false } : w);
      const row = workers.find(w => w.id === id);
      if (row && s.project) void fsSet(s.project.id, 'workers', id, row as unknown as Record<string, unknown>);
      return { ...s, workers };
    }),
    addTeam: (name) => setState(s => {
      const row = { id: uuidv4(), projectId: s.project!.id, name, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      void fsSet(s.project!.id, 'teams', row.id, row as unknown as Record<string, unknown>);
      return { ...s, teams: [...s.teams, row] };
    }),
    updateTeam: (id, data) => setState(s => ({
      ...s, teams: s.teams.map(t => t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t),
    })),
    addTransaction: (tx) => {
      if (isWeekLocked(tx.weekNumber)) return;
      const id = uuidv4();
      const row = { ...tx, id, createdAt: new Date().toISOString() };
      setState(s => {
        if (s.project) void fsSet(s.project.id, 'transactions', id, row as unknown as Record<string, unknown>);
        return { ...s, transactions: [...s.transactions, row] };
      });
    },
    undoTransaction: (id) => setState(s => ({
      ...s, transactions: s.transactions.map(t => t.id === id ? { ...t, isUndone: true } : t),
    })),
    lockWeek: (week) => setState(s => {
      const lock = { id: `${s.project!.id}_w${week}`, projectId: s.project!.id, weekNumber: week, isLocked: true, lockedAt: new Date().toISOString(), lockedBy: s.currentUser?.id };
      void fsSet(s.project!.id, 'locks', lock.id, lock as unknown as Record<string, unknown>);
      return { ...s, locks: [...s.locks.filter(l => !(l.weekNumber === week && !l.date)), lock] };
    }),
    unlockWeek: (week) => setState(s => ({
      ...s, locks: s.locks.map(l => l.weekNumber === week && !l.date ? { ...l, isLocked: false, unlockedAt: new Date().toISOString(), unlockedBy: s.currentUser?.id } : l),
    })),
    isWeekLocked,
    updateProject: (data) => setState(s => {
      if (!s.project) return s;
      const project = { ...s.project, ...data, updatedAt: new Date().toISOString() };
      void fsSaveProject(project);
      return { ...s, project };
    }),
    updateScoreRule: (id, data) => setState(s => ({
      ...s, scoreRules: s.scoreRules.map(r => r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r),
    })),
    addScoreRule: (rule) => setState(s => ({
      ...s, scoreRules: [...s.scoreRules, { ...rule, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
    })),
    addTeamBonus: (bonus) => setState(s => ({
      ...s, teamBonuses: [...s.teamBonuses, { ...bonus, id: uuidv4(), createdAt: new Date().toISOString() }],
    })),
    assignShift: (a) => setState(s => {
      const row = { ...a, id: uuidv4(), createdAt: new Date().toISOString() };
      const filtered = s.shiftAssignments.filter(x => !(x.date === a.date && x.shiftKey === a.shiftKey && x.workerId === a.workerId));
      if (s.project) void fsSet(s.project.id, 'shifts', row.id, row as unknown as Record<string, unknown>);
      return { ...s, shiftAssignments: [...filtered, row] };
    }),
    removeShiftAssignment: (id) => setState(s => {
      if (s.project) void fsDelete(s.project.id, 'shifts', id);
      return { ...s, shiftAssignments: s.shiftAssignments.filter(x => x.id !== id) };
    }),
    addProgressItem: (item) => setState(s => {
      const row: ProgressItem = { ...item, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      if (s.project) void fsSet(s.project.id, 'progress', row.id, row as unknown as Record<string, unknown>);
      return { ...s, progressItems: [...(s.progressItems || []), row] };
    }),
    updateProgressItem: (id, data) => setState(s => {
      const progressItems = (s.progressItems || []).map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p);
      const row = progressItems.find(p => p.id === id);
      if (row && s.project) void fsSet(s.project.id, 'progress', id, row as unknown as Record<string, unknown>);
      return { ...s, progressItems };
    }),
    deleteProgressItem: (id) => setState(s => {
      if (s.project) void fsDelete(s.project.id, 'progress', id);
      return { ...s, progressItems: (s.progressItems || []).filter(p => p.id !== id) };
    }),
    pushAudit: (action, detail, entityType, entityId) => setState(s => {
      const log: AuditLog = { id: uuidv4(), projectId: s.project?.id || '', action, detail, entityType, entityId, userId: s.currentUser?.id || '', userName: s.currentUser?.displayName || '', createdAt: new Date().toISOString() };
      if (s.project) void fsAddAudit(s.project.id, log);
      return { ...s, auditLogs: [log, ...(s.auditLogs || [])].slice(0, 200) };
    }),
    syncToCloud: async () => {
      if (!state.project || !isFirebaseConfigured()) return;
      await seedProjectToFirestore({ project: state.project, teams: state.teams, workers: state.workers, scoreRules: state.scoreRules });
      setState(s => ({ ...s, connectionStatus: 'synced', isDemoMode: false }));
    },
    getWeekRange, getWorkerWeekPoints, getTeamWeekPoints, getDashboardStats, getVisibleWorkers, getVisibleTeams,
    clearDemoData, seedDemoData,
    loginAs: (role) => {
      if (!state.project) return;
      const acc = DEMO_ACCOUNTS.find(a => a.role === role) || DEMO_ACCOUNTS[0];
      const teamIds = role === 'editor' ? state.teams.slice(0, 1).map(t => t.id) : acc.teamIds;
      setState(s => ({ ...s, currentUser: { ...userFromAccount({ ...acc, teamIds }, state.project!.id), teamIds } }));
    },
    loginWithPassword: async (email, password) => {
      if (isFirebaseConfigured()) {
        const res = await firebaseLogin(email, password);
        if (res.ok && res.user) setState(s => ({ ...s, currentUser: res.user!, connectionStatus: 'synced', isDemoMode: false }));
        return { ok: res.ok, message: res.message };
      }
      const acc = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password);
      if (!acc) return { ok: false, message: 'Email/mat khau sai' };
      if (!state.project) return { ok: false, message: 'Chua co du an' };
      const teamIds = acc.role === 'editor' ? state.teams.slice(0, 1).map(t => t.id) : acc.teamIds;
      setState(s => ({ ...s, currentUser: { ...userFromAccount({ ...acc, teamIds }, state.project!.id), teamIds } }));
      return { ok: true, message: 'OK' };
    },
    registerWithPassword: async (email, password, displayName, role = 'viewer') => {
      if (!isFirebaseConfigured()) return { ok: false, message: 'Can Firebase' };
      const res = await firebaseRegister(email, password, displayName, role);
      if (res.ok && res.user) setState(s => ({ ...s, currentUser: res.user!, connectionStatus: 'synced', isDemoMode: false }));
      return { ok: res.ok, message: res.message };
    },
    logout: () => {
      localStorage.removeItem(AUTH_KEY);
      if (isFirebaseConfigured()) void firebaseLogout();
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
