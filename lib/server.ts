import { defaultAttestations, attestationIds } from './attestations';
import { defaultDeclarationEntry } from './declaration';
import { defaultReferences, publishedReferences, referenceGroups, referenceTypes, referenceStatuses, referenceUrlKey } from './references';
import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { aboutContentRevision, aboutPhotoFields, academicContentRevision, contentRevision, defaultCategories, defaultCompanyEntries, defaultCapstoneEntry, defaultEntries, defaultLegacyEntries, defaultProfile, defaultProtectedCategories, defaultSproutProject, protectedCategoryIds } from './defaults';
import type { AdminData, ArchiveFile, Category, Entry, Portfolio, Profile, SourceReference, DeclarationContent } from './types';
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export function database() { if (!env.DB) throw new ApiError(503,'The database is temporarily unavailable.'); return env.DB; }
export function bucket() { if (!env.BUCKET) throw new ApiError(503,'File storage is temporarily unavailable.'); return env.BUCKET; }
export async function isAdmin() {
  const user = await getChatGPTUser();
  const email = env.ADMIN_EMAIL || (import.meta.env.DEV ? 'seedy@sites.test' : '');
  return Boolean(user && email && user.email.toLowerCase() === email.toLowerCase());
}
export async function requireAdmin(request?: Request) {
  if (!(await isAdmin())) throw new ApiError(401, 'Sign in with the owner account.');
  if (request && !['GET','HEAD'].includes(request.method)) sameOrigin(request);
}
export function sameOrigin(request: Request) {
  const origin=request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') throw new ApiError(403,'Requests from other websites are not allowed.');
}
export function apiError(error: unknown) {
  if (!(error instanceof ApiError)) console.error('Portfolio API error', error);
  return Response.json({ error: error instanceof ApiError ? error.message : 'The action could not be completed. Please try again.' },{status:error instanceof ApiError?error.status:500,headers:{'Cache-Control':'no-store'}});
}
export function success(data: unknown) { return Response.json(data,{headers:{'Cache-Control':'no-store'}}); }
export async function readJson(request: Request) {
  if (Number(request.headers.get('content-length')||0)>100_000) throw new ApiError(413,'The request is too large.');
  const reader=request.body?.getReader();if(!reader)throw new ApiError(400,'Invalid request data.');const decoder=new TextDecoder();let text='',size=0;for(;;){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>100_000){await reader.cancel();throw new ApiError(413,'The request is too large.')}text+=decoder.decode(part.value,{stream:true})}text+=decoder.decode();
  try{return JSON.parse(text)}catch{throw new ApiError(400,'Invalid data.');}
}
export function clean(value: unknown, max=5000) { if(typeof value!=='string') return ''; return value.trim().slice(0,max); }
export function validImage(value: unknown) { const s=clean(value,500); return /^\/(images\/[^?#]+|api\/files\/[\w-]+)$/.test(s)?s:''; }
export function validLink(value: unknown) { const s=clean(value,500); if(!s)return ''; try {const u=new URL(s);return u.protocol==='https:'?u.href:''} catch{return ''} }
export const activeEntryKinds = ['company', 'project', 'fieldwork', 'weekly', 'capstone', 'attestation', 'declaration'] as const;
export const reportMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
export function isReportMime(mime: string) { return reportMimeTypes.includes(mime); }
export async function validateFileRecord(projectId: string | null, mime: string) {
 if (!projectId) return;
 const record = await database().prepare('SELECT kind FROM entries WHERE id=?').bind(projectId).first<{kind:string}>();
 if (!record) throw new ApiError(400, 'Record not found.');
 if (record.kind === 'weekly' && !isReportMime(mime)) throw new ApiError(400, 'Weekly Reports accept PDF, DOC, and DOCX files only.');
}
export function normalizeWeekly(entry: Entry): Entry {
 const ordinal = /^(?:week-|weekly-record-|weekly-report-)(\d+)$/.exec(entry.id)?.[1] || /^Weekly (?:Record|Report)\s+(\d+)$/i.exec(entry.title)?.[1];
 return {...entry, title:entry.title.replace(/^Weekly Record(\s+\d+)$/i,'Weekly Report$1'), subtitle:'',description:'',period:'',category:'',role:'',result:'',image:'',sections:[],table:undefined,link:'',code:'',facts:[],timeline:[],sources:[],gallery:[],researchRevision:'',isExample:false,position:Math.max(1,Math.min(999,ordinal?Number(ordinal):entry.position||1))};
}
function migrateProjectShowcase(entry: Entry): Entry {
 const untouchedDemo = entry.id === defaultSproutProject.id && entry.kind === 'project' && entry.isExample
  && entry.title === 'From idea to insight' && entry.subtitle === 'Your first project'
  && entry.image === '/images/architecture.jpg' && !entry.link && !entry.code
  && entry.description === 'Introduce a project of your own. Explain the question, your approach, and the work you contributed. Replace this guide with your own project story.';
 return untouchedDemo ? {...defaultSproutProject,isPublic:entry.isPublic,position:entry.position} : entry;
}
function migrateCompany(stored: Entry | undefined, fallback: Entry): Entry {
 if (!stored) return fallback;
 const oldSections = [
  {heading:'Company information',body:'Editable placeholder. Add verified information and cite your sources here.'},
  {heading:'Dedicated content',body:'Editable placeholder. Add your company notes, selected materials, or analysis here.'},
 ];
 const oldImage = fallback.id === 'company-tiffany' ? '/images/tiffany-study.svg' : '/images/kazakhyuvelir-study.svg';
 const uneditedPlaceholder = stored.isExample && [fallback.title, fallback.id==='company-kazakhyuvelir'?'Kazakhyuvelir':'Tiffany & Co.'].includes(stored.title) && stored.subtitle === 'Company editorial'
  && stored.description === 'Editable placeholder. Add a verified company description here.'
  && !stored.period && !stored.category && !stored.role && !stored.result && !stored.link && !stored.code
  && stored.image === oldImage && JSON.stringify(stored.sections || []) === JSON.stringify(oldSections)
  && !stored.table && !stored.facts?.length && !stored.timeline?.length && !stored.sources?.length && !stored.gallery?.length;
 if (stored.researchRevision !== fallback.researchRevision && uneditedPlaceholder) return {...fallback,isPublic:stored.isPublic,position:stored.position};
 const company: Entry = {...fallback,...stored,kind:'company'};
 // Replace the previous supplied cover while keeping the owner's custom images.
 if (company.id === 'company-tiffany' && company.image === '/images/companies/tiffany-diamond.jpg') company.image = fallback.image;
 return company;
}
export async function initialize() {
 const db=database();
 const settings=await db.prepare("SELECT * FROM settings WHERE key IN ('initialized','academic-content-revision')").all<{key:string,value:string}>();
 const initialized=settings.results.some(setting=>setting.key==='initialized');
 const current=settings.results.some(setting=>setting.key==='academic-content-revision'&&setting.value===academicContentRevision);
 if(!initialized){
  const cond=" WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key='initialized')";
  await db.batch([
   db.prepare('INSERT OR IGNORE INTO settings (key,value) SELECT ?,?'+cond).bind('profile',JSON.stringify(defaultProfile)),
   ...defaultEntries.map(entry=>db.prepare('INSERT OR IGNORE INTO entries (id,kind,data,is_public,position) SELECT ?,?,?,?,?'+cond).bind(entry.id,entry.kind,JSON.stringify(entry),entry.isPublic?1:0,entry.position)),
   ...defaultCategories.map(category=>db.prepare('INSERT OR IGNORE INTO categories (id,name) SELECT ?,?'+cond).bind(category.id,category.name)),
   db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)').bind('academic-content-revision',academicContentRevision),
   db.prepare("INSERT OR IGNORE INTO settings (key,value) VALUES ('initialized','1')"),
  ]);
 }else if(!current){
  const rows=await db.prepare('SELECT * FROM entries ORDER BY position ASC').all<{id:string,kind:string}>();
  const hasEditableRecords=rows.results.some(entry=>['project','fieldwork','weekly'].includes(entry.kind)&&entry.id!=='field-gallery'&&!(entry.kind==='weekly'&&/^week-[5-9]$/.test(entry.id)));
  await db.batch([
   ...(!hasEditableRecords?defaultLegacyEntries:[]).map(entry=>db.prepare('INSERT OR IGNORE INTO entries (id,kind,data,is_public,position) VALUES (?,?,?,?,?)').bind(entry.id,entry.kind,JSON.stringify(entry),entry.isPublic?1:0,entry.position)),
   ...defaultCategories.map(category=>db.prepare('INSERT OR IGNORE INTO categories (id,name) VALUES (?,?)').bind(category.id,category.name)),
   db.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('academic-content-revision',academicContentRevision),
  ]);
 }
 await db.batch([
  ...[...defaultCompanyEntries,defaultCapstoneEntry,...defaultAttestations,defaultDeclarationEntry].map(entry=>db.prepare('INSERT OR IGNORE INTO entries (id,kind,data,is_public,position) VALUES (?,?,?,?,?)').bind(entry.id,entry.kind,JSON.stringify(entry),entry.isPublic?1:0,entry.position)),
  ...defaultProtectedCategories.map(category=>db.prepare('INSERT OR IGNORE INTO categories (id,name) VALUES (?,?)').bind(category.id,category.name)),
 ]);
}
function fileFromRow(r: Record<string, unknown>): ArchiveFile {return {id:String(r.id),name:String(r.name),description:String(r.description),categoryId:r.category_id as string|null,size:Number(r.size),mime:String(r.mime),isPublic:!!r.is_public,isPhoto:!!r.is_photo,projectId:r.project_id as string|null,addedAt:String(r.added_at),deletedAt:r.deleted_at as string|null};}
export async function getPortfolio(admin=false): Promise<Portfolio | AdminData> {
 const db=database();
 const [settings,entries,categories,files]=await Promise.all([
 db.prepare("SELECT * FROM settings WHERE key IN ('profile','initialized','academic-content-revision','source-references')").all<{key:string,value:string}>(),
 db.prepare('SELECT * FROM entries ORDER BY position ASC').all<{id:string,kind:string,data:string,is_public:number}>(),
 db.prepare('SELECT * FROM categories ORDER BY name').all<Category>(),
 db.prepare(`SELECT * FROM documents ${admin?'':'WHERE is_public=1 AND deleted_at IS NULL'} ORDER BY added_at DESC`).all<Record<string,unknown>>()]);
 const initialized=settings.results.some(r=>r.key==='initialized');
 const currentContent=settings.results.some(r=>r.key==='academic-content-revision'&&r.value===academicContentRevision);
 const storedProfile=JSON.parse(settings.results.find(r=>r.key==='profile')?.value||'{}') as Partial<Profile>;
 const profile={...defaultProfile,...storedProfile} as Profile;
 if(storedProfile.contentRevision!==contentRevision){
  for(const key of ['name','latinName','initials','academicGroup','email','secondaryEmail','contentRevision'] as const)profile[key]=defaultProfile[key];
  profile.heroPhoto=defaultProfile.heroPhoto;
  if(profile.biographyPhoto?.startsWith('/images/'))profile.biographyPhoto=defaultProfile.biographyPhoto;
 }
 if(storedProfile.aboutContentRevision!==aboutContentRevision){
  for(const key of ['aboutText',...aboutPhotoFields,'aboutContentRevision'] as const)profile[key]=defaultProfile[key];
 }
 const storedEntries=new Map(entries.results.map(r=>[r.id,{...JSON.parse(r.data),id:r.id,kind:r.kind,isPublic:!!r.is_public} as Entry]));
 const companies=defaultCompanyEntries.map(entry=>migrateCompany(storedEntries.get(entry.id),entry));
 const editableEntries=[...storedEntries.values()].filter(entry=>['project','fieldwork','weekly'].includes(entry.kind)&&entry.id!=='field-gallery'&&!(entry.kind==='weekly'&&/^week-[5-9]$/.test(entry.id)));
 const restoreDefaults=!initialized||(!currentContent&&!editableEntries.length);
 const capstone={...defaultCapstoneEntry,...storedEntries.get(defaultCapstoneEntry.id),kind:'capstone' as const};
 const attestations=defaultAttestations.map(entry=>({...entry,...storedEntries.get(entry.id),kind:'attestation' as const}));
 const declaration={...defaultDeclarationEntry,...storedEntries.get(defaultDeclarationEntry.id),kind:'declaration' as const};
 const allEntries=[...(restoreDefaults?defaultLegacyEntries:editableEntries),...companies,capstone,...attestations,declaration].map(entry=>entry.kind==='weekly'?normalizeWeekly(entry):migrateProjectShowcase(entry)).sort((a,b)=>a.position-b.position);
 const restoredCategories=!initialized||!currentContent?defaultCategories:defaultProtectedCategories;
 const allCategories=[...new Map([...restoredCategories,...categories.results].map(category=>[category.id,{...category,isProtected:(protectedCategoryIds as readonly string[]).includes(category.id)}])).values()];
 const allFiles=files.results.map(fileFromRow);
 const savedReferences=settings.results.find(setting=>setting.key==='source-references');
 const references:SourceReference[]=savedReferences?JSON.parse(savedReferences.value):defaultReferences;
 const base:Portfolio={profile,entries:allEntries.filter(e=>admin||e.isPublic),categories:allCategories,documents:allFiles.filter(f=>!f.isPhoto&&!f.deletedAt),photos:allFiles.filter(f=>f.isPhoto&&!f.deletedAt),references:admin?references:publishedReferences(references,allFiles)};
 if(!admin)return base;
 const msgs=await db.prepare('SELECT * FROM messages ORDER BY created_at DESC LIMIT 200').all<Record<string,unknown>>();
 return {...base,messages:msgs.results.map(m=>({id:String(m.id),name:String(m.name),email:String(m.email),message:String(m.message),createdAt:String(m.created_at),isRead:!!m.is_read})),trash:allFiles.filter(f=>!!f.deletedAt)};
}
export function validateProfile(data: Record<string, unknown>): Profile {
 const result={...defaultProfile};
 for(const key of Object.keys(result) as (keyof Profile)[]) result[key]=clean(data[key],['biography','story','values','interests','goals','aboutText'].includes(key)?12000:1200);
 result.heroPhoto=typeof data.heroPhoto==='string'?validImage(data.heroPhoto):defaultProfile.heroPhoto; result.biographyPhoto=typeof data.biographyPhoto==='string'?validImage(data.biographyPhoto):defaultProfile.biographyPhoto;
 for(const key of aboutPhotoFields) result[key]=validImage(data[key]);
 result.linkedin=validLink(data.linkedin);result.instagram=validLink(data.instagram);
 result.contentRevision=contentRevision;
 result.aboutContentRevision=aboutContentRevision;
 if([result.email,result.secondaryEmail].some(email=>email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))throw new ApiError(400,'Please check the email addresses.');
 if(!result.name)throw new ApiError(400,'Please enter a name.');
 return result;
}
export function validateReferences(data: unknown): SourceReference[] {
 if(!Array.isArray(data)||data.length>150)throw new ApiError(400,'Please provide up to 150 references.');
 const ids=new Set<string>();const urls=new Set<string>();
 return data.map((item,index)=>{
  if(!item||typeof item!=='object')throw new ApiError(400,'Invalid reference.');
  const r=item as Record<string,unknown>;const id=clean(r.id,80);const title=clean(r.title,300);const url=validLink(r.url);
  if(!/^[\w-]{1,80}$/.test(id)||ids.has(id))throw new ApiError(400,'Each reference needs a unique identifier.');
  if(!title||!url)throw new ApiError(400,'Each reference needs a title and a valid HTTPS source URL.');
  const key=referenceUrlKey(url);if(urls.has(key))throw new ApiError(400,'This source URL is already listed.');ids.add(id);urls.add(key);
  if(!referenceGroups.includes(String(r.group))||!referenceTypes.includes(String(r.sourceType))||!referenceStatuses.includes(String(r.status)))throw new ApiError(400,'Please select a reference category, type and citation status.');
  const fileIds=Array.isArray(r.fileIds)?[...new Set(r.fileIds.filter((id:unknown)=>typeof id==='string'&&/^[\w-]{1,80}$/.test(id)))].slice(0,100) as string[]:[];
  return {id,title,url,publisher:clean(r.publisher,200),group:String(r.group),sourceType:String(r.sourceType),status:String(r.status),note:clean(r.note,2000),fileIds,isPublic:r.isPublic===true,position:index+1};
 });
}
export function validateEntry(data: Record<string,unknown>): Entry {
 if(data.id==='field-gallery')throw new ApiError(400,'This archived record is no longer editable. Manage its files in Documents.');
 if(!(activeEntryKinds as readonly string[]).includes(String(data.kind)))throw new ApiError(400,'Unknown section.');
 if((data.kind==='declaration'&&data.id!=='ai-declaration')||(data.id==='ai-declaration'&&data.kind!=='declaration'))throw new ApiError(400,'Please select the AI Declaration.');
 if((data.kind==='attestation'&&!(attestationIds as readonly string[]).includes(String(data.id)))||((attestationIds as readonly string[]).includes(String(data.id))&&data.kind!=='attestation'))throw new ApiError(400,'Please select one of the four attestations.');
 const fixedCompany=defaultCompanyEntries.some(entry=>entry.id===data.id);
 if((data.kind==='company'&&!fixedCompany)||(fixedCompany&&data.kind!=='company'))throw new ApiError(400,'Please select one of the two companies.');
 if((data.kind==='capstone'&&data.id!=='capstone-main')||(data.id==='capstone-main'&&data.kind!=='capstone'))throw new ApiError(400,'Please select the Capstone Project.');
 const title=clean(data.title,200);if(!title)throw new ApiError(400,'Please enter a title.');
 const entry:Entry={id:typeof data.id==='string'&&/^[\w-]{1,80}$/.test(data.id)?data.id:crypto.randomUUID(),kind:data.kind as Entry['kind'],title,subtitle:clean(data.subtitle,200),description:clean(data.description,12000),period:clean(data.period,100),category:clean(data.category,100),role:clean(data.role,400),result:clean(data.result,5000),image:data.kind==='company'?validEditorialImage(data.image):validImage(data.image),sections:Array.isArray(data.sections)?data.sections.slice(0,20).filter(s=>s&&typeof s==='object').map(s=>({heading:clean(s.heading,200),body:clean(s.body,12000)})):[],table:data.table&&typeof data.table==='object'&&Array.isArray((data.table as Record<string,unknown>).columns)?validateTable(data.table as Record<string,unknown>):undefined,link:validLink(data.link),code:clean(data.code,20000),isPublic:data.isPublic===true,isExample:data.isExample===true,position:Math.max(0,Math.min(999,Number(data.position)||0)),facts:validateObjectList(data.facts,['label','value'],24),timeline:validateObjectList(data.timeline,['year','title','body'],40),sources:validateObjectList(data.sources,['title','url'],40).map(source=>({...source,url:validLink(source.url)})),gallery:validateObjectList(data.gallery,['src','alt','caption','sourceUrl'],30).map(item=>({...item,src:validEditorialImage(item.src),sourceUrl:validLink(item.sourceUrl)})),primaryFileId:clean(data.primaryFileId,80),supportingFileId:clean(data.supportingFileId,80),previewFileId:clean(data.previewFileId,80),supportingPreviewFileId:clean(data.supportingPreviewFileId,80),researchRevision:clean(data.researchRevision,200)};
 if(entry.kind==='declaration')entry.declaration=validateDeclaration(data.declaration);
 return entry.kind==='weekly'?normalizeWeekly(entry):entry;
}

function validateDeclaration(value:unknown):DeclarationContent {
 if(!value||typeof value!=='object')throw new ApiError(400,'Please provide the declaration content.');
 const d=value as Record<string,unknown>;
 if(!Array.isArray(d.details)||!Array.isArray(d.blocks))throw new ApiError(400,'Please provide declaration details and sections.');
 const blockIds=new Set<string>();
 const blocks=d.blocks.slice(0,12).map((item:Record<string,unknown>)=>{
  if(!item||typeof item!=='object')throw new ApiError(400,'Invalid declaration section.');
  const id=clean(item.id,40);if(!/^[\w-]{1,40}$/.test(id)||blockIds.has(id))throw new ApiError(400,'Each declaration section needs a unique identifier.');blockIds.add(id);
  return {id,title:clean(item.title,200),intro:clean(item.intro,3000),columns:Array.isArray(item.columns)?item.columns.slice(0,6).map(c=>clean(c,200)):[],rows:Array.isArray(item.rows)?item.rows.slice(0,30).filter(Array.isArray).map(row=>row.slice(0,6).map(cell=>clean(cell,3000))):[],paragraphs:Array.isArray(item.paragraphs)?item.paragraphs.slice(0,12).map(p=>clean(p,5000)):[]};
 });
 return {preparedOn:clean(d.preparedOn,100),status:clean(d.status,200),scope:clean(d.scope,5000),details:d.details.slice(0,12).filter(item=>item&&typeof item==='object').map(item=>({label:clean(item.label,100),value:clean(item.value,300)})),blocks};
}

function validateTable(data:Record<string,unknown>){return {columns:(data.columns as unknown[]).slice(0,8).map(c=>clean(c,120)),rows:Array.isArray(data.rows)?data.rows.slice(0,50).filter(Array.isArray).map(row=>row.slice(0,8).map((cell:unknown)=>clean(cell,2000))):[]}}

function validEditorialImage(value:unknown){return validImage(value)||validLink(value)}
function validateObjectList<K extends string>(value:unknown,keys:readonly K[],limit:number):Record<K,string>[]{return Array.isArray(value)?value.slice(0,limit).filter(item=>item&&typeof item==='object').map(item=>Object.fromEntries(keys.map(key=>[key,clean(item[key],key==='body'?12000:2000)])) as Record<K,string>):[]}
