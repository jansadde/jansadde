import { NextResponse } from 'next/server';
import { authClient } from '@/lib/supabase/server';
import { sameOrigin } from '@/lib/server';
export async function POST(request:Request){
 try{sameOrigin(request);const form=await request.formData();const email=String(form.get('email')||'').trim().toLowerCase(),password=String(form.get('password')||'');
 if(email!==(process.env.ADMIN_EMAIL||'almasarsekbaeva@yandex.com').toLowerCase()||password.length>500)throw new Error('Invalid credentials');
 const client=await authClient();const {data,error}=await client.auth.signInWithPassword({email,password});if(error||!data.user?.email_confirmed_at)throw new Error('Invalid credentials');
 return NextResponse.redirect(new URL('/admin',request.url),303);
 }catch{return NextResponse.redirect(new URL('/sign-in?error=1',request.url),303);}
}
