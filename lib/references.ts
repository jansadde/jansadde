import catalog from './reference-data.json';
import workLabels from './reference-work-labels.json';
import type { ArchiveFile, SourceReference } from './types';

export const referenceGroups = ['Tiffany & LVMH', 'KazakhYuvelir', 'Business & management', 'Economy & industry', 'AI & careers'];
export const referenceTypes = ['Company source', 'Institutional source', 'Textbook', 'Research', 'Secondary source', 'Industry source'];
export const referenceStatuses = ['Source listed', 'Citation needs detail', 'Historical / unavailable'];
export const defaultReferences: SourceReference[] = catalog;
export function referenceUrlKey(value: string) {
  const url = new URL(value); url.hostname = url.hostname.replace(/^www\./, ''); url.hash = '';
  for (const key of [...url.searchParams.keys()]) if (key.toLowerCase().startsWith('utm_')) url.searchParams.delete(key);
  url.searchParams.sort(); url.pathname = url.pathname.replace(/\/$/, '') || '/';
  return url.href;
}
export function referenceWorkLabel(file: Pick<ArchiveFile, 'id' | 'name'>) {
  if(file.name==='BA2026_Capstone_Presentation_Sarsekbaeva_Almagul.pdf')return 'Capstone presentation';
  if(file.name==='Sarsekbayeva_Almagul_Executive_Summary_Report.docx')return 'Capstone Appendix — Executive Summary Report';
  if(file.name==='SARSEKBAEVA_AIB2604_AI_Declaration.docx')return 'AI Declaration';
  return (workLabels as Record<string, string>)[file.id] || file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
}

// A hidden/deleted attachment must never reveal its title or association publicly.
export function publishedReferences(references: SourceReference[], files: ArchiveFile[]) {
  const active = new Set(files.filter(file => file.isPublic && !file.deletedAt).map(file => file.id));
  return references.filter(reference => reference.isPublic && (!reference.fileIds.length || reference.fileIds.some(id => active.has(id))))
    .map(reference => ({...reference, fileIds: reference.fileIds.filter(id => active.has(id))}))
    .sort((a, b) => a.position - b.position);
}
