import { useMemo, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Plus, Pencil, Trash2, TrendingUp } from 'lucide-react';
import type { ProgressItem } from '../types';

const STATUS_LABEL: Record<ProgressItem['status'], string> = {
  not_started: 'Chưa bắt đầu',
  on_track: 'Đúng tiến độ',
  delayed: 'Chậm',
  completed: 'Hoàn thành',
};

function calcStatus(planned: number, actual: number): ProgressItem['status'] {
  if (planned <= 0 && actual <= 0) return 'not_started';
  if (actual >= planned && planned > 0) return 'completed';
  if (actual <= 0) return 'not_started';
  if (actual / planned < 0.8) return 'delayed';
  return 'on_track';
}

export function ProgressPage() {
  const {
    progressItems, teams, selectedWeek, setSelectedWeek, project,
    addProgressItem, updateProgressItem, deleteProgressItem, currentUser,
  } = useApp();
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'editor';
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProgressItem | null>(null);
  const [form, setForm] = useState({
    name: '', unit: '%', planned: 100, actual: 0, teamId: '', note: '',
  });

  const weekItems = useMemo(
    () => (progressItems || []).filter(p => p.weekNumber === selectedWeek),
    [progressItems, selectedWeek]
  );

  const summary = useMemo(() => {
    if (!weekItems.length) return { avg: 0, delayed: 0, done: 0 };
    const ratios = weekItems.map(p => (p.planned > 0 ? Math.min(100, (p.actual / p.planned) * 100) : 0));
    const avg = Math.round(ratios.reduce((a, b) => a + b, 0) / ratios.length);
    return {
      avg,
      delayed: weekItems.filter(p => p.status === 'delayed').length,
      done: weekItems.filter(p => p.status === 'completed').length,
    };
  }, [weekItems]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', unit: '%', planned: 100, actual: 0, teamId: '', note: '' });
    setShowForm(true);
  };

  const openEdit = (item: ProgressItem) => {
    setEditing(item);
    setForm({
      name: item.name, unit: item.unit, planned: item.planned, actual: item.actual,
      teamId: item.teamId || '', note: item.note || '',
    });
    setShowForm(true);
  };

  const save = () => {
    if (!project || !form.name.trim()) return;
    const status = calcStatus(Number(form.planned), Number(form.actual));
    if (editing) {
      updateProgressItem(editing.id, {
        name: form.name.trim(), unit: form.unit,
        planned: Number(form.planned), actual: Number(form.actual),
        teamId: form.teamId || undefined, note: form.note, status,
        updatedBy: currentUser?.id,
      });
    } else {
      addProgressItem({
        projectId: project.id, name: form.name.trim(), unit: form.unit,
        planned: Number(form.planned), actual: Number(form.actual),
        weekNumber: selectedWeek, teamId: form.teamId || undefined,
        note: form.note, status, updatedBy: currentUser?.id,
      });
    }
    setShowForm(false);
  };

  const weeks = Array.from({ length: project?.totalWeeks || 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" /> Theo dõi tiến độ
          </h1>
          <p className="text-sm text-gray-500">Hạng mục thi công — kế hoạch vs thực tế</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm">
            {weeks.map(w => <option key={w} value={w}>Tuần {w}</option>)}
          </select>
          {canEdit && (
            <button onClick={openCreate} className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-primary text-white">
              <Plus size={16} /> Thêm hạng mục
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">Tiến độ trung bình</p>
          <p className="text-2xl font-bold text-primary">{summary.avg}%</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">Hạng mục chậm</p>
          <p className="text-2xl font-bold text-amber-600">{summary.delayed}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">Đã hoàn thành</p>
          <p className="text-2xl font-bold text-green-600">{summary.done}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-3 text-left">Hạng mục</th>
              <th className="px-3 py-3 text-left">Tổ</th>
              <th className="px-3 py-3 text-right">KH</th>
              <th className="px-3 py-3 text-right">TT</th>
              <th className="px-3 py-3 text-left">%</th>
              <th className="px-3 py-3 text-left">Trạng thái</th>
              {canEdit && <th className="px-3 py-3 text-center">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {weekItems.map(item => {
              const pct = item.planned > 0 ? Math.min(100, Math.round((item.actual / item.planned) * 100)) : 0;
              const teamName = teams.find(t => t.id === item.teamId)?.name || '—';
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{item.name}</td>
                  <td className="px-3 py-2 text-gray-600">{teamName}</td>
                  <td className="px-3 py-2 text-right">{item.planned} {item.unit}</td>
                  <td className="px-3 py-2 text-right">{item.actual} {item.unit}</td>
                  <td className="px-3 py-2 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : pct < 80 ? 'bg-amber-500' : 'bg-primary'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs w-8">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.status === 'completed' ? 'bg-green-50 text-green-700' :
                      item.status === 'delayed' ? 'bg-amber-50 text-amber-700' :
                      item.status === 'on_track' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>{STATUS_LABEL[item.status]}</span>
                  </td>
                  {canEdit && (
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => openEdit(item)} className="p-1 text-gray-500 hover:text-primary"><Pencil size={16} /></button>
                      <button onClick={() => deleteProgressItem(item.id)} className="p-1 text-gray-500 hover:text-red-600"><Trash2 size={16} /></button>
                    </td>
                  )}
                </tr>
              );
            })}
            {weekItems.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Chưa có hạng mục tiến độ tuần {selectedWeek}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-3">
            <h2 className="font-bold text-gray-900">{editing ? 'Sửa hạng mục' : 'Thêm hạng mục'}</h2>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Tên hạng mục"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <div className="grid grid-cols-3 gap-2">
              <input type="number" className="border rounded-lg px-3 py-2 text-sm" placeholder="Kế hoạch"
                value={form.planned} onChange={e => setForm(f => ({ ...f, planned: Number(e.target.value) }))} />
              <input type="number" className="border rounded-lg px-3 py-2 text-sm" placeholder="Thực tế"
                value={form.actual} onChange={e => setForm(f => ({ ...f, actual: Number(e.target.value) }))} />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Đơn vị"
                value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
            </div>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.teamId}
              onChange={e => setForm(f => ({ ...f, teamId: e.target.value }))}>
              <option value="">— Tổ phụ trách —</option>
              {teams.filter(t => t.isActive).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Ghi chú"
              value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowForm(false)} className="px-3 py-2 text-sm rounded-lg bg-gray-100">Hủy</button>
              <button onClick={save} className="px-3 py-2 text-sm rounded-lg bg-primary text-white">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
