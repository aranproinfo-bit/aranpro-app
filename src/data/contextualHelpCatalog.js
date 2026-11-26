/**
 * Catálogo Didáctico Contextual de ARANPRO (Ley N° 21.442)
 * Alimenta el botón "Lamparita 💡" cambiando automáticamente según el workspace,
 * módulo principal y sub-pestaña donde esté trabajando el administrador.
 */

export const ENTERPRISE_HELP_CATALOG = {
  comunidades: {
    default: {
      badge: 'MI OFICINA • MÓDULO 1',
      title: 'Mis Comunidades en Cartera',
      summary: 'Centro de mando de tu cartera de condominios. Desde aquí abres la operación diaria de cada comunidad, previsualizas cómo ven el portal los vecinos o inicias una rendición/entrega.',
      whenToUse: 'Cada vez que inicias tu jornada para elegir en qué condominio trabajar o para dar de alta una comunidad recién adjudicada.',
      steps: [
        { title: 'Revisar estado rápido de cartera', detail: 'Verifica cuántas unidades están al día en cada condominio, el período activo y tus honorarios totales estimados en UF/CLP.' },
        { title: 'Ingresar a Administrar', detail: 'Haz clic en "Ingresar a Administrar" en la tarjeta del condominio para abrir sus gastos comunes, pagos, RR.HH., comité y asambleas.' },
        { title: 'Simular vista de vecino (Ojo 👁)', detail: 'Usa el ícono del ojo para revisar exactamente lo que ve un copropietario en su celular antes de publicar avisos o cobros.' },
        { title: 'Acceso directo a Rendición & Traspaso', detail: 'Usa el botón inferior de cada tarjeta para preparar la Asamblea Ordinaria anual o entregar formalmente una comunidad.' }
      ],
      legalTip: 'Ley N° 21.442 Art. 20°: Cada comunidad debe llevar contabilidad, cuenta bancaria y respaldos estrictamente separados de tu oficina y de otros condominios.',
      commonMistake: 'Nunca elimines una comunidad que dejaste de administrar: usa el estado "Archivo Histórico • Entregada" para conservar tus respaldos legales.'
    }
  },

  empresa: {
    default: {
      badge: 'MI OFICINA • MÓDULO 2',
      title: 'Datos de Empresa, Firma Digital & RNAC MINVU',
      summary: 'Configura una sola vez la identidad legal de tu oficina administradora para que todos los certificados, actas, contratos y propuestas salgan firmados y timbrados automáticamente.',
      whenToUse: 'Al configurar ARANPRO por primera vez o cuando renueves tu certificado vigente del Registro Nacional de Administradores (MINVU).',
      steps: [
        { title: '1. Completar Datos de Empresa y Rep. Legal', detail: 'Ingresa tu nombre profesional, RUT, razón social (si operas como SpA/EIRL), teléfono, correo oficial y ciudad base.' },
        { title: '2. Cargar Firma Manuscrita (PNG transparente)', detail: 'Sube tu firma sin fondo y ajusta el control de escala visual hasta que luzca nítida sobre la línea de firma.' },
        { title: '3. Subir Acreditaciones en Bóveda Digital', detail: 'Guarda tu Certificado RNAC MINVU vigente, título profesional, curso OTEC y certificado de antecedentes para insertarlos en tus propuestas.' }
      ],
      legalTip: 'Ley N° 21.442 Art. 82° al 86°: Es obligatorio mantener inscripción vigente en el RNAC del MINVU para ejercer administración remunerada de condominios.',
      commonMistake: 'Subir una foto de firma con fondo gris oscuro: usa fondo blanco limpio o PNG transparente para un acabado notarial.'
    },
    firma: {
      badge: 'MI OFICINA • FIRMA Y TIMBRE',
      title: 'Firma Manuscrita & Timbre Circular Oficial',
      summary: 'Personaliza tu firma autógrafa digital y verifica cómo se combina con el Sello Oficial Circular de ARANPRO en los pies de firma de todos los PDFs.',
      whenToUse: 'Al iniciar en la plataforma o si notas que tu firma se ve muy pequeña o muy grande en las vistas previas PDF.',
      steps: [
        { title: 'Subir imagen de firma', detail: 'Firma en papel blanco con lápiz azul oscuro o negro, digitalízala sin sombras y súbela aquí.' },
        { title: 'Calibrar tamaño (Escala)', detail: 'Mueve el deslizador de escala (ej. 1.0x a 1.4x) observando la vista previa en vivo.' },
        { title: 'Elegir plantilla visual PDF', detail: 'Selecciona entre Doble Filete Verde/Dorado (Estándar ARANPRO), Línea Ejecutiva o Editorial Limpio.' }
      ],
      legalTip: 'Los documentos informativos y certificaciones del administrador deben individualizar claramente nombre, RUT y calidad en que actúa.',
      commonMistake: 'Dejar la firma sin cargar antes de descargar el Dossier Comercial o certificados para notarías.'
    },
    acreditacion: {
      badge: 'MI OFICINA • BÓVEDA RNAC',
      title: 'Títulos, Diplomas & Certificado RNAC MINVU',
      summary: 'Bóveda local de alta capacidad (IndexedDB) donde almacenas tus PDFs e imágenes habilitantes para adjuntarlos automáticamente en licitaciones.',
      whenToUse: 'Antes de postular a un nuevo condominio o cada vez que actualices tu certificado de antecedentes (vigencia recomendada 60 días).',
      steps: [
        { title: 'Cargar los 5 documentos clave', detail: 'Sube: 1) Certificado RNAC MINVU, 2) Título Profesional, 3) Curso Administración OTEC, 4) Certificado de Antecedentes y 5) Licencia SEC/Especialidad.' },
        { title: 'Verificar indicador en verde', detail: 'Comprueba que cada tarjeta muestre "Archivo en Bóveda" para que se incluya en el Dossier Maestro del Paso 2.' }
      ],
      legalTip: 'Art. 84° Ley N° 21.442: El certificado de antecedentes para fines especiales acredita inexistencia de inhabilidades penales.',
      commonMistake: 'Presentarse ante un Comité con el Certificado de Antecedentes vencido de hace más de 3 meses.'
    }
  },

  postulaciones: {
    default: {
      badge: 'MI OFICINA • MÓDULO 3 (EMBUDO)',
      title: 'Guía Paso a Paso de Postulaciones (Pasos 1 al 6)',
      summary: 'Metodología comercial completa para adjudicarte nuevos condominios: desde el primer contacto en frío hasta la recepción financiera del Día 1.',
      whenToUse: 'Cada vez que prospectes un edificio/condominio, prepares una reunión con un Comité o ganes una licitación.',
      steps: [
        { title: 'Pasos 1 y 2: Abrir puerta y enviar Dossier', detail: 'Personaliza el nombre del condominio objetivo y emite la Carta de Valor en Frío (sin precios) y el Dossier Maestro con tus títulos.' },
        { title: 'Pasos 3 y 4: Cotizar con respaldo y mostrar Demo QR', detail: 'Calcula el honorario técnico en la Calculadora, emite la Propuesta Formal de 3 páginas y lleva el Brochure con QR vivo a la entrevista.' },
        { title: 'Paso 5: Adjudicación y preaviso al saliente', detail: 'Al ganar, entrega al Comité la Carta de Término (30 días), la Pauta de Traspaso de 3 páginas y el Contrato/Cláusulas de Acta.' },
        { title: 'Paso 6: Recepción Día 1 y Migración', detail: 'Crea la comunidad en ARANPRO cuadrando banco vs fondos e importando unidades desde Edipro, ComunidadFeliz, Edifito o Excel.' }
      ],
      legalTip: 'Art. 18° Ley N° 21.442: El acta de designación del administrador debe reducirse a escritura pública para habilitar poderes bancarios.',
      commonMistake: 'Dar un precio por WhatsApp en el primer contacto sin haber diagnosticado cantidad de unidades, personal ni equipamiento crítico.'
    },
    material: {
      badge: 'POSTULACIONES • BANDEJA RÁPIDA',
      title: 'Bandeja de Documentos Rápidos de Licitación',
      summary: 'Repositorio centralizado donde tienes a 1 clic todos tus PDFs comerciales, certificados de bóveda y cartas de referencia con 3 botones uniformes.',
      whenToUse: 'Cuando un Comité te pide urgente un documento específico durante una negociación o reunión.',
      steps: [
        { title: 'Botón [Ir]', detail: 'Te lleva al formulario o paso donde se configura ese documento (o a subirlo en Bóveda si aún falta).' },
        { title: 'Botón [Ver Previa]', detail: 'Muestra en pantalla exactamente cómo saldrá impresa la hoja Carta antes de enviarla.' },
        { title: 'Botón [Descargar PDF]', detail: 'Genera el PDF limpio con membrete, firma y timbre listo para enviar por correo o WhatsApp.' }
      ],
      legalTip: 'Verifica siempre en el Semáforo que tu documentación obligatoria esté en verde antes de despachar la carpeta.',
      commonMistake: 'Olvidar cambiar el nombre de la comunidad objetivo antes de descargar una propuesta nueva.'
    },
    pipeline: {
      badge: 'POSTULACIONES • CRM COMERCIAL',
      title: 'CRM de Postulaciones y Seguimiento de Comités',
      summary: 'Tablero de control comercial para registrar prospectos, etapas de avance, honorarios cotizados y fechas de seguimiento.',
      whenToUse: 'Después de cada llamada, correo o reunión con un Comité de Administración.',
      steps: [
        { title: 'Registrar oportunidad', detail: 'Anota nombre del condominio, unidades, contacto del Presidente del Comité y honorario ofertado.' },
        { title: 'Avanzar etapa del embudo', detail: 'Mueve cada prospecto entre Prospecto → Dossier Enviado → Entrevista → Propuesta → Adjudicado.' },
        { title: 'Vincular con Paso 6 al ganar', detail: 'Cuando pases a Adjudicado, ábrelo en el Paso 6 para convertirlo automáticamente en comunidad activa.' }
      ],
      legalTip: 'Guarda registro de las condiciones prometidas en la propuesta para que coincidan exactamente con el Contrato de Administración.',
      commonMistake: 'No hacer seguimiento a las 72 horas posteriores a entregar una propuesta formal.'
    },
    preparacion: {
      badge: 'POSTULACIONES • SEMÁFORO',
      title: 'Checklist & Semáforo de Preparación (0–100)',
      summary: 'Auditor automático que revisa si tienes cargada tu firma, RUT, RNAC MINVU, diplomas y referencias antes de presentarte ante un Comité.',
      whenToUse: 'Antes de tu primera licitación del mes para asegurar puntaje 100/100 sin bloqueadores rojos.',
      steps: [
        { title: 'Resolver bloqueadores críticos primero', detail: 'Haz clic en "Resolver →" en cualquier alerta roja para ir directo al campo faltante.' },
        { title: 'Descargar paquete numerado', detail: 'Usa el botón de descarga de respaldos numerados para adjuntar tus anexos ordenados.' }
      ],
      legalTip: 'Los Comités evalúan primero cumplimiento legal (RNAC + antecedentes) y luego solvencia técnica.',
      commonMistake: 'Postular sin referencias verificables o sin acreditar inscripción vigente en el MINVU.'
    },
    calculadora: {
      badge: 'CAJA DE HERRAMIENTAS • TARIFAS',
      title: 'Calculadora Pericial de Honorarios ARANPRO',
      summary: 'Determina el honorario técnico justo en UF y CLP según cantidad de unidades, tipología, dotación laboral y equipamiento crítico (ascensores, calderas, bombas).',
      whenToUse: 'Antes de redactar el Paso 3 (Propuesta Comercial) para fundamentar técnicamente tu tarifa frente al Comité.',
      steps: [
        { title: 'Configurar complejidad técnica', detail: 'Ingresa número de unidades, subsectores contables, trabajadores y salas técnicas.' },
        { title: 'Emitir Memoria Pericial PDF', detail: 'Descarga la ficha técnica de 1 página que justifica horas-hombre y responsabilidad legal.' }
      ],
      legalTip: 'La Ley N° 21.442 incrementó sustancialmente la responsabilidad civil e infraccional del administrador (Art. 87°).',
      commonMistake: 'Competir por precio bajo subestimando la carga horaria de un edificio con personal propio y salas de calderas.'
    },
    inspeccion: {
      badge: 'CAJA DE HERRAMIENTAS • TERRENO',
      title: 'Pauta de Inspección Técnica Inicial',
      summary: 'Formulario pericial para levantar hallazgos visibles en tu primera visita a terreno (bombas, tableros, techumbres, gas SEC y seguridad).',
      whenToUse: 'Durante o inmediatamente después del recorrido técnico inicial junto al Comité.',
      steps: [
        { title: 'Evaluar puntos críticos', detail: 'Registra estado visual, urgencias normativas y recomendaciones preventivas.' },
        { title: 'Entregar Informe al Comité', detail: 'Imprime el informe PDF como muestra concreta de tu valor agregado técnico frente a administradores tradicionales.' }
      ],
      legalTip: 'Detectar sellos SEC vencidos o ascensores sin certificación vigente protege desde el primer día a la comunidad.',
      commonMistake: 'Asumir una comunidad sin levantar un acta o diagnóstico del estado en que recibes sus instalaciones.'
    },
    comparativa: {
      badge: 'CAJA DE HERRAMIENTAS • DIFERENCIACIÓN',
      title: 'Matriz Comparativa: Tradicional vs. Modelo ARANPRO',
      summary: 'Lámina ejecutiva de 10 criterios que contrasta la administración informal/reactiva contra la gestión preventiva, transparente y auditable.',
      whenToUse: 'Cuando el Comité compara tu propuesta contra alternativas de menor costo pero sin respaldo técnico.',
      steps: [
        { title: 'Revisar los 10 ejes comparativos', detail: 'Úsala en pantalla o impresa para explicar por qué lo barato termina saliendo caro en multas y fallas.' }
      ],
      legalTip: 'La transparencia mensual documentada (Art. 21°) y el control preventivo evitan derramas extraordinarias.',
      commonMistake: 'No educar al Comité sobre los riesgos financieros de la Ley Bustos o multas SEC/SEREMI.'
    },
    demo: {
      badge: 'CAJA DE HERRAMIENTAS • APP MÓVIL',
      title: 'Demo en Vivo & Brochure QR para Comités',
      summary: 'Genera una ficha impresa con código QR escaneable en vivo para que los miembros del Comité prueben el Portal del Vecino desde sus propios teléfonos en plena reunión.',
      whenToUse: 'En la entrevista presencial o por videollamada con el Comité.',
      steps: [
        { title: 'Imprimir Brochure QR o mostrar en pantalla', detail: 'Pide a los integrantes del Comité que apunten con la cámara de su celular al QR.' },
        { title: 'Guiar recorrido de 2 minutos', detail: 'Muéstrales cómo un vecino descarga su colilla, revisa facturas reales de respaldo y reporta su pago.' }
      ],
      legalTip: 'Facilitar acceso digital permanente a los respaldos contables reduce reclamos y aumenta la recaudación.',
      commonMistake: 'Hablar en abstracto del software en vez de dejar que el Comité lo toque en su propio celular.'
    },
    pitch: {
      badge: 'CAJA DE HERRAMIENTAS • ENTREVISTA',
      title: 'Libreto Pitch Maestro (10 Minutos) & Objeciones',
      summary: 'Guion estructurado minuto a minuto y respuestas probadas ante las 10 preguntas más difíciles que hacen los Comités en licitaciones.',
      whenToUse: '30 minutos antes de entrar a una asamblea o entrevista con el Comité.',
      steps: [
        { title: 'Repasar estructura de 10 minutos', detail: 'Apertura → Diagnóstico técnico → Transparencia financiera → Plan primeros 30 días → Cierre.' },
        { title: 'Preparar respuestas a objeciones', detail: 'Revisa cómo responder sobre honorarios, visitas a terreno, cobranza judicial y tiempos de respuesta.' }
      ],
      legalTip: 'Nunca prometas facultades que la ley reserva exclusivamente a la Asamblea o al Comité (Arts. 15° y 17°).',
      commonMistake: 'Improvisar la presentación excediendo los 15 minutos y perdiendo la atención del Comité.'
    }
  },

  rrhh_oficina: {
    default: {
      badge: 'MI OFICINA • MÓDULO 4 (RR.HH. PROPIO)',
      title: 'RR.HH. y Remuneraciones de Mi Oficina (ARANPRO)',
      summary: 'Gestiona exclusivamente al personal contratado por TU empresa administradora (asistentes administrativos, supervisores, contadores), independiente del personal de los edificios.',
      whenToUse: 'A fin de mes para emitir liquidaciones de tu equipo interno, antes del día 13 para Previred, o al redactar contratos/finiquitos de tu oficina.',
      steps: [
        { title: '1. Nómina y Contratos DT', detail: 'Registra trabajadores o prestadores a honorarios de tu oficina y emite contratos actualizados a Ley 40 Horas.' },
        { title: '2. Liquidaciones y Previred (con Guía)', detail: 'Calcula sueldos con topes legales y abre la Guía Paso a Paso integrada para declarar y pagar en Previred sin errores.' },
        { title: '3. Finiquitos y Ley Karin', detail: 'Si termina una relación laboral, usa la Guía de Carta de Aviso + Finiquito DT y mantén al día tu protocolo interno.' }
      ],
      legalTip: 'Las cotizaciones de Previred vencen el día 13 de cada mes (si se pagan electrónicamente hasta las 13:45 hrs).',
      commonMistake: 'Mezclar trabajadores internos de tu oficina con conserjes contratados bajo el RUT de una comunidad.'
    },
    liquidaciones: {
      badge: 'RR.HH. OFICINA • LIQUIDACIONES',
      title: 'Cálculo y Emisión de Liquidaciones Mensuales DT',
      summary: 'Calcula haberes imponibles, no imponibles, descuentos AFP/Salud/AFC e impuesto único de tu equipo administrativo.',
      whenToUse: 'Entre el día 25 y el último día hábil de cada mes.',
      steps: [
        { title: 'Ingresar días trabajados y horas extra', detail: 'Ajusta ausencias, bonos o anticipos del mes antes de emitir.' },
        { title: 'Imprimir y recabar firma', detail: 'Descarga la liquidación oficial y conserva copia firmada en la carpeta del trabajador.' }
      ],
      legalTip: 'Art. 54° Código del Trabajo: Junto con el pago, el empleador debe entregar comprobante con monto pagado y deducciones.',
      commonMistake: 'Pagar bonos habituales en efectivo por fuera de la liquidación, generando contingencias previsionales.'
    },
    previred: {
      badge: 'RR.HH. OFICINA • PREVIRED',
      title: 'Planilla de Imposiciones Previred (Con Guía Paso a Paso)',
      summary: 'Consolida AFP, Fonasa/Isapre, AFC, SIS y Mutual de tu oficina y te guía paso a paso para subir y pagar en Previred.com.',
      whenToUse: 'Del día 1 al día 13 del mes siguiente a las remuneraciones.',
      steps: [
        { title: 'Revisar montos imponibles y aportes patronales', detail: 'Verifica que cuadren exactamente con las liquidaciones emitidas.' },
        { title: 'Seguir la Guía Paso a Paso Previred', detail: 'Usa el panel guía superior para cargar los datos en Previred y archivar el cupón pagado.' }
      ],
      legalTip: 'Pagar fuera de plazo genera reajustes, intereses penales y bloquea la obtención del certificado F30-1 limpio.',
      commonMistake: 'Olvidar declarar movimiento de personal (licencia médica, ingreso o término) en el mes respectivo.'
    },
    finiquitos: {
      badge: 'RR.HH. OFICINA • TÉRMINO LABORAL',
      title: 'Carta de Aviso, Cálculo de Finiquito y Ratificación DT',
      summary: 'Simula indemnizaciones legales (feriado proporcional, mes de aviso, años de servicio) y redacta tanto la Carta de Aviso como el Finiquito.',
      whenToUse: 'Al finalizar el contrato de un colaborador por renuncia, mutuo acuerdo, vencimiento de plazo o necesidades de la empresa.',
      steps: [
        { title: '1. Verificar cotizaciones 100% pagadas', detail: 'Antes de notificar despido, comprueba que Previred esté pagado hasta el último mes.' },
        { title: '2. Emitir Carta de Aviso dentro de plazo legal', detail: 'Despacha copia al trabajador e ingresa copia en el portal MiDT dentro de 3 días hábiles.' },
        { title: '3. Pagar y ratificar Finiquito en máx. 10 días hábiles', detail: 'Ratifica ante Notario o en el portal electrónico de la Dirección del Trabajo.' }
      ],
      legalTip: 'Art. 177° Código del Trabajo: El finiquito debe ponerse a disposición y pagarse dentro de los 10 días hábiles siguientes a la separación.',
      commonMistake: 'No enviar la carta de aviso con copia a la Inspección del Trabajo dentro del plazo legal.'
    }
  },

  alianzas: {
    default: {
      badge: 'MI OFICINA • MÓDULO 5',
      title: 'Convenios & Proveedores de Confianza',
      summary: 'Tu red verificada de especialistas técnicos (ascensores MINVU, instaladores SEC, bombas, corrientes débiles, seguros y cobranza judicial) listos para atender tus comunidades.',
      whenToUse: 'Cuando necesites pedir 3 cotizaciones comparativas rápidas o atender una urgencia técnica en cualquiera de tus edificios.',
      steps: [
        { title: 'Mantener especialistas certificados', detail: 'Registra RUT, certificaciones vigentes (MINVU / SEC), contacto 24/7 y evaluación de cumplimiento.' },
        { title: 'Presentar ternas transparentes al Comité', detail: 'Ofrece siempre alternativas formales con factura electrónica y garantía escrita.' }
      ],
      legalTip: 'En mantención de ascensores (Ley 20.296) e instalaciones de gas (SEC) solo pueden intervenir empresas/técnicos con registro vigente.',
      commonMistake: 'Contratar maestros informales sin boleta/factura ni seguro de accidentes para trabajos de riesgo en altura o electricidad.'
    }
  },

  biblioteca_legal: {
    default: {
      badge: 'MI OFICINA • MÓDULO 6 (LEYES)',
      title: 'Biblioteca Legal Oficial de Copropiedad y Laboral',
      summary: 'Consulta y descarga inmediata de los cuerpos legales vigentes en Chile que rigen la administración de condominios y su personal.',
      whenToUse: 'Para fundamentar con artículo exacto una respuesta al Comité, una citación a asamblea, una multa o una medida laboral.',
      steps: [
        { title: 'Consultar texto oficial en PDF', detail: 'Abre o descarga la Ley N° 21.442, su Reglamento DS N° 7 MINVU, Código del Trabajo, Ley 40 Horas, Ley Karin y Ley 20.296 de Ascensores.' },
        { title: 'Citar la norma exacta', detail: 'Apóyate en los resúmenes ejecutivos de artículos clave para respaldar tus decisiones administrativas.' }
      ],
      legalTip: 'En caso de contradicción entre un Reglamento de Copropiedad antiguo y la Ley N° 21.442, prevalecen las normas de orden público de la Ley.',
      commonMistake: 'Aplicar quórums de la antigua Ley 19.537 que fueron modificados por el Art. 15° de la Ley N° 21.442.'
    }
  },

  respaldos: {
    default: {
      badge: 'MI OFICINA • MÓDULO 7 (SEGURIDAD)',
      title: 'Respaldos Maestros & Continuidad de Datos',
      summary: 'Centro de seguridad para descargar copias íntegras de respaldo (.JSON) de toda tu cartera y configuración o restaurarlas en otro equipo.',
      whenToUse: 'Semanalmente y siempre después de realizar el cierre mensual de tus comunidades.',
      steps: [
        { title: 'Descargar Respaldo Maestro', detail: 'Genera en 1 clic el archivo con todas tus comunidades, unidades, pagos, gastos, cierres y ajustes.' },
        { title: 'Guardar en nube segura', detail: 'Conserva una copia fechada en tu carpeta respaldada (y sincronizada con Supabase en Fase Cloud).' }
      ],
      legalTip: 'El administrador es custodio legal de la información contable y documental de las comunidades que administra.',
      commonMistake: 'Confiar únicamente en la memoria local de un navegador sin mantener respaldos periódicos.'
    }
  }
};

