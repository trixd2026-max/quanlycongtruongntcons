import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { LogIn, HardHat } from 'lucide-react';

export function LoginPage() {
  const { loginWithPassword, loginAs, demoAccounts, project } = useApp();
  const [email, setEmail] = useState('lehuutri@congtruong.vn');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = loginWithPassword(email, password);
    if (!res.ok) setError(res.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-3">
            <HardHat className="text-primary" size={32} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">QUẢN LÝ CÔNG TRƯỜNG</h1>
          <p className="text-sm text-gray-500 mt-1">{project?.name || 'Đăng nhập hệ thống'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
              required autoComplete="username" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
              required autoComplete="current-password" />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark disabled:opacity-60">
            <LogIn size={18} /> Đăng nhập
          </button>
        </form>

        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-gray-500 mb-2 font-medium">Tài khoản demo nhanh:</p>
          <div className="space-y-1.5 text-xs text-gray-600">
            {demoAccounts.map(a => (
              <button key={a.email} type="button"
                onClick={() => { setEmail(a.email); setPassword(a.password); loginAs(a.role); }}
                className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-100">
                <span className="font-medium">{a.displayName}</span>
                <span className="text-gray-400"> · {a.email} / {a.password}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
