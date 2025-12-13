// ===== CONSTANTS =====

/**
 * Global constants for the translation workflow web app.
 * All future logic is organized by sections below.
 */
const SHEET_NAMES = {
  SETTINGS: 'Settings',
  QUEUE: 'Queue',
  PUBLISHED: 'Published',
  LOGS: 'Logs',
  STATS: 'Stats',
};

const SETTINGS_HEADERS = [
  'selectedLanguages',
  'theme',
  'updatedAt',
];

const QUEUE_HEADERS = [
  'id',
  'createdAt',
  'sourceUrl',
  'videoId',
  'languages',
  'status',
  'progress',
  'yt_title',
  'yt_channelTitle',
  'yt_duration',
  'yt_description',
  'yt_tags',
  'yt_fetchedAt',
  'lastError',
];

const PUBLISHED_HEADERS = [
  'id',
  'createdAt',
  'sourceQueueId',
  'sourceVideoId',
  'language',
  'publishedUrl',
  'publishedVideoId',
  'channelName',
  'voiceName',
  'yt_title',
  'yt_channelTitle',
  'yt_duration',
  'yt_description',
  'yt_tags',
  'yt_fetchedAt',
  'notes',
];

const LOG_HEADERS = [
  'timestamp',
  'level',
  'action',
  'entityType',
  'entityId',
  'message',
  'details',
];

const STATS_HEADERS = ['metric', 'value'];

const THEME_OPTIONS = {
  LIGHT: 'light',
  DARK: 'dark',
};

const QUEUE_STATUSES = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELED: 'CANCELED',
  ERROR: 'ERROR',
};

const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'de', label: 'German' },
  { code: 'fr', label: 'French' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'tr', label: 'Turkish' },
  { code: 'pl', label: 'Polish' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'ru', label: 'Russian' },
];

const SCRIPT_PROP_KEYS = {
  YOUTUBE_API_KEY: 'YOUTUBE_API_KEY',
  TELEGRAM_BOT_TOKEN: 'TELEGRAM_BOT_TOKEN',
  TELEGRAM_CHAT_ID: 'TELEGRAM_CHAT_ID',
};

const DATE_FORMAT = 'yyyy-MM-dd"T"HH:mm:ssXXX';
const TIMEZONE = Session.getScriptTimeZone();

// ===== SETUP =====

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('YT Translator')
    .addItem('Setup project', 'setupProject')
    .addToUi();
}

function setupProject() {
  const ss = SpreadsheetApp.getActive();
  ensureSheetWithHeaders_(ss, SHEET_NAMES.SETTINGS, SETTINGS_HEADERS);
  ensureSheetWithHeaders_(ss, SHEET_NAMES.QUEUE, QUEUE_HEADERS);
  ensureSheetWithHeaders_(ss, SHEET_NAMES.PUBLISHED, PUBLISHED_HEADERS);
  ensureSheetWithHeaders_(ss, SHEET_NAMES.LOGS, LOG_HEADERS);
  ensureSheetWithHeaders_(ss, SHEET_NAMES.STATS, STATS_HEADERS);
}

function ensureSheetWithHeaders_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const isHeaderMissing = firstRow.some((value, idx) => value !== headers[idx]);
  if (isHeaderMissing) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

// ===== DB =====

function getSpreadsheet_() {
  return SpreadsheetApp.getActive();
}

function getSheet_(name) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    setupProject();
    sheet = ss.getSheetByName(name);
  }
  return sheet;
}

function readTable_(sheetName, headers) {
  const sheet = getSheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1);
  return rows
    .filter(row => row.some(cell => cell !== ''))
    .map(row => mapRowToObject_(row, headers));
}

function appendRecord_(sheetName, headers, record) {
  const sheet = getSheet_(sheetName);
  const row = headers.map(header => record[header] === undefined ? '' : record[header]);
  sheet.appendRow(row);
  return sheet.getLastRow();
}

function updateRecordById_(sheetName, headers, id, updates) {
  const sheet = getSheet_(sheetName);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      headers.forEach((header, idx) => {
        if (updates.hasOwnProperty(header)) {
          data[i][idx] = updates[header];
        }
      });
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([data[i]]);
      return true;
    }
  }
  return false;
}

