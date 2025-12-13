/***************************************
 * ОЧЕРЕДЬ
 ***************************************/

function addToQueueFromForm() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const qForm = ss.getSheetByName(SHEETS.QUEUE_FORM);
  const queue = ss.getSheetByName(SHEETS.QUEUE);
  if (!qForm || !queue) {
    SpreadsheetApp.getUi().alert('Листы "Очередь_Форма" или "Очередь" не найдены. Сначала запустите setupProject().');
    return;
  }

  const link = String(qForm.getRange('B2').getValue() || '').trim();
  const comment = String(qForm.getRange('B5').getValue() || '').trim();
  const langCellRaw = String(qForm.getRange('B8').getValue() || '').trim();

  if (!link) {
    SpreadsheetApp.getUi().alert('Введите ссылку на видео (Очередь_Форма!B2).');
    return;
  }

  let plannedLanguages = [];
  if (langCellRaw) {
    const parts = langCellRaw.split(/[,\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
    const seen = new Set();
    for (const p of parts) {
      if (LANGS.includes(p) && !seen.has(p)) {
        plannedLanguages.push(p);
        seen.add(p);
      }
    }
  }
  const useExplicitCheck = plannedLanguages.length > 0;

  let targetRow = null;
  for (let r = 2; r <= 51; r++) {
    const cellVal = String(queue.getRange(r, 1).getValue() || '').trim();
    if (!cellVal) {
      targetRow = r;
      break;
    }
  }
  if (!targetRow) {
    SpreadsheetApp.getUi().alert('Очередь заполнена (нет пустых строк между 2 и 51).');
    return;
  }

  queue.getRange(targetRow, 1).setValue(link);
  queue.getRange(targetRow, 2).setValue(comment);
  queue.getRange(targetRow, 9).setValue(TASK_STATUS.NEW);

  const rowCheckboxes = queue.getRange(targetRow, 3, 1, 6);
  const rule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  rowCheckboxes.clearDataValidations();
  rowCheckboxes.setDataValidation(rule);
  rowCheckboxes.setValue(false);

  if (useExplicitCheck) {
    const langToCol = { EN: 3, ES: 4, RU: 5, DE: 6, FR: 7, PT: 8 };
    for (const lang of plannedLanguages) {
      const col = langToCol[lang];
      if (col) queue.getRange(targetRow, col).setValue(true);
    }
  }

    appendQueueLanguages_(link, plannedLanguages);

  const langsForLog = useExplicitCheck ? plannedLanguages.join(',') : 'ALL';
  logAction_('ADD_TO_QUEUE', link, langsForLog, comment);
  notifyAddToQueue_(link, useExplicitCheck ? plannedLanguages : [], comment, 'Google Sheets');

  qForm.getRange('B2').setValue('');
  qForm.getRange('B5').setValue('');
  qForm.getRange('B8').setValue('');

  SpreadsheetApp.getUi().alert('Ссылка добавлена в очередь.');
}

function getQueueData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const queue = ss.getSheetByName(SHEETS.QUEUE);
  const db = ss.getSheetByName(SHEETS.DB);
  if (!queue || !db) {
    throw new Error('Листы "Очередь" или "База данных" не найдены.');
  }

  const lastRowDb = db.getLastRow();
  const linkLangMap = {};

  if (lastRowDb >= 2) {
    const dbData = db.getRange(2, 2, lastRowDb - 1, 2).getValues(); // Link (B), Language (C)
    dbData.forEach(row => {
      const link = String(row[0] || '').trim();
      const lang = String(row[1] || '').trim().toUpperCase();
      if (!link || !LANGS.includes(lang)) return;
      if (!linkLangMap[link]) linkLangMap[link] = {};
      linkLangMap[link][lang] = true;
    });
  }

  const rows = queue.getRange(2, 1, 50, 9).getValues();
  const result = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = 2 + i;
    const link = String(row[0] || '').trim();
    if (!link) continue;

    const comment = String(row[1] || '').trim();
    const flags = {
      EN: !!row[2],
      ES: !!row[3],
      RU: !!row[4],
      DE: !!row[5],
      FR: !!row[6],
      PT: !!row[7]
    };

    const planned = [];
    LANGS.forEach(code => {
      if (flags[code]) planned.push(code);
    });

    const doneMap = linkLangMap[link] || {};
    const doneLanguages = LANGS.filter(code => doneMap[code]);

    const plannedEffective = planned.length > 0 ? planned : LANGS.slice();
    const progressTotal = plannedEffective.length;
    const progressDone = doneLanguages.filter(code => plannedEffective.includes(code)).length;

    const rawStatus = String(row[STATUS_COL - 1] || '').trim();
    let uiStatus = 'not_started';
    if (rawStatus === TASK_STATUS.IN_PROGRESS) uiStatus = 'in_progress';
    else if (rawStatus === TASK_STATUS.DONE) uiStatus = 'done';

    result.push({
      rowIndex,
      link,
      comment,
      plannedLanguages: plannedEffective,
      doneLanguages,
      progressDone,
      progressTotal,
      status: uiStatus
    });
  }

  return result;
}

