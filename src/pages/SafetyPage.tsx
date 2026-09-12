import { useMemo, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { ShieldAlert, ImagePlus } from 'lucide-react';
import { uploadEvidenceImage } from '../lib/storageService';

export function SafetyPage() {
  const {
    transactions, workers, teams, scoreRules, selectedWeek, setSelectedWeek,
    project, addTransaction, getVisibleWorkers, currentUser,
  } = useApp();
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'editor';
  const visible = getVisibleWorkers();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ workerId: '', ruleId: '', note: '', evidenceUrl: '' });
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  const weeks = Array.from({ length: project?.totalWeeks || 12 }, (_, i) => i + 1);
  const safetyRules = scoreRules.filter(r => r.isActive && (r.category === 'safety' || r.category === 'penalty'));

  const violations = useMemo(() => {
    return transactions
      .filter(t =>
        t.weekNumber === selectedWeek && !t.isUndone &&
        (t.category === 'safety' || (t.category === 'penalty' && t.points < 0)) &&
        visible.some(w => w.id === t.workerId)
      )
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [transactions, selectedWeek, visible]);

  const byTeam = useMemo(() => {
    const map = new Map<string, number>();
    violations.forEach(v => map.set(v.teamId, (map.get(v.teamId) || 0) + 1));
    return teams.filter(t => t.isActive).map(t => ({ team: t, count: map.get(t.id) || 0 }))
      .sort((a, b) => b.count - a.count);
  }, [violations, teams]);

  const onFile = async (file?: File) => {
    if (!file) return;
    setUploading(true); setErr('');
    const res = await uploadEvidenceImage(file, 'safety');
    setUploading(false);
    if (!res.ok || !res.url) { setErr(res.message || 'Upload thất bại'); return; }
    setForm(f => ({ ...f, evidenceUrl: res.url! }));
  };

  const submit = () => {
    if (!project || !form.workerId || !form.ruleId || !currentUser) return;
    const worker = workers.find(w => w.id === form.workerId);
    const rule = scoreRules.find(r => r.id === form.ruleId);
    if (!worker || !rule) return;
    addTransaction({
      projectId: project.id, workerId: worker.id, teamId: worker.teamId,
      weekNumber: selectedWeek, date: new Date().toISOString().slice(0, 10),
      ruleId: rule.id, ruleName: rule.name, category: rule.category, points: rule.points,
      note: form.note, evidenceUrl: form.evidenceUrl || undefined,
      createdBy: currentUser.id, createdByName: currentUser.displayName,
    });
    setShowForm(false);
    setForm({ workerId: '', ruleId: '', note: '', evidenceUrl: '' });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert size={20} className="text-red-600" /> Vi phạm an toàn
          </h1>
          <p className="text-sm text-gray-500">Ghi nhận, ảnh bằng chứng, thống kê theo tổ</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm">
            {weeks.map(w => <option key={w} value={w}>Tuần {w}</option>)}
          </select>
          {canEdit && (
            <button onClick={() => setShowForm(true)} className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white">
              + Ghi nhận vi phạm
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">Tổng vi phạm tuần</p>
          <p className="text-2xl font-bold text-red-600">{violations.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm sm:col-span-2">
          <p className="text-xs text-gray-500 mb-2">Theo tổ</p>
          <div className="flex flex-wrap gap-2">
            {byTeam.map(({ team, count }) => (
              <span key={team.id} className={`text-xs px-2 py-1 rounded-full ${count ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500'}`}>
                {team.name}: {count}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-3 text-left">Thời gian</th>
              <th className="px-3 py-3 text-left">Công nhân</th>
              <th className="px-3 py-3 text-left">Tổ</th>
              <th className="px-3 py-3 text-left">Nội dung</th>
              <th className="px-3 py-3 text-right">Điểm</th>
              <th className="px-3 py-3 text-left">Bằng chứng</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {violations.map(v => {
              const w = workers.find(x => x.id === v.workerId);
              const team = teams.find(t => t.id === v.teamId);
              return (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{v.date}<br /><span className="text-xs">{v.createdByName}</span></td>
                  <td className="px-3 py-2 font-medium">{w?.fullName || v.workerId}</td>
                  <td className="px-3 py-2">{team?.name || '—'}</td>
                  <td className="px-3 py-2"><div>{v.ruleName}</div>{v.note && <div className="text-xs text-gray-500">{v.note}</div>}</td>
                  <td className="px-3 py-2 text-right text-red-600 font-medium">{v.points}</td>
                  <td className="px-3 py-2">{v.evidenceUrl ? <a href={v.evidenceUrl} target="_blank" rel="noreferrer"><img src={v.evidenceUrl} alt="" className="h-12 w-12 object-cover rounded border" /></a> : '—'}</td>
                </tr>
              );
            })}
            {violations.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Không có vi phạm tuần {selectedWeek}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-3">
            <h2 className="font-bold">Ghi nhận vi phạm an toàn</h2>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.workerId}
              onChange={e => setForm(f => ({ ...f, workerId: e.target.value }))}>
              <option value="">— Chọn công nhân —</option>
              {visible.map(w => <option key={w.id} value={w.id}>{w.code} — {w.fullName}</option>)}
            </select>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.ruleId}
              onChange={e => setForm(f => ({ ...f, ruleId: e.target.value }))}>
              <option value="">— Loại vi phạm —</option>
              {safetyRules.map(r => <option key={r.id} value={r.id}>{r.name} ({r.points})</option>)}
            </select>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Mô tả"
              value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <ImagePlus size={16} />
              <span>{uploading ? 'Đang tải ảnh...' : 'Upload ảnh bằng chứng'}</span>
              <input type="file" accept="image/*" className="hidden" disabled={uploading}
                onChange={e => onFile(e.target.files?.[0])} />
            </label>
            {form.evidenceUrl && <img src={form.evidenceUrl} alt="preview" className="h-24 rounded border object-cover" />}
            {err && <p className="text-xs text-red-600">{err}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-3 py-2 text-sm rounded-lg bg-gray-100">Hủy</button>
              <button onClick={submit} className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
