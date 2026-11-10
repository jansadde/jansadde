// Offline, disposable fixtures only. This test never opens a local or deployed database.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { build } from 'esbuild';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const buildDirectory = resolve(projectRoot, 'work/companies-model');
await mkdir(buildDirectory, { recursive: true });
const bundlePath = resolve(buildDirectory, 'server.mjs');
const envKey = Symbol.for('personal-atelier.offline-model.env');
const userKey = Symbol.for('personal-atelier.offline-model.user');
globalThis[envKey] = { ADMIN_EMAIL: 'fixture-owner@example.test' };
globalThis[userKey] = null;

await build({
  stdin: {
    contents: "export * from './lib/server.ts'; export * from './lib/defaults.ts'; export * from './lib/references.ts'; export * from './lib/declaration.ts';",
    resolveDir: projectRoot,
    sourcefile: 'companies-model-entry.ts',
  },
  outfile: bundlePath,
  platform: 'node',
  format: 'esm',
  bundle: true,
  define: { 'import.meta.env.DEV': 'false','process.env.DATABASE_URL':'"fixture://database"','process.env.SUPABASE_SECRET_KEY':'"fixture-storage"','process.env.ADMIN_EMAIL':'"fixture-owner@example.test"' },
  plugins: [{
    name: 'offline-fixtures',
    setup(builder) {
      builder.onResolve({filter:/^\.\/database$/},()=>({path:'postgres-fixture',namespace:'offline-fixtures'}));
      builder.onResolve({filter:/^\.\/supabase\/admin$/},()=>({path:'storage-fixture',namespace:'offline-fixtures'}));
      builder.onLoad({filter:/^(postgres-fixture|storage-fixture)$/,namespace:'offline-fixtures'},({path})=>({loader:'js',contents:path==='postgres-fixture'?"export const postgresDatabase={prepare(...v){return globalThis[Symbol.for('personal-atelier.offline-model.env')].DB.prepare(...v)},batch(...v){return globalThis[Symbol.for('personal-atelier.offline-model.env')].DB.batch(...v)}};":"export const supabaseBucket={get(...v){return globalThis[Symbol.for('personal-atelier.offline-model.env')].BUCKET.get(...v)},put(...v){return globalThis[Symbol.for('personal-atelier.offline-model.env')].BUCKET.put(...v)},delete(...v){return globalThis[Symbol.for('personal-atelier.offline-model.env')].BUCKET.delete(...v)}};"}));
      builder.onResolve({ filter: /^cloudflare:workers$/ }, () => ({ path: 'workers', namespace: 'offline-fixtures' }));
      builder.onResolve({ filter: /^@\/app\/chatgpt-auth$/ }, () => ({ path: 'auth', namespace: 'offline-fixtures' }));
      builder.onLoad({ filter: /.*/, namespace: 'offline-fixtures' }, ({ path }) => ({
        contents: path === 'workers'
          ? "export const env = globalThis[Symbol.for('personal-atelier.offline-model.env')];"
          : "export async function getChatGPTUser() { return globalThis[Symbol.for('personal-atelier.offline-model.user')]; }",
        loader: 'js',
      }));
    },
  }],
});
const model = await import(pathToFileURL(bundlePath).href);
let checks = 0;
function check(label, assertion) {
  assertion(); checks++;
  console.log('PASS ' + label);
}
async function checkAsync(label, assertion) {
  await assertion(); checks++;
  console.log('PASS ' + label);
}
async function rejectsStatus(action, status) {
  await assert.rejects(action, error => error instanceof model.ApiError && error.status === status);
}

