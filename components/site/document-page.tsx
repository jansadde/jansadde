import Link from '@/components/site/link';
import { getPortfolio, isAdmin } from '@/lib/server';
import { SiteShell, PageIntro } from '@/components/site/shared';
import { DocumentLibrary } from '@/components/site/documents';

export async function DocumentPage({ section }: { section: 'artifacts' | 'evidence' }) {
  const [data, owner] = await Promise.all([getPortfolio(), isAdmin()]);
  const artifacts = section === 'artifacts';
  const files = [...data.documents, ...data.photos].filter(file => !artifacts || file.categoryId === 'artifacts' || file.categoryId === 'deliverables' || file.projectId === 'field-gallery');
  const title = artifacts ? 'Artifacts' : 'Evidence Folder';
  return <SiteShell profile={data.profile}><main id="main"><PageIntro number={artifacts ? '03' : '04'} label={title} title={title} description={artifacts ? 'Documents, presentations, images, and selected academic materials.' : 'Supporting documents and evidence, collected in one digital archive.'} /><section id={artifacts ? "artifact-files" : "evidence-files"} className="section file-collection-page">{owner && <div className="collection-owner-tools"><Link className="text-link" href={`/admin?section=${section}`}>Manage files</Link></div>}<DocumentLibrary documents={files} categories={data.categories} layout="list" showCategories={false} /></section></main></SiteShell>;
}
