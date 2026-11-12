// Distribuye observaciones sin descartar caracteres. El límite conservador deja
// espacio para cabecera, datos del inspector y pie institucional en carta.
export function paginateInspection(items) {
  const cards = [];
  for (const item of items || []) {
    const notes = String(item.notes || '');
    const lines = [];
    let remaining = notes;
    while (remaining) {
      let end = Math.min(75, remaining.length);
      const newline = remaining.indexOf('\n');
      if (newline >= 0 && newline < end) end = newline + 1;
      else if (end < remaining.length) {
        const space = remaining.lastIndexOf(' ', end - 1);
        if (space > 25) end = space + 1;
      }
      lines.push(remaining.slice(0, end));
      remaining = remaining.slice(end);
    }
    if (!lines.length) lines.push('');
    for (let at = 0; at < lines.length; at += 14) {
      const slice = lines.slice(at, at + 14);
      cards.push({ ...item, notes: slice.join(''), continuation: at > 0, weight: 4 + slice.length });
    }
  }
  const pages = [];
  for (const card of cards) {
    let page = pages[pages.length - 1];
    if (!page || page.weight + card.weight > 42 || page.cards.length >= 5) {
      page = { cards: [], weight: 0 };
      pages.push(page);
    }
    page.cards.push(card);
    page.weight += card.weight;
  }
  return pages.length ? pages.map(p => p.cards) : [[]];
}
