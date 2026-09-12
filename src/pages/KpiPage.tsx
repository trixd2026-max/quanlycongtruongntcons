import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { getGrade, getGradeColor } from '../utils/mockData';
import { Plus, Lock, Unlock, Search, History } from 'lucide-react';

export function KpiPage() {
  const {
    project, workers, teams, scoreRules, transactions, selectedWeek, setSelectedWeek,
    getWeekRange, getWorkerWeekPoints, addTransaction, isWeekLocked, lockWeek, unlockWeek,
    currentUser, undoTransaction
  } = useApp();
  const [filterTeam, setFilterTeam] = useState('all');
  const [search, setSearch] = useState('');
  const [showRecord, setShowRecord] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedRule, setSelectedRule] = useState('');
  const [note, setNote] = useState('');

  const weekRange = getWeekRange(selectedWeek);
  const locked = isWeekLocked(selectedWeek);
  const canEdit = (currentUser?.role === 'admin' || currentUser?.role === 'editor') && !locked;
  const isAdmin = currentUser?.role === 'admin';

  const filteredWorkers = workers.filter(w => w.isActive)
    .filter(w => filterTeam === 'all' || w.teamId === filterTeam)
    .filter(w => w.fullName.toLowerCase().includes(search.toLowerCase()) || w.code.toLowerCase().includes(search.toLowerCase()));

  const openRecord = (workerId: string) => {
    setSelectedWorker(workerId);
    setSelectedDate(weekRange.days[0]?.date || '');
    setSelectedRule(''); setNote(''); setShowRecord(true);
  };

  const handleRecord = () => {
    if (!selectedWorker || !selectedRule || !selectedDate || !currentUser || !project) return;
    const rule = scoreRules.find(r => r.id === selectedRule);
    const worker = workers.find(w => w.id === selectedWorker);
    if (!rule || !worker) return;
    addTransaction({
      projectId: project.id, workerId: selectedWorker, teamId: worker.teamId,
      weekNumber: selectedWeek, date: selectedDate, ruleId: rule.id, ruleName: rule.name,
      category: rule.category, points: rule.points, note,
      createdBy: currentUser.id, createdByName: currentUser.displayName,
    });
    setShowRecord(false);
  };

  const recentTx = transactions.filter(t => t.weekNumber === selectedWeek && !t.isUndone).slice(-10).reverse();
  if (!project) return null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Nhập KPI & Nhật ký tuần</h2>
          <p className="text-sm text-gray-500">
            Tuần {selectedWeek}: {weekRange.startDate} → {weekRange.endDate}
            {locked && <span className="ml-2 text-red-600 font-medium">🔒 Đã khóa</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            {Array.from({ length: project.totalWeeks }, (_, i) => (
              <option key={i + 1} value={i + 1}>Tuần {i + 1}</option>
            ))}
          </select>
          {isAdmin && (locked ? (
            <button onClick={() => unlockWeek(selectedWeek)}
              className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700">
              <Unlock size={14} /> Mở khóa
            </button>
          ) : (
            <button onClick={() => lockWeek(selectedWeek)}
              className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700">
              <Lock size={14} /> Khóa tuần
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm công nhân..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
        </div>
        <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">Tất cả tổ đội</option>
          {teams.filter(t => t.isActive).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky-header">
              <tr>
                <th className="px-3 py-3 text-left">Mã</th>
                <th className="px-3 py-3 text-left">Họ tên</th>
                <th className="px-3 py-3 text-left">Tổ đội</th>
                <th className="px-3 py-3 text-center">Điểm +</th>
                <th className="px-3 py-3 text-center">Điểm −</th>
                <th className="px-3 py-3 text-center">Tổng tuần</th>
                <th className="px-3 py-3 text-center">Xếp loại</th>
                {canEdit && <th className="px-3 py-3 text-center">Ghi nhận</th>}
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.map(w => {
                const pts = getWorkerWeekPoints(w.id, selectedWeek);
                const grade = getGrade(pts.total, undefined, pts.total !== 0 || transactions.some(t => t.workerId === w.id && t.weekNumber === selectedWeek));
                return (
                  <tr key={w.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-mono text-primary text-xs">{w.code}</td>
                    <td className="px-3 py-2.5 font-medium">{w.fullName}</td>
                    <td className="px-3 py-2.5 text-xs">{teams.find(t => t.id === w.teamId)?.name}</td>
                    <td className="px-3 py-2.5 text-center text-green-600 font-medium">+{pts.plus}</td>
                    <td className="px-3 py-2.5 text-center text-red-600 font-medium">{pts.minus}</td>
                    <td className="px-3 py-2.5 text-center font-bold">{pts.total}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getGradeColor(grade)}`}>{grade}</span>
                    </td>
                    {canEdit && (
                      <td className="px-3 py-2.5 text-center">
                        <button onClick={() => openRecord(w.id)}
                          className="inline-flex items-center gap-1 bg-primary text-white px-2.5 py-1 rounded text-xs hover:bg-primary-dark">
                          <Plus size={12} /> Ghi nhận
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><History size={18} /> Lịch sử giao dịch gần đây</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {recentTx.map(tx => (
            <div key={tx.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">{workers.find(w => w.id === tx.workerId)?.fullName}</span>
                <span className="text-gray-500 mx-2">·</span>
                <span className={tx.points > 0 ? 'text-green-600' : 'text-red-600'}>
                  {tx.ruleName} ({tx.points > 0 ? '+' : ''}{tx.points})
                </span>
                <span className="text-gray-400 text-xs ml-2">{tx.date}</span>
              </div>
              {canEdit && <button onClick={() => undoTransaction(tx.id)} className="text-xs text-red-500 hover:underline">Hoàn tác</button>}
            </div>
          ))}
          {recentTx.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Chưa có giao dịch</p>}
        </div>
      </div>

      {showRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold">Ghi nhận sự kiện</h3>
            <p className="text-sm text-gray-600">Công nhân: <strong>{workers.find(w => w.id === selectedWorker)?.fullName}</strong></p>
            <div>
              <label className="block text-sm font-medium mb-1">Ngày *</label>
              <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                {weekRange.days.map(d => <option key={d.date} value={d.date}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sự kiện *</label>
              <select value={selectedRule} onChange={e => setSelectedRule(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Chọn sự kiện</option>
                {scoreRules.filter(r => r.isActive).map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.points > 0 ? '+' : ''}{r.points})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ghi chú</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRecord(false)} className="flex-1 border py-2 rounded-lg text-sm font-medium">Hủy</button>
              <button onClick={handleRecord} disabled={!selectedRule}
                className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
