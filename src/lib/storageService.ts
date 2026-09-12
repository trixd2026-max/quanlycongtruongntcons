import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage, isFirebaseConfigured } from './firebase';
import { fileToBase64 } from '../utils/export';

export async function uploadEvidenceImage(
  file: File,
  pathPrefix = 'evidence'
): Promise<{ ok: boolean; url?: string; message?: string }> {
  if (!file.type.startsWith('image/')) {
    return { ok: false, message: 'Chỉ chấp nhận file ảnh' };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, message: 'Ảnh tối đa 5MB' };
  }

  if (isFirebaseConfigured()) {
    const storage = getFirebaseStorage();
    if (storage) {
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${pathPrefix}/${Date.now()}_${safeName}`;
        const r = ref(storage, path);
        await uploadBytes(r, file, { contentType: file.type });
        const url = await getDownloadURL(r);
        return { ok: true, url };
      } catch (e) {
        console.warn('Storage upload failed, fallback base64', e);
      }
    }
  }

  try {
    const url = await fileToBase64(file);
    return { ok: true, url };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Không đọc được file' };
  }
}
