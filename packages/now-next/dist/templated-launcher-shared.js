'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
if (!process.env.NODE_ENV) {
  const region = process.env.VERCEL_REGION || process.env.NOW_REGION;
  process.env.NODE_ENV = region === 'dev1' ? 'development' : 'production';
}
const http_1 = require('http');
const now__bridge_1 = require('./now__bridge');
// eslint-disable-next-line
let page = {};
// __LAUNCHER_PAGE_HANDLER__
// page.render is for React rendering
// page.default is for /api rendering
// page is for module.exports in /api
const server = new http_1.Server(page.render || page.default || page);
const bridge = new now__bridge_1.Bridge(server);
bridge.listen();
exports.launcher = bridge.launcher;
