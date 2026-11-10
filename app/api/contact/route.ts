import { database,readJson,clean,sameOrigin,success,apiError,ApiError } from '@/lib/server';
export async function POST(request:Request){try{
 sameOrigin(request);const d=await readJson(request);if(d.website)return success({ok:true});
 const name=clean(d.name,120),email=clean(d.email,200),message=clean(d.message,5000);
 if(!name||!message||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new ApiError(400,'Please enter your name, email address and message.');
 if(d.consent!==true)throw new ApiError(400,'Please consent to sharing your message.');
 const db=database();const hour=Math.floor(Date.now()/3600000);const ip=request.headers.get('cf-connecting-ip')||'local';const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip+hour));const key=Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');
 const result=await db.prepare('INSERT INTO rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,Date.now()+3600000).first<{count:number}>();if(result&&result.count>5)throw new ApiError(429,'Too many messages. Please try again in an hour.');
 await db.batch([db.prepare('INSERT INTO messages (id,name,email,message,created_at,is_read) VALUES (?,?,?,?,?,0)').bind(crypto.randomUUID(),name,email,message,new Date().toISOString()),db.prepare('DELETE FROM rate_limits WHERE expires_at<?').bind(Date.now())]);return success({ok:true});
}catch(e){return apiError(e)}}