function mapRowToObject_(row, headers) {
  return headers.reduce((obj, header, idx) => {
    obj[header] = row[idx];
    return obj;
  }, {});
}

// ===== LOGS =====

function logInfo_(action, entityType, entityId, message, details) {
  logEvent_(LOG_LEVELS.INFO, action, entityType, entityId, message, details);
}

function logWarn_(action, entityType, entityId, message, details) {
  logEvent_(LOG_LEVELS.WARN, action, entityType, entityId, message, details);
}

function logError_(action, entityType, entityId, message, details) {
  logEvent_(LOG_LEVELS.ERROR, action, entityType, entityId, message, details);
}

function logEvent_(level, action, entityType, entityId, message, details) {
  try {
    const record = {
      timestamp: Utilities.formatDate(new Date(), TIMEZONE, DATE_FORMAT),
      level,
      action,
      entityType,
      entityId,
      message,
      details: details === undefined ? '' : stringifySafe_(details),
    };
    appendRecord_(SHEET_NAMES.LOGS, LOG_HEADERS, record);
  } catch (err) {
    Logger.log('Failed to record log entry: ' + err);
  }
}

function handleGetLogs_() {
  try {
    const rows = readTable_(SHEET_NAMES.LOGS, LOG_HEADERS);
    return successResponse_(rows.reverse());
  } catch (err) {
    return errorResponse_(err);
  }
}

// ===== SETTINGS =====

function getSettings_() {
  const sheet = getSheet_(SHEET_NAMES.SETTINGS);
  const values = sheet.getDataRange().getValues();
  let record;
  if (values.length < 2 || values[1].every(cell => cell === '')) {
    record = setSettings_({ selectedLanguages: '', theme: THEME_OPTIONS.LIGHT });
  } else {
    record = mapRowToObject_(values[1], SETTINGS_HEADERS);
  }

  return {
    selectedLanguages: parseSelectedLanguages_(record.selectedLanguages),
    theme: record.theme || THEME_OPTIONS.LIGHT,
    updatedAt: record.updatedAt || '',
  };
}

function setSettings_(settings) {
  const sheet = getSheet_(SHEET_NAMES.SETTINGS);
  const merged = {
    selectedLanguages: settings.selectedLanguages || '',
    theme: settings.theme || THEME_OPTIONS.LIGHT,
    updatedAt: Utilities.formatDate(new Date(), TIMEZONE, DATE_FORMAT),
  };

  if (sheet.getLastRow() < 1) {
    sheet.appendRow(SETTINGS_HEADERS);
  }

  if (sheet.getLastRow() < 2) {
    sheet.getRange(2, 1, 1, SETTINGS_HEADERS.length).setValues([[merged.selectedLanguages, merged.theme, merged.updatedAt]]);
  } else {
    sheet.getRange(2, 1, 1, SETTINGS_HEADERS.length).setValues([[merged.selectedLanguages, merged.theme, merged.updatedAt]]);
  }
  return merged;
}

function handleGetSettings_() {
  try {
    return successResponse_(getSettings_());
  } catch (err) {
    logError_('GET_SETTINGS', 'SETTINGS', 'SETTINGS', 'Failed to load settings', err);
    return errorResponse_(err);
  }
}

function handleSaveSettings_(payload) {
  try {
    const selectedCodes = Array.isArray(payload && payload.selectedLanguages)
      ? payload.selectedLanguages.filter(code => LANGUAGES.some(lang => lang.code === code))
      : [];
    const theme = payload && payload.theme === THEME_OPTIONS.DARK ? THEME_OPTIONS.DARK : THEME_OPTIONS.LIGHT;
    setSettings_({
      selectedLanguages: selectedCodes.join(','),
      theme,
    });
    logInfo_('UPDATE_SETTINGS', 'SETTINGS', 'SETTINGS', 'Settings updated', { selectedLanguages: selectedCodes, theme });
    return successResponse_(getSettings_());
  } catch (err) {
    logError_('UPDATE_SETTINGS', 'SETTINGS', 'SETTINGS', 'Failed to update settings', err);
    return errorResponse_(err);
  }
}

// ===== YOUTUBE =====

function getYouTubeApiKey_() {
  return PropertiesService.getScriptProperties().getProperty(SCRIPT_PROP_KEYS.YOUTUBE_API_KEY);
}

