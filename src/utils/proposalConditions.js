// Condiciones de una oportunidad: vacío significa que no existe una oferta definida.
export const emptyProposalConditions = () => ({
  visitFrequency: '', emergencyResponse: '', includedServices: '', additionalServices: '',
  meetingFrequency: '', startDate: '', transitionConditions: '', contractDuration: '',
  noticePeriod: '', otherConditions: ''
});

export function proposalConditionsFromRecord(record) {
  return { ...emptyProposalConditions(), ...(record?.proposalConditions || {}) };
}

export function activeProposalConditions(proposal) {
  const name = (proposal.targetCondo || '').trim().toLocaleLowerCase('es-CL');
  const owner = (proposal.proposalConditionsFor || '').trim().toLocaleLowerCase('es-CL');
  return name && name === owner ? { ...emptyProposalConditions(), ...proposal.proposalConditions } : emptyProposalConditions();
}

export function changeProposalCommunity(current, name) {
  if (name === current.targetCondo) return current;
  return { ...current, targetCondo: name, opportunityId: '', targetCity: '', targetRecipient: '', targetPhone: '', targetEmail: '', targetUnits: '', proposedMonthlyFee: '', proposalConditions: emptyProposalConditions(), proposalConditionsFor: name, visitFrequency: '' };
}

export function saveProposalOpportunity(existing, proposal, id, now) {
  const name = (proposal.targetCondo || '').trim();
  if (!name) throw new Error('Ingresa el nombre de la comunidad para guardar.');
  return {
    ...existing,
    id: existing?.id || id,
    condo: name,
    condoName: name,
    city: proposal.targetCity || '',
    units: proposal.unknownDetails ? '' : (proposal.targetUnits ?? ''),
    unitsCount: proposal.unknownDetails ? '' : (proposal.targetUnits ?? ''),
    contactName: proposal.targetRecipient || '',
    contactPhone: proposal.targetPhone || '',
    contactEmail: proposal.targetEmail || '',
    monthlyFeeCLP: proposal.unknownDetails || proposal.proposedMonthlyFee === '' ? '' : Number(proposal.proposedMonthlyFee) || '',
    feeOffered: proposal.unknownDetails || proposal.proposedMonthlyFee === '' ? '' : String(proposal.proposedMonthlyFee),
    stage: existing?.stage || 'prospecto',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    proposalConditions: activeProposalConditions(proposal)
  };
}

function readMonthlyFee(record) {
  if (record.monthlyFeeCLP !== undefined && record.monthlyFeeCLP !== null && record.monthlyFeeCLP !== '') return String(record.monthlyFeeCLP).replace(/[^0-9]/g, '');
  const fee = String(record.feeOffered || '');
  return /^\s*\$?\s*[\d.,\s]+(?:\s*\/\s*mes)?\s*$/i.test(fee) ? fee.replace(/[^0-9]/g, '') : '';
}

export function loadProposalOpportunity(current, record) {
  return {
    ...current,
    opportunityId: record.id,
    targetCondo: record.condoName || record.condo || '',
    proposalConditionsFor: record.condoName || record.condo || '',
    targetCity: record.city || '',
    targetRecipient: record.contactName || '',
    targetPhone: record.contactPhone || '',
    targetEmail: record.contactEmail || '',
    targetUnits: String(record.unitsCount ?? record.units ?? ''),
    proposedMonthlyFee: readMonthlyFee(record),
    proposalConditions: proposalConditionsFromRecord(record),
    leaveRecipientBlank: false,
    unknownDetails: false
  };
}
