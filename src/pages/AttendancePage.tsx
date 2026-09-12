import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { MapPin, QrCode, CheckCircle } from 'lucide-react';

export function AttendancePage() {
  const { getVisibleWorkers, currentUser, pushAudit, selectedWeek } = useApp();
  const workers = getVisibleWorkers();
  const [selectedWorker, setSelectedWorker] = useState('');
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [msg, setMsg] = useState('');
  const [logs, setLogs] = useState<{ time: string; worker: string; method: string; detail: string }[]>([]);

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'editor';

  const captureGps = () => {
    if (!navigator.geolocation) {
      setMsg('Trình duyệt không hỗ trợ GPS');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setMsg(`GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
      },
      () => setMsg('Không lấy được vị trí — hãy cấp quyền định vị')
    );
  };

  const checkIn = (method: 'GPS' | 'QR') => {
    const w = workers.find(x => x.id === selectedWorker) ||
      workers.find(x => x.code === qrInput.trim() || x.id === qrInput.trim());
    if (!w) {
      setMsg('Chọn hoặc quét mã công nhân hợp lệ');
      return;
    }
    const detail = method === 'GPS' && gps
      ? `lat=${gps.lat.toFixed(5)}, lng=${gps.lng.toFixed(5)}`
      : `code=${w.code}`;
    const row = {
      time: new Date().toLocaleString('vi-VN'),
      worker: w.fullName,
      method,
      detail,
    };
    setLogs(l => [row, ...l].slice(0, 50));
    pushAudit('ATTENDANCE', `Chấm công ${method}: ${w.fullName} (${w.code}) ${detail}`, 'worker', w.id);
    setMsg(`Đã chấm công ${w.fullName} bằng ${method}`);
    setQrInput('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <QrCode size={20} /> Chấm công GPS / QR
        </h1>
        <p className="text-sm text-gray-500">Tuần {selectedWeek} — ghi nhận có mặt tại công trường</p>
      </div>

      {!canEdit ? (
        <p className="text-sm text-gray-500">Chỉ admin/editor được chấm công.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><MapPin size={16} /> Theo GPS</h3>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={selectedWorker}
              onChange={e => setSelectedWorker(e.target.value)}
            >
              <option value="">— Chọn công nhân —</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.code} — {w.fullName}</option>
              ))}
            </select>
            <button onClick={captureGps} className="px-3 py-2 text-sm rounded-lg bg-slate-100 w-full">
              Lấy vị trí hiện tại
            </button>
            {gps && (
              <p className="text-xs text-gray-600">
                {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}{' '}
                <a className="text-primary underline" target="_blank" rel="noreferrer"
                  href={`https://maps.google.com/?q=${gps.lat},${gps.lng}`}>Bản đồ</a>
              </p>
            )}
            <button
              onClick={() => checkIn('GPS')}
              className="px-3 py-2 text-sm rounded-lg bg-primary text-white w-full flex items-center justify-center gap-1"
            >
              <CheckCircle size={16} /> Chấm công GPS
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><QrCode size={16} /> Theo mã QR / mã CN</h3>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Quét hoặc nhập mã công nhân"
              value={qrInput}
              onChange={e => setQrInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && checkIn('QR')}
            />
            <p className="text-xs text-gray-400">
              Dùng máy quét QR gắn mã = mã công nhân (code).
            </p>
            <button
              onClick={() => checkIn('QR')}
              className="px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white w-full"
            >
              Xác nhận chấm công QR
            </button>
          </div>
        </div>
      )}

      {msg && <p className="text-sm text-gray-700 bg-gray-50 border rounded-lg px-3 py-2">{msg}</p>}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <h3 className="font-semibold p-4 border-b">Lịch sử chấm công (phiên này)</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Thời gian</th>
              <th className="px-3 py-2 text-left">Công nhân</th>
              <th className="px-3 py-2 text-left">Hình thức</th>
              <th className="px-3 py-2 text-left">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((l, i) => (
              <tr key={i}>
                <td className="px-3 py-2">{l.time}</td>
                <td className="px-3 py-2">{l.worker}</td>
                <td className="px-3 py-2">{l.method}</td>
                <td className="px-3 py-2 text-gray-500">{l.detail}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-8 text-center text-gray-400">Chưa có bản ghi</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
