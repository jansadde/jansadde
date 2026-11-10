import type { Metadata } from 'next';
import { getPortfolio } from '@/lib/server';
import { SiteShell,PageIntro } from '@/components/site/shared';
import { RecordSections } from '@/components/site/dossiers';
export const dynamic='force-dynamic';export const metadata:Metadata={title:'Field Work'};
export default async function Fieldwork(){const data=await getPortfolio();return <SiteShell profile={data.profile}><main id="main"><PageIntro number="03" label="Field Work" title="Field Work" description="Observations, conversations, and evidence gathered through your own experiences. A place to connect what you learn with what you see."/><section className="section dossier-page"><RecordSections entries={data.entries.filter(e=>e.kind==='fieldwork')} files={[...data.documents,...data.photos]} categories={data.categories}/></section></main></SiteShell>}
