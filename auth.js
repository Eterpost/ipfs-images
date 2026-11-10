'use strict';

const components = require('ipfs-images-components');
const logging = components.logging.getWrapperForModule('auth');

/**
 * Разрешён ли адрес: шаблон (регулярное выражение) должен совпасть со всем
 * адресом, а не с его частью.
 * @param {string[]} ips - Шаблоны разрешённых адресов
 * @param {string} ip - Адрес клиента
 * @return {boolean}
 */
function isAllowed(ips, ip) {
  const allowed = ips.some((pattern) => new RegExp(`^(?:${pattern})$`).test(ip));
  logging.verbose(`${ip} is ${allowed ? '' : 'not '}allowed`);
  return allowed;
}

/**
 * Промежуточный обработчик Express: запрос с неразрешённого адреса — 403.
 * @param {string[]} allowedIPs - Шаблоны разрешённых адресов
 * @return {Function}
 */
function requireAllowedIP(allowedIPs) {
  return (request, response, next) => {
    if (isAllowed(allowedIPs, request.ip)) {
      next();
    } else {
      response.sendStatus(403);
    }
  };
}

module.exports = { isAllowed, requireAllowedIP };
