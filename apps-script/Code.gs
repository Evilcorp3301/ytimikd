const SHEETS = {
  SETTINGS: 'SETTINGS',
  QUEUE: 'QUEUE',
  LOGS: 'LOGS',
};

const STATUS_VALUES = ['NEW', 'FETCHED', 'READY', 'IN_PROGRESS', 'DONE', 'ERROR'];
const LANG_OPTIONS = ['EN', 'ES', 'FR', 'DE', 'IT', 'PT', 'PL', 'UK', 'RU', 'TR'];
const CACHE_KEY_SETTINGS = 'settings_cache_v1';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Translation Manager');
}

function setupProject() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSettingsSheet_(ss);
  setupQueueSheet_(ss);
  setupLogsSheet_(ss);
}

function getBootstrap() {
  const settings = getSettings();
  const queueRes = listQueue({ limit: 20, offset: 0, sort: 'createdAt:desc' });
  const recentQueue = queueRes.items || [];
  const queueSummaryCounts = queueRes.summary || summarizeQueue_();
  const recentLogs = listLogs({ limit: 20 });
  return { settings, queueSummaryCounts, recentQueue, recentLogs };
}

function getSettings() {
  const cache = CacheService.getUserCache();
  const cached = cache.get(CACHE_KEY_SETTINGS);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      cache.remove(CACHE_KEY_SETTINGS);
    }
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.SETTINGS);
  const defaults = { selectedLanguages: [], theme: 'light' };
  if (!sh) return defaults;
  const rows = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 0), 3).getValues();
  const map = {};
  rows.forEach(r => {
    const key = String(r[0] || '').trim();
    if (!key) return;
    map[key] = r[1];
  });
  const selectedLanguages = (() => {
    try {
      const arr = JSON.parse(map.selectedLanguages || '[]');
      if (Array.isArray(arr)) {
        return arr.filter(v => LANG_OPTIONS.includes(String(v)));
      }
    } catch (e) {}
    return [];
  })();
  const theme = map.theme === 'dark' ? 'dark' : 'light';
  const result = { selectedLanguages, theme };
  cache.put(CACHE_KEY_SETTINGS, JSON.stringify(result), 300);
  return result;
}

function saveSettings(payload) {
  const selectedLanguages = Array.isArray(payload.selectedLanguages) ? payload.selectedLanguages.map(String) : [];
  const theme = payload.theme === 'dark' ? 'dark' : 'light';
  if (selectedLanguages.length === 0) {
    throw new Error('Select at least one language');
  }
  if (selectedLanguages.length > 10) {
    throw new Error('Select up to 10 languages');
  }
  selectedLanguages.forEach(lang => {
    if (!LANG_OPTIONS.includes(lang)) {
      throw new Error('Unsupported language: ' + lang);
    }
  });
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(SHEETS.SETTINGS);
    if (!sh) {
      setupSettingsSheet_(ss);
      sh = ss.getSheetByName(SHEETS.SETTINGS);
    }
    const map = { selectedLanguages: JSON.stringify(selectedLanguages), theme };
    const keys = Object.keys(map);
    keys.forEach((key, idx) => {
      const row = 2 + idx;
      sh.getRange(row, 1).setValue(key);
      sh.getRange(row, 2).setValue(map[key]);
      sh.getRange(row, 3).setValue(new Date());
    });
    CacheService.getUserCache().remove(CACHE_KEY_SETTINGS);
  } finally {
    lock.releaseLock();
  }
  log_('INFO', 'save_settings', 'Settings updated');
  return getSettings();
}

