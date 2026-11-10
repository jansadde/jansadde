import type { Metadata } from 'next';
import Link from '@/components/site/link';
import { getPortfolio } from '@/lib/server';
import { SiteShell, PageIntro, Diamond } from '@/components/site/shared';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Tech Code' };
export default async function TechCode() {
  const { profile } = await getPortfolio();
  return <SiteShell profile={profile}><main id="main"><PageIntro number="02" label="Tech Code" title="Tech Code" description="Projects and their supporting materials." /><section className="section tech-code-choices tech-code-single"><Link className="tech-code-choice" href="/projects"><span className="eyebrow">01</span><h2>All Project</h2><Diamond /><span className="text-link">View projects</span></Link></section></main></SiteShell>;
}
