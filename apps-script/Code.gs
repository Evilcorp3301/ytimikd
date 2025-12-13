/***************************************
 * ГЛОБАЛЬНЫЕ КОНСТАНТЫ
 ***************************************/
const SHEETS = {
  SETTINGS: 'Настройки',
  REF: 'Справочники',
  MAIN_FORM: 'Main_Form',
  QUEUE_FORM: 'Queue_Form',
  QUEUE: 'Queue',
  DB: 'Database',
  LOGS: 'Logs',
  DASH: 'Dashboard'
};

const BASE_SHEET_NAME = 'Лист1';

// Рабочие языки проекта
const LANGS = ['EN', 'ES', 'RU', 'DE', 'FR', 'PT'];

// Стартовая строка для таблицы языков в "Справочники"
const REF_LANG_START_ROW = 10;

/***************************************
 * МЕНЮ ПРИ ОТКРЫТИИ ТАБЛИЦЫ
 ***************************************/
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Проект перевода')
    .addItem('🔧 Первичная настройка проекта', 'setupProject')
    .addSeparator()
    .addItem('🎨 Применить тему', 'applyTheme')
    .addSeparator()
    .addItem('➕ Добавить ссылку в очередь (форма)', 'addToQueueFromForm')
    .addItem('✅ Добавить перевод (форма)', 'addRecord')
    .addToUi();
}

/***************************************
 * onEdit – автозаполнение по языку в Main_Form
 ***************************************/
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const sh = e.range.getSheet();
    if (sh.getName() === SHEETS.MAIN_FORM && e.range.getA1Notation() === 'B3') {
      const lang = String(e.value || '').trim().toUpperCase();
      if (!lang) return;
      if (!LANGS.includes(lang)) return;
      autofillDefaultsForLanguage_(lang);
    }
  } catch (err) {
    // чтобы случайная ошибка не ломала работу таблицы
  }
}

/***************************************
 * ПОЛНАЯ НАСТРОЙКА ПРОЕКТА
 ***************************************/
function setupProject() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1) Удаляем все листы, кроме "Лист1"
  cleanAllProjectSheets_(ss);

  // 2) Строим весь проект
  setupSettingsSheet_(ss);
  setupReferenceSheet_(ss);
  setupMainFormSheet_(ss);
  setupQueueFormSheet_(ss);
  setupQueueSheet_(ss);
  setupDatabaseSheet_(ss);
  setupLanguageSheets_(ss);
  setupLogsSheet_(ss);
  setupDashboardSheet_(ss);

  // 3) Применяем тему
  applyTheme();
}

/***************************************
 * УДАЛЕНИЕ ВСЕХ ЛИСТОВ КРОМЕ "Лист1"
 ***************************************/
function cleanAllProjectSheets_(ss) {
  const sheets = ss.getSheets();
  const toDelete = [];
  let hasBase = false;

  sheets.forEach(sh => {
    const name = sh.getName();
    if (name === BASE_SHEET_NAME) {
      hasBase = true;
    } else {
      toDelete.push(name);
    }
  });

  toDelete.forEach(name => {
    const sh = ss.getSheetByName(name);
    if (sh) ss.deleteSheet(sh);
  });

  if (!hasBase) {
    ss.insertSheet(BASE_SHEET_NAME);
  }
}

/***************************************
 * ЛИСТ "Настройки" – визуал табличной части
 ***************************************/
function setupSettingsSheet_(ss) {
  let sh = ss.getSheetByName(SHEETS.SETTINGS);
  if (!sh) sh = ss.insertSheet(SHEETS.SETTINGS);

  sh.clear();
  sh.setColumnWidth(1, 220);
  sh.setColumnWidth(2, 200);
  sh.setColumnWidth(3, 260);

  const rows = [
    ['НАСТРОЙКИ ВИЗУАЛА ПРОЕКТА', '', ''],
    ['', '', ''],
    ['Параметр', 'Значение', 'Комментарий'],
    ['Базовый шрифт', 'Manrope', 'Шрифт для всех листов'],
    ['Размер шрифта', '11', 'Можно изменить на 10/12'],
    ['Цвет текста', '#0F172A', 'Основной цвет текста'],
    ['Цвет фона страницы', '#F8FAFC', 'Фон основных листов'],
    ['Цвет фона полей ввода', '#FFFFFF', 'Ячейки ввода данных'],
    ['Цвет фона заголовков', '#F9FAFB', 'Заголовки блоков/форм'],
    ['Цвет границ таблиц', '#E2E8F0', 'Линии сетки/обводки'],
    ['Акцентный цвет кнопок', '#2563EB', 'Цвет фона кнопок'],
    ['Цвет текста на кнопках', '#FFFFFF', 'Обычно белый'],
    ['Цвет фона чекбоксов', '#FFFFFF', 'Можно оставить по умолчанию'],
    ['Цвет фона шапки Queue', '#F9FAFB', 'Заголовок Queue (строка 1)']
  ];

  sh.getRange(1, 1, rows.length, 3).setValues(rows);

  const maxRows = sh.getMaxRows();
  const maxCols = sh.getMaxColumns();
  sh.getRange(1, 1, maxRows, maxCols)
    .setFontFamily('Manrope')
    .setFontSize(10)
    .setFontWeight('bold');

  sh.getRange('A1:C1')
    .merge()
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBackground('#E5E7EB');

  sh.setFrozenRows(1);
}

