
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createRecovery, recoverableLoader, installRecovery, observeHistory } from '../../src/recovery/route-recovery.mjs';

test('sanitized real diagnostic ignores private error and route data and unsubscribes', async () => {
 const source=await fs.readFile(new URL('../../src/router/index.js',import.meta.url),'utf8');
 const snippet=source.match(/const disposeDiagnostic = router.onError\(\(\) => \{\s*console.error\('\[route-navigation\] Navigation failed.'\)\s*\}\)/);
 assert.ok(snippet);let handler,removed=false;const logs=[];
 const dispose=runInNewContext(snippet[0]+';disposeDiagnostic;',{
 router:{onError(fn){handler=fn;return()=>{removed=true}}},
 console:{error(...args){logs.push(args)}}
 });
 handler(new Error('PRIVATE'),{fullPath:'/nianfo?token=PRIVATE'});
 assert.deepEqual(logs,[['[route-navigation] Navigation failed.']]);dispose();assert.equal(removed,true);
});
for(const path of ['/nianfo/','/zh-hant/nianfo/']){
 test('real Vue Router initial module rejection '+path,async()=>{
  const nav=[];const rec=createRecovery({origin:'https://example.test',navigate:url=>nav.push(url)});
  const router=createRouter({history:observeHistory(createMemoryHistory(),rec),routes:[{path,component:recoverableLoader(()=>Promise.reject(Error('private'))) }]});
  const dispose=installRecovery(router,rec);await router.push(path).catch(()=>{});
  assert.equal(rec.getState().status,'failed');assert.equal(rec.getState().path,path);
  assert.equal(rec.retry(),true);assert.deepEqual(nav,['https://example.test'+path]);assert.equal(rec.retry(),false);dispose();
 });
}
test('actual router cancels late import failure after a successful newer navigation',async()=>{
 let reject,started;const waiting=new Promise(r=>{started=r});
 const rec=createRecovery({origin:'https://example.test',navigate:()=>{}});
 const router=createRouter({history:observeHistory(createMemoryHistory(),rec),routes:[
  {path:'/ok',component:{render(){return null}}},
  {path:'/nianfo',component:recoverableLoader(()=>{started();return new Promise((_,r)=>{reject=r})})}
 ]});const dispose=installRecovery(router,rec);
 const old=router.push('/nianfo').catch(()=>{});await waiting;await router.push('/ok');reject(Error('late'));await old;
 assert.equal(router.currentRoute.value.path,'/ok');assert.equal(rec.getState().status,'idle');dispose();
});
test('sound settings, unavailable storage, audio failure and independent music controls',async()=>{
 let storageValue=null,throwStorage=false,hits=0,throwAudio=false;
 globalThis.localStorage={getItem(){if(throwStorage)throw Error();return storageValue},setItem(k,v){if(throwStorage)throw Error();storageValue=v}};
 const param={setValueAtTime(){},exponentialRampToValueAtTime(){}};
 const node=()=>({gain:param,frequency:{...param,value:0},Q:{value:0},connect(){return this},start(){},stop(){}});
 class AC{constructor(){if(throwAudio)throw Error('audio failed');this.state='running';this.currentTime=0;this.sampleRate=48000;this.destination={}}createGain(){return node()}createOscillator(){hits++;return node()}createBuffer(){return {getChannelData:()=>new Float32Array(1440)}}createBufferSource(){return node()}createBiquadFilter(){return node()}}
 globalThis.window={AudioContext:AC};
 const {loadState}=await import('../../src/utils/nianfo.js');
 assert.equal(loadState().sound,false);storageValue=JSON.stringify({sound:true});assert.equal(loadState().sound,true);storageValue=JSON.stringify({sound:false});assert.equal(loadState().sound,false);
 const {useNianfo}=await import('../../src/composables/useNianfo.js');const n=useNianfo();
 n.toggleSound();assert.equal(hits,1);assert.equal(n.today.value,0);
 n.tap();assert.equal(hits,2);assert.equal(n.today.value,1);
 n.toggleSound();n.tap();assert.equal(hits,2);assert.equal(n.today.value,2);
 throwStorage=true;n.tap();assert.equal(n.today.value,3);assert.equal(loadState().sound,false);
 // A new composable instance starts without a cached AudioContext.
 throwAudio=true;
 const {useNianfo:useFail}=await import('../../src/composables/useNianfo.js?failed-audio');
 const failed=useFail();failed.toggleSound();failed.tap();assert.equal(failed.today.value,1);
 class FakeAudio{paused=true;muted=true;addEventListener(){}play(){this.paused=false;return Promise.resolve()}pause(){this.paused=true}}
 globalThis.Audio=FakeAudio;
 const {useBackgroundMusic}=await import('../../src/composables/useBackgroundMusic.js');const a=useBackgroundMusic(),b=useBackgroundMusic();
 a.toggle();assert.equal(a.muted.value,false);assert.equal(b.muted.value,false);failed.toggleSound();assert.equal(a.muted.value,false);b.toggle();assert.equal(a.muted.value,true);
});
