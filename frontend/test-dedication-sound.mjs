import assert from 'node:assert/strict'
import { createDedicationSound } from './src/utils/dedicationSound.js'
let contexts=0, starts=0, stopped=0, closed=0, resumes=0
const events=[]
const param={setValueAtTime:(v,t)=>events.push([v,t]),linearRampToValueAtTime:(v,t)=>events.push([v,t]),exponentialRampToValueAtTime:(v,t)=>events.push([v,t])}
function context() { contexts++; return {state:'running',currentTime:1,destination:{},createOscillator:()=>({frequency:param,connect(){},disconnect(){},start(){starts++},stop(){stopped++}}),createGain:()=>({gain:param,connect(){},disconnect(){}}),close(){closed++}} }
const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}
const sound=createDedicationSound({storage,createContext:context})
assert.equal(contexts,0);assert.equal(starts,0)
sound.unlock();assert.equal(contexts,1);assert.equal(starts,0)
sound.onFrame(1.32);assert.equal(starts,0,'failure/no success is silent')
sound.begin();sound.onFrame(0);sound.onFrame(.68);sound.onFrame(1.27);assert.equal(starts,0)
sound.onFrame(1.32);assert.equal(starts,2,'one hit made of two quiet partials')
for(let i=0;i<10;i++)sound.onFrame(1.33);assert.equal(starts,2,'no stacking')
sound.stop();sound.onFrame(1.4);assert.equal(starts,2)
sound.begin();sound.stop();sound.onFrame(1.32);assert.equal(starts,2,'cancel before peak')
sound.begin();sound.onFrame(2);assert.equal(starts,2,'late/background peak skipped')
sound.setMuted(true);sound.begin();sound.onFrame(1.32);assert.equal(starts,2)
const remembered=createDedicationSound({storage,createContext:context});assert.equal(remembered.muted,true);remembered.unlock();assert.equal(contexts,1)
sound.setMuted(false);sound.begin();sound.onFrame(1.32);assert.equal(starts,4)
sound.destroy();sound.begin();sound.unlock();sound.onFrame(1.32);assert.equal(starts,4);assert.equal(closed,1)
const blocked=createDedicationSound({storage,createContext:()=>({state:'suspended',resume(){resumes++;return Promise.reject(new Error('blocked'))},close(){}})})
blocked.unlock();blocked.begin();blocked.onFrame(1.32);await Promise.resolve();assert.equal(resumes,1);assert.equal(starts,4);blocked.destroy()
const unsupported=createDedicationSound({storage:{getItem(){throw Error()},setItem(){throw Error()}},createContext:()=>{throw Error('unsupported')}})
unsupported.unlock();unsupported.begin();unsupported.onFrame(1.32);unsupported.setMuted(true);unsupported.destroy();assert.equal(starts,4)
assert.ok(stopped>=4)
console.log('PASS sound: silent load/unlock/failure, peak-only single hit, no stacking, cancel/navigation stop, late-frame skip, mute persistence, cleanup, blocked/unsupported audio degradation')
