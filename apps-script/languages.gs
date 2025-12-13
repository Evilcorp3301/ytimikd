/***************************************
 * ЯЗЫКОВЫЕ ДЕФОЛТЫ И СПРАВОЧНИКИ
 ***************************************/

function getLanguageDefaults_(lang) {
  const idx = LANGS.indexOf(lang);
  if (idx === -1) return { channel: '', voice: '' };
  const sh = getReferenceSheet_();
  const row = REF_LANG_START_ROW + idx;
  const channel = String(sh.getRange(row, 2).getValue() || '').trim();
  const voice = String(sh.getRange(row, 3).getValue() || '').trim();
  return { channel, voice };
}

function updateLanguageDefaultsIfEmpty_(lang, channel, voice) {
  const idx = LANGS.indexOf(lang);
  if (idx === -1) return;
  const sh = getReferenceSheet_();
  const row = REF_LANG_START_ROW + idx;

  if (channel) {
    const cellCh = sh.getRange(row, 2);
    if (!String(cellCh.getValue() || '').trim()) {
      cellCh.setValue(channel);
    }
  }
  if (voice) {
    const cellVo = sh.getRange(row, 3);
    if (!String(cellVo.getValue() || '').trim()) {
      cellVo.setValue(voice);
    }
  }
}

function autofillDefaultsForLanguage_(lang) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const form = ss.getSheetByName(SHEETS.MAIN_FORM);
  if (!form) return;

  const defaults = getLanguageDefaults_(lang);
  if (!defaults) return;

  const cellChannel = form.getRange('B4');
  const cellVoice = form.getRange('B5');

  if (!String(cellChannel.getValue() || '').trim() && defaults.channel) {
    cellChannel.setValue(defaults.channel);
  }
  if (!String(cellVoice.getValue() || '').trim() && defaults.voice) {
    cellVoice.setValue(defaults.voice);
  }
}

function updateChannelUsage_(channel) {
  if (!channel) return;
  const sh = getReferenceSheet_();
  const range = sh.getRange('A5:A104');
  const values = range.getValues();
  const now = new Date();

  let targetRow = null;
  for (let i = 0; i < values.length; i++) {
    const v = String(values[i][0] || '').trim();
    if (v === channel) {
      targetRow = 5 + i;
      break;
    }
    if (!v && targetRow === null) {
      targetRow = 5 + i;
    }
  }
  if (!targetRow) return;

  const usesCell = sh.getRange(targetRow, 2);
  const lastCell = sh.getRange(targetRow, 3);

  let uses = parseInt(usesCell.getValue() || '0', 10);
  if (isNaN(uses)) uses = 0;
  usesCell.setValue(uses + 1);
  lastCell.setValue(now);
}

function updateVoiceUsage_(voice) {
  if (!voice) return;
  const sh = getReferenceSheet_();
  const range = sh.getRange('E5:E104');
  const values = range.getValues();
  const now = new Date();

  let targetRow = null;
  for (let i = 0; i < values.length; i++) {
    const v = String(values[i][0] || '').trim();
    if (v === voice) {
      targetRow = 5 + i;
      break;
    }
    if (!v && targetRow === null) {
      targetRow = 5 + i;
    }
  }
  if (!targetRow) return;

  const usesCell = sh.getRange(targetRow, 6);
  const lastCell = sh.getRange(targetRow, 7);

  let uses = parseInt(usesCell.getValue() || '0', 10);
  if (isNaN(uses)) uses = 0;
  usesCell.setValue(uses + 1);
  lastCell.setValue(now);
}

function getReferences() {
  const sh = getReferenceSheet_();
  const channelsRaw = sh.getRange('A5:C104').getValues();
  const channels = [];
  channelsRaw.forEach(row => {
    const name = String(row[0] || '').trim();
    const uses = row[1] || 0;
    const lastUsed = row[2] || '';
    if (name) {
      channels.push({ name, uses, lastUsed });
    }
  });

  const voicesRaw = sh.getRange('E5:G104').getValues();
  const voices = [];
  voicesRaw.forEach(row => {
    const name = String(row[0] || '').trim();
    const uses = row[1] || 0;
    const lastUsed = row[2] || '';
    if (name) {
      voices.push({ name, uses, lastUsed });
    }
  });

  const langDefaultsRaw = sh.getRange(REF_LANG_START_ROW, 1, LANGS.length, 3).getValues();
  const langDefaults = [];
  for (let i = 0; i < LANGS.length; i++) {
    const row = langDefaultsRaw[i];
    langDefaults.push({
      language: LANGS[i],
      defaultChannel: String(row[1] || '').trim(),
      defaultVoice: String(row[2] || '').trim()
    });
  }

  return {
    channels,
    voices,
    langDefaults
  };
}

function updateLanguageDefaultsFromWeb(langDefaults) {
  const sh = getReferenceSheet_();

  langDefaults.forEach(item => {
    const lang = String(item.language || '').trim().toUpperCase();
    const idx = LANGS.indexOf(lang);
    if (idx === -1) return;
    const row = REF_LANG_START_ROW + idx;
    sh.getRange(row, 2).setValue(item.defaultChannel || '');
    sh.getRange(row, 3).setValue(item.defaultVoice || '');
  });

  return { success: true };
}

/**
 * Служебная функция: вернуть лист "Языковые дефолты".
 */
function getReferenceSheet_() {
  return getSheet_(SHEETS.REF);
}
