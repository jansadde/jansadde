import ts from 'typescript';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
async function files(dir){const all=[];for(const e of await readdir(dir,{withFileTypes:true})){const path=dir+'/'+e.name;if(e.isDirectory())all.push(...await files(path));else if(path.endsWith('.ts'))all.push(path);}return all;}
const sources=['lib/server.ts',...await files('app/api')];
function choices(e){
 if(ts.isStringLiteral(e)||ts.isNoSubstitutionTemplateLiteral(e))return[e.text];
 if(ts.isIdentifier(e)&&e.text==='cond')return[" WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key='initialized')"];
 if(ts.isConditionalExpression(e))return [...choices(e.whenTrue),...choices(e.whenFalse)];
 if(ts.isBinaryExpression(e)&&e.operatorToken.kind===ts.SyntaxKind.PlusToken)return choices(e.left).flatMap(a=>choices(e.right).map(b=>a+b));
 if(ts.isTemplateExpression(e)){let parts=[e.head.text];for(const span of e.templateSpans)parts=parts.flatMap(a=>choices(span.expression).map(b=>a+b+span.literal.text));return parts;}
 throw Error('Unsupported SQL expression: '+e.getText());
}
const queries=new Set();for(const name of sources){const source=ts.createSourceFile(name,await readFile(name,'utf8'),ts.ScriptTarget.Latest,true);function visit(n){if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&n.expression.name.text==='prepare')for(const q of choices(n.arguments[0]))queries.add(q);ts.forEachChild(n,visit);}visit(source);}
function translate(q){let n=0;let sql=q.replace(/^INSERT OR IGNORE\b/i,'INSERT').replaceAll('%','%%').replace(/\?/g,()=>'%'+(++n)+'$L');if(/^INSERT OR IGNORE\b/i.test(q))sql+=' ON CONFLICT DO NOTHING';sql=sql.replace('count=count+1','count=rate_limits.count+1');return {sql,n};}
const quote=s=>"'"+s.replaceAll("'","''")+"'";
let output=await readFile('supabase/rpc-functions.sql','utf8');
for(const q of queries){const {sql,n}=translate(q);const id=createHash('sha256').update(q).digest('hex');output+='\nINSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('+quote(id)+','+quote(sql)+','+n+') ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;';}
output+='\nCOMMIT;\n';await writeFile('supabase/rpc.sql',output);console.log('Prepared',queries.size,'allowlisted parameterized SQL operations.');
