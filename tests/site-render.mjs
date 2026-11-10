// Actual page/component rendering with disposable content. No network, server,
// database, user documents or browser storage are used. Client interactions are
// verified separately; async server components are resolved before React SSR.
import assert from 'node:assert/strict';
import { access, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cloneElement, createElement, isValidElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';
const root = fileURLToPath(new URL('..', import.meta.url));
const directory = resolve(root, 'work/site-render'); await mkdir(directory, { recursive: true });
const portfolioKey = Symbol.for('personal-atelier.site-render.portfolio');
const pathnameKey = Symbol.for('personal-atelier.site-render.pathname');
const ownerKey = Symbol.for('personal-atelier.site-render.owner');
const bundle = resolve(directory, 'pages.mjs');
await build({
  stdin: { contents: `
    export { default as AIDeclaration } from './app/ai-declaration/page.tsx';
    export * from './lib/declaration.ts';
    export { default as Attestations } from './app/attestations/page.tsx';
    export * from './lib/attestations.ts';
    export * from './lib/references.ts';
    export { default as Home } from './app/page.tsx';
    export { default as AboutMe } from './app/about-me/page.tsx';
    export { default as Companies } from './app/companies/page.tsx';
    export { default as TechCode } from './app/tech-code/page.tsx';
    export { default as Artifacts } from './app/artifacts/page.tsx';
    export { default as EvidenceFolder } from './app/evidence-folder/page.tsx';
    export { default as Capstone } from './app/capstone-project/page.tsx';
    export { default as WeeklyReports } from './app/weekly-reports/page.tsx';
    export { default as AllProject } from './app/projects/page.tsx';
    export { default as FieldWork } from './app/fieldwork/page.tsx';
    export { default as ProjectDetail } from './app/projects/[id]/page.tsx';
    export { AdminPanel } from './components/site/admin.tsx';
    export { navigation } from './lib/navigation.ts';
    export * from './lib/defaults.ts';`, resolveDir: root, sourcefile: 'site-render-entry.ts' },
  outfile: bundle, platform: 'node', format: 'esm', bundle: true, jsx: 'automatic', mainFields: ['module', 'main'],
  external: ['react', 'react/*', 'react-dom', 'react-dom/*'],
  plugins: [{ name: 'isolated-page-fixtures', setup(builder) {
    builder.onResolve({ filter: /^@\/lib\/server$/ }, () => ({ path: 'server', namespace: 'page-fixture' }));
    builder.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: 'navigation', namespace: 'page-fixture' }));
    builder.onLoad({ filter: /.*/, namespace: 'page-fixture' }, ({ path }) => ({ loader: 'js', contents: path === 'server'
      ? `export async function getPortfolio() { return structuredClone(globalThis[Symbol.for('personal-atelier.site-render.portfolio')]); }
         export async function isAdmin() { return !!globalThis[Symbol.for('personal-atelier.site-render.owner')]; }`
      : `export function usePathname() { return globalThis[Symbol.for('personal-atelier.site-render.pathname')] || '/'; }
         export function notFound() { throw new Error('Fixture page not found'); }
         export function redirect(destination) { throw new Error('Unexpected redirect: ' + destination); }
         export function permanentRedirect(destination) { throw new Error('Unexpected redirect: ' + destination); }` }));
  } }],
});
const pages = await import(pathToFileURL(bundle).href);
let checks = 0;
function check(label, assertion) { assertion(); checks++; console.log('PASS ' + label); }
async function checkAsync(label, assertion) { await assertion(); checks++; console.log('PASS ' + label); }
function portfolio() { return { profile: structuredClone(pages.defaultProfile), entries: structuredClone([...pages.defaultEntries,...pages.defaultAttestations,pages.defaultDeclarationEntry]), categories: structuredClone(pages.defaultCategories), documents: [], photos: [], references: [] }; }
async function resolveAsync(node) {
  node = await node;
  if (Array.isArray(node)) { const resolved = await Promise.all(node.map(resolveAsync)); return resolved.some((child, index) => child !== node[index]) ? resolved : node; }
  if (!isValidElement(node)) return node;
  if (typeof node.type === 'function' && node.type.constructor.name === 'AsyncFunction') return resolveAsync(await node.type(node.props));
  if (!Object.hasOwn(node.props, 'children')) return node;
  const children = await resolveAsync(node.props.children);
  return children === node.props.children ? node : cloneElement(node, { children });
}
async function render(Page, path, data = portfolio(), { owner = false, props } = {}) {
  globalThis[portfolioKey] = data; globalThis[pathnameKey] = path; globalThis[ownerKey] = owner;
  return renderToStaticMarkup(await resolveAsync(await Page(props)));
}
function text(html) { return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>'); }
function anchors(html) { return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(match => ({ attributes: match[1], href: text(/\bhref="([^"]*)"/.exec(match[1])?.[1] || ''), label: text(match[2]) })); }
function nav(html) { const match = /<nav\b[^>]*aria-label="Main navigation"[^>]*>([\s\S]*?)<\/nav>/.exec(html); assert(match); return anchors(match[1]); }
function main(html) { const match = /<main\b[^>]*id="main"[^>]*>([\s\S]*?)<\/main>/.exec(html); assert(match); return match[1]; }
function footer(html) { const match = /<footer\b[^>]*>([\s\S]*?)<\/footer>/.exec(html); assert(match); return match[1]; }
const expectedNav = [['/', 'Home'], ['/about-me', 'About Me'], ['/companies', 'Companies'], ['/tech-code', 'Tech Code'], ['/artifacts', 'Artifacts'], ['/attestations', 'Attestations'], ['/evidence-folder', 'Evidence Folder'], ['/capstone-project', 'Capstone Project'], ['/weekly-reports', 'Weekly Reports'], ['/ai-declaration', 'AI Declaration']];
const arrowGlyphs = /[\u2190-\u21ff\u27f0-\u27ff\u2900-\u297f\u2794\u279c-\u27af\u27b1\u2b05-\u2b07]/;
const file = (id, extra = {}) => ({ id, name: 'Fixture ' + id + '.pdf', description: 'Disposable owner-provided file description.', mime: 'application/pdf', categoryId: 'artifacts', size: 2048, isPublic: true, isPhoto: false, projectId: null, addedAt: '2026-11-07T00:00:00.000Z', deletedAt: null, ...extra });
try {
  const paths = [
    ['Home', '/', '/'], ['AboutMe', '/about-me', '/about-me'], ['Companies', '/companies', '/companies'], ['TechCode', '/tech-code', '/tech-code'],
    ['Attestations', '/attestations', '/attestations'], ['Artifacts', '/artifacts', '/artifacts'], ['EvidenceFolder', '/evidence-folder', '/evidence-folder'],
    ['AIDeclaration','/ai-declaration','/ai-declaration'], ['Capstone', '/capstone-project', '/capstone-project'], ['WeeklyReports', '/weekly-reports', '/weekly-reports'],
    ['AllProject', '/projects', '/tech-code'], ['FieldWork', '/fieldwork', '/tech-code'],
    ['ProjectDetail', '/projects/example-project-1', '/tech-code'],
  ];
  const rendered = new Map();
  for (const [name, path] of paths) rendered.set(name, await render(pages[name], path, portfolio(), { props: name === 'ProjectDetail' ? { params: Promise.resolve({ id: 'example-project-1' }) } : undefined }));
  check('All public routes render a main region, page heading and footer', () => {
    for (const [name, html] of rendered) { assert.equal((html.match(/<main\b/g) || []).length, 1, name); assert(/<h1\b/.test(main(html)), name); assert(footer(html)); }
  });
  check('Every public page includes About Me alongside the existing main navigation links', () => {
    for (const [name, html] of rendered) assert.deepEqual(nav(html).map(link => [link.href, link.label]), expectedNav, name);
  });
  check('Navigation active states follow public pages and preserved project routes', () => {
    for (const [name, , active] of paths) { const links = nav(rendered.get(name)).filter(link => link.attributes.includes('aria-current="page"')); assert.deepEqual(links.map(link => link.href), [active], name); }
  });
  check('Companies submenu contains both company anchors and Tech Code contains only All Project', () => {
    assert.deepEqual(pages.navigation.find(group => group.label === 'Companies').items.map(item => [item.href, item.label]), [['/companies#company-tiffany', 'Tiffany & Co.'], ['/companies#company-kazakhyuvelir', 'KazakhYuvelir']]);
    assert.deepEqual(pages.navigation.find(group => group.label === 'Tech Code').items.map(item => [item.href, item.label]), [['/projects', 'All Project']]);
  });
  check('Removed Education, Achievements and Photographs destinations are absent from all public navigation and footers', () => {
    for (const [name, html] of rendered) {
      const links = [...nav(html), ...anchors(footer(html))];
      assert(!links.some(link => /^\/(education|achievements|photographs|photos)(?:$|[?#])/.test(link.href)), name);
      assert(!links.some(link => /^(Education|Achievements|Photographs)$/.test(link.label)), name);
    }
  });
  check('Every public footer retains separate clickable owner email addresses', () => {
    for (const [name, html] of rendered) assert.deepEqual(anchors(footer(html)).filter(link => link.href === 'mailto:' + link.label).map(link => [link.href, link.label]), [['mailto:almasarsekbaeva@yandex.com', 'almasarsekbaeva@yandex.com'], ['mailto:260184@astanait.edu.kz', '260184@astanait.edu.kz']], name);
  });
  await checkAsync('Every footer subsection opens an existing page and fragment', async () => {
    const nineWeeks = portfolio(); const first = nineWeeks.entries.find(entry=>entry.kind==='weekly');
    for(let n=5;n<=9;n++)nineWeeks.entries.push({...first,id:'owner-week-'+n,title:'Weekly Report '+n,position:n});
    const byPath = new Map(paths.map(([name, path]) => [path, rendered.get(name)]));
    byPath.set('/weekly-reports',await render(pages.WeeklyReports,'/weekly-reports',nineWeeks));
    const weeklyLinks=anchors(footer(rendered.get('Home'))).filter(link=>/^Weekly Report \d+$/.test(link.label));
    assert.deepEqual(weeklyLinks.map(link=>[link.label,link.href]),Array.from({length:9},(_,i)=>['Weekly Report '+(i+1),'/weekly-reports#weekly-report-'+(i+1)]));
    for (const link of anchors(footer(rendered.get('Home')))) {
      if (!link.href.startsWith('/') || link.href.startsWith('/admin')) continue;
      const [path, fragment] = link.href.split('#'); const target = byPath.get(path || '/'); assert(target, link.href);
      if (fragment) assert(target.includes('id="' + fragment + '"'), link.href);
    }
  });
  check('All public pages include decorative diamonds with animation timing properties', () => {
    for (const [name, html] of rendered) { assert(/<svg\b[^>]*class="diamond-symbol /.test(html), name); assert(html.includes('--diamond-duration:'), name); assert(html.includes('aria-hidden="true"'), name); }
  });
  check('Public pages remain English and omit directional icons, arrow decoration and empty image sources', () => {
    for (const [name, html] of rendered) {
      assert(!/[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(text(html)), name); assert(!arrowGlyphs.test(text(html)), name); assert(!/lucide-(?:arrow|chevron)/.test(html), name);
      for (const image of html.matchAll(/<img\b([^>]*)>/g)) assert(/\bsrc="[^"\s]+"/.test(image[1]), name + ': ' + image[0]);
    }
  });
  const home = rendered.get('Home');
  check('Home prominently renders the exact owner name and academic group immediately beneath it', () => {
    assert(/<h1 aria-label="Sarsekbaeva Almagul">/.test(home)); assert(home.includes('Sarsekbaeva')); assert(home.includes('Almagul')); assert(/<\/h1><p class="academic-group">AIB 2604<\/p>/.test(home));
  });
  check('Home uses the supplied personal photograph with its small nearby diamond', () => {
    assert(/<img\b[^>]*src="\/images\/almagul-home-portrait.jpg"/.test(home)); assert(home.includes('photograph provided by the owner')); assert(/class="diamond-symbol photo-diamond"/.test(home)); assert(!home.includes('/images/portrait.jpg')); assert(!home.includes('AN ILLUSTRATIVE STUDY IN FORM')); assert(home.includes('E PORTFOLIO')); assert(!home.includes('Get in touch')); assert(!home.includes('PERSONAL WEBSITE'));
  });
  check('Home directory links to every current portfolio chapter without retired sections', () => {
    const directory = /id="portfolio"[^>]*>([\s\S]*?)<\/section>/.exec(home); assert(directory);
    assert.deepEqual(anchors(directory[1]).map(link => link.href), expectedNav.filter(([href]) => !['/', '/about-me'].includes(href)).map(([href]) => href));
  });
  check('The footer retains its subsection directory without the large conversation heading', () => {
    assert(!footer(home).includes('Let’s begin a conversation.')); assert(!footer(home).includes('THE NEXT CHAPTER'));
    for (const label of ['Weekly Report 1', 'Weekly Report 9', 'Personal story', 'Contact', 'Sources &amp; references', 'All Project']) assert(footer(home).includes(label));
    assert(!anchors(footer(home)).some(link => link.href.startsWith('/fieldwork')));
    assert(!main(home).includes('home-about')); assert(!main(home).includes('home-projects'));
  });
  const about = main(rendered.get('AboutMe'));
  check('About Me displays the owner story and six supplied photograph positions without an Edit link', () => {
    assert(about.includes('Photograph 1 of 6')); assert.equal((about.match(/aria-label="Show photograph /g) || []).length, 6);
    assert(about.includes('src="/images/about/photo-01.jpg"')); assert(about.includes('Ever since I was a little girl,'));
    assert(about.includes('the cherry on top of a cake.')); assert(about.includes('individuality, creativity,'));
    assert(!about.includes('To be added')); assert(!about.includes('Edit About Me')); assert(about.includes('Pause slideshow'));
  });
  const aboutData = portfolio(); aboutData.profile.aboutText = 'Owner story <script>fixture</script> & text.'; aboutData.profile.aboutPhoto1 = '/api/files/owner-photo-one';
  const editedAbout = main(await render(pages.AboutMe, '/about-me', aboutData, { owner: true }));
  check('About Me renders owner content safely and omits editing controls even for the owner', () => {
    assert(editedAbout.includes('Owner story &lt;script&gt;fixture&lt;/script&gt; &amp; text.')); assert(editedAbout.includes('src="/api/files/owner-photo-one"'));
    assert(!anchors(editedAbout).some(link => link.href === '/admin?section=about')); assert(!editedAbout.includes('Edit About Me'));
  });
  const noPhoto = portfolio(); noPhoto.profile.heroPhoto = ''; noPhoto.profile.biographyPhoto = '';
  const noPhotoHome = await render(pages.Home, '/', noPhoto);
  check('An intentionally cleared homepage photograph inserts no stock portrait or empty image', () => { assert(!/<img\b/.test(main(noPhotoHome))); assert(noPhotoHome.includes('Sarsekbaeva')); });
  const companies = rendered.get('Companies');
  check('Companies renders both researched editorial profiles and its anchor index', () => {
    for (const company of pages.defaultCompanyEntries) { assert(companies.includes('id="' + company.id + '"')); assert(companies.includes('id="' + company.id + '-title"')); assert(anchors(main(companies)).some(link => link.href === '#' + company.id)); }
    assert(companies.includes('Tiffany &amp; Co.')); assert(companies.includes('KazakhYuvelir')); assert(!companies.includes('Editable placeholder. Add a verified company description'));
  });
  check('Each company displays its full facts, history, leadership, characteristics, products and timeline', () => {
    for (const company of pages.defaultCompanyEntries) {
      const start = companies.indexOf('id="' + company.id + '"'), next = companies.indexOf('<section id="company-', start + 1); const profile = companies.slice(start, next < 0 ? undefined : next), content = text(profile);
      for (const fact of company.facts) { assert(content.includes(fact.label), company.id + ' ' + fact.label); assert(content.includes(fact.value), company.id + ' ' + fact.value); }
      for (const section of company.sections) { assert(content.includes(section.heading), company.id + ' ' + section.heading); assert(content.includes(section.body), company.id + ' body missing'); }
      assert(content.includes('Development timeline')); for (const moment of company.timeline) assert(content.includes(moment.title), company.id + ' timeline ' + moment.title);
    }
  });
  check('Foundation dates and current leadership preserve their required historical distinctions', () => {
    const content = text(companies); for (const value of ['1837', 'Charles Lewis Tiffany', 'John B. Young', 'Anthony Ledru', 'LVMH', '1941', '14 October 1993', 'Yuvelirtorg', 'Aida Dabyrovna Inkerbayeva']) assert(content.includes(value), value);
    assert(content.includes('state jewelry-trade institution')); assert(content.includes('not the registration date'));
  });
  check('Each company has traceable source links and a visual gallery with official-source image credits', () => {
    const links = anchors(main(companies));
    for (const company of pages.defaultCompanyEntries) { assert(companies.includes('id="' + company.id + '-sources"')); assert(companies.includes('id="' + company.id + '-gallery"')); assert(links.some(link => link.href === company.link && link.label === 'Visit the official website'));
      for (const source of company.sources) assert(links.some(link => link.href === source.url && link.label === source.title), source.url);
      for (const image of company.gallery) { assert(companies.includes('src="' + image.src + '"')); assert(links.some(link => link.href === image.sourceUrl)); assert(text(companies).includes(image.caption)); }
    }
  });
  await checkAsync('All official company photographs are present in the local project assets', async () => {
    for (const company of pages.defaultCompanyEntries) for (const image of company.gallery) { assert(image.src.startsWith('/images/companies/')); await access(resolve(root, 'public', image.src.slice(1))); }
  });
  const editedCompanyData = portfolio(); editedCompanyData.entries.find(entry => entry.id === 'company-tiffany').description = 'Owner edit <script>fixture</script> & company notes.';
  const editedCompany = await render(pages.Companies, '/companies', editedCompanyData);
  check('Owner-edited company copy is displayed and safely escaped', () => { assert(editedCompany.includes('Owner edit &lt;script&gt;fixture&lt;/script&gt; &amp; company notes.')); assert(!editedCompany.includes('<script>fixture')); });
  const privateCompanyData = portfolio(); privateCompanyData.entries.find(entry => entry.id === 'company-tiffany').isPublic = false; privateCompanyData.documents.push(file('hidden-company-file', { projectId: 'company-tiffany' }));
  const privateCompany = await render(pages.Companies, '/companies', privateCompanyData);
  check('Private company profile and its document attachments are omitted from the rendered collection', () => {
    assert(!privateCompany.includes('id="company-tiffany"')); assert(!privateCompany.includes('id="company-tiffany-sources"')); assert(!main(privateCompany).includes('Fixture hidden-company-file.pdf')); assert(privateCompany.includes('id="company-kazakhyuvelir"')); assert(!anchors(main(privateCompany)).some(link => link.href === '#company-tiffany'));
  });
  const tech = main(rendered.get('TechCode'));
  check('Tech Code page offers only All Project', () => {
    assert.deepEqual(anchors(tech).filter(link => link.attributes.includes('tech-code-choice')).map(link => link.href), ['/projects']);
    assert(tech.includes('<h2>All Project</h2>')); assert(!tech.includes('Field Work')); assert(!tech.includes('Governance')); assert(!tech.includes('Deliverables'));
  });
  const archive = portfolio(); archive.documents = [file('artifact', { categoryId: 'artifacts' }), file('legacy-artifact', { categoryId: 'deliverables' }), file('evidence', { categoryId: 'evidence' }), file('project-attachment', { categoryId: 'project-materials', projectId: 'example-project-1' })]; archive.photos = [file('legacy-field-image', { name: 'Legacy gallery image.jpg', categoryId: null, projectId: 'field-gallery', mime: 'image/jpeg', isPhoto: true })];
  const artifactHtml = await render(pages.Artifacts, '/artifacts', archive, { owner: true });
  check('Artifacts includes its own category, legacy deliverables and old field-gallery images', () => {
    for (const value of ['Fixture artifact.pdf', 'Fixture legacy-artifact.pdf', 'Legacy gallery image.jpg']) assert(main(artifactHtml).includes(value), value);
    assert(!main(artifactHtml).includes('Fixture evidence.pdf')); assert(!main(artifactHtml).includes('Fixture project-attachment.pdf'));
    assert(anchors(main(artifactHtml)).some(link => link.href === '/admin?section=artifacts' && link.label === 'Manage files'));
  });
  check('Artifacts keeps file search, preview and download without unrelated category tabs', () => {
    const html = main(artifactHtml); assert(html.includes('Search files')); assert(!html.includes('class="filters"')); assert(html.includes('>Preview</button>'));
    assert(anchors(html).some(link => link.href === '/api/files/artifact?download=1'));
  });
  archive.references=[{id:'fixture-reference',title:'Disposable official source',publisher:'Fixture Publisher',url:'https://source.example.test/research',group:'Tiffany & LVMH',sourceType:'Company source',status:'Source listed',note:'Scope of this source, not an assignment file.',fileIds:['artifact'],isPublic:true,position:1}];
  const evidenceHtml = await render(pages.EvidenceFolder, '/evidence-folder', archive, { owner: true });
  check('Evidence Folder keeps its name and contains references instead of a file archive', () => {
    const html=main(evidenceHtml); assert(html.includes('<h1>Evidence Folder</h1>'));
    assert(html.includes('Disposable official source'));assert(html.includes('Search the collection'));assert(html.includes('References in a work'));
    assert(anchors(html).some(link=>link.href==='https://source.example.test/research'&&link.label==='Open source'));
    assert(!anchors(html).some(link=>link.href.startsWith('/api/files/')));assert(!html.includes('>Preview</button>'));assert(!html.includes('Search files'));
    assert(anchors(html).some(link=>link.href==='/admin?section=evidence'&&link.label==='Manage references'));
  });
  check('Reference source text is escaped and external links open safely', () => {
    const html=main(evidenceHtml);assert(anchors(html).filter(link=>link.href.startsWith('https://')).every(link=>link.attributes.includes('target="_blank"')&&link.attributes.includes('noopener noreferrer')));
  });
  const projectHtml = await render(pages.ProjectDetail, '/projects/example-project-1', archive, { props: { params: Promise.resolve({ id: 'example-project-1' }) } });
  check('All Project and Field Work retain their editable record content and project detail attachments', () => {
    const allProjects = main(rendered.get('AllProject')); assert(allProjects.includes('src="/images/projects/sprout-poster.png"')); assert(anchors(allProjects).some(link => link.href === 'https://sprout-neon-five.vercel.app' && link.label === 'Visit website')); assert(!allProjects.includes('project-card')); assert(!allProjects.includes('A different perspective')); assert(!allProjects.includes('Ideas take shape.'));
    for (const entry of pages.defaultEntries.filter(entry => entry.kind === 'fieldwork')) assert(text(main(rendered.get('FieldWork'))).includes(entry.title));
    assert(main(projectHtml).includes('SPROUT')); assert(main(projectHtml).includes('Fixture project-attachment.pdf')); assert(!main(projectHtml).includes('Fixture evidence.pdf'));
  });
  const capstoneData = portfolio(); const capstone = capstoneData.entries.find(entry => entry.id === 'capstone-main'); capstone.title = 'Owner final project'; capstone.description = 'Final research <script>fixture</script> & evidence.'; capstone.sections = [{ heading: 'Owner methodology', body: 'Own project material.' }]; capstoneData.documents = [file('capstone-word', { name: 'Capstone document.docx', projectId: 'capstone-main', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })]; capstoneData.photos = [file('capstone-photo', { name: 'Capstone image.jpg', projectId: 'capstone-main', mime: 'image/jpeg', isPhoto: true })];
  const capstoneHtml = await render(pages.Capstone, '/capstone-project', capstoneData, { owner: true });
  check('Capstone displays owner-editable title, description, chapters and mixed attachments with escaped content', () => {
    const html = main(capstoneHtml); for (const value of ['Owner final project', 'Owner methodology', 'Own project material.', 'Capstone document.docx', 'Capstone image.jpg']) assert(html.includes(value), value);
    assert(html.includes('Final research &lt;script&gt;fixture&lt;/script&gt; &amp; evidence.')); assert(!html.includes('<script>fixture')); assert(anchors(html).some(link => link.href === '/admin?section=capstone&record=capstone-main'));
  });
  const featuredData = portfolio(); const featuredEntry = featuredData.entries.find(entry => entry.id === 'capstone-main');
  Object.assign(featuredEntry, { primaryFileId: 'final-slides', supportingFileId: 'final-appendix', supportingPreviewFileId: 'final-appendix-preview', subtitle: 'Strategic Digital Innovation for KazakhYuvelir', description: 'A phased proposal for verified product information' });
  featuredData.documents = [file('final-slides', {projectId:'capstone-main'}), file('final-appendix', {projectId:'capstone-main',mime:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}), file('final-appendix-preview',{projectId:'capstone-main'})];
  const featuredHtml = main(await render(pages.Capstone, '/capstone-project', featuredData));
  check('Featured Capstone presentation places its Appendix below the viewer without the removed duplicate introduction', () => {
    assert(featuredHtml.includes('id="capstone-presentation"')); assert(featuredHtml.includes('aria-label="Capstone Appendix"'));
    assert(anchors(featuredHtml).some(link=>link.href==='/api/files/final-slides?download=1'&&link.label==='Download presentation'));
    assert(anchors(featuredHtml).some(link=>link.href==='/api/files/final-appendix?download=1'&&link.label==='Download appendix'));
    assert(featuredHtml.includes('>View appendix</button>'));
    for(const value of ['THE FINAL CAPSTONE / PRESENTATION',featuredEntry.subtitle,featuredEntry.description]) assert(!featuredHtml.includes(value));
    assert(!featuredHtml.includes('document-card'));
  });
  featuredData.documents.find(item=>item.id==='final-appendix').isPublic=false;
  featuredData.documents.find(item=>item.id==='final-appendix-preview').deletedAt='2026-11-10T00:00:00Z';
  const hiddenAppendixHtml=main(await render(pages.Capstone,'/capstone-project',featuredData));
  check('Private or deleted supporting files cannot appear as a public Capstone Appendix', () => {
    assert(!hiddenAppendixHtml.includes('aria-label="Capstone Appendix"')); assert(!hiddenAppendixHtml.includes('/api/files/final-appendix')); assert(hiddenAppendixHtml.includes('/api/files/final-slides?download=1'));
  });
  const weeklyDefault = main(rendered.get('WeeklyReports'));
  check('Default Weekly Reports contains ascending title-only slots without invented prose, cards or documents', () => {
    const headings = [...weeklyDefault.matchAll(/<h2>(.*?)<\/h2>/g)].map(match => text(match[1])); assert.deepEqual(headings, Array.from({ length: 4 }, (_, i) => 'Weekly Report ' + (i + 1)));
    assert.equal((weeklyDefault.match(/weekly-file-placeholder/g) || []).length, 4); assert(!/<p(?:\s|>)/.test(weeklyDefault)); assert(!weeklyDefault.includes('document-card')); assert(!weeklyDefault.includes('/api/files/'));
  });
  const weeklyData = portfolio(); weeklyData.entries.reverse(); const firstWeek = weeklyData.entries.find(entry => entry.id === 'week-1'); firstWeek.description = 'DO NOT RENDER WEEKLY DESCRIPTION'; firstWeek.subtitle = firstWeek.description; firstWeek.sections = [{ heading: 'DO NOT RENDER CHAPTER', body: firstWeek.description }]; weeklyData.entries.push({ ...firstWeek, id: 'owner-week-5', title: 'Weekly Report 5', position: 5 }); weeklyData.documents = [file('weekly-pdf', { name: 'Renamed owner report', projectId: 'week-1' }), file('weekly-word', { name: 'Owner custom title.png', projectId: 'week-2', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), file('weekly-unsupported', { name: 'Misleading image.pdf', projectId: 'week-1', mime: 'image/jpeg' })];
  const weeklyOwner = main(await render(pages.WeeklyReports, '/weekly-reports', weeklyData, { owner: true }));
  check('Weekly slots keep ascending order after additional records and ignore old generated descriptions', () => {
    assert.deepEqual([...weeklyOwner.matchAll(/<h2>(.*?)<\/h2>/g)].map(match => text(match[1])), Array.from({ length: 5 }, (_, i) => 'Weekly Report ' + (i + 1)));
    assert(!weeklyOwner.includes('DO NOT RENDER')); assert(!weeklyOwner.includes('document-card'));
  });
  check('Weekly display uses trusted MIME rather than an owner-edited filename extension', () => {
    assert(weeklyOwner.includes('Renamed owner report')); assert(weeklyOwner.includes('Owner custom title.png')); assert(weeklyOwner.includes('<span>PDF</span>')); assert(weeklyOwner.includes('<span>DOCX</span>')); assert(!weeklyOwner.includes('Misleading image.pdf')); assert(!weeklyOwner.includes('Disposable owner-provided file description.'));
  });
  check('Each owner weekly upload link opens the authenticated dashboard at its actual record context', () => {
    const links = anchors(weeklyOwner).filter(link => link.label === 'Upload PDF or Word document'); assert.equal(links.length, 5);
    for (const entry of weeklyData.entries.filter(entry => entry.kind === 'weekly')) assert(links.some(link => link.href === '/admin?section=weekly&record=' + encodeURIComponent(entry.id)), entry.id);
    assert(!anchors(weeklyDefault).some(link => link.href.startsWith('/admin?section=weekly')));
  });
  check('Weekly preview and download target the real file API without preloaded report content', () => {
    for (const id of ['weekly-pdf', 'weekly-word']) assert(anchors(weeklyOwner).some(link => link.href === '/api/files/' + id + '?download=1'));
    assert.equal((weeklyOwner.match(/>Preview<\/button>/g) || []).length, 2);
  });
  const adminData = { ...portfolio(), messages: [], trash: [] }; const admin = renderToStaticMarkup(createElement(pages.AdminPanel, { initialData: adminData, displayName: 'Disposable owner' }));
  check('Owner dashboard retains functional management sections without removed Education, Achievements or Photographs tabs', () => {
    const sidebar = /<nav aria-label="Dashboard sections">([\s\S]*?)<\/nav>/.exec(admin); assert(sidebar); const labels = [...sidebar[1].matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)].map(match => text(match[1]));
    assert.deepEqual(labels, ['Overview', 'Profile', 'About Me', 'Companies', 'All Project', 'Field Work', 'Artifacts', 'AI Declaration', 'Attestations', 'Evidence Folder', 'Capstone Project', 'Weekly Reports', 'All Documents', 'Categories', 'Messages']);
    assert(!/Education|Achievements|Photographs/.test(sidebar[1])); assert(admin.includes('private until you explicitly make them public'));
  });
  check('Dashboard rendered labels stay English and arrow-free', () => { assert(!/[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(text(admin))); assert(!arrowGlyphs.test(text(admin))); assert(!/lucide-(?:arrow|chevron)/.test(admin)); });

  const attData=portfolio();attData.entries=attData.entries.map(e=>e.kind==='attestation'?{...e,primaryFileId:'main-'+e.id,supportingFileId:'support-'+e.id}:e);
  for(const e of attData.entries.filter(e=>e.kind==='attestation'))attData.documents.push({id:'main-'+e.id,name:e.title+'.docx',mime:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',size:100,isPublic:true,deletedAt:null,projectId:e.id,addedAt:'2026-11-10',description:'',categoryId:null},{id:'support-'+e.id,name:'Supporting '+e.title+'.docx',mime:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',size:100,isPublic:true,deletedAt:null,projectId:e.id,addedAt:'2026-11-10',description:'',categoryId:null});
  const attHTML=main(await render(pages.Attestations,'/attestations',attData));
  check('Four attestations preserve assignment order and the correct supporting roles',()=>{const positions=['Business Report','Video Essay','Photo Essay','Argumentative Essay'].map(t=>attHTML.indexOf('<h2>'+t+'</h2>'));assert(positions.every((p,i)=>p>=0&&(i===0||p>positions[i-1])));assert.equal((attHTML.match(/>Appendix<\/h3>/g)||[]).length,3);assert.equal((attHTML.match(/>Script<\/h3>/g)||[]).length,1);for(const e of attData.entries.filter(e=>e.kind==='attestation')){assert(attHTML.includes('/api/files/main-'+e.id+'?download=1'));assert(attHTML.includes('/api/files/support-'+e.id+'?download=1'));}});
  attData.documents[0].isPublic=false;attData.documents[1].deletedAt='2026-11-10';const hiddenHTML=main(await render(pages.Attestations,'/attestations',attData));
  check('Attestations never expose private or deleted attachments',()=>{assert(!hiddenHTML.includes('/api/files/'+attData.documents[0].id));assert(!hiddenHTML.includes('/api/files/'+attData.documents[1].id));});
  const declarationData=portfolio();const declaration=declarationData.entries.find(entry=>entry.id==='ai-declaration');declaration.primaryFileId='fixture-declaration';declaration.previewFileId='fixture-declaration-preview';
  declarationData.documents=[file('fixture-declaration',{name:'Declaration.docx',mime:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),file('fixture-declaration-preview')];
  const declarationHtml=main(await render(pages.AIDeclaration,'/ai-declaration',declarationData,{owner:true}));
  check('AI Declaration is the final header link and renders all form sections with unsigned status',()=>{
    assert.deepEqual(expectedNav.at(-1),['/ai-declaration','AI Declaration']);
    for(const block of declaration.declaration.blocks)assert(declarationHtml.includes('id="declaration-'+block.id+'"'));
    assert(declarationHtml.includes('260184'));assert(declarationHtml.includes('Awaiting student review and signature'));assert(declarationHtml.includes('Google Gemini'));assert(declarationHtml.includes('ChatGPT'));assert(declarationHtml.includes('Codex'));
    assert(declarationHtml.includes('Student signature: not signed.'));assert(anchors(declarationHtml).some(link=>link.href==='/api/files/fixture-declaration?download=1'));
  });
  declarationData.documents[0].isPublic=false;declarationData.documents[1].deletedAt='2026-11-10';
  const hiddenDeclaration=main(await render(pages.AIDeclaration,'/ai-declaration',declarationData));
  check('AI Declaration never exposes private or deleted declaration attachments',()=>{assert(!anchors(hiddenDeclaration).some(link=>link.href.startsWith('/api/files/')));assert(!hiddenDeclaration.includes('>Read document</button>'));});

} finally { delete globalThis[portfolioKey]; delete globalThis[pathnameKey]; delete globalThis[ownerKey]; }
console.log('\n' + checks + ' current full-site rendering checks passed.');
