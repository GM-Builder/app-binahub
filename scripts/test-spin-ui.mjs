import {createServer} from 'vite';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import path from 'node:path';
const require=createRequire(import.meta.url);
const server=await createServer({configFile:path.resolve('scripts/assessment-preview/vite.config.ts'),server:{host:'127.0.0.1',port:0,strictPort:true}});
try{await server.listen();const address=server.httpServer.address();if(!address||typeof address==='string')throw new Error('Loopback preview unavailable.');
const child=spawn(process.execPath,[require.resolve('@playwright/test/cli'),'test','e2e/spin-preview.spec.ts','--workers=1','--reporter=line'],{stdio:'inherit',windowsHide:true,env:{...process.env,PLAYWRIGHT_BASE_URL:'http://127.0.0.1:'+address.port,PLAYWRIGHT_REUSE_SERVER:'true',PLAYWRIGHT_SPIN_PREVIEW:'1'}});
process.exitCode=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',c=>resolve(c??1));});}finally{await server.close();}
