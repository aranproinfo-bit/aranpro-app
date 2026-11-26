import { createClient } from '@supabase/supabase-js';
import { mergeServerResidentUpdates } from '../src/services/onlineSyncService.js';
import { initialCommunities, initialCompanySettings, initialCertificates } from '../src/data/initialData.js';

const supabaseUrl = 'https://ybztfwzryejmnkfgybvw.supabase.co';
const supabaseKey = 'sb_publishable_IJPrHemkbf5AK-JgAINjuw_JUNAv7LR';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('=== PRUEBA INTEGRAL: OPERACIÓN EN LÍNEA MULTIUSUARIO Y NOTIFICACIONES ===');

  // 1. Login de Administrador vía RPC
  console.log('1. Probando login seguro de Administrador (aranpro_staff_login)...');
  const { data: loginRes, error: loginErr } = await supabase.rpc('aranpro_staff_login', {
    p_rut: '16.012.871-2',
    p_password: 'admin123'
  });
  if (loginErr || !loginRes?.ok) {
    throw new Error('Falló aranpro_staff_login: ' + (loginErr?.message || JSON.stringify(loginRes)));
  }
  console.log('   ✓ Login Admin exitoso:', loginRes.user.nombre, '| Rol:', loginRes.user.role);

  const originalSnapshot = loginRes.snapshot;
  const originalRevision = loginRes.revision || 0;

  // 2. Guardar un estado de prueba controlado (preservando respaldo previo si existiera)
  const testSnapshot = originalSnapshot && Array.isArray(originalSnapshot.communities) && originalSnapshot.communities.length > 0
    ? structuredClone(originalSnapshot)
    : {
        communities: [
          {
            id: 'com-test-online',
            slug: 'condominio-piloto-online',
            name: 'Condominio Piloto En Línea',
            address: 'Av. del Mar 1500',
            city: 'La Serena',
            commune: 'La Serena',
            units: [
              {
                id: 'u-test-101',
                number: '101',
                owner: 'Vecina Prueba Online',
                rut: '15.420.312-4',
                email: 'vecina.piloto@ejemplo.cl',
                sharePercentage: 5,
                currentCharge: 65000,
                previousDebt: 0,
                extraCharge: 0,
                paidAmount: 0,
                paid: false
              }
            ],
            expenses: [],
            paymentReports: [],
            announcements: [],
            communityTickets: [],
            writtenConsultations: []
          }
        ],
        companySettings: {
          brandName: 'ARANPRO',
          administratorName: 'John Andrés Arancibia Maureira',
          adminRut: '16.012.871-2',
          email: 'aranpro.info@gmail.com'
        },
        certificates: []
      };

  const targetComm = testSnapshot.communities[0];
  const targetUnit = targetComm.units[0];

  console.log('2. Sincronizando estado desde Administración (aranpro_workspace_push)...');
  const { data: pushRes, error: pushErr } = await supabase.rpc('aranpro_workspace_push', {
    p_revision: originalRevision,
    p_snapshot: testSnapshot,
    p_admin_rut: '16.012.871-2',
    p_admin_password: 'admin123',
    p_force: true
  });
  if (pushErr || !pushRes?.ok) {
    throw new Error('Falló aranpro_workspace_push: ' + (pushErr?.message || JSON.stringify(pushRes)));
  }
  console.log('   ✓ Workspace sincronizado en versión:', pushRes.revision);

  // 3. Probar directorio público liviano para QR
  console.log('3. Consultando directorio público para QR (aranpro_public_communities)...');
  const { data: pubComms } = await supabase.rpc('aranpro_public_communities');
  console.log('   ✓ Comunidades visibles en cabecera QR:', pubComms?.length || 0);

  // 4. Probar acceso en línea de un Residente desde un dispositivo externo sin sesión previa
  console.log('4. Probando login de Residente desde otro dispositivo (aranpro_resident_portal_sync)...');
  const unitPass = targetUnit.password || String(targetUnit.number);
  const { data: resSync, error: resSyncErr } = await supabase.rpc('aranpro_resident_portal_sync', {
    p_rut_or_unit: targetUnit.rut || String(targetUnit.number),
    p_password: String(unitPass),
    p_community_slug: targetComm.slug
  });
  if (resSyncErr || !resSync?.ok) {
    throw new Error('Falló aranpro_resident_portal_sync: ' + (resSyncErr?.message || JSON.stringify(resSync)));
  }
  console.log('   ✓ Residente conectado en línea:', resSync.user.owner, '| Unidad:', resSync.user.unitNumber);

  // Comprobar que contraseña incorrecta es rechazada
  const { data: badPassRes } = await supabase.rpc('aranpro_resident_portal_sync', {
    p_rut_or_unit: targetUnit.rut || String(targetUnit.number),
    p_password: 'clave-falsa-999999',
    p_community_slug: targetComm.slug
  });
  if (badPassRes?.ok) throw new Error('Seguridad falló: aceptó clave incorrecta');
  console.log('   ✓ Rechazo de clave incorrecta verificado:', badPassRes.message);

  // 5. Residente informa un pago desde su celular -> actualiza nube y genera alerta al Admin
  const testPaymentId = 'pay-test-' + Date.now();
  console.log('5. Residente informando pago en línea (aranpro_resident_submit)...');
  const { data: submitRes, error: submitErr } = await supabase.rpc('aranpro_resident_submit', {
    p_community_id: targetComm.id,
    p_unit_id: targetUnit.id,
    p_rut_or_unit: targetUnit.rut || String(targetUnit.number),
    p_password: String(unitPass),
    p_action: 'report_payment',
    p_payload: {
      id: testPaymentId,
      unitId: targetUnit.id,
      unitNumber: targetUnit.number,
      owner: targetUnit.owner,
      amount: 65000,
      date: '2026-11-26',
      transferNumber: 'TRF-PRUEBA-001',
      status: 'PENDIENTE'
    }
  });
  if (submitErr || !submitRes?.ok) {
    throw new Error('Falló aranpro_resident_submit: ' + (submitErr?.message || JSON.stringify(submitRes)));
  }
  console.log('   ✓ Pago registrado en nube. Nueva revisión:', submitRes.revision);

  // 6. Verificar que el Administrador recibe la notificación y la fusión inteligente conserva el pago
  console.log('6. Verificando bandeja de alertas del Administrador (aranpro_admin_notifications)...');
  const { data: adminNotifs } = await supabase.rpc('aranpro_admin_notifications', {
    p_admin_rut: '16.012.871-2',
    p_admin_password: 'admin123',
    p_mark_read: true
  });
  const foundAlert = (adminNotifs?.items || []).find(n => n.title.includes(String(targetUnit.number)));
  if (!foundAlert) throw new Error('No llegó notificación de pago al administrador');
  console.log('   ✓ Alerta recibida por Admin:', foundAlert.title, '->', foundAlert.message);

  // Probar detección de conflicto y merge sin pérdida
  const { data: conflictCheck } = await supabase.rpc('aranpro_workspace_push', {
    p_revision: pushRes.revision, // revisión anterior al pago del vecino
    p_snapshot: testSnapshot,
    p_admin_rut: '16.012.871-2',
    p_admin_password: 'admin123',
    p_force: false
  });
  if (!conflictCheck?.conflict) throw new Error('No detectó concurrencia de versión');
  const merged = mergeServerResidentUpdates(testSnapshot, conflictCheck.snapshot);
  const paymentPreserved = merged.communities[0].paymentReports.some(p => p.id === testPaymentId);
  if (!paymentPreserved) throw new Error('La fusión no preservó el pago del vecino');
  console.log('   ✓ Control de concurrencia y fusión sin pérdida de pagos verificado');

  // 7. Restaurar estado limpio oficial (sin dejar datos de prueba ficticios)
  const cleanSnapshotToRestore = (originalSnapshot && !(originalSnapshot.communities || []).some(c => c.id === 'com-test-online'))
    ? originalSnapshot
    : {
        communities: initialCommunities,
        companySettings: initialCompanySettings,
        certificates: initialCertificates
      };

  await supabase.rpc('aranpro_workspace_push', {
    p_revision: submitRes.revision,
    p_snapshot: cleanSnapshotToRestore,
    p_admin_rut: '16.012.871-2',
    p_admin_password: 'admin123',
    p_force: true
  });
  console.log('7. ✓ Base en línea restaurada con datos limpios oficiales.');

  console.log('=== TODAS LAS PRUEBAS EN LÍNEA SUPERADAS AL 100% ===');
}

main().catch(err => {
  console.error('ERROR EN PRUEBA:', err);
  process.exit(1);
});
