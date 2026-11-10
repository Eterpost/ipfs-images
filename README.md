# ipfs-images

Сервер картинок на [ipfs-images-components](https://github.com/Eterpost/ipfs-images-components).
В Eterpost хранит картинки, вставленные в письма рассылок: веб-интерфейс
рассылок загружает картинку, а в письмо попадает её публичный адрес.

Требуется Node.js 22 и Redis; хранилище — каталог на диске или демон IPFS (Kubo).

## Запуск

```
npm ci --omit=dev
cp config.json.example config.json    # или IPFS_IMAGES_CONFIG=/путь/к/config.json
npm start
```

## API

| Запрос | Что делает |
|---|---|
| `POST /ul` | Загрузка: multipart, поле `file`. Ответ `{id, filename, mime}`; 400 — нет файла, 413 — больше `server.size`, 415 — тип не из `server.allowedTypes` |
| `GET /dl/:hash/:filename` | Файл (имя в адресе — для людей, ищется по хешу) |
| `GET /dl/thumb/:size/:hash` | Превью JPEG (`thumbnails.sizes`) |
| `DELETE /del/:hash` | Удалить файл и запись |

Отдача: `ETag` по хешу, `Cache-Control: public, max-age=<server.cache>, immutable`,
`X-Content-Type-Options: nosniff`, `Content-Security-Policy: sandbox`.

## Настройки

- `server.auth.type`: `partial` — загрузка и удаление только с адресов
  `server.auth.allowedIPs`, отдача открыта; `full` — всё только с них; иначе без
  проверки. Шаблоны — регулярные выражения, совпадающие со всем адресом
  (`127\\.0\\.0\\.1`, `10\\..*`).
- За обратным прокси адрес клиента — адрес прокси; `server.trustProxy`
  (значение Express `trust proxy`) берёт его из `X-Forwarded-For`. Если прокси
  сам ограничивает доступ к загрузке (как в Eterpost: загрузка только из
  веб-интерфейса), достаточно разрешить 127.0.0.1.
- `server.allowedTypes` — по умолчанию png, jpeg, gif, webp; тип картинки
  проверяется по содержимому. SVG не принимается: в нём бывают скрипты.
- `server.storage`: `filesystem` (`options.basePath`) или `ipfs` (`options.url` —
  RPC демона Kubo, например `http://127.0.0.1:5001`).
- `redis.prefix.attachments`, `redis.index.datetime` — ключи метаданных; на общем
  Redis задайте свой префикс.

## Разработка

```
npm ci
TEST_REDIS_URL=redis://127.0.0.1:16379/1 npm test
npm run lint
```
