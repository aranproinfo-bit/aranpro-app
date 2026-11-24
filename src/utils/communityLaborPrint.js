import {printDocumentDirectly} from './printDocument';

const sheetCss = `
@page {size: letter portrait; margin: 4mm 6mm}
html, body {min-height:0!important; height:auto!important; display:block!important}
.print-wrapper {padding:0!important; border:0!important; box-shadow:none!important}
.aranpro-print-watermark {display:none!important}
.community-paper.labor-pages {width:203.9mm;max-width:none!important;margin:0!important;padding:0!important;background:white;color:#172531;font:10.5pt/1.42 Arial,sans-serif;overflow-wrap:anywhere}
.labor-sheet {display:flex;flex-direction:column;width:100%;height:270mm;box-sizing:border-box;
  padding-top:4mm!important;padding-bottom:3mm!important;
  margin:0!important;background-color:white;break-after:page;break-inside:avoid}
.labor-sheet:last-child {break-after:auto}
.labor-sheet > * {flex:none}
.labor-sheet [data-labor-header] {display:flex!important;flex-direction:row;align-items:flex-start}
.labor-sheet img.payroll-brand-logo {width:22mm!important;max-height:13mm!important;height:auto!important;object-fit:contain}
.labor-running-title {display:flex;justify-content:space-between;align-items:baseline;gap:12px;
  font:600 9px/1.3 Arial,sans-serif;color:#52665f;border-bottom:1px solid #cbd5e1;padding-bottom:5px;margin-bottom:9px}
.labor-sheet-body {display:flow-root;min-height:0;flex:1 1 0}
.labor-sheet-body p {margin:0 0 5px}
.labor-sheet-body h2 {color:#0f3d2e;font-size:15pt;line-height:1.22;font-weight:700;margin:9px 0 7px}
.labor-sheet-body h3,.labor-sheet-body h4 {color:#0f3d2e;font-size:11pt;font-weight:700;margin:10px 0 3px}
.labor-sheet-body table {table-layout:fixed;margin:5px 0;width:100%;border-collapse:collapse}
.labor-sheet-body td,.labor-sheet-body th {overflow-wrap:anywhere}
.labor-sheet .labor-document-identity {max-width:43%}
.labor-sheet .labor-contract-end {margin-top:0!important;padding-top:7mm;font-family:system-ui,sans-serif}
.labor-sheet .labor-signers {gap:32px!important;grid-template-columns:repeat(2,minmax(0,1fr))!important}
.labor-sheet .labor-signature-image {min-width:0;height:min(56px,calc(42px * var(--sign-scale)))!important;
  width:min(31%,calc(88px * var(--sign-scale)))!important;max-width:31%!important;object-fit:contain;object-position:bottom;transform:none!important}
.labor-sheet .labor-signer-details {padding-top:6px!important}
.labor-sheet .labor-signer-details > strong {font-size:12px!important;line-height:1.25;font-weight:900;color:#0f172a}
.labor-sheet .labor-signer-details > div:first-of-type {font:9.5px/1.55 ui-monospace,Consolas,monospace!important}
.labor-sheet .labor-signer-details > div:last-child {text-transform:uppercase}

.labor-sheet [data-labor-footer] {flex:none;margin:8px 0 0!important;align-items:baseline;gap:8px;line-height:1.3}
.labor-sheet [data-labor-footer] > div:nth-child(2) {text-align:center}
.labor-sheet [data-labor-footer] > div:last-child {text-align:right}
`;

// Divide texto conservando énfasis, saltos y espacios. Cada fragmento pertenece a una sola hoja.
function textParts(element, offset) {
  const doc=element.ownerDocument;
  const walk=doc.createTreeWalker(element,4);
  let node=walk.nextNode(), left=offset;
  while(node && left>node.length){left-=node.length;node=walk.nextNode();}
  const before=element.cloneNode(false), after=element.cloneNode(false);
  if(!node){before.append(...Array.from(element.childNodes,n=>n.cloneNode(true)));return [before,after];}
  const range=doc.createRange();
  range.selectNodeContents(element);range.setEnd(node,left);before.append(range.cloneContents());
  range.selectNodeContents(element);range.setStart(node,left);after.append(range.cloneContents());
  return [before,after];
}

function largestPrefix(length, fits) {
  let low=0,high=length;
  while(low<high){
    const mid=Math.ceil((low+high)/2);
    if(fits(mid)) low=mid; else high=mid-1;
  }
  return low;
}

function pageBlocks(container) {
  return Array.from(container.children).flatMap(node=>{
    if(node.matches('[data-labor-header],.labor-contract-end,[data-footer-template],.labor-contract-stripe,.rail')) return [];
    const structural = node.matches('section,div') && node.firstElementChild &&
      Array.from(node.childNodes).every(child => child.nodeType === 3
        ? !child.textContent.trim()
        : child.nodeType === 1 && child.matches('div,section,p,h2,h3,h4,table,ul,ol'));
    if (structural) return pageBlocks(node);
    return [node];
  });
}

