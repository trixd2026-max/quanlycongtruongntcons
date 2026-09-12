import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  Project, Team, Worker, ScoreRule, ScoreTransaction, TeamBonus,
  WeeklyLock, AppUser, ConnectionStatus, DashboardStats, WeekRange, GradeThresholds
} from '../types';
import {
  createMockProject, createMockTeams, createMockWorkers,
  createMockScoreRules, createMockAdmin, DEFAULT_GRADE_THRESHOLDS
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
  getWeekRange: (weekNumber: number) => WeekRange;
  getWorkerWeekPoints: (workerId: string, week: number) => { plus: number; minus: number; total: number };
  getTeamWeekPoints: (teamId: string, week: number) => { personal: number; bonus: number; total: number };
  getDashboardStats: () => DashboardStats;
  clearDemoData: () => void;
  seedDemoData: () => void;
  loginAs: (role: 'admin' | 'editor' | 'viewer') => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);
const STORAGE_KEY = 'qlct_demo_data_v1';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...parsed, connectionStatus: 'not_configured' as ConnectionStatus, isDemoMode: true };
      } catch {}
    }
    return {
      project: null, teams: [], workers: [], scoreRules: [], transactions: [],
      teamBonuses: [], locks: [], currentUser: null, connectionStatus: 'not_configured' as ConnectionStatus,
      selectedWeek: 1, selectedMonth: 1, gradeThresholds: DEFAULT_GRADE_THRESHOLDS, isDemoMode: true,
    };
  });

  useEffect(() => {
    if (state.isDemoMode && state.project) {
      const toSave = {
        project: state.project, teams: state.teams, workers: state.workers,
        scoreRules: state.scoreRules, transactions: state.transactions, teamBonuses: state.teamBonuses,
        locks: state.locks, currentUser: state.currentUser, selectedWeek: state.selectedWeek,
        selectedMonth: state.selectedMonth, gradeThresholds: state.gradeThresholds, isDemoMode: true,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
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
      locks: [], currentUser: admin, connectionStatus: 'not_configured', isDemoMode: true, selectedWeek: 1,
    }));
  }, []);

  const clearDemoData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      project: null, teams: [], workers: [], scoreRules: [], transactions: [], teamBonuses: [],
      locks: [], currentUser: null, connectionStatus: 'not_configured', selectedWeek: 1,
      selectedMonth: 1, gradeThresholds: DEFAULT_GRADE_THRESHOLDS, isDemoMode: true,
    });
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

  const getDashboardStats = useCallback((): DashboardStats => {
    const activeWorkers = state.workers.filter(w => w.isActive);
    const week = state.selectedWeek;
    const safetyViolations = state.transactions.filter(
      t => t.weekNumber === week && !t.isUndone && (t.category === 'safety' || (t.category === 'penalty' && t.points < 0))
    ).length;
    const teamRankings = state.teams.filter(t => t.isActive).map(team => {
      const pts = getTeamWeekPoints(team.id, week);
      const violations = state.transactions.filter(t => t.teamId === team.id && t.weekNumber === week && !t.isUndone && t.points < 0).length;
      return {
        teamId: team.id, teamName: team.name, personalPoints: pts.personal, teamBonus: pts.bonus,
        totalPoints: pts.total, rank: 0, violationCount: violations, attendanceScore: 0,
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints || a.violationCount - b.violationCount)
      .map((t, i) => ({ ...t, rank: i + 1 }));

    return {
      totalWorkers: activeWorkers.length, totalSafetyViolations: safetyViolations,
      totalQualityIssues: state.transactions.filter(t => t.category === 'progress' && t.weekNumber === week && !t.isUndone).length,
      teamRankings, totalPersonalPoints: teamRankings.reduce((s, t) => s + t.personalPoints, 0),
      totalTeamBonus: teamRankings.reduce((s, t) => s + t.teamBonus, 0),
      dataEntryProgress: {
        entered: new Set(state.transactions.filter(t => t.weekNumber === week).map(t => t.workerId)).size,
        total: activeWorkers.length,
        percent: activeWorkers.length ? Math.round((new Set(state.transactions.filter(t => t.weekNumber === week).map(t => t.workerId)).size / activeWorkers.length) * 100) : 0,
      },
      alerts: [],
    };
  }, [state, getTeamWeekPoints]);

  const isWeekLocked = useCallback((week: number) => {
    return state.locks.some(l => l.weekNumber === week && !l.date && l.isLocked);
  }, [state.locks]);

  const value: AppContextType = {
    ...state,
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
    getWeekRange, getWorkerWeekPoints, getTeamWeekPoints, getDashboardStats,
    clearDemoData, seedDemoData,
    loginAs: (role) => {
      if (!state.project) return;
      const users: Record<string, AppUser> = {
        admin: createMockAdmin(state.project.id),
        editor: {
          id: 'user-editor-001', email: 'dotruong@congtruong.vn',
          displayName: 'Trần Văn Hùng (Đội trưởng)', role: 'editor',
          teamIds: state.teams.slice(0, 1).map(t => t.id), projectId: state.project.id,
          isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        },
        viewer: {
          id: 'user-viewer-001', email: 'chudautu@example.com',
          displayName: 'Chủ đầu tư / Tư vấn', role: 'viewer', projectId: state.project.id,
          isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        },
      };
      setState(s => ({ ...s, currentUser: users[role] }));
    },
    logout: () => setState(s => ({ ...s, currentUser: null })),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