/***************************************
 * ЛИСТ "Справочники"
 ***************************************/
function setupReferenceSheet_(ss) {
  let sh = ss.getSheetByName(SHEETS.REF);
  if (!sh) sh = ss.insertSheet(SHEETS.REF);
  sh.clear();

  sh.setColumnWidth(1, 180);
  sh.setColumnWidth(2, 80);
  sh.setColumnWidth(3, 140);
  sh.setColumnWidth(5, 180);
  sh.setColumnWidth(6, 80);
  sh.setColumnWidth(7, 140);

  sh.getRange('A1').setValue('СПРАВОЧНИКИ');
  sh.getRange('A1:G1').merge()
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  // КАНАЛЫ
  sh.getRange('A3').setValue('КАНАЛЫ');
  sh.getRange('A4').setValue('Channel');
  sh.getRange('B4').setValue('Uses');
  sh.getRange('C4').setValue('LastUsed');

  // ГОЛОСА
  sh.getRange('E3').setValue('ГОЛОСА');
  sh.getRange('E4').setValue('Voice');
  sh.getRange('F4').setValue('Uses');
  sh.getRange('G4').setValue('LastUsed');

  // ЯЗЫК → дефолты
  sh.getRange('A8').setValue('ЯЗЫК → КАНАЛ / ГОЛОС ПО УМОЛЧАНИЮ');
  sh.getRange('A9').setValue('Language');
  sh.getRange('B9').setValue('Default Channel');
  sh.getRange('C9').setValue('Default Voice');

  const langRows = [];
  for (let i = 0; i < LANGS.length; i++) {
    langRows.push([LANGS[i], '', '']);
  }
  sh.getRange(REF_LANG_START_ROW, 1, LANGS.length, 3).setValues(langRows);

  const maxRows = sh.getMaxRows();
  const maxCols = sh.getMaxColumns();
  sh.getRange(1, 1, maxRows, maxCols)
    .setFontFamily('Manrope')
    .setFontSize(10)
    .setFontWeight('bold');

  sh.setFrozenRows(1);
}

/***************************************
 * ВСПОМОГАТЕЛЬНЫЕ: "Настройки"
 ***************************************/
function getSettingsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.SETTINGS);
  if (!sh) throw new Error('Лист "Настройки" не найден. Сначала запустите setupProject().');
  return sh;
}

function findSettingRow_(paramName) {
  const sh = getSettingsSheet_();
  const lastRow = sh.getLastRow();
  const vals = sh.getRange(1, 1, lastRow, 1).getValues();
  for (let i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === paramName) return i + 1;
  }
  return null;
}

function getSetting_(paramName) {
  const sh = getSettingsSheet_();
  const row = findSettingRow_(paramName);
  if (!row) return null;
  return String(sh.getRange(row, 2).getValue() || '').trim();
}

/***************************************
 * ВСПОМОГАТЕЛЬНЫЕ: СПРАВОЧНИКИ
 ***************************************/
function getReferenceSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.REF);
  if (!sh) throw new Error('Лист "Справочники" не найден. Сначала запустите setupProject().');
  return sh;
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

// Дефолты по языку
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

// Автозаполнение Main_Form по языку
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

/***************************************
 * ВСПОМОГАТЕЛЬНЫЕ: LOGS
 ***************************************/
function getLogsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.LOGS);
  if (!sh) throw new Error('Лист "Logs" не найден. Сначала запустите setupProject().');
  return sh;
}

function logAction_(action, link, language, info) {
  const sh = getLogsSheet_();
  const ts = new Date();
  sh.appendRow([ts, action, link || '', language || '', info || '']);
}

/***************************************
 * ПРИМЕНЕНИЕ ТЕМЫ КО ВСЕМ ЛИСТАМ (таблица)
 ***************************************/
