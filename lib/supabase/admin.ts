import { createClient } from '@supabase/supabase-js';
export const storageBucket='portfolio-vault';
export function supabaseAdmin(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key)throw new Error('File storage is not configured.');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export const supabaseBucket={
 async get(key:string,options?:{range:{offset:number;length:number}}){
  const {data,error}=await supabaseAdmin().storage.from(storageBucket).download(key);
  if(error){if(String(error.status)==='404'||error.message.toLowerCase().includes('not found'))return null;throw error;}
  if(!data)return null;
  const body=options?data.slice(options.range.offset,options.range.offset+options.range.length):data;
  return {body:body.stream(),size:body.size};
 },
 async put(key:string,bytes:Uint8Array,options?:{httpMetadata:{contentType:string}}){
  const {error}=await supabaseAdmin().storage.from(storageBucket).upload(key,bytes,{contentType:options?.httpMetadata.contentType||'application/octet-stream',upsert:false});if(error)throw error;
 },
 async delete(key:string){const {error}=await supabaseAdmin().storage.from(storageBucket).remove([key]);if(error)throw error;},
};
