import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { CalendarClock, Plus, X } from 'lucide-react';

const SHIFTS = [
  { key: 'sang', label: 'Ca Sáng (06:00-14:00)' },
  { key: 'chieu', label: 'Ca Chiều (14:00-22:00)' },
  { key: 'dem', label: 'Ca Đêm (22:00-06:00)' },
];

export function SchedulePage() {
  const {
    project, selectedWeek, setSelectedWeek, getWeekRange, shiftAssignments,
    assignShift, removeShiftAssignment, getVisibleWorkers, currentUser, isWeekLocked, workers: allWorkers,
  } = useApp();
  const weekRange = getWeekRange(selectedWeek);
  let workers = getVisibleWorkers();
  if (!workers.length && allWorkers?.length) workers = allWorkers.filter(w => w.isActive);
  const canEdit = (currentUser?.role === 'admin' || currentUser?.role === 'editor') && !isWeekLocked(selectedWeek);

  const [modal, setModal] = useState<{ date: string; shiftKey: string } | null>(null);
  const [pickWorker, setPickWorker] = useState('');

  if (!project) return null;
  const shiftsToShow = SHIFTS.slice(0, Math.max(1, project.shiftsPerDay || 2));
  const weeks = Array.from({ length: project.totalWeeks || 12 }, (_, i) => i + 1);

  const forCell = (date: string, shiftKey: string) =>
    (shiftAssignments || []).filter(a => a.date === date && a.shiftKey === shiftKey);

  const handleAssign = () => {
    if (!modal || !pickWorker || !currentUser) return;
    const w = workers.find(x => x.id === pickWorker);
    if (!w) return;
    assignShift({
      projectId: project.id,
      weekNumber: selectedWeek,
      date: modal.date,
      shiftKey: modal.shiftKey,
      workerId: w.id,
      teamId: w.teamId,
      createdBy: currentUser.id,
    });
    setModal(null);
    setPickWorker('');
  };

  const openAssign = (date: string, shiftKey: string) => {
    if (!canEdit) return;
    if (!workers.length) {
      alert('Chưa có công nhân. Vào Quản lý công nhân để thêm.');
      return;
    }
    setPickWorker('');
    setModal({ date, shiftKey });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarClock className="text-primary" /> Nhật ký ca & Phân công
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Tuần {selectedWeek}: {weekRange.startDate} → {weekRange.endDate}
            {!canEdit && <span className="ml-2 text-amber-600">· Chỉ xem / đã khóa</span>}
          </p>
        </div>
        <select value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))}
          className="border rounded-lg px-3 py-2 text-sm">
          {weeks.map(w => <option key={w} value={w}>Tuần {w}</option>)}
        </select>
      </div>

      {workers.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
          Chưa có công nhân để phân công. Vào <strong>Quản lý công nhân</strong> thêm người trước.
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-primary text-white">
                <th className="px-3 py-3 text-left sticky left-0 bg-primary z-10">Ca / Ngày</th>
                {weekRange.days.map(d => (
                  <th key={d.date} className="px-2 py-3 text-center min-w-[100px]">
                    <div>{d.label.split(' ')[0]}</div>
                    <div className="text-xs font-normal opacity-90">{d.date.slice(5)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shiftsToShow.map(shift => (
                <tr key={shift.key} className="border-t">
                  <td className="px-3 py-2 font-medium sticky left-0 bg-white z-10 border-r text-xs">{shift.label}</td>
                  {weekRange.days.map(d => {
                    const assigned = forCell(d.date, shift.key);
                    return (
                      <td key={d.date} className="px-1 py-1 align-top border-l border-gray-100">
                        <div className="min-h-[72px] rounded-lg bg-slate-50 p-1 space-y-1">
                          {assigned.map(a => {
                            const w = workers.find(x => x.id === a.workerId) || allWorkers?.find(x => x.id === a.workerId);
                            return (
                              <div key={a.id} className="flex items-center justify-between gap-1 bg-white border rounded px-1.5 py-1 text-xs">
                                <span className="truncate">{w?.fullName || a.workerId}</span>
                                {canEdit && (
                                  <button type="button" onClick={() => removeShiftAssignment(a.id)}
                                    className="text-red-500 hover:bg-red-50 rounded p-0.5" title="Gỡ">
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          {canEdit && (
                            <button type="button" onClick={() => openAssign(d.date, shift.key)}
                              className="w-full flex items-center justify-center gap-1 text-xs text-primary hover:bg-primary/10 rounded py-1.5 border border-dashed border-primary/40">
                              <Plus size={12} /> Phân công
                            </button>
                          )}
                          {!canEdit && assigned.length === 0 && (
                            <span className="block text-center text-xs text-gray-400 py-2">Chưa phân công</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <h3 className="font-bold text-gray-800">Phân công ca</h3>
            <p className="text-sm text-gray-500">{modal.date} · {SHIFTS.find(s => s.key === modal.shiftKey)?.label}</p>
            <select value={pickWorker} onChange={e => setPickWorker(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">— Chọn công nhân —</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.code} · {w.fullName}</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border">Hủy</button>
              <button type="button" onClick={handleAssign} disabled={!pickWorker}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-white disabled:opacity-50">Gán ca</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
