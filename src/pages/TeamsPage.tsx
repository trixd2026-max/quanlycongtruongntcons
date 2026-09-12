import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Trophy, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function TeamsPage() {
  const { teams, selectedWeek, setSelectedWeek, project, addTeamBonus, currentUser, getDashboardStats } = useApp();
  const [showBonus, setShowBonus] = useState(false);
  const [bonusTeam, setBonusTeam] = useState('');
  const [bonusPoints, setBonusPoints] = useState(10);
  const [bonusReason, setBonusReason] = useState('');
  const stats = getDashboardStats();
  const isAdmin = currentUser?.role === 'admin';
  const chartData = stats.teamRankings.map(t => ({ name: t.teamName.replace('Tổ ', ''), total: t.totalPoints }));

  const handleBonus = () => {
    if (!bonusTeam || !currentUser || !project) return;
    addTeamBonus({ projectId: project.id, teamId: bonusTeam, weekNumber: selectedWeek, points: bonusPoints, reason: bonusReason, createdBy: currentUser.id, createdByName: currentUser.displayName });
    setShowBonus(false); setBonusReason('');
  };
  if (!project) return null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Trophy className="text-yellow-500" /> Thi đua tổ đội</h2>
        <div className="flex items-center gap-2">
          <select value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))} className="border rounded-lg px-3 py-1.5 text-sm">
            {Array.from({ length: project.totalWeeks }, (_, i) => <option key={i+1} value={i+1}>Tuần {i+1}</option>)}
          </select>
          {isAdmin && (
            <button onClick={() => setShowBonus(true)} className="flex items-center gap-1.5 bg-safety text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-90">
              <Plus size={14} /> Cộng điểm thưởng tổ
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 0, 2].map(podiumIdx => {
          const team = stats.teamRankings[podiumIdx];
          if (!team) return <div key={podiumIdx} />;
          const heights = ['h-32', 'h-40', 'h-24'];
          const colors = ['bg-gray-300', 'bg-yellow-400', 'bg-orange-400'];
          return (
            <div key={team.teamId} className="flex flex-col items-center">
              <div className={`${colors[podiumIdx]} ${heights[podiumIdx]} w-full rounded-t-xl flex flex-col items-center justify-end pb-3 text-white`}>
                <span className="text-3xl font-black">#{team.rank}</span>
                <span className="font-bold text-sm mt-1">{team.teamName}</span>
                <span className="text-lg font-bold">{team.totalPoints} điểm</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="sticky-header">
            <tr>
              <th className="px-4 py-3 text-left">Hạng</th>
              <th className="px-4 py-3 text-left">Tổ đội</th>
              <th className="px-4 py-3 text-center">Điểm cá nhân</th>
              <th className="px-4 py-3 text-center">Điểm thưởng</th>
              <th className="px-4 py-3 text-center">Tổng điểm</th>
              <th className="px-4 py-3 text-center">Số lỗi</th>
            </tr>
          </thead>
          <tbody>
            {stats.teamRankings.map(t => (
              <tr key={t.teamId} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-bold">{t.rank}</td>
                <td className="px-4 py-3 font-medium">{t.teamName}</td>
                <td className="px-4 py-3 text-center">{t.personalPoints}</td>
                <td className="px-4 py-3 text-center text-yellow-600">{t.teamBonus}</td>
                <td className="px-4 py-3 text-center font-bold text-primary">{t.totalPoints}</td>
                <td className="px-4 py-3 text-center text-red-500">{t.violationCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-bold mb-4">So sánh điểm thi đua</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip />
            <Bar dataKey="total" fill="#0f4c81" name="Tổng điểm" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {showBonus && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold">Cộng điểm thưởng tổ đội</h3>
            <div><label className="block text-sm font-medium mb-1">Tổ đội</label>
              <select value={bonusTeam} onChange={e => setBonusTeam(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Chọn tổ đội</option>
                {teams.filter(t => t.isActive).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Số điểm</label>
              <input type="number" value={bonusPoints} onChange={e => setBonusPoints(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Lý do</label>
              <textarea value={bonusReason} onChange={e => setBonusReason(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} /></div>
            <div className="flex gap-3">
              <button onClick={() => setShowBonus(false)} className="flex-1 border py-2 rounded-lg text-sm">Hủy</button>
              <button onClick={handleBonus} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
