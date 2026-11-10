import type { Metadata } from 'next';
import Link from '@/components/site/link';
import { getPortfolio, isAdmin } from '@/lib/server';
import { SiteShell, Diamond } from '@/components/site/shared';
import { DocumentLibrary } from '@/components/site/documents';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Weekly Reports' };
export default async function WeeklyReports() {
  const [data, owner] = await Promise.all([getPortfolio(), isAdmin()]);
  const weeks = data.entries.filter(entry => entry.kind === 'weekly').sort((a, b) => a.position - b.position || a.title.localeCompare(b.title, 'en', { numeric: true }));
  return <SiteShell profile={data.profile}><main id="main"><section className="weekly-reports-heading"><h1>Weekly Reports</h1><Diamond /></section><section className="section weekly-document-list">{weeks.map((week,index) => {
    const files = data.documents.filter(file => file.projectId === week.id && ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.mime));
    return <section className="weekly-document-slot" id={week.id} key={week.id}><span id={'weekly-report-'+(index+1)} className="weekly-report-anchor" aria-hidden="true"/><div className="weekly-slot-heading"><h2>{week.title}</h2><Diamond /></div><div className="weekly-file-slot">{files.length > 0 ? <DocumentLibrary documents={files} categories={data.categories} layout="list" minimal /> : <span className="weekly-file-placeholder">PDF or Word document</span>}{owner && <Link className="weekly-upload-link" href={`/admin?section=weekly&record=${encodeURIComponent(week.id)}`}>Upload PDF or Word document</Link>}</div></section>;
  })}</section></main></SiteShell>;
}
