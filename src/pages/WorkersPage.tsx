import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Search, Edit2, Trash2, UserPlus } from 'lucide-react';

export function WorkersPage() {
  const { workers, teams, addWorker, updateWorker, deleteWorker, currentUser, project } = useApp();
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', fullName: '', teamId: '', position: 'Công nhân', phone: '', gender: 'male' as const });
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'editor';

  const filtered = workers.filter(w => w.isActive)
    .filter(w => filterTeam === 'all' || w.teamId === filterTeam)
    .filter(w => w.fullName.toLowerCase().includes(search.toLowerCase()) || w.code.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    if (editing) updateWorker(editing, form);
    else addWorker({ ...form, projectId: project.id, isActive: true });
    setShowForm(false); setEditing(null);
    setForm({ code: '', fullName: '', teamId: teams[0]?.id || '', position: 'Công nhân', phone: '', gender: 'male' });
  };

  const startEdit = (id: string) => {
    const w = workers.find(x => x.id === id);
    if (!w) return;
    setForm({ code: w.code, fullName: w.fullName, teamId: w.teamId, position: w.position, phone: w.phone || '', gender: (w.gender as any) || 'male' });
    setEditing(id); setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-800">Quản lý công nhân</h2>
        {canEdit && (
          <button onClick={() => { setShowForm(true); setEditing(null); }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark">
            <UserPlus size={16} /> Thêm công nhân
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc mã CN..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="all">Tất cả tổ đội</option>
          {teams.filter(t => t.isActive).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky-header">
              <tr>
                <th className="px-4 py-3 text-left">Mã CN</th>
                <th className="px-4 py-3 text-left">Họ và tên</th>
                <th className="px-4 py-3 text-left">Tổ đội</th>
                <th className="px-4 py-3 text-left">Chức danh</th>
                <th className="px-4 py-3 text-left">SĐT</th>
                {canEdit && <th className="px-4 py-3 text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => (
                <tr key={w.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-primary font-medium">{w.code}</td>
                  <td className="px-4 py-3 font-medium">{w.fullName}</td>
                  <td className="px-4 py-3">{teams.find(t => t.id === w.teamId)?.name || '—'}</td>
                  <td className="px-4 py-3">{w.position}</td>
                  <td className="px-4 py-3">{w.phone || '—'}</td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => startEdit(w.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                        <button onClick={() => deleteWorker(w.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Không tìm thấy công nhân</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold">{editing ? 'Sửa công nhân' : 'Thêm công nhân mới'}</h3>
            <div><label className="block text-sm font-medium mb-1">Mã công nhân *</label>
              <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Họ và tên *</label>
              <input required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Tổ đội *</label>
              <select required value={form.teamId} onChange={e => setForm(f => ({ ...f, teamId: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Chọn tổ đội</option>
                {teams.filter(t => t.isActive).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Chức danh</label>
              <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                {['Công nhân', 'Tổ trưởng', 'Kỹ thuật viên', 'An toàn viên', 'Giám sát', 'Thủ kho'].map(p => <option key={p} value={p}>{p}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Số điện thoại</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-dark">{editing ? 'Cập nhật' : 'Thêm mới'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