function applyTheme() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const fontFamily = getSetting_('Базовый шрифт') || 'Manrope';
  const fontSize = parseInt(getSetting_('Размер шрифта') || '11', 10);
  const textColor = getSetting_('Цвет текста') || '#0F172A';
  const pageBg = getSetting_('Цвет фона страницы') || '#F8FAFC';
  const headerBg = getSetting_('Цвет фона заголовков') || '#F9FAFB';
  const queueHeaderBg = getSetting_('Цвет фона шапки Queue') || headerBg;
  const inputBg = getSetting_('Цвет фона полей ввода') || '#FFFFFF';
  const borderColor = getSetting_('Цвет границ таблиц') || '#E2E8F0';
  const buttonBg = getSetting_('Акцентный цвет кнопок') || '#2563EB';

  const sheets = ss.getSheets();

  sheets.forEach(sh => {
    const name = sh.getName();
    if (name === SHEETS.SETTINGS || name === BASE_SHEET_NAME) return;

    const maxRows = sh.getMaxRows();
    const maxCols = sh.getMaxColumns();
    if (maxRows > 0 && maxCols > 0) {
      sh.getRange(1, 1, maxRows, maxCols)
        .setFontFamily(fontFamily)
        .setFontSize(fontSize)
        .setFontWeight('bold')
        .setFontColor(textColor)
        .setBackground(pageBg);
    }
  });

  /************** MAIN_FORM **************/
  const main = ss.getSheetByName(SHEETS.MAIN_FORM);
  if (main) {
    main.setFrozenRows(1);

    main.getRange('A1:B1')
      .setBackground(headerBg)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setBorder(false, false, true, false, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

    main.getRange('A2:A5')
      .setBackground(headerBg)
      .setHorizontalAlignment('right')
      .setVerticalAlignment('middle')
      .setBorder(true, false, true, false, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);

    main.getRange('B2:B5')
      .setBackground(inputBg)
      .setHorizontalAlignment('left')
      .setVerticalAlignment('middle')
      .setBorder(true, true, true, true, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);

    main.getRange('A2:B5')
      .setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID);

    main.getRange('A7:B7')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setFontColor(buttonBg);
  }

  /************** QUEUE_FORM **************/
  const qForm = ss.getSheetByName(SHEETS.QUEUE_FORM);
  if (qForm) {
    qForm.setFrozenRows(1);

    qForm.getRange('A1:B1')
      .setBackground(headerBg)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setBorder(false, false, true, false, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

    qForm.getRange('A2').setBackground(headerBg).setHorizontalAlignment('right').setVerticalAlignment('middle')
      .setBorder(true, false, true, false, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);
    qForm.getRange('A5').setBackground(headerBg).setHorizontalAlignment('right').setVerticalAlignment('middle')
      .setBorder(true, false, true, false, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);
    qForm.getRange('A7:A8').setBackground(headerBg)
      .setHorizontalAlignment('left').setVerticalAlignment('middle')
      .setBorder(true, false, true, false, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);

    qForm.getRange('B2')
      .setBackground(inputBg)
      .setHorizontalAlignment('left')
      .setVerticalAlignment('middle')
      .setBorder(true, true, true, true, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);

    qForm.getRange('B5')
      .setBackground(inputBg)
      .setHorizontalAlignment('left')
      .setVerticalAlignment('top')
      .setBorder(true, true, true, true, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);

    qForm.getRange('B8')
      .setBackground(inputBg)
      .setHorizontalAlignment('left')
      .setVerticalAlignment('middle')
      .setBorder(true, true, true, true, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);

    qForm.getRange('A2:B8')
      .setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID);

    qForm.getRange('A10:B10')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setFontColor(buttonBg);
  }

  /************** QUEUE **************/
  const queue = ss.getSheetByName(SHEETS.QUEUE);
  if (queue) {
    queue.setFrozenRows(1);
    const maxColsQ = queue.getMaxColumns();
    const maxRowsQ = queue.getMaxRows();

    if (maxColsQ > 0) {
      queue.getRange(1, 1, 1, maxColsQ)
        .setBackground(queueHeaderBg)
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle')
        .setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    }

    queue.getRange(1, 1, maxRowsQ, maxColsQ)
      .setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID);

    queue.getRange(2, 1, maxRowsQ - 1, 2)
      .setHorizontalAlignment('left')
      .setVerticalAlignment('middle');

    queue.getRange(2, 3, maxRowsQ - 1, 6)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
  }

  /************** DATABASE **************/
  const db = ss.getSheetByName(SHEETS.DB);
  if (db) {
    db.setFrozenRows(1);
    const lastRowDb = db.getLastRow();
    const lastColDb = db.getLastColumn();

    if (lastColDb > 0) {
      db.getRange(1, 1, 1, lastColDb)
        .setBackground(headerBg)
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle')
        .setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    }

    if (lastRowDb > 1 && lastColDb > 0) {
      db.getRange(1, 1, lastRowDb, lastColDb)
        .setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID);
    }
  }

  /************** ЯЗЫКОВЫЕ ЛИСТЫ **************/
  LANGS.forEach(lang => {
    const sh = ss.getSheetByName(lang);
    if (!sh) return;
    sh.setFrozenRows(1);

    const lastRow = sh.getLastRow();
    const lastCol = sh.getLastColumn();

    if (lastCol > 0) {
      sh.getRange(1, 1, 1, lastCol)
        .setBackground(headerBg)
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle')
        .setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    }

    if (lastRow > 1 && lastCol > 0) {
      sh.getRange(1, 1, lastRow, lastCol)
        .setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID);
    }
  });

  /************** LOGS **************/
  const logs = ss.getSheetByName(SHEETS.LOGS);
  if (logs) {
    logs.setFrozenRows(1);
    const lastCol = logs.getLastColumn();
    const lastRow = logs.getLastRow();
    if (lastCol > 0) {
      logs.getRange(1, 1, 1, lastCol)
        .setBackground(headerBg)
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle')
        .setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    }
    if (lastRow > 1 && lastCol > 0) {
      logs.getRange(1, 1, lastRow, lastCol)
        .setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID);
    }
  }

  /************** Справочники **************/
  const ref = ss.getSheetByName(SHEETS.REF);
  if (ref) {
    ref.setFrozenRows(1);
    ref.getRange('A1:G1')
      .setBackground(headerBg)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

    ref.getRange('A3:C4')
      .setBackground(headerBg)
      .setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID);
    ref.getRange('E3:G4')
      .setBackground(headerBg)
      .setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID);
    ref.getRange('A8:C9')
      .setBackground(headerBg)
      .setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID);
  }

  /************** DASHBOARD **************/
  const dash = ss.getSheetByName(SHEETS.DASH);
  if (dash) {
    dash.setFrozenRows(2);
    dash.getRange('A1:D1')
      .setBackground(headerBg)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

    dash.getRange('A3:B4')
      .setBackground(headerBg)
      .setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID);
    dash.getRange('A12:B13')
      .setBackground(headerBg)
      .setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID);
    dash.getRange('A15:B15')
      .setBackground(headerBg)
      .setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID);
  }
}