function extractVideoId_(url) {
  if (!url) return '';
  const patterns = [
    /youtu\.be\/([\w-]{11})/i,
    /v=([\w-]{11})/i,
    /shorts\/([\w-]{11})/i,
  ];
  for (const pattern of patterns) {
    const match = String(url).match(pattern);
    if (match && match[1]) return match[1];
  }
  return '';
}

function fetchYouTubeMetadata_(videoId) {
  const apiKey = getYouTubeApiKey_();
  if (!apiKey) {
    throw new Error('Missing YOUTUBE_API_KEY in Script Properties');
  }
  const endpoint = 'https://www.googleapis.com/youtube/v3/videos';
  const params = `?part=snippet,contentDetails&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`;
  const url = endpoint + params;
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const status = response.getResponseCode();
    if (status !== 200) {
      logError_('YOUTUBE_FETCH', 'YOUTUBE', videoId, 'YouTube API responded with non-200', { status, body: response.getContentText() });
      throw new Error('YouTube API error');
    }
    const payload = JSON.parse(response.getContentText());
    if (!payload.items || payload.items.length === 0) {
      throw new Error('Video not found');
    }
    const item = payload.items[0];
    const snippet = item.snippet || {};
    const details = item.contentDetails || {};
    const now = Utilities.formatDate(new Date(), TIMEZONE, DATE_FORMAT);
    return {
      videoId,
      yt_title: snippet.title || '',
      yt_channelTitle: snippet.channelTitle || '',
      yt_duration: parseIsoDuration_(details.duration || ''),
      yt_description: snippet.description || '',
      yt_tags: (snippet.tags || []).join(', '),
      yt_fetchedAt: now,
    };
  } catch (err) {
    logError_('YOUTUBE_FETCH', 'YOUTUBE', videoId, 'Failed to fetch metadata', err);
    notifyYouTubeError_(videoId, err);
    throw err;
  }
}

function getVideoInfoFromUrl_(sourceUrl) {
  const videoId = extractVideoId_(sourceUrl);
  if (!videoId) {
    throw new Error('Unable to extract video ID');
  }
  return fetchYouTubeMetadata_(videoId);
}

// ===== QUEUE =====

