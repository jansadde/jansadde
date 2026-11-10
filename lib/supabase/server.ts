import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export async function authClient(){
 const cookieStore=await cookies();
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw new Error('Owner sign-in is not configured.');
 return createServerClient(url,key,{cookies:{getAll(){return cookieStore.getAll();},setAll(values){try{for(const {name,value,options} of values)cookieStore.set(name,value,options);}catch{/* Server Components cannot write cookies; proxy refreshes them. */}}}});
}