/***************************************
 * ЛИСТ "Main_Form"
 ***************************************/
function setupMainFormSheet_(ss) {
  let sh = ss.getSheetByName(SHEETS.MAIN_FORM);
  if (!sh) sh = ss.insertSheet(SHEETS.MAIN_FORM);
  sh.clear();

  sh.setColumnWidth(1, 230);
  sh.setColumnWidth(2, 450);
  const maxCols = sh.getMaxColumns();
  if (maxCols > 2) sh.hideColumns(3, maxCols - 2);

  sh.getRange('A1').setValue('ФОРМА ДОБАВЛЕНИЯ ПЕРЕВОДА');
  sh.getRange('A1:B1').merge()
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  sh.getRange('A2').setValue('ССЫЛКА НА ВИДЕО');
  sh.getRange('A3').setValue('ЯЗЫК ПЕРЕВОДА');
  sh.getRange('A4').setValue('КАНАЛ ПУБЛИКАЦИИ');
  sh.getRange('A5').setValue('ГОЛОС ДЛЯ ОЗВУЧКИ');

  sh.getRange('B2').setValue('');
  sh.getRange('B3').setValue('');
  sh.getRange('B4').setValue('');
  sh.getRange('B5').setValue('');

  const langRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(LANGS, true)
    .setAllowInvalid(false)
    .build();
  sh.getRange('B3').setDataValidation(langRule);

  const ref = ss.getSheetByName(SHEETS.REF);
  if (ref) {
    const chRange = ref.getRange('A5:A104');
    const chRule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(chRange, true)
      .setAllowInvalid(true)
      .build();
    sh.getRange('B4').setDataValidation(chRule);

    const vRange = ref.getRange('E5:E104');
    const vRule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(vRange, true)
      .setAllowInvalid(true)
      .build();
    sh.getRange('B5').setDataValidation(vRule);
  }

  sh.setRowHeight(1, 40);
  sh.setRowHeight(2, 32);
  sh.setRowHeight(3, 32);
  sh.setRowHeight(4, 32);
  sh.setRowHeight(5, 32);
  sh.setRowHeight(7, 45);

  sh.getRange('A7').setValue('Кнопка "Добавить перевод" (рисунок) → функция addRecord()');
  sh.getRange('A7:B7').merge();

  const maxRows2 = sh.getMaxRows();
  sh.getRange(1, 1, maxRows2, 2)
    .setFontFamily('Manrope')
    .setFontSize(10)
    .setFontWeight('bold');
}

/***************************************
 * ЛИСТ "Queue_Form"
 ***************************************/
