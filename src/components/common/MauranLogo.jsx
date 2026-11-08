import React, { useState, useEffect } from 'react';

/**
 * Hook global sincronizado para gestionar las 3 plantillas visuales de PDF ARANPRO.
 * Por defecto utiliza 'alt4' (Alternativa 4: Doble Filete Verde/Dorado + Logo Vertical Principal + Sello Circular Dorado + Marca de Agua).
 */
export const useAranproPdfStyle = (initialDefault = 'alt4') => {
  const [pdfStyle, setPdfStyleState] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.__aranproPdfStyle || localStorage.getItem('aranpro_pdf_style') || initialDefault;
    }
    return initialDefault;
  });

  useEffect(() => {
    const handler = (e) => {
      if (e?.detail?.style) {
        setPdfStyleState(e.detail.style);
      }
    };
    window.addEventListener('aranpro-pdf-style-change', handler);
    return () => window.removeEventListener('aranpro-pdf-style-change', handler);
  }, []);

  const setPdfStyle = (newStyle) => {
    setPdfStyleState(newStyle);
    if (typeof window !== 'undefined') {
      window.__aranproPdfStyle = newStyle;
      try {
        localStorage.setItem('aranpro_pdf_style', newStyle);
      } catch {
        // Ignorar errores de almacenamiento
      }
      window.dispatchEvent(new CustomEvent('aranpro-pdf-style-change', { detail: { style: newStyle } }));
    }
  };

  return [pdfStyle, setPdfStyle];
};

/**
 * Selector visual de las 3 plantillas oficiales para cualquier modal de vista previa PDF (.no-print)
 */