function listQueue(options) {
  const status = options && options.status ? String(options.status) : '';
  const search = options && options.search ? String(options.search).toLowerCase() : '';
  const limit = Math.min(Math.max(Number(options && options.limit) || 50, 1), 200);
  const offset = Math.max(Number(options && options.offset) || 0, 0);
  const sort = options && options.sort ? String(options.sort) : 'createdAt:desc';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.QUEUE);
  if (!sh) return { items: [], summary: summarizeQueue_() };
  const values = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 0), 13).getValues();
  let items = values.map(r => rowToQueue_(r)).filter(Boolean);
  if (status && STATUS_VALUES.includes(status)) {
    items = items.filter(i => i.status === status);
  }
  if (search) {
    items = items.filter(i =>
      (i.title || '').toLowerCase().includes(search) ||
      (i.channelTitle || '').toLowerCase().includes(search) ||
      (i.sourceUrl || '').toLowerCase().includes(search)
    );
  }
  items.sort((a, b) => {
    if (sort === 'createdAt:asc') return (a.createdAt || '').localeCompare(b.createdAt || '');
    if (sort === 'priority:desc') return (Number(b.priority) || 0) - (Number(a.priority) || 0);
    if (sort === 'priority:asc') return (Number(a.priority) || 0) - (Number(b.priority) || 0);
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
  return { items: items.slice(offset, offset + limit), summary: summarizeQueue_(values) };
}

function addQueueItem(payload) {
  const settings = getSettings();
  if (!settings.selectedLanguages || settings.selectedLanguages.length === 0) {
    throw new Error('Select target languages first in Settings');
  }
  const sourceUrl = normalizeYouTubeUrl_(payload && payload.sourceUrl);
  if (!sourceUrl) {
    throw new Error('Invalid or empty YouTube URL');
  }
  const videoId = extractVideoId_(sourceUrl);
  if (!videoId) {
    throw new Error('Cannot extract video ID from URL');
  }
  const now = new Date();
  const id = Utilities.getUuid();
  const item = {
    id,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    sourceUrl,
    videoId,
    title: '',
    channelTitle: '',
    publishedAt: '',
    requestedLangs: settings.selectedLanguages,
    status: 'NEW',
    priority: 0,
    lastError: '',
    notes: ''
  };
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const meta = fetchYouTubeMetadata_(videoId);
    if (meta && meta.title) {
      item.title = meta.title || '';
      item.channelTitle = meta.channelTitle || '';
      item.publishedAt = meta.publishedAt || '';
      item.status = 'FETCHED';
    } else if (meta && meta.error) {
      item.lastError = meta.error;
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(SHEETS.QUEUE);
    if (!sh) {
      setupQueueSheet_(ss);
      sh = ss.getSheetByName(SHEETS.QUEUE);
    }
    const row = [
      item.id,
      item.createdAt,
      item.updatedAt,
      item.sourceUrl,
      item.videoId,
      item.title,
      item.channelTitle,
      item.publishedAt,
      JSON.stringify(item.requestedLangs),
      item.status,
      item.priority,
      item.lastError,
      item.notes
    ];
    sh.appendRow(row);
  } finally {
    lock.releaseLock();
  }
  log_('INFO', 'add_queue_item', 'Added new item', id);
  notifyTelegram_('New item added', item);
  return item;
}

function updateQueueItem(payload) {
  if (!payload || !payload.id || !payload.patch) {
    throw new Error('Invalid payload');
  }
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  let updated;
  let oldStatus;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEETS.QUEUE);
    if (!sh) throw new Error('Queue sheet missing');
    const rows = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 0), 13).getValues();
    let targetRow = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === payload.id) {
        targetRow = i + 2;
        updated = rowToQueue_(rows[i]);
        break;
      }
    }
    if (!updated) throw new Error('Item not found');
    oldStatus = updated.status;
    const patch = payload.patch;
    if (patch.status) {
      if (!STATUS_VALUES.includes(patch.status)) throw new Error('Invalid status');
      updated.status = patch.status;
    }
    if (patch.priority !== undefined) {
      const pr = Number(patch.priority);
      if (isNaN(pr)) throw new Error('Invalid priority');
      updated.priority = pr;
    }
    if (patch.notes !== undefined) {
      updated.notes = String(patch.notes || '');
    }
    if (patch.lastError !== undefined) {
      updated.lastError = String(patch.lastError || '');
    }
    updated.updatedAt = new Date().toISOString();
    sh.getRange(targetRow, 2, 1, 12).setValues([[
      updated.createdAt,
      updated.updatedAt,
      updated.sourceUrl,
      updated.videoId,
      updated.title,
      updated.channelTitle,
      updated.publishedAt,
      JSON.stringify(updated.requestedLangs || []),
      updated.status,
      updated.priority,
      updated.lastError,
      updated.notes
    ]]);
  } finally {
    lock.releaseLock();
  }
  log_('INFO', 'update_queue_item', 'Updated item', payload.id);
  if ((updated.status === 'DONE' || updated.status === 'ERROR') && updated.status !== oldStatus) {
    notifyTelegram_('Status changed: ' + updated.status, updated);
  }
  return updated;
}

