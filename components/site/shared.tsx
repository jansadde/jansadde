import Link from '@/components/site/link';
import { Navigation } from './navigation';
import { Reveals } from './reveal';
import { footerNavigation } from '@/lib/navigation';
import { Diamond } from './diamond';
export { Diamond } from './diamond';
import type { Entry, Profile } from '@/lib/types';

export function SiteShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const emails = [profile.email, profile.secondaryEmail].filter(Boolean);
  return <>
    <Navigation name={profile.name} initials={profile.initials} />
    {children}
    <footer className="site-footer restored-footer" id="contact">
      <nav className="footer-directory" aria-label="Site directory">{footerNavigation.map(group => <div key={group.href}><Link href={group.href}>{group.label}</Link>{group.items.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</div>)}</nav>
      <div className="footer-emails" id="footer-emails" aria-label="Email addresses">{emails.map(email => <a key={email} href={`mailto:${email}`}>{email}</a>)}</div>
      <div className="footer-bottom"><Link className="footer-name" href="/">{profile.name}</Link><span>{profile.academicGroup}</span><Link className="owner-link" href="/admin">Owner dashboard</Link><span>© {new Date().getFullYear()}</span></div>
    </footer>
    <Reveals />
  </>;
}

export function Photo({ src, alt, className = '', priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return <img className={`site-photo ${className}`} src={src} alt={alt} width={800} height={1100} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" />;
}

export function TextLink({ href, children, light = false }: { href: string; children: React.ReactNode; light?: boolean }) {
  return <Link className={`text-link ${light ? 'light' : ''}`} href={href}>{children}</Link>;
}

export function PageIntro({number,label,title,description}:{number:string;label:string;title:string;description:string}){return <section className="page-intro"><div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>{label}</span></div><div className="intro-grid"><div><p className="eyebrow"><span className="gold">{number}</span> / {label}</p><h1>{title}</h1></div><p className="intro-description">{description}</p></div><Diamond className="intro-diamond"/></section>}
export function ExampleBadge(){return <span className="example-badge">Editable example</span>}
export function ProjectGrid({entries}:{entries:Entry[]}){return <div className="project-grid">{entries.map((e,i)=><Link href={'/projects/'+e.id} className="project-card" key={e.id} data-reveal><div className="project-image"><Photo src={e.image||'/images/architecture.jpg'} alt={e.isExample?'Illustrative project cover':e.title}/><span className="project-index">0{i+1}</span><span className="project-open"><span>View</span></span></div><div className="project-meta"><span>{e.category}</span><span>{e.period}</span></div><h3>{e.title}</h3><p>{e.subtitle}</p>{e.isExample&&<ExampleBadge/>}</Link>)}</div>}
export function EmptyState({title,description}:{title:string;description:string}){return <div className="empty-state"><Diamond/><h3>{title}</h3><p>{description}</p></div>}
export function SectionTitle({number,label,title,href,linkText}:{number:string;label:string;title:string;href?:string;linkText?:string}){return <div className="section-title" data-reveal><div><p className="eyebrow"><span>{number}</span> / {label}</p><h2>{title}</h2></div>{href&&<TextLink href={href}>{linkText||'Explore all'}</TextLink>}</div>}
