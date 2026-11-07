# Estándar Canónico de Documentos y PDFs Oficiales ARANPRO (Ley N° 21.442)

Este documento define la arquitectura y reglas canónicas obligatorias para todos los documentos imprimibles y descargables en PDF dentro del ecosistema ARANPRO.

---

## 1. Reglas de Maquetación y Dimensiones Verticales (1 Hoja Carta Exacta)

1. **Contenedor Principal de Página:**
   Toda hoja debe utilizar la clase canónica `.dossier-page`:
   ```jsx
   <div id="printable-[id-del-documento]" className="space-y-6 print-area">
     <div
       className="dossier-page page-1 bg-white p-7 md:p-8 pl-9 md:pl-11 min-h-[850px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed"
       data-pdf-style={pdfStyle}
     >
       {/* 1. SECCIÓN SUPERIOR */}
       <div className="space-y-3">
         {/* Membrete, Protocolo, Título y Cuerpo */}
       </div>

       {/* 2. SECCIÓN INFERIOR ANCLADA AL FONDO */}
       <div className="mt-auto pt-3.5 space-y-2.5">
         {/* Firmas Notariales/Patronales + Sello Oficial ARANPRO */}
         {/* Pie de Página Canónico */}
       </div>
     </div>
   </div>
   ```

2. **Garantía de Ocupación Total de la Página (Sin Espacio Blanco Residual al Fondo):**
   - En CSS de impresión (`src/utils/printDocument.js`):
     - `.dossier-page` tiene `height: 250mm !important; max-height: 252mm !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important;`.
     - Esto asegura que el bloque inferior con `mt-auto` quede **firmemente anclado al margen inferior de la hoja Carta**.
     - Elimina cualquier vacío vertical (como el 25% de espacio blanco que ocurre cuando el contenedor tiene `height: auto`).

---

## 2. Identidad y Credenciales Oficiales de ARANPRO

- **Título y Profesión:** Estrictamente **Constructor Civil • Administrador de Condominios**. Prohibido el uso de "Técnico" o "Técnico en Construcción".
- **RUT Administrador:** Estrictamente **16.012.871-2** (sanitizado contra el RUT preliminar `14.882.140-K`).
- **RUT Empresa:** **76.999.888-8** • Representante Legal ARANPRO.
- **Registro MINVU / Ley:** Mientras se procesa la solicitud ante el MINVU (plazo de 20 días hábiles), se cita formalmente: **Ley N° 21.442 de Copropiedad Inmobiliaria** (se omite el número preliminar `48.912`).
- **Beneficio Exclusivo Destacado:** **Plataforma Web y App Móvil 100% Gratuita para la Comunidad y Comité**, sin cobros de licencias ni costos de software para el condominio.

---

## 3. Estilo Visual Canónico (Alternativa 4 Predeterminada)

- **Doble Filete Lateral:** Franja izquierda compuesta por Verde Bosque (`#0F3D2E`, 2.5px) y Champán Dorado (`#D4B895`, 1.5px).
- **Marca de Agua:** Sello circular integral ARANPRO centrado en fondo con opacidad sutil (`0.036`).
- **Sello Oficial al Pie:** Sello circular institucional (`AranproOfficialSeal variant="integral"`) ubicado a la izquierda de la firma digital manuscrita con sus canales de contacto directo (WhatsApp, Correo, Web).
- **Pie de Página Canónico:**
  `ARANPRO Gestión Integral • https://aranpro.cl | Presentación Oficial para Comités de Administración • Ley N° 21.442 • Pág. 1 de 1 | La Serena, Chile`
