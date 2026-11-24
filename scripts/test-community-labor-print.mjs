// node scripts/test-community-labor-print.mjs [módulo Playwright] [ejecutable Chromium]
import assert from 'node:assert/strict';
import {createServer} from 'vite';

const {chromium} = await import(process.argv[2] || 'playwright');
const server = await createServer({
  server: {port:0, host:'127.0.0.1', hmr:false},
  plugins: [{name:'labor-print-fixture', configureServer(vite) {
    vite.middlewares.use('/labor-print-test', (_, response) => {
      response.setHeader('Content-Type','text/html; charset=utf-8');
      response.end('<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"></head><body><div id="test-document"></div></body></html>');
    });
  }}]
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({headless:true, executablePath:process.argv[3] || undefined});
  for (const [style, kind] of [['alt4','table'], ['alt1','paragraph'], ['alt2','short']]) {
    const page = await browser.newPage({viewport:{width:390,height:840}});
    await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/labor-print-test');
    const source = await page.evaluate(async ({style,kind}) => {
      await import('/src/index.css');
      const {printCommunityLabor} = await import('/src/utils/communityLaborPrint.js');
      const paper = document.createElement('article');
      paper.innerHTML = '<header data-labor-header data-labor-title="Anexo" data-labor-community="Comunidad de prueba">Anexo</header><h2>Contenido</h2><div>Comunidad <strong>de prueba</strong>.</div><div class="labor-contract-end">Firmas</div><div hidden data-footer-template><footer data-labor-footer>Página <span data-page-number></span></footer></div>';
      document.getElementById('test-document').append(paper);
      const text = Array.from({length:kind==='short'?3:2100}, (_,i) => 't'+i).join(' ');
      const block = document.createElement(kind==='table'?'table':'p');
      if (kind==='table') {
        block.createTHead().insertRow().insertCell().textContent='Observaciones';
        block.createTBody().insertRow().insertCell().textContent=text;
      } else {
        block.textContent=text;
      }
      paper.querySelector('.labor-contract-end').before(block);
      window.__aranproPdfStyle=style;
      printCommunityLabor('test-document','Prueba');
      return text;
    },{style,kind});
    const frame = page.frameLocator('#aranpro-print-iframe');
    await frame.locator('.labor-pages[data-paginated]').waitFor();
    const pages = await frame.locator('.labor-sheet').evaluateAll((sheets,kind) => sheets.map(sheet => {
      const body=sheet.querySelector('.labor-sheet-body');
      const rect=node=>node.getBoundingClientRect();
      const footer=sheet.querySelector('[data-labor-footer]');
      const end=sheet.querySelector('.labor-contract-end');
      const css=getComputedStyle(sheet);
      return {
        border:css.borderLeftStyle, gold:css.backgroundImage!=='none',
        hasSignatures:!!end, fits:body.childElementCount>0 && rect(body.lastElementChild).bottom<=rect(body).bottom+1,
        footerGap:rect(sheet).bottom-rect(footer).bottom, closingGap:end?rect(footer).top-rect(end).bottom:null,
        text:[...body.querySelectorAll(kind==='table'?'tbody td':'p')].map(n=>n.textContent).join(''),
        context:body.textContent.includes('Comunidad de prueba.')
      };
    }),kind);
    assert(kind==='short'?pages.length===1:pages.length>1);
    assert(pages[0].context);
    assert.equal(pages.map(p=>p.text).join(''),source);
    for (const [i,p] of pages.entries()) {
      assert(p.fits && p.footerGap>=0 && p.footerGap<15);
      assert.equal(p.hasSignatures,i===pages.length-1);
      if (p.hasSignatures) assert(p.closingGap>=0 && p.closingGap<=12);
      assert.equal(p.border,style==='alt2'?'none':'solid');
      assert.equal(p.gold,style==='alt4');
    }
    console.log(style,kind,pages.length+' hojas verificadas');
    await page.close();
  }
} finally {
  await browser?.close();
  await server.close();
}

