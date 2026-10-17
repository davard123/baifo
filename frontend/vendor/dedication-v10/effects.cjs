// Procedural Canvas effects. No AI video, image morphing, or face repainting.
const {createCanvas}=require('@napi-rs/canvas');
const W=960,H=1200,PI=Math.PI;
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10)};
const rand=n=>{const a=Math.sin(n*135.781+13.42)*41274.64;return a-Math.floor(a)};
function glow(c,x,y,r,rgb,a,sx=1,sy=1){if(a<=0)return;c.save();c.translate(x,y);c.scale(sx,sy);let g=c.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(.45,`rgba(${rgb},${a*.32})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(-r,-r,r*2,r*2);c.restore()}
function fxState(t){return {field:ease((t-2.8)/2.9),cloud:ease((t-3.9)/4.3),gold:ease((t-6.0)/3.2)}}
function background(c,t){const s=fxState(t),a=s.field*.35+s.gold*.65;const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,`rgb(${24+Math.round(a*67)},${23+Math.round(a*22)},${19-Math.round(a*2)})`);g.addColorStop(.6,`rgb(${39+Math.round(a*36)},${34+Math.round(a*12)},20)`);g.addColorStop(1,`rgb(${21+Math.round(a*70)},${38+Math.round(a*15)},${36-Math.round(a*10)})`);c.fillStyle=g;c.fillRect(0,0,W,H);
 glow(c,480,470,610,'255,182,55',.16+a*.25,1,1.2);
 c.save();c.globalCompositeOperation='screen';
 // The lighting reaches the complete frame, but stays behind the raster statue.
 for(let i=0;i<88;i++){const th=rand(i+10)*PI*2+.016*Math.sin(t*.29+i),r=1800,spread=.003+rand(i+21)*.028;const grad=c.createLinearGradient(480,690,480+Math.cos(th)*r,690+Math.sin(th)*r);grad.addColorStop(0,'rgba(255,224,120,0)');grad.addColorStop(.14,`rgba(255,210,107,${(.030+rand(i+34)*.085)*a})`);grad.addColorStop(.9,'rgba(254,188,52,0)');c.fillStyle=grad;c.beginPath();c.moveTo(480,690);c.lineTo(480+Math.cos(th-spread)*r,690+Math.sin(th-spread)*r);c.lineTo(480+Math.cos(th+spread)*r,690+Math.sin(th+spread)*r);c.closePath();c.fill()}
 for(let i=0;i<14;i++){const x=rand(i+230)*W,y=rand(i+431)*H;glow(c,x,y,160+rand(i+532)*240,'255,186,71',s.gold*.13,1,1.25)}
 c.restore();c.strokeStyle=`rgba(255,211,116,${.24+a*.25})`;c.lineWidth=.7;for(let i=0;i<3;i++){c.beginPath();c.ellipse(480,362,192+i*14,223+i*15,0,0,PI*2);c.stroke()}
}
// V8 uses medium-visible translucent mist, between V5 dense cloud walls and V7 wisps with translucent smoke ribbons.
// Layers start at different heights. Their upward drift uses real seconds,
// never the accelerated effect clock: at most 14 px/s, not 600–1,000 px/s.
function mistState(t,side,i){const start=1.45+i*.105,age=Math.max(0,t-start),amount=ease(age/1.05);return {amount,x:(side?853:108)+Math.sin(i*1.53+side)*38+Math.sin(t*.30+i)*7,y:1137-i*157-age*(10+i*.55),age}}
function mistWisp(c,x,y,w,h,alpha,seed,t){
 // Separate narrow veils leave clear gaps and preserve the warm background.
 for(let k=0;k<5;k++){const ox=(rand(seed*17+k+3)-.5)*w*.7,oy=(rand(seed*19+k+32)-.5)*h;glow(c,x+ox,y+oy,w*.51,'245,239,220',alpha*(.52+rand(k+seed*13)*.25),1,.17+rand(k+seed*7)*.15)}
 // Soft, gently undulating smoke threads. No brown shading or opaque ball forms.
 for(let k=0;k<3;k++){c.beginPath();for(let j=0;j<=45;j++){const u=j/45,xx=x-w*.58+u*w*1.16,yy=y+Math.sin(u*PI*1.5+seed*.6+t*.20+k*.16)*h*.34+(k-1)*h*.15; j?c.lineTo(xx,yy):c.moveTo(xx,yy)}
  for(const [width,a]of [[22,.08],[10,.10],[3.0,.095]]){c.strokeStyle=`rgba(246,239,220,${alpha*a})`;c.lineWidth=width;c.lineCap='round';c.stroke()}
 }
}
function clouds(c,fxT,front=false,realT=fxT){c.save();c.globalCompositeOperation='screen';
 for(let side=0;side<2;side++){for(let i=0;i<8;i++){const m=mistState(realT,side,i);if(!m.amount)continue;const x=m.x+(front?(side?45:-45):0),w=255+rand(i+side*101)*104,h=58+rand(i+side*87)*48,alpha=m.amount*(front?.115:.32);mistWisp(c,x,m.y,w,h,alpha,i+side*19,realT)}}
 // A few very light lower veils join the field without forming a solid bank.
 const low=ease((realT-1.48)/1.15);for(let i=0;i<4;i++)mistWisp(c,75+i*270,1150-(realT-1.48)*9+Math.sin(i)*15,240,46,low*(front?.09:.17),i+51,realT);
 c.restore();
}

function blossom(c,x,y,scale,opacity,open,phase=0){if(opacity<=0)return;c.save();c.translate(x,y);c.scale(scale,scale);c.globalAlpha*=opacity;
 c.save();c.globalCompositeOperation='screen';glow(c,0,-6,109,'255,181,60',.40,1,.7);glow(c,0,17,96,'255,222,145',.48,1,.22);c.restore();
 // Curved overlapping gold-coral petals with a luminous edge and shaded bases.
 for(let layer=0;layer<3;layer++){const n=layer===0?7:layer===1?6:5;for(let i=0;i<n;i++){const a=(i-(n-1)*.5)*(.38+layer*.065)*(.38+.62*open),len=70-layer*15,w=19-layer*3;c.save();c.rotate(a);c.scale(1,layer===0?1:.93);const g=c.createLinearGradient(0,16,0,-len);g.addColorStop(0,'#8f4919');g.addColorStop(.3,layer===2?'#e8a035':'#d67933');g.addColorStop(.63,'#f6c77a');g.addColorStop(1,'#fff3bd');c.fillStyle=g;c.strokeStyle='rgba(255,235,164,.82)';c.lineWidth=.95;c.beginPath();c.moveTo(0,18);c.bezierCurveTo(-w*1.15,3,-w*1.28,-len*.47,0,-len);c.bezierCurveTo(w*1.1,-len*.39,w*.95,3,0,18);c.fill();c.stroke();c.restore()}}
 c.save();c.globalCompositeOperation='screen';glow(c,0,0,23,'255,241,181',.7);c.restore();c.restore();
}
const flowerGroups=[
 // Distant miniature field around the pedestal sides.
 ...Array.from({length:18},(_,i)=>{const side=i%2;return {x:side?766+rand(i+400)*180:14+rand(i+400)*210,y:795+rand(i+201)*269,scale:.20+rand(i+811)*.40,delay:3.10+rand(i+138)*.95,far:true}}),
 // Near clusters fill the bottom and extend beyond both frame edges.
 ...Array.from({length:18},(_,i)=>({x:24+(i%9)*114+(rand(i+972)-.5)*46,y:(i<9?1100:1186)+rand(i+566)*45,scale:i<9?.40+rand(i+317)*.53:.70+rand(i+81)*.72,delay:3.1+rand(i+971)*1.4,far:false})),
 // Small luminous blossoms ride the two cloud columns.
 ...Array.from({length:12},(_,i)=>({x:i%2?790+rand(i+921)*103:60+rand(i+921)*117,y:710-Math.floor(i/2)*102,scale:.20+rand(i+540)*.24,delay:4.9+Math.floor(i/2)*.42,far:true}))
];
function flowers(c,t,far){for(let i=0;i<flowerGroups.length;i++){const f=flowerGroups[i];if(f.far!==far)continue;const p=ease((t-f.delay)/1.6);if(p<=0)continue;const shift=far?(1-p)*44+Math.sin(t*.52+i)*5:0;blossom(c,f.x,f.y+shift,f.scale*(.72+.28*p),p*(far?.79:.97),p,i)}}
function particles(c,t,front=false){const s=fxState(t),strength=.13*s.field+.87*s.gold;if(strength<=0)return;c.save();c.globalCompositeOperation='screen';const n=front?220:1050;
 for(let i=0;i<n;i++){const seed=i+(front?1230:0),x=(rand(seed+917)*W+Math.sin(t*.27+seed)*11+W)%W,y=(rand(seed+312)*H-t*(5+rand(seed+198)*14)+2400)%H;
 if(front&&x>245&&x<720&&y<1060)continue;
 const tw=.4+.6*Math.pow(Math.sin(t*(.7+rand(seed+887)) + seed*2.7),2),a=strength*(.18+rand(seed+666)*.62)*tw,r=.45+Math.pow(rand(seed+117),3)*2.1;
 if(i%9===0)glow(c,x,y,r*6,'255,220,112',a*.75);
 c.fillStyle=`rgba(255,234,159,${a})`;c.beginPath();c.arc(x,y,r,0,PI*2);c.fill();if(i%41===0){c.strokeStyle=`rgba(255,232,159,${a*.64})`;c.lineWidth=.65;c.beginPath();c.moveTo(x-r*4,y);c.lineTo(x+r*4,y);c.moveTo(x,y-r*4);c.lineTo(x,y+r*4);c.stroke()}
 }c.restore();
}
function ribbons(c,t){const s=fxState(t);if(s.gold<=0)return;c.save();c.globalCompositeOperation='screen';for(let side=0;side<2;side++){for(let k=0;k<5;k++){c.beginPath();for(let j=0;j<=100;j++){const u=j/100,y=1150-u*1180,x=(side?835:125)+(side?-1:1)*(Math.sin(u*PI*2.2+t*.24+k*.16)*(42+k*8));j?c.lineTo(x,y):c.moveTo(x,y)}c.strokeStyle=`rgba(255,220,134,${s.gold*(k===2?.3:.07)})`;c.lineWidth=k===2?1.0:4;c.stroke()}}c.restore()}
function portraitVeil(c,t){const a=ease((t-1.60)/1.6);if(a<=0)return;c.save();c.globalCompositeOperation='screen';const drift=(t-1.6)*11;mistWisp(c,405,714-drift,530,85,a*.165,73,t);mistWisp(c,559,911-drift,550,75,a*.17,87,t);glow(c,327,632-drift,160,'247,241,224',a*.045,1,.4);glow(c,643,780-drift,175,'247,241,224',a*.042,1,.48);c.restore()}
module.exports={fxState,background,clouds,flowers,particles,ribbons,blossom,flowerGroups,mistState,portraitVeil};
