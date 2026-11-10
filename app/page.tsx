import type { Metadata } from 'next';
import Link from '@/components/site/link';
import { getPortfolio } from '@/lib/server';
import { directory } from '@/lib/navigation';
import { SiteShell, Diamond, Photo, SectionTitle } from '@/components/site/shared';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Sarsekbaeva Almagul', description: 'Sarsekbaeva Almagul · AIB 2604. Personal website and company studies.' };

export default async function Home() {
  const { profile } = await getPortfolio();
  const parts = profile.name.trim().split(/\s+/);
  const surname = parts.shift();
  const rest = parts.join(' ');
  const heroPhoto = profile.heroPhoto || profile.biographyPhoto;
  const illustrative = heroPhoto.startsWith('/images/') && !['/images/almagul-home.jpg', '/images/almagul-home-portrait.jpg'].includes(heroPhoto);
  return <SiteShell profile={profile}>
    <main id="main">
      <section className={`identity-hero ${!heroPhoto ? 'identity-hero-no-photo' : ''}`}>
        <div className="identity-hero-copy">
          <p className="eyebrow portfolio-eyebrow">E PORTFOLIO</p>
          <h1 aria-label={profile.name}><span>{surname}</span>{rest && <span className="identity-given-name">{rest}</span>}</h1>
          <p className="academic-group">{profile.academicGroup}</p>
          <div className="identity-actions"><Link className="button button-ivory" href="/companies">Explore companies</Link></div>
        </div>
        {heroPhoto && <figure className="identity-hero-visual">
          <div className="identity-photo-frame"><Photo src={heroPhoto} alt={illustrative ? 'Illustrative architectural study in light and shadow' : `${profile.name} — photograph provided by the owner`} priority /><Diamond className="photo-diamond" />{profile.heroPhoto && profile.biographyPhoto && profile.biographyPhoto !== profile.heroPhoto && <div className="identity-supporting-photo"><Photo src={profile.biographyPhoto} alt={profile.biographyPhoto.startsWith('/images/') ? 'Illustrative landscape study' : 'Supporting photograph provided by the owner'} /></div>}</div>
          <figcaption>{illustrative ? 'AN ILLUSTRATIVE STUDY IN FORM & LIGHT' : profile.name.toUpperCase()}</figcaption>
        </figure>}
        <div className="identity-hero-bottom"><span>{profile.academicGroup}</span><Link href="/companies">Tiffany & Co. <span className="identity-separator">/</span> Kazakhyuvelir</Link></div>
      </section>
      <section className="section portfolio-directory" id="portfolio">
        <SectionTitle number="01—06" label="THE PORTFOLIO, CHAPTER BY CHAPTER" title="A considered collection." />
        <p className="directory-intro">Explore company research, projects, artifacts, supporting evidence, and weekly reports.</p>
        <div className="directory-grid">{directory.map(item => <Link className="directory-card" key={item.href} href={item.href} data-reveal><div><span className="directory-number">{item.number}</span></div><p className="eyebrow">{item.eyebrow}</p><h3>{item.title}</h3><p>{item.description}</p><span className="directory-open">Explore chapter</span></Link>)}</div>
      </section>
    </main>
  </SiteShell>;
}
