import { requireAdmin,readJson,apiError,success,ApiError } from '@/lib/server';
import { supabaseAdmin,storageBucket } from '@/lib/supabase/admin';
// Direct owner uploads avoid the serverless request-body limit. The file stays
// private and is not added to the portfolio until server-side verification.
export async function POST(request:Request){try{
 await requireAdmin(request);const body=await readJson(request);const ext=String(body.extension||'').toLowerCase();
 if(!['pdf','doc','docx','pptx','xlsx','mp4','zip','png','jpg','jpeg','webp','gif'].includes(ext))throw new ApiError(400,'Unsupported file format.');
 const path='incoming/'+crypto.randomUUID()+'.'+ext;
 const {data,error}=await supabaseAdmin().storage.from(storageBucket).createSignedUploadUrl(path,{upsert:false});if(error)throw error;
 return success({path,token:data.token});
 }catch(error){return apiError(error);}}
