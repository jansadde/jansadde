'use client';
import { useEffect, useRef, useState } from 'react';
import { Search, FileText, X, FolderOpen, FileImage } from 'lucide-react';
import type { ArchiveFile, Category } from '@/lib/types';
import { PdfPreview } from './pdf-preview';

export function fileSize(n: number) {
  return n < 1024 * 1024 ? (n / 1024).toFixed(0) + ' KB' : (n / 1024 / 1024).toFixed(1) + ' MB';
}
export function fileDate(s: string) {
  const date = new Date(s);
  return Number.isNaN(date.valueOf()) ? 'Date unavailable' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Almaty' });
}
export function fileType(file: Pick<ArchiveFile, 'mime' | 'name'>) {
  const known: Record<string, string> = {
    'video/mp4': 'MP4', 'application/zip': 'ZIP', 'application/pdf': 'PDF', 'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'image/png': 'PNG', 'image/jpeg': 'JPG', 'image/webp': 'WEBP', 'image/gif': 'GIF',
  };
  return known[file.mime] || file.name.split('.').pop()?.toUpperCase() || 'FILE';
}
export function fileUrl(file: Pick<ArchiveFile, 'id'>, download = false) {
  return '/api/files/' + encodeURIComponent(file.id) + (download ? '?download=1' : '');
}

/** Uses the same authenticated file endpoint for public files and the owner's private previews. */
export function FilePreview({ file, onClose }: { file: ArchiveFile | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (file && !dialog.current?.open) dialog.current?.showModal();
    if (!file && dialog.current?.open) dialog.current.close();
  }, [file]);
  return <dialog ref={dialog} aria-label={file ? 'Preview ' + file.name : 'File preview'} className="preview-dialog" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} onClose={onClose}>
    {file && <>
      <div className="dialog-heading"><div><span className="eyebrow">FILE PREVIEW</span><h2>{file.name}</h2></div><button type="button" className="icon-button" aria-label="Close preview" onClick={() => dialog.current?.close()}><X /></button></div>
      {file.mime.startsWith('image/') ? <img className="preview-image" src={fileUrl(file)} alt={file.description || file.name} /> : file.mime === 'video/mp4' ? <video className="preview-image" controls playsInline preload="metadata" src={fileUrl(file)} aria-label={file.name} /> : file.mime === 'application/pdf' ? <PdfPreview key={file.id} src={fileUrl(file)} name={file.name} /> : <div className="office-preview"><FileText size={52} strokeWidth={1} /><p>{file.mime === 'application/zip' ? 'Download this archive to view the complete collection.' : 'This format opens in an office application.'}</p><span>Download the file to view it on your device.</span></div>}
      <div className="preview-footer"><p>{file.description}</p><a className="button button-green" href={fileUrl(file, true)} download>Download file</a></div>
    </>}
  </dialog>;
}

type DocumentLibraryProps = {
  documents: ArchiveFile[];
  categories: Category[];
  compact?: boolean;
  layout?: 'grid' | 'list';
  minimal?: boolean;
  showCategories?: boolean;
};
export function DocumentLibrary({ documents, categories, compact = false, layout = 'grid', minimal = false, showCategories = true }: DocumentLibraryProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [preview, setPreview] = useState<ArchiveFile | null>(null);
  const files = documents.filter(file => !file.deletedAt && (category === 'all' || file.categoryId === category) && [file.name, file.description].join(' ').toLowerCase().includes(query.toLowerCase()));
  return <div className={'document-library' + (minimal ? ' document-library-minimal' : '')}>
    {!compact && !minimal && <><div className="archive-toolbar"><label className="search-field"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a file" aria-label="Search files" />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={16} /></button>}</label><span className="archive-count">{files.length} {files.length === 1 ? 'file' : 'files'}</span></div>{showCategories && <div className="filters"><button type="button" className={category === 'all' ? 'selected' : ''} onClick={() => setCategory('all')} aria-pressed={category === 'all'}>All files</button>{categories.map(item => <button type="button" className={category === item.id ? 'selected' : ''} onClick={() => setCategory(item.id)} key={item.id} aria-pressed={category === item.id}>{item.name}</button>)}</div>}</>}
    {files.length ? layout === 'list' || minimal ? <ul className="document-list">{files.map(file => <li className="document-list-row" key={file.id}>
      <div className="document-list-copy"><h3>{file.name}</h3><div className="document-info"><span>{fileType(file)}</span><span>{fileDate(file.addedAt)}</span>{!minimal && <span>{fileSize(file.size)}</span>}</div>{!minimal && file.description && <p>{file.description}</p>}</div>
      <div className="document-actions"><button type="button" onClick={() => setPreview(file)} aria-label={'Preview ' + file.name}>Preview</button><a href={fileUrl(file, true)} download aria-label={'Download ' + file.name}>Download</a></div>
    </li>)}</ul> : <div className="document-grid">{files.map(file => <article className="document-card" key={file.id}><div className="document-top"><div className="document-type">{file.mime.startsWith('image/') ? <FileImage size={28} strokeWidth={1} /> : <FileText size={28} strokeWidth={1} />}<span>{fileType(file)}</span></div><span className="document-category">{categories.find(item => item.id === file.categoryId)?.name || 'File'}</span></div><h3>{file.name}</h3>{file.description && <p>{file.description}</p>}<div className="document-info"><span>{fileDate(file.addedAt)}</span><span>{fileSize(file.size)}</span></div><div className="document-actions"><button type="button" onClick={() => setPreview(file)} aria-label={'Preview ' + file.name}>Preview</button><a href={fileUrl(file, true)} download aria-label={'Download ' + file.name}>Download</a></div></article>)}</div> : minimal ? <p className="document-list-empty">No public file uploaded.</p> : <div className="empty-state"><FolderOpen size={48} strokeWidth={.8} /><h3>{documents.length ? 'No results found' : 'No public files yet'}</h3><p>{documents.length ? 'Try a different search or category.' : 'Files published by the owner will appear here.'}</p>{documents.length > 0 && <button type="button" className="text-link" onClick={() => { setQuery(''); setCategory('all'); }}>Reset filters</button>}</div>}
    <FilePreview file={preview} onClose={() => setPreview(null)} />
  </div>;
}
