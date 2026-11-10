'use client';
import { useEffect, useRef, useState } from 'react';
import Link from '@/components/site/link';
import { LayoutDashboard, UserRound, Building2, Layers, BookOpen, Microscope, FolderOpen, Mail, Plus, LockKeyhole, Globe, Check, X, Save, Tags, Menu, FileText } from 'lucide-react';
import type { AdminData, Entry, EntryKind, Profile, ArchiveFile, Category } from '@/lib/types';
import { aboutPhotoFields, defaultProfile, protectedCategoryIds } from '@/lib/defaults';
import { fileDate } from './documents';
import { DocumentManager } from './document-manager';
import { ReferenceEditor } from './reference-editor';
import { DeclarationFields } from './declaration-editor';

type Section = 'declaration' | 'dashboard' | 'profile' | 'about' | 'company' | 'project' | 'fieldwork' | 'artifacts' | 'attestation' | 'evidence' | 'capstone' | 'weekly' | 'documents' | 'categories' | 'messages';
const sections: [Section, string, typeof UserRound][] = [
  ['dashboard', 'Overview', LayoutDashboard], ['profile', 'Profile', UserRound], ['about', 'About Me', UserRound], ['company', 'Companies', Building2],
  ['project', 'All Project', Layers], ['fieldwork', 'Field Work', Microscope], ['artifacts', 'Artifacts', FolderOpen],
  ['declaration', 'AI Declaration', FileText], ['attestation', 'Attestations', FileText], ['evidence', 'Evidence Folder', FolderOpen], ['capstone', 'Capstone Project', FileText], ['weekly', 'Weekly Reports', BookOpen],
  ['documents', 'All Documents', FolderOpen], ['categories', 'Categories', Tags], ['messages', 'Messages', Mail],
];
const titles = Object.fromEntries(sections.map(([id, title]) => [id, title])) as Record<Section, string>;
export async function api<T = unknown>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json() as { error?: string };
  if (!response.ok) throw new Error(data.error || 'The action could not be completed.');
  return data as T;
}
export function AdminPanel({ initialData, displayName }: { initialData: AdminData; displayName: string }) {
  const [data, setData] = useState(initialData);
  const [section, setSection] = useState<Section>('dashboard');
  const [recordId, setRecordId] = useState('');
  const [notice, setNotice] = useState(''); const [error, setError] = useState('');
  const [mobile, setMobile] = useState(false); const [busy, setBusy] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const query = new URLSearchParams(window.location.search);
      const requested = query.get('section');
      if (sections.some(([id]) => id === requested)) setSection(requested as Section);
      setRecordId(query.get('record') || '');
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  async function refresh() { setData(await api<AdminData>('/api/admin')); }
  async function run(action: () => Promise<unknown>, message = 'Changes saved') {
    setBusy(true); setError('');
    try { await action(); await refresh(); setNotice(message); if (noticeTimer.current) clearTimeout(noticeTimer.current); noticeTimer.current = setTimeout(() => setNotice(''), 5000); return true; }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Your changes could not be saved.'); return false; }
    finally { setBusy(false); }
  }
  function go(next: Section) { setSection(next); setRecordId(''); setError(''); setMobile(false); window.history.replaceState(null, '', '/admin?section=' + next); window.scrollTo({ top: 0, behavior: 'instant' }); }
  const unread = data.messages.filter(message => !message.isRead).length;
  const allFiles = [...data.documents, ...data.photos];
  const manager = { files: allFiles, categories: data.categories, records: data.entries, trash: data.trash, onChanged: refresh };
  const saveEntry = (entry: Entry) => run(() => api('/api/admin/entries', 'PUT', entry));
  const deleteEntry = (id: string) => run(() => api('/api/admin/entries', 'DELETE', { id }), 'Record deleted');
  return <div className="admin-layout">
    <aside className={'admin-sidebar ' + (mobile ? 'mobile-open' : '')}>
      <Link className="admin-brand" href="/"><span>{data.profile.initials || 'SA'}<i>·</i></span><small>PERSONAL<br />ATELIER</small></Link>
      <div className="admin-sidebar-title">WEBSITE MANAGEMENT</div>
      <nav aria-label="Dashboard sections">{sections.map(([id, title, Icon]) => <button key={id} className={section === id ? 'selected' : ''} aria-current={section === id ? 'page' : undefined} onClick={() => go(id)}><Icon size={18} strokeWidth={1.5} />{title}{id === 'messages' && unread > 0 && <span className="unread-count">{unread}</span>}</button>)}</nav>
      <div className="admin-sidebar-bottom"><span><LockKeyhole size={14} /> Owner access only</span><a href="/signout-with-chatgpt?return_to=%2Fadmin" target="_top">Sign out</a></div>
    </aside>
    <div className="admin-main">
      <header className="admin-topbar"><button className="admin-menu-button icon-button" aria-label={mobile ? 'Close menu' : 'Open menu'} onClick={() => setMobile(!mobile)}>{mobile ? <X /> : <Menu />}</button><span>Owner dashboard / {titles[section]}</span><Link href="/" target="_blank" className="text-link">View website</Link></header>
      <main id="main" className="admin-content">
        <div className="admin-page-heading"><div><p className="eyebrow">PERSONAL ATELIER / {section === 'dashboard' ? 'OVERVIEW' : 'EDITOR'}</p><h1>{titles[section]}</h1></div><span className="admin-avatar" title={displayName}>{displayName.slice(0, 1).toUpperCase()}</span></div>
        {error && <div className="admin-alert error" role="alert">{error}<button aria-label="Dismiss notification" onClick={() => setError('')}><X size={16} /></button></div>}
        {notice && <div className="admin-toast" role="status"><Check size={18} />{notice}</div>}
        {section === 'dashboard' && <>
          <div className="admin-welcome"><div><span className="eyebrow">YOUR WEBSITE</span><h2>Your work,<br /><em>in your hands.</em></h2><p>Manage company profiles, academic projects, and your existing documents.</p><button className="button button-green" onClick={() => go('weekly')}>Open Weekly Reports</button></div><div className="welcome-facet" aria-hidden="true">◇</div></div>
          <div className="dashboard-stats">{[['Documents', allFiles.length, FolderOpen, 'documents'], ['Companies', data.entries.filter(entry => entry.kind === 'company').length, Building2, 'company'], ['Weekly reports', data.entries.filter(entry => entry.kind === 'weekly').length, BookOpen, 'weekly'], ['New messages', unread, Mail, 'messages']].map(([title, count, Icon, id]) => { const I = Icon as typeof FolderOpen; return <button key={String(title)} onClick={() => go(id as Section)}><I size={22} strokeWidth={1} /><strong>{String(count).padStart(2, '0')}</strong><span>{String(title)}</span></button>; })}</div>
          <section className="admin-card privacy-note"><LockKeyhole size={26} strokeWidth={1} /><h3>Choose what to share</h3><p>New uploads stay private until you explicitly make them public. Deleted files remain recoverable in the trash.</p><button className="text-link" onClick={() => go('documents')}>Manage all files</button></section>
        </>}
        {section === 'profile' && <ProfileEditor key={JSON.stringify(data.profile)} profile={data.profile} photos={data.photos} busy={busy} onSave={profile => run(() => api('/api/admin/profile', 'PUT', profile))} />}
        {section === 'about' && <AboutMeEditor key={JSON.stringify(data.profile)} profile={data.profile} photos={data.photos} busy={busy} onSave={profile => run(() => api('/api/admin/profile', 'PUT', profile))} />}
        {['company', 'project', 'fieldwork', 'capstone', 'attestation', 'declaration'].includes(section) && <EntryManager key={section + recordId} kind={section as EntryKind} entries={data.entries.filter(entry => entry.kind === section)} initialRecord={recordId} busy={busy} onSave={saveEntry} onDelete={deleteEntry} manager={manager} />}
        {section === 'weekly' && <WeeklyManager entries={data.entries.filter(entry => entry.kind === 'weekly')} initialRecord={recordId} busy={busy} onSave={saveEntry} onDelete={deleteEntry} manager={manager} />}
        {section === 'artifacts' && <DocumentManager key="artifacts" {...manager} fixedCategoryId="artifacts" title="Artifacts" />}
        {section === 'evidence' && <ReferenceEditor references={data.references} files={[...allFiles,...data.trash]} busy={busy} onSave={references=>run(()=>api('/api/admin/references','PUT',{references}),'References saved')} />}
        {section === 'documents' && <DocumentManager key="all-documents" {...manager} title="All documents and images" onSetHomepagePhoto={async file => { if (!file.isPublic) throw new Error('Make the image public before using it on Home.'); const saved = await run(() => api('/api/admin/profile', 'PUT', { ...data.profile, heroPhoto: '/api/files/' + file.id }), 'Homepage image updated'); if (!saved) throw new Error('The homepage image could not be saved.'); }} />}
        {section === 'categories' && <CategoriesEditor categories={data.categories} busy={busy} run={run} />}
        {section === 'messages' && <section className="admin-card inbox">{data.messages.length ? data.messages.map(message => <article className={message.isRead ? 'read' : 'unread'} key={message.id}><div className="message-meta"><h3>{message.name}</h3><span>{fileDate(message.createdAt)}</span></div><a href={'mailto:' + message.email}>{message.email}</a><p className="prose">{message.message}</p><button className="text-link" disabled={busy} onClick={() => run(() => api('/api/admin/messages', 'PATCH', { id: message.id, isRead: !message.isRead }), message.isRead ? 'Marked as unread' : 'Marked as read')}>{message.isRead ? 'Mark as unread' : 'Mark as read'}<Check size={15} /></button></article>) : <AdminEmpty icon={Mail} title="Conversations begin here" text="Previously received messages appear here." />}</section>}
      </main>
      <footer className="admin-footer">PERSONAL ATELIER <span>Care in every detail.</span></footer>
    </div>
  </div>;
}
function AdminEmpty({ icon: Icon, title, text }: { icon: typeof Mail; title: string; text: string }) { return <div className="admin-empty"><Icon size={38} strokeWidth={1} /><h3>{title}</h3><p>{text}</p></div>; }
type FileManagerContext = { files: ArchiveFile[]; categories: Category[]; records: Entry[]; trash: ArchiveFile[]; onChanged: () => Promise<void> };
function blankEntry(kind: EntryKind, position = 0): Entry { return { id: crypto.randomUUID(), kind, title: '', subtitle: '', description: '', period: '', category: '', role: '', result: '', image: '', isPublic: false, isExample: false, position, sections: [], link: '', code: '' }; }
function EntryManager({ kind, entries, initialRecord, busy, onSave, onDelete, manager }: { kind: EntryKind; entries: Entry[]; initialRecord: string; busy: boolean; onSave: (entry: Entry) => Promise<boolean>; onDelete: (id: string) => Promise<boolean>; manager: FileManagerContext }) {
  const fixed = kind === 'company' || kind === 'capstone' || kind === 'attestation' || kind === 'declaration';
  const initial = entries.find(entry => entry.id === initialRecord) || (fixed ? entries[0] : null);
  const [editing, setEditing] = useState<Entry | null>(initial || null);
  const [selectedId, setSelectedId] = useState(initial?.id || '');
  const [deleting, setDeleting] = useState('');
  const selected = entries.find(entry => entry.id === selectedId);
  return <>
    {!fixed && <div className="admin-section-actions"><button className="button button-green" onClick={() => { setSelectedId(''); setEditing(blankEntry(kind, entries.length)); }}><Plus size={16} />Add record</button></div>}
    <section className="admin-card entry-list">{entries.length ? entries.map(entry => <article key={entry.id}><div className="entry-list-copy"><span className={'visibility-badge ' + (entry.isPublic ? 'public' : '')}>{entry.isPublic ? <Globe size={12} /> : <LockKeyhole size={12} />}{entry.isPublic ? 'Public' : 'Private'}</span><h3>{entry.title}</h3></div><div className="entry-list-actions"><button className="text-link" onClick={() => { setEditing(entry); setSelectedId(entry.id); }}>Edit</button>{!fixed && <button className="text-link danger" disabled={busy} onClick={() => setDeleting(entry.id)}>Delete</button>}</div>{deleting === entry.id && <div className="delete-confirm"><span>Delete this record? Its files remain in All Documents.</span><button disabled={busy} onClick={async () => { if (await onDelete(entry.id)) { setDeleting(''); if (selectedId === entry.id) { setSelectedId(''); setEditing(null); } } }}>Delete record</button><button onClick={() => setDeleting('')}>Cancel</button></div>}</article>) : <AdminEmpty icon={Layers} title="Your records" text="Add your first record to begin." />}</section>
    {editing && <form className="admin-card entry-form" onSubmit={async event => { event.preventDefault(); if (await onSave(editing)) { setSelectedId(editing.id); setEditing(null); } }}>
      <div className="panel-title"><h3>{kind === 'company' ? 'Company profile' : kind === 'capstone' ? 'Capstone Project' : 'Edit record'}</h3><button type="button" className="icon-button" aria-label="Close record editor" onClick={() => setEditing(null)}><X size={18} /></button></div>
      <label>Title<input required maxLength={200} value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })} /></label>
      <label>Subtitle<input maxLength={200} value={editing.subtitle} onChange={event => setEditing({ ...editing, subtitle: event.target.value })} /></label>
      <label>Description<textarea rows={5} maxLength={12000} value={editing.description} onChange={event => setEditing({ ...editing, description: event.target.value })} /></label>
      <div className="form-grid"><label>Cover image<select value={editing.image} onChange={event => setEditing({ ...editing, image: event.target.value })}><option value="">No image</option>{editing.image && !manager.files.some(file => '/api/files/' + file.id === editing.image) && <option value={editing.image}>Current image</option>}{manager.files.filter(file => file.isPublic && file.mime.startsWith('image/')).map(file => <option key={file.id} value={'/api/files/' + file.id}>{file.name}</option>)}</select></label><label>Display order<input type="number" min={0} max={999} value={editing.position} onChange={event => setEditing({ ...editing, position: Number(event.target.value) })} /></label></div>
      {kind === 'project' && <label>Your role<input value={editing.role} onChange={event => setEditing({ ...editing, role: event.target.value })} /></label>}
      <label>{kind === 'company' ? 'Additional information' : 'Outcome or notes'}<textarea rows={3} value={editing.result} onChange={event => setEditing({ ...editing, result: event.target.value })} /></label>
      {(kind==='attestation'||kind==='declaration'||kind==='capstone')&&<FileRoleSelectors entry={editing} files={manager.files} onChange={setEditing}/>}
      {kind==='declaration'?<DeclarationFields entry={editing} onChange={setEditing}/>:<RecordFields key={editing.id} entry={editing} onChange={setEditing} />}
      {kind === 'company' && <CompanyResearchFields entry={editing} onChange={setEditing} />}
      <div className="editor-checkboxes"><label className="checkbox-label"><input type="checkbox" checked={editing.isPublic} onChange={event => setEditing({ ...editing, isPublic: event.target.checked })} /><span>Publish on the website</span></label><label className="checkbox-label"><input type="checkbox" checked={editing.isExample} onChange={event => setEditing({ ...editing, isExample: event.target.checked })} /><span>Label as an editable placeholder</span></label></div>
      <button className="button button-green" disabled={busy} type="submit"><Save size={16} />{busy ? 'Saving…' : 'Save record'}</button>
    </form>}
    {selected && <DocumentManager key={selected.id} {...manager} title={selected.title + ' files'} fixedProjectId={selected.id} />}
  </>;
}
function FileRoleSelectors({entry,files,onChange}:{entry:Entry;files:ArchiveFile[];onChange:(entry:Entry)=>void}) {
 const fields=entry.kind==='capstone'?['primaryFileId','supportingFileId','previewFileId','supportingPreviewFileId'] as const:entry.kind==='declaration'?['primaryFileId','previewFileId'] as const:['primaryFileId','supportingFileId','previewFileId'] as const;
 return <div className="form-grid">{fields.map(field=>{
  const label=field==='primaryFileId'?(entry.kind==='declaration'?'Declaration document':entry.kind==='capstone'?'Featured presentation':'Main artifact'):field==='previewFileId'?'PDF preview':field==='supportingPreviewFileId'?'Appendix PDF preview':entry.id==='attestation-a2'?'Script':'Appendix';
  const pdfOnly=field==='previewFileId'||field==='supportingPreviewFileId';
  return <label key={field}>{label}<select aria-label={label} value={entry[field]||''} onChange={event=>onChange({...entry,[field]:event.target.value})}><option value="">No file selected</option>{files.filter(file=>!file.deletedAt&&(!pdfOnly||file.mime==='application/pdf')).map(file=><option key={file.id} value={file.id}>{file.name}{file.isPublic?'':' (private)'}</option>)}</select></label>;
 })}</div>;
}
function WeeklyManager({ entries, initialRecord, busy, onSave, onDelete, manager }: { entries: Entry[]; initialRecord: string; busy: boolean; onSave: (entry: Entry) => Promise<boolean>; onDelete: (id: string) => Promise<boolean>; manager: FileManagerContext }) {
  const [editing, setEditing] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState('');
  useEffect(() => { if (initialRecord) document.getElementById('record-' + initialRecord)?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, [initialRecord]);
  const ordered = [...entries].sort((a, b) => a.position - b.position);
  return <>
    <div className="admin-section-actions"><button className="button button-green" onClick={() => { const position = Math.max(0, ...entries.map(entry => entry.position)) + 1; setEditing({ ...blankEntry('weekly', position), title: 'Weekly Report ' + position }); }}><Plus size={16} />Add weekly report</button></div>
    {editing && <form className="admin-card" onSubmit={async event => { event.preventDefault(); if (await onSave(editing)) setEditing(null); }}><label>Record title<input required maxLength={200} value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })} /></label><label className="checkbox-label"><input type="checkbox" checked={editing.isPublic} onChange={event => setEditing({ ...editing, isPublic: event.target.checked })} /><span>Publish record</span></label><div className="editor-save"><button type="button" className="text-link" onClick={() => setEditing(null)}>Cancel</button><button className="button button-green" disabled={busy} type="submit">Save record</button></div></form>}
    {ordered.map(entry => <section className="weekly-admin-record" id={'record-' + entry.id} key={entry.id}><div className="panel-title"><h2>{entry.title}</h2><div><span className={'visibility-badge ' + (entry.isPublic ? 'public' : '')}>{entry.isPublic ? 'Public' : 'Private'}</span><button className="text-link" onClick={() => setEditing(entry)}>Edit title</button><button className="text-link danger" disabled={busy} onClick={() => setDeleting(entry.id)}>Delete record</button></div></div>{deleting === entry.id && <div className="admin-card delete-confirm"><span>Delete this record? Its files remain in All Documents.</span><button disabled={busy} onClick={async () => { if (await onDelete(entry.id)) setDeleting(''); }}>Delete record</button><button onClick={() => setDeleting('')}>Cancel</button></div>}<DocumentManager {...manager} fixedProjectId={entry.id} reportOnly title="Uploaded files" /></section>)}
  </>;
}
function CompanyResearchFields({ entry, onChange }: { entry: Entry; onChange: (entry: Entry) => void }) {
  const groups = [
    ['facts', 'Company facts', ['label', 'value']], ['timeline', 'Development timeline', ['year', 'title', 'body']],
    ['gallery', 'Visual gallery', ['src', 'alt', 'caption', 'sourceUrl']], ['sources', 'Sources and references', ['title', 'url']],
  ] as const;
  const labels: Record<string, string> = { label: 'Label', value: 'Value', year: 'Year', title: 'Title', body: 'Text', src: 'Image path or HTTPS URL', alt: 'Alternative text', caption: 'Caption', sourceUrl: 'Image source URL', url: 'Source URL' };
  return <div className="structured-editor">{groups.map(([key, title, fields]) => {
    const items = (entry[key] || []) as unknown as Record<string, string>[];
    function change(next: Record<string, string>[]) { onChange({ ...entry, [key]: next }); }
    return <section key={key}><div className="panel-title"><h3>{title}</h3><button className="text-link" type="button" onClick={() => change([...items, Object.fromEntries(fields.map(field => [field, '']))])}><Plus size={14} />Add item</button></div>{items.map((item, index) => <div className="chapter-editor" key={index}><div><span className="eyebrow">ITEM {index + 1}</span><button className="icon-button danger" type="button" aria-label={'Remove ' + title.toLowerCase() + ' item ' + (index + 1)} onClick={() => change(items.filter((_, itemIndex) => itemIndex !== index))}><X size={16} /></button></div>{fields.map(field => <label key={field}>{labels[field]}{field === 'body' || field === 'caption' ? <textarea rows={3} value={item[field] || ''} onChange={event => change(items.map((current, itemIndex) => itemIndex === index ? { ...current, [field]: event.target.value } : current))} /> : <input value={item[field] || ''} onChange={event => change(items.map((current, itemIndex) => itemIndex === index ? { ...current, [field]: event.target.value } : current))} />}</label>)}</div>)}</section>;
  })}</div>;
}
const profileLabels: Partial<Record<keyof Profile, string>> = {
  latinName: 'Display name in Latin characters', initials: 'Monogram', location: 'City',
  tagline: 'Display headline', intro: 'Short introduction', biography: 'About me',
  story: 'Personal story and life journey', values: 'Values', interests: 'Interests', goals: 'Goals and plans',
  linkedin: 'LinkedIn URL', instagram: 'Instagram URL', contactNote: 'Contact section text',
};
function AboutMeEditor({ profile, photos, busy, onSave }: { profile: Profile; photos: ArchiveFile[]; busy: boolean; onSave: (p: Profile) => Promise<boolean> }) {
  const [p, setP] = useState(profile);
  return <form className="admin-card about-me-editor" onSubmit={event => { event.preventDefault(); onSave(p); }}>
    <h3>Your story</h3><p className="editor-intro">Add your own text and choose six personal photographs. Empty slots remain labelled until you add a photograph.</p>
    <label>About Me text<textarea rows={10} maxLength={12000} value={p.aboutText} onChange={event => setP({ ...p, aboutText: event.target.value })} /></label>
    <h3>Six-photograph carousel</h3><p className="form-hint">Upload photographs in All Documents and make them public before selecting them here.</p>
    <div className="about-photo-editor-grid">{aboutPhotoFields.map((key, index) => <label key={key}>Photograph {index + 1}<select value={p[key]} onChange={event => setP({ ...p, [key]: event.target.value })}><option value="">To be added</option><option value="/images/almagul-home.jpg">Owner-provided homepage photograph</option>{aboutPhotoFields.map((field, photoIndex) => <option key={field} value={defaultProfile[field]}>Owner-provided About Me photograph {photoIndex + 1}</option>)}{p[key] && p[key] !== '/images/almagul-home.jpg' && !aboutPhotoFields.some(field => defaultProfile[field] === p[key]) && !photos.some(photo => '/api/files/' + photo.id === p[key]) && <option value={p[key]}>Current photograph</option>}{photos.filter(photo => photo.isPublic).map(photo => <option key={photo.id} value={'/api/files/' + photo.id}>{photo.name}</option>)}</select>{p[key] && <img className="about-editor-thumbnail" src={p[key]} alt={'Selected photograph ' + (index + 1)} width={240} height={300} />}</label>)}</div>
    <div className="editor-save"><Link className="text-link" href="/admin?section=documents">Upload photographs</Link><button className="button button-green" disabled={busy} type="submit"><Save size={17} />{busy ? 'Saving…' : 'Save About Me'}</button></div>
  </form>;
}
function ProfileEditor({ profile, photos, busy, onSave }: { profile: Profile; photos: ArchiveFile[]; busy: boolean; onSave: (p: Profile) => Promise<boolean> }) {
  const [p, setP] = useState(profile);
  return <form className="admin-card profile-editor" onSubmit={e => { e.preventDefault(); onSave(p); }}>
    <p className="editor-intro">Your name and academic group appear on Home. Edit your own biography and contact information below. Replace every labelled placeholder with your own content.</p>
    <h3>Personal information</h3>
    <div className="form-grid"><label>Full name<input required maxLength={200} value={p.name} onChange={e => setP({ ...p, name: e.target.value, latinName: e.target.value })} /></label><label>Academic group<input maxLength={200} value={p.academicGroup} onChange={e => setP({ ...p, academicGroup: e.target.value })} /></label>{(['latinName', 'initials', 'location'] as const).map(key => <label key={key}>{profileLabels[key]}<input maxLength={key === 'initials' ? 3 : 200} value={p[key]} onChange={e => setP({ ...p, [key]: e.target.value })} /></label>)}</div>
    {(['tagline', 'intro'] as const).map(key => <label key={key}>{profileLabels[key]}<textarea rows={3} value={p[key]} onChange={e => setP({ ...p, [key]: e.target.value })} /></label>)}
    <h3>Biography chapters</h3>{(['biography', 'story', 'values', 'interests', 'goals'] as const).map(key => <label key={key}>{profileLabels[key]}<textarea rows={4} maxLength={12000} value={p[key]} onChange={e => setP({ ...p, [key]: e.target.value })} /></label>)}
    <h3>Homepage images</h3><p className="form-hint">Upload your own images in Documents and publish them before selecting them here. Architecture and landscape options are illustrative placeholders.</p>
    <div className="form-grid">{(['heroPhoto', 'biographyPhoto'] as const).map(k => <label key={k}>{k === 'heroPhoto' ? 'Homepage photograph' : 'Biography / supporting photograph'}<select value={p[k]} onChange={e => setP({ ...p, [k]: e.target.value })}><option value="">No photograph</option>{defaultProfile[k] && <option value={defaultProfile[k]}>Owner-provided homepage photograph</option>}<option value="/images/architecture.jpg">Illustrative architecture</option><option value="/images/mountains.jpg">Illustrative landscape</option>{p[k] && p[k] !== defaultProfile[k] && !['/images/architecture.jpg', '/images/mountains.jpg'].includes(p[k]) && !photos.some(f => '/api/files/' + f.id === p[k]) && <option value={p[k]}>Current photograph</option>}{photos.filter(f => f.isPublic).map(f => <option key={f.id} value={'/api/files/' + f.id}>{f.name}</option>)}</select></label>)}</div>
    <h3>Contact details</h3><div className="form-grid"><label>Primary email address<input type="email" value={p.email} onChange={e => setP({ ...p, email: e.target.value })} /></label><label>Secondary email address<input type="email" value={p.secondaryEmail} onChange={e => setP({ ...p, secondaryEmail: e.target.value })} /></label>{(['linkedin', 'instagram'] as const).map(key => <label key={key}>{profileLabels[key]}<input type="url" placeholder="https://…" value={p[key]} onChange={e => setP({ ...p, [key]: e.target.value })} /></label>)}</div>
    <label>{profileLabels.contactNote}<textarea rows={3} value={p.contactNote} onChange={e => setP({ ...p, contactNote: e.target.value })} /></label>
    <div className="editor-save"><span>Saving updates the website.</span><button className="button button-green" disabled={busy} type="submit"><Save size={17} />{busy ? 'Saving…' : 'Save changes'}</button></div>
  </form>;
}
function RecordFields({entry,onChange}:{entry:Entry;onChange:(e:Entry)=>void}){
 const[tableText,setTableText]=useState(entry.table?[entry.table.columns.join(' | '),...entry.table.rows.map(r=>r.join(' | '))].join('\n'):'');
 const chapters=entry.sections||[];
 return <div className="structured-editor"><div className="panel-title"><h3>Content sections</h3><button className="text-link" type="button" onClick={()=>onChange({...entry,sections:[...chapters,{heading:'',body:''}]})}><Plus size={14}/>Add section</button></div><p className="form-hint">Organise your content into clear subsections. These appear in the same order on the website.</p>{chapters.map((chapter,i)=><div className="chapter-editor" key={i}><div><span className="eyebrow">SECTION {String(i+1).padStart(2,'0')}</span><button type="button" className="icon-button danger" aria-label={'Remove content section '+(i+1)} onClick={()=>onChange({...entry,sections:chapters.filter((_,j)=>j!==i)})}><X size={16}/></button></div><label>Heading<input value={chapter.heading} maxLength={200} onChange={e=>onChange({...entry,sections:chapters.map((s,j)=>j===i?{...s,heading:e.target.value}:s)})}/></label><label>Text<textarea rows={4} maxLength={12000} value={chapter.body} onChange={e=>onChange({...entry,sections:chapters.map((s,j)=>j===i?{...s,body:e.target.value}:s)})}/></label></div>)}<label>Supporting table (optional)<textarea rows={5} value={tableText} placeholder={'Column one | Column two\nYour value | Your evidence'} onChange={e=>{const text=e.target.value;setTableText(text);const lines=text.split('\n');onChange({...entry,table:text.trim()?{columns:lines[0].split('|').map(c=>c.trim()),rows:lines.slice(1).filter(r=>r.trim()).map(r=>r.split('|').map(c=>c.trim()))}:undefined})}}/><span className="form-hint">First line: column headings. Following lines: rows. Separate cells with a vertical bar ( | ).</span></label><label>External resource or video URL (optional)<input type="url" placeholder="https://…" value={entry.link||''} onChange={e=>onChange({...entry,link:e.target.value})}/></label>{entry.kind==='project'&&<label>Code excerpt (optional)<textarea rows={8} className="code-input" value={entry.code||''} onChange={e=>onChange({...entry,code:e.target.value})} placeholder="Add a short excerpt of your own code."/></label>}</div>
}
function CategoriesEditor({ categories, busy, run }: { categories: Category[]; busy: boolean; run: (action: () => Promise<unknown>, message?: string) => Promise<boolean> }) {
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<Category | null>(null);
  return <section className="admin-card categories-editor"><p className="editor-intro">Artifacts and Evidence Folder are dedicated categories. Other categories can be renamed or removed without deleting their files.</p><form onSubmit={async event => { event.preventDefault(); if (await run(() => api('/api/admin/categories', 'POST', { name }), 'Category added')) setName(''); }}><label>Category name<input required maxLength={100} value={name} onChange={event => setName(event.target.value)} /></label><button className="button button-green" disabled={busy} type="submit"><Plus size={16} />Add</button></form><div className="category-list">{categories.map(category => {
    const protectedCategory = (protectedCategoryIds as readonly string[]).includes(category.id);
    return <div key={category.id}><Tags size={18} strokeWidth={1} />{editing?.id === category.id && !protectedCategory ? <form className="category-rename" onSubmit={async event => { event.preventDefault(); if (await run(() => api('/api/admin/categories', 'PATCH', editing), 'Category renamed')) setEditing(null); }}><input aria-label="New category name" required maxLength={100} value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} /><button type="submit" className="text-link" disabled={busy}>Save</button><button type="button" className="text-link" onClick={() => setEditing(null)}>Cancel</button></form> : <h3>{category.name}</h3>}{protectedCategory ? <span className="visibility-badge"><LockKeyhole size={12} />Dedicated category</span> : <><button className="text-link" onClick={() => setEditing(category)}>Rename</button><button className="text-link danger" disabled={busy} onClick={() => run(() => api('/api/admin/categories', 'DELETE', { id: category.id }), 'Category removed')}>Delete</button></>}</div>;
  })}</div></section>;
}
