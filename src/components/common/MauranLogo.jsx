import React from 'react';

/**
 * Componente oficial de Logo e Isotipo de ARANPRO
 * Gestión Integral de Condominios y Comunidades
 *
 * Variantes:
 * - 'horizontal' (predeterminada, ideal para Navbar y encabezados)
 * - 'principal' (versión vertical completa con isotipo AP arriba, ARANPRO y GESTIÓN INTEGRAL)
 * - 'isotipo' (solo el isotipo AP en verde bosque y champán)
 * - 'negative' (versión para fondos oscuros como footer o banners verde bosque)
 */
export const AranproLogo = ({
  variant = 'horizontal',
  theme = 'light', // 'light' | 'dark'
  className = '',
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
}) => {
  const sizeClasses = {
    horizontal: {
      sm: 'h-7',
      md: 'h-9 sm:h-10',
      lg: 'h-12 sm:h-14',
      xl: 'h-16 sm:h-20'
    },
    principal: {
      sm: 'h-16',
      md: 'h-24',
      lg: 'h-32',
      xl: 'h-40'
    },
    negative: {
      sm: 'h-14',
      md: 'h-20',
      lg: 'h-24',
      xl: 'h-32'
    },
    isotipo: {
      sm: 'h-7 w-auto',
      md: 'h-9 w-auto',
      lg: 'h-12 w-auto',
      xl: 'h-16 w-auto'
    }
  };

  if (variant === 'isotipo') {
    return (
      <img
        src="/brand/ARANPRO_isotipo_trimmed.png"
        alt="Isotipo ARANPRO AP"
        className={`object-contain inline-block select-none transition-transform duration-300 hover:scale-105 ${sizeClasses.isotipo[size] || 'h-9 w-auto'} ${className}`}
        loading="eager"
      />
    );
  }

  if (theme === 'dark' || variant === 'negative') {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        <img
          src="/brand/ARANPRO_logo_para_fondo_oscuro_trimmed.png"
          alt="ARANPRO • Gestión Integral"
          className={`object-contain transition-transform duration-300 hover:scale-[1.02] ${sizeClasses.negative[size] || 'h-20'}`}
          loading="eager"
        />
      </div>
    );
  }

  if (variant === 'principal') {
    return (
      <div className={`inline-flex flex-col items-center text-center select-none ${className}`}>
        <img
          src="/brand/ARANPRO_logo_principal_transparente_trimmed.png"
          alt="ARANPRO • Gestión Integral"
          className={`object-contain transition-transform duration-300 hover:scale-[1.02] ${sizeClasses.principal[size] || 'h-24'}`}
          loading="eager"
        />
      </div>
    );
  }

  // Horizontal por defecto (Navbar, Header)
  return (
    <div className={`inline-flex items-center select-none shrink-0 ${className}`}>
      <img
        src="/brand/ARANPRO_logo_horizontal_transparente_trimmed.png"
        alt="ARANPRO • Gestión Integral"
        className={`object-contain transition-transform duration-300 hover:scale-[1.01] ${sizeClasses.horizontal[size] || 'h-9 sm:h-10'}`}
        loading="eager"
      />
    </div>
  );
};

// Exportar también como MauranLogo por compatibilidad en imports existentes
export const MauranLogo = AranproLogo;
export default AranproLogo;
