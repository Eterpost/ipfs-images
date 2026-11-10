'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, describe, it } = require('node:test');

const TEST_REDIS_URL = process.env.TEST_REDIS_URL;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ipfs-images-server-'));
const config = path.join(dir, 'config.json');
fs.writeFileSync(config, JSON.stringify({
  logging: { transports: [] },
  redis: {
    index: { datetime: 'TEST_SERVER_IMAGES.DATETIME.INDEX' },
    options: {},
    prefix: { attachments: 'TEST_SERVER_IMAGES_' },
    url: TEST_REDIS_URL || 'redis://127.0.0.1:6379',
  },
  server: {
    auth: { allowedIPs: ['10\\..*'], type: 'partial' },
    cache: 60,
    headers: { origin: 'http://localhost' },
    port: 0,
    size: 1024 * 1024,
    storage: { options: { basePath: path.join(dir, 'files') }, type: 'filesystem' },
  },
  thumbnails: { cache: false, sizes: [64] },
}));
process.env.IPFS_IMAGES_CONFIG = config;

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d' +
  '49444154789c6360000002000154a24f5d0000000049454e44ae426082', 'hex');

describe('ipfs-images routes', { skip: TEST_REDIS_URL ? false : 'TEST_REDIS_URL is not set' }, () => {
  let components;
  let createApp;
  let servers = [];

  before(() => {
    components = require('ipfs-images-components');
    ({ createApp } = require('../routes'));
  });

  after(async () => {
    for (const server of servers) server.close();
    await components.redis.close();
  });

  async function listen(allowedIPs) {
    components.settings.server.auth.allowedIPs = allowedIPs;
    const server = createApp().listen(0);
    servers.push(server);
    await new Promise((resolve) => server.once('listening', resolve));
    return `http://127.0.0.1:${server.address().port}`;
  }

  async function upload(url) {
    const form = new FormData();
    form.append('file', new Blob([PNG], { type: 'image/png' }), 'Картинка.png');
    return fetch(`${url}/ul`, { body: form, method: 'POST' });
  }

  it('should close upload and delete but not download to other addresses', async () => {
    const open = await listen(['^127\\.0\\.0\\.1$', '^::ffff:127\\.0\\.0\\.1$', '^::1$']);
    const uploaded = await upload(open);
    assert.equal(uploaded.status, 200);
    const { id } = await uploaded.json();

    const closed = await listen(['^10\\.']);
    assert.equal((await upload(closed)).status, 403);
    assert.equal((await fetch(`${closed}/del/${id}`, { method: 'DELETE' })).status, 403);
    const downloaded = await fetch(`${closed}/dl/${id}/${encodeURIComponent('Картинка.png')}`);
    assert.equal(downloaded.status, 200);
    assert.equal(downloaded.headers.get('content-type'), 'image/png');
    assert.equal(downloaded.headers.get('x-content-type-options'), 'nosniff');
    assert.equal((await fetch(`${closed}/dl/thumb/64/${id}`)).status, 200);

    assert.equal((await fetch(`${open}/del/${id}`, { method: 'DELETE' })).status, 200);
    assert.equal((await fetch(`${closed}/dl/${id}/a.png`)).status, 404);
  });

  it('should match allowed addresses as whole addresses', async () => {
    const url = await listen(['^0\\.0\\.0\\.1$', '127\\.0\\.0']);
    assert.equal((await upload(url)).status, 403);
  });

  it('should not have the broken integrity route', async () => {
    const url = await listen([]);
    assert.equal((await fetch(`${url}/api/integrity`)).status, 404);
  });
});
