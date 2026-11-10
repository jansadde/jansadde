import { requireAdmin, getPortfolio, success, apiError } from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(){try{await requireAdmin();return success(await getPortfolio(true))}catch(e){return apiError(e)}}
