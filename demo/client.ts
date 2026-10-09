// Public fictional fixtures only. This module deliberately has no Supabase SDK or network calls.
import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from './types';
import {fixtures} from '../../../demo/fixtures';
const user={id:'demo-user',email:'viewer@example.invalid',user_metadata:{full_name:'Demo Visitor'}};
const session={user,access_token:'',refresh_token:'',expires_in:0,token_type:'demo'};
const denied={message:'This demo is read-only. Request a guided demo to explore editing workflows.'};
class Query {
 rows:any[]; one=false; blocked=false; count=0;
 constructor(table:string){this.rows=structuredClone(fixtures[table]??[]);}
 select(..._args:any[]){return this;}
 eq(k:string,v:any){this.rows=this.rows.filter(r=>r[k]===v);return this;}
 neq(k:string,v:any){this.rows=this.rows.filter(r=>r[k]!==v);return this;}
 in(k:string,v:any[]){this.rows=this.rows.filter(r=>v.includes(r[k]));return this;}
 is(k:string,v:any){return this.eq(k,v);}
 gte(k:string,v:any){this.rows=this.rows.filter(r=>r[k]>=v);return this;}
 lte(k:string,v:any){this.rows=this.rows.filter(r=>r[k]<=v);return this;}
 gt(k:string,v:any){this.rows=this.rows.filter(r=>r[k]>v);return this;}
 lt(k:string,v:any){this.rows=this.rows.filter(r=>r[k]<v);return this;}
 ilike(k:string,v:string){this.rows=this.rows.filter(r=>String(r[k]??'').toLowerCase().includes(v.replaceAll('%','').toLowerCase()));return this;}
 order(k:string,opts:any={}){this.rows.sort((a,b)=>String(a[k]??'').localeCompare(String(b[k]??''))*(opts.ascending===false?-1:1));return this;}
 limit(n:number){this.rows=this.rows.slice(0,n);return this;}
 range(a:number,b:number){this.rows=this.rows.slice(a,b+1);return this;}
 or(){return this;}
 not(){return this;}
 single(){this.one=true;return this;}
 maybeSingle(){this.one=true;return this;}
 insert(){this.blocked=true;return this;}
 update(){this.blocked=true;return this;}
 upsert(){this.blocked=true;return this;}
 delete(){this.blocked=true;return this;}
 then(resolve:any,reject:any){return Promise.resolve(this.blocked?{data:null,error:denied,count:0}:{data:this.one?(this.rows[0]??null):this.rows,error:null,count:this.rows.length}).then(resolve,reject);}
}
const blocked=async()=>({data:null,error:denied});
export const supabase={
 from:(table:string)=>new Query(table),
 rpc:async(name:string)=>name==='get_primary_role'?{data:'admin',error:null}:{data:null,error:denied},
 auth:{getSession:async()=>({data:{session},error:null}),getUser:async()=>({data:{user},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>({error:null}),signInWithPassword:blocked,resetPasswordForEmail:blocked,updateUser:blocked},
 storage:{from:()=>({upload:blocked,remove:blocked,getPublicUrl:()=>({data:{publicUrl:''}}),createSignedUrl:blocked})},
 channel:()=>({on(){return this},subscribe(){return this},unsubscribe(){}}),removeChannel(){}
} as unknown as SupabaseClient<Database>;
