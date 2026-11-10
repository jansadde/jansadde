// Offline React SSR regression checks for the reusable file controls and previews.
// These verify rendered output only; actual storage/auth handlers are exercised by
// document-api.mjs, and browser interaction checks remain a separate step.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';
const root = fileURLToPath(new URL('..', import.meta.url));
const directory = resolve(root, 'work/document-ui'); await mkdir(directory, { recursive: true });
const bundle = resolve(directory, 'components.mjs');
await build({
  stdin: { contents: "export { DocumentManager } from './components/site/document-manager.tsx'; export { DocumentLibrary,FilePreview,fileType,fileDate } from './components/site/documents.tsx';", resolveDir: root, sourcefile: 'document-ui-entry.ts' },
  outfile: bundle, bundle: true, platform: 'node', format: 'esm', jsx: 'automatic', mainFields: ['module', 'main'], external: ['react', 'react/*', 'react-dom', 'react-dom/*'],
});
const { DocumentManager, DocumentLibrary, FilePreview, fileType, fileDate } = await import(pathToFileURL(bundle));
let checks = 0;
function check(name, assertion) { assertion(); checks++; console.log('PASS ' + name); }
function render(Component, props) { return renderToStaticMarkup(createElement(Component, props)); }
const file = { id: 'fixture/with space', name: 'Weekly owner file.pdf', mime: 'application/pdf', size: 150, description: 'Only the owner supplied this description.', categoryId: 'artifacts', projectId: 'fixture-weekly', addedAt: '2026-11-07T00:00:00Z', deletedAt: null, isPublic: false, isPhoto: false };
const props = { files: [file], records: [{ id: 'fixture-weekly', title: 'Weekly Report 1', kind: 'weekly' }], categories: [{ id: 'artifacts', name: 'Artifacts' }], onChanged: async () => {} };
const manager = render(DocumentManager, props);
check('Manager renders the stored filename, type, upload date and privacy', () => {
  assert(manager.includes(file.name)); assert(manager.includes('PDF · 07 Nov 2026')); assert(manager.includes('Private'));
});
check('Manager exposes actual file actions with distinct accessible names', () => {
  for (const action of ['Preview', 'Download', 'Edit', 'Replace', 'Delete']) assert(manager.includes('aria-label="' + action + ' ' + file.name + '"'));
});
check('Upload dropzone is accessible by keyboard and describes the supported formats', () => {
  assert.match(manager, /role="button" tabindex="0"/); assert(manager.includes('aria-describedby="')); assert(manager.includes('Drag and drop files here'));
});
check('Unified uploader accepts all required formats and multiple files', () => {
  assert(manager.includes('multiple=""')); for (const extension of ['.pdf', '.doc', '.docx', '.pptx', '.xlsx', '.png', '.jpg', '.jpeg']) assert(manager.includes(extension));
});
check('File URLs encode identifiers and downloads use the protected file endpoint', () => {
  assert(manager.includes('/api/files/fixture%2Fwith%20space?download=1')); assert(!manager.includes('vault/'));
});
check('Upload size limit is visible in the same interface', () => assert(manager.includes('up to 20 MB per file')));
const report = render(DocumentManager, { ...props, reportOnly: true, fixedProjectId: 'fixture-weekly', files: [file, { ...file, id: 'fixture-photo', name: 'Legacy weekly photo.jpg', mime: 'image/jpeg', isPhoto: true }] });
check('Weekly upload input accepts only PDF, DOC and DOCX', () => assert(report.includes('accept=".pdf,.doc,.docx"')));
check('Weekly records suppress unsupported historical attachments without losing global access', () => {
  assert(!report.includes('Legacy weekly photo.jpg'));
  assert(render(DocumentManager, { ...props, files: [{ ...file, name: 'Legacy weekly photo.jpg', mime: 'image/jpeg' }] }).includes('Legacy weekly photo.jpg'));
});
check('Weekly upload slots contain no descriptions, search or unrelated record selectors', () => {
  assert(!report.includes(file.description)); assert(!report.includes('Search files')); assert(!report.includes('Linked record')); assert(!report.includes('Description'));
});
check('Empty weekly slot contains its upload area without an empty decorative collection panel', () => {
  const html = render(DocumentManager, { ...props, files: [], reportOnly: true, fixedProjectId: 'fixture-weekly' });
  assert(html.includes('Upload PDF or Word document')); assert(!html.includes('No files uploaded.')); assert(!html.includes('file-collection'));
});
check('Category scope limits the manager to that archive', () => {
  const html = render(DocumentManager, { ...props, fixedCategoryId: 'evidence', files: [file, { ...file, id: 'evidence-file', categoryId: 'evidence', name: 'Evidence file.pdf' }] });
  assert(!html.includes(file.name)); assert(html.includes('Evidence file.pdf'));
});
check('Record scope limits attachments to the selected project', () => {
  const html = render(DocumentManager, { ...props, fixedProjectId: 'fixture-other', files: [file, { ...file, id: 'other-file', projectId: 'fixture-other', name: 'Other project file.pdf' }] });
  assert(!html.includes(file.name)); assert(html.includes('Other project file.pdf'));
});
check('Deleted files are excluded from active rows and reflected in context trash count', () => {
  const html = render(DocumentManager, { ...props, files: [{ ...file, deletedAt: '2026-11-07' }], trash: [{ ...file, deletedAt: '2026-11-07' }] });
  assert(!html.includes(file.name)); assert(html.includes('Trash (1)'));
});
const list = render(DocumentLibrary, { documents: [file], categories: [], layout: 'list', minimal: true });
check('Minimal public archive uses a simple filename list with type and date', () => {
  assert(list.includes('document-list-row')); assert(list.includes(file.name)); assert(list.includes('PDF')); assert(list.includes('07 Nov 2026'));
});
check('Minimal archive has preview and download without descriptions or decorative cards', () => {
  assert(list.includes('Preview')); assert(list.includes('Download')); assert(!list.includes(file.description)); assert(!list.includes('document-card')); assert(!list.includes('Find a file'));
});
check('Empty minimal archive does not invent report content or demonstration documents', () => {
  const html = render(DocumentLibrary, { documents: [], categories: [], minimal: true });
  assert(html.includes('No public file uploaded.')); assert(!html.includes('document-card')); assert(!html.includes('A document from'));
});
check('Default library remains compatible and preserves owner-supplied descriptions', () => {
  const html = render(DocumentLibrary, { documents: [file], categories: [] }); assert(html.includes('document-card')); assert(html.includes(file.description));
});
check('Untitled descriptions are left empty instead of generating personal content', () => {
  const html = render(DocumentLibrary, { documents: [{ ...file, description: '' }], categories: [] }); assert(!html.includes('A document from')); assert(!html.includes(file.description));
});
check('PDF preview starts the local renderer and keeps its protected download fallback', () => {
  const html = render(FilePreview, { file, onClose() {} }); assert(html.includes('class="pdf-preview"')); assert(html.includes('Loading PDF…')); assert(!html.includes('<iframe')); assert(html.includes('/api/files/fixture%2Fwith%20space')); assert(html.includes('Close preview'));
});
check('Image preview includes meaningful owner-provided alternative text', () => {
  const html = render(FilePreview, { file: { ...file, mime: 'image/png' }, onClose() {} }); assert(html.includes('class="preview-image"')); assert(html.includes('alt="' + file.description + '"'));
});
check('Office preview provides a download fallback without sending private files to external viewers', () => {
  const html = render(FilePreview, { file: { ...file, mime: 'application/msword' }, onClose() {} });
  assert(html.includes('This format opens in an office application.')); assert(html.includes('Download file')); assert(!html.includes('<iframe')); assert(!html.includes('officeapps'));
});
check('Owner-controlled filenames and descriptions are escaped during rendering', () => {
  const html = render(DocumentLibrary, { documents: [{ ...file, name: '<script>unsafe</script>', description: '<img src=x onerror=alert(1)>' }], categories: [], layout: 'list' });
  assert(html.includes('&lt;script&gt;')); assert(!html.includes('<script>')); assert(!html.includes('<img src=x'));
});
check('Known Office MIME supplies a file type even when the title has no extension', () => {
  assert.equal(fileType({ name: 'Owner title', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'DOCX');
});
check('Dates are displayed in English and malformed dates have a safe label', () => {
  assert.equal(fileDate(file.addedAt), '07 Nov 2026'); assert.equal(fileDate('invalid fixture date'), 'Date unavailable');
});
check('Clickable controls contain no directional decoration or non-English labels', () => {
  for (const html of [manager, report, list]) assert(!/[↗→↓↑←↘↙↖А-Яа-яЁё]/.test(html));
});
console.log('\n' + checks + ' document UI rendering checks passed.');
