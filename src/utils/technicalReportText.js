// Redacción base: solo describe lo registrado y no atribuye una visita o falla no confirmada.
export function technicalReportText(report = {}, inspection = {}, community = '') {
  const items = inspection.items || [];
  const recorded = items.filter(item => ['status', 'notes', 'risk', 'recommendation', 'priority', 'responsible', 'deadline'].some(key => String(item[key] || '').trim()));
  const critical = recorded.filter(item => item.status === 'Crítico').length;
  const maintenance = recorded.filter(item => item.status === 'Requiere Mantención').length;
  const good = recorded.filter(item => item.status === 'Bueno').length;
  const pending = items.filter(item => !item.status && !String(item.notes || '').trim()).length;
  const name = community ? ` de ${community}` : ' de la comunidad';
  const purpose = (report.purpose || 'revisión técnica').toLowerCase();
  const counts = [critical && `${critical} ${critical === 1 ? 'figura como crítica' : 'figuran como críticas'}`, maintenance && `${maintenance} ${maintenance === 1 ? 'requiere mantención' : 'requieren mantención'}`, good && `${good} ${good === 1 ? 'figura en buen estado' : 'figuran en buen estado'}`].filter(Boolean);
  const summary = recorded.length
    ? `Se incorporaron antecedentes para ${recorded.length} ${recorded.length === 1 ? 'partida' : 'partidas'}${counts.length ? `: ${counts.join('; ')}` : ''}. ${pending ? `Hay ${pending} ${pending === 1 ? 'partida sin estado ni observación' : 'partidas sin estado ni observaciones'}, que permanecen pendientes de evaluación. ` : ''}El detalle de cada partida permite distinguir lo observado de las medidas propuestas y facilita que el comité o la asamblea identifique las materias que necesitan revisión, seguimiento o una evaluación especializada.`
    : 'Al preparar este informe aún no se han registrado estados ni observaciones de las instalaciones. En consecuencia, las partidas incluidas se presentan como pendientes de evaluación y no es posible concluir que exista una falla ni que las instalaciones se encuentren en buen estado. El resumen se actualizará a medida que se incorporen antecedentes.';
  const recommendations = items.filter(item => String(item.recommendation || '').trim());
  const action = recommendations.length
    ? 'Las recomendaciones registradas en cada partida constituyen una base para definir un plan de trabajo. Se propone revisar su alcance, solicitar antecedentes o presupuestos cuando corresponda y acordar con la comunidad la prioridad, el responsable y el plazo de cada medida. Posteriormente, conviene dejar constancia de las decisiones, avances y verificaciones de cierre.'
    : 'Una vez completada la revisión de las partidas, se propone identificar las medidas necesarias y ordenarlas según su importancia y urgencia. El comité o la instancia que corresponda podrá evaluar antecedentes, solicitar presupuestos cuando sea pertinente y acordar responsables y plazos. Las decisiones y su avance debieran quedar registrados para facilitar su seguimiento.';
  const defaults = {
    introduction: `El presente informe técnico reúne los antecedentes registrados con motivo de ${purpose}${name}. Su propósito es ofrecer al comité, a la asamblea y a quienes intervengan en la gestión una base clara para conocer las materias revisadas y sus eventuales necesidades de atención. A partir de las observaciones consignadas, el documento busca facilitar la priorización de decisiones, la coordinación de las medidas que correspondan y el seguimiento de los acuerdos, contribuyendo al cuidado y continuidad de funcionamiento de los bienes comunes.`,
    scope: 'El alcance de este informe se limita a las instalaciones, condiciones y antecedentes expresamente individualizados en sus partidas. El estado y las observaciones corresponden a la información registrada para cada una; las partidas sin antecedentes no se consideran evaluadas. El documento no acredita por sí solo el funcionamiento integral de equipos, ni sustituye pruebas, inspecciones, informes o certificaciones de profesionales o entidades competentes cuando sean necesarios. Si se requieren verificaciones adicionales, estas deberán definirse según las características de cada instalación.',
    executiveSummary: summary,
    actionPlan: action,
    conclusion: 'Este informe busca servir como antecedente para una gestión preventiva y documentada de la comunidad. Se propone presentar los resultados al comité o a la asamblea, según corresponda, revisar las partidas pendientes y adoptar acuerdos sobre las medidas que se estimen necesarias. El seguimiento de dichos acuerdos, junto con los nuevos antecedentes, presupuestos e informes especializados que puedan obtenerse, permitirá actualizar este diagnóstico y evaluar la evolución de las instalaciones.'
  };
  return Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, String(report[key] || '').trim() || value]));
}
