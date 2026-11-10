import type { Metadata } from 'next';
import { getPortfolio } from '@/lib/server';
import { defaultSproutProject } from '@/lib/defaults';
import { SiteShell, Diamond, EmptyState } from '@/components/site/shared';
import Link from '@/components/site/link';
import styles from './showcase.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'All Project' };

export default async function Projects() {
  const { profile, entries } = await getPortfolio();
  const project = entries.find(entry => entry.kind === 'project' && entry.id === defaultSproutProject.id);
  return <SiteShell profile={profile}><main id="main">
    <section className={styles.hero}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/tech-code">Tech Code</Link><span>/</span><span>All Project</span></nav>
      <div className={styles.heroContent}><div><p className={styles.eyebrow}>ALL PROJECT</p><h1>{project?.title || 'All Project'}</h1>{project?.subtitle && <p className={styles.subtitle}>{project.subtitle}</p>}</div><span className={styles.projectNumber} aria-hidden="true">01</span></div>
      <div className={styles.heroBottom}><span>{project ? 'STUDENT PROJECT · WORKING PROTOTYPE' : 'PROJECT SHOWCASE'}</span><Diamond /></div>
    </section>
    <section className={styles.showcase}>
      {project ? <div className={styles.presentation}>
        {project.image && <figure className={styles.posterFrame}><figcaption><span>{project.title}</span><span>Project presentation</span></figcaption><img className={styles.poster} src={project.image} alt={`${project.title} project presentation`} width={1122} height={1402} loading="eager" decoding="async" /></figure>}
        {project.link && <div className={styles.action}><a className={styles.visitButton} href={project.link} target="_blank" rel="noopener noreferrer">Visit website</a></div>}
      </div> : <EmptyState title="No public project yet" description="The owner chooses which project materials to publish." />}
    </section>
  </main></SiteShell>;
}
