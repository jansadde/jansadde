// Run against the local Vite preview only. Never points at a deployed site.
import assert from 'node:assert/strict';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
assert(['localhost','127.0.0.1'].includes(new URL(origin).hostname),'Tests only support a loopback server');
const owner={Cookie:'__sites_local_auth=1',Origin:origin};let checks=0;
async function request(path,{auth=false,method='GET',body,headers={}}={}){const h={...(auth?owner:{}),...headers};if(body&&!(body instanceof FormData)){h['Content-Type']='application/json';body=JSON.stringify(body)}const r=await fetch(origin+path,{method,body,headers:h});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data=text}return {r,data,text};}
function check(value,message){assert(value,message);checks++;console.log('PASS '+message)}
async function upload(name,bytes,type='application/pdf',extra={}){const form=new FormData();form.set('file',new File([bytes],name,{type}));for(const[k,v]of Object.entries(extra))form.set(k,String(v));return request('/api/admin/documents',{auth:true,method:'POST',body:form})}
for(const path of ['/','/biography','/education','/achievements','/projects','/projects/example-project-1','/documents','/contacts','/admin','/deliverables','/weekly-records','/fieldwork','/tech-code','/governance-sources']){const {r,text}=await request(path);check(r.status===200&&text.includes('</html>'),'Page '+path+' renders');check(!/[А-Яа-яЁё]/.test(text),'Page '+path+' is English only')}
check((await request('/api/admin')).r.status===401,'Anonymous admin API rejected');
check((await request('/api/admin',{headers:{'oai-authenticated-user-id':'fake','oai-authenticated-user-email':'seedy@sites.test'}})).r.status===401,'Spoofed identity headers rejected');
check((await request('/api/admin/categories',{method:'POST',body:{name:'invalid'},headers:{Origin:origin}})).r.status===401,'Anonymous mutation rejected');
check((await request('/api/admin/categories',{auth:true,method:'POST',body:{name:'invalid'},headers:{Origin:'https://evil.example'}})).r.status===403,'Cross-origin mutation rejected');
const before=(await request('/api/admin',{auth:true})).data;check(!!before.profile,'Owner can access admin API');
const profile={...before.profile,goals:'Temporary local goal used to verify persistence.'};
check((await request('/api/admin/profile',{auth:true,method:'PUT',body:profile})).r.status===200,'Biography saves');
check((await request('/api/content')).data.profile.goals===profile.goals,'Saved biography appears in public content');
await request('/api/admin/profile',{auth:true,method:'PUT',body:before.profile});
const pub=(await request('/api/content')).data;check(pub.entries.filter(e=>e.kind==='deliverable').length===4,'Four assignment records');check(pub.entries.filter(e=>e.kind==='weekly').length===9,'Nine weekly records');check(pub.entries.filter(e=>e.kind==='fieldwork').length===3,'Fieldwork subsections');check(pub.entries.filter(e=>e.kind==='governance').length===3,'Governance subsections');
const cat=await request('/api/admin/categories',{auth:true,method:'POST',body:{name:'Local QA '+Date.now()}});check(cat.r.status===200,'Category creation');
check((await request('/api/admin/categories',{auth:true,method:'POST',body:{name:cat.data.name}})).r.status===409,'Duplicate category rejected');
const entry={id:crypto.randomUUID(),kind:'project',title:'QA project',subtitle:'Integration test',description:'Temporary local test',period:'2026',category:'QA',role:'Tester',result:'Pass',image:'',isPublic:false,isExample:false,position:999};
check((await request('/api/admin/entries',{auth:true,method:'PUT',body:entry})).r.status===200,'Draft project creation');
check(!(await request('/api/content')).data.entries.some(e=>e.id===entry.id),'Draft project hidden publicly');
check((await request('/api/admin/entries',{auth:true,method:'PUT',body:{...entry,isPublic:true}})).r.status===200,'Project publication');
check((await request('/api/content')).data.entries.some(e=>e.id===entry.id),'Published project visible');
// Minimal PDF file fixture; private, local-only, disposable.
const pdf=new TextEncoder().encode('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 300]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF');
const uploaded=await upload('qa-document.pdf',pdf,'application/pdf',{categoryId:cat.data.id,description:'QA temporary local fixture',projectId:entry.id});check(uploaded.r.status===200,'PDF upload to private storage');const id=uploaded.data.id;
check(!(await request('/api/content')).data.documents.some(d=>d.id===id),'Private document absent from public library');
check((await request('/api/files/'+id)).r.status===404,'Anonymous private file download denied');
check((await request('/api/files/'+id,{auth:true})).r.status===200,'Owner private file preview');
const dl=await request('/api/files/'+id+'?download=1',{auth:true});check(dl.r.headers.get('content-disposition').startsWith('attachment'),'Download content disposition');
check(dl.r.headers.get('cache-control')==='private, no-store','Private file responses never cache publicly');
const meta={id,name:'qa-document.pdf',description:'Updated description',categoryId:cat.data.id,projectId:entry.id,isPublic:true};
check((await request('/api/admin/documents',{auth:true,method:'PATCH',body:meta})).r.status===200,'Publish document');
check((await request('/api/files/'+id)).r.status===200,'Published document anonymously readable');
check((await request('/api/content')).data.documents.some(d=>d.id===id&&d.description==='Updated description'),'Document metadata searchable in library');
const replacement=await upload('qa-replacement.pdf',pdf,'application/pdf',{replaceId:id});check(replacement.r.status===200,'Replace document with private default: '+JSON.stringify(replacement.data));
check((await request('/api/files/'+id)).r.status===404,'Replacement defaults to private');
check((await request('/api/admin/documents',{auth:true,method:'DELETE',body:{id}})).r.status===200,'Move file to trash');
check((await request('/api/files/'+id,{auth:true})).r.status===404,'Trashed file no longer readable');
check((await request('/api/admin/documents',{auth:true,method:'PATCH',body:{id,restore:true}})).r.status===200,'Restore file from trash');
check((await request('/api/files/'+id,{auth:true})).r.status===200,'Restored file readable by owner');
check((await upload('payload.svg',new TextEncoder().encode('<svg/>'),'image/svg+xml')).r.status===400,'SVG rejected');
check((await upload('fake.pdf',new TextEncoder().encode('<script>alert(1)</script>'))).r.status===400,'Disguised file rejected by magic bytes');
check((await upload('huge.pdf',new Uint8Array(21*1024*1024))).r.status===413,'Oversized upload rejected');
check((await request('/api/contact',{method:'POST',headers:{Origin:origin},body:{name:'Local QA',email:'qa@example.com',message:'No consent',consent:false}})).r.status===400,'Contact consent required');
check((await request('/api/contact',{method:'POST',headers:{Origin:origin},body:{name:'Local QA',email:'invalid',message:'Email validation',consent:true}})).r.status===400,'Contact email validated');
await request('/api/admin/documents',{auth:true,method:'DELETE',body:{id}});
await request('/api/admin/entries',{auth:true,method:'DELETE',body:{id:entry.id}});
await request('/api/admin/categories',{auth:true,method:'DELETE',body:{id:cat.data.id}});
console.log(`\n${checks} integration checks passed. Fixtures remain only in local trash and inbox.`);
