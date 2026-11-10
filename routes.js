'use strict';

const cors = require('cors');
const express = require('express');

const components = require('ipfs-images-components');
const logging = components.logging.getWrapperForModule('routes');
const settings = components.settings;

const { requireAllowedIP } = require('./auth');

/**
 * @return {Object} Хранилище из settings.server.storage
 */
function createStorage() {
  const storage = settings.server.storage;
  if (storage.type === 'ipfs') {
    return new components.storageBackends.IpfsStorage(storage.options.url);
  }
  return new components.storageBackends.FilesystemStorage(storage.options.basePath);
}

/**
 * Приложение сервера картинок.
 *
 * - POST /ul — загрузка (multipart, поле file);
 * - GET /dl/:hash/:filename — файл, GET /dl/thumb/:size/:hash — превью;
 * - DELETE /del/:hash — удаление.
 *
 * server.auth.type: full — все маршруты только с адресов server.auth.allowedIPs,
 * partial — загрузка и удаление.
 * @return {import('express').Express}
 */
function createApp() {
  const app = express();
  if (settings.server.trustProxy !== undefined) {
    app.set('trust proxy', settings.server.trustProxy);
  }
  const corsOptions = {
    credentials: true,
    methods: 'GET, POST, DELETE',
    optionsSuccessStatus: 200,
    origin: settings.server.headers && settings.server.headers.origin,
  };
  app.options('/{*path}', cors({ ...corsOptions, allowedHeaders: 'X-Requested-With' }));

  const allowedIPs = settings.server.auth.allowedIPs || [];
  const auth = requireAllowedIP(allowedIPs);
  const authType = settings.server.auth.type;
  const protect = (handler) => authType === 'full' || authType === 'partial' ?
    [auth, handler] : [handler];
  const read = (handler) => authType === 'full' ? [auth, handler] : [handler];

  const storage = createStorage();
  const thumbnails = new components.thumbnail(storage);
  const metadata = new components.metadata();
  const cacheOptions = { CACHE_DURATION: settings.server.cache };

  app.use((request, response, next) => {
    logging.verbose(`[request] ${request.method} ${request.originalUrl}`);
    next();
  });

  app.delete('/del/:hash', cors(corsOptions),
    ...protect(components.handlers.delAttachment(storage, metadata)));
  app.get('/dl/thumb/:size/:hash', cors(corsOptions),
    ...read(components.handlers.downloadThumb(thumbnails, metadata, cacheOptions)));
  app.get('/dl/:hash/:filename', cors(corsOptions),
    ...read(components.handlers.download(storage, metadata, cacheOptions)));
  app.post('/ul', cors(corsOptions),
    ...protect(components.handlers.upload(storage, metadata, {
      ALLOWED_TYPES: settings.server.allowedTypes,
      MAX_FILE_SIZE: settings.server.size,
    })));
  return app;
}

module.exports = { createApp };