function handleAddToQueue_(payload) {
  try {
    const settings = getSettings_();
    if (!settings.selectedLanguages.length) {
      throw new Error('Select and confirm languages in Control Panel first');
    }
    const sourceUrl = payload && payload.sourceUrl ? String(payload.sourceUrl).trim() : '';
    if (!sourceUrl) {
      throw new Error('Source URL is required');
    }
    const videoId = extractVideoId_(sourceUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    let metadata;
    try {
      metadata = fetchYouTubeMetadata_(videoId);
    } catch (err) {
      const failedRecord = createQueueRecord_(sourceUrl, videoId, settings.selectedLanguages, QUEUE_STATUSES.ERROR, 0, err.message);
      appendRecord_(SHEET_NAMES.QUEUE, QUEUE_HEADERS, failedRecord);
      logError_('ADD_QUEUE', 'QUEUE', failedRecord.id, 'Failed to fetch YouTube metadata', err);
      return errorResponse_(err);
    }

    const record = {
      ...createQueueRecord_(sourceUrl, videoId, settings.selectedLanguages, QUEUE_STATUSES.NEW, 0, ''),
      ...metadata,
    };
    appendRecord_(SHEET_NAMES.QUEUE, QUEUE_HEADERS, record);
    logInfo_('ADD_QUEUE', 'QUEUE', record.id, 'Added to queue', { sourceUrl, languages: settings.selectedLanguages });
    return successResponse_(enrichQueueRow_(record, []));
  } catch (err) {
    logError_('ADD_QUEUE', 'QUEUE', 'N/A', 'Failed to add to queue', err);
    return errorResponse_(err);
  }
}

function handleGetQueue_() {
  try {
    const queueRows = readTable_(SHEET_NAMES.QUEUE, QUEUE_HEADERS);
    const publishedRows = readTable_(SHEET_NAMES.PUBLISHED, PUBLISHED_HEADERS);
    const enriched = queueRows.map(row => enrichQueueRow_(row, publishedRows));
    return successResponse_(enriched);
  } catch (err) {
    logError_('GET_QUEUE', 'QUEUE', 'N/A', 'Failed to load queue', err);
    return errorResponse_(err);
  }
}

function handleStartQueue_(payload) {
  const id = payload && payload.id;
  if (!id) return errorResponse_('Queue item id is required');
  try {
    const { row, index } = findQueueRow_(id);
    const updated = { ...row, status: QUEUE_STATUSES.IN_PROGRESS };
    updateRecordById_(SHEET_NAMES.QUEUE, QUEUE_HEADERS, id, { status: QUEUE_STATUSES.IN_PROGRESS });
    notifyTranslationStarted_(updated);
    logInfo_('START_QUEUE', 'QUEUE', id, 'Queue item started', {});
    return successResponse_(enrichQueueRow_(updated, readTable_(SHEET_NAMES.PUBLISHED, PUBLISHED_HEADERS)));
  } catch (err) {
    logError_('START_QUEUE', 'QUEUE', id, 'Failed to start queue item', err);
    return errorResponse_(err);
  }
}

function handleCancelQueue_(payload) {
  const id = payload && payload.id;
  if (!id) return errorResponse_('Queue item id is required');
  try {
    const { row } = findQueueRow_(id);
    updateRecordById_(SHEET_NAMES.QUEUE, QUEUE_HEADERS, id, { status: QUEUE_STATUSES.CANCELED });
    logWarn_('CANCEL_QUEUE', 'QUEUE', id, 'Queue item canceled', {});
    return successResponse_(enrichQueueRow_({ ...row, status: QUEUE_STATUSES.CANCELED }, readTable_(SHEET_NAMES.PUBLISHED, PUBLISHED_HEADERS)));
  } catch (err) {
    logError_('CANCEL_QUEUE', 'QUEUE', id, 'Failed to cancel queue item', err);
    return errorResponse_(err);
  }
}

function handleRefreshQueue_(payload) {
  const id = payload && payload.id;
  if (!id) return errorResponse_('Queue item id is required');
  try {
    const { row } = findQueueRow_(id);
    const metadata = fetchYouTubeMetadata_(row.videoId);
    const updates = { ...metadata, lastError: '', status: row.status === QUEUE_STATUSES.ERROR ? QUEUE_STATUSES.NEW : row.status };
    updateRecordById_(SHEET_NAMES.QUEUE, QUEUE_HEADERS, id, updates);
    logInfo_('REFRESH_QUEUE', 'QUEUE', id, 'Queue item metadata refreshed', {});
    const merged = { ...row, ...updates };
    return successResponse_(enrichQueueRow_(merged, readTable_(SHEET_NAMES.PUBLISHED, PUBLISHED_HEADERS)));
  } catch (err) {
    logError_('REFRESH_QUEUE', 'QUEUE', id, 'Failed to refresh queue item', err);
    updateRecordById_(SHEET_NAMES.QUEUE, QUEUE_HEADERS, id, { status: QUEUE_STATUSES.ERROR, lastError: err.message || String(err) });
    return errorResponse_(err);
  }
}

function recalcQueueProgress_(queueId) {
  const publishedRows = readTable_(SHEET_NAMES.PUBLISHED, PUBLISHED_HEADERS);
  const { row } = findQueueRow_(queueId);
  const enriched = enrichQueueRow_(row, publishedRows);
  const updates = { progress: enriched.progress };
  if (enriched.status === QUEUE_STATUSES.DONE) {
    updates.status = QUEUE_STATUSES.DONE;
  }
  updateRecordById_(SHEET_NAMES.QUEUE, QUEUE_HEADERS, queueId, updates);
  return { ...row, ...updates };
}

function createQueueRecord_(sourceUrl, videoId, languages, status, progress, lastError) {
  return {
    id: Utilities.getUuid(),
    createdAt: Utilities.formatDate(new Date(), TIMEZONE, DATE_FORMAT),
    sourceUrl,
    videoId,
    languages: Array.isArray(languages) ? languages.join(',') : String(languages || ''),
    status,
    progress,
    yt_title: '',
    yt_channelTitle: '',
    yt_duration: '',
    yt_description: '',
    yt_tags: '',
    yt_fetchedAt: '',
    lastError: lastError || '',
  };
}

function enrichQueueRow_(row, publishedRows) {
  const languages = parseSelectedLanguages_(row.languages);
  const completedSet = new Set(
    publishedRows
      .filter(pub => pub.sourceQueueId === row.id)
      .map(pub => pub.language)
  );
  const completedCount = completedSet.size;
  const total = languages.length;
  const progress = total ? Math.round((completedCount / total) * 100) : 0;
  let status = row.status;
  if (status !== QUEUE_STATUSES.CANCELED && status !== QUEUE_STATUSES.ERROR) {
    if (total > 0 && completedCount >= total) {
      status = QUEUE_STATUSES.DONE;
    }
  }
  return {
    ...row,
    languages,
    progress,
    status,
  };
}

function findQueueRow_(id) {
  const sheet = getSheet_(SHEET_NAMES.QUEUE);
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      return { row: mapRowToObject_(values[i], QUEUE_HEADERS), index: i + 1 };
    }
  }
  throw new Error('Queue item not found');
}

