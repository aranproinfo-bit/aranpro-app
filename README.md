# ARANPRO • Gestión Inmobiliaria Integral (aranpro.cl)

Plataforma integral web para administración de condominios, copropietarios y gobernanza comunitaria conforme a la **Ley N° 21.442 de Copropiedad Inmobiliaria** de Chile.

---

## 🏛️ Características Principales

- **Panel de Administración ARANPRO:**
  - Control de Unidades, Copropietarios y Arrendatarios con cálculo automático de alícuotas y deudas.
  - Conciliación bancaria rápida y auto-match predictivo de cartolas.
  - Nómina de Gastos & Respaldos Contables (Art. 6°, 13°, 14° y 18° de la Ley 21.442).
  - Presupuesto Anual y Planificación de Cuota Fija nivelada.
  - Bitácora de Mantenciones Preventivas & Certificaciones Técnicas (Art. 40° Ley 21.442, DS 44 y DS 66 SEC).
  - Calculadora & Simulador de Quórums Legales de Asambleas Ordinarias y Extraordinarias (Art. 15°, 16° y 17°).
  - Urna Digital para Consultas por Escrito y Registro de Poderes de Representación.
  - Libro Oficial de Actas Foliadas y Protocolizadas (Art. 20°).
  - Helpdesk Comunitario: Libro Digital de Reclamos y Sugerencias con respuestas tipo y emisión de cartas de advertencia preventivas.
- **Portal Vecinal del Residente:**
  - Visualización transparente de gastos comunes, colillas descargables y respaldos en PDF.
  - Historial de pagos, estado de cuenta y reporte de transferencias.
  - Mural de comunicados oficiales y biblioteca documental del condominio.

---

## 🚀 Despliegue en Cloudflare Pages

### Parámetros de Compilación:
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node version:** `>= 18.0.0`
- **Routing SPA:** Reglas integradas en `public/_redirects` (`/* /index.html 200`).

---

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

---

© 2026 ARANPRO • Gestión Inmobiliaria Integral. Todos los derechos reservados.
