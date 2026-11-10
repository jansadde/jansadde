import { NextResponse } from 'next/server';
import { sameOrigin } from '@/lib/server';
import { authClient } from '@/lib/supabase/server';
export async function POST(request:Request){try{sameOrigin(request);const client=await authClient();await client.auth.signOut();return NextResponse.redirect(new URL('/',request.url),303);}catch{return new Response('Unable to sign out.',{status:400});}}
