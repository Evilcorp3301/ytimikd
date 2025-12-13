/***************************************
 * БАЗА ДАННЫХ
 ***************************************/

function addRecord() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const form = ss.getSheetByName(SHEETS.MAIN_FORM);
  const db = ss.getSheetByName(SHEETS.DB);
  const queue = ss.getSheetByName(SHEETS.QUEUE);

  if (!form || !db || !queue) {
    SpreadsheetApp.getUi().alert('Листы "Основная_Форма", "База данных" или "Очередь" не найдены. Сначала запустите setupProject().');
    return;
  }

  const link = String(form.getRange('B2').getValue() || '').trim();
  const language = String(form.getRange('B3').getValue() || '').trim().toUpperCase();
  const channel = String(form.getRange('B4').getValue() || '').trim();
  const voice = String(form.getRange('B5').getValue() || '').trim();

  if (!link || !language) {
    SpreadsheetApp.getUi().alert('Введите ссылку (B2) и выберите язык (B3) на листе "Основная_Форма".');
    return;
  }
  if (!LANGS.includes(language)) {
    SpreadsheetApp.getUi().alert('Выбранный язык не входит в список: ' + LANGS.join(', '));
    return;
  }

  const hash = (link + '-' + language).toLowerCase();

  const lastRowDb = db.getLastRow();
  if (lastRowDb >= 2) {
    const dbHashes = db.getRange(2, 6, lastRowDb - 1, 1).getValues().flat();
    if (dbHashes.includes(hash)) {
      SpreadsheetApp.getUi().alert('Этот ролик уже переведён на выбранный язык!');
      return;
    }
  }

  if (channel) updateChannelUsage_(channel);
  if (voice) updateVoiceUsage_(voice);
  updateLanguageDefaultsIfEmpty_(language, channel, voice);

  const timestamp = new Date();
  db.appendRow([timestamp, link, language, channel, voice, hash]);

  const info = 'Channel: ' + channel + '; Voice: ' + voice;
  logAction_('ADD_RECORD', link, language, info);
  notifyAddRecord_(link, language, channel, voice, 'Google Sheets');

  const newLastRowDb = db.getLastRow();
  const dbData = db.getRange(2, 1, newLastRowDb - 1, 3).getValues();
  const doneLanguages = new Set();
  dbData.forEach(row => {
    const rowLink = String(row[1] || '').trim();
    const rowLang = String(row[2] || '').trim().toUpperCase();
    if (rowLink && rowLink === link && LANGS.includes(rowLang)) {
      doneLanguages.add(rowLang);
    }
  });

  const targetRows = 51;
  const queueData = queue.getRange(2, 1, targetRows - 1, 9).getValues();
  let rowToUpdate = null;
  let plannedLanguages = [];
  let queueStatus = '';

  for (let i = 0; i < queueData.length; i++) {
    const row = queueData[i];
    const qLink = String(row[0] || '').trim();
    if (!qLink) continue;
    if (qLink === link) {
      const flags = {
        EN: !!row[2],
        ES: !!row[3],
        RU: !!row[4],
        DE: !!row[5],
        FR: !!row[6],
        PT: !!row[7]
      };
      const tmp = [];
      LANGS.forEach(lang => {
        if (flags[lang]) tmp.push(lang);
      });
      plannedLanguages = tmp.length > 0 ? tmp : LANGS.slice();
      rowToUpdate = i + 2;
      queueStatus = String(row[8] || '').trim();
      break;
    }
  }

  if (rowToUpdate !== null) {
    if (queueStatus === TASK_STATUS.NEW) {
      setQueueStatus_(rowToUpdate, TASK_STATUS.IN_PROGRESS);
      queueStatus = TASK_STATUS.IN_PROGRESS;
    }

    let allDone = true;
    plannedLanguages.forEach(lang => {
      if (!doneLanguages.has(lang)) allDone = false;
    });

    if (allDone) {
      setQueueStatus_(rowToUpdate, TASK_STATUS.DONE);
      SpreadsheetApp.getUi().alert('Перевод добавлен. Все нужные языки по этой ссылке сделаны, статус задачи обновлён.');
    } else {
      SpreadsheetApp.getUi().alert('Перевод добавлен. По этой ссылке ещё есть незавершённые языки, ссылка остаётся в очереди.');
    }
  } else {
    SpreadsheetApp.getUi().alert('Перевод добавлен. Для этой ссылки нет строки в Queue (возможно, она не была добавлена в очередь).');
  }
}

