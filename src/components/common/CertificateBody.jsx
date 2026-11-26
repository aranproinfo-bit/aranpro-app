import React from 'react';
import {formatRut,formatDate,formatCLP} from '../../utils/formatters';
export function CertificateBody({previewCert,currentCommunity,companySettings}) {
 return (
                <div className="text-justify text-xs md:text-sm text-slate-800 leading-relaxed space-y-4">
                  <p>
                    La Administración de la Comunidad <strong>"{previewCert.communityName || currentCommunity?.name}"</strong>,
                    en uso de las atribuciones legales que le confieren los <strong>Artículos 17°, 20° y 36° de la Ley N° 21.442</strong> sobre
                    Copropiedad Inmobiliaria y el respectivo Reglamento de Copropiedad:
                  </p>

                  <div className="p-4 bg-[#0F3D2E]/5 rounded-xl border-l-4 border-[#0F3D2E] space-y-2">
                    <p className="font-black text-[#0F3D2E] uppercase tracking-wide text-xs">
                      DECLARA Y CERTIFICA SOLEMNEMENTE:
                    </p>

                    {/* Caso 1: Certificado de No Deuda (Al Día) */}
                    {previewCert.type.includes('No Deuda') && (
                      <p>
                        Que revisados los registros contables, la cuenta bancaria de la comunidad y la última liquidación de gastos comunes
                        aprobada, el inmueble correspondiente a la <strong>Casa / Departamento N° {previewCert.unitNumber}</strong>, de propiedad o
                        ocupación de don(a) <strong>{previewCert.applicantName}</strong> (RUT {formatRut(previewCert.rut)}),
                        <span className="text-[#0F3D2E] font-bold">
                          {' '}se encuentra ÍNTEGRAMENTE AL DÍA en el pago de los gastos comunes ordinarios, gastos comunes extraordinarios y fondo de reserva devengados a la fecha, no registrando multas, intereses ni saldos deudores pendientes de cobro conforme a la Ley N° 21.442.
                        </span>
                      </p>
                    )}

                    {/* Caso 2: Certificado de Deuda y Liquidación Morosa (Art. 36°) */}
                    {previewCert.type.includes('Estado de Deuda') && (
                      <div className="space-y-3">
                        <p>
                          Que revisados los estados contables oficiales de la copropiedad, el inmueble individualizado como
                          <strong> Casa / Departamento N° {previewCert.unitNumber}</strong>, a nombre de don(a)
                          <strong> {previewCert.applicantName}</strong> (RUT {formatRut(previewCert.rut)}),
                          <span className="text-rose-700 font-bold">
                            {' '}REGISTRA A LA FECHA UNA DEUDA ACTIVA Y EXIGIBLE POR CONCEPTO DE GASTOS COMUNES que asciende a la suma total de ${Number(previewCert.debtAmount || 0).toLocaleString('es-CL')} pesos chilenos.
                          </span>
                        </p>

                        {/* Cuadro de Desglose de Deuda Notarial */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                            Liquidación Oficial de Saldos Deudores Exigibles (Art. 20° Ley 21.442)
                          </span>
                          <table className="w-full text-xs">
                            <tbody>
                              <tr className="border-b border-slate-100">
                                <td className="py-1 text-slate-600">Gastos Comunes Ordinarios y Fondo de Reserva:</td>
                                <td className="py-1 text-right font-mono font-bold text-slate-900">
                                  ${Number(previewCert.debtAmount || 0).toLocaleString('es-CL')}
                                </td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                <td className="py-1 text-slate-600">Intereses y Recargos Legales (Art. 27°):</td>
                                <td className="py-1 text-right font-mono text-slate-600">$0</td>
                              </tr>
                              <tr className="font-bold text-slate-900 bg-slate-50">
                                <td className="py-1.5 px-2">TOTAL MOROSO EXIGIBLE A LA FECHA:</td>
                                <td className="py-1.5 px-2 text-right font-mono text-rose-700 text-sm">
                                  ${Number(previewCert.debtAmount || 0).toLocaleString('es-CL')}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Advertencia Legal Expresa al Nuevo Dueño Art. 36° */}
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs space-y-1">
                          <p className="font-bold">
                            ⚠️ ADVERTENCIA LEGAL AL ADQUIRENTE, BANCO Y NOTARÍA (ART. 36° LEY N° 21.442):
                          </p>
                          <p className="leading-relaxed text-[11px]">
                            "La obligación del propietario por los gastos comunes sigue siempre al dominio de su unidad, aun respecto de los devengados antes de su adquisición."
                            En caso de compraventa o cesión, si el saldo deudor no es retenido ni cancelado oportunamente,
                            <strong> el nuevo adquirente responderá íntegra y solidariamente de la deuda precedente ante la comunidad.</strong>
                          </p>
                        </div>

                        {/* Instrucción de Retención Notarial */}
                        <p className="text-xs font-semibold text-slate-900">
                          📌 INSTRUCCIÓN DE RETENCIÓN NOTARIAL: Se instruye formalmente a la Notaría y entidad otorgante del crédito hipotecario retener la suma de 
                          <span className="font-mono font-bold text-rose-700"> ${Number(previewCert.debtAmount || 0).toLocaleString('es-CL')} </span> 
                          mediante Vale Vista Bancario a nombre de "{previewCert.communityName || currentCommunity?.name}" al momento de suscribir la escritura pública.
                        </p>
                      </div>
                    )}

                    {/* Caso 3: Salvoconducto y Desalojo / Mudanza (Propuesta 1) */}
                    {previewCert.type.includes('Mudanza') && (
                      <div className="space-y-2">
                        <p>
                          Que conforme a las disposiciones del Reglamento de Copropiedad Interno y la Ley N° 21.442, se
                          <strong> AUTORIZA EL TRASLADO DE BIENES MUEBLES Y MUDANZA</strong> correspondiente a la
                          <strong> Casa / Departamento N° {previewCert.unitNumber}</strong>, a nombre de don(a)
                          <strong> {previewCert.applicantName}</strong> (RUT {formatRut(previewCert.rut)}), certificando fehacientemente:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-xs">
                          <li>Que la unidad se encuentra con sus obligaciones económicas y gastos comunes al día a la fecha.</li>
                          <li>Que no registra multas pendientes ni daños ocasionados a bienes de dominio común (portones, ascensores, áreas comunes).</li>
                          <li>Que se ha coordinado el protocolo de resguardo y protección de accesos vehiculares y peatonales.</li>
                        </ul>
                        <p className="text-[11px] text-slate-600 font-semibold bg-white p-2 rounded border border-slate-200">
                          Horario de Mudanza Autorizado: Lunes a Viernes de 09:00 a 18:00 hrs. Sábados de 09:00 a 14:00 hrs. Domingos y festivos prohibido.
                        </p>
                      </div>
                    )}

                    {/* Caso 4: Alícuota y Copropiedad (Propuesta 2) */}
                    {previewCert.type.includes('Alícuota') && (
                      <div className="space-y-2">
                        <p>
                          Que de acuerdo con los títulos de dominio y el plano de copropiedad inscrito en el Conservador de Bienes Raíces respectivo,
                          la <strong>Casa / Departamento N° {previewCert.unitNumber}</strong>, perteneciente a don(a)
                          <strong> {previewCert.applicantName}</strong> (RUT {formatRut(previewCert.rut)}), forma parte de esta copropiedad legalmente constituida.
                        </p>
                        <div className="bg-white p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] uppercase text-slate-400 block font-bold">Porcentaje de Alícuota / Prorrateo</span>
                            <span className="text-sm font-black text-[#0F3D2E] font-mono">{previewCert.aliquotPercent !== '' && previewCert.aliquotPercent != null ? `${previewCert.aliquotPercent}%` : 'No informado'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-slate-400 block font-bold">Destino del Inmueble</span>
                            <span className="font-bold text-slate-800">Habitacional Residencial</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-slate-400 block font-bold">Fondo de Reserva Legal (Art. 6°)</span>
                            <span className="font-bold text-slate-800">5.0% sobre gasto común</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-slate-400 block font-bold">Ponderación en Asambleas (Art. 15°)</span>
                            <span className="font-bold text-slate-800">{previewCert.aliquotPercent !== '' && previewCert.aliquotPercent != null ? `${previewCert.aliquotPercent}% de derecho a voto` : 'Porcentaje no informado'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Caso 5: Residencia */}
                    {previewCert.type.includes('Residencia') && (
                      <p>
                        Que conforme al <strong>Registro Oficial de Copropietarios y Residentes</strong> establecido en el Artículo 17° inciso 2
                        de la Ley N° 21.442, don(a) <strong>{previewCert.applicantName}</strong> (RUT {formatRut(previewCert.rut)}) mantiene
                        domicilio real y residencia habitual y continua en la <strong>Casa / Departamento N° {previewCert.unitNumber}</strong> de este condominio,
                        habitando en dicho predio en calidad de copropietario(a) u ocupante legítimo(a).
                      </p>
                    )}

                    {/* Caso 6: Comité */}
                    {previewCert.type.includes('Comité') && (
                      <p>
                        Que de conformidad con el Artículo 17° de la Ley N° 21.442 y el acta de Asamblea General de Copropietarios debidamente protocolizada,
                        don(a) <strong>{previewCert.applicantName}</strong> (RUT {formatRut(previewCert.rut)}) es <strong>MIEMBRO TITULAR Y ACTIVO DEL COMITÉ DE ADMINISTRACIÓN</strong> de
                        la presente copropiedad, encontrándose plenamente habilitado(a) para suscribir documentos oficiales, gestionar cuentas bancarias
                        y representar a la comunidad ante instituciones públicas y privadas.
                      </p>
                    )}

                    {/* Caso 7: Buena Convivencia */}
                    {previewCert.type.includes('Buena Convivencia') && (
                      <p>
                        Que revisado el Libro Oficial de Sugerencias y Reclamos y el registro de sanciones de la copropiedad,
                        los residentes de la <strong>Casa / Departamento N° {previewCert.unitNumber}</strong> han mantenido una conducta intachable,
                        observando fielmente las normas de convivencia vecinal y el Reglamento Interno, no registrando a la fecha
                        sanciones ni multas ejecutoriadas por ruidos molestos u otras faltas reglamentarias.
                      </p>
                    )}
                  </div>

                  <p>
                    El presente certificado se expide a solicitud de la parte interesada para ser presentado ante:
                    <strong> {previewCert.purpose || 'Notaría, Conservador de Bienes Raíces o Instituciones Financieras'}</strong>.
                  </p>

                  {previewCert.notes && (
                    <p className="text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                      Nota adicional: {previewCert.notes}
                    </p>
                  )}

 </div>);
}