export const COMMUNITY_HELP_CATALOG = {
  resumen: {
    default: {
      badge: 'COMUNIDAD • DASHBOARD FINANCIERO',
      title: 'Dashboard Financiero y Pulso Operativo',
      summary: 'Vista ejecutiva en tiempo real de la salud financiera del condominio: recaudación del mes, saldo en banco, Fondo de Reserva, egresos y alertas pendientes.',
      whenToUse: 'Al abrir la comunidad cada día para controlar cuánto se ha recaudado, qué pagos faltan por validar y cómo va el flujo de caja.',
      steps: [
        { title: '1. Verificar Recaudación vs. Gastos del Mes', detail: 'Compara los ingresos ya percibidos contra los gastos ordinarios comprometidos para asegurar liquidez.' },
        { title: '2. Monitorear Saldo Bancario y Fondo de Reserva', detail: 'Revisa el disponible bancario referencial y el acumulado del Fondo Común de Reserva (Art. 39°).' },
        { title: '3. Atender Alertas Rápidas', detail: 'Si aparecen pagos reportados por vecinos, mantenciones urgentes o certificados solicitados, usa los accesos directos para resolverlos.' }
      ],
      legalTip: 'Art. 21° Ley N° 21.442: El administrador debe rendir cuenta documentada mensualmente al Comité de Administración.',
      commonMistake: 'Usar recursos del Fondo de Reserva para cubrir gastos ordinarios del mes sin autorización expresa ni plan de reposición.'
    }
  },

  unidades: {
    default: {
      badge: 'COMUNIDAD • PADRÓN Y RECAUDACIÓN',
      title: 'Nómina de Unidades, Saldos y Convenios de Pago',
      summary: 'Administra el padrón oficial de copropietarios, sus alícuotas de prorrateo, estados de cuenta históricos, notas de cobranza y convenios de repactación.',
      whenToUse: 'Para consultar el saldo exacto de una casa/depto, registrar pagos, suscribir un convenio de deuda o actualizar datos de contacto.',
      steps: [
        { title: 'Revisar estado por unidad', detail: 'Identifica de un vistazo quién está Al Día, con Abono Parcial, con Saldo a Favor o Moroso.' },
        { title: 'Abrir Estado de Cuenta / Bitácora', detail: 'Haz clic en una unidad para ver su cartola histórica, enviar carta de cobranza preventiva o dejar notas de seguimiento.' },
        { title: 'Formalizar Convenio de Pago (Art. 35°)', detail: 'Si un propietario con mora acuerda repactar, configura el convenio en cuotas para que se cargue ordenadamente cada mes.' }
      ],
      legalTip: 'Art. 35° Ley N° 21.442: El administrador, con acuerdo del Comité, puede celebrar convenios de pago de hasta 12 cuotas (o más según reglamento).',
      commonMistake: 'Emitir un certificado de "ausencia total de deuda" a una unidad que mantiene cuotas futuras pendientes de un convenio.'
    },
    validar_pagos: {
      badge: 'UNIDADES • VALIDACIÓN DE PAGOS',
      title: 'Validar Transferencias Reportadas por Vecinos',
      summary: 'Bandeja donde llegan los comprobantes de transferencia subidos por los residentes desde su Portal Vecinal.',
      whenToUse: 'Diariamente durante los primeros 10 días del mes (período pico de pago de gastos comunes).',
      steps: [
        { title: 'Cotejar contra la cartola real del banco', detail: 'Verifica que el monto y número de operación figuren efectivamente abonados en la cuenta corriente del condominio.' },
        { title: 'Aprobar y generar Recibo Foliado', detail: 'Al aprobar, el sistema rebaja automáticamente la deuda de la unidad y deja disponible su Comprobante Oficial de Pago.' }
      ],
      legalTip: 'Nunca des por pagado un gasto común solo con la captura de pantalla sin verificar el abono efectivo en la cartola bancaria.',
      commonMistake: 'Demorar días en aprobar pagos ya transferidos, generando reclamos innecesarios de vecinos cumplidores.'
    },
    registro_pagos: {
      badge: 'UNIDADES • CARTOLA BANCARIA',
      title: 'Conciliación Rápida de Cartola y Pagos Manuales',
      summary: 'Carga o pega movimientos desde la cartola bancaria para conciliar pagos masivamente, o registra abonos manuales (exactos, parciales o con saldo a favor).',
      whenToUse: '2 a 3 veces por semana descargando la cartola del banco de la comunidad.',
      steps: [
        { title: 'Cargar o pegar cartola bancaria', detail: 'El asistente identifica coincidencias por RUT, nombre o monto y detecta posibles duplicados.' },
        { title: 'Manejo automático de abonos y excedentes', detail: 'Si un vecino paga de menos queda el saldo pendiente; si paga de más, el exceso queda registrado como Saldo a Favor para el próximo mes.' }
      ],
      legalTip: 'Art. 33° Ley N° 21.442: Todo pago de gastos comunes debe ingresar exclusivamente a la cuenta bancaria de la comunidad.',
      commonMistake: 'Recibir transferencias de gastos comunes en cuentas personales del administrador.'
    }
  },

  gastos: {
    default: {
      badge: 'COMUNIDAD • EGRESOS Y RESPALDOS',
      title: 'Gastos del Período, Respaldos Tributarios y Cuotas',
      summary: 'Registra cada factura, boleta o consumo del condominio adjuntando su respaldo digital para transparencia total ante el Comité y los vecinos.',
      whenToUse: 'Cada vez que se recibe o paga una factura de proveedor, cuenta de servicios básicos o reparación.',
      steps: [
        { title: '1. Ingresar gasto clasificado por categoría', detail: 'Selecciona proveedor, N° de factura/boleta, monto, estado de pago y origen del fondo (Ordinario o Fondo de Reserva).' },
        { title: '2. Adjuntar imagen o PDF del respaldo', detail: 'Sube la factura y el comprobante de pago: el semáforo de pre-cierre exige que todo gasto esté debidamente respaldado.' },
        { title: '3. Visación del Comité y Cuotas', detail: 'Marca la visación del Comité y, si es un gasto mayor a recuperar en varios meses, programa sus cuotas mensuales.' }
      ],
      legalTip: 'Art. 20° N° 9 y Art. 21° Ley N° 21.442: Todo egreso debe contar con documentación fidedigna de respaldo disponible para revisión.',
      commonMistake: 'Cerrar el mes con gastos anotados "sin boleta/respaldo", lo que genera rechazo inmediato del Comité en la rendición.'
    },
    proveedores: {
      badge: 'GASTOS • PROVEEDORES',
      title: 'Catastro de Proveedores del Condominio',
      summary: 'Ficha bancaria, tributaria y de contacto de todos los proveedores que prestan servicios a esta comunidad.',
      whenToUse: 'Antes de cursar pagos a un nuevo contratista o al preparar licitaciones comparativas.',
      steps: [
        { title: 'Completar RUT y cuenta bancaria del proveedor', detail: 'Asegura trazabilidad entre el RUT de la factura emitida y el titular de la cuenta que recibe la transferencia.' }
      ],
      legalTip: 'Paga siempre a la cuenta del emisor de la factura o deja respaldo escrito de cesión/mandato.',
      commonMistake: 'Transferir a terceros sin respaldo documental del proveedor titular.'
    },
    mantenciones: {
      badge: 'OPERACIONES • MANTENCIÓN PREVENTIVA',
      title: 'Plan Anual de Mantenciones y Certificaciones Críticas',
      summary: 'Controla vencimientos, bitácoras e informes técnicos de ascensores, salas de bombas, Sello Verde SEC, estanques de agua y red de incendio.',
      whenToUse: 'Semanalmente para anticipar vencimientos normativos con 30 días de holgura.',
      steps: [
        { title: 'Monitorear semáforo de vencimientos', detail: 'Revisa qué equipos tienen mantención próxima o vencida y programa la visita técnica.' },
        { title: 'Registrar informe y certificado', detail: 'Deja trazabilidad de fecha, técnico responsable y próxima mantención e imprime la Bitácora Oficial.' }
      ],
      legalTip: 'Art. 20° N° 1 y 3 Ley N° 21.442 + Ley 20.296 (Ascensores) + DS 66 SEC: La omisión de certificaciones conlleva multas gravísimas y responsabilidad civil.',
      commonMistake: 'Esperar a que falle una bomba impulsora o caduque el Sello Verde de gas en lugar de seguir el calendario preventivo.'
    },
    cuotas_recuperacion: {
      badge: 'GASTOS • TRABAJOS MAYORES Y CUOTAS',
      title: 'Trabajos Mayores & Recuperación de Fondos en Cuotas',
      summary: 'Controla obras de infraestructura y reparaciones de alto costo financiadas desde fondos del condominio (Fondo de Reserva o Cta. Cte.) y su reposición mes a mes en cuotas prorrateadas a los copropietarios.',
      whenToUse: 'Al ejecutar obras extraordinarias (bombas, fachadas, techumbres, portones) que se pagan de contado al proveedor pero se cobran diferidas a la comunidad.',
      steps: [
        { title: '1. Registrar el Trabajo Mayor', detail: 'Ingresa proveedor, monto pagado, factura, fondo de origen y cantidad de cuotas acordadas (2 a 36 meses).' },
        { title: '2. Verificar Inclusión Automática en Gastos Comunes', detail: 'Cada mes el motor contable incluye la cuota exacta en la colilla individual de cada unidad según su alícuota legal.' },
        { title: '3. Reposición del Fondo de Reserva', detail: 'A medida que los copropietarios pagan, el importe recaudado repone el saldo del fondo utilizado, evitando desfinanciamiento.' }
      ],
      legalTip: 'Arts. 6°, 14° y 17° Ley N° 21.442: El uso del Fondo de Reserva para obras mayores requiere acuerdo de Asamblea o Comité y debe contemplar su plan de restitución.',
      commonMistake: 'Pagar un arreglo costoso desde el Fondo de Reserva sin crear las cuotas de reposición en el gasto común, consumiendo el colchón financiero del edificio.'
    }
  },

  remuneraciones: {
    default: {
      badge: 'COMUNIDAD • RR.HH. Y CONSERJERÍA',
      title: 'Personal del Condominio, Liquidaciones, Previred y Contratos',
      summary: 'Gestión laboral completa de conserjes, mayordomos y personal de aseo contratados por la comunidad, integrada al cobro mensual de gastos comunes.',
      whenToUse: 'Del día 25 al 30 para liquidaciones y traspaso a gastos comunes; y del día 1 al 13 del mes siguiente para pagar Previred.',
      steps: [
        { title: '1. Contratos DT, 40 Horas y Pactos H. Extra', detail: 'Mantén contratos escriturados, turnos ajustados a Ley 21.561 y pactos trimestrales de horas extra si aplican.' },
        { title: '2. Emitir Liquidaciones y Traspasar a Gastos', detail: 'Genera las liquidaciones del mes y traspasa el costo total empleador (sueldos + leyes sociales) a Gastos del Período.' },
        { title: '3. Declarar en Previred (ver Guía integrada)', detail: 'Usa la Guía Paso a Paso de Previred incluida en la pestaña 3 para pagar cotizaciones antes del día 13 y obtener el F30-1 limpio.' },
        { title: '4. Finiquitos sin nulidad (Ley Bustos)', detail: 'Ante un término de contrato, sigue la Guía de Carta de Aviso + Finiquito verificando siempre 100% de imposiciones al día.' }
      ],
      legalTip: 'Ley N° 19.631 (Ley Bustos): Despedir con cotizaciones impagas obliga a seguir pagando remuneraciones íntegras hasta convalidar el pago.',
      commonMistake: 'Olvidar incluir el aporte patronal (SIS, AFC empleador y Mutual) dentro del gasto común del mes.'
    }
  },

  emision: {
    default: {
      badge: 'COMUNIDAD • CIERRE Y COBRO MENSUAL',
      title: 'Emisión de Colillas, Prorrateo y Cierre Contable del Mes',
      summary: 'Revisa la auditoría automática previa al cierre, genera la planilla de prorrateo por alícuota, emite las colillas individuales y archiva el período.',
      whenToUse: 'Una vez ingresados todos los pagos y gastos del mes (habitualmente entre el día 28 y el día 5).',
      steps: [
        { title: '1. Revisar Auditoría Pre-Cierre', detail: 'Comprueba que la suma de alícuotas cuadre al 100%, que todos los gastos tengan respaldo y que cuentes con visación del Comité.' },
        { title: '2. Emitir Cobro Mensual y Colillas', detail: 'Genera el cobro oficial calculando gasto ordinario + Fondo de Reserva + cargos individuales/convenios.' },
        { title: '3. Despachar Avisos y Archivar Período', detail: 'Envía las colillas por correo/WhatsApp con trazabilidad y, al iniciar el nuevo mes, archiva el cierre para trasladar saldos automáticamente.' }
      ],
      legalTip: 'Art. 7° y 32° Ley N° 21.442: Los gastos comunes se prorratean conforme a la alícuota de dominio establecida en el Reglamento de Copropiedad.',
      commonMistake: 'Cerrar y archivar el mes antes de terminar de conciliar los últimos pagos recibidos en la cartola bancaria.'
    }
  },

  comite: {
    default: {
      badge: 'COMUNIDAD • GOBIERNO ART. 17°',
      title: 'Comité de Administración: Reuniones, Bitácora y Tareas',
      summary: 'Canal formal de trabajo y trazabilidad con el Comité de Administración: actas de sesiones, bitácora de novedades operativas y seguimiento de acuerdos.',
      whenToUse: 'En cada reunión periódica con el Comité o cada vez que se adopte una instrucción o acuerdo operativo.',
      steps: [
        { title: 'Registrar sesiones y acuerdos en Libro de Comité', detail: 'Documenta fecha, asistentes y decisiones tomadas para respaldar tu actuar administrativo.' },
        { title: 'Controlar Tareas y Novedades', detail: 'Convierte cada encargo del Comité en tarea con estado verificable.' }
      ],
      legalTip: 'Art. 17° Ley N° 21.442: El Comité tiene la representación de la Asamblea con todas sus facultades, salvo aquellas reservadas a sesión extraordinaria.',
      commonMistake: 'Ejecutar gastos extraordinarios por instrucciones verbales informales sin dejar constancia escrita de aprobación del Comité.'
    }
  },

  asambleas: {
    default: {
      badge: 'COMUNIDAD • ASAMBLEAS LEY 21.442',
      title: 'Convocatorias, Simulador de Quórum, Consultas y Actas',
      summary: 'Prepara citaciones dentro de plazo legal, calcula en vivo el quórum por porcentaje de derechos de unidades hábiles, gestiona poderes y redacta actas.',
      whenToUse: 'Al convocar la Asamblea Ordinaria anual obligatoria, una Asamblea Extraordinaria o una Consulta por Escrito.',
      steps: [
        { title: '1. Despachar Citación Legal (5 a 15 días antes)', detail: 'Emite la citación indicando tabla, fecha, hora y modalidad conforme al Art. 19°.' },
        { title: '2. Validar Poderes y Quórum en Vivo', detail: 'Marca asistencia de unidades hábiles (al día): el simulador te indica si cumples el quórum exacto de constitución y acuerdo (Art. 15°).' },
        { title: '3. Emitir y Firmar Acta Oficial', detail: 'Genera el borrador legal para transcripción al Libro de Actas foliado dentro de los 30 días siguientes.' }
      ],
      legalTip: 'Art. 15° Ley N° 21.442: Asamblea Ordinaria se constituye con al menos el 33% de los derechos en el condominio y acuerda por mayoría absoluta de asistentes.',
      commonMistake: 'Contabilizar en el quórum de votación a unidades morosas que no se encuentran habilitadas según la ley.'
    }
  },

  comunicados: {
    default: {
      badge: 'COMUNIDAD • MURAL, ARCHIVOS Y RECLAMOS',
      title: 'Mural Digital, Biblioteca Legal, Reclamos y Multas',
      summary: 'Centraliza los avisos oficiales a residentes, la carpeta digital obligatoria del condominio (Reglamento, PES, Póliza), el buzón de tickets y las infracciones.',
      whenToUse: 'Para informar cortes/mantenciones programadas, subir documentos legales de la comunidad o responder requerimientos vecinales.',
      steps: [
        { title: 'Publicar comunicados claros en el Mural', detail: 'Clasifica por prioridad (Informativo, Importante, Urgente) y fija arriba los avisos vigentes.' },
        { title: 'Mantener al 100% la Biblioteca Legal', detail: 'Sube el Reglamento CBR, Plan de Emergencia Art. 40°, Póliza de Incendio Art. 43° y Planos.' },
        { title: 'Gestionar Reclamos con trazabilidad', detail: 'Responde cada ticket vecinal dejando constancia de fecha y solución para exhibir en rendiciones.' }
      ],
      legalTip: 'Toda aplicación de multa requiere infracción tipificada en el Reglamento y respeto al derecho a descargos.',
      commonMistake: 'Dejar reclamos vecinales por WhatsApp personal sin registrar su cierre en el sistema oficial.'
    }
  },

  certificados: {
    default: {
      badge: 'COMUNIDAD • CERTIFICADOS OFICIALES',
      title: 'Emisión de Certificados Oficiales Ley N° 21.442',
      summary: 'Emite certificados de Gastos Comunes al Día (No Deuda), Estado de Deuda para retención notarial (Art. 36°), Mudanza/Salvoconducto, Alícuota y Residencia.',
      whenToUse: 'Ante compraventas en notaría, solicitudes de mudanza o trámites bancarios de copropietarios.',
      steps: [
        { title: 'Seleccionar unidad y verificar auditoría automática', detail: 'El sistema cruza automáticamente la deuda del mes y convenios antes de habilitar el certificado correspondiente.' },
        { title: 'Emitir con Folio, Firma y Sello', detail: 'Previsualiza y descarga el certificado oficial listo para presentar en notaría o conserjería.' }
      ],
      legalTip: 'Art. 36° Ley N° 21.442: La obligación de pagar gastos comunes sigue siempre al dominio de la unidad, por lo que las notarías exigen certificado vigente.',
      commonMistake: 'Autorizar un salvoconducto de mudanza sin verificar previamente deudas de gastos comunes o multas pendientes.'
    }
  },

  traspaso: {
    default: {
      badge: 'COMUNIDAD • RENDICIÓN Y TRASPASO',
      title: 'Rendición Anual (Art. 21°) & Entrega Oficial de Comunidad',
      summary: 'Módulo de blindaje legal en 3 etapas para rendir cuenta anual ante Asamblea Ordinaria o entregar formalmente una comunidad a otro administrador o Comité.',
      whenToUse: 'Una vez al año para la Asamblea Ordinaria obligatoria, o al finalizar tu contrato de administración en un condominio.',
      steps: [
        { title: 'Etapa 1: Completar Pauta Oficial de 3 Páginas', detail: 'Usa "Autocompletar datos del sistema" para llenar los bloques A–G (o A–F anual), marca estados y descarga la Pauta foliada.' },
        { title: 'Etapa 2: Cuadrar Banco y Emitir Dossier Completo', detail: 'Verifica la cuadratura peso a peso ($0 diferencia), exporta el pack abierto CSV+JSON (F.2) e imprime el Expediente Completo en 1 PDF.' },
        { title: 'Etapa 3: Notificar, Revocar Mandatos y Archivar', detail: 'Envía la Carta de Puesta a Disposición, controla la baja de tu RUT en Banco/SII/Previred/DT/MINVU y pasa la comunidad a Archivo Histórico.' }
      ],
      legalTip: 'Arts. 20°, 21° y 87° Ley N° 21.442: Dejar constancia escrita de puesta a disposición y exigir la baja de tu RUT ante SII y bancos protege tu registro RNAC.',
      commonMistake: 'Entregar carpetas y llaves sin hacer firmar el Acta en triplicado o sin verificar que retiren tu RUT del SII y del banco.'
    },
    traspaso_pauta: {
      badge: 'TRASPASO • ETAPA 1 (PAUTA A–G)',
      title: 'Checklist Maestro de Entrega de Administración (3 Páginas)',
      summary: 'Audita los 28 antecedentes legales divididos en los bloques A al G antes de entregar la comunidad.',
      whenToUse: '15 a 30 días antes del último día de tu gestión para preparar todas las carpetas sin apuros.',
      steps: [
        { title: 'Completar Encabezado y Firmantes', detail: 'Ingresa la fecha de corte, modalidad (Física/Digital/Mixta), Comité y Administrador Entrante.' },
        { title: 'Autocompletar desde ARANPRO', detail: 'Pulsa "Autocompletar datos del sistema" y marca como "Pendiente c/Plazo" cualquier factura en tránsito indicando fecha de entrega.' },
        { title: 'Imprimir Pauta de 3 Páginas', detail: 'Previsualiza y descarga las 3 hojas Carta canónicas para firma presencial.' }
      ],
      legalTip: 'Dejar consignados expresamente los pendientes con plazo evita acusaciones de entrega incompleta.',
      commonMistake: 'Dejar casillas en blanco ambiguas sin especificar si el ítem fue entregado o no aplica al condominio.'
    },
    documentos_traspaso: {
      badge: 'TRASPASO • ETAPA 2 (CUADRATURA Y DOSSIER)',
      title: 'Cuadratura Peso a Peso, Dossier Único PDF y Exportación F.2',
      summary: 'Verifica que el dinero real en banco cuadre con los fondos contables y emite los 14 documentos oficiales de entrega.',
      whenToUse: 'El día del corte contable definitivo para imprimir el expediente de cierre.',
      steps: [
        { title: '1. Verificar Semáforo de Cuadratura ($0 diferencia)', detail: 'Ingresa el saldo exacto de cartola bancaria, caja chica y cheques en tránsito.' },
        { title: '2. Exportar Pack Abierto CSV + JSON (Bloque F.2)', detail: 'Descarga los archivos abiertos para entregárselos digitalmente a la nueva administración.' },
        { title: '3. Emitir Expediente Completo en 1 PDF', detail: 'Imprime el Dossier Foliado continuo o descarga documentos individuales desde la bandeja.' }
      ],
      legalTip: 'El Acta Oficial incluye cláusula expresa de plazo de revisión contable y baja de mandatos.',
      commonMistake: 'Entregar un Acta cuyo saldo bancario no coincide con el estado del Fondo de Reserva y Fondo Operacional.'
    },
    cierre_traspaso: {
      badge: 'TRASPASO • ETAPA 3 (MANDATOS Y CIERRE)',
      title: 'Puesta a Disposición, Baja de Mandatos y Archivo Histórico',
      summary: 'Protege tu RUT profesional después de la entrega y congela la comunidad en tu archivo histórico.',
      whenToUse: 'Antes de la cita de entrega (para notificar formalmente) y durante los 15 días posteriores a la firma.',
      steps: [
        { title: 'Enviar Carta y Mensaje de Puesta a Disposición', detail: 'Despacha por correo y WhatsApp dejando constancia formal de fecha, hora y lugar de entrega.' },
        { title: 'Controlar las 5 Bajas de Mandato', detail: 'Marca una a una cuando confirmen el retiro de tu RUT en Banco, SII (e-RUT), Previred, DT y MINVU.' },
        { title: 'Marcar como Comunidad Entregada', detail: 'Pásala a Archivo Histórico sin eliminar sus respaldos.' }
      ],
      legalTip: 'Art. 87° Ley N° 21.442: Acreditar diligencia oportuna en la entrega de antecedentes te blinda frente a reclamos infraccionales.',
      commonMistake: 'Olvidar exigir al Comité que actualice el representante ante el SII y el banco tras firmar el acta.'
    },
    anual_pauta: {
      badge: 'RENDICIÓN ANUAL • ART. 21° LEY 21.442',
      title: 'Rendición de Cuentas Anual ante Asamblea Ordinaria',
      summary: 'Prepara los 6 bloques normativos (A–F, 24 antecedentes), el Balance Ejecutivo Anual, el Presupuesto Proyectado y el Acta de Asamblea.',
      whenToUse: 'Una vez al año al convocar la Asamblea Ordinaria obligatoria de copropietarios.',
      steps: [
        { title: 'Despachar citación y balance con 5 a 15 días de anticipación', detail: 'Usa la Circular de Envío Anticipado para que los vecinos revisen respaldos antes de votar.' },
        { title: 'Exponer Balance y Presupuesto Proyectado', detail: 'Imprime el Dossier Anual y somete la cuenta a votación de unidades hábiles.' },
        { title: 'Congelar en Historial Multianual', detail: 'En la Etapa 3 guarda el acuerdo, quórum y saldos aprobados en el historial del condominio.' }
      ],
      legalTip: 'Art. 21° Ley N° 21.442: El administrador debe rendir cuenta documentada ante la Asamblea Ordinaria al menos una vez al año.',
      commonMistake: 'Citar a Asamblea Ordinaria con menos de 5 días corridos de anticipación, viciando de nulidad la convocatoria.'
    }
  },

  ajustes: {
    default: {
      badge: 'COMUNIDAD • FICHA Y CONFIGURACIÓN',
      title: 'Ajustes del Condominio, Cuenta Bancaria y Logo',
      summary: 'Administra los datos maestros del condominio: nombre legal, RUT comunitario, cuenta corriente recaudadora, porcentaje de Fondo de Reserva y logo documental.',
      whenToUse: 'Al inaugurar la comunidad en el sistema o cuando cambie la cuenta bancaria o integrantes del Comité.',
      steps: [
        { title: 'Verificar datos bancarios de recaudación', detail: 'Asegúrate de que el banco, tipo de cuenta, número y RUT coincidan con la cuenta exclusiva de la comunidad.' },
        { title: 'Configurar % de Fondo de Reserva', detail: 'Define la tasa reglamentaria (mínimo legal habitual 5%) que se aplicará en cada cierre mensual.' }
      ],
      legalTip: 'Art. 39° Ley N° 21.442: En la formación del Fondo Común de Reserva se considera un porcentaje de recargo sobre los gastos comunes.',
      commonMistake: 'Dejar el RUT o número de cuenta bancaria en blanco antes de emitir las primeras colillas de cobro.'
    }
  }
};

/**
 * Resuelve la guía contextual exacta según el área de trabajo, pestaña y sub-pestaña activa
 */
export function resolveContextualHelp({ workspace = 'comunidad', activeTab = 'resumen', activeSubTab = '' }) {
  const catalog = workspace === 'empresa' ? ENTERPRISE_HELP_CATALOG : COMMUNITY_HELP_CATALOG;
  const moduleGroup = catalog[activeTab] || Object.values(catalog)[0];
  if (!moduleGroup) return null;
  if (activeSubTab && moduleGroup[activeSubTab]) {
    return moduleGroup[activeSubTab];
  }
  return moduleGroup.default || Object.values(moduleGroup)[0];
}
