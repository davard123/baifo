'use strict';
/** Original-pixel blessing responses, 960 x 1200, four seconds.
 * All coordinates in specs are measured on the unmodified 1672 x 941 originals.
 * This layer never draws, warps, repaints, translates, or rotates statue pixels.
 * point([sourceX, sourceY]) is supplied by the shared scene and is authoritative.
 */
const TAU=Math.PI*2, W=960, H=1200;
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=v=>{v=clamp(v);return v*v*(3-2*v)};
const mix=(a,b,u)=>a+(b-a)*u;
const rnd=n=>{const v=Math.sin(n*117.13+19.71)*43177.713;return v-Math.floor(v)};
const specs={
 a5:{name:'文殊菩萨',duration:4,holdFrom:3.2,anchors:{mudra:[765,277],lapPalm:[870,402]},face:[839,164,55,67],response:'Golden wisdom branches open from the existing raised mudra, then feed expanding low warm rings. No invented sword or book.'},
 a6:{name:'普贤菩萨',duration:4,holdFrom:3.2,anchors:{lotus:[690,130],stemGrip:[755,248]},face:[815,163,51,62],response:'Pink-gold petals release from the existing lotus, curl outward left, then descend and settle into the foreground field. Face and original stem stay untouched.'},
 a8:{name:'地藏菩萨',duration:4,holdFrom:3.2,anchors:{jewel:[838,559],staffLower:[754,585],staffGrip:[737,453],staffNeck:[710,253],staffHead:[697,174],staffTip:[684,53]},face:[839,288,59,67],response:'The existing palm jewel brightens; a gold filament connects to the actual staff, rises along its shaft, and fans into golden paths from its ornate head.'}
};
function P(point,p){const q=point(p);return Array.isArray(q)?q:[q.x,q.y]}
function bez(a,b,c,d,u){const v=1-u;return [v*v*v*a[0]+3*v*v*u*b[0]+3*v*u*u*c[0]+u*u*u*d[0],v*v*v*a[1]+3*v*v*u*b[1]+3*v*u*u*c[1]+u*u*u*d[1]]}
function cubic(c,u){return bez(...c,u)}
function glow(ctx,x,y,r,alpha,rgb='255,219,145',sx=1,sy=1){if(alpha<=0||r<=0)return;ctx.save();ctx.translate(x,y);ctx.scale(sx,sy);const g=ctx.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,`rgba(${rgb},${alpha})`);g.addColorStop(.26,`rgba(${rgb},${alpha*.48})`);g.addColorStop(1,`rgba(${rgb},0)`);ctx.fillStyle=g;ctx.fillRect(-r,-r,r*2,r*2);ctx.restore()}
function spark(ctx,p,r,a,rgb='255,235,180'){glow(ctx,p[0],p[1],r*5,a*.35,rgb);ctx.fillStyle=`rgba(${rgb},${a})`;ctx.beginPath();ctx.arc(p[0],p[1],r,0,TAU);ctx.fill()}
function path(ctx,curve,progress,alpha,width=1.4,rgb='255,218,137',from=0){progress=clamp(progress);if(progress<=from||alpha<=0)return;ctx.save();ctx.lineCap='round';ctx.lineJoin='round';const n=Math.ceil((progress-from)*100);ctx.beginPath();for(let i=0;i<=n;i++){const p=cubic(curve,mix(from,progress,i/n));i?ctx.lineTo(...p):ctx.moveTo(...p)}ctx.strokeStyle=`rgba(${rgb},${alpha*.11})`;ctx.lineWidth=width*7;ctx.stroke();ctx.strokeStyle=`rgba(${rgb},${alpha*.34})`;ctx.lineWidth=width*2.9;ctx.stroke();ctx.strokeStyle=`rgba(${rgb},${alpha})`;ctx.lineWidth=width;ctx.stroke();ctx.restore()}
function movingHead(ctx,curve,u,alpha=1,size=2){if(u<=0||u>=1)return;spark(ctx,cubic(curve,u),size,alpha)}
function ring(ctx,x,y,rx,ry,alpha){if(rx<=0||alpha<=0)return;ctx.save();ctx.lineWidth=1.2;ctx.strokeStyle=`rgba(255,216,134,${alpha})`;ctx.shadowColor='rgba(253,181,70,.8)';ctx.shadowBlur=9;ctx.beginPath();ctx.ellipse(x,y,rx,ry,-.025,0,TAU);ctx.stroke();ctx.restore()}
function faceGuard(ctx,point,face){const c=P(point,face);const xx=P(point,[face[0]+face[2],face[1]]);const yy=P(point,[face[0],face[1]+face[3]]);ctx.beginPath();ctx.rect(-100,-100,W+200,H+200);ctx.ellipse(c[0],c[1],Math.abs(xx[0]-c[0]),Math.abs(yy[1]-c[1]),0,0,TAU);ctx.clip('evenodd')}
function manusri(ctx,t,point){
 const o=P(point,specs.a5.anchors.mudra),palm=P(point,specs.a5.anchors.lapPalm),awake=ease((t-.25)/.55),open=ease((t-.53)/1.45);
 glow(ctx,o[0],o[1],42,awake*.38);spark(ctx,[o[0]-3,o[1]-2],2.5,awake*.86);
 // The first bends all lead away from the face: outward left, or below the chin.
 const stems=[
  [o,[o[0]-75,o[1]-15],[160,310],[132,570]],
  [o,[o[0]-96,o[1]+52],[195,520],[135,801]],
  [o,[o[0]+48,o[1]+112],[746,515],[804,813]],
  [o,[o[0]-48,o[1]+140],[239,704],[309,1038]],
 ];
 stems.forEach((curve,i)=>{
  const u=ease((t-.48-i*.075)/(1.5+i*.12));path(ctx,curve,u,.60*awake,1.4);movingHead(ctx,curve,u,.93,2.8);
  for(let k=0;k<3;k++){
   const at=.36+k*.17,root=cubic(curve,at),sgn=i===2?1:-1;
   const dx=sgn*(39+19*k),dy=-48+40*k;
   const branch=[root,[root[0]+dx*.55,root[1]-24],[root[0]+dx,root[1]+dy],[root[0]+dx+sgn*21,root[1]+dy+27]];
   const b=ease((u-at)/.23);path(ctx,branch,b,.48*awake,1.0);movingHead(ctx,branch,b,.78,1.6);
   if(b>.85)spark(ctx,cubic(branch,1),1.25,.7*awake);
  }
 });
 // A lap-palm glint answers the raised-hand lines without implying a new held object.
 glow(ctx,palm[0],palm[1],35,.20*ease((t-1.05)/.6));
 const receive=ease((t-1.65)/1.25);glow(ctx,476,1058,325,receive*.16,'255,212,133',1,.24);
 for(let i=0;i<4;i++){
  const q=ease((t-1.6-i*.20)/(1.55-i*.10));
  ring(ctx,476,1051+i*17,35+q*(310+i*20),8+q*(25+i*4),q*.36);
 }
 for(let i=0;i<28;i++){
  const birth=1.62+rnd(i+31)*.72,u=ease((t-birth)/.70);if(!u)continue;
  const a=rnd(i+12)*TAU,r=70+rnd(i+13)*275;
  spark(ctx,[476+Math.cos(a)*r*u,1058+Math.sin(a)*r*.16*u-16*Math.sin(u*Math.PI)],.7+rnd(i+15),u*.68);
 }
 return {source:o,lapPalm:palm,branchProgress:open,fieldProgress:receive};
}
function petal(ctx,x,y,size,rot,alpha,variant=0){if(alpha<=0)return;ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(.70+variant*.24,1);ctx.globalAlpha*=alpha;const g=ctx.createLinearGradient(0,-size,0,size);g.addColorStop(0,'#fff2cf');g.addColorStop(.34,'#f5bec7');g.addColorStop(1,'#bd6a8b');ctx.fillStyle=g;ctx.shadowColor='rgba(244,175,187,.35)';ctx.shadowBlur=7;ctx.beginPath();ctx.moveTo(0,-size);ctx.bezierCurveTo(size*.92,-size*.44,size*.72,size*.77,0,size);ctx.bezierCurveTo(-size*.65,size*.38,-size*.54,-size*.56,0,-size);ctx.fill();ctx.shadowBlur=0;ctx.lineWidth=.65;ctx.strokeStyle='rgba(255,231,171,.80)';ctx.beginPath();ctx.moveTo(0,-size*.75);ctx.quadraticCurveTo(-size*.22,0,0,size*.65);ctx.stroke();ctx.restore()}
function samantabhadra(ctx,t,point){
 const o=P(point,specs.a6.anchors.lotus),awake=ease((t-.3)/.55);glow(ctx,o[0],o[1],47,awake*.34,'255,195,186');glow(ctx,o[0]-6,o[1],23,awake*.22);
 const ribbon=[o,[o[0]-260,o[1]+98],[62,754],[568,1093]],u=ease((t-.5)/2.05);
 path(ctx,ribbon,u,awake*.15,2.1,'255,211,176');movingHead(ctx,ribbon,u,.55,1.6);
 // Staggered individual emissions give visible travel rather than a layer fade.
 for(let i=0;i<54;i++){
  const start=.40+rnd(i+116)*2.05,flight=1.70+rnd(i+61)*.40;
  const raw=clamp((t-start)/flight);if(raw<=0)continue;
  const q=raw<1?raw:1,end=[90+rnd(i+501)*780,1027+rnd(i+511)*121];
  const spread=70+rnd(i+408)*185;
  const curve=[o,[o[0]-spread,o[1]+38+rnd(i+411)*136],[end[0]-270-rnd(i+412)*130,835+rnd(i+410)*80],end];
  const p=cubic(curve,q),s=(5.0+rnd(i+44)*6.0)*(.50+.50*ease(raw/.12));
  const drift=(1-q)*Math.sin(q*12+i)*8;
  const rot=-(.2+rnd(i+56))+(q*4.5)+Math.sin(q*10+i)*.20;
  // Descending last part visibly slows before the petal lies on the field.
  petal(ctx,p[0]+drift,p[1],s,raw===1?rnd(i+21)*TAU:rot,.84*ease(raw/.1),rnd(i+79));
  if(raw<1){
   const tail=cubic(curve,Math.max(0,q-.018));ctx.save();ctx.strokeStyle='rgba(255,212,155,.20)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(...tail);ctx.lineTo(p[0]+drift,p[1]);ctx.stroke();ctx.restore();
  }
 }
 const field=ease((t-1.85)/1.20);glow(ctx,470,1112,355,field*.19,'255,193,180',1,.19);
 for(let i=0;i<38;i++){const u=ease((t-2.05-rnd(i+865)*.40)/.68);if(!u)continue;spark(ctx,[86+rnd(i+883)*798,1038+rnd(i+818)*116],.45+rnd(i+892)*.8,u*.56,'255,225,164')}
 return {source:o,petals:54,travelProgress:u,fieldProgress:field};
}
function ksitigarbha(ctx,t,point){
 const A=specs.a8.anchors,jewel=P(point,A.jewel),lower=P(point,A.staffLower),neck=P(point,A.staffNeck),head=P(point,A.staffHead),tip=P(point,A.staffTip);
 const awaken=ease((t-.25)/.52),pulse=awaken*(.72+.28*Math.sin(Math.min(t,1.16)*7.0));
 glow(ctx,jewel[0],jewel[1],48,pulse*.50);glow(ctx,jewel[0],jewel[1]-3,20,pulse*.29,'255,242,190');
 for(let i=0;i<2;i++){const u=ease((t-.38-i*.23)/.68);if(u>0){ctx.save();ctx.strokeStyle=`rgba(255,230,160,${awaken*.20*(1-u*.3)})`;ctx.lineWidth=.8;ctx.beginPath();ctx.arc(jewel[0],jewel[1],23+u*(12+i*5),0,TAU);ctx.stroke();ctx.restore()}}
 const link=[jewel,[jewel[0]-20,jewel[1]+43],[lower[0]+12,lower[1]+27],lower];
 const linkP=ease((t-.61)/.66);path(ctx,link,linkP,awaken*.65,1.4);movingHead(ctx,link,linkP,.90,2.1);
 // These paths hug the actual diagonal shaft rather than an invented straight pole.
 const shaft=[lower,P(point,[744,492]),P(point,[722,352]),neck];
 const up=ease((t-.94)/1.00);path(ctx,shaft,up,.83*awaken,1.7);movingHead(ctx,shaft,up,1,2.7);
 for(let i=0;i<2;i++){
  const offset=i?4:-4,curve=shaft.map(p=>[p[0]+offset,p[1]]),v=ease((t-1.04-i*.1)/1.04);
  path(ctx,curve,v,.32*awaken,.8);movingHead(ctx,curve,v,.76,1.3);
 }
 const crown=[neck,P(point,[700,227]),P(point,[693,208]),head],c=ease((t-1.63)/.43);
 path(ctx,crown,c,awaken*.7,1.4);movingHead(ctx,crown,c,.92,2.3);
 const toTip=[head,[head[0]-9,head[1]-25],[tip[0]+2,tip[1]+28],tip],tipP=ease((t-1.88)/.48);
 path(ctx,toTip,tipP,.55*awaken,1.1);
 const charged=ease((t-1.83)/.5);glow(ctx,head[0],head[1],55,charged*.42);spark(ctx,head,2.1,charged*.78);
 // Fan paths turn outward immediately; none passes across the protected face.
 const fans=[
  [head,[head[0]-86,head[1]-87],[92,263],[108,609]],
  [head,[head[0]-111,head[1]-18],[137,509],[215,945]],
  [head,[head[0]-11,head[1]-120],[572,102],[804,315]],
  [head,[head[0]+12,head[1]-156],[898,89],[870,745]],
 ];
 fans.forEach((curve,i)=>{
  const u=ease((t-1.94-i*.085)/(.99-i*.015));path(ctx,curve,u,.63*charged,1.25);movingHead(ctx,curve,u,.91,2.25);
  for(let k=0;k<3;k++){
   const at=.50+k*.16,root=cubic(curve,at),sgn=i<2?-1:1;
   const branch=[root,[root[0]+sgn*24,root[1]-28],[root[0]+sgn*(50-k*7),root[1]+8],[root[0]+sgn*(53-k*5),root[1]+49]];
   const q=ease((u-at)/.21);path(ctx,branch,q,charged*.32,.8);if(q>.95)spark(ctx,cubic(branch,1),1.05,charged*.62);
  }
 });
 const field=ease((t-2.50)/.65);for(let i=0;i<3;i++)ring(ctx,477,1083+i*17,120+field*(178+i*52),18+field*(12+i*4),field*.19);
 return {source:jewel,staffHead:head,jewelProgress:awaken,shaftProgress:up,fanProgress:charged,fieldProgress:field};
}
function draw(ctx,t,id,point){
 id=String(id);if(/^\d+$/.test(id))id='a'+id;if(!specs[id])return null;
 if(typeof point!=='function')throw new TypeError('responses-a5-a6-a8: point must map source pixels to screen coordinates');
 t=Math.max(0,Math.min(3.2,Number(t)||0));if(t<=.25)return {id,t,active:false};
 ctx.save();faceGuard(ctx,point,specs[id].face);ctx.globalCompositeOperation='source-over';
 const state=(id==='a5'?manusri:id==='a6'?samantabhadra:ksitigarbha)(ctx,t,point);
 ctx.restore();return {id,t,active:true,...state};
}
module.exports={draw,specs};
