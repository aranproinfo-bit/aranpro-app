const prefix = 'aranpro_labor_contract_draft_v1:';
export function laborDraftKey(communityId, workerId) {
  if (!String(communityId || '').trim() || !String(workerId || '').trim()) return null;
  return prefix + encodeURIComponent(String(communityId)) + ':' + encodeURIComponent(String(workerId));
}
export function loadLaborDraft(storage, communityId, workerId) {
  const key = laborDraftKey(communityId, workerId);
  if (!key) return null;
  try {
    const item = JSON.parse(storage.getItem(key) || 'null');
    if (!item || item.version !== 1 || item.communityId !== String(communityId) || item.workerId !== String(workerId) || !item.data || typeof item.data !== 'object') return null;
    return item.data;
  } catch { return null; }
}
export function saveLaborDraft(storage, communityId, workerId, data) {
  const key = laborDraftKey(communityId, workerId);
  if (!key) throw new Error('Falta identificar la comunidad o el trabajador.');
  storage.setItem(key, JSON.stringify({version:1,communityId:String(communityId),workerId:String(workerId),data}));
}