function paginate(doc) {
  const wrapper=doc.querySelector('.print-wrapper');
  const source=wrapper.firstElementChild;
  const masthead=source.querySelector('[data-labor-header]');
  const footer=source.querySelector('[data-labor-footer]');
  const signatures=source.querySelector('.labor-contract-end');
  const blocks=pageBlocks(source);
  const output=doc.createElement('article');
  output.className='community-paper labor-pages';
  wrapper.replaceChildren(output);
  let body, sheet;
  const sheets=[];
  function newSheet() {
    const moveSignatures = sheet && signatures.parentElement === sheet;
    sheet=doc.createElement('section');sheet.className='labor-sheet';
    const first=!sheets.length;
    const heading=first?masthead.cloneNode(true):doc.createElement('div');
    if(!first){
      heading.className='labor-running-title';
      for(const key of ['laborTitle','laborCommunity']){
        const span=doc.createElement('span');span.textContent=masthead.dataset[key];heading.append(span);
      }
    }
    body=doc.createElement('div');body.className='labor-sheet-body';
    const foot=footer.cloneNode(true);
    foot.querySelector('[data-page-number]').textContent='888 de 888';
    sheet.append(heading,body,foot);
    if (moveSignatures) sheet.insertBefore(signatures,foot);
    output.append(sheet);sheets.push(sheet);
  }
  function fits() {
    return !body.lastElementChild || body.lastElementChild.getBoundingClientRect().bottom<=body.getBoundingClientRect().bottom-2;
  }
  const heading=node=>node?.matches('h2,h3,h4');
  function advance() {
    const carry=[];
    while(heading(body.lastElementChild) && body.childElementCount>1){
      carry.unshift(body.lastElementChild);body.lastElementChild.remove();
    }
    newSheet();body.append(...carry);
  }
  function placeText(node) {
    body.append(node);
    if(fits()) return;
    node.remove();
    if(Array.from(body.children).some(child => !heading(child))) {
      advance();body.append(node);
      if(fits()) return;
      node.remove();
    }
    // Los párrafos libres pueden ser más altos que una hoja, incluso sin espacios.
    let rest=node;
    while(rest.textContent.length){
      let size=largestPrefix(rest.textContent.length,n=>{
        const [part]=textParts(rest,n);body.append(part);const ok=fits();part.remove();return ok;
      });
      if(!size) {if(body.childElementCount){newSheet();continue;}throw new Error('El bloque de texto excede el área de impresión.');}
      if(size<rest.textContent.length){
        const word=rest.textContent.slice(0,size).search(/\s+\S*$/);
        if(word>size/2) size=word+1;
      }
      const [part,next]=textParts(rest,size);body.append(part);rest=next;
      if(rest.textContent.length)newSheet();
    }
  }

  function placeTable(table) {
    const rows=Array.from(table.tBodies).flatMap(group=>Array.from(group.rows));
    let group;
    function startTable() {
      const part=table.cloneNode(false);if(table.tHead)part.append(table.tHead.cloneNode(true));
      group=doc.createElement('tbody');part.append(group);body.append(part);
    }
    function nextTable() {
      if(!group.rows.length)group.parentElement.remove();
      advance();startTable();
    }
    startTable();
    for(let row of rows) {
      group.append(row);
      if(fits())continue;
      row.remove();
      if (group.rows.length || Array.from(body.children).some(child => child !== group.parentElement && !heading(child))) nextTable();
      group.append(row);
      if(fits())continue;
      row.remove();
      // Una celda con observaciones extensas también puede ocupar varias hojas.
      while(row){
        const cells=Array.from(row.cells),max=Math.max(...cells.map(cell=>cell.textContent.length));
        const fragment=(length)=>{
          const first=row.cloneNode(false),last=row.cloneNode(false);
          for(const cell of cells){
            const [a,b]=textParts(cell,Math.min(length,cell.textContent.length));
            first.append(a);last.append(b);
          }
          return [first,last];
        };
        const size=largestPrefix(max,n=>{
          const [part]=fragment(n);group.append(part);const ok=fits();part.remove();return ok;
        });
        if(!size)throw new Error('Una fila excede el área de impresión.');
        const [part,remaining]=fragment(size);group.append(part);
        row=size===max?null:remaining;
        if(row)nextTable();
      }
    }
  }
  const placeBlock = block => block.tagName === 'TABLE' ? placeTable(block) : placeText(block);
  newSheet();
  blocks.forEach(placeBlock);
  sheet.insertBefore(signatures,sheet.lastElementChild);
  if (!fits()) {
    // Distribuye la última hoja con la altura real de las firmas reservada.
    // Una continuación se lleva el cierre completo.
    const tail = Array.from(body.children);
    body.replaceChildren();
    tail.forEach(placeBlock);
  }
  sheets.forEach((page,i)=>{page.querySelector('[data-page-number]').textContent=(i+1)+' de '+sheets.length;});
  output.dataset.paginated='true';
}

export function printCommunityLabor(id,name) {
  printDocumentDirectly(id,name,{pageSize:'letter portrait',margin:'4mm 6mm',useBundledStyles:true,
    sheetSelector:'.labor-sheet',prepareDocument:paginate,extraStyles:sheetCss});
}

