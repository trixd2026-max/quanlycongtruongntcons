import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Trophy, AlertTriangle,
  TrendingUp, CalendarClock, Users, Settings, X, MapPin
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import clsx from 'clsx';

const menuItems = [
  { path: '/', label: 'Tổng quan tháng', icon: LayoutDashboard },
  { path: '/kpi', label: 'Nhập KPI & Nhật ký tuần', icon: ClipboardList },
  { path: '/teams', label: 'Thi đua tổ đội', icon: Trophy },
  { path: '/safety', label: 'Vi phạm an toàn & Kỷ luật', icon: AlertTriangle },
  { path: '/progress', label: 'Theo dõi tiến độ & Chất lượng', icon: TrendingUp },
  { path: '/schedule', label: 'Nhật ký ca & Phân công', icon: CalendarClock },
  { path: '/workers', label: 'Quản lý công nhân', icon: Users },
  { path: '/attendance', label: 'Chấm công GPS/QR', icon: MapPin },
  { path: '/settings', label: 'Cài đặt công trường', icon: Settings },
];

interface SidebarProps { open: boolean; onClose: () => void; }

export function Sidebar({ open, onClose }: SidebarProps) {
  const { currentUser, loginAs, logout } = useApp();

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={clsx(
        'fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out no-print',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b lg:hidden">
            <span className="font-bold text-primary">Menu</span>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {menuItems.map(item => (
              <NavLink key={item.path} to={item.path} onClick={onClose}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                )}>
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t bg-gray-50">
            <p className="text-xs text-gray-500 mb-2 font-medium">Chế độ Demo - Đăng nhập nhanh:</p>
            <div className="space-y-1">
              <button onClick={() => loginAs('admin')} className="w-full text-left px-3 py-1.5 text-xs rounded hover:bg-primary/10 text-primary font-medium">
                → Chỉ huy trưởng (Admin)
              </button>
              <button onClick={() => loginAs('editor')} className="w-full text-left px-3 py-1.5 text-xs rounded hover:bg-blue-50 text-blue-700">
                → Đội trưởng (Editor)
              </button>
              <button onClick={() => loginAs('viewer')} className="w-full text-left px-3 py-1.5 text-xs rounded hover:bg-gray-200 text-gray-700">
                → Chủ đầu tư (Viewer)
              </button>
              {currentUser && (
                <button onClick={logout} className="w-full text-left px-3 py-1.5 text-xs rounded hover:bg-red-50 text-red-600 mt-1">
                  Đăng xuất
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
