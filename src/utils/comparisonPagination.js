function splitColumn(value, width = 36) {
  let text = String(value || '');
  const lines = [];
  while (text) {
    let end = Math.min(width, text.length);
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

export function paginateComparison(rows, { introduction = '', conclusion = '', maxWeight = 52, maxCards = 5 } = {}) {
  const pages = [];
  const entries = [
    ...(introduction ? [{id:'comparison-introduction', title:'Presentación y objetivo', narrative:true, text:introduction}] : []),
    ...(rows || []).map((row, index) => ({...row, number:index + 1})),
    ...(conclusion ? [{id:'comparison-conclusion', title:'Conclusión y próximos pasos', narrative:true, text:conclusion}] : [])
  ];
  for (const row of entries) {
    if (row.narrative) {
      for (const [part, lines] of splitColumn(row.text, 75).entries()) {
        const weight = 4 + lines.length;
        let page = pages[pages.length - 1];
        if (!page || page.weight + weight > maxWeight || page.cards.length >= maxCards) {
          page = {cards: [], weight: 0}; pages.push(page);
        }
        page.cards.push({...row, text:lines.join(''), continuation:part > 0});
        page.weight += weight;
      }
      continue;
    }
    const left = splitColumn(row.trad), right = splitColumn(row.propuesta || row.aran);
    for (let part = 0; part < Math.max(left.length, right.length); part++) {
      const l = left[part] || [], r = right[part] || [];
      const titleLines = Math.ceil(String(row.title || '').length / 85);
      const weight = 5 + titleLines + Math.max(l.length, r.length);
      let page = pages[pages.length - 1];
      if (!page || page.weight + weight > maxWeight || page.cards.length >= maxCards) {
        page = {cards: [], weight: 0}; pages.push(page);
      }
      page.cards.push({...row, continuation:part > 0, trad:l.join(''), propuesta:r.join('')});
      page.weight += weight;
    }
  }
  return pages.length ? pages.map(p => p.cards) : [[]];
}
