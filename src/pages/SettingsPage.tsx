import { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Settings, Trash2, Database, RefreshCw, Save, CheckCircle } from 'lucide-react';

export function SettingsPage() {
  const {
    project, updateProject, scoreRules, updateScoreRule,
    clearDemoData, seedDemoData, currentUser, connectionStatus,
  } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '', packageName: '', commanderName: '', phone: '',
    phase: '', slogan: '', startDateWeek1: '', totalWeeks: 52, shiftsPerDay: 2,
  });

  useEffect(() => {
    if (!project) return;
    setForm({
      name: project.name || '',
      packageName: project.packageName || '',
      commanderName: project.commanderName || '',
      phone: project.phone || '',
      phase: project.phase || '',
      slogan: project.slogan || '',
      startDateWeek1: project.startDateWeek1 || '',
      totalWeeks: project.totalWeeks || 52,
      shiftsPerDay: project.shiftsPerDay || 2,
    });
  }, [project]);

  if (!project) return null;

  const handleSave = () => {
    if (!isAdmin) return;
    updateProject({
      name: form.name.trim(),
      packageName: form.packageName.trim(),
      commanderName: form.commanderName.trim(),
      phone: form.phone.trim(),
      phase: form.phase.trim(),
      slogan: form.slogan.trim(),
      startDateWeek1: form.startDateWeek1,
      totalWeeks: Number(form.totalWeeks) || 52,
      shiftsPerDay: Number(form.shiftsPerDay) || 2,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const set = (key: keyof typeof form, value: string | number) =>
    setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Settings /> Cài đặt công trường
        </h2>
        {isAdmin && (
          <button onClick={handleSave}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark">
            {saved ? <CheckCircle size={16} /> : <Save size={16} />}
            {saved ? 'Đã lưu' : 'Lưu cài đặt'}
          </button>
        )}
      </div>

      <div className={`rounded-xl p-4 ${connectionStatus === 'not_configured' ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
        <div className="flex items-center gap-3">
          <Database size={24} className={connectionStatus === 'not_configured' ? 'text-orange-500' : 'text-green-500'} />
          <div>
            <p className="font-bold">{connectionStatus === 'not_configured' ? 'Chưa kết nối cơ sở dữ liệu Firebase' : 'Đã kết nối Firebase'}</p>
            <p className="text-sm text-gray-600">
              {connectionStatus === 'not_configured'
                ? 'Ứng dụng đang chạy ở chế độ Demo với dữ liệu local. Cấu hình Firebase để đồng bộ thời gian thực.'
                : 'Dữ liệu đồng bộ thời gian thực.'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-gray-800">Thông tin / biến công trường</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Tên công trình *</label>
            <input disabled={!isAdmin} value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Gói thầu *</label>
            <input disabled={!isAdmin} value={form.packageName} onChange={e => set('packageName', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Chỉ huy trưởng *</label>
            <input disabled={!isAdmin} value={form.commanderName} onChange={e => set('commanderName', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Số điện thoại</label>
            <input disabled={!isAdmin} value={form.phone} onChange={e => set('phone', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="0389216492" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Giai đoạn</label>
            <input disabled={!isAdmin} value={form.phase} onChange={e => set('phase', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Ngày bắt đầu tuần 1</label>
            <input type="date" disabled={!isAdmin} value={form.startDateWeek1} onChange={e => set('startDateWeek1', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Tổng số tuần</label>
            <input type="number" min={1} max={200} disabled={!isAdmin} value={form.totalWeeks}
              onChange={e => set('totalWeeks', Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Số ca / ngày</label>
            <select disabled={!isAdmin} value={form.shiftsPerDay} onChange={e => set('shiftsPerDay', Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50">
              <option value={1}>1 ca</option>
              <option value={2}>2 ca</option>
              <option value={3}>3 ca</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-500 mb-1">Khẩu hiệu</label>
            <input disabled={!isAdmin} value={form.slogan} onChange={e => set('slogan', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" />
          </div>
        </div>
        {isAdmin && (
          <button onClick={handleSave}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark">
            {saved ? <CheckCircle size={16} /> : <Save size={16} />}
            {saved ? 'Đã lưu cài đặt công trường' : 'Lưu cài đặt công trường'}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-4">Quy định điểm đánh giá</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {scoreRules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: rule.color }} />
                <span className="font-medium">{rule.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-bold ${rule.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {rule.points > 0 ? '+' : ''}{rule.points}
                </span>
                {isAdmin && (
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={rule.isActive}
                      onChange={e => updateScoreRule(rule.id, { isActive: e.target.checked })} /> Bật
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h3 className="font-bold text-gray-800">Quản lý dữ liệu Demo</h3>
          <p className="text-sm text-gray-500">
            Phiên đăng nhập được bảo vệ riêng — xóa / tải lại dữ liệu mẫu không làm mất phiên đăng nhập.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => { if (confirm('Tải lại dữ liệu mẫu công trường Đa Thanh?')) seedDemoData(); }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              <RefreshCw size={16} /> Tải lại dữ liệu mẫu (Đa Thanh)
            </button>
            <button onClick={() => { if (confirm('Xóa dữ liệu demo? Phiên đăng nhập vẫn được giữ.')) clearDemoData(); }}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">
              <Trash2 size={16} /> Xóa dữ liệu minh họa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
