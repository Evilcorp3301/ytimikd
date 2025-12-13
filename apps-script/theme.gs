/***************************************
 * НАСТРОЙКИ ТЕМЫ ДЛЯ ТАБЛИЦЫ И ВЕБ
 ***************************************/
const SETTINGS_SHEET = 'Настройки';

const SHEET_THEME_FIELDS = [
  { key: 'fontFamily', label: 'Шрифт таблицы', defaultValue: 'Manrope', description: 'Основной шрифт для всех листов' },
  { key: 'fontSize', label: 'Размер текста', defaultValue: '10', description: 'Базовый размер шрифта' },
  { key: 'textColor', label: 'Цвет текста', defaultValue: '#000000', description: 'Основной цвет текста в таблицах' },
  { key: 'sheetBg', label: 'Фон таблицы', defaultValue: '#ffffff', description: 'Фон рабочих областей' },
  { key: 'headerBg', label: 'Фон заголовков', defaultValue: '#11131a', description: 'Фон строк заголовков' },
  { key: 'headerText', label: 'Цвет заголовков', defaultValue: '#000000', description: 'Цвет текста заголовков' },
  { key: 'titleBg', label: 'Фон тайтлов', defaultValue: '#0f1117', description: 'Фон объединённых шапок' },
  { key: 'titleText', label: 'Цвет тайтлов', defaultValue: '#f5f7fb', description: 'Цвет текста в тайтлах' },
  { key: 'titleSize', label: 'Размер тайтлов', defaultValue: '12', description: 'Размер текста для тайтлов' },
  { key: 'accent', label: 'Акцент', defaultValue: '#7aa2ff', description: 'Акцентный цвет для кнопок и рамок' },
  { key: 'stripe', label: 'Полосы зебры', defaultValue: '#f4f6ff', description: 'Цвет чётных строк' },
  { key: 'border', label: 'Цвет границ', defaultValue: '#d9deea', description: 'Цвет тонких границ таблиц' }
];

const WEB_THEME_FIELDS = [
  { key: 'bgColor', label: 'Фон страницы', defaultValue: '#0f1117', description: 'Основной фон веб-интерфейса' },
  { key: 'panelColor', label: 'Фон панелей', defaultValue: '#161923', description: 'Карточки и панели' },
  { key: 'navBg', label: 'Фон навигации', defaultValue: '#0d0f14', description: 'Фон бокового меню' },
  { key: 'headerBg', label: 'Фон шапки', defaultValue: '#11131a', description: 'Верхняя панель' },
  { key: 'accentColor', label: 'Акцент', defaultValue: '#7aa2ff', description: 'Акцентный цвет' },
  { key: 'textColor', label: 'Основной текст', defaultValue: '#f5f7fb', description: 'Цвет основного текста' },
  { key: 'mutedColor', label: 'Дополнительный текст', defaultValue: '#a9b0c2', description: 'Вторичный текст' },
  { key: 'borderColor', label: 'Рамки', defaultValue: '#222633', description: 'Цвет рамок и разделителей' },
  { key: 'dangerColor', label: 'Опасность', defaultValue: '#ef5350', description: 'Цвет ошибок' },
  { key: 'successColor', label: 'Успех', defaultValue: '#7cd8a0', description: 'Цвет успеха' },
  { key: 'fontFamily', label: 'Шрифт интерфейса', defaultValue: 'Manrope,Inter,system-ui,sans-serif', description: 'CSS значение шрифта' },
  { key: 'baseFontSize', label: 'Размер шрифта', defaultValue: '15', description: 'Базовый размер шрифта (px)' },
  { key: 'accentSoftAlpha', label: 'Прозрачность акцента', defaultValue: '0.16', description: 'Прозрачность для мягкого подсвета' },
  { key: 'tableStripeColor', label: 'Фон полос таблиц', defaultValue: '#131620', description: 'Фон строк зебры в вебе' }
];

function fillThemeFields_(sh, fields, startRow, startCol) {
  fields.forEach((field, idx) => {
    const row = startRow + idx;
    const labelCell = sh.getRange(row, startCol);
    const valueCell = sh.getRange(row, startCol + 1);
    const descCell = sh.getRange(row, startCol + 2);

    labelCell.setValue(field.label);
    descCell.setValue(field.description || '');
    if (!String(valueCell.getValue() || '').trim()) {
      valueCell.setValue(field.defaultValue);
    }
  });
}

function getSettingsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SETTINGS_SHEET);
  if (!sh) {
    setupSettingsSheet_(ss);
    sh = ss.getSheetByName(SETTINGS_SHEET);
  }
  return sh;
}

function readThemeBlock_(sh, startRow, startCol, fields) {
  const values = sh.getRange(startRow, startCol + 1, fields.length, 1).getValues();
  const result = {};
  fields.forEach((field, idx) => {
    const raw = String(values[idx][0] || '').trim();
    result[field.key] = raw || field.defaultValue;
  });
  return result;
}

function getThemeSettings_() {
  const sh = getSettingsSheet_();
  const sheetTheme = readThemeBlock_(sh, 3, 1, SHEET_THEME_FIELDS);
  const webTheme = readThemeBlock_(sh, 3, 5, WEB_THEME_FIELDS);
  return { sheet: sheetTheme, web: webTheme };
}

