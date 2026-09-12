import { useApp } from '../contexts/AppContext';
import { Settings, Trash2, Database, RefreshCw } from 'lucide-react';

export function SettingsPage() {
  const { project, updateProject, scoreRules, updateScoreRule, clearDemoData, seedDemoData, currentUser, connectionStatus } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  if (!project) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Settings /> Cài đặt công trường</h2>
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
        <h3 className="font-bold text-gray-800">Thông tin dự án</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { key: 'name', label: 'Tên công trình' },
            { key: 'packageName', label: 'Gói thầu' },
            { key: 'commanderName', label: 'Chỉ huy trưởng' },
            { key: 'phase', label: 'Giai đoạn' },
            { key: 'slogan', label: 'Khẩu hiệu' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm text-gray-500 mb-1">{f.label}</label>
              <input disabled={!isAdmin} value={(project as any)[f.key]}
                onChange={e => isAdmin && updateProject({ [f.key]: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-4">Quy định điểm đánh giá</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {scoreRules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: rule.color }} />
                <span className="font-medium">{rule.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-bold ${rule.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {rule.points > 0 ? '+' : ''}{rule.points}
                </span>
                {isAdmin && (
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={rule.isActive} onChange={e => updateScoreRule(rule.id, { isActive: e.target.checked })} /> Bật
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
          <div className="flex flex-wrap gap-3">
            <button onClick={seedDemoData} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              <RefreshCw size={16} /> Tải lại dữ liệu mẫu
            </button>
            <button onClick={() => { if (confirm('Xóa toàn bộ dữ liệu demo?')) clearDemoData(); }}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">
              <Trash2 size={16} /> Xóa dữ liệu minh họa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
