import { getPortfolio, success, apiError } from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(){try{return success(await getPortfolio())}catch(e){return apiError(e)}}
