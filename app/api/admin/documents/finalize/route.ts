import { requireAdmin,readJson,apiError,ApiError } from '@/lib/server';
import { supabaseAdmin,storageBucket } from '@/lib/supabase/admin';
import { POST as saveDocument } from '../route';
import { MAX_FILE_SIZE } from '@/lib/uploads';
export const maxDuration=60;
export async function POST(request:Request){let path='';try{
 await requireAdmin(request);const input=await readJson(request);
 path=String(input.path||'');if(!/^incoming\/[\w-]{36}\.(pdf|doc|docx|pptx|xlsx|mp4|zip|png|jpe?g|webp|gif)$/.test(path))throw new ApiError(400,'Invalid upload.');
 const {data,error}=await supabaseAdmin().storage.from(storageBucket).download(path);if(error||!data)throw new ApiError(400,'Upload not found.');
 if(!data.size||data.size>MAX_FILE_SIZE)throw new ApiError(413,'The maximum file size is 20 MB.');
 const form=new FormData();
 form.set('file',new File([data],String(input.originalName||''),{type:String(input.mime||'application/octet-stream')}));
 for(const key of ['name','description','categoryId','projectId','isPublic','isPhoto','replaceId'])if(typeof input[key]==='string')form.set(key,input[key]);
 const headers=new Headers(request.headers);headers.delete('content-type');headers.delete('content-length');
 // Reuse the existing signature, Office macro, category, visibility, and
 // replacement validation instead of trusting metadata from the browser.
 return await saveDocument(new Request(request.url,{method:'POST',headers,body:form}));
 }catch(error){return apiError(error);}finally{if(path.startsWith('incoming/'))await supabaseAdmin().storage.from(storageBucket).remove([path]).catch(()=>{});}}
