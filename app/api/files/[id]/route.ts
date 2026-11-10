import { byteRange } from '@/lib/byte-range';
import { database,bucket,isAdmin,apiError,ApiError } from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){try{
 const {id}=await params;const doc=await database().prepare('SELECT * FROM documents WHERE id=? AND deleted_at IS NULL').bind(id).first<Record<string,unknown>>();
 if(!doc||(!doc.is_public&&!(await isAdmin())))throw new ApiError(404,'Document not found.');
 const rangeHeader=request.headers.get('range');
 const requested=String(doc.mime)==='video/mp4'&&rangeHeader?byteRange(rangeHeader,Number(doc.size)):undefined;
 if(requested===null)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${Number(doc.size)}`,'Cache-Control':'private, no-store'}});
 const object=await bucket().get(String(doc.storage_key),requested?{range:requested}:undefined);if(!object)throw new ApiError(404,'File not found.');
 const mime=String(doc.mime);const inline=mime==='application/pdf'||mime.startsWith('image/')||mime==='video/mp4';const download=new URL(request.url).searchParams.get('download')==='1';
 const filename=String(doc.name).replace(/[\r\n\x00-\x1f]/g,'').slice(0,200);const headers=new Headers({'Content-Type':mime,'Content-Length':String(object.size),'Content-Disposition':`${download||!inline?'attachment':'inline'}; filename="document"; filename*=UTF-8''${encodeURIComponent(filename).replace(/'/g,'%27')}`,'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store','Content-Security-Policy':"default-src 'none'; frame-ancestors 'self'",'Cross-Origin-Resource-Policy':'same-origin'});
 if(mime==='video/mp4')headers.set('Accept-Ranges','bytes');
 if(requested){headers.set('Content-Length',String(requested.length));headers.set('Content-Range',`bytes ${requested.offset}-${requested.offset+requested.length-1}/${Number(doc.size)}`);}
 return new Response(object.body,{headers,status:requested?206:200});
}catch(e){return apiError(e)}}
