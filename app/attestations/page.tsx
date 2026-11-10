import type { Metadata } from 'next';
import { getPortfolio, isAdmin } from '@/lib/server';
import { attestationIds } from '@/lib/attestations';
import { SiteShell, PageIntro } from '@/components/site/shared';
import Link from '@/components/site/link';
import { AttestationCard } from '@/components/site/attestation-card';
import styles from './attestations.module.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Attestations' };
export default async function Attestations() {
  const [data, owner] = await Promise.all([getPortfolio(), isAdmin()]);
  const files = [...data.documents, ...data.photos];
  return <SiteShell profile={data.profile}><main id="main">
    <PageIntro number="A1–A4" label="Attestations" title="Attestations" description="Four perspectives on business, technology and human judgment. Each assignment brings its main work and supporting material together." />
    <section className={styles.collection}>
      {owner && <div className="collection-owner-tools"><Link className="text-link" href="/admin?section=attestation">Manage attestations</Link></div>}
      <nav className={styles.index} aria-label="Assignments">{attestationIds.map((id,index)=>{const entry=data.entries.find(item=>item.id===id);return entry&&<a key={id} href={'#'+id}><span>A{index+1}</span>{entry.title}</a>})}</nav>
      {attestationIds.map((id,index)=>{const entry=data.entries.find(item=>item.id===id);return entry&&<AttestationCard key={id} entry={entry} files={files} ordinal={index+1} />})}
    </section>
  </main></SiteShell>;
}