// ===== PUBLISHED =====

function handleAddPublished_(payload) {
  try {
    const queueId = payload && payload.queueId;
    const language = payload && payload.language;
    if (!queueId || !language) {
      throw new Error('Queue id and language are required');
    }
    const { row: queueRow } = findQueueRow_(queueId);
    const allowedLanguages = parseSelectedLanguages_(queueRow.languages);
    if (!allowedLanguages.includes(language)) {
      throw new Error('Language not in queue selection');
    }
    const publishedRows = readTable_(SHEET_NAMES.PUBLISHED, PUBLISHED_HEADERS);
    const alreadyExists = publishedRows.some(item => item.sourceQueueId === queueId && item.language === language);
    if (alreadyExists) {
      throw new Error('Language already published for this queue item');
    }

    const record = buildPublishedRecord_(payload, queueRow);
    appendRecord_(SHEET_NAMES.PUBLISHED, PUBLISHED_HEADERS, record);
    logInfo_('ADD_PUBLISHED', 'PUBLISHED', record.id, 'Published entry added', { queueId, language });
    recalcQueueProgress_(queueId);
    notifyPublishedAdded_(record);
    return successResponse_(record);
  } catch (err) {
    logError_('ADD_PUBLISHED', 'PUBLISHED', 'N/A', 'Failed to add published entry', err);
    return errorResponse_(err);
  }
}

function handleGetStats_() {
  try {
    const queueRows = readTable_(SHEET_NAMES.QUEUE, QUEUE_HEADERS);
    const publishedRows = readTable_(SHEET_NAMES.PUBLISHED, PUBLISHED_HEADERS);
    const stats = {
      queueCount: queueRows.length,
      publishedCount: publishedRows.length,
      doneCount: queueRows.filter(row => row.status === QUEUE_STATUSES.DONE).length,
    };
    writeStats_(stats);
    return successResponse_(stats);
  } catch (err) {
    logError_('GET_STATS', 'STATS', 'N/A', 'Failed to gather stats', err);
    return errorResponse_(err);
  }
}

function writeStats_(stats) {
  const sheet = getSheet_(SHEET_NAMES.STATS);
  if (sheet.getLastRow() < 1) {
    sheet.appendRow(STATS_HEADERS);
  }
  const rows = [
    ['queueCount', stats.queueCount],
    ['publishedCount', stats.publishedCount],
    ['doneCount', stats.doneCount],
  ];
  sheet.getRange(2, 1, rows.length, STATS_HEADERS.length).setValues(rows);
}

function handleGetPublished_() {
  try {
    const rows = readTable_(SHEET_NAMES.PUBLISHED, PUBLISHED_HEADERS);
    return successResponse_(rows);
  } catch (err) {
    logError_('GET_PUBLISHED', 'PUBLISHED', 'N/A', 'Failed to load published list', err);
    return errorResponse_(err);
  }
}

