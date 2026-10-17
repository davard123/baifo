#!/usr/bin/env node
'use strict';
// Dependency-free build. Run: node build-browser.cjs [--offline]
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const modules = new Map();
const shim = `module.exports = { createCanvas: function(width, height) { var canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; return canvas; } };`;
function visit(filename) {
  const absolute = path.resolve(root, filename);
  if (!absolute.startsWith(root + path.sep)) throw new Error('Cannot bundle a module outside this folder.');
  const id = path.relative(root, absolute).split(path.sep).join('/');
  if (modules.has(id)) return id;
  let source = fs.readFileSync(absolute, 'utf8');
  if (absolute.endsWith('.json')) source = `module.exports = ${source.trim()};`;
  modules.set(id, '');
  source = source.replace(/\brequire\((['"])([^'"]+)\1\)/g, (match, quote, request) => {
    if (request === '@napi-rs/canvas') { modules.set('@napi-rs/canvas', shim); return `require('@napi-rs/canvas')`; }
    if (!request.startsWith('.')) throw new Error(`Unsupported browser dependency ${request} in ${id}`);
    let dependency = path.resolve(path.dirname(absolute), request);
    if (!fs.existsSync(dependency)) dependency += '.cjs';
    return `require(${JSON.stringify(visit(path.relative(root, dependency)))})`;
  });
  modules.set(id, source);
  return id;
}
const entry = visit('browser-wrapper.js');
const bundle = `/* Fopusha Dedication V10. Local original assets; no network requests beyond asset URLs. */\n(function(global) {\n'use strict';\nvar modules = {\n${Array.from(modules, ([id, source]) => `${JSON.stringify(id)}: function(module, exports, require) {\n${source}\n}`).join(',\n')}\n};\nvar cache = {};\nfunction require(id) { if(cache[id]) return cache[id].exports; if(!modules[id]) throw new Error('Missing bundled module: ' + id); var module = cache[id] = { exports: {} }; modules[id](module, module.exports, require); return module.exports; }\nglobal.FopushaDedication = require(${JSON.stringify(entry)});\n})(typeof globalThis !== 'undefined' ? globalThis : window);\n`;
fs.writeFileSync(path.join(root, '../../src/vendor/dedication-v10/runtime.js'), bundle + '\nexport default globalThis.FopushaDedication;\n');
console.log(`Built fopusha-dedication.js (${Buffer.byteLength(bundle).toLocaleString()} bytes, ${modules.size} modules).`);
