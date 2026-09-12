import type { Worker, ScoreTransaction, Project, Team } from '../types';

export function printWorkersBatchA4(opts: {
  project: Project;
  workers: Worker[];
  teams: Team[];
  transactions: ScoreTransaction[];
  weekNumber: number;
}) {
  const { project, workers, teams, transactions, weekNumber } = opts;
  const teamName = (id: string) => teams.find(t => t.id === id)?.name || '—';
  const pages = workers.map((w) => {
    const txs = transactions.filter(t => t.workerId === w.id && t.weekNumber === weekNumber && !t.isUndone);
    const total = txs.reduce((s, t) => s + t.points, 0);
    const rows = txs.map(t =>
      `<tr><td>${t.date}</td><td>${t.ruleName}</td><td style="text-align:right">${t.points > 0 ? '+' : ''}${t.points}</td><td>${t.note || ''}</td></tr>`
    ).join('') || '<tr><td colspan="4" style="text-align:center;color:#888">Không có giao dịch</td></tr>';
    return `
      <section class="page">
        <header>
          <h1>${project.name}</h1>
          <p>${project.packageName} · Tuần ${weekNumber}</p>
          <h2>${w.fullName} (${w.code})</h2>
          <p>Tổ: ${teamName(w.teamId)} · Vị trí: ${w.position}</p>
        </header>
        <table>
          <thead><tr><th>Ngày</th><th>Nội dung</th><th>Điểm</th><th>Ghi chú</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="total"><strong>Tổng điểm tuần: ${total > 0 ? '+' : ''}${total}</strong></p>
        <footer>Chỉ huy: ${project.commanderName} · In ngày ${new Date().toLocaleDateString('vi-VN')}</footer>
      </section>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Báo cáo công nhân tuần ${weekNumber}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #111; }
    .page { page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    h1 { font-size: 16px; margin: 0 0 4px; }
    h2 { font-size: 14px; margin: 8px 0 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #ccc; padding: 4px 6px; }
    th { background: #f3f4f6; }
    .total { margin-top: 12px; font-size: 13px; }
    footer { margin-top: 24px; font-size: 11px; color: #555; border-top: 1px solid #ddd; padding-top: 6px; }
  </style></head><body>${pages}
  <script>window.onload=function(){window.print();}</script></body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
