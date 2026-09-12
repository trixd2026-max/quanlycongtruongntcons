import { useApp } from '../contexts/AppContext';
import { Users, AlertTriangle, TrendingDown, Trophy, ClipboardCheck, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function DashboardPage() {
  const { project, selectedWeek, setSelectedWeek, getDashboardStats, getWeekRange } = useApp();
  const stats = getDashboardStats();
  const weekRange = getWeekRange(selectedWeek);
  if (!project) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Đang tải...</p></div>;

  const chartData = stats.teamRankings.map(t => ({
    name: t.teamName.replace('Tổ ', ''), 'Điểm cá nhân': t.personalPoints, 'Điểm thưởng': t.teamBonus, 'Tổng': t.totalPoints,
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Tổng quan tháng</h2>
          <p className="text-sm text-gray-500">Tuần {selectedWeek}: {weekRange.startDate} → {weekRange.endDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Tuần:</label>
          <select value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary">
            {Array.from({ length: project.totalWeeks }, (_, i) => (
              <option key={i + 1} value={i + 1}>Tuần {i + 1}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Quân số" value={stats.totalWorkers} color="bg-blue-500" />
        <StatCard icon={AlertTriangle} label="Vi phạm ATLĐ" value={stats.totalSafetyViolations} color="bg-red-500" />
        <StatCard icon={TrendingDown} label="Lỗi chất lượng" value={stats.totalQualityIssues} color="bg-orange-500" />
        <StatCard icon={Award} label="Điểm cá nhân" value={stats.totalPersonalPoints} color="bg-green-500" />
        <StatCard icon={Trophy} label="Điểm thưởng tổ" value={stats.totalTeamBonus} color="bg-yellow-500" />
        <StatCard icon={ClipboardCheck} label="Nhập nhật ký" value={`${stats.dataEntryProgress.percent}%`}
          sub={`${stats.dataEntryProgress.entered}/${stats.dataEntryProgress.total}`} color="bg-purple-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} /> Xếp hạng thi đua - Tuần {selectedWeek}
          </h3>
          <div className="space-y-3">
            {stats.teamRankings.map((team, idx) => (
              <div key={team.teamId} className={`flex items-center gap-3 p-3 rounded-lg ${
                idx === 0 ? 'bg-yellow-50 border border-yellow-200' :
                idx === 1 ? 'bg-gray-50 border border-gray-200' :
                idx === 2 ? 'bg-orange-50 border border-orange-200' : 'bg-white border border-gray-100'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-gray-400 text-white' :
                  idx === 2 ? 'bg-orange-400 text-white' : 'bg-gray-200 text-gray-600'
                }`}>{team.rank}</div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{team.teamName}</p>
                  <p className="text-xs text-gray-500">CN: {team.personalPoints} · Thưởng: {team.teamBonus} · Lỗi: {team.violationCount}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{team.totalPoints}</p>
                  <p className="text-xs text-gray-400">điểm</p>
                </div>
              </div>
            ))}
            {stats.teamRankings.length === 0 && <p className="text-center text-gray-400 py-8">Chưa có dữ liệu thi đua</p>}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">Biểu đồ điểm thi đua</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip /><Legend />
                <Bar dataKey="Điểm cá nhân" fill="#0f4c81" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Điểm thưởng" fill="#f5a623" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-64 flex items-center justify-center text-gray-400">Chưa có dữ liệu</div>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-3">Thông tin công trường</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div><p className="text-gray-500">Công trình</p><p className="font-medium">{project.name}</p></div>
          <div><p className="text-gray-500">Gói thầu</p><p className="font-medium">{project.packageName}</p></div>
          <div><p className="text-gray-500">Chỉ huy trưởng</p><p className="font-medium">{project.commanderName}</p></div>
          <div><p className="text-gray-500">Giai đoạn</p><p className="font-medium">{project.phase}</p></div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-start gap-3">
      <div className={`${color} p-2.5 rounded-lg text-white`}><Icon size={20} /></div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}
