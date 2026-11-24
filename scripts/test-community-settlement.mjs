import assert from 'node:assert/strict';
import { settlementFigures } from '../src/utils/communitySettlement.js';

const form = { entry:'2024-03-01',end:'2026-11-07',cause:'161_1',wage:650000,days:7,vacDays:0,vacProof:'Registro',iasBase:680000,uf:40000,paymentDate:'2026-11-14' };
const original = settlementFigures(form);
assert.deepEqual(original.issues,[]);
assert.equal(original.months,32);
assert.equal(original.tail,6);
assert.equal(original.units,3);
assert.equal(original.rows[2][2],2040000);
assert.equal(settlementFigures({...form,end:'2026-09-01',days:1}).units,2);
assert.equal(settlementFigures({...form,end:'2026-09-02',days:2}).units,3);
assert.equal(settlementFigures({...form,entry:'2026-02-01'}).units,0);
assert.equal(settlementFigures({...form,afc:50000}).deductions,0);
assert.equal(settlementFigures({...form,afc:50000,afcProof:'Saldo aporte empleador'}).deductions,50000);
assert.equal(settlementFigures({...form,cause:'159_2',afc:50000,afcProof:'Saldo'}).deductions,0);
assert.ok(settlementFigures({...form,days:15}).issues.length);
assert.equal(settlementFigures({...form,end:'2026-11-10',vacDays:3.75,vacBase:600000}).calendarDays,5.75);
assert.equal(settlementFigures({...form,end:'2026-11-10',vacDays:3.75,vacBase:600000,holidays:'2026-11-16'}).calendarDays,6.75);
assert.equal(settlementFigures({...form,end:'2026-11-10',holidays:'2026-11-16'}).deadline,'2026-11-23');
assert.equal(settlementFigures({...form,iasBase:5000000}).rows[3][2],3600000);
const withPayments=settlementFigures({...form,lines:[{type:'haber',amount:10000,label:'Bono',proof:'Liquidación'},{type:'descuento',amount:8000,label:'Previsión',proof:'Liquidación'},{type:'abono',amount:30000,label:'Abono del período',proof:'Transferencia'}]});
assert.equal(withPayments.net,original.total+10000-8000-30000);
console.log('Finiquito de comunidades: antigüedad, topes, feriado fraccionario, plazo, causales, descuentos y abonos verificados.');

