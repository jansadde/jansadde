import { redirect } from 'next/navigation';
import { authClient } from '@/lib/supabase/server';
export type ChatGPTUser={userId:string;displayName:string;email:string;fullName:string|null};
// Compatibility name for the existing UI. Trust only a verified Supabase session.
export async function getChatGPTUser():Promise<ChatGPTUser|null>{
 if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)return null;
 const client=await authClient();const {data:{user},error}=await client.auth.getUser();
 if(error||!user?.email||!user.email_confirmed_at)return null;
 return {userId:user.id,email:user.email,displayName:user.user_metadata?.full_name||user.email,fullName:user.user_metadata?.full_name||null};
}
export async function requireChatGPTUser(returnTo:string){const user=await getChatGPTUser();if(user)return user;redirect(chatGPTSignInPath(returnTo));}
export function chatGPTSignInPath(returnTo='/admin'){return '/sign-in?return_to='+encodeURIComponent(returnTo.startsWith('/')&&!returnTo.startsWith('//')?returnTo:'/admin');}
export function chatGPTSignOutPath(){return '/signout';}
