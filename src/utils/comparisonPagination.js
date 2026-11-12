function splitColumn(value) {
  let text = String(value || '');
  const lines = [];
  while (text) {
    let end = Math.min(36, text.length);
    const newline = text.indexOf('\n');
    if (newline >= 0 && newline < end) end = newline + 1;
    else if (end < text.length) {
      const space = text.lastIndexOf(' ', end - 1);
      if (space > 12) end = space + 1;
    }
    lines.push(text.slice(0, end));
    text = text.slice(end);
  }
  if (!lines.length) lines.push('');
  const chunks = [];
  for (let i = 0; i < lines.length; i += 12) chunks.push(lines.slice(i, i + 12));
  return chunks;
}

export function paginateComparison(rows) {
  const pages = [];
  for (const [index, row] of (rows || []).entries()) {
    const left = splitColumn(row.trad), right = splitColumn(row.propuesta || row.aran);
    for (let part = 0; part < Math.max(left.length, right.length); part++) {
      const l = left[part] || [], r = right[part] || [];
      const titleLines = Math.ceil(String(row.title || '').length / 85);
      const weight = 5 + titleLines + Math.max(l.length, r.length);
      let page = pages[pages.length - 1];
      if (!page || page.weight + weight > 52 || page.cards.length >= 5) {
        page = {cards: [], weight: 0}; pages.push(page);
      }
      page.cards.push({...row, number:index + 1, continuation:part > 0, trad:l.join(''), propuesta:r.join('')});
      page.weight += weight;
    }
  }
  return pages.length ? pages.map(p => p.cards) : [[]];
}
