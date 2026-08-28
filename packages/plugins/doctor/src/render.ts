import type { CheckCategory, DoctorOptions, DoctorSummary } from './types.js';

export function printSummary(summary: DoctorSummary, options: DoctorOptions): void {
  const showPasses = Boolean(options.verbose && !options.summary);
  const showDetails = !options.summary;
  console.log('Deploid Doctor');
  console.log(`Project: ${summary.cwd}`);
  console.log(`Status: ${summary.ok ? 'OK' : 'ACTION NEEDED'} (${summary.totals.pass} passed, ${summary.totals.warn} warnings, ${summary.totals.fail} failures)`);
  console.log('');
  console.log('Workflow readiness:');
  for (const workflow of summary.workflows) {
    console.log(`  ${workflow.status.toUpperCase().padEnd(4, ' ')} ${workflow.title.padEnd(20, ' ')} ${String(workflow.score).padStart(3, ' ')}%`);
    if (workflow.nextAction && showDetails) console.log(`       ${workflow.nextAction}`);
  }

  const categories: Array<{ key: CheckCategory; title: string }> = [
    { key: 'project', title: 'Project' },
    { key: 'release', title: 'Release' },
    { key: 'plugins', title: 'Plugins' },
    { key: 'tooling', title: 'Tooling' },
    { key: 'workflows', title: 'Workflows' }
  ];
  for (const category of categories) {
    const rows = summary.checks.filter((check) => check.category === category.key && (showPasses || check.status !== 'pass'));
    if (rows.length === 0) continue;
    console.log('');
    console.log(`${category.title}:`);
    for (const check of rows) {
      console.log(`  ${check.status.toUpperCase().padEnd(4, ' ')} ${check.title.padEnd(22, ' ')} ${check.message}`);
      if (check.details && showDetails) console.log(`       ${check.details}`);
    }
  }
  if (summary.fixes.length > 0) {
    console.log('');
    console.log('Fixes:');
    for (const fix of summary.fixes) console.log(`  ${fix.status.toUpperCase().padEnd(7, ' ')} ${fix.title}: ${fix.message}`);
  }
}

export function renderMarkdown(summary: DoctorSummary, options: DoctorOptions): string {
  const lines = ['# Deploid Doctor', '', `- Project: \`${summary.cwd}\``, `- Status: **${summary.ok ? 'OK' : 'ACTION NEEDED'}**`, `- Totals: ${summary.totals.pass} passed, ${summary.totals.warn} warnings, ${summary.totals.fail} failures`, '', '## Workflow Readiness'];
  for (const workflow of summary.workflows) {
    lines.push(`- ${workflow.title}: ${workflow.status.toUpperCase()} (${workflow.score}%)`);
    if (workflow.nextAction && !options.summary) lines.push(`  ${workflow.nextAction}`);
  }
  for (const section of ['project', 'release', 'plugins', 'tooling', 'workflows'] as CheckCategory[]) {
    const rows = summary.checks.filter((check) => check.category === section && (!options.summary || check.status !== 'pass'));
    if (rows.length === 0) continue;
    lines.push('', `## ${section.charAt(0).toUpperCase()}${section.slice(1)}`);
    for (const row of rows) {
      lines.push(`- ${row.status.toUpperCase()} ${row.title}: ${row.message}`);
      if (row.details && !options.summary) lines.push(`  ${row.details}`);
    }
  }
  if (summary.fixes.length > 0) {
    lines.push('', '## Fixes');
    for (const fix of summary.fixes) lines.push(`- ${fix.status.toUpperCase()} ${fix.title}: ${fix.message}`);
  }
  return lines.join('\n');
}

export function renderCi(summary: DoctorSummary): string {
  const lines = [
    `DOCTOR_STATUS=${summary.ok ? 'ok' : 'action-needed'}`,
    `DOCTOR_PASSED=${summary.totals.pass}`,
    `DOCTOR_WARNINGS=${summary.totals.warn}`,
    `DOCTOR_FAILURES=${summary.totals.fail}`
  ];
  for (const workflow of summary.workflows) lines.push(`WORKFLOW_${workflow.id.toUpperCase()}=${workflow.status}:${workflow.score}`);
  return lines.join('\n');
}
