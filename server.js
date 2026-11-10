'use strict';

const components = require('ipfs-images-components');
const logging = components.logging.getWrapperForModule('server');
const settings = components.settings;
const { createApp } = require('./routes');

const app = createApp();
const { host, port } = settings.server;
const server = app.listen(port, host, () => {
  logging.info(`Listening on ${host || '*'}:${port}`);
});

async function stop() {
  server.close();
  await components.redis.close();
}

process.once('SIGTERM', stop);
process.once('SIGINT', stop);
