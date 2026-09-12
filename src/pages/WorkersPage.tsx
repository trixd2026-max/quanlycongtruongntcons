import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Search, Edit2, Trash2, UserPlus } from 'lucide-react';

export function WorkersPage() {
  const {
    addWorker, updateWorker, deleteWorker, addTeam,
    currentUser, project, getVisibleWorkers, getVisibleTeams, teams: allTeams,
  } = useApp();
  const workers = getVisibleWorkers();
  const teams = (() => {
    const v = getVisibleTeams().filter(t => t.isActive);
    if (v.length) return v;
    return (allTeams || []).filter(t => t.isActive);
  })();
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [form, setForm] = useState({
    code: '', fullName: '', teamId: '', position: 'Công nhân', phone: '', gender: 'male' as const,
  });
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'editor';

  const filtered = workers.filter(w => w.isActive)
    .filter(w => filterTeam === 'all' || w.teamId === filterTeam)
    .filter(w =>
      w.fullName.toLowerCase().includes(search.toLowerCase()) ||
      w.code.toLowerCase().includes(search.toLowerCase())
    );

  const openCreate = () => {
    setEditing(null);
    setForm({
      code: '', fullName: '', teamId: teams[0]?.id || '',
      position: 'Công nhân', phone: '', gender: 'male',
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    if (!form.teamId) {
      alert('Vui lòng chọn tổ đội. Nếu chưa có tổ, hãy tạo tổ mới.');
      return;
    }
    if (editing) updateWorker(editing, form);
    else addWorker({ ...form, projectId: project.id, isActive: true });
    setShowForm(false);
    setEditing(null);
  };

  const startEdit = (id: string) => {
    const w = workers.find(x => x.id === id);
    if (!w) return;
    setForm({
      code: w.code, fullName: w.fullName, teamId: w.teamId,
      position: w.position, phone: w.phone || '', gender: (w.gender as 'male') || 'male',
    });
    setEditing(id);
    setShowForm(true);
  };

  const createTeamQuick = () => {
    const name = newTeamName.trim();
    if (!name) return;
    addTeam(name);
    setNewTeamName('');
    alert(`Đã tạo tổ "${name}". Chọn tổ trong danh sách để thêm công nhân.`);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý công nhân</h2>
          <p className="text-xs text-gray-500 mt-0.5">{teams.length} tổ · {workers.filter(w => w.isActive).length} công nhân</p>
        </div>
        {canEdit && (
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark">
            <UserPlus size={16} /> Thêm công nhân
          </button>
        )}
      </div>

      {canEdit && teams.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <p className="text-sm text-amber-900 font-medium">Chưa có tổ đội — cần tạo tổ trước khi thêm công nhân.</p>
          <div className="flex flex-wrap gap-2">
            <input className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px]" placeholder="Tên tổ (vd: Tổ Bê tông)"
              value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), createTeamQuick())} />
            <button type="button" onClick={createTeamQuick} className="px-4 py-2 text-sm rounded-lg bg-primary text-white">Tạo tổ</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm" placeholder="Tìm theo tên hoặc mã CN"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border rounded-lg px-3 py-2 text-sm" value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
          <option value="all">Tất cả tổ</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-3 text-left">Mã CN</th>
              <th className="px-3 py-3 text-left">Họ tên</th>
              <th className="px-3 py-3 text-left">Tổ</th>
              <th className="px-3 py-3 text-left">Chức danh</th>
              <th className="px-3 py-3 text-left">SĐT</th>
              {canEdit && <th className="px-3 py-3 text-center">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(w => (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{w.code}</td>
                <td className="px-3 py-2">{w.fullName}</td>
                <td className="px-3 py-2">{teams.find(t => t.id === w.teamId)?.name || allTeams.find(t => t.id === w.teamId)?.name || '—'}</td>
                <td className="px-3 py-2">{w.position}</td>
                <td className="px-3 py-2">{w.phone || '—'}</td>
                {canEdit && (
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => startEdit(w.id)} className="p-1 text-gray-500 hover:text-primary"><Edit2 size={16} /></button>
                    <button onClick={() => deleteWorker(w.id)} className="p-1 text-gray-500 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Không có công nhân</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-3">
            <h3 className="font-bold text-lg">{editing ? 'Sửa công nhân' : 'Thêm công nhân mới'}</h3>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Mã công nhân *</label>
              <input required className="w-full border rounded-lg px-3 py-2 text-sm" value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Họ và tên *</label>
              <input required className="w-full border rounded-lg px-3 py-2 text-sm" value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tổ đội *</label>
              <select required className="w-full border rounded-lg px-3 py-2 text-sm" value={form.teamId}
                onChange={e => setForm(f => ({ ...f, teamId: e.target.value }))}>
                <option value="">Chọn tổ đội</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {teams.length === 0 && (
                <div className="mt-2 flex gap-2">
                  <input className="border rounded-lg px-2 py-1.5 text-sm flex-1" placeholder="Tên tổ mới"
                    value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
                  <button type="button" onClick={createTeamQuick} className="px-3 py-1.5 text-sm rounded-lg bg-slate-700 text-white">Tạo tổ</button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Chức danh</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.position}
                onChange={e => setForm(f => ({ ...f, position: e.target.value }))}>
                <option>Công nhân</option>
                <option>Tổ trưởng</option>
                <option>Kỹ thuật viên</option>
                <option>An toàn viên</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Số điện thoại</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border">Hủy</button>
              <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary text-white">{editing ? 'Cập nhật' : 'Thêm mới'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
