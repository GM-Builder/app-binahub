// TEST ONLY. A loopback-only synthetic auth/role service for local browser tests.
// Never used/imported by application code. No real Supabase credentials or data.
import { createServer } from 'node:http';
const user={id:'00000000-0000-4000-8000-000000000098',aud:'authenticated',email:'synthetic@example.invalid',
  email_confirmed_at:'2026-10-13T00:00:00Z',user_metadata:{full_name:'Synthetic tester'},app_metadata:{}};
createServer((req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','http://127.0.0.1:3019');
  res.setHeader('Access-Control-Allow-Headers','authorization,apikey,content-type,x-client-info,x-supabase-api-version');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Content-Type','application/json');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  if(req.url?.startsWith('/auth/v1/user'))res.end(JSON.stringify(user));
  else if(req.url?.startsWith('/api/auth/role'))res.end(JSON.stringify({success:true,role:'admin',fullName:'Synthetic tester'}));
  else {res.writeHead(404);res.end(JSON.stringify({success:false,error:'Synthetic fixture route not configured'}));}
}).listen(4329,'127.0.0.1',()=>process.stdout.write('Synthetic auth fixture listening on loopback:4329\n'));
