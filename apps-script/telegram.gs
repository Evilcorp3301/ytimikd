/***************************************
 * УВЕДОМЛЕНИЯ: TELEGRAM
 ***************************************/

const TELEGRAM_CONFIG = {
  TOKEN_KEY: 'TELEGRAM_BOT_TOKEN',
  CHAT_ID_KEY: 'TELEGRAM_CHAT_ID',
  CACHE_TTL_SECONDS: 60
};

function getTelegramConfig_() {
  const props = PropertiesService.getScriptProperties();
  const token = String(props.getProperty(TELEGRAM_CONFIG.TOKEN_KEY) || '').trim();
  const chatId = String(props.getProperty(TELEGRAM_CONFIG.CHAT_ID_KEY) || '').trim();

  if (!token || !chatId) return null;
  return { token, chatId };
}

function shouldThrottleNotification_(message) {
  const cache = CacheService.getScriptCache();
  const hash = Utilities.base64EncodeWebSafe(message).slice(0, 64);
  const key = 'tg_' + hash;

  if (cache.get(key)) return true;

  cache.put(key, '1', TELEGRAM_CONFIG.CACHE_TTL_SECONDS);
  return false;
}

function sendTelegramMessage_(text) {
  const cfg = getTelegramConfig_();
  const message = String(text || '').trim();
  if (!cfg || !message) return;

  if (shouldThrottleNotification_(message)) return;

  const url = 'https://api.telegram.org/bot' + cfg.token + '/sendMessage';
  const payload = {
    chat_id: cfg.chatId,
    text: message,
    disable_web_page_preview: true
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    UrlFetchApp.fetch(url, options);
  } catch (err) {
    // Не блокируем основной сценарий из-за ошибок Telegram
  }
}

function notifyAddToQueue_(link, langs, comment, source) {
  const languagesText = (langs && langs.length > 0) ? langs.join(', ') : 'ALL';
  const parts = [
    '🆕 Добавлена задача в очередь',
    'Источник: ' + source,
    'Ссылка: ' + link,
    'Языки: ' + languagesText
  ];

  if (comment) parts.push('Комментарий: ' + comment);

  sendTelegramMessage_(parts.join('\n'));
}

function notifyAddRecord_(link, language, channel, voice, source) {
  const parts = [
    '✅ Добавлен перевод',
    'Источник: ' + source,
    'Ссылка: ' + link,
    'Язык: ' + language
  ];

  if (channel) parts.push('Канал: ' + channel);
  if (voice) parts.push('Голос: ' + voice);

  sendTelegramMessage_(parts.join('\n'));
}

