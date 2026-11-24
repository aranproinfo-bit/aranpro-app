import assert from 'node:assert/strict';
import { validateOvertimeDraft, monthlyOvertimeReference } from '../src/utils/overtimeAgreementValidation.js';

const valid = { employerName:'Comunidad ficticia', employerRut:'1-9', employerAddress:'Dirección de prueba', representativeName:'Representante', representativeRut:'2-7', workerName:'Trabajador de prueba', workerRut:'3-5', city:'Comuna', schedule:'Lunes a viernes', need:'Cobertura parcial por ausencia temporal durante noviembre', tasks:'Entrega de turnos y control de accesos', attendanceSystem:'Registro de asistencia', signedDate:'2026-11-01', startDate:'2026-11-01', endDate:'2027-01-31', weeklyHours:42, monthlySalaryBase:600000 };
assert.deepEqual(validateOvertimeDraft(valid), []);
assert.equal(monthlyOvertimeReference(600000, 42), 5000);
assert.equal(monthlyOvertimeReference(600000, 40), 5250);
assert.equal(monthlyOvertimeReference(600000, 0), null);
assert.ok(validateOvertimeDraft({...valid, endDate:'2027-02-01'}).some(x=>x.includes('tres meses')));
assert.ok(validateOvertimeDraft({...valid, signedDate:'2026-11-06'}).some(x=>x.includes('anterior a su firma')));
assert.ok(validateOvertimeDraft({...valid, need:'necesidades operacionales'}).some(x=>x.includes('hechos concretos')));
assert.ok(validateOvertimeDraft({...valid, endDate:'2026-02-30'}).some(x=>x.includes('válida')));
assert.ok(validateOvertimeDraft({...valid, specialSchedule:true}).some(x=>x.includes('régimen especial')));
console.log('Pacto general: fechas, causa, campos, fórmula y régimen especial verificados.');
