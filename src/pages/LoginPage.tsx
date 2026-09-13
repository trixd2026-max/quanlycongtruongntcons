import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { isSheetsConfigured } from '../lib/sheetsService';
import { LogIn, HardHat, Cloud, CloudOff, Shield } from 'lucide-react';

export function LoginPage() {
  const {
    loginWithPassword,
    project,
    firebaseEnabled,
    registerWithPassword,
    currentUser,
  } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) setLoading(false);
  }, [currentUser]);

  const canRegister = firebaseEnabled && !isSheetsConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    const safety = window.setTimeout(() => setLoading(false), 12000);
    try {
      if (mode === 'register') {
        if (!canRegister) {
          setError('Đăng ký công khai đã tắt. Liên hệ Chỉ huy trưởng để được cấp tài khoản.');
          setLoading(false);
          clearTimeout(safety);
          return;
        }
        const res = await registerWithPassword(
          email, password, displayName || email.split('@')[0], 'viewer'
        );
        if (!res.ok) { setError(res.message); setLoading(false); }
        else { setInfo(res.message); setLoading(false); }
      } else {
        const res = await loginWithPassword(email, password);
        if (!res.ok) { setError(res.message || 'Email hoặc mật khẩu không đúng'); setLoading(false); }
        else { setInfo(res.message || 'Đăng nhập thành công'); setLoading(false); }
      }
    } catch {
      setError('Không thể đăng nhập. Kiểm tra kết nối và thử lại.');
      setLoading(false);
    } finally {
      clearTimeout(safety);
    }
  };

  const backendLabel = isSheetsConfigured()
    ? 'Google Sheets (bảo mật)'
    : firebaseEnabled
      ? 'Firebase Auth'
      : 'Chưa cấu hình backend';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-3">
            <HardHat className="text-primary" size={32} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">QUẢN LÝ CÔNG TRƯỜNG</h1>
          <p className="text-sm text-gray-500 mt-1">{project?.name || 'Đăng nhập hệ thống'}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
            {(isSheetsConfigured() || firebaseEnabled) ? <Cloud size={12} /> : <CloudOff size={12} />}
            {backendLabel}
          </div>
        </div>

        {canRegister && (
          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm rounded-lg font-medium ${mode === 'login' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>Đăng nhập</button>
            <button type="button" onClick={() => setMode('register')}
              className={`flex-1 py-2 text-sm rounded-lg font-medium ${mode === 'register' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>Đăng ký</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && canRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Tên hiển thị" autoComplete="name" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm" required autoComplete="username" placeholder="email@congty.vn" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm" required minLength={6}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
          {info && !error && <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">{info}</p>}
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark disabled:opacity-60">
            <LogIn size={18} />
            {loading ? 'Đang xử lý...' : mode === 'register' ? 'Tạo tài khoản' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-5 flex items-start gap-2 text-xs text-gray-500 bg-slate-50 rounded-lg p-3 border border-slate-100">
          <Shield size={14} className="text-slate-500 shrink-0 mt-0.5" />
          <p>
            Chỉ tài khoản được cấp trên hệ thống mới đăng nhập được.
            Liên hệ Chỉ huy trưởng nếu quên mật khẩu hoặc cần cấp quyền.
          </p>
        </div>
      </div>
    </div>
  );
}