function setupQueueFormSheet_(ss) {
  let sh = ss.getSheetByName(SHEETS.QUEUE_FORM);
  if (!sh) sh = ss.insertSheet(SHEETS.QUEUE_FORM);
  sh.clear();

  sh.setColumnWidth(1, 230);
  sh.setColumnWidth(2, 500);
  const maxCols = sh.getMaxColumns();
  if (maxCols > 2) sh.hideColumns(3, maxCols - 2);

  sh.getRange('A1').setValue('ДОБАВИТЬ ССЫЛКУ В ОЧЕРЕДЬ');
  sh.getRange('A1:B1').merge()
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  sh.getRange('A2').setValue('ССЫЛКА НА ВИДЕО');
  sh.getRange('B2').setValue('');

  sh.getRange('A5').setValue('КОММЕНТАРИЙ');
  sh.getRange('B5').setValue('');

  sh.getRange('A7').setValue('ВЫБОР ЯЗЫКОВ ДЛЯ ПЕРЕВОДА (если пусто — все 6)');
  sh.getRange('A8').setValue('ЯЗЫКИ');
  sh.getRange('B8').setValue('');

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(LANGS, true)
    .setAllowInvalid(true)
    .build();
  sh.getRange('B8').setDataValidation(rule);

  sh.getRange('A10').setValue('Кнопка "Добавить в очередь" (рисунок) → функция addToQueueFromForm()');
  sh.getRange('A10:B10').merge();

  sh.setRowHeight(1, 40);
  sh.setRowHeight(2, 32);
  sh.setRowHeight(5, 32);
  sh.setRowHeight(7, 40);
  sh.setRowHeight(8, 32);
  sh.setRowHeight(10, 45);

  const maxRows = sh.getMaxRows();
  sh.getRange(1, 1, maxRows, 2)
    .setFontFamily('Manrope')
    .setFontSize(10)
    .setFontWeight('bold');
}

/***************************************
 * ЛИСТ "Queue"
 ***************************************/
function setupQueueSheet_(ss) {
  let sh = ss.getSheetByName(SHEETS.QUEUE);
  if (!sh) sh = ss.insertSheet(SHEETS.QUEUE);
  sh.clear();

  const maxCols = sh.getMaxColumns();
  if (maxCols > 8) sh.deleteColumns(9, maxCols - 8);

  const targetRows = 51;
  let maxRows = sh.getMaxRows();
  if (maxRows < targetRows) {
    sh.insertRowsAfter(maxRows, targetRows - maxRows);
  } else if (maxRows > targetRows) {
    sh.deleteRows(targetRows + 1, maxRows - targetRows);
  }

  sh.setColumnWidth(1, 500);
  sh.setColumnWidth(2, 250);
  for (let col = 3; col <= 8; col++) sh.setColumnWidth(col, 70);

  sh.setRowHeights(1, targetRows, 30);

  sh.getRange('A1').setValue('Ссылка');
  sh.getRange('B1').setValue('Комментарий');
  sh.getRange('C1').setValue('EN');
  sh.getRange('D1').setValue('ES');
  sh.getRange('E1').setValue('RU');
  sh.getRange('F1').setValue('DE');
  sh.getRange('G1').setValue('FR');
  sh.getRange('H1').setValue('PT');

  const rowsLang = targetRows - 1;
  if (rowsLang > 0) {
    const checkboxRange = sh.getRange(2, 3, rowsLang, 6);
    const rule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    checkboxRange.clearDataValidations();
    checkboxRange.setDataValidation(rule);
    checkboxRange.setValue(false);
  }

  sh.getRange(1, 1, targetRows, 8)
    .setFontFamily('Manrope')
    .setFontSize(10)
    .setFontWeight('bold');
}

/***************************************
 * ЛИСТ "Database"
 ***************************************/
function setupDatabaseSheet_(ss) {
  let sh = ss.getSheetByName(SHEETS.DB);
  if (!sh) sh = ss.insertSheet(SHEETS.DB);
  sh.clear();

  const headers = ['Timestamp', 'Link', 'Language', 'Channel', 'Voice', 'Hash'];
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);

  sh.setColumnWidth(1, 140);
  sh.setColumnWidth(2, 300);
  sh.setColumnWidth(3, 80);
  sh.setColumnWidth(4, 180);
  sh.setColumnWidth(5, 180);
  sh.setColumnWidth(6, 200);

  const maxRows = sh.getMaxRows();
  const maxCols = sh.getMaxColumns();
  sh.getRange(1, 1, maxRows, maxCols)
    .setFontFamily('Manrope')
    .setFontSize(10)
    .setFontWeight('bold');
}

/***************************************
 * ЯЗЫКОВЫЕ ЛИСТЫ EN/ES/RU/DE/FR/PT
 ***************************************/
function setupLanguageSheets_(ss) {
  const db = ss.getSheetByName(SHEETS.DB);
  if (!db) throw new Error('Лист Database не найден. Сначала запустите setupProject().');

  const headers = db.getRange(1, 1, 1, 6).getValues()[0];

  LANGS.forEach(lang => {
    const old = ss.getSheetByName(lang);
    if (old) ss.deleteSheet(old);

    const sh = ss.insertSheet(lang);

    sh.setColumnWidth(1, 140);
    sh.setColumnWidth(2, 300);
    sh.setColumnWidth(3, 80);
    sh.setColumnWidth(4, 180);
    sh.setColumnWidth(5, 180);
    sh.setColumnWidth(6, 200);

    const maxRows = sh.getMaxRows();
    const maxCols = sh.getMaxColumns();
    sh.getRange(1, 1, maxRows, maxCols)
      .setFontFamily('Manrope')
      .setFontSize(10)
      .setFontWeight('bold');

    sh.getRange(1, 1, 1, headers.length).setValues([headers]);

    const formula = `=FILTER(${SHEETS.DB}!A2:F, ${SHEETS.DB}!C2:C="${lang}")`;
    sh.getRange(2, 1).setFormula(formula);
  });
}