function entryRow(entry, isPublic = entry.isPublic) {
  return { id: entry.id, kind: entry.kind, data: JSON.stringify(entry), is_public: isPublic ? 1 : 0, position: entry.position };
}
class FixtureDatabase {
  constructor({ initialized = true, academicCurrent = false, profile, entries = [], categories = [], documents = [] } = {}) {
    this.settings = new Map(initialized ? [['initialized', '1']] : []);
    if (academicCurrent) this.settings.set('academic-content-revision', model.academicContentRevision);
    if (profile) this.settings.set('profile', JSON.stringify(profile));
    this.entries = new Map(entries.map(row => [row.id, structuredClone(row)]));
    this.categories = new Map(categories.map(category => [category.id, structuredClone(category)]));
    this.documents = structuredClone(documents); this.messages = []; this.mutations = [];
  }
  prepare(sql) {
    const { settings, entries, categories, documents, messages, mutations } = this;
    const statement = {
      sql, values: [],
      bind(...values) { this.values = values; return this; },
      async first() {
        if (sql === 'SELECT kind FROM entries WHERE id=?') return entries.has(this.values[0]) ? { kind: entries.get(this.values[0]).kind } : null;
        throw new Error('Unexpected fixture first read: ' + sql);
      },
      async all() {
        let rows;
        if (sql.startsWith('SELECT * FROM settings')) rows = [...settings].map(([key, value]) => ({ key, value }));
        else if (sql.startsWith('SELECT * FROM entries')) rows = [...entries.values()].sort((a, b) => a.position - b.position);
        else if (sql.startsWith('SELECT * FROM categories')) rows = [...categories.values()];
        else if (sql.startsWith('SELECT * FROM documents')) rows = documents.filter(row => !sql.includes('WHERE is_public=1') || (row.is_public && !row.deleted_at));
        else if (sql.startsWith('SELECT * FROM messages')) rows = messages;
        else throw new Error('Unexpected fixture read: ' + sql);
        return { results: structuredClone(rows) };
      },
      async run() {
        mutations.push({ sql, values: [...this.values] });
        if (sql.includes('WHERE NOT EXISTS') && settings.has('initialized')) return { success: true };
        if (sql.startsWith('INSERT OR IGNORE INTO entries')) {
          const [id, kind, data, is_public, position] = this.values;
          if (!entries.has(id)) entries.set(id, { id, kind, data, is_public, position });
        } else if (sql.startsWith('INSERT OR IGNORE INTO categories')) {
          const [id, name] = this.values;
          if (!categories.has(id)) categories.set(id, { id, name });
        } else if (sql.startsWith('INSERT INTO settings')) {
          const [key, value] = this.values; settings.set(key, value);
        } else if (sql.startsWith('INSERT OR IGNORE INTO settings')) {
          const [key, value] = this.values.length ? this.values : ['initialized', '1'];
          if (!settings.has(key)) settings.set(key, value);
        } else throw new Error('Unexpected fixture mutation: ' + sql);
        return { success: true };
      },
    };
    return statement;
  }
  async batch(statements) {
    const result = [];
    for (const statement of statements) result.push(await statement.run());
    return result;
  }
}
function fixtureDatabase(options) {
  const database = new FixtureDatabase(options);
  globalThis[envKey].DB = database;
  return database;
}

