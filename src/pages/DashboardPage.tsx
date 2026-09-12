import { useApp } from '../contexts/AppContext';
import { downloadCsv } from '../utils/export';
import { Users, AlertTriangle, TrendingUp, ClipboardList, Bell, FileSpreadsheet } from 'lucide-react';

export function DashboardPage() {
  const { project, selectedWeek, setSelectedWeek, getDashboardStats, getVisibleTeams, currentUser } = useApp();
  if (!project) return null;

  const stats = getDashboardStats();
  const teams = getVisibleTeams();

  const exportRank = () => {
    downloadCsv(
      `XepHang_Tuan_${selectedWeek}`,
      ['Hạng', 'Tổ đội', 'Điểm CN', 'Thưởng tổ', 'Tổng', 'Vi phạm'],
      stats.teamRankings.map(r => [r.rank, r.teamName, r.personalPoints, r.teamBonus, r.totalPoints, r.violationCount])
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Tổng quan tháng / tuần</h2>
          <p className="text-sm text-gray-500">{project.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
            {Array.from({ length: project.totalWeeks }, (_, i) => i + 1).map(w => (
              <option key={w} value={w}>Tuần {w}</option>
            ))}
          </select>
          <button onClick={exportRank} className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-green-600 text-white">
            <FileSpreadsheet size={16} /> Excel xếp hạng
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-primary mb-1"><Users size={18} /><span className="text-xs font-medium">Công nhân</span></div>
          <p className="text-2xl font-bold">{stats.totalWorkers}</p>
          {currentUser?.role === 'editor' && <p className="text-xs text-gray-400">Theo tổ được gán</p>}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-red-500 mb-1"><AlertTriangle size={18} /><span className="text-xs font-medium">Vi phạm AT</span></div>
          <p className="text-2xl font-bold">{stats.totalSafetyViolations}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-orange-500 mb-1"><TrendingUp size={18} /><span className="text-xs font-medium">Lỗi CL</span></div>
          <p className="text-2xl font-bold">{stats.totalQualityIssues}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1"><ClipboardList size={18} /><span className="text-xs font-medium">Nhập KPI</span></div>
          <p className="text-2xl font-bold">{stats.dataEntryProgress.percent}%</p>
          <p className="text-xs text-gray-500">{stats.dataEntryProgress.entered}/{stats.dataEntryProgress.total} người</p>
        </div>
      </div>

      {stats.alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
            <Bell size={18} /> Thiếu nhật ký KPI — tuần {selectedWeek}
            <span className="text-sm font-normal text-amber-700">({stats.alerts.length} người)</span>
          </h3>
          <ul className="text-sm text-amber-900 space-y-1 max-h-40 overflow-y-auto">
            {stats.alerts.map(a => (
              <li key={a.id} className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>{a.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Bảng xếp hạng tổ đội — tuần {selectedWeek}</h3>
          <span className="text-xs text-gray-500">{teams.length} tổ</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky-header">
              <tr>
                <th className="px-4 py-3 text-left">Hạng</th>
                <th className="px-4 py-3 text-left">Tổ đội</th>
                <th className="px-4 py-3 text-center">Điểm CN</th>
                <th className="px-4 py-3 text-center">Thưởng tổ</th>
                <th className="px-4 py-3 text-center">Tổng</th>
                <th className="px-4 py-3 text-center">Vi phạm</th>
              </tr>
            </thead>
            <tbody>
              {stats.teamRankings.map(r => (
                <tr key={r.teamId} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold">{r.rank}</td>
                  <td className="px-4 py-3 font-medium">{r.teamName}</td>
                  <td className="px-4 py-3 text-center">{r.personalPoints}</td>
                  <td className="px-4 py-3 text-center text-green-600">{r.teamBonus}</td>
                  <td className="px-4 py-3 text-center font-bold text-primary">{r.totalPoints}</td>
                  <td className="px-4 py-3 text-center text-red-600">{r.violationCount}</td>
                </tr>
              ))}
              {!stats.teamRankings.length && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