function addRecordFromWeb(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const db = ss.getSheetByName(SHEETS.DB);
  const queue = ss.getSheetByName(SHEETS.QUEUE);

  if (!db || !queue) {
    return { success: false, message: 'Листы "База данных" или "Очередь" не найдены.' };
  }

  const link = String(payload.link || '').trim();
  const language = String(payload.language || '').trim().toUpperCase();
  const channel = String(payload.channel || '').trim();
  const voice = String(payload.voice || '').trim();

  if (!link || !language) {
    return { success: false, message: 'Нужны ссылка и язык.' };
  }
  if (!LANGS.includes(language)) {
    return { success: false, message: 'Неверный язык. Разрешены: ' + LANGS.join(', ') };
  }

  const hash = (link + '-' + language).toLowerCase();

  const lastRowDb = db.getLastRow();
  if (lastRowDb >= 2) {
    const dbHashes = db.getRange(2, 6, lastRowDb - 1, 1).getValues().flat();
    if (dbHashes.includes(hash)) {
      return { success: false, message: 'Этот ролик уже переведён на выбранный язык.' };
    }
  }

  if (channel) updateChannelUsage_(channel);
  if (voice) updateVoiceUsage_(voice);
  updateLanguageDefaultsIfEmpty_(language, channel, voice);

  const timestamp = new Date();
  db.appendRow([timestamp, link, language, channel, voice, hash]);

  const info = 'Channel: ' + channel + '; Voice: ' + voice;
  logAction_('ADD_RECORD', link, language, info);
  notifyAddRecord_(link, language, channel, voice, 'Web UI');

  const newLastRowDb = db.getLastRow();
  const dbData = db.getRange(2, 1, newLastRowDb - 1, 3).getValues();
  const doneLanguages = new Set();
  dbData.forEach(row => {
    const rowLink = String(row[1] || '').trim();
    const rowLang = String(row[2] || '').trim().toUpperCase();
    if (rowLink && rowLink === link && LANGS.includes(rowLang)) {
      doneLanguages.add(rowLang);
    }
  });

  const targetRows = 51;
  const queueData = queue.getRange(2, 1, targetRows - 1, 9).getValues();
  let rowToUpdate = null;
  let plannedLanguages = [];
  let queueStatus = '';

  for (let i = 0; i < queueData.length; i++) {
    const row = queueData[i];
    const qLink = String(row[0] || '').trim();
    if (!qLink) continue;
    if (qLink === link) {
      const flags = {
        EN: !!row[2],
        ES: !!row[3],
        RU: !!row[4],
        DE: !!row[5],
        FR: !!row[6],
        PT: !!row[7]
      };
      const tmp = [];
      LANGS.forEach(lang => {
        if (flags[lang]) tmp.push(lang);
      });
      plannedLanguages = tmp.length > 0 ? tmp : LANGS.slice();
      rowToUpdate = i + 2;
      queueStatus = String(row[8] || '').trim();
      break;
    }
  }

  let message = 'Перевод добавлен.';
  if (rowToUpdate !== null) {
    if (queueStatus === TASK_STATUS.NEW) {
      setQueueStatus_(rowToUpdate, TASK_STATUS.IN_PROGRESS);
      queueStatus = TASK_STATUS.IN_PROGRESS;
    }

    let allDone = true;
    plannedLanguages.forEach(lang => {
      if (!doneLanguages.has(lang)) allDone = false;
    });

    if (allDone) {
      setQueueStatus_(rowToUpdate, TASK_STATUS.DONE);
      message = 'Перевод добавлен. Все нужные языки сделаны, статус задачи обновлён.';
    } else {
      message = 'Перевод добавлен. По этой ссылке ещё есть незавершённые языки, задача остаётся в очереди.';
    }
  } else {
    message = 'Перевод добавлен. Для этой ссылки не найдено строки в Queue.';
  }

  return { success: true, message };
}

