import { useApp } from '../contexts/AppContext';
import { TrendingUp } from 'lucide-react';

export function ProgressPage() {
  const { transactions, workers, teams, selectedWeek } = useApp();
  const qualityTx = transactions.filter(
    t => t.weekNumber === selectedWeek && !t.isUndone && t.category === 'progress'
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="text-orange-500" /> Theo dõi Tiến độ & Chất lượng
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Tuần {selectedWeek} · {qualityTx.length} sự cố / lỗi chất lượng
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="sticky-header">
            <tr>
              <th className="px-4 py-3 text-left">Ngày</th>
              <th className="px-4 py-3 text-left">Công nhân</th>
              <th className="px-4 py-3 text-left">Tổ đội</th>
              <th className="px-4 py-3 text-left">Sự kiện</th>
              <th className="px-4 py-3 text-center">Điểm</th>
              <th className="px-4 py-3 text-left">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {qualityTx.map(tx => {
              const workerName = workers.find(w => w.id === tx.workerId)?.fullName ?? '—';
              const teamName = teams.find(t => t.id === tx.teamId)?.name ?? '—';
              return (
                <tr key={tx.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{tx.date}</td>
                  <td className="px-4 py-3 font-medium">{workerName}</td>
                  <td className="px-4 py-3">{teamName}</td>
                  <td className="px-4 py-3">{tx.ruleName}</td>
                  <td className="px-4 py-3 text-center text-red-600 font-medium">{tx.points}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{tx.note || '—'}</td>
                </tr>
              );
            })}
            {qualityTx.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  Không có lỗi chất lượng trong tuần này
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
