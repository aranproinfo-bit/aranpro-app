// Redacción base: solo describe lo registrado y no atribuye una visita o falla no confirmada.
export function technicalReportText(report = {}, inspection = {}, community = '') {
  const items = inspection.items || [];
  const recorded = items.filter(item => item.status || String(item.notes || '').trim());
  const critical = recorded.filter(item => item.status === 'Crítico').length;
  const maintenance = recorded.filter(item => item.status === 'Requiere Mantención').length;
  const name = community ? ` de ${community}` : ' de la comunidad';
  const purpose = (report.purpose || 'revisión técnica').toLowerCase();
  const summary = recorded.length
    ? `Se registraron antecedentes para ${recorded.length} ${recorded.length === 1 ? 'partida' : 'partidas'}${critical ? `; ${critical} con estado crítico` : ''}${maintenance ? `; ${maintenance} con mantención requerida` : ''}. El detalle y las observaciones constan en las secciones siguientes.`
    : 'A la fecha de elaboración no se han registrado observaciones ni estados de instalaciones. Las partidas pendientes deberán completarse con los antecedentes de la revisión.';
  const recommendations = items.filter(item => String(item.recommendation || '').trim());
  const action = recommendations.length
    ? 'Se recomienda revisar las acciones indicadas en cada partida, priorizarlas con la comunidad y acordar responsables y plazos antes de su ejecución.'
    : 'Las acciones, responsables y plazos se definirán con la comunidad una vez revisados los antecedentes y las necesidades de cada instalación.';
  const defaults = {
    introduction: `El presente informe técnico reúne los antecedentes registrados con motivo de ${purpose}${name}. Su objetivo es facilitar la revisión de las instalaciones, apoyar la toma de decisiones y dar seguimiento a las materias que requieran atención.`,
    scope: 'El alcance se limita a las partidas y antecedentes expresamente individualizados en este documento. Los elementos sin observaciones registradas quedan pendientes de evaluación. Este informe no reemplaza las inspecciones o certificaciones de especialistas cuando correspondan.',
    executiveSummary: summary,
    actionPlan: action,
    conclusion: 'Se propone presentar estos antecedentes al comité o a la asamblea, según corresponda, y acordar el seguimiento de las acciones que se definan. Las conclusiones podrán actualizarse cuando se disponga de nuevos antecedentes.'
  };
  return Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, String(report[key] || '').trim() || value]));
}
