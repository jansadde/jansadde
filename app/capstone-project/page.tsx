import type { Metadata } from 'next';
import Link from '@/components/site/link';
import { getPortfolio, isAdmin } from '@/lib/server';
import { SiteShell, PageIntro, EmptyState } from '@/components/site/shared';
import { RecordBody } from '@/components/site/dossiers';
import { CapstonePresentation } from '@/components/site/capstone-presentation';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Capstone Project' };
export default async function CapstoneProject() {
  const [data, owner] = await Promise.all([getPortfolio(), isAdmin()]);
  const entry = data.entries.find(record => record.kind === 'capstone' && record.id === 'capstone-main');
  const files=[...data.documents,...data.photos].filter(file=>file.isPublic&&!file.deletedAt);
  const presentation=entry&&files.find(file=>file.mime==='application/pdf'&&(entry.primaryFileId?file.id===entry.primaryFileId:file.projectId===entry.id));
  const preview=entry&&files.find(file=>file.id===entry.previewFileId&&file.mime==='application/pdf');
  const appendix=entry&&files.find(file=>file.id===entry.supportingFileId);
  const appendixPreview=entry&&files.find(file=>file.id===entry.supportingPreviewFileId&&file.mime==='application/pdf');
  const otherFiles=files.filter(file=>![presentation?.id,preview?.id,appendix?.id,appendixPreview?.id].includes(file.id));
  const hasExtra=entry&&(otherFiles.some(file=>file.projectId===entry.id)||entry.sections?.length||entry.role||entry.result||entry.table||entry.link||entry.code||entry.image);
  return <SiteShell profile={data.profile}><main id="main"><PageIntro number="05" label="Capstone Project" title="Capstone Project" description="The final academic project and its supporting materials." /><section id="capstone-overview" className="section capstone-content">{owner && <div className="collection-owner-tools"><Link className="text-link" href="/admin?section=capstone&record=capstone-main">Edit project and files</Link></div>}{entry ? presentation?<><CapstonePresentation entry={entry} file={presentation} preview={preview} appendix={appendix} appendixPreview={appendixPreview}/>{hasExtra&&<RecordBody entry={entry} files={otherFiles} categories={data.categories} hideHeading/>}</>:<RecordBody entry={entry} files={files} categories={data.categories} /> : <EmptyState title="No public project yet" description="The owner chooses which project materials to publish." />}</section></main></SiteShell>;
}