/***************************************
 * ЛИСТ "Logs"
 ***************************************/
function setupLogsSheet_(ss) {
  let sh = ss.getSheetByName(SHEETS.LOGS);
  if (!sh) sh = ss.insertSheet(SHEETS.LOGS);
  sh.clear();

  const headers = ['Timestamp', 'Action', 'Link', 'Language', 'Info'];
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);

  sh.setColumnWidth(1, 150);
  sh.setColumnWidth(2, 120);
  sh.setColumnWidth(3, 320);
  sh.setColumnWidth(4, 120);
  sh.setColumnWidth(5, 400);

  const maxRows = sh.getMaxRows();
  const maxCols = sh.getMaxColumns();
  sh.getRange(1, 1, maxRows, maxCols)
    .setFontFamily('Manrope')
    .setFontSize(10)
    .setFontWeight('bold');
}

/***************************************
 * ЛИСТ "Dashboard"
 ***************************************/
function setupDashboardSheet_(ss) {
  let sh = ss.getSheetByName(SHEETS.DASH);
  if (!sh) sh = ss.insertSheet(SHEETS.DASH);
  sh.clear();

  sh.setColumnWidth(1, 220);
  sh.setColumnWidth(2, 160);
  sh.setColumnWidth(3, 160);
  sh.setColumnWidth(4, 160);

  sh.getRange('A1').setValue('DASHBOARD');
  sh.getRange('A1:D1').merge()
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  // Статистика по языкам
  sh.getRange('A3').setValue('Статистика по языкам');
  sh.getRange('A4').setValue('Язык');
  sh.getRange('B4').setValue('Количество роликов');

  const langRows = [];
  for (let i = 0; i < LANGS.length; i++) {
    langRows.push([LANGS[i]]);
  }
  sh.getRange(5, 1, LANGS.length, 1).setValues(langRows);

  for (let i = 0; i < LANGS.length; i++) {
    const row = 5 + i;
    const formula = `=COUNTIF(${SHEETS.DB}!C:C, A${row})`;
    sh.getRange(row, 2).setFormula(formula);
  }

  // Очередь
  sh.getRange('A12').setValue('Очередь на перевод');
  sh.getRange('A13').setValue('Всего задач в очереди');
  sh.getRange('B13').setFormula(`=COUNTA(${SHEETS.QUEUE}!A2:A)`);

  // Всего переведённых
  sh.getRange('A15').setValue('Всего переведённых роликов');
  sh.getRange('B15').setFormula(`=COUNTA(${SHEETS.DB}!A2:A)`);

  const maxRows = sh.getMaxRows();
  const maxCols = sh.getMaxColumns();
  sh.getRange(1, 1, maxRows, maxCols)
    .setFontFamily('Manrope')
    .setFontSize(10)
    .setFontWeight('bold');
}

/***************************************
 * ДОБАВЛЕНИЕ ССЫЛКИ В ОЧЕРЕДЬ (форма)
 ***************************************/
function addToQueueFromForm() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const qForm = ss.getSheetByName(SHEETS.QUEUE_FORM);
  const queue = ss.getSheetByName(SHEETS.QUEUE);
  if (!qForm || !queue) {
    SpreadsheetApp.getUi().alert('Листы Queue_Form или Queue не найдены. Сначала запустите setupProject().');
    return;
  }

  const link = String(qForm.getRange('B2').getValue() || '').trim();
  const comment = String(qForm.getRange('B5').getValue() || '').trim();
  const langCellRaw = String(qForm.getRange('B8').getValue() || '').trim();

  if (!link) {
    SpreadsheetApp.getUi().alert('Введите ссылку на видео (Queue_Form!B2).');
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

  const langsForLog = useExplicitCheck ? plannedLanguages.join(',') : 'ALL';
  logAction_('ADD_TO_QUEUE', link, langsForLog, comment);

  qForm.getRange('B2').setValue('');
  qForm.getRange('B5').setValue('');
  qForm.getRange('B8').setValue('');

  SpreadsheetApp.getUi().alert('Ссылка добавлена в очередь.');
}

/***************************************
 * ДОБАВЛЕНИЕ ПЕРЕВОДА (форма Main_Form)
 ***************************************/
