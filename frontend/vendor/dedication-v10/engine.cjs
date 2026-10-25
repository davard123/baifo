'use strict';
const {createCanvas}=require('@napi-rs/canvas');
const FX=require('./effects.cjs'),R1=require('./responses-a1-a4.cjs'),R2=require('./responses-a5-a6-a8.cjs'),B=require('./rig-motion.cjs'),specs=require('./specs.cjs');
Object.assign(B.cfg,{poseTransform:[33.44,20,1605.12,903.36],mouth:[842.72,483.68]});
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10)},mix=(a,b,u)=>a+(b-a)*u;
function motionState(t){const amount=ease((t-.68)/.64)*(1-ease((t-1.45)/1.21));return{amount,scale:1+.72*amount,blur:1.3*amount}}
function effectState(t){return{env:ease((t-.015)/.28)*(1-ease((t-2.05)/.70)),ft:2.8+7.2*ease((t-.06)/.74),rt:Math.min(3.8,t*1.6),mist:t+1.65}}
function cameraState(t){const keys=[[1.28,0],[1.32,5],[1.365,-2.5],[1.415,.8],[1.48,0]];if(t<=1.28||t>=1.48)return{dx:0,dy:0,overscan:1};let k=0;while(t>keys[k+1][0])k++;const[a,x]=keys[k],[b,y]=keys[k+1],dx=mix(x,y,ease((t-a)/(b-a)));return{dx,dy:0,overscan:1+Math.abs(dx)/480*1.4}}
function gripBlend(t){return ease((t-.18)/.36)*(1-ease((t-2.05)/.56))}
function imageRect(id,W,H,opts={}){if(opts.imageRect)return opts.imageRect;const s=specs.find(s=>s.id===id),[l,top,r,b]=s.bounds,k=Math.min(W*.84/(r-l),H*.78/(b-top));return[W/2-(l+r)*.5*k,H*.90-b*k,1672*k,941*k]}
function pointFor(id,t,W,H,opts={}){const [x,y,w,h]=imageRect(id,W,H,opts),m=motionState(t),cx=W/2,cy=W>H?H*.28:H*.5,sh=opts.anchorShift||[0,0];return q=>[cx+(x+(q[0]+sh[0])*w/1672-cx)*m.scale,cy+(y+(q[1]+sh[1])*h/941-cy)*m.scale]}
function zoom(ctx,t,W,H){const m=motionState(t);const cy=W>H?H*.28:H*.5;ctx.translate(W/2,cy);ctx.scale(m.scale,m.scale);ctx.translate(-W/2,-cy)}
function original(ctx,id,assets,opts){ctx.drawImage(assets[id],...imageRect(id,ctx.canvas.width,ctx.canvas.height,opts))}
let portrait=createCanvas(1,1),scene=createCanvas(1,1),rig=createCanvas(1,1);
function resize(W,H){if(portrait.width!==W||portrait.height!==H){portrait.width=W;portrait.height=H;scene.width=W;scene.height=H;rig.width=W;rig.height=H}}
function rigTransform(ctx,id,W,H,opts){const[x,y,w]=imageRect(id,W,H,opts),k=w/1672/B.cfg.scale;ctx.translate(x-B.cfg.ox*k,y-B.cfg.oy*k);ctx.scale(k,k)}
function drawPortrait(ctx,t,id,assets,opts={}){const W=ctx.canvas.width,H=ctx.canvas.height;resize(W,H);const p=portrait.getContext('2d'),a=id==='a7'&&opts.guanyinVariant!=='static'?gripBlend(t):0;p.clearRect(0,0,W,H);p.save();p.globalAlpha=1-a;original(p,id,assets,opts);if(a>0){const r=rig.getContext('2d');r.clearRect(0,0,W,H);r.save();rigTransform(r,id,W,H,opts);B.cfg.wristAngle=B.motionState(t*1.35).angle;B.statue(r,{original:assets.a7,clean:assets.clean,pose:assets.pose},true);r.restore();p.globalCompositeOperation='lighter';p.globalAlpha=a;p.drawImage(rig,0,0)}p.restore();ctx.save();const blur=motionState(t).blur*Math.min(W/960,H/1200);ctx.filter=blur>.001?`blur(${blur.toFixed(3)}px)`:'none';zoom(ctx,t,W,H);ctx.drawImage(portrait,0,0);ctx.restore()}
function environment(ctx,fn){ctx.save();ctx.scale(ctx.canvas.width/960,ctx.canvas.height/1200);fn();ctx.restore()}
function drawStatic(ctx,id,assets,opts={}){ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);if(!opts.transparentBackground)environment(ctx,()=>FX.background(ctx,0));original(ctx,id,assets,opts)}
function bottleGlow(ctx,t,point){const amount=ease((t-.2)/.35),src=point([839,418]);if(!amount)return;ctx.save();ctx.globalCompositeOperation='screen';B.glow(ctx,...src,32,'223,248,228',amount*.45);for(const side of[-1,1]){ctx.beginPath();for(let j=0;j<=60;j++){const u=j/60*ease((t-.36)/.8),q=point([839+side*(180*u+30*Math.sin(u*Math.PI)),418+140*u+70*u*u]);j?ctx.lineTo(...q):ctx.moveTo(...q)}ctx.strokeStyle=`rgba(255,231,162,${amount*.5})`;ctx.lineWidth=1.7;ctx.stroke()}ctx.restore()}
function drawScene(ctx,t,id,assets,opts={}){if(t<=0||t>=2.80){drawStatic(ctx,id,assets,opts);return}const W=ctx.canvas.width,H=ctx.canvas.height,e=effectState(t);ctx.clearRect(0,0,W,H);if(!opts.transparentBackground)environment(ctx,()=>FX.background(ctx,0));ctx.save();ctx.globalAlpha=e.env;environment(ctx,()=>{FX.background(ctx,e.ft);FX.clouds(ctx,e.ft,false,e.mist);FX.flowers(ctx,e.ft,true);FX.ribbons(ctx,e.ft);FX.particles(ctx,e.ft,false)});ctx.restore();drawPortrait(ctx,t,id,assets,opts);
 ctx.save();ctx.globalAlpha=e.env;const p=pointFor(id,t,W,H,opts);
 if(id==='a7'&&opts.guanyinVariant!=='static'){ctx.save();ctx.globalAlpha*=gripBlend(t);zoom(ctx,t,W,H);rigTransform(ctx,id,W,H,opts);B.waterMotion(ctx,t*1.35);ctx.restore()}
 else environment(ctx,()=>{const point=q=>{const a=p(q);return[a[0]*960/W,a[1]*1200/H]};if(id==='a7')bottleGlow(ctx,t,point);else(['a1','a2','a3','a4'].includes(id)?R1:R2).draw(ctx,e.rt,id,point)});
 environment(ctx,()=>{FX.portraitVeil(ctx,t+.5);FX.clouds(ctx,e.ft,true,e.mist);FX.flowers(ctx,e.ft,false);FX.particles(ctx,e.ft,true)});ctx.restore();
}
function draw(ctx,t,id,assets,opts={}){const W=ctx.canvas.width,H=ctx.canvas.height;resize(W,H);drawScene(scene.getContext('2d'),t,id,assets,opts);const c=cameraState(t),dx=c.dx*W/960;ctx.save();ctx.clearRect(0,0,W,H);ctx.translate(W/2+dx,H/2);ctx.scale(c.overscan,1);ctx.drawImage(scene,-W/2,-H/2);ctx.restore()}
module.exports={specs,draw,drawStatic,drawPortrait,motionState,effectState,cameraState,gripBlend,imageRect,pointFor};