function refetchMetadata(payload) {
  if (!payload || !payload.id) throw new Error('Invalid payload');
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  let updated;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEETS.QUEUE);
    if (!sh) throw new Error('Queue sheet missing');
    const rows = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 0), 13).getValues();
    let targetRow = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === payload.id) {
        targetRow = i + 2;
        updated = rowToQueue_(rows[i]);
        break;
      }
    }
    if (!updated) throw new Error('Item not found');
    const meta = fetchYouTubeMetadata_(updated.videoId);
    if (meta && meta.title) {
      updated.title = meta.title || updated.title;
      updated.channelTitle = meta.channelTitle || updated.channelTitle;
      updated.publishedAt = meta.publishedAt || updated.publishedAt;
      updated.status = 'FETCHED';
      updated.lastError = '';
    } else if (meta && meta.error) {
      updated.lastError = meta.error;
    }
    updated.updatedAt = new Date().toISOString();
    sh.getRange(targetRow, 2, 1, 12).setValues([[
      updated.createdAt,
      updated.updatedAt,
      updated.sourceUrl,
      updated.videoId,
      updated.title,
      updated.channelTitle,
      updated.publishedAt,
      JSON.stringify(updated.requestedLangs || []),
      updated.status,
      updated.priority,
      updated.lastError,
      updated.notes
    ]]);
  } finally {
    lock.releaseLock();
  }
  log_('INFO', 'refetch_metadata', 'Metadata refreshed', payload.id);
  return updated;
}

function listLogs(options) {
  const level = options && options.level ? String(options.level) : '';
  const limit = Math.min(Math.max(Number(options && options.limit) || 200, 1), 500);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.LOGS);
  if (!sh) return [];
  const values = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 0), 5).getValues();
  let items = values.map(r => ({
    ts: r[0] ? new Date(r[0]).toISOString() : '',
    level: r[1] || '',
    action: r[2] || '',
    details: r[3] || '',
    queueId: r[4] || ''
  }));
  if (level && ['INFO', 'WARN', 'ERROR'].includes(level)) {
    items = items.filter(i => i.level === level);
  }
  items.sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));
  return items.slice(0, limit);
}

function log_(level, action, details, queueId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEETS.LOGS);
  if (!sh) {
    setupLogsSheet_(ss);
    sh = ss.getSheetByName(SHEETS.LOGS);
  }
  const row = [new Date(), level, action, details || '', queueId || ''];
  sh.appendRow(row);
}

// Helpers

function setupSettingsSheet_(ss) {
  let sh = ss.getSheetByName(SHEETS.SETTINGS);
  if (!sh) {
    sh = ss.insertSheet(SHEETS.SETTINGS);
  }
  const headers = ['key', 'value', 'updatedAt'];
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  sh.setColumnWidths(1, headers.length, 180);
}

function setupQueueSheet_(ss) {
  let sh = ss.getSheetByName(SHEETS.QUEUE);
  if (!sh) {
    sh = ss.insertSheet(SHEETS.QUEUE);
  }
  const headers = ['id', 'createdAt', 'updatedAt', 'sourceUrl', 'videoId', 'title', 'channelTitle', 'publishedAt', 'requestedLangs', 'status', 'priority', 'lastError', 'notes'];
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_VALUES, true)
    .build();
  sh.getRange(2, 10, sh.getMaxRows() - 1 || 1, 1).setDataValidation(rule);
  sh.setColumnWidths(1, headers.length, 160);
}

