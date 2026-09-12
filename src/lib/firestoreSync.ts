import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  type Unsubscribe,
  type Firestore,
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from './firebase';
import type {
  Project, Team, Worker, ScoreRule, ScoreTransaction,
  WeeklyLock, ShiftAssignment, ProgressItem, AuditLog, TeamBonus,
} from '../types';

export function getDb(): Firestore | null {
  if (!isFirebaseConfigured()) return null;
  return getFirebaseDb();
}

function col(db: Firestore, projectId: string, name: string) {
  return collection(db, 'projects', projectId, name);
}

export async function fsSet(
  projectId: string,
  collectionName: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await setDoc(doc(db, 'projects', projectId, collectionName, id), {
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (e) {
    console.warn('fsSet', collectionName, id, e);
  }
}

export async function fsDelete(
  projectId: string,
  collectionName: string,
  id: string
): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'projects', projectId, collectionName, id));
  } catch (e) {
    console.warn('fsDelete', collectionName, id, e);
  }
}

export async function fsSaveProject(project: Project): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await setDoc(doc(db, 'projects', project.id), { ...project }, { merge: true });
  } catch (e) {
    console.warn('fsSaveProject', e);
  }
}

export async function fsAddAudit(projectId: string, log: AuditLog): Promise<void> {
  await fsSet(projectId, 'audit', log.id, log as unknown as Record<string, unknown>);
}

export function subscribeProjectData(
  projectId: string,
  handlers: {
    onProject?: (p: Project | null) => void;
    onTeams?: (t: Team[]) => void;
    onWorkers?: (w: Worker[]) => void;
    onRules?: (r: ScoreRule[]) => void;
    onTransactions?: (t: ScoreTransaction[]) => void;
    onLocks?: (l: WeeklyLock[]) => void;
    onShifts?: (s: ShiftAssignment[]) => void;
    onProgress?: (p: ProgressItem[]) => void;
    onBonuses?: (b: TeamBonus[]) => void;
    onAudit?: (a: AuditLog[]) => void;
    onError?: (e: Error) => void;
  }
): Unsubscribe[] {
  const db = getDb();
  if (!db) return [];

  const unsubs: Unsubscribe[] = [];
  const listen = (name: string, cb: (rows: Record<string, unknown>[]) => void) => {
    try {
      const u = onSnapshot(
        col(db, projectId, name),
        (snap) => {
          const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          cb(rows);
        },
        (err) => handlers.onError?.(err)
      );
      unsubs.push(u);
    } catch (e) {
      handlers.onError?.(e as Error);
    }
  };

  try {
    const u = onSnapshot(
      doc(db, 'projects', projectId),
      (snap) => {
        handlers.onProject?.(snap.exists() ? ({ id: snap.id, ...snap.data() } as Project) : null);
      },
      (err) => handlers.onError?.(err)
    );
    unsubs.push(u);
  } catch (e) {
    handlers.onError?.(e as Error);
  }

  if (handlers.onTeams) listen('teams', (r) => handlers.onTeams!(r as unknown as Team[]));
  if (handlers.onWorkers) listen('workers', (r) => handlers.onWorkers!(r as unknown as Worker[]));
  if (handlers.onRules) listen('scoreRules', (r) => handlers.onRules!(r as unknown as ScoreRule[]));
  if (handlers.onTransactions) listen('transactions', (r) => handlers.onTransactions!(r as unknown as ScoreTransaction[]));
  if (handlers.onLocks) listen('locks', (r) => handlers.onLocks!(r as unknown as WeeklyLock[]));
  if (handlers.onShifts) listen('shifts', (r) => handlers.onShifts!(r as unknown as ShiftAssignment[]));
  if (handlers.onProgress) listen('progress', (r) => handlers.onProgress!(r as unknown as ProgressItem[]));
  if (handlers.onBonuses) listen('teamBonuses', (r) => handlers.onBonuses!(r as unknown as TeamBonus[]));
  if (handlers.onAudit) listen('audit', (r) => handlers.onAudit!(r as unknown as AuditLog[]));

  return unsubs;
}

export async function seedProjectToFirestore(payload: {
  project: Project;
  teams: Team[];
  workers: Worker[];
  scoreRules: ScoreRule[];
}): Promise<void> {
  const db = getDb();
  if (!db) return;
  const { project, teams, workers, scoreRules } = payload;
  try {
    await setDoc(doc(db, 'projects', project.id), { ...project }, { merge: true });
    const batch = writeBatch(db);
    let n = 0;
    const add = (path: string, id: string, data: object) => {
      batch.set(doc(db, 'projects', project.id, path, id), data, { merge: true });
      n++;
    };
    teams.forEach((t) => add('teams', t.id, t));
    workers.forEach((w) => add('workers', w.id, w));
    scoreRules.forEach((r) => add('scoreRules', r.id, r));
    if (n > 0) await batch.commit();
  } catch (e) {
    console.warn('seedProjectToFirestore', e);
  }
}
