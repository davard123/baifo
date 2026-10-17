// V5: original V3 raster rig; condensed wrist/flow timing for a four-second clip.
// No overhead lift or continuous arm interpolation is claimed by these stills.
const W=960,H=1200,PI=Math.PI;
const cfg={scale:1.03,ox:480-836*1.03,oy:119,mouth:[855,475],poseTransform:[0,0,1672,941]};
const point=p=>[cfg.ox+p[0]*cfg.scale,cfg.oy+p[1]*cfg.scale];
const rand=n=>{const v=Math.sin(n*125.7+71.9)*43857.5;return v-Math.floor(v)};
function glow(ctx,x,y,r,rgb,alpha,sx=1,sy=1){ctx.save();ctx.translate(x,y);ctx.scale(sx,sy);const g=ctx.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,`rgba(${rgb},${alpha})`);g.addColorStop(.32,`rgba(${rgb},${alpha*.4})`);g.addColorStop(1,`rgba(${rgb},0)`);ctx.fillStyle=g;ctx.fillRect(-r,-r,r*2,r*2);ctx.restore()}
  function oldArmPath(ctx){
    ctx.moveTo(952,431);ctx.bezierCurveTo(966,438,981,452,986,473);
    ctx.bezierCurveTo(991,482,1004,489,1009,493);
    ctx.bezierCurveTo(980,499,959,505,941,506);
    ctx.bezierCurveTo(921,514,902,511,886,516);
    ctx.bezierCurveTo(873,521,853,520,839,517);
    ctx.bezierCurveTo(827,517,817,511,811,508);
    ctx.bezierCurveTo(804,503,807,496,814,495);
    ctx.bezierCurveTo(818,495,821,498,826,499);
    ctx.lineTo(830,491);ctx.bezierCurveTo(821,486,818,480,819,475);
    ctx.bezierCurveTo(821,470,825,475,829,479);
    ctx.bezierCurveTo(824,468,825,457,830,446);
    ctx.bezierCurveTo(832,438,834,428,833,421);
    ctx.lineTo(834,414);ctx.bezierCurveTo(834,410,841,409,844,414);
    ctx.lineTo(845,429);ctx.bezierCurveTo(846,441,855,451,855,468);
    ctx.bezierCurveTo(855,472,854,476,853,480);
    ctx.bezierCurveTo(867,478,879,477,894,481);
    ctx.bezierCurveTo(909,465,925,457,935,446);
    ctx.bezierCurveTo(941,440,946,435,952,431);ctx.closePath();
  }
