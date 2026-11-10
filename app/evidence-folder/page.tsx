import type { Metadata } from 'next';
import Link from '@/components/site/link';
import { getPortfolio, isAdmin } from '@/lib/server';
import { SiteShell, PageIntro } from '@/components/site/shared';
import { ReferenceLibrary } from '@/components/site/reference-library';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Evidence Folder' };
export default async function EvidenceFolder() {
  const [data, owner] = await Promise.all([getPortfolio(), isAdmin()]);
  return <SiteShell profile={data.profile}><main id="main">
    <PageIntro number="04" label="Sources & references" title="Evidence Folder" description="The sources behind the work. Company publications, business literature, research and industry resources, brought together in one place." />
    <section className="section" id="sources-references"><span id="evidence-files" aria-hidden="true" />
      {owner && <div className="collection-owner-tools"><Link className="text-link" href="/admin?section=evidence">Manage references</Link></div>}
      <ReferenceLibrary references={data.references} files={[...data.documents, ...data.photos]} />
    </section>
  </main></SiteShell>;
}
