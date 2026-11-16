// Referencia comercial ARANPRO, no un arancel legal. Los tramos se unen sin saltos.
export function suggestedFeeFloor(units) {
  const count = Math.max(0, Number(units) || 0);
  if (count <= 20) return 10;
  if (count <= 30) return Math.round((10 + (count - 20) * 0.2) * 100) / 100;
  if (count <= 50) return 12;
  if (count <= 65) return Math.round((12 + (count - 50) * 0.2) * 100) / 100;
  return 15;
}

// Mantiene las tasas existentes y evita que la tarifa base baje al crecer
// de 50 a 51, de 120 a 121 o de 250 a 251 unidades.
export function continuousTierBase(units, rate) {
  const count = Math.max(0, Number(units) || 0);
  const direct = count * rate;
  const previous = count > 250 ? 250 * 0.18 : count > 120 ? 120 * 0.22 : count > 50 ? 50 * 0.30 : 0;
  return { value: Math.max(direct, previous), adjusted: previous > direct };
}
