import { createHash } from 'node:crypto';
import { supabaseAdmin } from './supabase/admin';
// The database only accepts known statement IDs. All values travel separately
// and are quoted inside PostgreSQL; private tables have no public Data API grants.
class Statement {
 constructor(readonly sql:string,readonly values:unknown[]=[]){ }
 bind(...values:unknown[]){return new Statement(this.sql,values);}
 command(){return {query_id:createHash('sha256').update(this.sql).digest('hex'),parameters:this.values};}
 async execute(){const {data,error}=await supabaseAdmin().rpc('portfolio_query',this.command());if(error)throw error;return data as Record<string,unknown>[];}
 async all<T=Record<string,unknown>>(){return {results:await this.execute() as T[]};}
 async first<T=Record<string,unknown>>(){return ((await this.execute())[0] as T|undefined)??null;}
 async run(){await this.execute();return {success:true};}
}
// Compatibility surface keeps all existing content and file validation intact.
export const postgresDatabase={prepare(sql:string){return new Statement(sql);},async batch(statements:Statement[]){const {data,error}=await supabaseAdmin().rpc('portfolio_batch',{commands:statements.map(s=>s.command())});if(error)throw error;return (data as unknown[][]).map(results=>({results,success:true}));}};
