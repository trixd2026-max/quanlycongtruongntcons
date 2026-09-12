/** Xuất CSV (mở được bằng Excel) */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const bom = '\uFEFF';
  const lines = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))];
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** In / Xuất PDF qua hộp thoại in trình duyệt */
export function printElement(selector: string, title?: string) {
  const el = document.querySelector(selector);
  if (!el) return;
  const prev = document.title;
  if (title) document.title = title;
  window.print();
  document.title = prev;
}

/** Đọc file ảnh → base64 (demo / local) */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Chỉ chấp nhận file ảnh'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error('Ảnh tối đa 2MB'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Không đọc được file'));
    reader.readAsDataURL(file);
  });
}
