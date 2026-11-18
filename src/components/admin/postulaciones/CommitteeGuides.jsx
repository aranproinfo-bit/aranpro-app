import React from 'react';
import { CanonicalPdfHeader, CanonicalPdfPageFooter, CanonicalPdfFinalSignature, canonicalPortraitPrintStyles } from '../../common/CanonicalPdfParts';
import { printDocumentDirectly } from '../../../utils/printDocument';
export const guideTitles = { comite: 'Guía del comité y asambleas' };
export function printCommitteeGuide(kind, proposal = {}) {
  printDocumentDirectly('printable-guide-comite', `ARANPRO_Guia_Comite_Asambleas_${(proposal.targetCondo || 'Comunidad').replace(/[^a-zA-Z0-9]/g, '_')}`, {pageSize:'letter portrait',fitPage:false,margin:'0',extraStyles:canonicalPortraitPrintStyles + '.dossier-page + .dossier-page{break-before:page!important;page-break-before:always!important;} .page-2 table{font-size:11px!important;line-height:1.3!important}.page-2 table td,.page-2 table th{padding:7px!important}'});
}
export function CommitteeGuide({proposalConfig={}, empresaForm={}, signature='', signatureScale=1}) {
 const pdfStyle = 'canonical';
 const condo = proposalConfig.targetCondo || 'Comunidad';
 const city = proposalConfig.targetCity || empresaForm.city || '';
 const email = empresaForm.email || '';
 const phone = empresaForm.phone || '';
 const website = empresaForm.website || 'https://aranpro.cl';
 const adminName = empresaForm.adminName || '';
 const noticeDate = new Date().toLocaleDateString('es-CL', {day:'numeric',month:'long',year:'numeric'});
 return (
        <div  data-pdf-style={pdfStyle}>
          {/* PÁGINA 1 DE 2: EL COMITÉ DE ADMINISTRACIÓN (DS N° 7 MINVU) */}
          <div
            data-pdf-style={pdfStyle}
            className="dossier-page page-1 bg-white p-6 md:p-7 pl-9 md:pl-11 min-h-[1050px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed relative overflow-hidden"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 flex pointer-events-none select-none z-10" aria-hidden="true">
              <div className="w-[2.5px] h-full bg-[#0F3D2E]" />
              <div className="w-[2px] h-full bg-transparent" />
              <div className="w-[1.5px] h-full bg-[#D4B895]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.035]" aria-hidden="true">
              <img src="/brand/ARANPRO_sello_circular_integral_transparente.png" alt="" className="w-[360px] h-[360px] object-contain" />
            </div>

            <div className="space-y-3 relative z-10">
              <CanonicalPdfHeader badge="GUÍA PARA COMITÉS" description="Comité de administración" page={1} community={condo} email={email} phone={phone} city={city} />

              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  EL COMITÉ DE ADMINISTRACIÓN BAJO LA LEY N° 21.442 Y EL DECRETO SUPREMO N° 7
                </h4>
                <p className="text-[10px] text-slate-500">
                  Orientaciones prácticas para organizar el trabajo, respaldar acuerdos y conocer los límites del comité.
                </p>
              </div>

              {/* SECCIÓN 1: COMPOSICIÓN Y MANDATO */}
              <div className="border border-slate-300 rounded-xl overflow-hidden text-[10px]">
                <div className="bg-[#0F3D2E] text-white px-3 py-1.5 font-bold flex justify-between">
                  <span>1. ESTRUCTURA, REQUISITOS Y DURACIÓN DEL MANDATO</span>
                  <span className="text-[9px] text-[#D4B895]">Art. 17 Ley 21.442</span>
                </div>
                <div className="p-3 bg-slate-50 space-y-1.5 text-slate-700">
                  <p>• <strong>Quiénes pueden ser miembros:</strong> Propietarios, sus cónyuges o convivientes civiles, mandatarios con poder suficiente otorgado ante notario y representantes de personas jurídicas propietarias, conforme a los requisitos legales.</p>
                  <p>• <strong>Duración del mandato:</strong> Máximo 3 años en funciones, con posibilidad expresa de reelección indefinida por acuerdo de asamblea.</p>
                  <p>• <strong>Composición colegiada:</strong> Por regla general, 3 o 5 miembros, con excepciones legales. El presidente es designado por la asamblea o, en subsidio, por el comité.</p>
                </div>
              </div>

              {/* SECCIÓN 2: ATRIBUCIONES EXCLUSIVAS DEL COMITÉ */}
              <div className="border border-emerald-300 rounded-xl overflow-hidden text-[10px]">
                <div className="bg-emerald-800 text-white px-3 py-1.5 font-bold flex justify-between">
                  <span>2. FACULTADES Y RESPONSABILIDADES DEL COMITÉ</span>
                  <span className="text-[9px] text-emerald-200">Ámbito de Decisión Directa</span>
                </div>
                <div className="p-3 bg-white space-y-1.5 text-slate-700">
                  <p>• <strong>Reglamentación Interna:</strong> Dictar normas de convivencia, horarios de uso de quinchos, piscinas y áreas comunes.</p>
                  <p>• <strong>Designación / Remoción del Administrador:</strong> Supervisar su gestión y revisar su cuenta mensual. La asamblea puede designar o remover al administrador; revisar las facultades aplicables en cada caso.</p>
                  <p>• <strong>Convenios de Pago:</strong> Revisar con la administración los convenios que procedan y mantener respaldo de los compromisos adoptados.</p>
                  <p>• <strong>Aplicación de Multas:</strong> Cursar infracciones económicas expresamente contempladas en el Reglamento de Copropiedad previa notificación.</p>
                  <p>• <strong>Acuerdos y respaldos:</strong> Se adoptan por la mitad más uno de sus miembros. El presidente custodia las actas y respaldos; las solicitudes en el libro de novedades se responden dentro de 20 días corridos.</p>
                  <p>• <strong>Uso de Cuentas:</strong> Supervisar la gestión financiera y sus respaldos conforme a la ley, el reglamento y los acuerdos de asamblea.</p>
                </div>
              </div>

              {/* SECCIÓN 3: MATERIAS PROHIBIDAS AL COMITÉ (RESERVADAS A LA ASAMBLEA) */}
              <div className="border border-rose-300 rounded-xl overflow-hidden text-[10px]">
                <div className="bg-rose-900 text-white px-3 py-1.5 font-bold flex justify-between">
                  <span>3. MATERIAS DE ASAMBLEA EXTRAORDINARIA</span>
                  <span className="text-[9px] text-rose-200">Revisar competencia y delegación</span>
                </div>
                <div className="p-3 bg-white space-y-1.5 text-slate-700">
                  <p>• <strong>Modificación del Reglamento de Copropiedad:</strong> Requiere asamblea extraordinaria; el quórum depende de la materia modificada.</p>
                  <p>• <strong>Gastos Extraordinarios Mayores:</strong> Gastos o inversiones que excedan seis cuotas ordinarias del total del condominio en doce meses; revisar si existe delegación legalmente admisible.</p>
                  <p>• <strong>Enajenación de Bienes Comunes:</strong> Venta, gravamen, hipoteca o arrendamiento de bienes del condominio.</p>
                  <p>• <strong>Demolición o Reconstrucción:</strong> La reconstrucción o demolición del condominio requiere acuerdo extraordinario con mayoría reforzada.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-1 relative z-10"><div className="border-t border-slate-200 flex justify-between items-center py-1 text-[9px] text-slate-600"><span>Continúa: materias y quórums de asambleas</span><strong className="text-[#0F3D2E]">Continúa en página 2 →</strong></div><CanonicalPdfPageFooter website={website} label="Guía para comités" page={1} totalPages={2} city={city} /></div>
          </div>

          {/* PÁGINA 2 DE 2: CUADRO DE MATERIAS Y QUÓRUMS (ART. 15 LEY 21.442) */}
          <div
            data-pdf-style={pdfStyle}
            className="dossier-page page-2 bg-white p-6 md:p-7 pl-9 md:pl-11 min-h-[1050px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed relative overflow-hidden"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 flex pointer-events-none select-none z-10" aria-hidden="true">
              <div className="w-[2.5px] h-full bg-[#0F3D2E]" />
              <div className="w-[2px] h-full bg-transparent" />
              <div className="w-[1.5px] h-full bg-[#D4B895]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.035]" aria-hidden="true">
              <img src="/brand/ARANPRO_sello_circular_integral_transparente.png" alt="" className="w-[360px] h-[360px] object-contain" />
            </div>

            <div className="space-y-3 relative z-10">
              <CanonicalPdfHeader badge="GUÍA PARA COMITÉS" description="Asambleas y quórums" page={2} community={condo} email={email} phone={phone} city={city} />

              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  CUADRO DE MATERIAS Y QUÓRUMS DE ASAMBLEAS (ART. 15 LEY N° 21.442)
                </h4>
                <p className="text-[10px] text-slate-500">
                  Identifique la materia y verifique tanto el quórum de constitución como el de acuerdo y las formalidades aplicables.
                </p>
              </div>

              {/* TABLA MAESTRA COMPLETA DE QUÓRUMS */}
              <div className="border border-slate-300 rounded-xl overflow-hidden text-[10px]">
                <table className="w-full text-left">
                  <thead className="bg-[#0F3D2E] text-white">
                    <tr>
                      <th className="p-2 font-bold w-36">Tipo de Asamblea</th>
                      <th className="p-2 font-bold">Materias que Pueden Tratarse</th>
                      <th className="p-2 font-bold text-center w-28">Quórum Sesionar</th>
                      <th className="p-2 font-bold text-center w-28">Quórum Acordar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr>
                      <td className="p-2.5 font-bold text-[#0F3D2E] bg-emerald-50/40">
                        ORDINARIA<br/>
                        <span className="text-[8.5px] font-normal text-slate-500">Al menos 1 vez al año</span>
                      </td>
                      <td className="p-2.5 text-slate-700">
                        Rendición de cuentas documentada y balances; designación o reelección del Comité; <strong>designación o remoción del Administrador</strong>; presupuestos anuales; actualizaciones del plan de emergencia; asuntos de interés común.
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-800 bg-slate-50">
                        Mínimo 33% derechos
                      </td>
                      <td className="p-2.5 text-center font-bold text-emerald-800 bg-emerald-50/60">
                        Mayoría absoluta asistentes
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2.5 font-bold text-blue-900 bg-blue-50/40">
                        EXTRAORDINARIA MAYORÍA ABSOLUTA
                      </td>
                      <td className="p-2.5 text-slate-700">
                        Modificación del Reglamento, salvo materias sujetas a mayoría reforzada; remoción parcial o total del Comité; gastos extraordinarios que excedan, en 12 meses, 6 cuotas ordinarias del total del condominio; uso del Fondo Común de Reserva para mantención o reparación ordinaria, bajo las condiciones legales.
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-800 bg-slate-50">
                        Mayoría absoluta derechos
                      </td>
                      <td className="p-2.5 text-center font-bold text-blue-900 bg-blue-50/60">
                        Mayoría absoluta derechos totales
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2.5 font-bold text-purple-900 bg-purple-50/40">
                        EXTRAORDINARIA MAYORÍA REFORZADA
                      </td>
                      <td className="p-2.5 text-slate-700">
                        Delegación al Comité de las materias expresamente permitidas por la ley; enajenación, gravamen o arrendamiento de bienes comunes; demolición; retribución a miembros del comité mediante descuento de gastos comunes; seguros que modifiquen los riesgos por incorporación o eliminación de coberturas complementarias; modificaciones al reglamento sobre reconstrucción, demolición o destino de unidades.
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-800 bg-slate-50">
                        Al menos 66% derechos
                      </td>
                      <td className="p-2.5 text-center font-bold text-purple-900 bg-purple-50/60">
                        66% derechos totales
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2.5 font-bold text-amber-900 bg-amber-50/40">
                        CONSULTA POR ESCRITO<br/>
                        <span className="text-[8.5px] font-normal text-slate-500">Votación Digital</span>
                      </td>
                      <td className="p-2.5 text-slate-700" colSpan="3">
                        El artículo 15 exige enviar los antecedentes y celebrar previamente una sesión informativa. Deben respetarse el quórum y las formalidades de la materia, acreditar la identidad, conservar las respuestas y levantar acta.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* VISADO PERICIAL ARANPRO */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-300 flex items-center justify-between text-[10px]">
                <div className="space-y-0.5">
                  <span className="font-bold text-[#0F3D2E] block uppercase">Referencia normativa:</span>
                  <p className="text-slate-600">
                    Ley N° 21.442, artículos 14, 15 y 17, y DS N° 7 MINVU. Revisar el reglamento de copropiedad y las condiciones del caso.
                  </p>
                </div>
                <div className="shrink-0 text-right font-mono text-[9px] text-slate-500 pl-4 border-l border-slate-200">
                  <p className="font-bold text-slate-800">{adminName}</p>
                  <p className="text-[#0F3D2E]">Gestión Integral</p>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-1 relative z-10"><CanonicalPdfFinalSignature companyRut={empresaForm.companyRut} phone={phone} email={email} website={website} signature={signature} signatureScale={signatureScale} adminName={adminName} adminRut={empresaForm.adminRut || ''} /><CanonicalPdfPageFooter website={website} label="Guía para comités" page={2} totalPages={2} city={city} /></div>
          </div>
        </div>
 );
}


