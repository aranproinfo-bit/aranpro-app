import React, { useState } from 'react';
import { initialFaqs } from '../../data/initialData';
import {
  HelpCircle, ChevronDown, ChevronUp, Search, BookOpen,
  CheckCircle2, ArrowLeft, MessageSquare
} from 'lucide-react';

export const FaqSection = ({ onBack, onGoContact }) => {
  const [openIndex, setOpenIndex] = useState(0); // Primera abierta por defecto
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    'Todas',
    'Marco Legal & Normativo',
    'Asambleas & Comité',
    'Gastos Comunes & Pagos',
    'Rendición de Cuentas',
    'Seguros & Emergencia',
    'Tecnología & Plataforma'
  ];

  const filteredFaqs = initialFaqs.filter(faq => {
    const matchCat = selectedCategory === 'Todas' || faq.category === selectedCategory;
    const matchSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-[80vh] bg-[#F5F4EF] pb-20">
      {/* Cabecera de página independiente */}
      <div className="bg-[#0F3D2E] text-[#F5F4EF] border-b border-[#D4B895]/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center text-xs font-semibold text-[#D4B895] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Volver a la página principal
            </button>
          )}

          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#D4B895]/20 border border-[#D4B895]/40 rounded-full text-xs font-semibold text-[#D4B895]">
              <BookOpen className="w-3.5 h-3.5 text-[#D4B895]" />
              <span>Centro de Ayuda Legal & Copropiedad</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F5F4EF] tracking-tight">
              Preguntas Frecuentes sobre Administración y Ley 21.442
            </h1>
            <p className="text-sm sm:text-base text-[#F5F4EF]/80 max-w-2xl">
              Respuestas claras y fundamentadas en la normativa chilena vigente para comités de administración, copropietarios y residentes.
            </p>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Buscador y Categorías */}
        <div className="bg-white p-5 rounded-3xl border border-[#D4B895] shadow-xs space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-[#4A4F4F]" />
            <input
              type="text"
              placeholder="Buscar pregunta (ej: asamblea, deuda, seguro de incendio, arrendatario...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#F5F4EF] rounded-2xl border border-[#E9EBE8] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0F3D2E] focus:border-[#0F3D2E]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#0F3D2E] text-[#F5F4EF] shadow-2xs border border-[#0F3D2E]'
                    : 'bg-[#F5F4EF] hover:bg-[#E9EBE8] text-[#4A4F4F] border border-[#E9EBE8]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Acordeón */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen
                    ? 'bg-white border-[#0F3D2E] shadow-md'
                    : 'bg-white border-[#E9EBE8] hover:border-[#D4B895]'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-start justify-between gap-4 transition-colors"
                >
                  <div className="space-y-1">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#F5F4EF] text-[#0F3D2E] border border-[#D4B895]/40">
                      {faq.category}
                    </span>
                    <h4 className="text-base font-bold text-[#0F3D2E] leading-snug">
                      {faq.question}
                    </h4>
                  </div>
                  <div className="p-1 rounded-lg text-[#4A4F4F] shrink-0 mt-1">
                    {isOpen ? <ChevronUp className="w-5 h-5 text-[#0F3D2E]" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-2 border-t border-[#E9EBE8] text-sm text-[#4A4F4F] leading-relaxed space-y-3">
                    <p>{faq.answer}</p>
                    <div className="flex items-center text-xs text-[#0F3D2E] font-medium pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-[#D4B895] shrink-0" />
                      <span>Respaldo conforme a la Ley N° 21.442 de Copropiedad Inmobiliaria</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredFaqs.length === 0 && (
            <div className="p-8 text-center bg-white rounded-3xl border border-[#D4B895] text-[#4A4F4F]">
              <HelpCircle className="w-10 h-10 mx-auto mb-2 text-[#D4B895]" />
              <p className="text-sm font-semibold text-[#0F3D2E]">No encontramos preguntas que coincidan con tu búsqueda</p>
              <p className="text-xs text-[#4A4F4F] mt-1">Intenta con otros términos o escríbenos directamente para asesorarte.</p>
            </div>
          )}
        </div>

        {/* Banner inferior de consulta directa */}
        <div className="bg-white p-6 rounded-3xl border border-[#D4B895] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-base font-bold text-[#0F3D2E]">
              ¿Tu comité tiene una duda específica sobre el reglamento o gastos comunes?
            </h4>
            <p className="text-xs text-[#4A4F4F]">
              Contáctanos directamente para orientarte sin compromiso.
            </p>
          </div>
          {onGoContact && (
            <button
              onClick={onGoContact}
              className="px-5 py-2.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-[#F5F4EF] text-xs font-bold rounded-xl shrink-0 flex items-center"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-[#D4B895]" />
              Hacer una Consulta
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
