# Настройка публичного предпросмотра (туннели)

Для доступа к приложению из любой точки мира через временную публичную ссылку используйте туннели.

## Вариант 1: Cloudflare Tunnel (рекомендуется)

**Преимущества:** Бесплатно, не требует регистрации, быстрый

### Установка

**Windows:**
- Скачайте с [официального сайта](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
- Или через `winget`: `winget install --id Cloudflare.cloudflared`
- Или через Chocolatey: `choco install cloudflared`

**macOS:**
```bash
brew install cloudflared
```

**Linux:**
```bash
# Debian/Ubuntu
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### Использование

1. Запустите сервер с туннелем:
   ```bash
   npm run dev:tunnel
   ```

2. В консоли появится временная ссылка вида:
   ```
   https://random-subdomain.trycloudflare.com
   ```

3. Откройте эту ссылку на любом устройстве (мобильном, планшете, другом компьютере)

## Вариант 2: ngrok

**Преимущества:** Популярный, стабильный, есть веб-интерфейс для мониторинга

### Установка

**Windows:**
- Скачайте с [ngrok.com/download](https://ngrok.com/download)
- Или через `winget`: `winget install ngrok`

**macOS:**
```bash
brew install ngrok/ngrok/ngrok
```

**Linux:**
```bash
# Скачайте с официального сайта или используйте пакетный менеджер
```

### Настройка (опционально)

1. Зарегистрируйтесь на [ngrok.com](https://ngrok.com) (бесплатный план доступен)
2. Получите токен авторизации
3. Выполните: `ngrok config add-authtoken YOUR_TOKEN`

Это позволит получить стабильные ссылки и больше лимитов.

### Использование

1. Запустите туннель отдельно:
   ```bash
   npm run tunnel:ngrok
   ```

2. В консоли появится ссылка вида:
   ```
   https://random-id.ngrok-free.app
   ```

3. Также доступен веб-интерфейс для мониторинга: `http://127.0.0.1:4040`

## Примечания

- **Временные ссылки:** Ссылки меняются при каждом перезапуске туннеля
- **Постоянные ссылки:** Для постоянных ссылок нужна регистрация в ngrok (бесплатный план доступен)
- **Без регистрации:** Cloudflare Tunnel не требует регистрации и работает сразу
- **Безопасность:** Туннели создают публичный доступ к вашему локальному серверу. Используйте только для разработки и тестирования

## Доступные команды

- `npm run dev:tunnel` - Запустить сервер + Cloudflare Tunnel одновременно
- `npm run tunnel:cloudflare` - Запустить только Cloudflare Tunnel
- `npm run tunnel:ngrok` - Запустить только ngrok туннель