function buildPublishedRecord_(payload, queueRow) {
  return {
    id: Utilities.getUuid(),
    createdAt: Utilities.formatDate(new Date(), TIMEZONE, DATE_FORMAT),
    sourceQueueId: queueRow.id,
    sourceVideoId: queueRow.videoId,
    language: payload.language,
    publishedUrl: payload.publishedUrl || '',
    publishedVideoId: extractVideoId_(payload.publishedUrl || ''),
    channelName: payload.channelName || '',
    voiceName: payload.voiceName || '',
    yt_title: queueRow.yt_title || '',
    yt_channelTitle: queueRow.yt_channelTitle || '',
    yt_duration: queueRow.yt_duration || '',
    yt_description: queueRow.yt_description || '',
    yt_tags: queueRow.yt_tags || '',
    yt_fetchedAt: queueRow.yt_fetchedAt || '',
    notes: payload.notes || '',
  };
}

// ===== TELEGRAM =====

function notifyTranslationStarted_(queueItem) {
  try {
    sendTelegramMessage_(`Translation started for ${queueItem.yt_title || queueItem.sourceUrl || ''}`);
  } catch (err) {
    Logger.log('Telegram start notification failed: ' + err);
  }
}

function notifyPublishedAdded_(record) {
  try {
    sendTelegramMessage_(`Published ${record.language.toUpperCase()} version: ${record.publishedUrl || ''}`);
  } catch (err) {
    Logger.log('Telegram publish notification failed: ' + err);
  }
}

function sendTelegramMessage_(text) {
  const config = getTelegramConfig_();
  if (!config.botToken || !config.chatId) return false;
  const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
  const payload = {
    chat_id: config.chatId,
    text,
    disable_web_page_preview: true,
  };
  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      payload,
      muteHttpExceptions: true,
    });
    const status = response.getResponseCode();
    if (status !== 200) {
      Logger.log('Telegram API returned status ' + status + ': ' + response.getContentText());
      return false;
    }
    return true;
  } catch (err) {
    Logger.log('Telegram message failed: ' + err);
    return false;
  }
}

function getTelegramConfig_() {
  const props = PropertiesService.getScriptProperties();
  return {
    botToken: props.getProperty(SCRIPT_PROP_KEYS.TELEGRAM_BOT_TOKEN),
    chatId: props.getProperty(SCRIPT_PROP_KEYS.TELEGRAM_CHAT_ID),
  };
}

function notifyYouTubeError_(videoId, err) {
  try {
    sendTelegramMessage_(`YouTube metadata error for ${videoId}: ${err.message || err}`);
  } catch (error) {
    Logger.log('Telegram YouTube error notification failed: ' + error);
  }
}

// ===== WEBAPP / API =====

function doGet() {
  setupProject();
  const template = HtmlService.createTemplateFromFile('Index');
  template.languages = LANGUAGES;
  template.themeOptions = THEME_OPTIONS;
  return template.evaluate().setTitle('YouTube Translation Workflow');
}

function apiGetSettings() {
  return handleGetSettings_();
}

function apiSaveSettings(payload) {
  return handleSaveSettings_(payload);
}

function apiAddQueue(payload) {
  return handleAddToQueue_(payload);
}

function apiGetQueue() {
  return handleGetQueue_();
}

function apiStartQueue(payload) {
  return handleStartQueue_(payload);
}

function apiCancelQueue(payload) {
  return handleCancelQueue_(payload);
}

function apiRefreshQueue(payload) {
  return handleRefreshQueue_(payload);
}

function apiAddPublished(payload) {
  return handleAddPublished_(payload);
}

function apiGetPublished() {
  return handleGetPublished_();
}

function apiGetLogs() {
  return handleGetLogs_();
}

function apiGetStats() {
  return handleGetStats_();
}

// ===== UTILS =====

function stringifySafe_(value) {
  try {
    return typeof value === 'string' ? value : JSON.stringify(value);
  } catch (err) {
    return String(value);
  }
}

function parseSelectedLanguages_(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map(code => code.trim())
    .filter(code => LANGUAGES.some(lang => lang.code === code));
}

function parseIsoDuration_(isoDuration) {
  if (!isoDuration) return '';
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return isoDuration;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  return formatSeconds_(totalSeconds);
}

function formatSeconds_(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const parts = [
    hrs > 0 ? hrs : null,
    hrs > 0 ? String(mins).padStart(2, '0') : mins,
    String(secs).padStart(2, '0'),
  ].filter(part => part !== null);
  return parts.join(':');
}

function successResponse_(data) {
  return { ok: true, data };
}

function errorResponse_(err) {
  const message = err && err.message ? err.message : String(err);
  return { ok: false, error: message };
}
