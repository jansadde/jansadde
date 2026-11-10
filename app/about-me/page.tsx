import type { Metadata } from 'next';
import { getPortfolio } from '@/lib/server';
import { aboutPhotoFields } from '@/lib/defaults';
import { PageIntro, SiteShell } from '@/components/site/shared';
import { AboutCarousel } from '@/components/site/about-carousel';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'About Me', description: 'Personal photographs and a story from Sarsekbaeva Almagul.' };

export default async function AboutMe() {
  const { profile } = await getPortfolio();
  return <SiteShell profile={profile}><main id="main"><PageIntro number="01" label="About Me" title="About Me" description="A personal perspective." />
    <section className="section about-me-layout">
      <AboutCarousel photos={aboutPhotoFields.map(key => profile[key])} name={profile.name} />
      <div className="about-me-copy" id="about-story"><p className="eyebrow">THE PERSON BEHIND THE WORK</p><h2>{profile.name}</h2><p className="about-academic-group">{profile.academicGroup}</p>{profile.aboutText ? <div className="prose about-me-text">{profile.aboutText.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div> : <p className="about-me-pending">My story will be added here soon.</p>}</div>
    </section>
  </main></SiteShell>;
}
