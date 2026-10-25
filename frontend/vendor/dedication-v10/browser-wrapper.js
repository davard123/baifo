'use strict';
const engine = require('./engine.cjs');
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
  constructor({ canvas, originalImage = null, id = 'a1', assetBase = 'assets/', getImageRect = null, assetSources = null, onFrame = null, anchorShift = null, guanyinVariant = null } = {}) {
    this.anchorShift = anchorShift;
    // Alternative silhouettes must not use the original Guanyin's raster wrist rig.
    this.guanyinVariant = guanyinVariant;
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
      try { engine.drawStatic(this.ctx, this.id, this.assets, { imageRect: this._imageRect(), transparentBackground: true, anchorShift: this.anchorShift, guanyinVariant: this.guanyinVariant }); }
      finally { this.ctx.restore(); }
    }
  }
  _render(t) {
    this.onFrame?.(0, engine.cameraState(0));
    this._clear();
    this.ctx.save();
    try { engine.draw(this.ctx, t, this.id, this.assets, { imageRect: this._imageRect(), transparentBackground: true, anchorShift: this.anchorShift, guanyinVariant: this.guanyinVariant });
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
