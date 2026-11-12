import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

// Código QR auténtico pre-generado por defecto para https://aranpro.cl/?demo=comunidad
// Garantiza renderizado instantáneo en frame 0 sin parpadeos ni demoras en PDF
const DEFAULT_QR_DATA_URL = 'data:image/png;base64,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';

export const AranproQrCode = ({ 
  value = 'https://aranpro.cl/?demo=comunidad', 
  size = 120,
  darkColor = '#0F3D2E',
  lightColor = '#FFFFFF',
  className = '',
  alt = 'Código QR Demo ARANPRO 100% Escaneable'
}) => {
  const [dataUrl, setDataUrl] = useState(() => {
    // Si es la URL canónica por defecto con colores estándar, usar el PNG inmediato
    if (value === 'https://aranpro.cl/?demo=comunidad' && darkColor === '#0F3D2E' && lightColor === '#FFFFFF') {
      return DEFAULT_QR_DATA_URL;
    }
    return '';
  });
  const [resolvedValue, setResolvedValue] = useState(() => value === 'https://aranpro.cl/?demo=comunidad' && darkColor === '#0F3D2E' && lightColor === '#FFFFFF' ? value : '');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(value, {
      width: Math.max(size * 2, 240), // 2x para nitidez retina e impresión
      margin: 1,
      color: {
        dark: darkColor,
        light: lightColor
      }
    })
      .then(url => {
        if (isMounted) { setDataUrl(url); setResolvedValue(value); }
      })
      .catch(err => {
        console.error('Error generando código QR:', err);
      });

    return () => { isMounted = false; };
  }, [value, size, darkColor, lightColor]);

  const displayUrl = dataUrl || DEFAULT_QR_DATA_URL;

  return (
    <img 
      src={displayUrl} 
      alt={alt} 
      data-qr-value={value}
      data-qr-ready={Boolean(dataUrl) && resolvedValue === value ? 'true' : 'false'}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`object-contain block mx-auto ${className}`}
      loading="eager"
    />
  );
};
