import {describe,it,expect,vi} from 'vitest';
import {PetaAnswerSync} from './peta-answer-sync';
import {makePetaSession} from '@/test/fixtures/peta';
import {PetaRequestError,type PetaSession,type PetaPair} from './peta';
const clone=<T,>(value:T):T=>structuredClone(value);
const deferred=<T,>()=>{let resolve!:(value:T)=>void;const promise=new Promise<T>(r=>{resolve=r;});return {promise,resolve};};
describe('PETA background answer synchronization',()=>{
 it('serializes writes, coalesces latest edits, and does not replace local selections',async()=>{
  const first=deferred<PetaSession>(),s=makePetaSession(),remote=clone(s),state=vi.fn(),update=vi.fn();
  const save=vi.fn(async(revision:number,id:string,pair:PetaPair)=>{expect(revision).toBe(remote.revision);remote.answers[id]=clone(pair);remote.revision++;return save.mock.calls.length===1?first.promise:clone(remote);});
  const sync=new PetaAnswerSync(s,{save,read:async()=>clone(remote),state,session:update});
  sync.enqueue('PETA-Q01',{most:'A',least:'B'});const work=sync.flush();
  sync.enqueue('PETA-Q01',{most:'C',least:'D'});sync.enqueue('PETA-Q02',{most:'B',least:'D'});
  expect(save).toHaveBeenCalledTimes(1);expect(sync.flush()).toBe(work);expect(sync.dirty).toBe(true);
  first.resolve(clone(remote));await work;
  expect(save).toHaveBeenCalledTimes(3);expect(remote.answers['PETA-Q01']).toEqual({most:'C',least:'D'});expect(remote.revision).toBe(3);expect(state).toHaveBeenLastCalledWith('saved');expect(sync.dirty).toBe(false);
 });
 it('recovers a lost acknowledgement without replaying a committed answer',async()=>{
  const s=makePetaSession(),remote=clone(s),state=vi.fn();
  const save=vi.fn(async(_revision:number,id:string,pair:PetaPair)=>{remote.answers[id]=pair;remote.revision++;throw new Error('connection lost after commit');});
  const sync=new PetaAnswerSync(s,{save,read:async()=>clone(remote),state,session:vi.fn()});sync.enqueue('PETA-Q01',{most:'A',least:'D'});
  await expect(sync.flush()).rejects.toThrow('connection lost');expect(sync.dirty).toBe(true);expect(state).toHaveBeenLastCalledWith('error');
  await sync.flush();expect(save).toHaveBeenCalledTimes(1);expect(sync.dirty).toBe(false);expect(state).toHaveBeenLastCalledWith('saved');
 });
 it('preserves pending choices and refuses to overwrite another tab conflict',async()=>{
  const s=makePetaSession(),remote=clone(s),save=vi.fn().mockRejectedValue(new PetaRequestError('conflict','PETA_REVISION_CONFLICT',412));
  const sync=new PetaAnswerSync(s,{save,read:async()=>clone(remote),state:vi.fn(),session:vi.fn()});sync.enqueue('PETA-Q01',{most:'A',least:'B'});
  await expect(sync.flush()).rejects.toThrow('conflict');remote.answers['PETA-Q01']={most:'C',least:'D'};remote.revision++;
  await expect(sync.flush()).rejects.toMatchObject({code:'PETA_REVISION_CONFLICT'});expect(save).toHaveBeenCalledTimes(1);expect(sync.dirty).toBe(true);
 });
 it('reconciles a lost acknowledgement for an earlier edit before sending the newer choice',async()=>{
  const s=makePetaSession(),remote=clone(s),wait=deferred<PetaSession>();
  const save=vi.fn().mockImplementationOnce(async(_r:number,id:string,pair:PetaPair)=>{remote.answers[id]=pair;remote.revision++;await wait.promise;throw new Error('lost ack');}).mockImplementation(async(revision:number,id:string,pair:PetaPair)=>{expect(revision).toBe(1);remote.answers[id]=pair;remote.revision++;return clone(remote);});
  const sync=new PetaAnswerSync(s,{save,read:async()=>clone(remote),state:vi.fn(),session:vi.fn()});sync.enqueue('PETA-Q01',{most:'A',least:null});const work=sync.flush();sync.enqueue('PETA-Q01',{most:'A',least:'C'});wait.resolve(clone(remote));await expect(work).rejects.toThrow('lost ack');await sync.flush();expect(remote.answers['PETA-Q01']).toEqual({most:'A',least:'C'});expect(sync.dirty).toBe(false);
 });
 it('retries a failed uncommitted write with the latest revision and same choices',async()=>{
  const s=makePetaSession(),remote=clone(s),save=vi.fn().mockRejectedValueOnce(new Error('offline')).mockImplementation(async(revision:number,id:string,pair:PetaPair)=>{expect(revision).toBe(0);remote.answers[id]=pair;remote.revision++;return clone(remote);});
  const sync=new PetaAnswerSync(s,{save,read:async()=>clone(remote),state:vi.fn(),session:vi.fn()});sync.enqueue('PETA-Q01',{most:'A',least:'C'});await expect(sync.flush()).rejects.toThrow('offline');await sync.flush();expect(sync.dirty).toBe(false);
 });
});
