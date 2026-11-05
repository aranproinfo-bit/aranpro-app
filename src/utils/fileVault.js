/**
 * Bóveda local de archivos (IndexedDB).
 *
 * Problema que resuelve: los diplomas/certificados se guardaban como base64 dentro de
 * `companySettings` en localStorage (límite ~5 MB). Un solo PDF de 8 MB superaba la cuota
 * y la escritura fallaba (o rompía la pantalla). Aquí los archivos viven en IndexedDB
 * (cientos de MB) y en los ajustes solo queda la metadata + `fileId`.
 *
 * Los archivos permanecen en el navegador del administrador: no se envían a ningún servidor.
 */

const DB_NAME = 'aranpro_file_vault';
const STORE = 'files';

let dbPromise = null;

const openDb = () => {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB no disponible en este navegador'));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error);
      };
    });
  }
  return dbPromise;
};

const run = async (mode, op) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const request = op(t.objectStore(STORE));
    t.oncomplete = () => resolve(request?.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
};

export const vaultPut = (id, dataUrl) => run('readwrite', (s) => s.put(dataUrl, id));
export const vaultGet = (id) => run('readonly', (s) => s.get(id));
export const vaultDelete = (id) => run('readwrite', (s) => s.delete(id));
export const vaultKeys = () => run('readonly', (s) => s.getAllKeys());

// id -> largo del dataUrl ya sincronizado (evita reescribir archivos grandes en cada autoguardado)
const synced = new Map();

/**
 * Mueve `fileData` (base64) de cada registro a la bóveda y devuelve registros livianos
 * (sin base64) con `fileId`. Si la bóveda falla, descarta el binario y marca `fileError`
 * en lugar de intentar meterlo en localStorage.
 */
export const stripAndStoreFiles = async (records = [], prefix = 'file') => {
  return Promise.all(
    records.map(async (r) => {
      if (!r.fileData) return r;
      const id = r.fileId || `${prefix}-${r.id}`;
      try {
        if (synced.get(id) !== r.fileData.length) {
          await vaultPut(id, r.fileData);
          synced.set(id, r.fileData.length);
        }
        const { fileData, ...rest } = r;
        return { ...rest, fileId: id, fileError: false };
      } catch (err) {
        console.warn('[fileVault] No se pudo guardar el archivo en la bóveda:', err);
        const { fileData, ...rest } = r;
        return { ...rest, fileId: undefined, fileError: true };
      }
    })
  );
};

/** Rellena `fileData` desde la bóveda para los registros que solo tienen `fileId`. */
export const hydrateFiles = async (records = []) => {
  return Promise.all(
    records.map(async (r) => {
      if (r.fileData || !r.fileId) return r;
      try {
        const data = await vaultGet(r.fileId);
        if (data) {
          synced.set(r.fileId, data.length);
          return { ...r, fileData: data };
        }
      } catch (err) {
        console.warn('[fileVault] No se pudo leer el archivo:', err);
      }
      return r;
    })
  );
};

/** Elimina de la bóveda los archivos de un prefijo que ya no pertenecen a ningún registro vivo. */
export const pruneVault = async (prefix, liveIds = []) => {
  try {
    const keys = await vaultKeys();
    const live = new Set(liveIds);
    await Promise.all(
      keys
        .filter((k) => typeof k === 'string' && k.startsWith(`${prefix}-`) && !live.has(k))
        .map((k) => {
          synced.delete(k);
          return vaultDelete(k);
        })
    );
  } catch (err) {
    console.warn('[fileVault] No se pudo depurar la bóveda:', err);
  }
};

/** Convierte un dataURL en Blob (necesario para abrir PDFs en una pestaña nueva). */
export const dataUrlToBlob = (dataUrl) => {
  const [meta, base64] = dataUrl.split(',');
  const mime = (meta.match(/data:(.*?);base64/) || [])[1] || 'application/octet-stream';
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

export const openDataUrlInNewTab = (dataUrl) => {
  if (!dataUrl) return;
  const url = URL.createObjectURL(dataUrlToBlob(dataUrl));
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

export const downloadDataUrl = (dataUrl, fileName) => {
  if (!dataUrl) return;
  const url = URL.createObjectURL(dataUrlToBlob(dataUrl));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'documento';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

export const formatFileSize = (bytes) =>
  bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
