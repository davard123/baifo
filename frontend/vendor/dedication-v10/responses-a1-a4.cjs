'use strict';
/**
 * Four source-bound blessing responses, drawn over the unchanged original art.
 * Coordinates in specs and all paths are ORIGINAL 1672 × 941 image pixels.
 * draw(ctx, seconds [0..4], 'a1'..'a4', point) maps original-image points to
 * the parent canvas. point may return [x,y] or {x,y}. No images are modified.
 */
const TAU = Math.PI * 2;
const clamp = (v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth = (a,b,v)=>{const x=clamp((v-a)/(b-a));return x*x*(3-2*x);};
const mix=(a,b,u)=>a+(b-a)*u;
const specs = {
 a1: {name:'Shakyamuni', anchor:[670,313], source:'Center of the original raised right palm', response:'Concentric golden blessing waves expand outward and down from the palm, with traveling light on the lower fan.', sourceBounds:[625,218,93,162]},
 a2: {name:'Amitabha', anchor:[835,383], source:'Upper center of the held lotus bloom', response:'The lotus awakens, opens a gold aureole, and releases two rising fountains of golden petals outside the face.', sourceBounds:[782,367,104,82]},
 a3: {name:'Medicine Buddha', anchor:[838,446], source:'Opening at the upper rim of the held medicine vessel', response:'An aqua-and-gold ascending double spiral grows directly from the vessel opening; there is no vessel rotation or liquid.', sourceBounds:[795,409,90,79]},
 a4: {name:'Maitreya', anchor:[479,496], source:'Original prayer-bead strand in the raised right hand', response:'Individual prayer beads illuminate in order, then release rounded warm-gold blessing arcs from the lowest bead.', sourceBounds:[410,355,165,154], beads:[[545,365],[558,378],[564,397],[562,420],[554,442],[541,461],[524,477],[503,489],[479,496],[456,493],[439,484],[427,466],[421,442],[421,418],[425,395],[436,374]]}
};
function mapping(point) {
 const p = a=>{const v=point(a); return Array.isArray(v)?v:[v.x,v.y];};
 const a=p([0,0]), b=p([100,0]);
 return {p,s:Math.max(.01,Math.hypot(b[0]-a[0],b[1]-a[1])/100)};
}
function dot(ctx,x,y,r,color,opacity=1) {
 if(opacity<=0||r<=0)return;
 const g=ctx.createRadialGradient(x,y,0,x,y,r);
 g.addColorStop(0,`rgba(${color},${opacity})`);g.addColorStop(.22,`rgba(${color},${opacity*.67})`);g.addColorStop(1,`rgba(${color},0)`);
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
}
function glow(ctx,p,a,r,color,opacity) {const q=p(a);dot(ctx,q[0],q[1],r,color,opacity);}
function path(ctx,pts,p,color,alpha,width,blur=0) {
 if(pts.length<2||alpha<=0)return;
 ctx.save(); ctx.strokeStyle=`rgba(${color},${clamp(alpha)})`;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor=`rgba(${color},${clamp(alpha)})`;ctx.shadowBlur=blur;
 ctx.beginPath(); pts.forEach((a,i)=>{const q=p(a);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});ctx.stroke();ctx.restore();
}
function bez(p0,p1,p2,p3,u) {const a=1-u;return[a*a*a*p0[0]+3*a*a*u*p1[0]+3*a*u*u*p2[0]+u*u*u*p3[0],a*a*a*p0[1]+3*a*a*u*p1[1]+3*a*u*u*p2[1]+u*u*u*p3[1]];}
function curve(ctx,fn,u0,u1,p,c,a,w,s,steps=55){const pts=[];for(let i=0;i<=steps;i++)pts.push(fn(mix(u0,u1,i/steps)));path(ctx,pts,p,c,a,w*s,9*s);}
function ellipsePath(cx,cy,rx,ry,start,end,n=90){return Array.from({length:n+1},(_,i)=>{let a=mix(start,end,i/n);return[cx+Math.cos(a)*rx,cy+Math.sin(a)*ry];});}
function spark(ctx,p,a,size,alpha,s,col='255,237,174') {const [x,y]=p(a);dot(ctx,x,y,size*4*s,col,alpha*.35);ctx.save();ctx.fillStyle=`rgba(${col},${alpha})`;ctx.translate(x,y);ctx.beginPath();ctx.moveTo(0,-size*s);ctx.quadraticCurveTo(size*.2*s,-size*.2*s,size*s,0);ctx.quadraticCurveTo(size*.2*s,size*.2*s,0,size*s);ctx.quadraticCurveTo(-size*.2*s,size*.2*s,-size*s,0);ctx.quadraticCurveTo(-size*.2*s,-size*.2*s,0,-size*s);ctx.fill();ctx.restore();}
function petal(ctx,p,a,len,angle,alpha,s) {const [x,y]=p(a);ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.shadowColor='rgba(255,202,89,.6)';ctx.shadowBlur=9*s;const g=ctx.createLinearGradient(0,-len*s,0,len*.25*s);g.addColorStop(0,`rgba(255,247,199,${alpha})`);g.addColorStop(1,`rgba(255,177,51,${alpha*.38})`);ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,-len*s);ctx.bezierCurveTo(len*.8*s,-len*.35*s,len*.45*s,len*.12*s,0,len*.32*s);ctx.bezierCurveTo(-len*.45*s,len*.12*s,-len*.8*s,-len*.35*s,0,-len*s);ctx.fill();ctx.strokeStyle=`rgba(255,242,183,${alpha*.67})`;ctx.lineWidth=.75*s;ctx.beginPath();ctx.moveTo(0,len*.2*s);ctx.quadraticCurveTo(len*.12*s,-len*.4*s,0,-len*.86*s);ctx.stroke();ctx.restore();}
function palm(ctx,t,p,s) {
 const on=smooth(.24,.86,t), bloom=smooth(.5,1.45,t), late=smooth(2.75,3.75,t);
 const src=specs.a1.anchor;
 glow(ctx,p,src,(33+7*Math.sin(t*3))*s,'255,198,69',on*.33);
 glow(ctx,p,src,13*s,'255,248,198',on*.43);
 // Open lower semicircles keep the head and original expression untouched.
 for(let k=0;k<8;k++){
  const age=t-(.5+k*.39);if(age<=0)continue;
  const r=13+age*139;
  const alpha=on*(.44+.11*late)*smooth(0,.23,age)*(1-.69*clamp(age/3.65));
  const pts=ellipsePath(src[0],src[1]+7,r,r*.75,Math.PI*.02,Math.PI*.98);
  path(ctx,pts,p,'255,187,64',alpha*.35,7*s,15*s);
  path(ctx,pts,p,'255,225,139',alpha,1.85*s,9*s);
  for(let j=0;j<7;j++){
   const a=Math.PI*(.09+j*.134)+.025*Math.sin(t*2+k+j), q=[src[0]+Math.cos(a)*r,src[1]+7+Math.sin(a)*r*.75];
   spark(ctx,p,q,2.1+(j%3)*.65,alpha*.98,s);
  }
 }
 const fans=[[[src[0],src[1]+5],[610,354],[468,420],[439,669]],[[src[0],src[1]+5],[666,395],[637,499],[610,715]],[[src[0],src[1]+5],[736,362],[875,443],[941,671]]];
 fans.forEach((v,j)=>{const fn=u=>bez(...v,u);curve(ctx,fn,0,bloom,p,'255,216,128',on*.11,1.6,s);for(let k=0;k<5;k++){const u=((Math.max(0,t-.8)*.34+k*.21+j*.06)%1);if(t>.8&&u<bloom){const q=fn(u);glow(ctx,p,q,6*s,'255,229,155',on*.32*(1-u*.5));}}});
}
function lotus(ctx,t,p,s) {
 const src=specs.a2.anchor, on=smooth(.25,.95,t), open=smooth(.7,2.45,t), late=smooth(2.8,3.8,t);
 glow(ctx,p,src,(30+9*open)*s,'255,195,61',on*.33);
 glow(ctx,p,[835,384],13*s,'255,246,168',on*.5);
 // A compact opening aureole follows the actual held lotus, not the backdrop.
 for(let j=0;j<3;j++) {
  const r=19+open*(17+j*10), pts=ellipsePath(835,383,r,r*.33,0,TAU);
  path(ctx,pts,p,'255,220,114',on*(.21-j*.045),1.5*s,9*s);
 }
 for(const side of [-1,1]) {
  const fn=u=>bez(src,[835+side*140,373],[835+side*238,281],[835+side*239,150],u);
  curve(ctx,fn,0,open,p,'255,208,94',on*.25,2.9,s);
  curve(ctx,fn,0,open,p,'255,242,181',on*.14,1,s);
 }
 // Petals travel away from the held lotus before gaining height, never crossing the face.
 for(let i=0;i<28;i++) {
  const born=.66+i*.102, age=t-born;if(age<=0)continue;
  const side=i%2?-1:1, lane=(Math.floor(i/2)%4), duration=2.1+lane*.16, u=clamp(age/duration);
  const end=[835+side*(220+lane*31),164+lane*21];
  const q=bez(src,[835+side*(81+lane*12),383],[835+side*(200+lane*39),280],end,u);
  // The climactic held state keeps earlier petals luminous rather than cutting them off.
  const a=on*smooth(0,.15,age)*(.86-.23*smooth(.8,1,u));
  const bob=Math.sin(t*2+i*1.7)*2.5*u;
  petal(ctx,p,[q[0]+bob,q[1]],10.2+(i%4)*1.9,side*(.3+u*.55)+Math.sin(t+i)*.12,a,s);
  if(i%3===0)spark(ctx,p,[q[0]-side*8,q[1]+12],2.1,a*.7,s);
 }
 // Individual source petals brighten in an opening fan without replacing the sculpture.
 for(let k=0;k<7;k++) {const a=Math.PI*(1.08+k*.14),r=13+open*9;const q=[835+Math.cos(a)*r,389+Math.sin(a)*r*.53];glow(ctx,p,q,5.2*s,'255,230,132',on*(.24+.06*late));}
}
function medicine(ctx,t,p,s) {
 const src=specs.a3.anchor, on=smooth(.25,.95,t), grow=smooth(.6,2.65,t), late=smooth(2.8,3.8,t);
 glow(ctx,p,src,30*s,'102,233,217',on*.33);glow(ctx,p,src,12*s,'254,237,170',on*.5);
 path(ctx,ellipsePath(src[0],src[1],27,7,0,TAU),p,'187,255,237',on*.54,1.65*s,10*s);
 // Two coherent helices grow upward from the exact vessel opening. They stay below the chin.
 const helix=(u,phase)=>{
  const radius=8+u*78, a=u*TAU*1.85+phase+t*.78;
  return [src[0]+Math.sin(a)*radius*u,src[1]-u*174+Math.cos(a)*11*u];
 };
 for(let lane=0;lane<2;lane++) {
  const color=lane?'255,221,131':'134,243,226', fn=u=>helix(u,lane*Math.PI);
  curve(ctx,fn,0,grow,p,color,on*(.29+.08*late),4.3,s,100);
  ctx.save();ctx.globalCompositeOperation='source-over';curve(ctx,fn,0,grow,p,lane?'255,229,153':'139,242,224',on*.67,1.8,s,100);ctx.restore();
  for(let k=0;k<10;k++) {const u=(Math.max(0,t-.66)*.24+k*.103+lane*.04)%1;if(u>grow)continue;const q=fn(u);glow(ctx,p,q,7*s,color,on*.44);if(k%3===0)spark(ctx,p,q,2.5,on*.63,s,color);}
 }
 // Shallow luminous ripples lift off the rim. The vessel itself stays completely still.
 for(let k=0;k<6;k++) {const age=t-(.83+k*.46);if(age<0)continue;const u=clamp(age/2.5),y=446-u*165,rx=15+u*52;path(ctx,ellipsePath(838,y,rx,5+u*6,0,TAU),p,k%2?'255,218,128':'134,244,226',on*(.24-u*.13),1.2*s,8*s);}
 for(let i=0;i<16;i++){const age=t-(.8+i*.16);if(age<=0)continue;const u=clamp(age/2.8),side=i%2?-1:1;const q=[838+side*(15+u*89)+Math.sin(i+t*1.2)*7*u,446-u*(155+(i%3)*8)];spark(ctx,p,q,1.5+(i%3)*.5,on*(.42+.1*late),s,i%2?'255,230,151':'167,254,233');}
}
function beads(ctx,t,p,s) {
 const beads=specs.a4.beads,on=smooth(.25,.8,t),send=smooth(1.25,2.85,t),late=smooth(2.8,3.75,t);
 // Activation follows the original white beads, clockwise from the holding fingers.
 beads.forEach((b,i)=>{
  const born=.26+i*.047, lit=smooth(born,born+.21,t);
  const chase=.5+.5*Math.cos(t*4-i*.58),a=lit*(.35+.18*chase+.08*late);
  glow(ctx,p,b,13*s,'255,201,80',a);
  glow(ctx,p,b,5.2*s,'255,249,202',a*.73);
  // The pearls are nearly white: an additive glow alone would not read.
  // A narrow luminous gold rim makes each sequential activation visible.
  const [bx,by]=p(b);ctx.save();ctx.globalCompositeOperation='source-over';ctx.strokeStyle=`rgba(255,216,105,${lit*(.40+.25*chase)})`;ctx.lineWidth=2.2*s;ctx.shadowColor='rgba(255,190,64,.7)';ctx.shadowBlur=7*s;ctx.beginPath();ctx.arc(bx,by,9.2*s,0,TAU);ctx.stroke();ctx.restore();
 });
 // A fine linked line becomes visible only between activated beads.
 const active=clamp((t-.26)/.85);const count=Math.min(beads.length-1,Math.floor(active*(beads.length-1)));
 if(count>0)path(ctx,beads.slice(0,count+1),p,'255,218,127',on*.24,1.35*s,8*s);
 const src=specs.a4.anchor;glow(ctx,p,src,(18+6*send)*s,'255,212,105',send*.36);
 // Soft round arcs flow from the lowest prayer bead into the lower foreground.
 for(let k=0;k<7;k++) {
  const age=t-(1.08+k*.38);if(age<=0)continue;
  const u=clamp(age/2.8),r=19+u*310,cy=src[1]+u*13;
  const pts=ellipsePath(src[0],cy,r,r*.69,Math.PI*.03,Math.PI*.97);
  const alpha=smooth(0,.22,age)*(.37+.1*late)*(1-.5*u);
  path(ctx,pts,p,'255,190,70',alpha*.37,6.5*s,17*s);
  path(ctx,pts,p,'255,226,147',alpha,2.4*s,9*s);
  // Rounded pearl-like blessing lights distinguish these arcs from the palm waves.
  for(let j=0;j<9;j++){const ang=Math.PI*(.1+j*.1),q=[src[0]+Math.cos(ang)*r,cy+Math.sin(ang)*r*.69];glow(ctx,p,q,(4.4+j%3*.7)*s,'255,231,166',alpha*1.05);}
 }
 // Two rounded trails remain continuously attached to the bead.
 for(const side of [-1,1]) {const fn=u=>bez(src,[479+side*77,523],[479+side*115,636],[479+side*208,693],u);curve(ctx,fn,0,send,p,'255,224,144',send*.17,2.4,s);for(let i=0;i<4;i++){const u=(Math.max(0,t-1.15)*.36+i*.24)%1;if(u<send&&t>1.15)glow(ctx,p,fn(u),5.5*s,'255,239,187',send*.36);}}
}
function draw(ctx,t,id,point) {
 const key=typeof id==='number'?`a${id}`:id;if(!specs[key])return;
 const {p,s}=mapping(point); t=clamp(Number(t)||0,0,4);if(t<.24)return;
 ctx.save();ctx.globalCompositeOperation='screen';
 ({a1:palm,a2:lotus,a3:medicine,a4:beads}[key])(ctx,t,p,s);
 ctx.restore();
}
module.exports={draw,specs};
