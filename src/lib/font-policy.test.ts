import {readFileSync,existsSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import config from '../../next.config';
const css=readFileSync('src/app/globals.css','utf8');
describe('self-hosted BinaHub font under existing CSP',()=>{
 it('loads the existing brand family without Google stylesheet imports',()=>{
  expect(css).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
  expect(css).toContain('font-family: "Plus Jakarta Sans"');
  expect(css).toContain('font-weight: 200 800');expect(css).toContain('font-display: swap');
 });
 it('ships a real same-origin TrueType font and original license',()=>{
  const url=css.match(/src:\s*url\("([^\"]+)"\)/)?.[1];expect(url).toBe('/fonts/plus-jakarta-sans/PlusJakartaSans-Variable.ttf');
  expect(existsSync('public'+url)).toBe(true);const font=readFileSync('public'+url);
  expect(font.readUInt32BE(0)).toBe(0x00010000);expect(font.length).toBeGreaterThan(10000);
  expect(readFileSync('public/fonts/plus-jakarta-sans/OFL.txt','utf8')).toContain('SIL OPEN FONT LICENSE Version 1.1');
 });
 it('keeps font and stylesheet policy same-origin without allowlisting Google',async()=>{
  const rules=await config.headers!();const policy=rules.find(rule=>rule.source==='/:path*')?.headers.find(header=>header.key==='Content-Security-Policy')?.value;
  expect(policy).toContain("style-src 'self' 'unsafe-inline'");expect(policy).toContain("font-src 'self' data:");
  expect(policy).not.toMatch(/fonts\.googleapis|fonts\.gstatic/);
 });
});
