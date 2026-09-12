import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Trophy, Plus, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function TeamsPage() {
  const {
    teams, selectedWeek, setSelectedWeek, project, addTeamBonus, addTeam,
    currentUser, getDashboardStats, seedDemoData,
  } = useApp();
  const [showBonus, setShowBonus] = useState(false);
  const [bonusTeam, setBonusTeam] = useState('');
  const [bonusPoints, setBonusPoints] = useState(10);
  const [bonusReason, setBonusReason] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const stats = getDashboardStats();
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'editor';
  const activeTeams = (teams || []).filter(t => t.isActive);
  const chartData = stats.teamRankings.map(t => ({ name: t.teamName.replace('Tổ ', ''), total: t.totalPoints }));

  const handleBonus = () => {
    if (!bonusTeam || !currentUser || !project) return;
    addTeamBonus({
      projectId: project.id, teamId: bonusTeam, weekNumber: selectedWeek,
      points: bonusPoints, reason: bonusReason,
      createdBy: currentUser.id, createdByName: currentUser.displayName,
    });
    setShowBonus(false);
    setBonusReason('');
  };

  const handleAddTeam = () => {
    const name = newTeamName.trim();
    if (!name) return;
    addTeam(name);
    setNewTeamName('');
  };

  if (!project) return null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Trophy className="text-yellow-500" /> Thi đua tổ đội
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))} className="border rounded-lg px-3 py-1.5 text-sm">
            {Array.from({ length: project.totalWeeks }, (_, i) => (
              <option key={i + 1} value={i + 1}>Tuần {i + 1}</option>
            ))}
          </select>
          {isAdmin && (
            <button onClick={() => setShowBonus(true)} className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-90">
              <Plus size={14} /> Cộng điểm thưởng tổ
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Users size={18} /> Danh sách tổ đội ({activeTeams.length})
        </h3>
        {activeTeams.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900 space-y-2">
            <p>Chưa có tổ đội. Hãy tạo tổ hoặc tải dữ liệu mẫu Đa Thanh.</p>
            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <>
                  <input className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px]" placeholder="Tên tổ (vd: Tổ Bê tông)"
                    value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTeam())} />
                  <button type="button" onClick={handleAddTeam} className="px-3 py-2 text-sm rounded-lg bg-primary text-white">Tạo tổ</button>
                </>
              )}
              {isAdmin && (
                <button type="button" onClick={() => { if (confirm('Tải dữ liệu mẫu (4 tổ + 12 công nhân)?')) seedDemoData(); }}
                  className="px-3 py-2 text-sm rounded-lg bg-slate-700 text-white">Tải dữ liệu mẫu</button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {activeTeams.map(t => (
                <span key={t.id} className="inline-flex items-center px-3 py-1.5 rounded-full bg-slate-100 text-sm text-slate-800 border">{t.name}</span>
              ))}
            </div>
            {canEdit && (
              <div className="flex flex-wrap gap-2 pt-1">
                <input className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px]" placeholder="Thêm tổ mới..."
                  value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTeam())} />
                <button type="button" onClick={handleAddTeam} className="px-3 py-2 text-sm rounded-lg bg-primary text-white flex items-center gap-1">
                  <Plus size={14} /> Thêm tổ
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Tổ</th>
              <th className="px-4 py-3 text-center">Điểm CN</th>
              <th className="px-4 py-3 text-center">Thưởng tổ</th>
              <th className="px-4 py-3 text-center">Tổng</th>
              <th className="px-4 py-3 text-center">Vi phạm</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {stats.teamRankings.map(t => (
              <tr key={t.teamId} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-bold">{t.rank}</td>
                <td className="px-4 py-3 font-medium">{t.teamName}</td>
                <td className="px-4 py-3 text-center">{t.personalPoints}</td>
                <td className="px-4 py-3 text-center text-yellow-600">{t.teamBonus}</td>
                <td className="px-4 py-3 text-center font-bold text-primary">{t.totalPoints}</td>
                <td className="px-4 py-3 text-center text-red-500">{t.violationCount}</td>
              </tr>
            ))}
            {stats.teamRankings.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Chưa có dữ liệu xếp hạng</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-bold mb-4">So sánh điểm thi đua</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" /><YAxis /><Tooltip />
              <Bar dataKey="total" fill="#0f4c81" name="Tổng điểm" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {showBonus && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold">Cộng điểm thưởng tổ đội</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Tổ đội</label>
              <select value={bonusTeam} onChange={e => setBonusTeam(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Chọn tổ đội</option>
                {activeTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số điểm</label>
              <input type="number" value={bonusPoints} onChange={e => setBonusPoints(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lý do</label>
              <textarea value={bonusReason} onChange={e => setBonusReason(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowBonus(false)} className="flex-1 border py-2 rounded-lg text-sm">Hủy</button>
              <button type="button" onClick={handleBonus} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
