'use client';
import { useId, useRef, useState } from 'react';
import { FileImage, FileText, FolderOpen, Search, X } from 'lucide-react';
import type { ArchiveFile, Category, Entry } from '@/lib/types';
import { FilePreview, fileDate, fileSize, fileType, fileUrl } from './documents';

export type DocumentManagerProps = {
  files: ArchiveFile[];
  categories: Category[];
  records: Entry[];
  onChanged: () => Promise<void>;
  title?: string;
  fixedProjectId?: string;
  fixedCategoryId?: string;
  reportOnly?: boolean;
  trash?: ArchiveFile[];
  onSetHomepagePhoto?: (file: ArchiveFile) => Promise<void>;
};
type FileDetails = { name: string; description: string; categoryId: string; projectId: string; isPublic: boolean };
const MAX_SIZE = 20 * 1024 * 1024;
const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'pptx', 'xlsx', 'mp4', 'zip', 'png', 'jpg', 'jpeg', 'webp', 'gif'];
const REPORT_EXTENSIONS = ['pdf', 'doc', 'docx'];
const REPORT_MIMES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
function extension(file: File) { return file.name.split('.').pop()?.toLowerCase() || ''; }
async function requestFiles(method: 'POST' | 'PATCH' | 'DELETE', body: FormData | object) {
  const response = await fetch('/api/admin/documents', {
    method, credentials: 'same-origin',
    headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
  let result: { error?: string } = {};
  try { result = await response.json() as { error?: string }; } catch { /* An interrupted response is reported below. */ }
  if (!response.ok) throw new Error(result.error || 'The file could not be saved. Please try again.');
}

/** Shared owner-only file controls. All storage and visibility changes use the authenticated API. */
export function DocumentManager({ files, categories, records, onChanged, title = 'Files', fixedProjectId, fixedCategoryId, reportOnly = false, trash = [], onSetHomepagePhoto }: DocumentManagerProps) {
  const input = useRef<HTMLInputElement>(null);
  const uploadPanel = useRef<HTMLElement>(null);
  const editPanel = useRef<HTMLFormElement>(null);
  const busyRef = useRef(false);
  const instructionsId = useId();
  const [selected, setSelected] = useState<File[]>([]);
  const [details, setDetails] = useState<FileDetails>({ name: '', description: '', categoryId: fixedCategoryId || '', projectId: fixedProjectId || '', isPublic: false });
  const [replacement, setReplacement] = useState<ArchiveFile | null>(null);
  const [editing, setEditing] = useState<ArchiveFile | null>(null);
  const [preview, setPreview] = useState<ArchiveFile | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [showTrash, setShowTrash] = useState(false);
  const reports = reportOnly || records.some(record => record.id === (fixedProjectId || details.projectId) && record.kind === 'weekly');
  const extensions = reports ? REPORT_EXTENSIONS : DOCUMENT_EXTENSIONS;
  const accept = extensions.map(value => '.' + value).join(',');
  function inContext(file: ArchiveFile) {
    return (!reportOnly || REPORT_MIMES.includes(file.mime)) && (!fixedProjectId || file.projectId === fixedProjectId) && (!fixedCategoryId || file.categoryId === fixedCategoryId) && (!reportOnly || !!fixedProjectId || records.some(record => record.id === file.projectId && record.kind === 'weekly'));
  }
  const active = files.filter(file => !file.deletedAt && inContext(file));
  const contextualTrash = trash.filter(inContext);
  const shown = (showTrash ? contextualTrash : active).filter(file => [file.name, file.description, fileType(file)].join(' ').toLowerCase().includes(query.toLowerCase()));

  async function mutate(action: () => Promise<void>, message: string) {
    if (busyRef.current) return false;
    busyRef.current = true; setBusy(true); setError(''); setNotice('');
    let success = false;
    try { await action(); success = true; setNotice(message); }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'The action could not be completed.'); }
    finally {
      try { await onChanged(); } catch { setError(current => current || 'The action finished, but the file list could not be refreshed. Reload the page to check your files.'); }
      busyRef.current = false; setBusy(false); setProgress('');
    }
    return success;
  }
  function validate(file: File) {
    if (!extensions.includes(extension(file))) return reports ? 'Weekly reports accept PDF, DOC and DOCX files only.' : 'Supported formats: PDF, DOC, DOCX, PPTX, XLSX, PNG, JPG, JPEG, WEBP and GIF.';
    if (!file.size || file.size > MAX_SIZE) return 'Each file must not be empty and must be 20 MB or smaller.';
    return '';
  }
  function selectFiles(list: FileList | null) {
    if (busy || !list?.length) return;
    const incoming = Array.from(list);
    if (replacement && incoming.length > 1) { setError('Select one file to replace this item.'); return; }
    for (const file of incoming) { const problem = validate(file); if (problem) { setError(file.name + ': ' + problem); if (input.current) input.current.value = ''; return; } }
    setError(''); setNotice(''); setSelected(incoming);
    if (!replacement) setDetails(current => ({ ...current, name: incoming.length === 1 ? incoming[0].name : '' }));
    if (input.current) input.current.value = '';
  }
  function resetUpload() {
    setSelected([]); setReplacement(null);
    setDetails({ name: '', description: '', categoryId: fixedCategoryId || '', projectId: fixedProjectId || '', isPublic: false });
    if (input.current) input.current.value = '';
  }
  async function upload() {
    if (!selected.length) return;
    for (const file of selected) { const problem = validate(file); if (problem) { setError(file.name + ': ' + problem); return; } }
    const batch = [...selected]; let completed = 0;
    const success = await mutate(async () => {
      for (const file of batch) {
        setProgress('Uploading ' + (completed + 1) + ' of ' + batch.length + '…');
        const form = new FormData();
        form.set('file', file);
        form.set('name', batch.length === 1 ? details.name.trim() || file.name : file.name);
        form.set('description', details.description);
        form.set('categoryId', replacement ? details.categoryId : fixedCategoryId || details.categoryId);
        form.set('projectId', replacement ? details.projectId : fixedProjectId || details.projectId);
        form.set('isPublic', String(details.isPublic));
        form.set('isPhoto', String(IMAGE_EXTENSIONS.includes(extension(file))));
        if (replacement) form.set('replaceId', replacement.id);
        try { await requestFiles('POST', form); } catch (problem) { throw new Error(file.name + ': ' + (problem instanceof Error ? problem.message : 'Upload failed.')); }
        completed++;
      }
    }, replacement ? 'File replaced.' : batch.length === 1 ? 'File uploaded.' : batch.length + ' files uploaded.');
    if (success) resetUpload();
    else if (completed) { setSelected(batch.slice(completed)); setNotice(completed + ' files uploaded. The remaining files are still selected.'); }
  }
  function beginReplace(file: ArchiveFile) {
    setReplacement(file); setSelected([]); setError(''); setNotice(''); setShowTrash(false);
    setDetails({ name: file.name, description: file.description, categoryId: file.categoryId || '', projectId: file.projectId || '', isPublic: file.isPublic });
    uploadPanel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    input.current?.focus();
  }
  function recordOptions(currentId: string | null) {
    return <><option value="">No linked record</option>{currentId && !records.some(record => record.id === currentId) && <option value={currentId}>Archived association (preserved)</option>}{records.map(record => <option key={record.id} value={record.id}>{record.title}</option>)}</>;
  }
  function categoryOptions(currentId: string | null) {
    return <><option value="">Uncategorized</option>{currentId && !categories.some(category => category.id === currentId) && <option value={currentId}>Archived category (preserved)</option>}{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</>;
  }
  return <div className={'document-manager' + (reportOnly ? ' report-manager' : '')} aria-busy={busy}>
    {error && <div className="admin-alert error" role="alert">{error}<button type="button" aria-label="Dismiss file error" onClick={() => setError('')}><X size={16} /></button></div>}
    {notice && <p className="file-manager-notice" role="status">{notice}</p>}
    {!showTrash && <section ref={uploadPanel} className="admin-card upload-section">
      <div className="panel-title"><h3>{replacement ? 'Replace file: ' + replacement.name : reports ? 'Upload PDF or Word document' : 'Upload files'}</h3>{replacement && <button type="button" className="text-link" disabled={busy} onClick={resetUpload}>Cancel replacement</button>}</div>
      <div className={'drop-zone file-manager-dropzone ' + (dragging ? 'dragging' : '')} role="button" tabIndex={busy ? -1 : 0} aria-disabled={busy} aria-label={replacement ? 'Choose replacement file' : reports ? 'Upload PDF or Word document' : 'Choose files to upload'} aria-describedby={instructionsId} onClick={() => { if (!busy) input.current?.click(); }} onKeyDown={event => { if (!busy && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); input.current?.click(); } }} onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }} onDrop={event => { event.preventDefault(); setDragging(false); selectFiles(event.dataTransfer.files); }}>
        <FolderOpen size={30} strokeWidth={1} /><strong>{selected.length ? selected.length + (selected.length === 1 ? ' file selected' : ' files selected') : 'Drag and drop files here'}</strong><span>or choose files from your device</span><small id={instructionsId}>{reports ? 'PDF, DOC and DOCX' : 'PDF, DOC, DOCX, PPTX, XLSX, MP4, ZIP and images'} · up to 20 MB per file</small>
      </div>
      <input ref={input} className="file-input" type="file" tabIndex={-1} aria-label={replacement ? 'Select replacement file' : 'Select files'} disabled={busy} multiple={!replacement} accept={accept} onChange={event => selectFiles(event.target.files)} />
      {selected.length > 0 && <div className="upload-details">
        <ul className="selected-files file-manager-selected">{selected.map((file, index) => <li key={file.name + index}><span>{file.name}</span><small>{fileSize(file.size)}</small><button type="button" className="icon-button" disabled={busy} aria-label={'Remove selected file ' + file.name} onClick={() => setSelected(current => current.filter((_, selectedIndex) => selectedIndex !== index))}><X size={15} /></button></li>)}</ul>
        <fieldset className="file-manager-fields" disabled={busy}>
          <div className="form-grid">{selected.length === 1 && <label>File name<input maxLength={200} value={details.name} onChange={event => setDetails({ ...details, name: event.target.value })} /></label>}{!fixedCategoryId && <label>Category<select value={details.categoryId} onChange={event => setDetails({ ...details, categoryId: event.target.value })}>{categoryOptions(details.categoryId)}</select></label>}{!fixedProjectId && <label>Linked record<select value={details.projectId} onChange={event => setDetails({ ...details, projectId: event.target.value })}>{recordOptions(details.projectId)}</select></label>}</div>
          {!reportOnly && <label>Description<textarea rows={2} maxLength={5000} value={details.description} onChange={event => setDetails({ ...details, description: event.target.value })} /></label>}
          <div className="upload-submit"><label className="checkbox-label"><input type="checkbox" checked={details.isPublic} onChange={event => setDetails({ ...details, isPublic: event.target.checked })} /><span>Make public on the website</span></label><button type="button" className="button button-green" onClick={upload} disabled={busy}>{busy ? progress || 'Saving…' : replacement ? 'Replace file' : selected.length === 1 ? 'Upload file' : 'Upload files'}</button></div>
        </fieldset>
      </div>}
    </section>}
    {editing && <form ref={editPanel} className="admin-card document-edit" onSubmit={async event => { event.preventDefault(); if (await mutate(() => requestFiles('PATCH', { id: editing.id, name: editing.name, description: editing.description, categoryId: editing.categoryId, projectId: editing.projectId, isPublic: editing.isPublic }), 'File details saved.')) setEditing(null); }}>
      <div className="panel-title"><h3>Edit file details</h3><button type="button" className="text-link" disabled={busy} onClick={() => setEditing(null)}>Cancel</button></div>
      <fieldset className="file-manager-fields" disabled={busy}><label>File name<input required maxLength={200} value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} /></label>{!reportOnly && <label>Description<textarea rows={3} maxLength={5000} value={editing.description} onChange={event => setEditing({ ...editing, description: event.target.value })} /></label>}<div className="form-grid">{!fixedCategoryId && <label>Category<select value={editing.categoryId || ''} onChange={event => setEditing({ ...editing, categoryId: event.target.value || null })}>{categoryOptions(editing.categoryId)}</select></label>}{!fixedProjectId && <label>Linked record<select value={editing.projectId || ''} onChange={event => setEditing({ ...editing, projectId: event.target.value || null })}>{recordOptions(editing.projectId)}</select></label>}</div><label className="checkbox-label"><input type="checkbox" checked={editing.isPublic} onChange={event => setEditing({ ...editing, isPublic: event.target.checked })} /><span>Make public on the website</span></label><button className="button button-green" disabled={busy} type="submit">Save details</button></fieldset>
    </form>}
    {(!reportOnly || active.length > 0 || contextualTrash.length > 0) && <section className="admin-card file-collection">
      {(!reportOnly || contextualTrash.length > 0) && <div className="panel-title">{!reportOnly && <h3>{showTrash ? 'Trash' : title} <small>{shown.length}</small></h3>}<div className="file-manager-tools">{!reportOnly && <label className="admin-search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search files" aria-label={'Search ' + title.toLowerCase()} /></label>}<button type="button" className="text-link" onClick={() => { setShowTrash(!showTrash); setDeleting(null); setEditing(null); }}>{showTrash ? 'Back to files' : 'Trash (' + contextualTrash.length + ')'}</button></div></div>}
      {shown.length ? <ul className="managed-file-list">{shown.map(file => <li className="managed-file-row" key={file.id}>
        <div className="file-row-icon" aria-hidden="true">{file.mime.startsWith('image/') ? <FileImage size={24} strokeWidth={1} /> : <FileText size={24} strokeWidth={1} />}</div><div className="file-row-copy"><h4>{file.name}</h4><p>{fileType(file)} · {fileDate(file.addedAt)} · {fileSize(file.size)}</p><span className={'visibility-badge ' + (file.isPublic ? 'public' : '')}>{file.isPublic ? 'Public' : 'Private'}</span>{!reportOnly && file.description && <p>{file.description}</p>}</div>
        <div className="file-row-actions">{showTrash ? <button type="button" className="text-link" disabled={busy} onClick={() => mutate(() => requestFiles('PATCH', { id: file.id, restore: true }), 'File restored.')}>Restore</button> : <>
          <button type="button" className="text-link" aria-label={'Preview ' + file.name} onClick={() => setPreview(file)}>Preview</button><a className="text-link" href={fileUrl(file, true)} download aria-label={'Download ' + file.name}>Download</a><button type="button" className="text-link" disabled={busy} aria-label={'Edit ' + file.name} onClick={() => { setEditing({ ...file }); setError(''); requestAnimationFrame(() => editPanel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}>Edit</button><button type="button" className="text-link" disabled={busy} aria-label={'Replace ' + file.name} onClick={() => beginReplace(file)}>Replace</button><button type="button" className="text-link danger" disabled={busy} aria-label={'Delete ' + file.name} onClick={() => setDeleting(file.id)}>Delete</button>
        </>}</div>
        {!showTrash && deleting === file.id && <div className="file-delete-confirm"><span>Move this file to trash?</span><button type="button" className="text-link danger" disabled={busy} onClick={async () => { if (await mutate(() => requestFiles('DELETE', { id: file.id }), 'File moved to trash.')) { setDeleting(null); if (editing?.id === file.id) setEditing(null); if (replacement?.id === file.id) resetUpload(); } }}>Delete file</button><button type="button" className="text-link" disabled={busy} onClick={() => setDeleting(null)}>Cancel</button></div>}
        {!showTrash && onSetHomepagePhoto && file.mime.startsWith('image/') && <div className="photo-assign"><button type="button" disabled={busy || !file.isPublic} title={file.isPublic ? undefined : 'Make this image public before using it on Home.'} onClick={() => mutate(() => onSetHomepagePhoto(file), 'Homepage photo updated.')}>Use on homepage</button></div>}
      </li>)}</ul> : <p className="file-manager-empty">{query ? 'No matching files.' : showTrash ? 'The trash is empty.' : 'No files uploaded.'}</p>}
    </section>}
    <FilePreview file={preview} onClose={() => setPreview(null)} />
  </div>;
}
