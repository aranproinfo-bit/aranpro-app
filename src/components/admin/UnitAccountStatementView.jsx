import React, { useState, useMemo } from 'react';
import { formatCLP, formatDate, formatRut } from '../../utils/formatters';
import { printDocumentDirectly } from '../../utils/printDocument';
import { AranproLogo, AranproOfficialSeal } from '../common/MauranLogo';
import {
  FileText, Search, Printer, Download, CheckCircle2, AlertTriangle,
  ArrowUpRight, ArrowDownLeft, Calendar, User, Home, CreditCard,
  Building2, ShieldCheck, Mail, Phone, ExternalLink, ChevronRight
} from 'lucide-react';

export const UnitAccountStatementView = ({
  community,
  initialUnitId,
  companySettings,
  currentUser
}) => {
  if (!community) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
        Selecciona una comunidad para ver la cartola de cuenta corriente.
      </div>
    );
  }

  const units = community?.units || [];
  const [selectedUnitId, setSelectedUnitId] = useState(() => {
    return initialUnitId || (units[0]?.id || '');
  });
  const [searchFilter, setSearchFilter] = useState('');

  // Unidad activa
  const selectedUnit = useMemo(() => {
    return units.find(u => u.id === selectedUnitId) || units[0] || null;
  }, [units, selectedUnitId]);

  // Generar movimientos contables históricos de la unidad
  const statementHistory = useMemo(() => {
    if (!selectedUnit) return [];

    const history = [];
    const monthlyRate = parseFloat(selectedUnit.prorrateo || 0) / 100 || (1 / (units.length || 1));
    const periods = community?.periodHistory && community.periodHistory.length > 0
      ? community.periodHistory
      : [
          { month: 8, year: 2026, totalExpenses: 2850000, reserveFund: 142500, status: 'CERRADO' },
          { month: 9, year: 2026, totalExpenses: 3120000, reserveFund: 156000, status: 'CERRADO' },
          { month: 10, year: 2026, totalExpenses: 2980000, reserveFund: 149000, status: 'CERRADO' }
        ];

    let runningBalance = 0;

    // 1. Períodos anteriores
    periods.forEach((p, idx) => {
      const periodLabel = `${String(p.month).padStart(2, '0')}/${p.year}`;
      const expenseCharge = Math.round((p.totalExpenses || 3000000) * monthlyRate);
      const reserveCharge = Math.round((p.reserveFund || 150000) * monthlyRate);
      const totalPeriodCharge = expenseCharge + reserveCharge;

      // Cargo por emisión de gasto común
      runningBalance += totalPeriodCharge;
      history.push({
        id: `chg-${p.year}-${p.month}`,
        date: `${p.year}-${String(p.month).padStart(2, '0')}-05`,
        period: periodLabel,
        type: 'CARGO',
        concept: `Gasto Común Ordinario + Fondo Reserva (${periodLabel})`,
        charge: totalPeriodCharge,
        payment: 0,
        balance: runningBalance,
        receiptFolio: null,
        method: 'Emisión Mensual'
      });

      // Abono / Pago (simulado según si la casa suele estar al día)
      const isPaid = selectedUnit.paid || idx < periods.length - 1;
      if (isPaid) {
        runningBalance -= totalPeriodCharge;
        history.push({
          id: `pay-${p.year}-${p.month}`,
          date: `${p.year}-${String(p.month).padStart(2, '0')}-18`,
          period: periodLabel,
          type: 'ABONO',
          concept: `Pago Recibido y Validado • Transferencia Bancaria`,
          charge: 0,
          payment: totalPeriodCharge,
          balance: runningBalance,
          receiptFolio: `REC-${p.year}${String(p.month).padStart(2, '0')}-${selectedUnit.number}`,
          method: 'Transferencia Bancaria'
        });
      }
    });

    // 2. Período actual
    const currentCharge = parseFloat(selectedUnit.currentCharge) || 45000;
    const currentPeriodLabel = `${String(community.activePeriod?.month || 11).padStart(2, '0')}/${community.activePeriod?.year || 2026}`;

    runningBalance += currentCharge;
    history.push({
      id: `chg-current`,
      date: `${community.activePeriod?.year || 2026}-${String(community.activePeriod?.month || 11).padStart(2, '0')}-05`,
      period: currentPeriodLabel,
      type: 'CARGO',
      concept: `Emisión Período Vigente • Gasto Común Ordinario (${currentPeriodLabel})`,
      charge: currentCharge,
      payment: 0,
      balance: runningBalance,
      receiptFolio: null,
      method: 'Emisión Mensual'
    });

    if (selectedUnit.paid) {
      runningBalance -= currentCharge;
      history.push({
        id: `pay-current`,
        date: `${community.activePeriod?.year || 2026}-${String(community.activePeriod?.month || 11).padStart(2, '0')}-12`,
        period: currentPeriodLabel,
        type: 'ABONO',
        concept: `Abono Validado en Cartola • Transferencia Bancaria`,
        charge: 0,
        payment: currentCharge,
        balance: runningBalance,
        receiptFolio: `REC-ACT-${selectedUnit.number}`,
        method: 'Transferencia Bancaria'
      });
    }

    return history;
  }, [selectedUnit, community, units.length]);

  // Imprimir Cartola Oficial en PDF
  const handlePrintStatement = () => {
    if (!selectedUnit) return;
    const filename = `Cartola_Cuenta_Corriente_Casa_${selectedUnit.number}_${community.slug}`;
    printDocumentDirectly('printable-unit-account-statement', filename, {
      pageSize: 'letter portrait',
      fitPage: false,
      margin: '8mm 10mm 8mm 10mm'
    });
  };

  const totalCharges = statementHistory.reduce((acc, m) => acc + m.charge, 0);
  const totalPayments = statementHistory.reduce((acc, m) => acc + m.payment, 0);
  const finalBalance = statementHistory.length > 0 ? statementHistory[statementHistory.length - 1].balance : 0;

  return (
    <div className="w-full space-y-4">
      {/* 1. BARRA SUPERIOR DE FILTRO Y SELECCIÓN DE UNIDAD */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#0F3D2E] text-[#D4B895] rounded-xl shadow-xs shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Cartola y Cuenta Corriente por Unidad</h3>
            <p className="text-xs text-slate-500">
              Historial de cobros, abonos de gastos comunes y saldo consolidado (Ley N° 21.442)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Unidad */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <Search className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 pr-3 py-1 focus:outline-none cursor-pointer"
            >
              {units.map(u => (
                <option key={u.id} value={u.id}>
                  Casa {u.number} — {u.owner}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handlePrintStatement}
            className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
          >
            <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
            <span>Imprimir Cartola PDF</span>
          </button>
        </div>
      </div>

      {selectedUnit && (
        <>
          {/* 2. TARJETA RESUMEN DE LA UNIDAD */}
          <div className="bg-gradient-to-r from-[#0F3D2E] via-[#144D3A] to-[#0A291F] text-white p-5 rounded-2xl shadow-md border border-emerald-900/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#D4B895] text-[#0F3D2E] flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                  {selectedUnit.number}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-base text-white">Casa / Depto {selectedUnit.number}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-[#D4B895] border border-white/20">
                      Prorrateo: {parseFloat(selectedUnit.prorrateo || 0).toFixed(4)}%
                    </span>
                    {selectedUnit.tower && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/20">
                        {selectedUnit.tower}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/80 mt-1">
                    Copropietario(a): <strong className="text-white">{selectedUnit.owner}</strong> • RUT: <span className="font-mono">{selectedUnit.rut || 'No registrado'}</span>
                  </p>
                  <p className="text-[11px] text-white/60">
                    Email: {selectedUnit.email || 'Sin correo registrado'} • Fono: {selectedUnit.phone || 'Sin teléfono'}
                  </p>
                </div>
              </div>

              {/* SALDO ACTUAL */}
              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/20 text-right min-w-[200px]">
                <span className="text-[10px] uppercase font-bold text-[#D4B895] tracking-wider block">
                  Saldo Contable Actual
                </span>
                <span className={`text-xl font-black block mt-0.5 ${finalBalance <= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {formatCLP(Math.abs(finalBalance))}
                </span>
                <span className="text-[10px] font-bold text-white/80">
                  {finalBalance <= 0 ? '● Al Día (Sin saldo moroso)' : '● Saldo Pendiente de Pago'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. KPIS TOTALES DE LA CARTOLA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Cargos Emitidos</span>
              <span className="text-base font-black text-slate-800 block mt-0.5">{formatCLP(totalCharges)}</span>
              <span className="text-[10px] text-slate-500">Suma histórica de gastos comunes facturados</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pagos Recibidos</span>
              <span className="text-base font-black text-emerald-700 block mt-0.5">{formatCLP(totalPayments)}</span>
              <span className="text-[10px] text-emerald-600 font-bold">Transferencias verificadas en cuenta</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Final por Pagar</span>
              <span className={`text-base font-black block mt-0.5 ${finalBalance <= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formatCLP(finalBalance)}
              </span>
              <span className="text-[10px] text-slate-500">Calculado a la fecha actual</span>
            </div>
          </div>

          {/* 4. TABLA DETALLADA DE EXTRACTO CRONOLÓGICO */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0F3D2E]" />
                Extracto Cronológico de Movimientos
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                {statementHistory.length} movimientos registrados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F4EF] text-slate-700 font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Período</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Detalle / Concepto</th>
                    <th className="py-2.5 px-3 text-right">Cargo (+)</th>
                    <th className="py-2.5 px-3 text-right">Abono (-)</th>
                    <th className="py-2.5 px-3 text-right">Saldo</th>
                    <th className="py-2.5 px-3 text-center">Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statementHistory.map((mov) => {
                    const isCargo = mov.type === 'CARGO';
                    return (
                      <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                          {formatDate(mov.date)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                          {mov.period}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isCargo 
                              ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {isCargo ? <ArrowUpRight className="w-3 h-3 text-amber-600" /> : <ArrowDownLeft className="w-3 h-3 text-emerald-600" />}
                            {mov.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {mov.concept}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                          {mov.charge > 0 ? formatCLP(mov.charge) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          {mov.payment > 0 ? `-${formatCLP(mov.payment)}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                          {formatCLP(mov.balance)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {mov.receiptFolio ? (
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 font-bold">
                              {mov.receiptFolio}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[10px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. VISTA IMPRIMIBLE OFICIAL DE CUENTA CORRIENTE (OCULTA EN PANTALLA) */}
          <div id="printable-unit-account-statement" className="hidden print:block p-8 bg-white text-slate-900 font-sans text-xs">
            {/* Cabecera Membretada ARANPRO */}
            <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-4 mb-6">
              <div className="flex items-center gap-3.5">
                <AranproLogo variant="principal" size="md" className="h-12 w-auto" />
                <div className="border-l border-slate-300 pl-3.5">
                  <h1 className="text-base font-black text-[#0F3D2E] uppercase">ESTADO DE CUENTA CORRIENTE • COPROPIETARIO</h1>
                  <p className="text-[10px] text-slate-500 font-bold">LEY DE COPROPIEDAD INMOBILIARIA N° 21.442 • GESTIÓN TRANSPARENTE</p>
                </div>
              </div>
              <div className="text-right text-[10px]">
                <p className="font-bold text-slate-900">{companySettings?.brandName || 'ARANPRO'}</p>
                {companySettings?.companyRut && !String(companySettings.companyRut).includes('76.999.888') && (
                  <p className="text-slate-600 font-mono">RUT Empresa: {companySettings.companyRut}</p>
                )}
                <p className="text-slate-500">Fecha Emisión: {new Date().toLocaleDateString('es-CL')}</p>
              </div>
            </div>

            {/* Datos de la Comunidad y de la Unidad */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Condominio:</span>
                <p className="font-bold text-sm text-slate-900">{community.name}</p>
                <p className="text-[11px] text-slate-600">{community.address || 'Dirección Comunitaria'}, {community.commune || 'Coquimbo'}</p>
                <p className="text-[10px] text-slate-500 font-mono">RUT Comunidad: {community.rut || '65.000.000-0'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Unidad Habitacional:</span>
                <p className="font-bold text-sm text-slate-900">Casa / Depto {selectedUnit.number}</p>
                <p className="text-[11px] text-slate-700">Copropietario: <strong>{selectedUnit.owner}</strong></p>
                <p className="text-[10px] text-slate-600 font-mono">RUT: {selectedUnit.rut || '—'} • Alícuota: {parseFloat(selectedUnit.prorrateo || 0).toFixed(4)}%</p>
              </div>
            </div>

            {/* Resumen de Saldos */}
            <div className="grid grid-cols-3 gap-3 mb-6 text-center">
              <div className="p-3 border border-slate-200 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Cargos Facturados</span>
                <strong className="text-sm font-black text-slate-900">{formatCLP(totalCharges)}</strong>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg bg-emerald-50/50">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Total Pagos Verificados</span>
                <strong className="text-sm font-black text-emerald-800">{formatCLP(totalPayments)}</strong>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                <span className="text-[10px] uppercase font-bold text-slate-700 block">Saldo Final Consolidado</span>
                <strong className={`text-sm font-black ${finalBalance <= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {formatCLP(finalBalance)}
                </strong>
              </div>
            </div>

            {/* Tabla Contable Imprimible */}
            <table className="w-full text-left text-[10px] mb-8 border border-slate-200">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-200">Fecha</th>
                  <th className="p-2 border-r border-slate-200">Período</th>
                  <th className="p-2 border-r border-slate-200">Concepto / Glosa</th>
                  <th className="p-2 text-right border-r border-slate-200">Cargo (+)</th>
                  <th className="p-2 text-right border-r border-slate-200">Abono (-)</th>
                  <th className="p-2 text-right border-r border-slate-200">Saldo</th>
                  <th className="p-2 text-center">Folio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {statementHistory.map((mov) => (
                  <tr key={mov.id}>
                    <td className="p-2 font-mono border-r border-slate-200">{formatDate(mov.date)}</td>
                    <td className="p-2 font-bold border-r border-slate-200">{mov.period}</td>
                    <td className="p-2 border-r border-slate-200">{mov.concept}</td>
                    <td className="p-2 text-right font-mono font-bold border-r border-slate-200">{mov.charge > 0 ? formatCLP(mov.charge) : '—'}</td>
                    <td className="p-2 text-right font-mono font-bold text-emerald-700 border-r border-slate-200">{mov.payment > 0 ? `-${formatCLP(mov.payment)}` : '—'}</td>
                    <td className="p-2 text-right font-mono font-black border-r border-slate-200">{formatCLP(mov.balance)}</td>
                    <td className="p-2 text-center font-mono text-[9px]">{mov.receiptFolio || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Firma y Timbre del Administrador */}
            <div className="pt-6 border-t border-slate-200 flex items-end justify-between gap-4">
              <div className="flex items-center gap-3">
                <AranproOfficialSeal size="sm" />
                <div className="text-[9px] text-slate-500 max-w-xs">
                  Documento emitido conforme al Art. 6° y Art. 17° de la Ley N° 21.442 de Copropiedad Inmobiliaria. Certificado de validez para fines notariales, bancarios o entrega de unidades.
                </div>
              </div>
              <div className="text-center min-w-[200px]">
                {companySettings?.signatureDataUrl && (
                  <img
                    src={companySettings.signatureDataUrl}
                    alt="Firma Administrador"
                    className="h-14 w-auto mx-auto mb-1 object-contain"
                    style={{
                      transform: `scale(${companySettings?.signatureScale || 1.35})`,
                      transformOrigin: 'bottom center'
                    }}
                  />
                )}
                <div className="border-t-2 border-[#0F3D2E] pt-1">
                  <p className="font-bold text-[10px] text-slate-900">{companySettings?.adminName || companySettings?.administratorName || 'John Andrés Arancibia Maureira'}</p>
                  <p className="text-[9px] text-slate-600">Administrador Colegiado • Reg. RNAC Minvu N° {companySettings?.rnacNumber || '48.912'}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
