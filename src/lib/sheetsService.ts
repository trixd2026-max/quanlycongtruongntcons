/**
 * Google Sheets backend qua Apps Script Web App.
 * Cấu hình: VITE_SHEETS_WEBAPP_URL=https://script.google.com/macros/s/XXXX/exec
 */

export type SheetsPayload = {
  project?: unknown;
  teams?: unknown[];
  workers?: unknown[];
  scoreRules?: unknown[];
  transactions?: unknown[];
  teamBonuses?: unknown[];
  locks?: unknown[];
  shiftAssignments?: unknown[];
  progressItems?: unknown[];
  auditLogs?: unknown[];
  users?: unknown[];
};

const SHEETS_URL = (import.meta.env.VITE_SHEETS_WEBAPP_URL as string | undefined)?.trim() || '';

export function isSheetsConfigured(): boolean {
  return Boolean(SHEETS_URL && SHEETS_URL.startsWith('http') && !SHEETS_URL.includes('XXXX'));
}

export function getSheetsUrl(): string {
  return SHEETS_URL;
}

async function callSheets<T = unknown>(
  action: string,
  body?: Record<string, unknown>
): Promise<{ ok: boolean; data?: T; message?: string }> {
  if (!isSheetsConfigured()) {
    return { ok: false, message: 'Chưa cấu hình VITE_SHEETS_WEBAPP_URL' };
  }
  try {
    const res = await fetch(SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...body }),
      redirect: 'follow',
    });
    const text = await res.text();
    let json: { ok?: boolean; data?: T; message?: string; error?: string };
    try {
      json = JSON.parse(text);
    } catch {
      return { ok: false, message: 'Phản hồi Google Sheet không phải JSON' };
    }
    if (json.error || json.ok === false) {
      return { ok: false, message: json.message || json.error || 'Lỗi Sheets' };
    }
    return { ok: true, data: json.data as T, message: json.message };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Không kết nối được Google Sheets',
    };
  }
}

export async function sheetsLoadAll(): Promise<{ ok: boolean; data?: SheetsPayload; message?: string }> {
  return callSheets<SheetsPayload>('loadAll');
}

export async function sheetsSaveAll(payload: SheetsPayload): Promise<{ ok: boolean; message?: string }> {
  return callSheets('saveAll', { payload: payload as unknown as Record<string, unknown> });
}

export async function sheetsUpsert(
  sheetName: string,
  row: Record<string, unknown>
): Promise<{ ok: boolean; message?: string }> {
  return callSheets('upsert', { sheetName, row });
}

export async function sheetsDelete(
  sheetName: string,
  id: string
): Promise<{ ok: boolean; message?: string }> {
  return callSheets('delete', { sheetName, id });
}

export async function sheetsLogin(
  email: string,
  password: string
): Promise<{ ok: boolean; user?: Record<string, unknown>; message?: string }> {
  const res = await callSheets<{ user?: Record<string, unknown> }>('login', {
    email: email.trim().toLowerCase(),
    password,
  });
  if (!res.ok) return { ok: false, message: res.message };
  return { ok: true, user: res.data?.user, message: res.message };
}