try {
  const counts = entries => entries.reduce((result, entry) => { result[entry.kind] = (result[entry.kind] || 0) + 1; return result; }, {});
  const companies = entries => entries.filter(entry => entry.kind === 'company');
  const editable = entries => entries.filter(entry => ['project', 'fieldwork', 'weekly'].includes(entry.kind));
  const currentMarker = database => database.settings.get('academic-content-revision') === model.academicContentRevision;
  check('Active defaults match simplified academic navigation', () => {
    assert.deepEqual(counts(model.defaultEntries), { project: 2, fieldwork: 2, weekly: 4, company: 2, capstone: 1 });
    assert(model.defaultEntries.every(entry => model.activeEntryKinds.includes(entry.kind)));
    assert(!model.defaultEntries.some(entry => entry.id === 'field-gallery'));
  });
  check('Weekly defaults contain only ascending record titles and no invented report prose', () => {
    assert.deepEqual(model.defaultWeeklyEntries.map(entry => entry.title), Array.from({ length: 4 }, (_, i) => 'Weekly Report ' + (i + 1)));
    assert.deepEqual(model.defaultWeeklyEntries.map(entry => entry.position), [1, 2, 3, 4]);
    assert(model.defaultWeeklyEntries.every(entry => !entry.description && !entry.subtitle && !entry.sections.length && !entry.isExample));
  });
  check('Capstone is a fixed blank editable project rather than a generated submission', () => {
    assert.equal(model.defaultCapstoneEntry.id, 'capstone-main');
    assert.equal(model.defaultCapstoneEntry.kind, 'capstone');
    assert.equal(model.defaultCapstoneEntry.description, '');
    assert.deepEqual(model.defaultCapstoneEntry.sections, []);
  });
  check('Artifacts and Evidence Folder have distinct protected category identities', () => {
    assert.deepEqual([...model.protectedCategoryIds], ['artifacts', 'evidence']);
    assert.deepEqual(model.defaultProtectedCategories.map(category => category.name), ['Artifacts', 'Evidence Folder']);
    assert(model.defaultProtectedCategories.every(category => category.isProtected));
  });
  check('Research company defaults include revision, sources, timeline, facts and gallery', () => {
    assert.equal(model.defaultCompanyEntries.length, 2);
    assert(model.defaultCompanyEntries.every(entry => entry.researchRevision && entry.sources.length && entry.timeline.length && entry.facts.length && entry.gallery.length));
  });

  const oldProfile = {
    name: 'Disposable Previous Name', latinName: 'Disposable Previous Name', initials: 'DP', academicGroup: 'FIXTURE OLD',
    email: 'previous@example.test', secondaryEmail: '', heroPhoto: '/images/portrait.jpg', biographyPhoto: '/api/files/disposable-support',
    biography: 'Disposable biography fixture.', contentRevision: 'fixture-old-revision',
  };
  const ownerProject = { ...model.defaultLegacyEntries.find(entry => entry.kind === 'project'), id: 'disposable-owner-project', title: 'Disposable owner project', description: 'Disposable owner-edit.', isPublic: true };
  const archivedEntries = [
    { ...ownerProject, id: 'disposable-education', kind: 'education' }, { ...ownerProject, id: 'disposable-achievement', kind: 'achievement' },
    { ...ownerProject, id: 'disposable-deliverable', kind: 'deliverable' }, { ...ownerProject, id: 'disposable-governance', kind: 'governance' },
    { ...ownerProject, id: 'field-gallery', kind: 'fieldwork', title: 'Photographs & presentation artifacts' },
  ];
  const database = fixtureDatabase({ profile: oldProfile, entries: [entryRow(ownerProject), ...archivedEntries.map(entry => entryRow(entry))] });
  for (let i = 5; i <= 9; i++) { const entry = { ...model.defaultWeeklyEntries[0], id: 'week-' + i, title: 'Weekly Report ' + i, position: i }; database.entries.set(entry.id, entryRow(entry)); }
  const originalRows = JSON.stringify([...database.entries]);
  const originalSettings = JSON.stringify([...database.settings]);
  let portfolio = await model.getPortfolio();
  check('Old empty About Me receives the six supplied photographs and owner-written story', () => {
    assert(portfolio.profile.aboutText.startsWith('Ever since I was a little girl,'));
    for (let i = 1; i <= 6; i++) assert.equal(portfolio.profile['aboutPhoto' + i], '/images/about/photo-0' + i + '.jpg');
    assert.equal(portfolio.profile.aboutContentRevision, model.aboutContentRevision);
  });
  check('Archived weekly slots five to nine remain stored without appearing in active records', () => {
    for (let i = 5; i <= 9; i++) { assert(database.entries.has('week-' + i)); assert(!portfolio.entries.some(entry => entry.id === 'week-' + i)); }
  });
  check('Old profile receives requested name, group and both footer emails', () => {
    assert.equal(portfolio.profile.name, 'Sarsekbaeva Almagul'); assert.equal(portfolio.profile.academicGroup, 'AIB 2604');
    assert.equal(portfolio.profile.email, 'almasarsekbaeva@yandex.com'); assert.equal(portfolio.profile.secondaryEmail, '260184@astanait.edu.kz');
  });
  check('Requested photo migration preserves genuine uploaded supporting image and biography', () => {
    assert.equal(portfolio.profile.heroPhoto, '/images/almagul-home-portrait.jpg');
    assert.equal(portfolio.profile.biographyPhoto, '/api/files/disposable-support');
    assert.equal(portfolio.profile.biography, oldProfile.biography);
    assert.equal(portfolio.profile.contentRevision, model.contentRevision);
  });
  check('Public reads do not alter stored profile or archived content', () => {
    assert.equal(JSON.stringify([...database.entries]), originalRows);
    assert.equal(JSON.stringify([...database.settings]), originalSettings);
    assert.equal(database.mutations.length, 0);
  });
  check('Removed legacy kinds and former field-gallery record stay outside public and admin entries', () => {
    assert(portfolio.entries.every(entry => model.activeEntryKinds.includes(entry.kind)));
    assert(!portfolio.entries.some(entry => entry.id === 'field-gallery'));
    assert.equal(editable(portfolio.entries).length, 1);
    assert.equal(portfolio.entries.find(entry => entry.id === ownerProject.id).description, ownerProject.description);
  });
  const adminOriginal = await model.getPortfolio(true);
  check('Archived records remain stored without reappearing in administrator lists', () => {
    assert(!adminOriginal.entries.some(entry => archivedEntries.some(archived => archived.id === entry.id)));
    assert(archivedEntries.every(entry => database.entries.has(entry.id)));
  });
  check('Existing sites receive researched companies, fixed capstone and dedicated category fallbacks', () => {
    assert.deepEqual(companies(portfolio.entries).map(entry => entry.id), ['company-tiffany', 'company-kazakhyuvelir']);
    assert(portfolio.entries.some(entry => entry.id === 'capstone-main'));
    assert(portfolio.categories.find(category => category.id === 'artifacts').isProtected);
    assert(portfolio.categories.find(category => category.id === 'evidence').isProtected);
  });

  database.settings.set('profile', JSON.stringify({ ...oldProfile, heroPhoto: '/api/files/disposable-previous-home', biographyPhoto: '/images/mountains.jpg' }));
  portfolio = await model.getPortfolio();
  check('Latest explicit photo revision replaces previous selection and clears static supporting image', () => {
    assert.equal(portfolio.profile.heroPhoto, '/images/almagul-home-portrait.jpg'); assert.equal(portfolio.profile.biographyPhoto, '');
  });
  const editedProfile = { ...model.defaultProfile, name: 'Disposable Future Name', academicGroup: 'FIXTURE NEXT', email: 'future@example.test', secondaryEmail: 'future-secondary@example.test', heroPhoto: '/api/files/disposable-future-home', biographyPhoto: '/api/files/disposable-future-support', biography: 'Disposable future biography.', contentRevision: model.contentRevision };
  database.settings.set('profile', JSON.stringify(editedProfile));
  portfolio = await model.getPortfolio();
  check('Current-revision owner identity, emails and uploaded photos stay editable', () => {
    for (const field of ['name', 'academicGroup', 'email', 'secondaryEmail', 'heroPhoto', 'biographyPhoto', 'biography']) assert.equal(portfolio.profile[field], editedProfile[field]);
  });

  function oldPlaceholder(id, extra = {}) {
    return { id, kind: 'company', title: id === 'company-tiffany' ? 'Tiffany & Co.' : 'Kazakhyuvelir', subtitle: 'Company editorial',
      description: 'Editable placeholder. Add a verified company description here.', period: '', category: '', role: '', result: '',
      image: id === 'company-tiffany' ? '/images/tiffany-study.svg' : '/images/kazakhyuvelir-study.svg', isPublic: true, isExample: true, position: 0, link: '',
      sections: [{ heading: 'Company information', body: 'Editable placeholder. Add verified information and cite your sources here.' }, { heading: 'Dedicated content', body: 'Editable placeholder. Add your company notes, selected materials, or analysis here.' }], ...extra };
  }
  const oldPrivateCompany = oldPlaceholder('company-tiffany', { isPublic: true, position: 23 });
  database.entries.set(oldPrivateCompany.id, entryRow(oldPrivateCompany, false));
  database.entries.set('company-kazakhyuvelir', entryRow(oldPlaceholder('company-kazakhyuvelir')));
  portfolio = await model.getPortfolio();
  const ownerResearch = await model.getPortfolio(true);
  check('Only unedited old company placeholders migrate to researched content', () => {
    for (const fallback of model.defaultCompanyEntries) {
      const company = ownerResearch.entries.find(entry => entry.id === fallback.id);
      assert.equal(company.description, fallback.description); assert.equal(company.researchRevision, fallback.researchRevision);
      assert.deepEqual(company.facts, fallback.facts); assert.deepEqual(company.sources, fallback.sources);
    }
  });
  check('Company migration preserves stored private visibility and owner display order', () => {
    assert(!portfolio.entries.some(entry => entry.id === 'company-tiffany'));
    const company = ownerResearch.entries.find(entry => entry.id === 'company-tiffany');
    assert.equal(company.isPublic, false); assert.equal(company.position, 23);
    assert.equal(JSON.parse(database.entries.get('company-tiffany').data).description, oldPrivateCompany.description);
  });
  const ownerCompany = oldPlaceholder('company-tiffany', { description: 'Disposable owner company prose.', image: '/api/files/disposable-company-image', sections: [{ heading: 'Disposable chapter', body: 'Disposable owner content.' }] });
  database.entries.set(ownerCompany.id, entryRow(ownerCompany, false));
  const ownerEditRead = await model.getPortfolio(true);
  check('Company research migration preserves real owner prose, image, chapters and privacy', () => {
    const company = ownerEditRead.entries.find(entry => entry.id === ownerCompany.id);
    assert.equal(company.description, ownerCompany.description); assert.equal(company.image, ownerCompany.image);
    assert.deepEqual(company.sections, ownerCompany.sections); assert.equal(company.isPublic, false);
  });
  const currentCompany = oldPlaceholder('company-tiffany', { researchRevision: model.defaultCompanyEntries[0].researchRevision });
  database.entries.set(currentCompany.id, entryRow(currentCompany));
  const currentCompanyRead = await model.getPortfolio(true);
  check('A saved current company revision is not automatically replaced again', () => {
    assert.equal(currentCompanyRead.entries.find(entry => entry.id === currentCompany.id).description, currentCompany.description);
  });
  const previousTiffany = { ...model.defaultCompanyEntries[0], image: '/images/companies/tiffany-diamond.jpg', description: 'Preserve this owner research edit.' };
  database.entries.set(previousTiffany.id, entryRow(previousTiffany));
  const replacedTiffany = (await model.getPortfolio(true)).entries.find(entry => entry.id === previousTiffany.id);
  check('The old supplied Tiffany cover changes while company prose is preserved', () => {
    assert.equal(replacedTiffany.image, '/images/companies/tiffany-craft.jpg'); assert.equal(replacedTiffany.description, previousTiffany.description);
  });
  database.entries.set('capstone-main', entryRow({ ...model.defaultCapstoneEntry, description: 'Disposable private capstone.' }, false));
  portfolio = await model.getPortfolio();
  check('Private Capstone Project is not reintroduced from fallback defaults', () => assert(!portfolio.entries.some(entry => entry.id === 'capstone-main')));

  const oldWeekly = { ...model.defaultWeeklyEntries[2], title: 'Weekly Record 3', description: 'Disposable generated old prose.', subtitle: 'Disposable old subtitle.', sections: [{ heading: 'Old reflection', body: 'Disposable old report body.' }], code: 'old code', isExample: true, position: 7 };
  database.entries.set(oldWeekly.id, entryRow(oldWeekly));
  portfolio = await model.getPortfolio();
  check('Legacy weekly records become title-only without rewriting stored submissions', () => {
    const weekly = portfolio.entries.find(entry => entry.id === oldWeekly.id);
    assert.equal(weekly.title, 'Weekly Report 3'); assert.equal(weekly.position, 3); assert.equal(weekly.description, '');
    assert.equal(weekly.subtitle, ''); assert.deepEqual(weekly.sections, []); assert.equal(weekly.code, ''); assert.equal(weekly.isExample, false);
    assert.equal(JSON.parse(database.entries.get(oldWeekly.id).data).description, oldWeekly.description);
  });
  const beforeInitialize = JSON.stringify([...database.entries]);
  await model.initialize();
  check('Academic migration preserves existing edits, archived data and private records', () => {
    for (const [id, row] of JSON.parse(beforeInitialize)) assert.deepEqual(database.entries.get(id), row);
    assert(currentMarker(database)); assert(database.entries.has('capstone-main'));
    assert(database.categories.has('artifacts')); assert(database.categories.has('evidence'));
  });
  check('Record seeding never overwrites existing entry payloads', () => {
    assert(database.mutations.filter(mutation => /entries/.test(mutation.sql)).every(mutation => mutation.sql.startsWith('INSERT OR IGNORE')));
    assert(database.mutations.every(mutation => !/^DELETE|^UPDATE entries|REPLACE INTO entries/.test(mutation.sql)));
  });
  const snapshot = JSON.stringify({ entries: [...database.entries], categories: [...database.categories], settings: [...database.settings] });
  await model.initialize();
  check('Repeated academic initialization is idempotent', () => assert.equal(JSON.stringify({ entries: [...database.entries], categories: [...database.categories], settings: [...database.settings] }), snapshot));
  database.entries.delete(ownerProject.id); database.entries.delete(oldWeekly.id);
  await model.initialize();
  portfolio = await model.getPortfolio(true);
  check('Deleted editable records do not resurrect after the academic migration', () => {
    assert(!portfolio.entries.some(entry => entry.id === ownerProject.id || entry.id === oldWeekly.id));
    assert.equal(editable(portfolio.entries).length, 0);
  });
  database.categories.delete('artifacts');
  await model.initialize();
  check('Protected Artifacts category remains available after accidental missing storage metadata', () => assert(database.categories.has('artifacts')));

  const fresh = fixtureDatabase({ initialized: false });
  portfolio = await model.getPortfolio();
  check('Fresh reads expose only active new defaults without mutating storage', () => {
    assert.equal(portfolio.entries.length, 16); assert(portfolio.entries.every(entry => model.activeEntryKinds.includes(entry.kind)));
    assert.equal(fresh.entries.size, 0); assert.equal(fresh.mutations.length, 0);
  });
  await model.initialize();
  check('Fresh initialization seeds blank ordered weekly slots, researched companies and capstone', () => {
    assert.equal(fresh.entries.size, 16); assert(currentMarker(fresh));
    assert.deepEqual([...fresh.entries.values()].filter(entry => entry.kind === 'weekly').map(entry => entry.id), ['week-1', 'week-2', 'week-3', 'week-4']);
    assert.equal(JSON.parse(fresh.settings.get('profile')).heroPhoto, '/images/almagul-home-portrait.jpg');
  });
  const twoPage = fixtureDatabase({ entries: [entryRow({ ...model.defaultCompanyEntries[0], description: 'Disposable preserved company.' }, false)] });
  portfolio = await model.getPortfolio();
  check('Company-only older site receives active work and report defaults on read', () => {
    assert.equal(editable(portfolio.entries).length, 8); assert.equal(twoPage.entries.size, 1); assert.equal(twoPage.mutations.length, 0);
  });
  await model.initialize();
  check('Company-only older site receives one-time active defaults without exposing private company', () => {
    assert.equal(twoPage.entries.size, 16); assert(currentMarker(twoPage));
    assert.equal(twoPage.entries.get('company-tiffany').is_public, 0);
    assert.equal(JSON.parse(twoPage.entries.get('company-tiffany').data).description, 'Disposable preserved company.');
  });
  twoPage.entries.delete('week-4'); await model.initialize(); portfolio = await model.getPortfolio(true);
  check('A removed weekly slot remains removed after repeated initialization', () => assert(!portfolio.entries.some(entry => entry.id === 'week-4')));

  function fileRow(id, { isPublic = true, isPhoto = false, deletedAt = null, projectId = 'company-tiffany' } = {}) {
    return { id, name: 'Disposable fixture ' + id, description: 'Disposable metadata fixture.', category_id: null, size: 1024, mime: isPhoto ? 'image/jpeg' : 'application/pdf', storage_key: 'disposable-private-storage/' + id, is_public: isPublic ? 1 : 0, is_photo: isPhoto ? 1 : 0, project_id: projectId, added_at: '2026-11-07T00:00:00.000Z', deleted_at: deletedAt };
  }
  const privacyDatabase = fixtureDatabase({ academicCurrent: true, documents: [fileRow('public-document'), fileRow('private-document', { isPublic: false }), fileRow('trashed-document', { deletedAt: '2026-11-07T01:00:00.000Z' }), fileRow('public-image', { isPhoto: true }), fileRow('private-image', { isPhoto: true, isPublic: false }), fileRow('archived-gallery-material', { projectId: 'field-gallery' })] });
  const publicFiles = await model.getPortfolio(); const ownerFiles = await model.getPortfolio(true);
  check('Private and trashed documents stay outside public file metadata', () => assert.deepEqual(publicFiles.documents.map(file => file.id), ['public-document', 'archived-gallery-material']));
  check('Private images stay outside public file metadata', () => assert.deepEqual(publicFiles.photos.map(file => file.id), ['public-image']));
  check('Archived field-gallery files remain accessible as file metadata without a gallery record', () => {
    assert(publicFiles.documents.some(file => file.id === 'archived-gallery-material' && file.projectId === 'field-gallery'));
    assert(!publicFiles.entries.some(entry => entry.id === 'field-gallery'));
    assert.equal(privacyDatabase.documents.length, 6);
  });
  check('Public metadata does not expose bucket storage keys', () => assert(!JSON.stringify(publicFiles).includes('disposable-private-storage')));
  check('Owner keeps private files and recoverable trash', () => {
    assert(ownerFiles.documents.some(file => file.id === 'private-document'));
    assert(ownerFiles.photos.some(file => file.id === 'private-image'));
    assert.deepEqual(ownerFiles.trash.map(file => file.id), ['trashed-document']);
  });

  const validProfile = model.validateProfile({ ...editedProfile, contentRevision: 'untrusted-fixture-revision' });
  check('Profile validation retains both valid emails and controls its hidden revision', () => {
    assert.equal(validProfile.email, editedProfile.email); assert.equal(validProfile.secondaryEmail, editedProfile.secondaryEmail);
    assert.equal(validProfile.contentRevision, model.contentRevision);
  });
  check('About Me text and all six image slots round-trip through the profile model', () => {
    const profile = model.validateProfile({ ...editedProfile, aboutText: 'Disposable owner story.', aboutPhoto1: '/api/files/owner-one', aboutPhoto2: '/images/almagul-home.jpg', aboutPhoto3: '/api/files/owner-three', aboutPhoto4: '/api/files/owner-four', aboutPhoto5: '/api/files/owner-five', aboutPhoto6: '/api/files/owner-six' });
    assert.equal(profile.aboutText, 'Disposable owner story.'); assert.equal(profile.aboutPhoto1, '/api/files/owner-one'); assert.equal(profile.aboutPhoto2, '/images/almagul-home.jpg'); assert.equal(profile.aboutPhoto3, '/api/files/owner-three'); assert.equal(profile.aboutPhoto4, '/api/files/owner-four'); assert.equal(profile.aboutPhoto5, '/api/files/owner-five'); assert.equal(profile.aboutPhoto6, '/api/files/owner-six');
    privacyDatabase.settings.set('profile', JSON.stringify(profile));
  });
  const aboutProfile = (await model.getPortfolio(true)).profile;
  check('Saved About Me content is returned without replacing other identity fields', () => {
    assert.equal(aboutProfile.aboutText, 'Disposable owner story.'); assert.equal(aboutProfile.aboutPhoto3, '/api/files/owner-three'); assert.equal(aboutProfile.aboutPhoto6, '/api/files/owner-six'); assert.equal(aboutProfile.name, editedProfile.name);
    const invalid = model.validateProfile({ ...editedProfile, aboutPhoto1: 'javascript:alert(1)', aboutPhoto2: 'https://untrusted.test/image.jpg', aboutPhoto3: '' });
    assert.equal(invalid.aboutPhoto1, ''); assert.equal(invalid.aboutPhoto2, ''); assert.equal(invalid.aboutPhoto3, '');
  });
  for (const field of ['email', 'secondaryEmail']) check('Malformed ' + field + ' is rejected', () => assert.throws(() => model.validateProfile({ ...editedProfile, [field]: 'invalid-address' }), error => error instanceof model.ApiError && error.status === 400));
  check('Optional empty emails and intentional image removal stay valid', () => {
    const profile = model.validateProfile({ ...editedProfile, email: '', secondaryEmail: '', heroPhoto: '', biographyPhoto: '' });
    assert.equal(profile.email, ''); assert.equal(profile.secondaryEmail, ''); assert.equal(profile.heroPhoto, ''); assert.equal(profile.biographyPhoto, '');
  });
  for (const kind of ['project', 'fieldwork', 'weekly']) check('Editable active record kind ' + kind + ' accepts owner entries', () => {
    const entry = model.validateEntry({ ...model.defaultLegacyEntries.find(entry => entry.kind === kind), id: 'disposable-new-' + kind, isPublic: false });
    assert.equal(entry.kind, kind); assert.equal(entry.isPublic, false);
  });
  for (const entry of [...model.defaultCompanyEntries, model.defaultCapstoneEntry]) check('Fixed record ' + entry.id + ' stays editable', () => assert.equal(model.validateEntry(entry).id, entry.id));
  for (const kind of ['education', 'achievement', 'deliverable', 'governance']) check('Removed kind ' + kind + ' cannot create new active entries', () => assert.throws(() => model.validateEntry({ ...ownerProject, kind }), error => error instanceof model.ApiError && error.status === 400));
  check('Former field-gallery cannot be recreated through the entry editor', () => assert.throws(() => model.validateEntry({ ...ownerProject, kind: 'fieldwork', id: 'field-gallery' }), error => error instanceof model.ApiError && error.status === 400));
  check('Fixed company and capstone identities reject wrong kinds or extra records', () => {
    for (const entry of [{ ...model.defaultCompanyEntries[0], kind: 'project' }, { ...model.defaultCompanyEntries[0], id: 'disposable-company' }, { ...model.defaultCapstoneEntry, id: 'disposable-capstone' }, { ...ownerProject, id: 'capstone-main' }]) assert.throws(() => model.validateEntry(entry), error => error instanceof model.ApiError && error.status === 400);
  });
  check('Weekly entry validation strips generated content from newly saved records', () => {
    const weekly = model.validateEntry({ ...oldWeekly, facts: [{ label: 'Old', value: 'Prose' }], gallery: [{ src: '/images/architecture.jpg', alt: '', caption: '', sourceUrl: '' }] });
    assert.equal(weekly.position, 3); assert.equal(weekly.description, ''); assert.deepEqual(weekly.sections, []); assert.deepEqual(weekly.facts, []); assert.deepEqual(weekly.gallery, []);
  });
  check('Company research field validation trims text and rejects executable URL schemes', () => {
    const company = model.validateEntry({ ...model.defaultCompanyEntries[0], image: 'javascript:fixture()', facts: [{ label: ' Label ', value: ' Value ' }], timeline: [{ year: ' 2000 ', title: ' Title ', body: ' Body ' }], sources: [{ title: ' Bad ', url: 'javascript:fixture()' }, { title: ' Verified ', url: 'https://example.test/source' }], gallery: [{ src: 'javascript:fixture()', alt: ' Alt ', caption: ' Caption ', sourceUrl: 'https://example.test/image-source' }] });
    assert.equal(company.image, ''); assert.deepEqual(company.facts, [{ label: 'Label', value: 'Value' }]);
    assert.deepEqual(company.timeline, [{ year: '2000', title: 'Title', body: 'Body' }]); assert.equal(company.sources[0].url, '');
    assert.equal(company.sources[1].url, 'https://example.test/source'); assert.equal(company.gallery[0].src, ''); assert.equal(company.gallery[0].alt, 'Alt');
  });
  check('Company gallery accepts official HTTPS imagery and local owner uploads', () => {
    const company = model.validateEntry({ ...model.defaultCompanyEntries[0], gallery: [{ src: 'https://www.tiffany.com/fixture.jpg', alt: '', caption: '', sourceUrl: '' }, { src: '/api/files/disposable-image', alt: '', caption: '', sourceUrl: '' }] });
    assert.equal(company.gallery[0].src, 'https://www.tiffany.com/fixture.jpg'); assert.equal(company.gallery[1].src, '/api/files/disposable-image');
  });
  fixtureDatabase({ academicCurrent: true, entries: [entryRow(model.defaultWeeklyEntries[0]), entryRow(ownerProject)] });
  for (const mime of model.reportMimeTypes) await checkAsync('Weekly attachment helper accepts ' + mime, async () => model.validateFileRecord('week-1', mime));
  for (const mime of ['image/jpeg', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']) await checkAsync('Weekly attachment helper rejects ' + mime, async () => rejectsStatus(() => model.validateFileRecord('week-1', mime), 400));
  await checkAsync('Other project contexts retain image support', async () => model.validateFileRecord(ownerProject.id, 'image/jpeg'));
  await checkAsync('Unknown attachment destinations are rejected', async () => rejectsStatus(() => model.validateFileRecord('disposable-unknown-record', 'application/pdf'), 400));

  globalThis[userKey] = null;
  await checkAsync('Anonymous account is not an administrator', async () => assert.equal(await model.isAdmin(), false));
  await checkAsync('Anonymous admin request is rejected even with spoofed identity headers', async () => {
    await rejectsStatus(() => model.requireAdmin(new Request('https://fixture.invalid/api/admin', {
      headers: { 'oai-authenticated-user-email': 'fixture-owner@example.test' },
    })), 401);
  });
  globalThis[userKey] = { email: 'fixture-other@example.test', displayName: 'Disposable Other Account' };
  await checkAsync('Authenticated non-owner account is rejected', async () => {
    assert.equal(await model.isAdmin(), false);
    await rejectsStatus(() => model.requireAdmin(), 401);
  });
  globalThis[userKey] = { email: 'FIXTURE-OWNER@EXAMPLE.TEST', displayName: 'Disposable Owner Account' };
  await checkAsync('Configured owner email matching is case-insensitive', async () => assert.equal(await model.isAdmin(), true));
  await checkAsync('Owner read request does not require mutation Origin header', async () => {
    await model.requireAdmin(new Request('https://fixture.invalid/api/admin'));
  });
  await checkAsync('Same-origin owner mutation is permitted', async () => {
    await model.requireAdmin(new Request('https://fixture.invalid/api/admin/profile', {
      method: 'PUT', headers: { Origin: 'https://fixture.invalid' },
    }));
  });
  await checkAsync('Mutation with missing Origin is rejected', async () => {
    await rejectsStatus(() => model.requireAdmin(new Request('https://fixture.invalid/api/admin/profile', { method: 'PUT' })), 403);
  });
  await checkAsync('Cross-origin owner mutation is rejected', async () => {
    await rejectsStatus(() => model.requireAdmin(new Request('https://fixture.invalid/api/admin/profile', {
      method: 'PUT', headers: { Origin: 'https://another-fixture.invalid' },
    })), 403);
  });
  await checkAsync('Cross-site fetch metadata rejects a mutation even with matching Origin', async () => {
    await rejectsStatus(() => model.requireAdmin(new Request('https://fixture.invalid/api/admin/profile', {
      method: 'PUT', headers: { Origin: 'https://fixture.invalid', 'Sec-Fetch-Site': 'cross-site' },
    })), 403);
  });
  const sourceFixture={id:'fixture-source',title:'Fixture source',publisher:'Fixture author',url:'https://reference.example.test/item',group:'AI & careers',sourceType:'Research',status:'Source listed',note:'Disposable note',fileIds:['public-work','private-work','deleted-work'],isPublic:true,position:8};
  check('References reject unsafe, duplicate and invalid source metadata',()=>{
    const valid=model.validateReferences([sourceFixture]);assert.equal(valid[0].position,1);assert.equal(valid[0].title,'Fixture source');
    for(const bad of [null,{},[...Array(151)].map(()=>sourceFixture),[{...sourceFixture,url:'javascript:alert(1)'}],[{...sourceFixture,url:'http://reference.example.test'}],[{...sourceFixture,group:'Invalid group'}],[sourceFixture,{...sourceFixture,id:'another-source',url:'https://www.reference.example.test/item/?utm_source=test#fragment'}]])assert.throws(()=>model.validateReferences(bad),error=>error.status===400);
  });
  check('Public references strip private and deleted associations and hide orphaned references',()=>{
    const works=[{id:'public-work',isPublic:true,deletedAt:null},{id:'private-work',isPublic:false,deletedAt:null},{id:'deleted-work',isPublic:true,deletedAt:'2026-11-10'}];
    const sources=[sourceFixture,{...sourceFixture,id:'private-only',fileIds:['private-work']},{...sourceFixture,id:'unpublished',isPublic:false},{...sourceFixture,id:'manual-resource',fileIds:[]}];
    const visible=model.publishedReferences(sources,works);assert.deepEqual(visible.map(source=>source.id),['fixture-source','manual-resource']);assert.deepEqual(visible[0].fileIds,['public-work']);assert.deepEqual(sourceFixture.fileIds,['public-work','private-work','deleted-work']);
  });
  await checkAsync('Saved reference edits persist and public reads do not disclose private work names',async()=>{
    const sourceDB=new FixtureDatabase({initialized:true,academicCurrent:true,documents:[{id:'public-work',name:'Public fixture',is_public:1,deleted_at:null},{id:'private-work',name:'Private fixture',is_public:0,deleted_at:null}]});
    sourceDB.settings.set('source-references',JSON.stringify([sourceFixture]));globalThis[envKey].DB=sourceDB;
    const publicData=await model.getPortfolio();assert.deepEqual(publicData.references[0].fileIds,['public-work']);assert(!JSON.stringify(publicData).includes('Private fixture'));
    const ownerData=await model.getPortfolio(true);assert.deepEqual(ownerData.references[0].fileIds,sourceFixture.fileIds);
  });

  check('AI Declaration is a fixed editable record with validated form content',()=>{
    const valid=model.validateEntry(structuredClone(model.defaultDeclarationEntry));assert.equal(valid.kind,'declaration');assert.equal(valid.declaration.details.find(item=>item.label==='Student ID').value,'260184');assert.equal(valid.declaration.blocks.length,10);
    for(const invalid of [{...valid,id:'fake-declaration'},{...valid,kind:'project'},{...valid,declaration:null},{...valid,declaration:{...valid.declaration,blocks:[valid.declaration.blocks[0],valid.declaration.blocks[0]]}}])assert.throws(()=>model.validateEntry(invalid),error=>error.status===400);
  });
  await checkAsync('Owner declaration edits and publication settings survive normal reads',async()=>{
    const edited={...model.defaultDeclarationEntry,title:'Owner declaration',isPublic:false,declaration:{...model.defaultDeclarationEntry.declaration,status:'Owner review in progress'}};
    const db=new FixtureDatabase({initialized:true,academicCurrent:true,entries:[entryRow(edited)]});globalThis[envKey].DB=db;
    assert(!(await model.getPortfolio()).entries.some(entry=>entry.id==='ai-declaration'));
    const owner=(await model.getPortfolio(true)).entries.find(entry=>entry.id==='ai-declaration');assert.equal(owner.title,'Owner declaration');assert.equal(owner.declaration.status,'Owner review in progress');assert.equal(db.mutations.length,0);
  });

} finally {
  delete globalThis[envKey];
  delete globalThis[userKey];
}
console.log(`\n${checks} offline academic portfolio model checks passed.`);
