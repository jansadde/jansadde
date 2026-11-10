import { ApiError } from './server';
export const MAX_FILE_SIZE=20*1024*1024;
const mimeByExt: Record<string,string>={mp4:'video/mp4',zip:'application/zip',pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif'};
export async function validateUpload(file: File, photo=false) {
 const ext=file.name.split('.').pop()?.toLowerCase()||'';const mime=mimeByExt[ext];
 if(!mime||(photo&&!mime.startsWith('image/')))throw new ApiError(400,'Supported formats: PDF, DOC, DOCX, PPTX, XLSX, MP4, ZIP, JPG, PNG, WEBP and GIF.');
 if(!file.size||file.size>MAX_FILE_SIZE)throw new ApiError(400,'The file must not be empty and must be 20 MB or smaller.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 const start=String.fromCharCode(...bytes.slice(0,8));
 const matches=ext==='mp4'?String.fromCharCode(...bytes.slice(4,8))==='ftyp':ext==='zip'?bytes[0]===0x50&&bytes[1]===0x4b:ext==='pdf'?start.startsWith('%PDF-'):['docx','pptx','xlsx'].includes(ext)?bytes[0]===0x50&&bytes[1]===0x4b:ext==='doc'?bytes[0]===0xd0&&bytes[1]===0xcf&&bytes[2]===0x11&&bytes[3]===0xe0:['jpg','jpeg'].includes(ext)?bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff:ext==='png'?bytes[0]===0x89&&start.slice(1,4)==='PNG':ext==='gif'?start.startsWith('GIF8'):start.startsWith('RIFF')&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 if(!matches)throw new ApiError(400,'The file contents do not match its extension.');
 if(['docx','pptx','xlsx'].includes(ext)) {
   // ZIP central-directory names are visible even when member content is deflated.
   const names=new TextDecoder('latin1').decode(bytes);
   const folder=ext==='docx'?'word/':ext==='pptx'?'ppt/':'xl/';
   if(!names.includes('[Content_Types].xml')||!names.includes(folder)||/vbaProject\.bin/i.test(names))throw new ApiError(400,'The Office file is invalid or contains macros.');
 }
 if(file.type&&file.type!=='application/octet-stream'&&file.type!==mime&&!(ext==='doc'&&file.type==='application/x-ole-storage')&&!(ext==='zip'&&file.type==='application/x-zip-compressed'))throw new ApiError(400,'The file type does not match its extension.');
 return {bytes,mime,ext};
}
