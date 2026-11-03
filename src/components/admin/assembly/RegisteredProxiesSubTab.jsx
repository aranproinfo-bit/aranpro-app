import React, { useState } from 'react';
import { useCommunity } from '../../../context/CommunityContext';
import { 
  ShieldCheck, UserCheck, UserX, FileText, Printer, Plus, 
  Copy, Check, AlertCircle, Clock, X, Users, Edit3, ShieldAlert
} from 'lucide-react';
import { formatDate } from '../../../utils/formatters';
import { printDocumentDirectly } from '../../../utils/printDocument';

export const RegisteredProxiesSubTab = ({ currentCommunity }) => {
  const { saveProxyRecord, revokeProxyRecord } = useCommunity();

  const registeredProxies = currentCommunity?.registeredProxies || [];
  const units = currentCommunity?.units || [];

  // Modales
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Formulario de acreditación
  const [proxyForm, setProxyForm] = useState({
    unitNumber: 'Casa 1',
    ownerName: '',
    ownerRut: '',
    proxyName: '',
    proxyRut: '',
    relationship: 'Arrendataria con Poder',
    proxyType: 'Poder Simple Escrito (Ley 21.442 Art. 16°)',
    validity: 'Período 2026 (Renovación Anual)',
    status: 'ACREDITADO',
    notes: ''
  });

  const handleOpenEdit = (unit, existingProxy) => {
    setSelectedUnit(unit);
    if (existingProxy) {
      setProxyForm({
        unitNumber: unit.number,
        ownerName: existingProxy.ownerName || unit.owner,
        ownerRut: existingProxy.ownerRut || unit.rut,
        proxyName: existingProxy.proxyName || '',
        proxyRut: existingProxy.proxyRut || '',
        relationship: existingProxy.relationship || 'Arrendatario/a con Poder',
        proxyType: existingProxy.proxyType || 'Poder Simple Escrito (Ley 21.442 Art. 16°)',
        validity: existingProxy.validity || 'Período 2026',
        status: existingProxy.status || 'ACREDITADO',
        notes: existingProxy.notes || ''
      });
    } else {
      setProxyForm({
        unitNumber: unit.number,
        ownerName: unit.owner,
        ownerRut: unit.rut,
        proxyName: '',
        proxyRut: '',
        relationship: 'Arrendatario/a con Poder',
        proxyType: 'Poder Simple Escrito (Ley 21.442 Art. 16°)',
        validity: 'Período 2026',
        status: 'ACREDITADO',
        notes: ''
      });
    }
    setShowEditModal(true);
  };

  const handleSaveProxy = (e) => {
    e.preventDefault();
    if (!selectedUnit) return;

    saveProxyRecord(currentCommunity.id, {
      unitNumber: `Casa ${selectedUnit.number}`,
      ownerName: proxyForm.ownerName,
      ownerRut: proxyForm.ownerRut,
      proxyName: proxyForm.proxyName,
      proxyRut: proxyForm.proxyRut,
      relationship: proxyForm.relationship,
      proxyType: proxyForm.proxyType,
      validity: proxyForm.validity,
      status: proxyForm.status,
      grantedDate: new Date().toISOString().split('T')[0],
      notes: proxyForm.notes
    });

    setShowEditModal(false);
    setSelectedUnit(null);
  };

  const handleRevokeProxy = (unitNumber) => {
    if (confirm(`¿Confirma revocar la acreditación de poder para la Vivienda ${unitNumber}?`)) {
      revokeProxyRecord(currentCommunity.id, `Casa ${unitNumber}`);
    }
  };

  const legalTemplateText = `CARTA PODER SIMPLE DE REPRESENTACIÓN EN ASAMBLEA
(Conforme al Artículo 16° de la Ley N° 21.442 sobre Copropiedad Inmobiliaria)

En La Serena, a _____ de _________________ de 2026.

Yo, ____________________________________________________, Cédula Nacional de Identidad N° _____________________, en mi calidad de copropietario/a titular de la vivienda/departamento N° _______ del Condominio ${currentCommunity?.name || 'Los Cerezos'}, ubicado en Camino San Ramón 4500, La Serena;

Por medio del presente instrumento confiero PODER SIMPLE ESPECIAL a don/doña:
Nombre: ____________________________________________________
Cédula Nacional de Identidad N°: _____________________________
Calidad: [ ] Arrendatario/a   [ ] Cónyuge/Familiar   [ ] Copropietario/a

Para que me represente con derecho a voz y voto en la Asamblea de Copropietarios (ordinaria, extraordinaria o consulta por escrito) a celebrarse para el Condominio, pudiendo pronunciarse válidamente sobre la totalidad de las materias contenidas en la tabla de citación, quórums de aprobación y designación de autoridades comunitarias.

El presente mandato se otorga al amparo del artículo 16° de la Ley N° 21.442, obligándome a acatar los acuerdos válidamente adoptados.

Adjunto fotocopia de mi Cédula Nacional de Identidad por ambos lados.


________________________________________
FIRMA DEL COPROPIETARIO TITULAR
RUT: __________________________________`;

  const copyTemplate = () => {
    navigator.clipboard.writeText(legalTemplateText);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* 1. CABECERA & ACCIONES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3 shrink-0">
          <div className="p-2.5 bg-gradient-to-br from-[#0F3D2E] to-[#14533d] text-white rounded-2xl shadow-xs shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#D4B895]" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <h3 className="text-base font-black text-slate-900 tracking-tight whitespace-nowrap">
                Registro y Acreditación de Poderes de Representación
              </h3>
              <span className="text-[10px] font-bold bg-[#0F3D2E]/10 text-[#0F3D2E] px-2 py-0.5 rounded-full border border-[#0F3D2E]/20 uppercase">
                Ley N° 21.442 • Art. 16°
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Control legal de mandatos simples otorgados por propietarios a arrendatarios o vecinos para voz y voto en asambleas
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowTemplateModal(true)}
          className="px-3.5 py-2 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-amber-950 border border-amber-300 font-bold text-xs rounded-xl flex items-center shadow-xs transition-all cursor-pointer shrink-0"
        >
          <FileText className="w-3.5 h-3.5 mr-1.5 text-amber-700" />
          <span>Ver Formato Poder Simple Art. 16°</span>
        </button>
      </div>

      {/* 2. TABLA DE TODAS LAS VIVIENDAS Y SU ESTADO DE REPRESENTACIÓN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F4EF] text-slate-700 uppercase font-black text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">Vivienda</th>
                <th className="py-3 px-3.5">Propietario Titular</th>
                <th className="py-3 px-3.5">Representante / Apoderado (Art. 16°)</th>
                <th className="py-3 px-3.5">Tipo de Poder & Vigencia</th>
                <th className="py-3 px-3.5 text-center">Estado Acreditación</th>
                <th className="py-3 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {units.map(unit => {
                const proxy = registeredProxies.find(p => p.unitNumber === `Casa ${unit.number}` || p.unitNumber === unit.number);
                const hasProxy = !!proxy && proxy.status !== 'REVOCADO';

                return (
                  <tr key={unit.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3.5 font-black text-[#0F3D2E] whitespace-nowrap">
                      Casa {unit.number}
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{unit.owner}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{unit.rut}</div>
                    </td>

                    <td className="py-3 px-3.5">
                      {hasProxy ? (
                        <div>
                          <div className="font-black text-slate-900 flex items-center space-x-1">
                            <span>{proxy.proxyName}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            RUT: {proxy.proxyRut} • {proxy.relationship}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Titular Directo (Sin poder delegado)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3.5">
                      {hasProxy ? (
                        <div>
                          <span className="font-semibold text-slate-800 text-[11px] block">{proxy.proxyType}</span>
                          <span className="text-[10px] text-slate-500">{proxy.validity}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3.5 text-center">
                      {hasProxy ? (
                        proxy.status === 'ACREDITADO' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            🟢 Acreditado
                          </span>
                        ) : proxy.status === 'EN_REVISION' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            🟡 En Revisión
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            🔴 Revocado
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">
                          Vota Propietario
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(unit, proxy)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                          title="Acreditar o modificar el poder de representación para esta casa"
                        >
                          {hasProxy ? 'Modificar' : '+ Acreditar Poder'}
                        </button>

                        {hasProxy && (
                          <button
                            type="button"
                            onClick={() => handleRevokeProxy(unit.number)}
                            className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Revocar acreditación de poder"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ACREDITAR O MODIFICAR PODER */}
      {showEditModal && selectedUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#0F3D2E] text-white rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-[#D4B895]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Acreditar Poder: Casa {selectedUnit.number}
                  </h3>
                  <p className="text-xs text-slate-500">Conforme a la Ley N° 21.442 Art. 16°</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProxy} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Propietario Titular</label>
                  <input
                    type="text"
                    required
                    value={proxyForm.ownerName}
                    onChange={(e) => setProxyForm({ ...proxyForm, ownerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">RUT Propietario</label>
                  <input
                    type="text"
                    required
                    value={proxyForm.ownerRut}
                    onChange={(e) => setProxyForm({ ...proxyForm, ownerRut: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Representante / Apoderado</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Daniela Rojas Plaza"
                    value={proxyForm.proxyName}
                    onChange={(e) => setProxyForm({ ...proxyForm, proxyName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">RUT Representante</label>
                  <input
                    type="text"
                    required
                    placeholder="17.842.105-3"
                    value={proxyForm.proxyRut}
                    onChange={(e) => setProxyForm({ ...proxyForm, proxyRut: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vínculo con la Unidad</label>
                  <select
                    value={proxyForm.relationship}
                    onChange={(e) => setProxyForm({ ...proxyForm, relationship: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="Arrendatario/a con Poder">Arrendatario/a con Poder</option>
                    <option value="Cónyuge / Co-Habitante">Cónyuge / Co-Habitante</option>
                    <option value="Hijo/a o Familiar">Hijo/a o Familiar</option>
                    <option value="Copropietario Apoderado">Copropietario Apoderado</option>
                    <option value="Abogado / Tercero">Abogado / Tercero</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Instrumento</label>
                  <select
                    value={proxyForm.proxyType}
                    onChange={(e) => setProxyForm({ ...proxyForm, proxyType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="Poder Simple Escrito (Ley 21.442 Art. 16°)">Poder Simple Escrito (Art. 16°)</option>
                    <option value="Poder Notarial Amplio">Poder Notarial Amplio</option>
                    <option value="Cláusula en Contrato de Arriendo">Cláusula en Contrato de Arriendo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vigencia del Poder</label>
                  <select
                    value={proxyForm.validity}
                    onChange={(e) => setProxyForm({ ...proxyForm, validity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="Período 2026 (Renovación Anual)">Período 2026 (Anual)</option>
                    <option value="Indefinido">Indefinido</option>
                    <option value="Solo próxima asamblea">Solo próxima asamblea</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estado de Acreditación</label>
                  <select
                    value={proxyForm.status}
                    onChange={(e) => setProxyForm({ ...proxyForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="ACREDITADO">🟢 Acreditado y Válido</option>
                    <option value="EN_REVISION">🟡 En Revisión de Firma</option>
                    <option value="REVOCADO">🔴 Revocado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas de Verificación</label>
                <input
                  type="text"
                  placeholder="Ej: Carta poder firmada con copia de carnet adjunta..."
                  value={proxyForm.notes}
                  onChange={(e) => setProxyForm({ ...proxyForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-black rounded-xl shadow-xs cursor-pointer flex items-center space-x-1"
                >
                  <Check className="w-4 h-4 text-[#D4B895]" />
                  <span>Guardar Acreditación</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MODELO OFICIAL DE PODER SIMPLE (LEY 21.442 ART. 16°) */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#0F3D2E] text-white rounded-xl">
                  <FileText className="w-5 h-5 text-[#D4B895]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Formato Oficial de Poder Simple</h3>
                  <p className="text-xs text-slate-500">Ley N° 21.442 Artículo 16°</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div 
              id="proxy-legal-template-doc"
              className="p-5 bg-white rounded-xl border border-slate-300 font-sans text-xs text-slate-800 space-y-4"
            >
              {/* Membrete Oficial ARANPRO */}
              <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-2.5 font-sans">
                <div className="flex items-center space-x-3">
                  <img 
                    src="/brand/ARANPRO_logo_horizontal_transparente_trimmed.png" 
                    alt="ARANPRO" 
                    className="h-8 w-auto object-contain"
                  />
                  <div className="border-l border-slate-300 pl-2.5">
                    <div className="text-[9.5px] font-black text-[#0F3D2E] uppercase">Gestión Inmobiliaria Integral</div>
                    <div className="text-[8.5px] text-slate-500 font-mono">RUT: 76.999.888-1 • Reg. MINVU N° 44.201</div>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-slate-900">{currentCommunity.name}</div>
                  <div className="text-[9.5px] text-[#0F3D2E] font-bold">Ley N° 21.442 • Art. 16°</div>
                </div>
              </div>

              <div className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 p-2 bg-slate-50 rounded-lg border border-slate-200">
                {legalTemplateText}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={copyTemplate}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                {copiedTemplate ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>¡Copiado al Portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-600" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  const commName = (currentCommunity?.name || 'Condominio').replace(/\s+/g, '_');
                  printDocumentDirectly('proxy-legal-template-doc', `Poder_Simple_Representacion_Art16_${commName}`, { fitPage: true });
                }}
                className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-black text-xs rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#D4B895]" />
                <span>Imprimir Formulario (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