/***************************************
 * ТЕМА ДЛЯ GOOGLE SHEETS
 ***************************************/
function applySheetTheme(silent) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const theme = getThemeSettings_().sheet;

  const targetSheets = [
    SETTINGS_SHEET,
    SHEETS.REF,
    SHEETS.MAIN_FORM,
    SHEETS.QUEUE_FORM,
    SHEETS.QUEUE,
    SHEETS.DB,
    SHEETS.LOGS,
    SHEETS.DASH,
    ...LANGS
  ];

  targetSheets.forEach(name => {
    const sh = ss.getSheetByName(name);
    if (sh) {
      stylizeSheet_(sh, theme);
    }
  });

  if (!silent) {
    SpreadsheetApp.getUi().alert('Тема применена ко всем листам.');
  }
}

function stylizeSheet_(sh, theme) {
  const maxRows = Math.min(sh.getMaxRows(), 140);
  const maxCols = Math.min(sh.getMaxColumns(), 14);
  const baseRange = sh.getRange(1, 1, maxRows, maxCols);
  const fontSize = parseInt(theme.fontSize, 10) || 10;
  baseRange
    .setFontFamily(theme.fontFamily || 'Manrope')
    .setFontSize(fontSize)
    .setFontColor(theme.textColor || '#111827')
    .setBackground(theme.sheetBg || '#ffffff')
    .setBorder(true, true, true, true, true, true, theme.border || '#d9deea', SpreadsheetApp.BorderStyle.SOLID);

  if (theme.accent) {
    sh.setTabColor(theme.accent);
  }

  const titleRows = [1];
  styleTitleRows_(sh, titleRows, theme);

  const headerRows = getHeaderRowsForSheet_(sh.getName());
  styleHeaderRows_(sh, headerRows, theme);

  applyZebraPattern_(sh, getZebraStartRow_(sh.getName()), maxRows, maxCols, theme);
}

function styleTitleRows_(sh, rows, theme) {
  const lastCol = Math.min(sh.getMaxColumns(), 14);
  const size = parseInt(theme.titleSize, 10) || 12;
  rows.forEach(row => {
    const rng = sh.getRange(row, 1, 1, lastCol);
    rng
      .setBackground(theme.titleBg || theme.headerBg)
      .setFontColor(theme.titleText || theme.headerText)
      .setFontSize(size)
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
  });
}

function styleHeaderRows_(sh, rows, theme) {
  const lastCol = Math.min(sh.getMaxColumns(), 14);
  rows.forEach(row => {
    const rng = sh.getRange(row, 1, 1, lastCol);
    rng
      .setBackground(theme.headerBg || '#11131a')
      .setFontColor(theme.headerText || '#f9fafb')
      .setFontWeight('bold');
  });
}

function applyZebraPattern_(sh, startRow, maxRows, maxCols, theme) {
  if (!startRow || startRow > maxRows) return;
  const rowsCount = maxRows - startRow + 1;
  const colCount = maxCols;
  const rng = sh.getRange(startRow, 1, rowsCount, colCount);
  const bg = [];
  for (let r = 0; r < rowsCount; r++) {
    const rowBg = [];
    const color = ((startRow + r) % 2 === 0) ? (theme.sheetBg || '#ffffff') : (theme.stripe || '#f4f6ff');
    for (let c = 0; c < colCount; c++) {
      rowBg.push(color);
    }
    bg.push(rowBg);
  }
  rng.setBackgrounds(bg);
}

function getHeaderRowsForSheet_(name) {
  switch (name) {
    case SETTINGS_SHEET:
      return [1, 2];
    case SHEETS.MAIN_FORM:
      return [2, 3, 4, 5, 7];
    case SHEETS.QUEUE_FORM:
      return [2, 5, 7, 8, 10];
    case SHEETS.QUEUE:
      return [1, 2, 3, 12, 13, 15];
    case SHEETS.DB:
    case SHEETS.LOGS:
      return [1, 2];
    case SHEETS.DASH:
      return [1, 3, 8, 12];
    case SHEETS.REF:
      return [1, 3, 4, 8, 9];
    default:
      return [1];
  }
}

function getZebraStartRow_(name) {
  switch (name) {
    case SHEETS.QUEUE:
      return 2;
    case SHEETS.DB:
    case SHEETS.LOGS:
      return 2;
    case SHEETS.REF:
      return 5;
    case SETTINGS_SHEET:
      return 3;
    default:
      return 2;
  }
}

/***************************************
 * ТЕМА ДЛЯ ВЕБ-ИНТЕРФЕЙСА
 ***************************************/
function applyFrontendThemeFromMenu(silent) {
  const theme = getThemeSettings_().web;
  PropertiesService.getScriptProperties().setProperty(WEB_THEME_PROP_KEY, JSON.stringify(theme));
  if (!silent) {
    SpreadsheetApp.getUi().alert('Тема фронтенда сохранена. Она применится при следующей загрузке веб-приложения.');
  }
  return { success: true, theme };
}

function getWebTheme() {
  const props = PropertiesService.getScriptProperties();
  const cached = props.getProperty(WEB_THEME_PROP_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (err) {
      // если пропсы повреждены — игнорируем и читаем из листа
    }
  }
  return getThemeSettings_().web;
}

