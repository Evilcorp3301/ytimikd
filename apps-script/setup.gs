/***************************************
 * МЕНЮ И ПЕРВИЧНАЯ НАСТРОЙКА
 ***************************************/
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Проект перевода')
    .addItem('🔧 Первичная настройка проекта', 'setupProject')
    .addItem('🎨 Применить тему для таблицы', 'applySheetTheme')
    .addItem('🖼️ Применить тему для фронтенда', 'applyFrontendThemeFromMenu')
    .addSeparator()
    .addItem('➕ Добавить ссылку в очередь (форма)', 'addToQueueFromForm')
    .addItem('✅ Добавить перевод (форма)', 'addRecord')
    .addToUi();
}

/***************************************
 * onEdit – автозаполнение по языку в "Основная_Форма"
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
  setupQueueLanguagesSheet_(ss);
  setupDatabaseSheet_(ss);
  setupLanguageSheets_(ss);
  setupLogsSheet_(ss);
  setupDashboardSheet_(ss);

  // 3) Применяем визуальную тему
  applySheetTheme(true);
  applyFrontendThemeFromMenu(true);
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
 * ЛИСТ "Настройки" + чтение тем
 ***************************************/
function setupSettingsSheet_(ss) {
  let sh = ss.getSheetByName(SETTINGS_SHEET);
  if (!sh) sh = ss.insertSheet(SETTINGS_SHEET);

  sh.setColumnWidth(1, 190);
  sh.setColumnWidth(2, 140);
  sh.setColumnWidth(3, 320);
  sh.setColumnWidth(5, 190);
  sh.setColumnWidth(6, 180);
  sh.setColumnWidth(7, 320);

  sh.getRange('A1').setValue('Тема Google Sheets');
  sh.getRange('A1:C1').merge().setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.getRange('A2').setValue('Праметр');
  sh.getRange('B2').setValue('Значение');
  sh.getRange('C2').setValue('Описание');

  sh.getRange('E1').setValue('Тема веб-интерфейса');
  sh.getRange('E1:G1').merge().setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.getRange('E2').setValue('Параметр');
  sh.getRange('F2').setValue('Значение');
  sh.getRange('G2').setValue('Описание');

  fillThemeFields_(sh, SHEET_THEME_FIELDS, 3, 1);
  fillThemeFields_(sh, WEB_THEME_FIELDS, 3, 5);

  const maxRows = Math.max(3 + SHEET_THEME_FIELDS.length, 3 + WEB_THEME_FIELDS.length);
  const maxCols = Math.max(3, 7);
  sh.getRange(1, 1, maxRows, maxCols)
    .setFontFamily('Manrope')
    .setFontSize(10)
    .setFontWeight('bold');

  sh.setFrozenRows(2);
}

/***************************************
 * ЛИСТ "Языковые дефолты"
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

  sh.getRange('A1').setValue('ЯЗЫКОВЫЕ ДЕФОЛТЫ');
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

function ensureReferenceSheetReady_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEETS.REF);

  if (!sh) {
    // Создаём минимально необходимую структуру, если лист отсутствует
    setupReferenceSheet_(ss);
    sh = ss.getSheetByName(SHEETS.REF);
  }

  if (!sh) {
    throw new Error('Лист "Языковые дефолты" не найден и не удалось создать. Сначала запустите setupProject().');
  }

  // Гарантируем наличие строк с кодами языков, не затирая введённые канал/голос
  const current = sh.getRange(REF_LANG_START_ROW, 1, LANGS.length, 3).getValues();
  const normalized = [];

  for (let i = 0; i < LANGS.length; i++) {
    const row = current[i] || ['', '', ''];
    normalized.push([LANGS[i], row[1] || '', row[2] || '']);
  }

  sh.getRange(REF_LANG_START_ROW, 1, LANGS.length, 3).setValues(normalized);

  return sh;
}

function getReferenceSheet_() {
  return ensureReferenceSheetReady_();
}

/***************************************
 * ЛИСТ "Основная_Форма"
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
 * ЛИСТ "Очередь_Форма"
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
 * ЛИСТ "Очередь"
 ***************************************/
function setupQueueSheet_(ss) {
  let sh = ss.getSheetByName(SHEETS.QUEUE);
  if (!sh) sh = ss.insertSheet(SHEETS.QUEUE);
  sh.clear();

  const headers = ['Ссылка', 'Комментарий', 'EN', 'ES', 'RU', 'DE', 'FR', 'PT', 'Статус'];

  let maxCols = sh.getMaxColumns();
  if (maxCols < headers.length) {
    sh.insertColumnsAfter(maxCols, headers.length - maxCols);
    maxCols = headers.length;
  } else if (maxCols > headers.length) {
    sh.deleteColumns(headers.length + 1, maxCols - headers.length);
    maxCols = headers.length;
  }

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
  sh.setColumnWidth(headers.length, 110);

  sh.setRowHeights(1, targetRows, 30);

  sh.getRange(1, 1, 1, headers.length).setValues([headers]);

  const rowsLang = targetRows - 1;
  if (rowsLang > 0) {
    const checkboxRange = sh.getRange(2, 3, rowsLang, 6);
    const rule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    checkboxRange.clearDataValidations();
    checkboxRange.setDataValidation(rule);
    checkboxRange.setValue(false);
  }

  sh.getRange(2, headers.length, rowsLang, 1).setValue('');

  sh.getRange(1, 1, targetRows, headers.length)
    .setFontFamily('Manrope')
    .setFontSize(10)
    .setFontWeight('bold');
}



