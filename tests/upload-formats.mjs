import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
const origin='http://127.0.0.1:5173';const headers={Cookie:'__sites_local_auth=1',Origin:origin};
await mkdir('work/upload-fixtures',{recursive:true});
execFileSync('python3',['-c',`import zipfile
from pathlib import Path
root=Path('work/upload-fixtures')
for ext,folder,part in [('docx','word','document.xml'),('pptx','ppt','presentation.xml'),('xlsx','xl','workbook.xml')]:
 with zipfile.ZipFile(root/('fixture.'+ext),'w',zipfile.ZIP_DEFLATED) as z:
  z.writestr('[Content_Types].xml','<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>')
  z.writestr(folder+'/'+part,'<?xml version="1.0"?><root>Disposable local upload fixture</root>')
with zipfile.ZipFile(root/'macro.docx','w') as z:
 z.writestr('[Content_Types].xml','<Types/>');z.writestr('word/document.xml','<root/>');z.writestr('word/vbaProject.bin','macro')
`]);
await writeFile('work/upload-fixtures/fixture.doc',Buffer.concat([Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]),Buffer.alloc(504)]));
for(const ext of ['png','jpg','webp'])await sharp({create:{width:16,height:16,channels:3,background:'#102d25'}}).toFormat(ext==='jpg'?'jpeg':ext).toFile('work/upload-fixtures/fixture.'+ext);
await writeFile('work/upload-fixtures/fixture.gif',Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64'));
const types={doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',png:'image/png',jpg:'image/jpeg',webp:'image/webp',gif:'image/gif'};
let checks=0;
for(const[ext,type]of Object.entries(types)){
 const marker=crypto.randomUUID();const form=new FormData();form.set('file',new File([await readFile('work/upload-fixtures/fixture.'+ext)],'disposable-local-qa-'+marker+'.'+ext,{type}));form.set('description','Disposable local QA fixture '+marker);form.set('projectId','assignment-3');form.set('isPhoto',String(type.startsWith('image/')));
 const response=await fetch(origin+'/api/admin/documents',{method:'POST',headers,body:form});const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));checks++;console.log('PASS '+ext.toUpperCase()+' upload and record attachment');
 try{const owner=await fetch(origin+'/api/files/'+data.id,{headers});assert.equal(owner.status,200);assert.equal(owner.headers.get('Content-Type'),type);await owner.arrayBuffer();checks++;
 const anonymous=await fetch(origin+'/api/files/'+data.id);assert.equal(anonymous.status,404);checks++;
 }finally{await fetch(origin+'/api/admin/documents',{method:'DELETE',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({id:data.id})})}
}
const macro=new FormData();macro.set('file',new File([await readFile('work/upload-fixtures/macro.docx')],'macro.docx',{type:types.docx}));assert.equal((await fetch(origin+'/api/admin/documents',{method:'POST',headers,body:macro})).status,400);checks++;console.log('PASS Office macro payload rejected');
console.log(checks+' additional format, privacy, attachment and download checks passed.');
