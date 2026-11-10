import { notFound } from 'next/navigation';
import { getPortfolio } from '@/lib/server';
import { SiteShell, TextLink, ExampleBadge, Diamond } from '@/components/site/shared';
import { RecordBody } from '@/components/site/dossiers';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { entries } = await getPortfolio();
  return { title: entries.find(entry => entry.id === id && entry.kind === 'project')?.title || 'Project' };
}
export default async function Project({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, entries, documents, photos, categories } = await getPortfolio();
  const entry = entries.find(record => record.id === id && record.kind === 'project');
  if (!entry) notFound();
  return <SiteShell profile={profile}><main id="main"><section className="project-detail-intro section"><Diamond className="project-detail-diamond" /><TextLink href="/projects">All Project</TextLink><p className="eyebrow">{entry.category}{entry.period && ` / ${entry.period}`}</p><h1>{entry.title}</h1>{entry.subtitle && <p className="lead">{entry.subtitle}</p>}{entry.isExample && <ExampleBadge />}</section><section className="section project-detail-record"><RecordBody entry={entry} files={[...documents, ...photos]} categories={categories} hideHeading /></section></main></SiteShell>;
}