export const AranproPdfStyleSelector = ({ value, onChange, label = 'Diseño Visual PDF:', compact = false }) => {
  const [internalStyle, setInternalStyle] = useAranproPdfStyle();
  const active = value || internalStyle || 'alt4';
  const handleSelect = (styleId) => {
    setInternalStyle(styleId);
    if (onChange) onChange(styleId);
  };

  const options = [
    {
      id: 'alt4',
      name: compact ? '1. Doble Filete + Sello (Oficial)' : '1. Alt 4: Doble Filete + Logo Vertical + Sello Dorado',
      badge: 'Estándar Marca'
    },
    {
      id: 'alt1',
      name: compact ? '2. Línea Verde Izquierda' : '2. Franja Vertical Verde Ejecutiva',
      badge: null
    },
    {
      id: 'alt2',
      name: compact ? '3. Editorial Limpio' : '3. Editorial Puro (Sin Líneas Laterales)',
      badge: null
    }
  ];

  return (
    <div className="no-print flex flex-wrap items-center gap-1.5 bg-slate-100/90 px-2.5 py-1.5 rounded-xl border border-slate-200 text-[11px]">
      <span className="font-extrabold text-[#0F3D2E] uppercase tracking-wider text-[10px] mr-1">
        {label}
      </span>
      {options.map((opt) => {
        const isSelected = active === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => handleSelect(opt.id)}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              isSelected
                ? 'bg-[#0F3D2E] text-[#D4B895] shadow-xs border border-[#0F3D2E]'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
            }`}
          >
            <span>{opt.name}</span>
          </button>
        );
      })}
    </div>
  );
};

/**
 * Timbre Circular Dorado Oficial de ARANPRO para pies de firma y certificaciones
 */
export const AranproOfficialSeal = ({
  variant = 'integral',
  size = 'md',
  showCaption = true,
  showText = true,
  companyRut = '',
  rnacNumber = '',
  className = ''
}) => {
  const sizeMap = {
    sm: 'h-11 w-11',
    md: 'h-14 w-14',
    lg: 'h-16 w-16'
  };
  const imgSrc =
    variant === 'ap'
      ? '/brand/ARANPRO_sello_circular_ap_transparente.png'
      : '/brand/ARANPRO_sello_circular_integral_transparente.png';

  const cleanCompanyRut = companyRut && !String(companyRut).includes('76.999.888') ? String(companyRut).trim() : '';

  const cleanRnacText = () => {
    if (!rnacNumber || rnacNumber === '48.912') {
      return 'Ley N° 21.442 de Copropiedad Inmobiliaria';
    }
    const lower = String(rnacNumber).toLowerCase();
    if (lower.includes('trámite') || lower.includes('tramite') || lower.includes('proceso')) {
      return `Registro MINVU: En trámite • Ley 21.442`;
    }
    return `RNAC MINVU N° ${rnacNumber} • Ley N° 21.442`;
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <img
        src={imgSrc}
        alt="Sello Oficial ARANPRO"
        className={`${sizeMap[size] || 'h-14 w-14'} object-contain shrink-0`}
        style={{
          height: size === 'sm' ? '44px' : size === 'lg' ? '64px' : '54px',
          width: size === 'sm' ? '44px' : size === 'lg' ? '64px' : '54px',
          maxHeight: '64px',
          maxWidth: '64px',
          objectFit: 'contain'
        }}
        loading="eager"
      />
      {(showCaption && showText !== false) && (
        <div className="text-left leading-tight space-y-0.5">
          <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#0F3D2E]">
            Sello Oficial de Administración
          </div>
          {cleanCompanyRut && (
            <div className="text-[9px] font-mono font-semibold text-slate-600">
              RUT Empresa: {cleanCompanyRut}
            </div>
          )}
          <div className="text-[8.5px] font-bold text-slate-500">
            {cleanRnacText()}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Componente oficial de Logo e Isotipo de ARANPRO
 * Gestión Integral de Condominios y Comunidades
 *
 * Variantes:
 * - 'principal' (predeterminada para documentos/PDFs: versión vertical completa con isotipo AP arriba, ARANPRO y GESTIÓN INTEGRAL)
 * - 'horizontal' (ideal para barras de navegación)
 * - 'isotipo' (solo el isotipo AP en verde bosque y champán)
 * - 'sello' / 'sello-integral' / 'sello-ap' (emblema circular dorado oficial)
 * - 'negative' (versión dorada metálica para fondos oscuros #0F3D2E)
 */
export const AranproLogo = ({
  variant = 'principal',
  theme = 'light', // 'light' | 'dark'
  className = '',
  size, // 'sm' | 'md' | 'lg' | 'xl'
  style = {},
}) => {
  const sizeClasses = {
    horizontal: {
      sm: 'h-7',
      md: 'h-9 sm:h-10',
      lg: 'h-12 sm:h-14',
      xl: 'h-16 sm:h-20'
    },
    principal: {
      sm: 'h-11',
      md: 'h-12',
      lg: 'h-20',
      xl: 'h-28'
    },
    negative: {
      sm: 'h-12',
      md: 'h-16',
      lg: 'h-24',
      xl: 'h-32'
    },
    isotipo: {
      sm: 'h-7 w-auto',
      md: 'h-9 w-auto',
      lg: 'h-12 w-auto',
      xl: 'h-16 w-auto'
    },
    sello: {
      sm: 'h-11 w-11',
      md: 'h-14 w-14',
      lg: 'h-16 w-16',
      xl: 'h-20 w-20'
    }
  };

  // Determinar altura explícita en px para blindar encabezados PDF e iframes de impresión
  const resolveInlineHeight = () => {
    if (style?.height) return style.height;
    if (className.includes('h-6')) return '24px';
    if (className.includes('h-7')) return '28px';
    if (className.includes('h-8')) return '32px';
    if (className.includes('h-9')) return '36px';
    if (className.includes('h-10')) return '40px';
    if (className.includes('h-11')) return '44px';
    if (className.includes('h-12')) return '48px';
    if (className.includes('h-13')) return '50px';
    if (className.includes('h-14')) return '54px';
    if (className.includes('h-16')) return '64px';
    if (size === 'sm') return variant === 'horizontal' ? '28px' : '44px';
    if (size === 'md') return variant === 'horizontal' ? '38px' : '48px';
    if (size === 'lg') return variant === 'horizontal' ? '52px' : '80px';
    if (size === 'xl') return variant === 'horizontal' ? '72px' : '112px';
    return variant === 'horizontal' ? '36px' : '48px';
  };

  const inlineHeight = resolveInlineHeight();

  if (variant === 'sello' || variant === 'sello-integral') {
    return (
      <img
        src="/brand/ARANPRO_sello_circular_integral_transparente.png"
        alt="Sello Oficial ARANPRO Gestión Integral"
        className={`object-contain inline-block select-none shrink-0 ${sizeClasses.sello[size] || 'h-12 w-12'} ${className}`}
        style={{ height: inlineHeight, width: inlineHeight, maxHeight: inlineHeight, maxWidth: inlineHeight, objectFit: 'contain', ...style }}
        loading="eager"
      />
    );
  }

  if (variant === 'sello-ap') {
    return (
      <img
        src="/brand/ARANPRO_sello_circular_ap_transparente.png"
        alt="Sello Oficial ARANPRO"
        className={`object-contain inline-block select-none shrink-0 ${sizeClasses.sello[size] || 'h-12 w-12'} ${className}`}
        style={{ height: inlineHeight, width: inlineHeight, maxHeight: inlineHeight, maxWidth: inlineHeight, objectFit: 'contain', ...style }}
        loading="eager"
      />
    );
  }

  if (variant === 'isotipo') {
    return (
      <img
        src="/brand/ARANPRO_isotipo_trimmed.png"
        alt="Isotipo ARANPRO AP"
        className={`object-contain inline-block select-none transition-transform duration-300 hover:scale-105 ${sizeClasses.isotipo[size] || 'h-9 w-auto'} ${className}`}
        style={{ height: inlineHeight, maxHeight: inlineHeight, width: 'auto', objectFit: 'contain', ...style }}
        loading="eager"
      />
    );
  }

  if (theme === 'dark' || variant === 'negative') {
    return (
      <div className={`inline-flex items-center select-none shrink-0 ${className}`}>
        <img
          src="/brand/ARANPRO_logo_para_fondo_oscuro_trimmed.png"
          alt="ARANPRO • Gestión Integral"
          className={`object-contain transition-transform duration-300 hover:scale-[1.02] ${sizeClasses.negative[size] || 'h-16 w-auto'}`}
          style={{ height: inlineHeight, maxHeight: inlineHeight, width: 'auto', objectFit: 'contain', ...style }}
          loading="eager"
        />
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className={`inline-flex items-center select-none shrink-0 ${className}`}>
        <img
          src="/brand/ARANPRO_logo_horizontal_transparente_trimmed.png"
          alt="ARANPRO • Gestión Integral"
          className={`object-contain transition-transform duration-300 hover:scale-[1.01] ${sizeClasses.horizontal[size] || 'h-9 sm:h-10'}`}
          style={{ height: inlineHeight, maxHeight: inlineHeight, width: 'auto', objectFit: 'contain', ...style }}
          loading="eager"
        />
      </div>
    );
  }

  // Logo Vertical Principal por defecto para todos los PDFs y membretes oficiales
  const sanitizedClass = className ? className.replace(/\bh-13\b/g, 'h-12') : '';
  const explicitImgSize = size ? (sizeClasses.principal[size] || 'h-12 w-auto') : (sanitizedClass || 'h-12 w-auto');
  return (
    <div className="inline-flex flex-col items-center text-center select-none shrink-0">
      <img
        src="/brand/ARANPRO_logo_principal_transparente_trimmed.png"
        alt="ARANPRO • Gestión Integral"
        className={`object-contain transition-transform duration-300 ${explicitImgSize}`}
        style={{ height: inlineHeight, maxHeight: inlineHeight, width: 'auto', objectFit: 'contain', ...style }}
        loading="eager"
      />
    </div>
  );
};

// Exportar también como MauranLogo por compatibilidad en imports existentes
export const MauranLogo = AranproLogo;
export default AranproLogo;