function setupQueueLanguagesSheet_(ss) {
  let sh = ss.getSheetByName(SHEETS.QUEUE_LANGS);
  if (!sh) sh = ss.insertSheet(SHEETS.QUEUE_LANGS);
  sh.clear();

  const headers = ['Link', 'Language', 'IsRequired', 'Status', 'Assignee', 'Notes'];

  let maxCols = sh.getMaxColumns();
  if (maxCols < headers.length) {
    sh.insertColumnsAfter(maxCols, headers.length - maxCols);
    maxCols = headers.length;
  } else if (maxCols > headers.length) {
    sh.deleteColumns(headers.length + 1, maxCols - headers.length);
    maxCols = headers.length;
  }

  const targetRows = 2;
  const maxRows = sh.getMaxRows();
  if (maxRows < targetRows) {
    sh.insertRowsAfter(maxRows, targetRows - maxRows);
  } else if (maxRows > targetRows) {
    sh.deleteRows(targetRows + 1, maxRows - targetRows);
  }

  sh.setColumnWidth(1, 500);  // Link
  sh.setColumnWidth(2, 80);   // Language
  sh.setColumnWidth(3, 90);   // IsRequired
  sh.setColumnWidth(4, 110);  // Status
  sh.setColumnWidth(5, 120);  // Assignee
  sh.setColumnWidth(6, 250);  // Notes

  sh.setRowHeights(1, targetRows, 24);

  sh.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Флаг обязательности как чекбоксы
  const rule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  const requiredRange = sh.getRange(2, 3, targetRows - 1, 1);
  requiredRange.clearDataValidations();
  requiredRange.setDataValidation(rule);
}

/***************************************
 * ЛИСТ "База данных"
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
  if (!db) throw new Error('Лист "База данных" не найден. Сначала запустите setupProject().');

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

    const formula = `=FILTER('${SHEETS.DB}'!A2:F, '${SHEETS.DB}'!C2:C="${lang}")`;
    sh.getRange(2, 1).setFormula(formula);
  });
}

/***************************************
 * ЛИСТ "Логи"
 ***************************************/
function setupLogsSheet_(ss) {
  let sh = ss.getSheetByName(SHEETS.LOGS);
  if (!sh) sh = ss.insertSheet(SHEETS.LOGS);
  sh.clear();

  const headers = ['Timestamp', 'Action', 'Link', 'Language', 'Info'];
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);

  sh.setColumnWidth(1, 160);
  sh.setColumnWidth(2, 180);
  sh.setColumnWidth(3, 400);
  sh.setColumnWidth(4, 100);
  sh.setColumnWidth(5, 220);

  const maxRows = sh.getMaxRows();
  const maxCols = sh.getMaxColumns();
  sh.getRange(1, 1, maxRows, maxCols)
    .setFontFamily('Manrope')
    .setFontSize(10)
    .setFontWeight('bold');
}

/***************************************
 * ЛИСТ "Панель управления"
 ***************************************/
function setupDashboardSheet_(ss) {
  let sh = ss.getSheetByName(SHEETS.DASH);
  if (!sh) sh = ss.insertSheet(SHEETS.DASH);
  sh.clear();

  sh.getRange('A1').setValue('ПАНЕЛЬ УПРАВЛЕНИЯ');
  sh.getRange('A1:B1').merge().setHorizontalAlignment('center').setVerticalAlignment('middle');

  // Переводы за 7 дней
  sh.getRange('A3').setValue('Переводы за последние 7 дней');
  sh.getRange('B3').setFormula(`=COUNTIF('${SHEETS.DB}'!A:A, ">=" & TODAY()-7)`);

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
    const formula = `=COUNTIF('${SHEETS.DB}'!C:C, A${row})`;
    sh.getRange(row, 2).setFormula(formula);
  }

  // Очередь
  sh.getRange('A12').setValue('Очередь на перевод');
  sh.getRange('A13').setValue('Всего задач в очереди');
  sh.getRange('B13').setFormula(`=COUNTA('${SHEETS.QUEUE}'!A2:A)`);

  // Всего переведённых
  sh.getRange('A15').setValue('Всего переведённых роликов');
  sh.getRange('B15').setFormula(`=COUNTA('${SHEETS.DB}'!A2:A)`);

  const maxRows = sh.getMaxRows();
  const maxCols = sh.getMaxColumns();
  sh.getRange(1, 1, maxRows, maxCols)
    .setFontFamily('Manrope')
    .setFontSize(10)
    .setFontWeight('bold');
}

