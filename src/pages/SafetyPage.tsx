import { useApp } from '../contexts/AppContext';
import { AlertTriangle } from 'lucide-react';

export function SafetyPage() {
  const { transactions, workers, teams, selectedWeek } = useApp();
  const safetyTx = transactions.filter(t => t.weekNumber === selectedWeek && !t.isUndone && (t.category === 'safety' || t.category === 'penalty') && t.points < 0);
  const byWorker = workers.filter(w => w.isActive).map(w => {
    const txs = safetyTx.filter(t => t.workerId === w.id);
    return { worker: w, count: txs.length, totalPoints: txs.reduce((s, t) => s + t.points, 0), details: txs };
  }).filter(x => x.count > 0).sort((a, b) => a.totalPoints - b.totalPoints);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <AlertTriangle className="text-red-500" /> Vi phạm An toàn & Kỷ luật
        </h2>
        <p className="text-sm text-gray-500 mt-1">Tuần {selectedWeek} · Tổng {safetyTx.length} lượt vi phạm</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="sticky-header">
            <tr>
              <th className="px-4 py-3 text-left">Công nhân</th>
              <th className="px-4 py-3 text-left">Tổ đội</th>
              <th className="px-4 py-3 text-center">Số lần</th>
              <th className="px-4 py-3 text-center">Điểm trừ</th>
              <th className="px-4 py-3 text-left">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {byWorker.map(({ worker, count, totalPoints, details }) => (
              <tr key={worker.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{worker.fullName}</td>
                <td className="px-4 py-3">{teams.find(t => t.id === worker.teamId)?.name}</td>
                <td className="px-4 py-3 text-center font-bold text-red-600">{count}</td>
                <td className="px-4 py-3 text-center text-red-600">{totalPoints}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{details.map(d => d.ruleName).join('; ')}</td>
              </tr>
            ))}
            {byWorker.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                  Không có vi phạm trong tuần này
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
