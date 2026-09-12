import { useApp } from '../../contexts/AppContext';
import { AlertCircle, CheckCircle, Cloud, Menu } from 'lucide-react';

interface HeaderProps { onMenuClick: () => void; }

export function Header({ onMenuClick }: HeaderProps) {
  const { project, connectionStatus, currentUser } = useApp();
  const statusConfig = {
    connecting: { icon: Cloud, text: 'Đang kết nối...', color: 'text-yellow-500' },
    synced: { icon: CheckCircle, text: 'Đã đồng bộ', color: 'text-green-500' },
    offline: { icon: AlertCircle, text: 'Mất kết nối', color: 'text-red-500' },
    pending: { icon: Cloud, text: 'Đang chờ đồng bộ', color: 'text-yellow-500' },
    error: { icon: AlertCircle, text: 'Đồng bộ thất bại', color: 'text-red-500' },
    not_configured: { icon: AlertCircle, text: 'Chế độ Demo (chưa kết nối Firebase)', color: 'text-orange-500' },
  };
  const status = statusConfig[connectionStatus];
  const StatusIcon = status.icon;

  return (
    <header className="bg-primary text-white shadow-lg sticky top-0 z-40 no-print">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-primary-dark rounded-lg">
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-lg font-bold leading-tight">
                {project?.name || 'QUẢN LÝ CÔNG TRƯỜNG XÂY DỰNG'}
              </h1>
              <p className="text-sm text-blue-200">
                {project?.packageName} · Chỉ huy: {project?.commanderName}
              </p>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1">
            <p className="text-sm font-medium italic text-safety">
              "{project?.slogan || 'An toàn là trên hết'}"
            </p>
            <div className={`flex items-center gap-1.5 text-xs ${status.color}`}>
              <StatusIcon size={14} />
              <span>{status.text}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{currentUser.displayName}</p>
                <p className="text-xs text-blue-200">
                  {currentUser.role === 'admin' ? 'Chỉ huy trưởng' :
                   currentUser.role === 'editor' ? 'Đội trưởng / Kỹ thuật' : 'Người xem'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
