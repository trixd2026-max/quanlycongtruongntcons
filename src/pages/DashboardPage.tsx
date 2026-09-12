import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { downloadCsv } from '../utils/export';
import { printWorkersBatchA4 } from '../utils/printReports';
import { FileSpreadsheet, Printer, AlertTriangle, Users, Shield, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#1e3a5f', '#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777'];

export function DashboardPage() {
  const {
    getDashboardStats, selectedWeek, setSelectedWeek, project, teams,
    progressItems, transactions, getVisibleWorkers, currentUser,
  } = useApp();
  const stats = getDashboardStats();
  const workers = getVisibleWorkers();
  const weeks = Array.from({ length: project?.totalWeeks || 12 }, (_, i) => i + 1);

  const teamChart = useMemo(
    () => stats.teamRankings.map(t => ({
      name: t.teamName.length > 12 ? t.teamName.slice(0, 12) + '…' : t.teamName,
      diem: t.totalPoints,
      vipham: t.violationCount,
    })),
    [stats.teamRankings]
  );

  const progressChart = useMemo(() => {
    const items = (progressItems || []).filter(p => p.weekNumber === selectedWeek);
    return items.slice(0, 8).map(p => ({
      name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name,
      pct: p.planned > 0 ? Math.min(100, Math.round((p.actual / p.planned) * 100)) : 0,
    }));
  }, [progressItems, selectedWeek]);

  const violationPie = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter(t => t.weekNumber === selectedWeek && !t.isUndone && (t.category === 'safety' || t.points < 0))
      .forEach(t => {
        const name = teams.find(x => x.id === t.teamId)?.name || 'Khác';
        map.set(name, (map.get(name) || 0) + 1);
      });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [transactions, selectedWeek, teams]);

  const exportRank = () => {
    downloadCsv(
      `XepHang_Tuan_${selectedWeek}`,
      ['Hạng', 'Tổ', 'Điểm CN', 'Thưởng tổ', 'Tổng', 'Vi phạm'],
      stats.teamRankings.map(t => [t.rank, t.teamName, t.personalPoints, t.teamBonus, t.totalPoints, t.violationCount])
    );
  };

  const batchPrint = () => {
    if (!project) return;
    printWorkersBatchA4({ project, workers, teams, transactions, weekNumber: selectedWeek });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Tổng quan tháng / tuần</h1>
          <p className="text-sm text-gray-500">{project?.name}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm">
            {weeks.map(w => <option key={w} value={w}>Tuần {w}</option>)}
          </select>
          <button onClick={exportRank} className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-green-600 text-white">
            <FileSpreadsheet size={16} /> Excel xếp hạng
          </button>
          <button onClick={batchPrint} className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-slate-700 text-white">
            <Printer size={16} /> In A4 theo CN
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Users size={14} /> Công nhân</div>
          <p className="text-2xl font-bold">{stats.totalWorkers}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Shield size={14} /> Vi phạm AT</div>
          <p className="text-2xl font-bold text-red-600">{stats.totalSafetyViolations}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><TrendingUp size={14} /> Điểm tổ</div>
          <p className="text-2xl font-bold text-primary">{stats.totalPersonalPoints + stats.totalTeamBonus}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">Nhập KPI</div>
          <p className="text-2xl font-bold">{stats.dataEntryProgress.percent}%</p>
          <p className="text-xs text-gray-400">{stats.dataEntryProgress.entered}/{stats.dataEntryProgress.total}</p>
        </div>
      </div>

      {stats.alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
            <AlertTriangle size={18} /> Thiếu nhật ký tuần {selectedWeek}
            <span className="text-sm font-normal text-amber-700">({stats.alerts.length} người)</span>
          </h3>
          <ul className="text-sm text-amber-900 space-y-1 max-h-32 overflow-y-auto">
            {stats.alerts.map(a => <li key={a.id}>• {a.message}</li>)}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Điểm theo tổ</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="diem" name="Điểm" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vipham" name="Vi phạm" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Vi phạm theo tổ</h3>
          <div className="h-64">
            {violationPie.length === 0 ? (
              <p className="text-center text-gray-400 pt-16">Không có dữ liệu vi phạm</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={violationPie} dataKey="value" nameKey="name" outerRadius={90} label>
                    {violationPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-3">Tiến độ hạng mục (%)</h3>
          <div className="h-64">
            {progressChart.length === 0 ? (
              <p className="text-center text-gray-400 pt-16">Chưa có hạng mục tiến độ tuần này</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressChart} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="pct" name="%" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <h3 className="font-semibold text-gray-800 p-4 border-b">Bảng xếp hạng tổ đội</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Tổ</th>
              <th className="px-3 py-2 text-right">Điểm CN</th>
              <th className="px-3 py-2 text-right">Thưởng</th>
              <th className="px-3 py-2 text-right">Tổng</th>
              <th className="px-3 py-2 text-right">Vi phạm</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {stats.teamRankings.map(t => (
              <tr key={t.teamId} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-bold">{t.rank}</td>
                <td className="px-3 py-2">{t.teamName}</td>
                <td className="px-3 py-2 text-right">{t.personalPoints}</td>
                <td className="px-3 py-2 text-right">{t.teamBonus}</td>
                <td className="px-3 py-2 text-right font-semibold">{t.totalPoints}</td>
                <td className="px-3 py-2 text-right text-red-600">{t.violationCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