function setupLogsSheet_(ss) {
  let sh = ss.getSheetByName(SHEETS.LOGS);
  if (!sh) {
    sh = ss.insertSheet(SHEETS.LOGS);
  }
  const headers = ['ts', 'level', 'action', 'details', 'queueId'];
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  sh.setColumnWidths(1, headers.length, 180);
}

function rowToQueue_(r) {
  if (!r || !r[0]) return null;
  return {
    id: r[0],
    createdAt: r[1] || '',
    updatedAt: r[2] || '',
    sourceUrl: r[3] || '',
    videoId: r[4] || '',
    title: r[5] || '',
    channelTitle: r[6] || '',
    publishedAt: r[7] || '',
    requestedLangs: parseJsonArray_(r[8]),
    status: r[9] || 'NEW',
    priority: Number(r[10]) || 0,
    lastError: r[11] || '',
    notes: r[12] || ''
  };
}

function parseJsonArray_(value) {
  try {
    const arr = JSON.parse(value || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function normalizeYouTubeUrl_(url) {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  let normalized = trimmed;
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = 'https://' + normalized;
  }
  const videoId = extractVideoId_(normalized);
  return videoId ? 'https://youtu.be/' + videoId : normalized;
}

function extractVideoId_(url) {
  if (!url) return '';
  const patterns = [
    /(?:v=)([a-zA-Z0-9_-]{11})/, // watch?v=
    /youtu\.be\/([a-zA-Z0-9_-]{11})/, // youtu.be
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/, // shorts
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
  ];
  for (let i = 0; i < patterns.length; i++) {
    const m = url.match(patterns[i]);
    if (m && m[1]) return m[1];
  }
  return '';
}

function fetchYouTubeMetadata_(videoId) {
  if (!videoId) return null;
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('YOUTUBE_API_KEY');
  if (!apiKey) {
    log_('WARN', 'youtube_fetch_skip', 'YOUTUBE_API_KEY missing');
    return { error: 'YOUTUBE_API_KEY not configured' };
  }
  const url = 'https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails&id=' + encodeURIComponent(videoId) + '&key=' + encodeURIComponent(apiKey);
  try {
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return { error: 'YouTube API error ' + res.getResponseCode() };
    const data = JSON.parse(res.getContentText());
    if (!data.items || !data.items.length) return { error: 'Video not found' };
    const snippet = data.items[0].snippet || {};
    return {
      title: snippet.title || '',
      channelTitle: snippet.channelTitle || '',
      publishedAt: snippet.publishedAt || ''
    };
  } catch (e) {
    log_('WARN', 'youtube_fetch_fail', e.message || e.toString());
    return { error: 'Fetch failed' };
  }
}

function notifyTelegram_(title, item) {
  try {
    const props = PropertiesService.getScriptProperties();
    const token = props.getProperty('TELEGRAM_BOT_TOKEN');
    const chatId = props.getProperty('TELEGRAM_CHAT_ID');
    if (!token || !chatId) {
      log_('WARN', 'telegram_missing', 'Telegram secrets missing');
      return;
    }
    const message = [
      title,
      item && item.title ? '\uD83C\uDFA5 ' + item.title : '',
      item && item.sourceUrl ? item.sourceUrl : '',
      item && item.status ? 'Status: ' + item.status : ''
    ].filter(Boolean).join('\n');
    const url = 'https://api.telegram.org/bot' + token + '/sendMessage';
    const payload = {
      method: 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      payload: JSON.stringify({ chat_id: chatId, text: message })
    };
    UrlFetchApp.fetch(url, payload);
  } catch (e) {
    log_('WARN', 'telegram_fail', e.message || e.toString());
  }
}

function summarizeQueue_(existingValues) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.QUEUE);
  const result = {};
  STATUS_VALUES.forEach(s => result[s] = 0);
  if (!sh) return result;
  const values = existingValues ? existingValues.map(r => [r[9]]) : sh.getRange(2, 10, Math.max(sh.getLastRow() - 1, 0), 1).getValues();
  values.forEach(v => {
    const status = v[0];
    if (STATUS_VALUES.includes(status)) {
      result[status] = (result[status] || 0) + 1;
    }
  });
  return result;
}
