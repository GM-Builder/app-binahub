import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
const server=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{stdio:['ignore','pipe','pipe'],windowsHide:true});
let logs='';server.stdout.on('data',d=>logs+=d);server.stderr.on('data',d=>logs+=d);const stopped=new Promise(r=>server.once('exit',r));
try{
 let ready=false;for(let i=0;i<100;i++){if(server.exitCode!==null)throw new Error(logs);try{ready=(await fetch(`http://127.0.0.1:${port}/diagnose`,{signal:AbortSignal.timeout(1000)})).ok;}catch{}if(ready)break;await new Promise(r=>setTimeout(r,200));}
 if(!ready)throw new Error('Loopback build unavailable');
 const runner=spawn(process.execPath,[require.resolve('@playwright/test/cli'),'test','e2e/diagnosis-editorial.spec.ts','e2e/diagnosis-reference.spec.ts','e2e/individual-reference.spec.ts','--workers=2','--reporter=line'],{stdio:'inherit',windowsHide:true,env:{...process.env,PLAYWRIGHT_BASE_URL:`http://127.0.0.1:${port}`,PLAYWRIGHT_REUSE_SERVER:'true',PLAYWRIGHT_DIAGNOSIS_REFERENCE:'1',PLAYWRIGHT_INDIVIDUAL_REFERENCE:'1'}});
 process.exitCode=await new Promise((resolve,reject)=>{runner.once('exit',c=>resolve(c??1));runner.once('error',reject);});
}finally{if(server.exitCode===null)server.kill();await stopped;}
