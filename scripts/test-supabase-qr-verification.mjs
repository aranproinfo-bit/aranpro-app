import { certificateVerificationService, cloudSyncService } from '../src/services/supabase.js';

console.log('🧪 Iniciando prueba de Verificación QR y Sincronización Supabase...');

// 1. Probar registro y verificación de certificado
const sampleCert = {
  id: 'cert-test-01',
  folio: 'CERT-2026-999',
  verificationCode: 'VRF-NOTARY7',
  communityName: 'Condominio Los Cerezos',
  unitNumber: 'Casa 102',
  applicantName: 'Carlos Valenzuela Ríos',
  rut: '12.345.678-9',
  type: 'Certificado de Gastos Comunes al Día (No Deuda)',
  debtAmount: 0,
  aliquotPercent: '6.250',
  date: '2026-11-26',
  expiresAt: '2026-12-26',
  status: 'valido',
  issuedBy: 'John Andrés Arancibia (RNAC N° 48.912)'
};

console.log(`\n1. Registrando certificado Folio ${sampleCert.folio}...`);
const registered = await certificateVerificationService.registerCertificateToCloud(sampleCert);
console.log(`   - Certificado registrado con éxito: Folio ${registered.folio}`);

console.log(`\n2. Verificando certificado por QR con Folio y Hash...`);
const verification = await certificateVerificationService.verifyCertificate('CERT-2026-999', 'VRF-NOTARY7');
console.log(`   - Resultado de verificación: ${verification.success ? '✔ VÁLIDO' : '✖ FALLÓ'}`);
console.log(`   - Origen del resultado: ${verification.source}`);
console.log(`   - Certificado: ${verification.certificate?.cert_type}`);
console.log(`   - Titular: ${verification.certificate?.applicant_name} (RUT: ${verification.certificate?.applicant_rut})`);
console.log(`   - Unidad: ${verification.certificate?.unit_number}`);
console.log(`   - Deuda registrada: $${verification.certificate?.debt_amount}`);
console.log(`   - Vigencia: ${verification.isExpired ? 'Vencido' : 'Vigente'}`);

if (!verification.success || verification.certificate?.folio !== 'CERT-2026-999') {
  throw new Error('❌ Fallo: La verificación de certificado no devolvió los datos esperados');
}

// 3. Probar verificación con folio inválido
console.log(`\n3. Probando verificación con folio inexistente...`);
const invalidVerification = await certificateVerificationService.verifyCertificate('CERT-INVENTADO-000');
console.log(`   - Resultado para folio inventado: ${invalidVerification.success ? '✔ ENCONTRADO' : '✖ RECHAZADO CORRECTAMENTE'}`);
if (invalidVerification.success) {
  throw new Error('❌ Fallo: Un folio inexistente no debe dar éxito');
}

console.log('\n✅ ¡TODAS LAS PRUEBAS DE VERIFICACIÓN QR Y CLOUD PASARON AL 100%!');
