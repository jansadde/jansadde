'use client';

import Link from '@/components/site/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FolderOpen, LockKeyhole, Menu, X } from 'lucide-react';
import { navigation } from '@/lib/navigation';

export function Navigation({ name, initials }: { name: string; initials: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [desktop, setDesktop] = useState('');
  const [expanded, setExpanded] = useState('');
  const menuRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setOpen(false); setDesktop(''); }, [path]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { setOpen(false); menuRef.current?.focus(); }
      if (event.key !== 'Tab') return;
      const items = Array.from(document.querySelectorAll<HTMLElement>('#mobile-menu a, #mobile-menu button'));
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); };
  }, [open]);

  function active(href: string) {
    if (href === '/') return path === '/';
    if (href === '/tech-code') return path === href || path.startsWith('/projects') || path === '/fieldwork';
    return path === href;
  }

  return <>
    <a className="skip-link" href="#main">Skip to main content</a>
    <div className="utility-bar"><span>PERSONAL & ACADEMIC PORTFOLIO</span><div><Link href="/evidence-folder">Evidence Folder</Link><i>·</i><Link href="/admin">Owner dashboard</Link></div></div>
    <header className="site-header full-site-header">
      <Link className="brand" href="/" aria-label={`${name} — home`}><span className="monogram">{initials || 'SA'}<span>·</span></span><span className="brand-copy">PERSONAL<br />ATELIER</span></Link>
      <nav className="desktop-nav" aria-label="Main navigation" onKeyDown={event => {
        if (event.key === 'Escape') {
          const group = (event.target as HTMLElement).closest('.nav-group');
          setDesktop('');
          group?.querySelector<HTMLButtonElement>('.nav-group-main > button')?.focus();
        }
      }}>
        {navigation.map((group, index) => {
          const submenuId = `desktop-submenu-${index}`;
          return <div key={group.href} className={`nav-group ${active(group.href) ? 'active' : ''}`} onMouseLeave={() => setDesktop('')} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDesktop(''); }}>
            <div className="nav-group-main"><Link href={group.href} onMouseEnter={() => setDesktop(group.items.length ? group.href : '')} aria-current={active(group.href) ? 'page' : undefined} onClick={() => setDesktop('')}>{group.label}</Link>{group.items.length > 0 && <button className="submenu-toggle" aria-label={`Show ${group.label} submenu`} aria-expanded={desktop === group.href} aria-controls={submenuId} onClick={() => setDesktop(desktop === group.href ? '' : group.href)}><span aria-hidden="true">{desktop === group.href ? '−' : '+'}</span></button>}</div>
            {group.items.length > 0 && desktop === group.href && <div className="nav-dropdown" id={submenuId}>{group.items.map(item => <Link key={item.href} href={item.href} onClick={() => setDesktop('')}>{item.label}</Link>)}</div>}
          </div>;
        })}
      </nav>
      <Link href="/evidence-folder" className="header-contact"><FolderOpen size={15} />Archive</Link>
      <button ref={menuRef} className="mobile-toggle" aria-label="Open menu" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)}><Menu /></button>
    </header>
    {open && <div className="mobile-menu" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation">
      <div className="mobile-menu-head"><span className="eyebrow">{name}</span><button ref={closeRef} aria-label="Close menu" onClick={() => { setOpen(false); menuRef.current?.focus(); }}><X /></button></div>
      <nav aria-label="Mobile navigation">{navigation.map((group, index) => {
        const submenuId = `mobile-submenu-${index}`;
        return <div className="mobile-nav-group" key={group.href}>
          <div className="mobile-nav-main"><Link href={group.href} aria-current={active(group.href) ? 'page' : undefined} onClick={() => setOpen(false)}><small>{String(index + 1).padStart(2, '0')}</small>{group.label}</Link>{group.items.length > 0 && <button className="submenu-toggle" aria-label={`Expand ${group.label}`} aria-expanded={expanded === group.href} aria-controls={submenuId} onClick={() => setExpanded(expanded === group.href ? '' : group.href)}><span aria-hidden="true">{expanded === group.href ? '−' : '+'}</span></button>}</div>
          {group.items.length > 0 && expanded === group.href && <div className="mobile-submenu" id={submenuId}>{group.items.map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>)}</div>}
        </div>;
      })}<Link className="mobile-archive-link" href="/evidence-folder" onClick={() => setOpen(false)}>Evidence Folder</Link></nav>
      <Link className="owner-link" href="/admin"><LockKeyhole size={14} /> Owner dashboard</Link>
    </div>}
  </>;
}