function addRecord() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const form = ss.getSheetByName(SHEETS.MAIN_FORM);
  const db = ss.getSheetByName(SHEETS.DB);
  const queue = ss.getSheetByName(SHEETS.QUEUE);

  if (!form || !db || !queue) {
    SpreadsheetApp.getUi().alert('Листы Main_Form, Database или Queue не найдены. Сначала запустите setupProject().');
    return;
  }

  const link = String(form.getRange('B2').getValue() || '').trim();
  const language = String(form.getRange('B3').getValue() || '').trim().toUpperCase();
  const channel = String(form.getRange('B4').getValue() || '').trim();
  const voice = String(form.getRange('B5').getValue() || '').trim();

  if (!link || !language) {
    SpreadsheetApp.getUi().alert('Введите ссылку (B2) и выберите язык (B3) на листе Main_Form.');
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
  const queueData = queue.getRange(2, 1, targetRows - 1, 8).getValues();
  let rowToDelete = null;
  let plannedLanguages = [];

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
      rowToDelete = i + 2;
      break;
    }
  }

  if (rowToDelete !== null) {
    let allDone = true;
    plannedLanguages.forEach(lang => {
      if (!doneLanguages.has(lang)) allDone = false;
    });

    if (allDone) {
      queue.deleteRow(rowToDelete);
      const currentRows = queue.getMaxRows();
      const targetRowsQueue = 51;
      if (currentRows < targetRowsQueue) {
        queue.insertRowsAfter(currentRows, targetRowsQueue - currentRows);
      }
      const rowsLang = targetRowsQueue - 1;
      if (rowsLang > 0) {
        const checkboxRange = queue.getRange(2, 3, rowsLang, 6);
        const rule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
        checkboxRange.clearDataValidations();
        checkboxRange.setDataValidation(rule);
        checkboxRange.setValue(false);
      }

      logAction_('QUEUE_TASK_COMPLETED', link, plannedLanguages.join(','), 'Row ' + rowToDelete + ' removed from Queue');
      SpreadsheetApp.getUi().alert('Перевод добавлен. Все нужные языки по этой ссылке сделаны, ссылка удалена из очереди.');
    } else {
      SpreadsheetApp.getUi().alert('Перевод добавлен. По этой ссылке ещё есть незавершённые языки, ссылка остаётся в очереди.');
    }
  } else {
    SpreadsheetApp.getUi().alert('Перевод добавлен. Для этой ссылки нет строки в Queue (возможно, она не была добавлена в очередь).');
  }
}

/****************************************************************
 * WEB APP: doGet и вспомогательные функции
 ****************************************************************/

function doGet(e) {
  const t = HtmlService.createTemplateFromFile('Index');
  return t.evaluate()
    .setTitle('Translation Control Center')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/************************************************
 * API: ТЕМА / НАСТРОЙКИ (для webapp — шрифт)
 ************************************************/

function getThemeConfig() {
  return {
    fontFamily: getSetting_('Базовый шрифт') || 'Manrope',
    fontSize: parseInt(getSetting_('Размер шрифта') || '11', 10),
    textColor: getSetting_('Цвет текста') || '#0F172A',
    pageBg: getSetting_('Цвет фона страницы') || '#F8FAFC',
    headerBg: getSetting_('Цвет фона заголовков') || '#F9FAFB',
    inputBg: getSetting_('Цвет фона полей ввода') || '#FFFFFF',
    borderColor: getSetting_('Цвет границ таблиц') || '#E2E8F0',
    buttonBg: getSetting_('Акцентный цвет кнопок') || '#2563EB',
    buttonText: getSetting_('Цвет текста на кнопках') || '#FFFFFF'
  };
}

/************************************************
 * API: DASHBOARD
 ************************************************/

function getDashboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const db = ss.getSheetByName(SHEETS.DB);
  const queue = ss.getSheetByName(SHEETS.QUEUE);
  if (!db || !queue) {
    throw new Error('Листы Database или Queue не найдены. Запустите setupProject().');
  }

  const lastRowDb = db.getLastRow();
  const perLangMap = {};
  LANGS.forEach(l => perLangMap[l] = 0);

  const now = new Date();
  const ms7 = 7 * 24 * 60 * 60 * 1000;
  let last7Days = 0;
  let totalTranslations = 0;

  if (lastRowDb >= 2) {
    const dbData = db.getRange(2, 1, lastRowDb - 1, 3).getValues(); // Timestamp, Link, Language
    totalTranslations = dbData.length;

    dbData.forEach(row => {
      const ts = row[0];
      const lang = String(row[2] || '').trim().toUpperCase();

      if (LANGS.includes(lang)) {
        perLangMap[lang] = (perLangMap[lang] || 0) + 1;
      }

      if (ts && ts instanceof Date) {
        if (now - ts <= ms7) last7Days++;
      }
    });
  }

  const queueData = queue.getRange(2, 1, 50, 1).getValues();
  let totalQueue = 0;
  queueData.forEach(r => {
    const link = String(r[0] || '').trim();
    if (link) totalQueue++;
  });

  const perLang = LANGS.map(code => ({
    code,
    count: perLangMap[code] || 0
  }));

  let topLang = null;
  let topCount = 0;
  perLang.forEach(item => {
    if (item.count > topCount) {
      topCount = item.count;
      topLang = item.code;
    }
  });

  return {
    totalTranslations,
    totalQueue,
    last7Days,
    perLang,
    topLang
  };
}

