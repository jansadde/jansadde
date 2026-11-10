import type { Metadata } from 'next';
import Link from '@/components/site/link';
import { getPortfolio, isAdmin } from '@/lib/server';
import { SiteShell, PageIntro } from '@/components/site/shared';
import { DeclarationRecord } from '@/components/site/declaration-record';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'AI Declaration'};
export default async function AIDeclaration() {
  const [data,owner]=await Promise.all([getPortfolio(),isAdmin()]);
  const entry=data.entries.find(item=>item.id==='ai-declaration');
  return <SiteShell profile={data.profile}><main id="main"><PageIntro number="07" label="AI use & human judgment" title={entry?.title||'AI Declaration'} description={entry?.description||'AI use and verification record.'}/>
    <section className="section">{owner&&<div className="collection-owner-tools"><Link className="text-link" href="/admin?section=declaration&record=ai-declaration">Manage declaration</Link></div>}
      {entry?.declaration?<DeclarationRecord entry={entry} files={[...data.documents,...data.photos]}/>:<p>The declaration is not published yet.</p>}
    </section></main></SiteShell>;
}
