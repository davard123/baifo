/* Fopusha Dedication V10. Local original assets; no network requests beyond asset URLs. */
(function(global) {
'use strict';
var modules = {
"browser-wrapper.js": function(module, exports, require) {
'use strict';
const engine = require("engine.cjs");
const FILES = Object.freeze(Object.assign(
  Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`a${i + 1}`, `a${i + 1}-original.webp`])),
  { clean: 'clean-base.png', pose: 'pouring-pose.png' }
));
const DURATION = 3;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Unable to load dedication asset: ${src.slice(0, 180)}`));
    img.src = src;
  });
}
function waitForImage(img, signal) {
  if (!img || (img.complete && img.naturalWidth > 0)) return Promise.resolve();
  if (img.complete && img.getAttribute('src')) return Promise.reject(new Error('The original image did not load.'));
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      img.removeEventListener('load', loaded);
      img.removeEventListener('error', failed);
      signal.removeEventListener('abort', aborted);
    };
    const loaded = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error('The original image did not load.')); };
    const aborted = () => { cleanup(); reject(new Error('Playback cancelled.')); };
    img.addEventListener('load', loaded, { once: true });
    img.addEventListener('error', failed, { once: true });
    signal.addEventListener('abort', aborted, { once: true });
    if (signal.aborted) aborted();
  });
}
function position(value, available, axis) {
  const keywords = { left: 0, top: 0, center: .5, right: 1, bottom: 1 };
  if (value in keywords) return available * keywords[value];
  if (String(value).endsWith('%')) return available * parseFloat(value) / 100;
  if (String(value).endsWith('px')) return parseFloat(value);
  return available * .5;
}

/** Three-second, success-triggered Canvas enhancement. Never submits a prayer. */
class FopushaDedication {
  constructor({ canvas, originalImage = null, id = 'a1', assetBase = 'assets/', getImageRect = null, assetSources = null, onFrame = null, anchorShift = null } = {}) {
    this.anchorShift = anchorShift;
    if (!canvas || typeof canvas.getContext !== 'function') throw new TypeError('A canvas element is required.');
    if (getImageRect !== null && typeof getImageRect !== 'function') throw new TypeError('getImageRect must be a function.');
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) throw new Error('Canvas 2D is unavailable.');
    this.originalImage = originalImage;
    this.id = this._validateId(id);
    this.getImageRect = getImageRect;
    this.onFrame = onFrame;
    this.assets = null;
    this._run = null;
    this._raf = 0;
    this._destroyed = false;
    this._hiddenImage = null;
    this._resize = this._resize.bind(this);
    const supplied = assetSources || FopushaDedication.embeddedAssets || {};
    const prefix = assetBase && !assetBase.endsWith('/') ? `${assetBase}/` : assetBase;
    this.assetURLs = Object.fromEntries(Object.entries(FILES).map(([key, file]) => [key, supplied[key] || `${prefix}${file}`]));
    this._resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(this._resize) : null;
    if (this._resizeObserver) {
      this._resizeObserver.observe(canvas.parentElement || canvas);
      this._resizeObserver.observe(canvas);
      if (originalImage) this._resizeObserver.observe(originalImage);
    }
    window.addEventListener('resize', this._resize);
    this._resize();
    this.ready = Promise.all(Object.entries(this.assetURLs).map(async ([key, url]) => [key, await loadImage(url)]))
      .then(entries => {
        this.assets = Object.fromEntries(entries);
        if (!this._destroyed && !this._run) this._drawIdle();
        return this;
      });
    // Keep the public promise rejectable while avoiding an unhandled rejection
    // before a host page has installed its own ready/error handler.
    this.ready.catch(() => {});
  }

  _validateId(id) {
    if (!engine.specs.some(spec => spec.id === id)) throw new RangeError(`Unknown dedication id: ${id}`);
    return id;
  }
  _assertActive() {
    if (this._destroyed) throw new Error('This dedication instance has been destroyed.');
  }
  get busy() { return Boolean(this._run); }

  _resize() {
    if (this._destroyed) return;
    const bounds = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width || this.canvas.clientWidth || 1));
    const height = Math.max(1, Math.round(bounds.height || this.canvas.clientHeight || 1));
    // One backing pixel per CSS pixel: engine coordinates remain logical pixels.
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
    if (this._run && this._run.started !== null) {
      try { this._render(Math.min(DURATION, (performance.now() - this._run.started) / 1000)); }
      catch (error) { this._finish(this._run, 'error', error); }
    } else if (this.assets && !this._run) this._drawIdle();
  }

  _imageRect() {
    if (this.getImageRect) {
      const rect = this.getImageRect(this.canvas, this.originalImage, this.id);
      if (!Array.isArray(rect) || rect.length !== 4 || !rect.every(Number.isFinite) || rect[2] <= 0 || rect[3] <= 0) {
        throw new TypeError('getImageRect must return a finite [x, y, width, height] in canvas CSS pixels.');
      }
      return rect;
    }
    const img = this.originalImage;
    if (img) {
      const imageBox = img.getBoundingClientRect();
      const canvasBox = this.canvas.getBoundingClientRect();
      const css = getComputedStyle(img);
      const px = name => parseFloat(css[name]) || 0;
      const sx = img.offsetWidth ? imageBox.width / img.offsetWidth : 1;
      const sy = img.offsetHeight ? imageBox.height / img.offsetHeight : 1;
      const left = (px('borderLeftWidth') + px('paddingLeft')) * sx;
      const top = (px('borderTopWidth') + px('paddingTop')) * sy;
      const boxW = Math.max(1, imageBox.width - left - (px('borderRightWidth') + px('paddingRight')) * sx);
      const boxH = Math.max(1, imageBox.height - top - (px('borderBottomWidth') + px('paddingBottom')) * sy);
      const iw = img.naturalWidth || 1672, ih = img.naturalHeight || 941;
      let width = boxW, height = boxH;
      if (css.objectFit === 'contain' || css.objectFit === 'scale-down') {
        let scale = Math.min(boxW / iw, boxH / ih);
        if (css.objectFit === 'scale-down') scale = Math.min(1, scale);
        width = iw * scale;
        height = ih * scale;
      }
      const pos = (css.objectPosition || '50% 50%').split(/\s+/);
      return [imageBox.left - canvasBox.left + left + position(pos[0], boxW - width),
        imageBox.top - canvasBox.top + top + position(pos[1] || '50%', boxH - height), width, height];
    }
    const scale = Math.min(this.canvas.width / 1672, this.canvas.height / 941);
    return [(this.canvas.width - 1672 * scale) / 2, (this.canvas.height - 941 * scale) / 2, 1672 * scale, 941 * scale];
  }
  _clear() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }
  _drawIdle() {
    this.onFrame?.(0, engine.cameraState(0));
    this._clear();
    if (!this.originalImage && this.assets && !this._destroyed) {
      this.ctx.save();
      try { engine.drawStatic(this.ctx, this.id, this.assets, { imageRect: this._imageRect(), transparentBackground: true, anchorShift: this.anchorShift }); }
      finally { this.ctx.restore(); }
    }
  }
  _render(t) {
    this.onFrame?.(0, engine.cameraState(0));
    this._clear();
    this.ctx.save();
    try { engine.draw(this.ctx, t, this.id, this.assets, { imageRect: this._imageRect(), transparentBackground: true, anchorShift: this.anchorShift });
      this.onFrame?.(t, engine.cameraState(t)); }
    finally { this.ctx.restore(); }
  }
  _hideOriginal() {
    if (!this.originalImage) return;
    const img = this.originalImage;
    this._hiddenImage = {
      img,
      visibility: img.style.getPropertyValue('visibility'),
      priority: img.style.getPropertyPriority('visibility')
    };
    img.style.setProperty('visibility', 'hidden', 'important');
  }
  _restoreOriginal() {
    if (!this._hiddenImage) return;
    const { img, visibility, priority } = this._hiddenImage;
    if (visibility) img.style.setProperty('visibility', visibility, priority);
    else img.style.removeProperty('visibility');
    this._hiddenImage = null;
  }

  playAfterSuccess() {
    if (this._destroyed) return Promise.reject(new Error('This dedication instance has been destroyed.'));
    if (this._run) return this._run.promise;
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    const run = { promise, resolve, reject, id: this.id, started: null, abort: new AbortController() };
    this._run = run;
    (async () => {
      try {
        await this.ready;
        if (this._run !== run) return;
        await waitForImage(this.originalImage, run.abort.signal);
        if (this._run !== run) return;
        this._resize();
        this._render(0);
        // Never leave a blank original-image slot while loading or on first-frame failure.
        this._hideOriginal();
        run.started = performance.now();
        const tick = now => {
          if (this._run !== run) return;
          try {
            const elapsed = (now - run.started) / 1000;
            this._render(Math.min(DURATION, Math.max(0, elapsed)));
            if (elapsed >= DURATION) this._finish(run, 'completed');
            else this._raf = requestAnimationFrame(tick);
          } catch (error) { this._finish(run, 'error', error); }
        };
        this._raf = requestAnimationFrame(tick);
      } catch (error) {
        if (this._run === run) this._finish(run, 'error', error);
      }
    })();
    return promise;
  }

  _finish(run, status, error) {
    if (!run || this._run !== run) return;
    cancelAnimationFrame(this._raf);
    this._raf = 0;
    this._run = null;
    run.abort.abort();
    this._restoreOriginal();
    try { this._drawIdle(); }
    catch (idleError) { error = error || idleError; }
    if (error) run.reject(error);
    else run.resolve({ status, id: run.id });
  }
  select(id, originalImage) {
    this._assertActive();
    const nextId = this._validateId(id);
    this.stop();
    if (originalImage !== undefined && originalImage !== this.originalImage) {
      if (this._resizeObserver && this.originalImage) this._resizeObserver.unobserve(this.originalImage);
      this.originalImage = originalImage;
      if (this._resizeObserver && originalImage) this._resizeObserver.observe(originalImage);
    }
    this.id = nextId;
    this._drawIdle();
    return this;
  }
  stop() {
    if (this._run) this._finish(this._run, 'cancelled');
    else { this._restoreOriginal(); this._drawIdle(); }
    return this;
  }
  destroy() {
    if (this._destroyed) return;
    this.stop();
    this._destroyed = true;
    if (this._resizeObserver) this._resizeObserver.disconnect();
    window.removeEventListener('resize', this._resize);
    this._clear();
    this.assets = null;
  }
}
FopushaDedication.specs = engine.specs;
FopushaDedication.assetFiles = FILES;
FopushaDedication.duration = DURATION;
module.exports = FopushaDedication;

},
"engine.cjs": function(module, exports, require) {
'use strict';
const {createCanvas}=require('@napi-rs/canvas');
const FX=require("effects.cjs"),R1=require("responses-a1-a4.cjs"),R2=require("responses-a5-a6-a8.cjs"),B=require("rig-motion.cjs"),specs=require("specs.cjs");
Object.assign(B.cfg,{poseTransform:[33.44,20,1605.12,903.36],mouth:[842.72,483.68]});
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10)},mix=(a,b,u)=>a+(b-a)*u;
function motionState(t){const amount=ease((t-.68)/.64)*(1-ease((t-1.45)/1.21));return{amount,scale:1+.72*amount,blur:1.3*amount}}
function effectState(t){return{env:ease((t-.015)/.28)*(1-ease((t-2.05)/.70)),ft:2.8+7.2*ease((t-.06)/.74),rt:Math.min(3.8,t*1.6),mist:t+1.65}}
function cameraState(t){const keys=[[1.28,0],[1.32,5],[1.365,-2.5],[1.415,.8],[1.48,0]];if(t<=1.28||t>=1.48)return{dx:0,dy:0,overscan:1};let k=0;while(t>keys[k+1][0])k++;const[a,x]=keys[k],[b,y]=keys[k+1],dx=mix(x,y,ease((t-a)/(b-a)));return{dx,dy:0,overscan:1+Math.abs(dx)/480*1.4}}
function gripBlend(t){return ease((t-.18)/.36)*(1-ease((t-2.05)/.56))}
function imageRect(id,W,H,opts={}){if(opts.imageRect)return opts.imageRect;const s=specs.find(s=>s.id===id),[l,top,r,b]=s.bounds,k=Math.min(W*.84/(r-l),H*.78/(b-top));return[W/2-(l+r)*.5*k,H*.90-b*k,1672*k,941*k]}
function pointFor(id,t,W,H,opts={}){const [x,y,w,h]=imageRect(id,W,H,opts),m=motionState(t),cx=W/2,cy=W>H?H*.28:H*.5,sh=opts.anchorShift||[0,0];return q0=>{const q=[q0[0]+sh[0],q0[1]+sh[1]];return[cx+(x+q[0]*w/1672-cx)*m.scale,cy+(y+q[1]*h/941-cy)*m.scale]}}
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

},
"@napi-rs/canvas": function(module, exports, require) {
module.exports = { createCanvas: function(width, height) { var canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; return canvas; } };
},
"effects.cjs": function(module, exports, require) {
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

},
"responses-a1-a4.cjs": function(module, exports, require) {
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

},
"responses-a5-a6-a8.cjs": function(module, exports, require) {
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

},
"rig-motion.cjs": function(module, exports, require) {
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

},
"specs.cjs": function(module, exports, require) {
const entries=[
 {id:'a1',name:'释迦牟尼佛',response:'举掌金波 · 慈光舒展',bounds:[372,38,1299,903]},
 {id:'a2',name:'阿弥陀佛',response:'掌中莲华 · 花光升起',bounds:[526,38,1145,903]},
 {id:'a3',name:'药师佛',response:'器中青金 · 琉璃光流',bounds:[550,38,1122,903]},
 {id:'a4',name:'弥勒佛',response:'念珠流光 · 福光散开',bounds:[298,38,1373,903]},
 {id:'a5',name:'文殊菩萨',response:'手印金线 · 智慧光展',bounds:[531,38,1141,903]},
 {id:'a6',name:'普贤菩萨',response:'持莲花雨 · 粉金飘落',bounds:[579,38,1092,903]},
 {id:'a7',name:'观音菩萨',response:'净水回向 · 身前倾洒',bounds:[569,38,1103,903]},
 {id:'a8',name:'地藏菩萨',response:'宝珠锡杖 · 金光接引',bounds:[559,38,1113,903]}
];
for(const x of entries){const [l,t,r,b]=x.bounds,scale=x.id==='a7'?1.03:Math.min(1.03,900/(r-l));x.transform={scale,ox:480-(l+r)*.5*scale,oy:1049-b*scale};if(x.id==='a7')x.transform={scale:1.03,ox:480-836*1.03,oy:119}}
module.exports=entries;

}
};
var cache = {};
function require(id) { if(cache[id]) return cache[id].exports; if(!modules[id]) throw new Error('Missing bundled module: ' + id); var module = cache[id] = { exports: {} }; modules[id](module, module.exports, require); return module.exports; }
global.FopushaDedication = require("browser-wrapper.js");
})(typeof globalThis !== 'undefined' ? globalThis : window);

export default globalThis.FopushaDedication;
