// Loopback-only component verification. No Next.js auth bypass or real API calls.
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/postcss';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';

const require=createRequire(import.meta.url);
const stub=path.resolve('e2e/fixtures/commerce-preview/stubs.tsx');
const server=await createServer({configFile:false,root:path.resolve('e2e/fixtures/commerce-preview'),plugins:[react()],
  resolve:{alias:[{find:'@/lib/supabase',replacement:stub},{find:'next/link',replacement:stub},{find:'@',replacement:path.resolve('src')}]},
  css:{postcss:{plugins:[tailwind({base:process.cwd()})]}},server:{host:'127.0.0.1',port:0,strictPort:true,fs:{allow:[process.cwd()]}}});
try {
  await server.listen();
  const address=server.httpServer.address();
  if(!address||typeof address==='string')throw new Error('Preview did not bind a loopback port.');
  const env={...process.env,PLAYWRIGHT_BASE_URL:`http://127.0.0.1:${address.port}`,PLAYWRIGHT_PORT:String(address.port),
    PLAYWRIGHT_REUSE_SERVER:'true',PLAYWRIGHT_COMMERCE_PREVIEW:'1'};
  const child=spawn(process.execPath,[require.resolve('@playwright/test/cli'),'test','e2e/commerce-preparation-preview.spec.ts','--workers=1','--reporter=line'],{stdio:'inherit',env,windowsHide:true});
  process.exitCode=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>resolve(code??1));});
} finally { await server.close(); }
