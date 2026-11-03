import React, { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { Building2, Search, ArrowRight, ShieldCheck, Share2, Copy, Check, ExternalLink } from 'lucide-react';

export const CommunitiesSelector = ({ onSelectCommunity }) => {
  const { communities, companySettings } = useCommunity();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedSlug, setCopiedSlug] = useState(null);

  const filtered = communities.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyCommunityLink = (slug) => {
    const url = `${window.location.origin}${window.location.pathname}?c=${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F5F4EF] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#F5F4EF] border border-[#D4B895] rounded-full text-xs font-semibold text-[#0F3D2E]">
            <ShieldCheck className="w-4 h-4 text-[#0F3D2E]" />
            <span>Acceso Seguro e Independiente</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#0F3D2E] tracking-tight sm:text-4xl">
            Portales de Comunidades ARANPRO
          </h1>
          <p className="text-base text-[#4A4F4F] max-w-2xl mx-auto">
            Cada condominio cuenta con su propio enlace exclusivo para que los vecinos ingresen únicamente a su comunidad sin riesgo de confusión.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-[#4A4F4F]" />
          <input
            type="text"
            placeholder="Buscar por nombre o comuna (ej: Cerezos, La Serena...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-[#D4B895] shadow-xs text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0F3D2E] focus:border-[#0F3D2E]"
          />
        </div>

        {/* Grid of communities */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {filtered.map((community) => (
            <div
              key={community.id}
              className="bg-white rounded-3xl border border-[#D4B895] shadow-xs hover:shadow-md hover:border-[#0F3D2E] transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#F5F4EF] text-[#0F3D2E] border border-[#D4B895] flex items-center justify-center font-bold">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold bg-[#F5F4EF] text-[#0F3D2E] rounded-lg border border-[#D4B895]/40">
                    {community.type} • {community.totalUnits} Casas
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#0F3D2E] group-hover:text-[#0F3D2E] transition-colors">
                    {community.name}
                  </h3>
                  <p className="text-xs text-[#4A4F4F] mt-1">
                    {community.address}, {community.city}
                  </p>
                </div>

                <div className="text-xs text-[#4A4F4F] bg-[#F5F4EF] p-3 rounded-2xl space-y-1 border border-[#D4B895]/50">
                  <div className="flex justify-between">
                    <span className="text-[#4A4F4F]">Enlace directo:</span>
                    <code className="text-[#0F3D2E] font-mono font-bold">
                      ?c={community.slug}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4A4F4F]">Acceso:</span>
                    <span className="text-[#0F3D2E] font-medium">RUT + N° de Casa</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#F5F4EF]/60 border-t border-[#D4B895]/40 flex items-center justify-between gap-2">
                <button
                  onClick={() => copyCommunityLink(community.slug)}
                  className="px-3 py-2 text-xs font-medium text-[#0F3D2E] hover:bg-[#D4B895]/30 rounded-xl transition-colors flex items-center"
                  title="Copiar enlace para enviar por WhatsApp"
                >
                  {copiedSlug === community.slug ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#0F3D2E] mr-1.5" />
                      <span className="text-[#0F3D2E] font-bold">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5 text-[#0F3D2E]" />
                      <span>Copiar link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onSelectCommunity(community.slug)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0F3D2E] hover:bg-[#0A291F] rounded-xl transition-all shadow-xs flex items-center border border-[#0F3D2E]"
                >
                  <span>Ingresar</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-[#D4B895]" />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-[#4A4F4F] bg-white rounded-3xl border border-[#D4B895]">
              <Building2 className="w-12 h-12 mx-auto mb-2 text-[#D4B895]" />
              <p className="text-base font-semibold text-[#0F3D2E]">No se encontraron comunidades</p>
              <p className="text-xs text-[#4A4F4F] mt-1">Verifica el nombre o comuna en el buscador.</p>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="p-6 bg-gradient-to-r from-[#0A291F] via-[#0F3D2E] to-[#0F3D2E] text-white rounded-3xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#0F3D2E]">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-sm text-[#D4B895]">
              ¿Administras más comunidades o comienzas una nueva el 01 de Diciembre?
            </h4>
            <p className="text-xs text-[#F5F4EF]/90">
              Puedes dar de alta nuevas comunidades con su propio enlace en el Panel de Administrador en solo 1 clic.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
