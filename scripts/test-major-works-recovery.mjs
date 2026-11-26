import { periodCharges, getMajorWorksRecoveryList, generateInstallmentSchedule } from '../src/utils/expenseBilling.js';
import { initialCommunities } from '../src/data/initialData.js';

console.log('🧪 Iniciando prueba de Trabajos Mayores & Recuperación de Fondos en Cuotas...');

const comm1 = initialCommunities[0];
console.log(`📌 Comunidad: ${comm1.name} (Período activo: ${comm1.activePeriod.month}/${comm1.activePeriod.year})`);

// 1. Probar getMajorWorksRecoveryList
const recoveryList = getMajorWorksRecoveryList(comm1);
console.log(`\n1. Obras mayores detectadas: ${recoveryList.length}`);
if (recoveryList.length === 0) {
  throw new Error('❌ Fallo: No se detectó la obra mayor en initialData');
}

const obra = recoveryList[0];
console.log(`   - Proyecto: ${obra.projectName}`);
console.log(`   - Proveedor: ${obra.provider} (${obra.providerRut})`);
console.log(`   - Monto total: $${obra.totalAmount.toLocaleString('es-CL')}`);
console.log(`   - Cuotas totales: ${obra.totalInstallments} (${obra.installmentsChargedCount} cobradas / en curso)`);
console.log(`   - Cuota mensual: $${obra.monthlyInstallmentAmount.toLocaleString('es-CL')}`);
console.log(`   - Cuota actual en período activo: Cuota N° ${obra.currentInstallmentIndex} de ${obra.totalInstallments}`);
console.log(`   - Monto recuperado a la fecha: $${obra.totalRecovered.toLocaleString('es-CL')} (${obra.percentRecovered}%)`);
console.log(`   - Saldo pendiente por recuperar: $${obra.remainingToRecover.toLocaleString('es-CL')}`);
console.log(`   - Estado: ${obra.status}`);

if (obra.currentInstallmentIndex !== 2) {
  throw new Error(`❌ Fallo: Se esperaba cuota 2 para Noviembre 2026, pero se obtuvo ${obra.currentInstallmentIndex}`);
}

// 2. Probar periodCharges para verificar que la cuota 2 entra en el cobro del mes activo
const charges = periodCharges(comm1);
console.log(`\n2. Cargos computados para el período activo: ${charges.length}`);
const recoveryCharge = charges.find(c => c.isFundRecovery);
if (!recoveryCharge) {
  throw new Error('❌ Fallo: No se encontró el cargo de recuperación en periodCharges');
}

console.log(`   - Cargo de recuperación encontrado: ${recoveryCharge.projectName}`);
console.log(`   - Cuota: ${recoveryCharge.index} de ${recoveryCharge.count}`);
console.log(`   - Monto cuota para el mes: $${recoveryCharge.amount.toLocaleString('es-CL')}`);
console.log(`   - Fondo destino de reposición: ${recoveryCharge.recoveryFund}`);

if (recoveryCharge.amount !== 600000 || recoveryCharge.index !== 2) {
  throw new Error(`❌ Fallo en valores de periodCharge: esperado $600.000 cuota 2, obtenido $${recoveryCharge.amount} cuota ${recoveryCharge.index}`);
}

// 3. Probar generateInstallmentSchedule
const schedule = generateInstallmentSchedule(obra);
console.log(`\n3. Cronograma generado (${schedule.length} meses):`);
let totalSum = 0;
for (const s of schedule) {
  console.log(`   - Cuota ${s.installmentNumber}: ${s.periodKey} -> $${s.amount.toLocaleString('es-CL')} (Acum: $${s.accumulated.toLocaleString('es-CL')}, Saldo: $${s.remaining.toLocaleString('es-CL')})`);
  totalSum += s.amount;
}

if (totalSum !== obra.totalAmount) {
  throw new Error(`❌ Fallo: La suma de cuotas (${totalSum}) no coincide con el total de la obra (${obra.totalAmount})`);
}

console.log('\n✅ ¡TODAS LAS PRUEBAS DE RECUPERACIÓN DE FONDOS PASARON AL 100%!');