/************************************************
 * API: ОЧЕРЕДЬ
 ************************************************/

function getQueueData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const queue = ss.getSheetByName(SHEETS.QUEUE);
  const db = ss.getSheetByName(SHEETS.DB);
  if (!queue || !db) {
    throw new Error('Листы Queue или Database не найдены.');
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

  const rows = queue.getRange(2, 1, 50, 8).getValues();
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

    let planned = [];
    for (const lang of LANGS) {
      if (flags[lang]) planned.push(lang);
    }
    if (planned.length === 0) {
      planned = LANGS.slice();
    }

    const doneMap = linkLangMap[link] || {};
    const doneLangs = planned.filter(l => !!doneMap[l]);
    const progressDone = doneLangs.length;
    const progressTotal = planned.length;

    let status = 'not_started';
    if (progressDone === 0) {
      status = 'not_started';
    } else if (progressDone < progressTotal) {
      status = 'in_progress';
    } else if (progressDone === progressTotal) {
      status = 'done';
    }

    result.push({
      rowIndex,
      link,
      comment,
      plannedLanguages: planned,
      doneLanguages: doneLangs,
      progressDone,
      progressTotal,
      status
    });
  }

  return result;
}

/************************************************
 * API: СПРАВОЧНИКИ
 ************************************************/

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

/************************************************
 * API: ЛОГИ (для Web)
 ************************************************/

function getLogs(limit) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.LOGS);
  if (!sh) throw new Error('Лист Logs не найден.');

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  const max = Math.min(limit || 200, lastRow - 1);
  const startRow = lastRow - max + 1;
  const data = sh.getRange(startRow, 1, max, 5).getValues(); // TS, Action, Link, Lang, Info
  const tz = Session.getScriptTimeZone();

  const result = data.map(row => {
    const tsVal = row[0];
    let tsStr = '';
    if (tsVal instanceof Date) {
      tsStr = Utilities.formatDate(tsVal, tz, 'yyyy-MM-dd HH:mm:ss');
    } else {
      tsStr = String(tsVal || '');
    }
    return {
      timestamp: tsStr,
      action: String(row[1] || '').trim(),
      link: String(row[2] || '').trim(),
      language: String(row[3] || '').trim(),
      info: String(row[4] || '').trim()
    };
  });

  return result.reverse();
}

/************************************************
 * API: ДОБАВЛЕНИЕ В ОЧЕРЕДЬ (Web)
 ************************************************/

function addToQueueFromWeb(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const queue = ss.getSheetByName(SHEETS.QUEUE);
  if (!queue) throw new Error('Лист Queue не найден.');

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

  const langsForLog = useExplicitCheck ? langs.join(',') : 'ALL';
  logAction_('ADD_TO_QUEUE', link, langsForLog, comment);

  return { success: true, message: 'Задача добавлена в очередь.' };
}

/************************************************
 * API: ДОБАВЛЕНИЕ ПЕРЕВОДА (Web)
 ************************************************/

function addRecordFromWeb(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const db = ss.getSheetByName(SHEETS.DB);
  const queue = ss.getSheetByName(SHEETS.QUEUE);

  if (!db || !queue) {
    return { success: false, message: 'Листы Database или Queue не найдены.' };
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
  const queueData = queue.getRange(2, 1, targetRows - 1, 8).getValues();
  let rowToDelete = null;
  let plannedLanguages = [];

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
      rowToDelete = i + 2;
      break;
    }
  }

  let message = 'Перевод добавлен.';
  if (rowToDelete !== null) {
    let allDone = true;
    plannedLanguages.forEach(lang => {
      if (!doneLanguages.has(lang)) allDone = false;
    });

    if (allDone) {
      queue.deleteRow(rowToDelete);
      const currentRows = queue.getMaxRows();
      const targetRowsQueue = 51;
      if (currentRows < targetRowsQueue) {
        queue.insertRowsAfter(currentRows, targetRowsQueue - currentRows);
      }
      const rowsLang = targetRowsQueue - 1;
      if (rowsLang > 0) {
        const checkboxRange = queue.getRange(2, 3, rowsLang, 6);
        const rule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
        checkboxRange.clearDataValidations();
        checkboxRange.setDataValidation(rule);
        checkboxRange.setValue(false);
      }

      logAction_('QUEUE_TASK_COMPLETED', link, plannedLanguages.join(','), 'Row ' + rowToDelete + ' removed from Queue');
      message = 'Перевод добавлен. Все нужные языки сделаны, задача удалена из очереди.';
    } else {
      message = 'Перевод добавлен. По этой ссылке ещё есть незавершённые языки, задача остаётся в очереди.';
    }
  } else {
    message = 'Перевод добавлен. Для этой ссылки не найдено строки в Queue.';
  }

  return { success: true, message };
}