function poseArmPath(ctx){
 ctx.moveTo(971,356);ctx.bezierCurveTo(997,358,1016,380,1018,398);ctx.bezierCurveTo(1017,423,1019,491,1034,505);ctx.bezierCurveTo(1008,505,966,496,949,485);ctx.bezierCurveTo(929,469,928,447,925,430);ctx.bezierCurveTo(920,437,909,445,897,449);ctx.bezierCurveTo(884,456,870,463,858,479);ctx.bezierCurveTo(852,490,842,493,833,487);ctx.bezierCurveTo(826,481,829,473,837,468);ctx.lineTo(869,426);ctx.bezierCurveTo(873,417,883,409,888,403);ctx.bezierCurveTo(894,395,904,386,919,382);ctx.bezierCurveTo(928,373,937,367,949,365);ctx.bezierCurveTo(957,360,965,358,971,356);ctx.closePath();
}
function handPath(ctx){
 ctx.moveTo(946,372);ctx.bezierCurveTo(928,374,906,386,889,397);ctx.bezierCurveTo(884,399,882,404,887,407);ctx.bezierCurveTo(881,412,874,423,869,431);ctx.lineTo(841,467);ctx.bezierCurveTo(831,468,827,473,830,482);ctx.bezierCurveTo(832,489,843,494,852,488);ctx.lineTo(895,450);ctx.bezierCurveTo(910,444,922,431,931,422);ctx.bezierCurveTo(946,425,954,413,959,400);ctx.bezierCurveTo(962,386,956,377,946,372);ctx.closePath();
}
function rotatedMouth(angle){const a=angle===undefined?(cfg.wristAngle||0):angle,p=cfg.wristPivot||[948,394],m=cfg.sourceMouth||[843,483],dx=m[0]-p[0],dy=m[1]-p[1],x=p[0]+dx*Math.cos(a)-dy*Math.sin(a),y=p[1]+dx*Math.sin(a)+dy*Math.cos(a),tr=cfg.poseTransform;return [tr[0]+x*tr[2]/1672,tr[1]+y*tr[3]/941]}
function statue(ctx,assets,pouring){
 ctx.save();ctx.translate(cfg.ox,cfg.oy);ctx.scale(cfg.scale,cfg.scale);
 if(!pouring||!assets.pose){ctx.drawImage(assets.original,0,0,1672,941)}else{
  ctx.save();ctx.beginPath();oldArmPath(ctx);ctx.clip();ctx.drawImage(assets.clean,0,0,1672,941);ctx.restore();
  ctx.save();ctx.beginPath();ctx.rect(0,0,1672,941);oldArmPath(ctx);ctx.clip('evenodd');ctx.drawImage(assets.original,0,0,1672,941);ctx.restore();
  const [x,y,w,h]=cfg.poseTransform;ctx.save();ctx.translate(x,y);ctx.scale(w/1672,h/941);
  ctx.save();ctx.beginPath();poseArmPath(ctx);handPath(ctx);ctx.clip('evenodd');ctx.drawImage(assets.pose,0,0,1672,941);ctx.restore();
  const pivot=cfg.wristPivot||[948,394];ctx.save();ctx.translate(...pivot);ctx.rotate(cfg.wristAngle||0);ctx.translate(-pivot[0],-pivot[1]);ctx.beginPath();handPath(ctx);ctx.clip();ctx.drawImage(assets.pose,0,0,1672,941);ctx.restore();ctx.restore();
 }ctx.restore();
}
function back(ctx,phase){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#191a15');g.addColorStop(.65,'#2e2d20');g.addColorStop(1,'#142728');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);glow(ctx,480,359,410,'207,178,99',.24,1,1.1);ctx.strokeStyle='rgba(210,184,109,.32)';ctx.lineWidth=.8;for(let n=0;n<2;n++){ctx.beginPath();ctx.ellipse(480,362,194+n*12,223+n*13,0,0,PI*2);ctx.stroke()}ctx.save();ctx.globalCompositeOperation='screen';for(let i=0;i<8;i++)glow(ctx,i*150-30,1090+Math.sin(i)*15,165,'205,210,190',.13,1,.35);ctx.restore();}
function drop(ctx,x,y,r,alpha,gold=false){ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.fillStyle=gold?'#ffe2a0':'#e1faff';ctx.beginPath();ctx.moveTo(0,-r*2);ctx.bezierCurveTo(r*.65,-r*.45,r,r*.2,r*.78,r*.7);ctx.bezierCurveTo(r*.3,r*1.7,-r*.3,r*1.7,-r*.78,r*.7);ctx.bezierCurveTo(-r,r*.2,-r*.65,-r*.45,0,-r*2);ctx.fill();ctx.restore()}
function lotus(ctx,x,y,amount,open=1,rings=true){ctx.save();ctx.globalCompositeOperation='screen';glow(ctx,x,y,155,'255,200,89',amount*.44,1,.6);glow(ctx,x,y+12,120,'255,213,111',amount*.7,1,.24);ctx.restore();ctx.save();ctx.translate(x,y);ctx.globalAlpha*=amount;
 for(let row=0;row<2;row++){const count=row?5:7;for(let i=0;i<count;i++){const a=(i-(count-1)/2)*(row?.50:.40)*(.32+.68*open),len=row?38:66;ctx.save();ctx.rotate(a);const g=ctx.createLinearGradient(0,12,0,-len);g.addColorStop(0,'#aa6523');g.addColorStop(.45,'#f9cc70');g.addColorStop(1,'#fff6d5');ctx.fillStyle=g;ctx.strokeStyle='rgba(255,233,170,.88)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,17);ctx.bezierCurveTo(-24,-1,-24,-len*.52,0,-len);ctx.bezierCurveTo(24,-len*.52,24,-1,0,17);ctx.fill();ctx.stroke();ctx.restore()}}
 ctx.restore();ctx.save();ctx.strokeStyle=`rgba(252,224,154,${.35*amount})`;ctx.lineWidth=.8;for(let r of (rings?[58,93,126]:[])){ctx.beginPath();ctx.ellipse(x,y+22,r,r*.18,0,0,PI*2);ctx.stroke()}ctx.restore();}
function water(ctx,phase){if(phase===0||cfg.suppressWater)return;const origin=point(rotatedMouth());const landing=[448,1092];const max=phase===1?.40:1;
 // q(u) is ballistic: x varies linearly, while y increases with u² plus
 // initial downward velocity. Its vertical derivative is always positive.
 const p=u=>[origin[0]+(landing[0]-origin[0])*u,origin[1]+42*u+(landing[1]-origin[1]-42)*u*u];
 ctx.save();ctx.lineCap='round';for(let pass=0;pass<3;pass++){ctx.beginPath();for(let i=0;i<=100;i++){const pos=p(i/100*max);i?ctx.lineTo(...pos):ctx.moveTo(...pos)}ctx.strokeStyle=[`rgba(140,213,233,.10)`,`rgba(209,245,251,.30)`,`rgba(243,255,255,.80)`][pass];ctx.lineWidth=[10,3.8,1.1][pass];ctx.stroke()}
 for(let i=1;i<37*max;i++){const u=i/37,pos=p(u);drop(ctx,pos[0]+(rand(i)-.5)*(2+u*8),pos[1],1.1+rand(i+31)*1.6,.65+rand(i+40)*.3,false)}
 // The conversion is local: only droplets close to the receiving lotus turn gold.
 if(phase===2){lotus(ctx,...landing,1);ctx.save();ctx.globalCompositeOperation='screen';glow(ctx,landing[0],landing[1]-20,65,'255,223,142',.50);for(let i=0;i<35;i++){const a=rand(i+71)*PI*2,r=rand(i+72)*105,x=landing[0]+Math.cos(a)*r,y=landing[1]-12+Math.sin(a)*r*.48;drop(ctx,x,y,1+rand(i+94)*2,.2+rand(i+101)*.5,true)}ctx.restore();}
 ctx.restore();return {origin,landing};}
function labels(ctx,phase){const title=['起手 · 原像静定','倾瓶 · 向身前下方','净水落莲 · 就地化光'][phase];ctx.textAlign='center';ctx.font='19px "Noto Sans CJK SC", sans-serif';ctx.fillStyle='#dccda7';ctx.fillText(title,480,59);ctx.font='12px "Noto Sans CJK SC", sans-serif';ctx.fillStyle='#9b9f89';ctx.fillText(`FOPUSHA  /  第三版姿态分镜  ${phase+1} / 3`,480,84);ctx.font='15px "Noto Sans CJK SC", sans-serif';ctx.fillStyle='#c8c4aa';ctx.fillText(phase===0?'先核对握瓶与姿态':phase===1?'瓶口低于瓶底，水向下落':'水先落下，再在身前下方化成莲花金光',480,1164)}
function draw(ctx,phase,assets){ctx.clearRect(0,0,W,H);back(ctx,phase);statue(ctx,assets,phase>0);water(ctx,phase);labels(ctx,phase)}
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10)};
function motionState(t){const tilt=ease((t-.10)/1.10);return {t,angle:(1-tilt)*42*PI/180,flow:ease((t-.22)/.55)*(1-.30*ease((t-2.85)/.35)),bloom:ease((t-1.35)/.55),rise:ease((t-1.50)/1.70)};}
function emitter(t){return point(rotatedMouth(motionState(t).angle));}
function waterMotion(ctx,t){
 const landing=[405,1118],g=900;let samples=[];
 // Each droplet retains the mouth position at its own emission time. Positive
 // downward velocity and gravity make every path monotone downward.
 for(let age=0;age<1.32;age+=.012){const born=t-age;if(born<0)break;const f=motionState(born).flow;if(f<.005)continue;const origin=emitter(born),mouthVy=(emitter(born+.004)[1]-emitter(born-.004)[1])/.008,vy=Math.max(20,48+30*f+mouthVy),flight=(-vy+Math.sqrt(vy*vy+2*g*(landing[1]-origin[1])))/g;if(age>=flight)continue;const vx=(landing[0]-origin[0])/flight;samples.push({x:origin[0]+vx*age+(Math.sin(born*22)*.70+Math.sin(born*47)*.22)*age*2.7,y:origin[1]+vy*age+.5*g*age*age,f,age,born});}
 ctx.save();ctx.lineCap='round';
 for(let i=1;i<samples.length;i++){const a=samples[i-1],b=samples[i];if(Math.abs(a.age-b.age)>.018)continue;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineWidth=5+b.f*3;ctx.strokeStyle=`rgba(145,218,232,${.025+b.f*.025})`;ctx.stroke();ctx.lineWidth=.65+b.f*2.05;ctx.strokeStyle=`rgba(209,245,252,${.32+b.f*.43})`;ctx.stroke();}
 const start=Math.max(0,Math.ceil((t-1.35)*70)),stop=Math.floor(t*70);for(let n=start;n<=stop;n++){const born=n/70,age=t-born,f=motionState(born).flow;if(f<.02||rand(n+127)>f)continue;const origin=emitter(born),mouthVy=(emitter(born+.004)[1]-emitter(born-.004)[1])/.008,vy=Math.max(20,48+30*f+mouthVy),flight=(-vy+Math.sqrt(vy*vy+2*g*(landing[1]-origin[1])))/g;if(age>=flight)continue;const xx=origin[0]+(landing[0]-origin[0])*age/flight+(Math.sin(born*22)*.70+Math.sin(born*47)*.22)*age*2.7+(rand(n+98)-.5)*3,yy=origin[1]+vy*age+.5*g*age*age;drop(ctx,xx,yy,.65+rand(n+74)*1.55,.4+.5*f,false);}
 const m=motionState(t),impact=motionState(t-1.02).flow;if(m.bloom>.001){lotus(ctx,...landing,m.bloom,m.bloom);ctx.save();ctx.globalCompositeOperation='screen';glow(ctx,landing[0],landing[1]-18,60,'255,223,144',impact*.38);for(let i=0;i<28;i++){const u=((t*.36+rand(i+378))%1+1)%1;let x=landing[0]+(rand(i+194)-.5)*180*u,y=landing[1]-10-u*40+u*u*25;drop(ctx,x,y,.6+rand(i+221)*1.6,impact*Math.sin(u*PI)*.48,true)}for(let i=0;i<6;i++){glow(ctx,landing[0]-185+i*74+Math.sin(t*.4+i)*31,1125+Math.sin(i)*15,130,'223,217,173',m.bloom*.17,1.4,.28)}ctx.restore();}ctx.restore();return samples;
}
function risingClouds(ctx,t){
 const s=motionState(t);if(s.rise<.001)return;const x0=405,y0=1118;ctx.save();ctx.globalCompositeOperation='screen';
 // Gold and cloud only rise after the water has reached the lotus below.
 for(let i=0;i<13;i++){const a=-PI*(.1+rand(i+773)*.8),r=(230+rand(i+886)*240)*s.rise,x=x0+Math.cos(a)*r,y=y0+Math.sin(a)*r*.78;glow(ctx,x,y,85+110*s.rise,'255,216,142',s.rise*(.12+rand(i+449)*.10),1.2,.48);}
 for(let i=0;i<70;i++){const u=clamp((t-4.2-rand(i+273)*.5)/3.5);if(u<=0)continue;const x=x0+(rand(i+552)-.5)*740*u,y=y0-(130+rand(i+773)*240)*u+Math.sin(u*4+i)*9;const a=s.rise*(.10+rand(i+776)*.45);glow(ctx,x,y,3+rand(i+557)*4,'255,218,127',a*.6);ctx.fillStyle=`rgba(255,238,184,${a})`;ctx.beginPath();ctx.arc(x,y,.65+rand(i+188)*1.6,0,PI*2);ctx.fill();}
 ctx.restore();
 for(let i=0;i<5;i++){const u=clamp((t-4.4-i*.18)/3.2);if(u<=0)continue;const x=x0+(i%2?-1:1)*(90+rand(i+660)*250)*u,y=y0-(190+rand(i+901)*135)*u;ctx.save();ctx.translate(x,y);const sc=.12+.22*u;ctx.scale(sc,sc);lotus(ctx,0,0,s.rise*(.25+.23*u),u,false);ctx.restore();}
}
function drawMotion(ctx,t,assets){cfg.wristAngle=motionState(t).angle;ctx.clearRect(0,0,W,H);back(ctx,2);statue(ctx,assets,true);risingClouds(ctx,t);const samples=waterMotion(ctx,t);ctx.save();ctx.textAlign='center';ctx.fillStyle='#dccda7';ctx.font='19px "Noto Sans CJK SC", sans-serif';ctx.fillText('净水回向 · 身前倾洒',480,59);ctx.font='12px "Noto Sans CJK SC", sans-serif';ctx.fillStyle='#9b9f89';ctx.fillText('FOPUSHA  /  二维手腕动作样片',480,84);ctx.font='15px "Noto Sans CJK SC", sans-serif';ctx.fillStyle='#c8c4aa';ctx.fillText(t<1.5?'环握净瓶 · 缓缓下倾':t<3.2?'细水向下 · 落在身前':t<5.0?'净水落莲 · 就地化光':'莲华展开 · 云光升起',480,1180);ctx.restore();return samples;}
module.exports={W,H,cfg,draw,water,point,rotatedMouth,drawMotion,motionState,emitter};
// V4 exposes the same motion and raster rig; only the surrounding VFX changes.
module.exports={...module.exports,statue,back,waterMotion,glow,lotus,rand,ease};