function addToQueueFromWeb(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const queue = ss.getSheetByName(SHEETS.QUEUE);
  if (!queue) throw new Error('Лист "Очередь" не найден.');

  const link = String(payload.link || '').trim();
  const comment = String(payload.comment || '').trim();
  let langs = payload.languages || [];

  if (!link) {
    return { success: false, message: 'Пустая ссылка.' };
  }

  langs = langs
    .map(l => String(l || '').trim().toUpperCase())
    .filter(l => LANGS.includes(l));

  const useExplicitCheck = langs.length > 0;

  let targetRow = null;
  for (let r = 2; r <= 51; r++) {
    const cellVal = String(queue.getRange(r, 1).getValue() || '').trim();
    if (!cellVal) {
      targetRow = r;
      break;
    }
  }
  if (!targetRow) {
    return { success: false, message: 'Очередь заполнена (нет пустых строк между 2 и 51).' };
  }

  queue.getRange(targetRow, 1).setValue(link);
  queue.getRange(targetRow, 2).setValue(comment);
  queue.getRange(targetRow, 9).setValue(TASK_STATUS.NEW);

  const rowCheckboxes = queue.getRange(targetRow, 3, 1, 6);
  const rule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  rowCheckboxes.clearDataValidations();
  rowCheckboxes.setDataValidation(rule);
  rowCheckboxes.setValue(false);

  if (useExplicitCheck) {
    const langToCol = { EN: 3, ES: 4, RU: 5, DE: 6, FR: 7, PT: 8 };
    langs.forEach(lang => {
      const col = langToCol[lang];
      if (col) queue.getRange(targetRow, col).setValue(true);
    });
  }

    appendQueueLanguages_(link, langs);

  const langsForLog = useExplicitCheck ? langs.join(',') : 'ALL';
  logAction_('ADD_TO_QUEUE', link, langsForLog, comment);
  notifyAddToQueue_(link, useExplicitCheck ? langs : [], comment, 'Web UI');

  return { success: true, message: 'Задача добавлена в очередь.' };
}



function appendQueueLanguages_(link, plannedLanguages) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.QUEUE_LANGS);
  if (!sh || !link) return;

  const lastRow = sh.getLastRow();
  if (lastRow >= 2) {
    const links = sh.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let r = lastRow; r >= 2; r--) {
      const rowLink = String(links[r - 2][0] || '').trim();
      if (rowLink === link) {
        sh.deleteRow(r);
      }
    }
  }

  const langs = (plannedLanguages && plannedLanguages.length) ? plannedLanguages : LANGS.slice();
  langs.forEach(lang => {
    const langCode = String(lang || '').trim().toUpperCase();
    if (!LANGS.includes(langCode)) return;
    sh.appendRow([link, langCode, true, LANG_STATUS.REQUIRED, '', '']);
  });
}

function setQueueStatus_(rowIndex, newStatus) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const queue = ss.getSheetByName(SHEETS.QUEUE);
  if (!queue || !rowIndex || !newStatus) return;

  const STATUS_COL = 9;
  const currentStatus = String(queue.getRange(rowIndex, STATUS_COL).getValue() || '').trim();
  if (currentStatus === newStatus) return;

  queue.getRange(rowIndex, STATUS_COL).setValue(newStatus);

  const link = String(queue.getRange(rowIndex, 1).getValue() || '').trim();
  if (currentStatus === TASK_STATUS.NEW && newStatus === TASK_STATUS.IN_PROGRESS) {
    logAction_(LOG_EVENT_TYPE.TASK_STARTED, link, '', 'Row ' + rowIndex + ' status updated');
  }
  if (newStatus === TASK_STATUS.DONE) {
    logAction_(LOG_EVENT_TYPE.TASK_COMPLETED, link, '', 'Row ' + rowIndex + ' status updated');
  }
}

