import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const individual = process.argv[2] === 'individual';
const probe = createServer();
await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const baseURL = 'http://127.0.0.1:' + port;
const server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
const stopped = new Promise(resolve => server.once('exit', resolve));
let startupLog = '';
server.stdout.on('data', chunk => { startupLog += chunk; });
server.stderr.on('data', chunk => { startupLog += chunk; });

try {
  let ready = false;
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error('Production preview stopped: ' + startupLog);
    try { ready = (await fetch(baseURL + '/diagnose', { signal: AbortSignal.timeout(1500) })).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('Run npm run build before testing the production UI.');
  const child = spawn(process.execPath, [require.resolve('@playwright/test/cli'), 'test', individual ? 'e2e/individual-reference.spec.ts' : 'e2e/diagnosis-reference.spec.ts', '--workers=1', '--reporter=line'], {
    stdio: 'inherit', windowsHide: true,
    env: { ...process.env, PLAYWRIGHT_BASE_URL: baseURL, PLAYWRIGHT_REUSE_SERVER: 'true', [individual ? 'PLAYWRIGHT_INDIVIDUAL_REFERENCE' : 'PLAYWRIGHT_DIAGNOSIS_REFERENCE']: '1' },
  });
  process.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 1)); });
} finally {
  if (server.exitCode === null) server.kill();
  await stopped;
}
