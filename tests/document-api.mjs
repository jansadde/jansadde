// Actual route handlers + in-memory SQLite/D1 and R2 fixtures. No network, server,
// cookies, local .wrangler state, or owner data are read or modified.
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('..', import.meta.url));
const directory = resolve(root, 'work/document-api');
await mkdir(directory, { recursive: true });
const envKey = Symbol.for('personal-atelier.document-api.env');
const userKey = Symbol.for('personal-atelier.document-api.user');
const origin = 'https://disposable-fixture.invalid';
const owner = { email: 'fixture-owner@example.test', displayName: 'Disposable owner' };
const sqlite = new DatabaseSync(':memory:');
sqlite.exec(await readFile(resolve(root, 'drizzle/0000_heavy_cobalt_man.sql'), 'utf8'));
const objects = new Map();
const d1 = {
  prepare(sql) {
    const statement = sqlite.prepare(sql);
    return {
      values: [],
      bind(...values) { this.values = values; return this; },
      async first() { return statement.get(...this.values) || null; },
      async all() { return { results: statement.all(...this.values), success: true }; },
      async run() { const result = statement.run(...this.values); return { success: true, meta: { changes: Number(result.changes) } }; },
    };
  },
  async batch(statements) {
    sqlite.exec('BEGIN');
    try { const results = []; for (const statement of statements) results.push(await statement.run()); sqlite.exec('COMMIT'); return results; }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  },
};
const r2 = {
  async put(key, value, options = {}) { objects.set(key, { bytes: Uint8Array.from(value), metadata: structuredClone(options.httpMetadata || {}) }); },
  async get(key, options) { const object = objects.get(key); if(!object)return null; const range=options?.range; return {size:object.bytes.byteLength,body:Uint8Array.from(range?object.bytes.slice(range.offset,range.offset+range.length):object.bytes),httpMetadata:structuredClone(object.metadata)}; },
  async delete(key) { objects.delete(key); },
};
globalThis[envKey] = { ADMIN_EMAIL: owner.email, DB: d1, BUCKET: r2 };
globalThis[userKey] = owner;
await build({
  stdin: {
    contents: `export * as references from './app/api/admin/references/route.ts';
      export * as documents from './app/api/admin/documents/route.ts';
      export * as file from './app/api/files/[id]/route.ts';
      export * as categories from './app/api/admin/categories/route.ts';
      export * as admin from './app/api/admin/route.ts';
      export { initialize } from './lib/server.ts';
      export { academicContentRevision } from './lib/defaults.ts';`,
    resolveDir: root, sourcefile: 'document-api-entry.ts',
  },
  outfile: resolve(directory, 'handlers.mjs'), platform: 'node', format: 'esm', bundle: true,
  define: { 'import.meta.env.DEV': 'false' },
  plugins: [{ name: 'isolated-document-api-fixtures', setup(builder) {
    builder.onResolve({ filter: /^cloudflare:workers$/ }, () => ({ path: 'env', namespace: 'document-fixture' }));
    builder.onResolve({ filter: /^@\/app\/chatgpt-auth$/ }, () => ({ path: 'user', namespace: 'document-fixture' }));
    builder.onLoad({ filter: /.*/, namespace: 'document-fixture' }, ({ path }) => ({ loader: 'js', contents: path === 'env'
      ? "export const env = globalThis[Symbol.for('personal-atelier.document-api.env')];"
      : "export async function getChatGPTUser() { return globalThis[Symbol.for('personal-atelier.document-api.user')]; }" }));
  } }],
});
const handlers = await import(pathToFileURL(resolve(directory, 'handlers.mjs')).href);
// Seed only disposable fixture associations. Real initialize still runs during uploads.
sqlite.prepare('INSERT INTO settings (key,value) VALUES (?,?)').run('initialized', '1');
sqlite.prepare('INSERT INTO settings (key,value) VALUES (?,?)').run('academic-content-revision', handlers.academicContentRevision);
for (const [id, kind] of [['fixture-project', 'project'], ['fixture-weekly', 'weekly']]) {
  const entry = { id, kind, title: id, subtitle: '', description: '', period: '', category: '', role: '', result: '', image: '', sections: [], isPublic: true, isExample: false, position: 1 };
  sqlite.prepare('INSERT INTO entries (id,kind,data,is_public,position) VALUES (?,?,?,?,?)').run(id, kind, JSON.stringify(entry), 1, 1);
}
sqlite.prepare('INSERT INTO categories (id,name) VALUES (?,?)').run('fixture-materials', 'Disposable fixture materials');
let checks = 0;
async function check(name, action) { await action(); checks++; console.log('PASS ' + name); }
function row(id) { return sqlite.prepare('SELECT * FROM documents WHERE id=?').get(id); }
function count() { return sqlite.prepare('SELECT count(*) AS total FROM documents').get().total; }
function jsonRequest(path, method, body, headers = {}) { return new Request(origin + path, { method, headers: { Origin: origin, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }); }
async function expectStatus(response, status) { assert.equal(response.status, status, await response.clone().text()); return response; }
async function upload(file, fields = {}, headers = {}) {
  const form = new FormData(); form.set('file', file);
  for (const [key, value] of Object.entries(fields)) if (value !== undefined) form.set(key, String(value));
  return handlers.documents.POST(new Request(origin + '/api/admin/documents', { method: 'POST', headers: { Origin: origin, ...headers }, body: form }));
}
async function created(file, fields = {}) { const response = await upload(file, fields); await expectStatus(response, 200); return (await response.json()).id; }
async function read(id, download = false) { return handlers.file.GET(new Request(origin + '/api/files/' + encodeURIComponent(id) + (download ? '?download=1' : '')), { params: Promise.resolve({ id }) }); }
async function metadata(id, fields) { return handlers.documents.PATCH(jsonRequest('/api/admin/documents', 'PATCH', { id, name: row(id).name, ...fields })); }
function file(bytes, name, type) { return new File([bytes], name, { type }); }
const types = {
  pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif',
};
// A real ZIP container with local headers, CRCs and central directory, generated in
// memory for disposable Office package fixtures. These are never presented as reports.
function zip(entries) {
  const local = [], central = []; let offset = 0;
  function crc32(bytes) { let value = 0xffffffff; for (const byte of bytes) { value ^= byte; for (let i = 0; i < 8; i++) value = value & 1 ? (value >>> 1) ^ 0xedb88320 : value >>> 1; } return (value ^ 0xffffffff) >>> 0; }
  for (const [name, text] of entries) {
    const path = Buffer.from(name), data = Buffer.from(text), checksum = crc32(data);
    const header = Buffer.alloc(30); header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4); header.writeUInt32LE(checksum, 14); header.writeUInt32LE(data.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(path.length, 26);
    local.push(header, path, data);
    const record = Buffer.alloc(46); record.writeUInt32LE(0x02014b50); record.writeUInt16LE(20, 4); record.writeUInt16LE(20, 6); record.writeUInt32LE(checksum, 16); record.writeUInt32LE(data.length, 20); record.writeUInt32LE(data.length, 24); record.writeUInt16LE(path.length, 28); record.writeUInt32LE(offset, 42);
    central.push(record, path); offset += header.length + path.length + data.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}
function office(folder, part, extra = []) { return zip([
  ['[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>'],
  [folder + '/' + part, '<?xml version="1.0"?><fixture>Disposable upload validation fixture</fixture>'], ...extra,
]); }
const bytes = {
  pdf: Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n'),
  doc: Buffer.concat([Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), Buffer.alloc(504)]),
  docx: office('word', 'document.xml'), pptx: office('ppt', 'presentation.xml'), xlsx: office('xl', 'workbook.xml'),
  png: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  jpg: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0xd9]),
  webp: Buffer.from('RIFF\x04\x00\x00\x00WEBP', 'binary'),
  gif: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
};
bytes.jpeg = bytes.jpg;
const ids = {};
try {
  await check('Anonymous upload and metadata writes are denied without storage changes', async () => {
    globalThis[userKey] = null; const before = count(); const stored = objects.size;
    await expectStatus(await upload(file(bytes.pdf, 'anonymous.pdf', types.pdf)), 401);
    await expectStatus(await handlers.documents.PATCH(jsonRequest('/api/admin/documents', 'PATCH', { id: 'missing', name: 'x' })), 401);
    assert.equal(count(), before); assert.equal(objects.size, stored);
  });
  await check('Authenticated non-owner cannot upload or read the dashboard', async () => {
    globalThis[userKey] = { email: 'different-user@example.test' };
    await expectStatus(await upload(file(bytes.pdf, 'non-owner.pdf', types.pdf)), 401);
    await expectStatus(await handlers.admin.GET(), 401);
  });
  globalThis[userKey] = owner;
  await check('Owner mutations reject missing Origin, foreign Origin and cross-site metadata', async () => {
    const form = new FormData(); form.set('file', file(bytes.pdf, 'csrf.pdf', types.pdf));
    await expectStatus(await handlers.documents.POST(new Request(origin + '/api/admin/documents', { method: 'POST', body: form })), 403);
    await expectStatus(await upload(file(bytes.pdf, 'csrf.pdf', types.pdf), {}, { Origin: 'https://foreign.invalid' }), 403);
    await expectStatus(await upload(file(bytes.pdf, 'csrf.pdf', types.pdf), {}, { 'Sec-Fetch-Site': 'cross-site' }), 403);
  });
  for (const extension of Object.keys(types)) {
    await check(extension.toUpperCase() + ' actual multipart upload stores exact bytes, trusted MIME and private default', async () => {
      ids[extension] = await created(file(bytes[extension], 'fixture.' + extension, types[extension]), { projectId: 'fixture-project', categoryId: 'fixture-materials', isPhoto: types[extension].startsWith('image/') });
      const record = row(ids[extension]);
      assert.equal(record.mime, types[extension]); assert.equal(record.size, bytes[extension].length); assert.equal(record.is_public, 0);
      assert.equal(record.category_id, 'fixture-materials'); assert.equal(record.project_id, 'fixture-project'); assert(record.added_at);
      assert.deepEqual(Buffer.from(objects.get(record.storage_key).bytes), bytes[extension]);
      assert.equal(objects.get(record.storage_key).metadata.contentType, types[extension]);
    });
  }
  await check('Anonymous visitors and signed-in non-owners receive 404 for private files', async () => {
    for (const user of [null, { email: 'different-user@example.test' }]) { globalThis[userKey] = user; await expectStatus(await read(ids.pdf), 404); await expectStatus(await read(ids.docx, true), 404); }
    globalThis[userKey] = owner;
  });
  await check('Owner PDF preview streams original bytes inline with private security headers', async () => {
    const response = await read(ids.pdf); await expectStatus(response, 200);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes.pdf); assert.match(response.headers.get('Content-Disposition'), /^inline;/);
    assert.equal(response.headers.get('Content-Type'), types.pdf); assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store'); assert.equal(response.headers.get('Cross-Origin-Resource-Policy'), 'same-origin');
    assert.match(response.headers.get('Content-Security-Policy'), /frame-ancestors 'self'/);
  });
  await check('Owner explicit PDF download and Office fallback return attachment disposition', async () => {
    for (const extension of ['pdf', 'doc', 'docx']) {
      const response = await read(ids[extension], extension === 'pdf'); await expectStatus(response, 200);
      assert.match(response.headers.get('Content-Disposition'), /^attachment;/); assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes[extension]);
    }
  });
  await check('Owner image preview streams inline without exposing a storage URL', async () => {
    const response = await read(ids.png); await expectStatus(response, 200); assert.match(response.headers.get('Content-Disposition'), /^inline;/);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes.png); assert.equal(response.headers.get('Location'), null);
  });
  await check('Metadata edit explicitly publishes a file and retains omitted associations', async () => {
    await expectStatus(await metadata(ids.pdf, { name: 'Published report.pdf', description: 'Owner-supplied fixture description', isPublic: true }), 200);
    assert.equal(row(ids.pdf).project_id, 'fixture-project'); assert.equal(row(ids.pdf).category_id, 'fixture-materials'); assert.equal(row(ids.pdf).is_public, 1);
    globalThis[userKey] = null; const response = await read(ids.pdf); await expectStatus(response, 200); assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes.pdf); globalThis[userKey] = owner;
  });
  await check('Public file can be made private again and is immediately inaccessible anonymously', async () => {
    await expectStatus(await metadata(ids.pdf, { isPublic: false }), 200); globalThis[userKey] = null; await expectStatus(await read(ids.pdf), 404); globalThis[userKey] = owner;
  });
  await check('Replacement changes bytes under the same id and retains omitted category and record', async () => {
    const previous = row(ids.pdf); const replacement = Buffer.from('%PDF-1.7\nReplacement fixture bytes\n%%EOF');
    const response = await upload(file(replacement, 'replacement.pdf', types.pdf), { replaceId: ids.pdf, name: 'Updated report.pdf', isPublic: true }); await expectStatus(response, 200);
    assert.equal((await response.json()).id, ids.pdf); const current = row(ids.pdf); assert.notEqual(current.storage_key, previous.storage_key);
    assert.equal(current.project_id, 'fixture-project'); assert.equal(current.category_id, 'fixture-materials'); assert.equal(current.is_public, 1);
    const preview = await read(ids.pdf); assert.deepEqual(Buffer.from(await preview.arrayBuffer()), replacement);
  });
  await check('Replacement without explicit public flag becomes private', async () => {
    await expectStatus(await upload(file(bytes.pdf, 'replacement-private.pdf', types.pdf), { replaceId: ids.pdf }), 200);
    assert.equal(row(ids.pdf).is_public, 0); globalThis[userKey] = null; await expectStatus(await read(ids.pdf), 404); globalThis[userKey] = owner;
  });
  for (const extension of ['pdf', 'doc', 'docx']) {
    await check('Weekly record accepts ' + extension.toUpperCase() + ' upload and owner download', async () => {
      const id = await created(file(bytes[extension], 'weekly.' + extension, types[extension]), { projectId: 'fixture-weekly' }); ids['weekly-' + extension] = id;
      assert.equal(row(id).project_id, 'fixture-weekly'); const response = await read(id, true); await expectStatus(response, 200); assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes[extension]);
    });
  }
  for (const extension of ['pptx', 'xlsx', 'png']) {
    await check('Weekly record rejects ' + extension.toUpperCase() + ' upload, replacement and metadata reassignment', async () => {
      const target = row(ids['weekly-pdf']); const before = count(); const storageBefore = objects.size;
      await expectStatus(await upload(file(bytes[extension], 'weekly.' + extension, types[extension]), { projectId: 'fixture-weekly' }), 400);
      await expectStatus(await upload(file(bytes[extension], 'replacement.' + extension, types[extension]), { replaceId: target.id }), 400);
      await expectStatus(await metadata(ids[extension], { projectId: 'fixture-weekly' }), 400);
      assert.equal(count(), before); assert.equal(objects.size, storageBefore); assert.equal(row(target.id).storage_key, target.storage_key); assert.equal(row(ids[extension]).project_id, 'fixture-project');
    });
  }
  await check('Weekly replacement accepts another supported report type and keeps record association', async () => {
    const id = ids['weekly-pdf']; await expectStatus(await upload(file(bytes.docx, 'weekly-replacement.docx', types.docx), { replaceId: id }), 200);
    assert.equal(row(id).mime, types.docx); assert.equal(row(id).project_id, 'fixture-weekly');
  });
  await check('Owner dashboard includes private files but never exposes internal bucket keys', async () => {
    const response = await handlers.admin.GET(); await expectStatus(response, 200); const data = await response.json();
    assert(data.documents.some(document => document.id === ids.pdf && !document.isPublic)); assert(data.photos.some(photo => photo.id === ids.png));
    assert(!JSON.stringify(data).includes('vault/')); assert(!data.documents.some(document => Object.hasOwn(document, 'storageKey')));
  });
  await check('Soft delete hides a published file from everyone and lists it in recoverable trash', async () => {
    await expectStatus(await metadata(ids.pdf, { isPublic: true }), 200);
    await expectStatus(await handlers.documents.DELETE(jsonRequest('/api/admin/documents', 'DELETE', { id: ids.pdf })), 200);
    assert(row(ids.pdf).deleted_at); await expectStatus(await read(ids.pdf), 404);
    globalThis[userKey] = null; await expectStatus(await read(ids.pdf), 404); globalThis[userKey] = owner;
    const data = await (await handlers.admin.GET()).json(); assert(data.trash.some(document => document.id === ids.pdf)); assert(!data.documents.some(document => document.id === ids.pdf));
    assert(objects.has(row(ids.pdf).storage_key));
  });
  await check('Restore recovers stored bytes and previous visibility without a re-upload', async () => {
    const storageKey = row(ids.pdf).storage_key; await expectStatus(await handlers.documents.PATCH(jsonRequest('/api/admin/documents', 'PATCH', { id: ids.pdf, restore: true })), 200);
    assert.equal(row(ids.pdf).deleted_at, null); assert.equal(row(ids.pdf).storage_key, storageKey); assert.equal(row(ids.pdf).is_public, 1);
    globalThis[userKey] = null; const response = await read(ids.pdf); await expectStatus(response, 200); assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes.pdf); globalThis[userKey] = owner;
  });
  await check('Unknown ids and missing R2 objects return 404 without private metadata', async () => {
    await expectStatus(await read('missing-id'), 404); await expectStatus(await upload(file(bytes.pdf, 'missing.pdf', types.pdf), { replaceId: 'missing-id' }), 404);
    const record = row(ids.doc), stored = objects.get(record.storage_key); objects.delete(record.storage_key); await expectStatus(await read(ids.doc), 404); objects.set(record.storage_key, stored);
  });
  await check('Invalid category and record references are rejected before storage', async () => {
    const before = objects.size; await expectStatus(await upload(file(bytes.pdf, 'invalid.pdf', types.pdf), { categoryId: 'missing' }), 400);
    await expectStatus(await upload(file(bytes.pdf, 'invalid.pdf', types.pdf), { projectId: 'missing' }), 400); assert.equal(objects.size, before);
  });
  const invalidUploads = [
    ['unsupported extension', file(Buffer.from('executable fixture'), 'fixture.exe', 'application/octet-stream')],
    ['PDF with false signature', file(Buffer.from('This is not a PDF.'), 'fixture.pdf', types.pdf)],
    ['DOC with false signature', file(Buffer.from('This is not an OLE document.'), 'fixture.doc', types.doc)],
    ['Office file without package members', file(zip([['unrelated.txt', 'fixture']]), 'fixture.docx', types.docx)],
    ['Office file with macros', file(office('word', 'document.xml', [['word/vbaProject.bin', 'fixture macro']]), 'fixture.docx', types.docx)],
    ['mismatched browser MIME', file(bytes.pdf, 'fixture.pdf', 'image/png')],
    ['document marked as photo', file(bytes.pdf, 'fixture.pdf', types.pdf), { isPhoto: true }],
    ['empty file', file(new Uint8Array(), 'fixture.pdf', types.pdf)],
  ];
  for (const [name, value, fields] of invalidUploads) await check('Upload rejects ' + name + ' without writing storage or rows', async () => {
    const before = count(), stored = objects.size; await expectStatus(await upload(value, fields), 400); assert.equal(count(), before); assert.equal(objects.size, stored);
  });
  await check('File larger than 20 MB is rejected through multipart parsing', async () => {
    const large = new Uint8Array(20 * 1024 * 1024 + 1); large.set(bytes.pdf); await expectStatus(await upload(file(large, 'oversized.pdf', types.pdf)), 400);
  });
  await check('Oversized declared request is rejected before multipart storage', async () => {
    await expectStatus(await upload(file(bytes.pdf, 'declared-large.pdf', types.pdf), {}, { 'Content-Length': String(21 * 1024 * 1024) }), 413);
  });
  await check('Oversized streamed multipart body is rejected when no Content-Length is declared', async () => {
    const boundary = 'fixture-boundary'; let remaining = 21 * 1024 * 1024; let started = false;
    const stream = new ReadableStream({ pull(controller) {
      if (!started) { started = true; controller.enqueue(new TextEncoder().encode('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="huge.pdf"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.4\n')); return; }
      if (remaining > 0) { const length = Math.min(remaining, 256 * 1024); remaining -= length; controller.enqueue(new Uint8Array(length).fill(65)); }
      else { controller.enqueue(new TextEncoder().encode('\r\n--' + boundary + '--\r\n')); controller.close(); }
    } });
    const response = await handlers.documents.POST(new Request(origin + '/api/admin/documents', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'multipart/form-data; boundary=' + boundary }, body: stream, duplex: 'half' }));
    await expectStatus(response, 413);
  });
  await check('Malformed multipart, missing file and invalid metadata names are rejected', async () => {
    await expectStatus(await handlers.documents.POST(new Request(origin + '/api/admin/documents', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'text/plain' }, body: 'invalid' })), 400);
    const form = new FormData(); form.set('name', 'no file'); await expectStatus(await handlers.documents.POST(new Request(origin + '/api/admin/documents', { method: 'POST', headers: { Origin: origin }, body: form })), 400);
    await expectStatus(await metadata(ids.pdf, { name: '   ' }), 400);
  });
  for (const id of ['artifacts', 'evidence']) await check('Required ' + id + ' category cannot be deleted or renamed', async () => {
    const previous = sqlite.prepare('SELECT * FROM categories WHERE id=?').get(id); assert(previous);
    await expectStatus(await handlers.categories.DELETE(jsonRequest('/api/admin/categories', 'DELETE', { id })), 400);
    await expectStatus(await handlers.categories.PATCH(jsonRequest('/api/admin/categories', 'PATCH', { id, name: 'Altered fixture name' })), 400);
    assert.deepEqual(sqlite.prepare('SELECT * FROM categories WHERE id=?').get(id), previous);
  });
  await check('Custom category edit and delete preserve files and clear their old category', async () => {
    await expectStatus(await handlers.categories.PATCH(jsonRequest('/api/admin/categories', 'PATCH', { id: 'fixture-materials', name: 'Renamed fixture category' })), 200);
    assert.equal(sqlite.prepare('SELECT name FROM categories WHERE id=?').get('fixture-materials').name, 'Renamed fixture category');
    const before = count(); await expectStatus(await handlers.categories.DELETE(jsonRequest('/api/admin/categories', 'DELETE', { id: 'fixture-materials' })), 200);
    assert.equal(count(), before); assert.equal(row(ids.pdf).category_id, null); assert.equal(sqlite.prepare('SELECT * FROM categories WHERE id=?').get('fixture-materials'), undefined);
  });

  await check('MP4 uploads preserve bytes and support inline seeking', async()=>{
    const data=Uint8Array.from([0,0,0,24,102,116,121,112,105,115,111,109,0,1,2,3,4,5,6,7,8,9,10,11]);
    const id=await created(file(data,'fixture-video.mp4','video/mp4'),{isPublic:true});
    const whole=await read(id);assert.equal(whole.status,200);assert.equal(whole.headers.get('Accept-Ranges'),'bytes');assert.match(whole.headers.get('Content-Disposition'),/^inline/);assert.deepEqual(new Uint8Array(await whole.arrayBuffer()),data);
    for(const [range,expected,start] of [['bytes=4-7',data.slice(4,8),4],['bytes=20-',data.slice(20),20],['bytes=-3',data.slice(-3),21],['bytes=20-999',data.slice(20),20]]){
      const response=await handlers.file.GET(new Request(origin+'/api/files/'+id,{headers:{Range:range}}),{params:Promise.resolve({id})});
      assert.equal(response.status,206);assert.equal(response.headers.get('Content-Length'),String(expected.length));assert.equal(response.headers.get('Content-Range'),`bytes ${start}-${start+expected.length-1}/${data.length}`);assert.deepEqual(new Uint8Array(await response.arrayBuffer()),expected);
    }
    for(const range of ['bytes=24-','bytes=9-2','bytes=-0','bytes=0-1,4-5','bad-range'])assert.equal((await handlers.file.GET(new Request(origin+'/api/files/'+id,{headers:{Range:range}}),{params:Promise.resolve({id})})).status,416);
  });
  await check('Private and deleted videos remain inaccessible through byte ranges', async()=>{
    const id=await created(file(Uint8Array.from([0,0,0,12,102,116,121,112,1,2,3,4]),'private-video.mp4','video/mp4'));
    globalThis[userKey]=null;assert.equal((await handlers.file.GET(new Request(origin+'/api/files/'+id,{headers:{Range:'bytes=0-3'}}),{params:Promise.resolve({id})})).status,404);
    globalThis[userKey]=owner;await expectStatus(await handlers.documents.DELETE(jsonRequest('/api/admin/documents','DELETE',{id})),200);assert.equal((await read(id)).status,404);
  });
  await check('Photo essay ZIP downloads as an attachment and false media signatures are rejected', async()=>{
    const data=zip([['slide.txt','disposable archive fixture']]);const id=await created(file(data,'photo-essay.zip','application/zip'),{isPublic:true});const response=await read(id);assert.equal(response.status,200);assert.match(response.headers.get('Content-Disposition'),/^attachment/);assert.deepEqual(Buffer.from(await response.arrayBuffer()),data);
    await expectStatus(await upload(file(Buffer.from('false signature'),'invalid.mp4','video/mp4')),400);await expectStatus(await upload(file(Buffer.from('false signature'),'invalid.zip','application/zip')),400);
  });
  const fixtureReference={id:'fixture-reference',title:'Disposable source',publisher:'Fixture publisher',url:'https://reference.example.test/resource',group:'Business & management',sourceType:'Textbook',note:'Disposable reference.',status:'Source listed',fileIds:[],position:1,isPublic:true};
  await check('Reference editor requires owner access and same-origin requests',async()=>{
    globalThis[userKey]=null;await expectStatus(await handlers.references.PUT(jsonRequest('/api/admin/references','PUT',{references:[fixtureReference]})),401);
    globalThis[userKey]=owner;await expectStatus(await handlers.references.PUT(jsonRequest('/api/admin/references','PUT',{references:[fixtureReference]},{Origin:'https://another.example.test'})),403);
  });
  await check('Saving source references persists the list without modifying uploaded files',async()=>{
    const before=count();await expectStatus(await handlers.references.PUT(jsonRequest('/api/admin/references','PUT',{references:[{...fixtureReference,fileIds:[ids.pdf]}]})),200);
    const stored=JSON.parse(sqlite.prepare('SELECT value FROM settings WHERE key=?').get('source-references').value);assert.equal(stored.length,1);assert.equal(stored[0].title,'Disposable source');assert.deepEqual(stored[0].fileIds,[ids.pdf]);assert.equal(count(),before);
    await expectStatus(await handlers.references.PUT(jsonRequest('/api/admin/references','PUT',{references:[]})),200);assert.deepEqual(JSON.parse(sqlite.prepare('SELECT value FROM settings WHERE key=?').get('source-references').value),[]);
  });
  await check('Bad reference links, missing works and malformed input cannot overwrite references',async()=>{
    for(const body of [null,{references:[{...fixtureReference,url:'javascript:alert(1)'}]},{references:[{...fixtureReference,fileIds:['missing-work']}]},{references:[fixtureReference,{...fixtureReference,id:'duplicate-url'}]}])await expectStatus(await handlers.references.PUT(jsonRequest('/api/admin/references','PUT',body)),400);
    assert.deepEqual(JSON.parse(sqlite.prepare('SELECT value FROM settings WHERE key=?').get('source-references').value),[]);
  });

} finally {
  sqlite.close(); objects.clear(); delete globalThis[envKey]; delete globalThis[userKey];
}
console.log('\n' + checks + ' isolated actual document API checks passed.');
