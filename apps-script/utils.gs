/***************************************
 * ВСПОМОГАТЕЛЬНЫЕ УТИЛИТЫ
 ***************************************/

/**
 * Возвращает основной Spreadsheet проекта.
 */
function getProjectSpreadsheet_() {
  return SpreadsheetApp.getActive();
}

/**
 * Получить лист по имени с проверкой.
 */
function getSheet_(name) {
  const ss = getProjectSpreadsheet_();
  const sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error('Лист не найден: ' + name);
  }
  return sheet;
}

/**
 * Получить данные листа как массив объектов по заголовкам 1-й строки.
 * (ЭТА ФУНКЦИЯ МОЖЕТ ПОКА НЕ ИСПОЛЬЗОВАТЬСЯ, ЭТО НОРМАЛЬНО)
 */
function getSheetObjects_(sheet) {
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length < 2) return [];

  const headers = values[0];
  const rows = values.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      if (h) obj[String(h)] = row[i];
    });
    return obj;
  });
}

/**
 * Обновить строку по индексу (1-based) объектом по заголовкам.
 * (МОЖЕТ ПОКА НЕ ИСПОЛЬЗОВАТЬСЯ)
 */
function setSheetObjectRow_(sheet, rowIndex, obj) {
  const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  const headers = range.getValues()[0];

  const row = [];
  for (let i = 0; i < headers.length; i++) {
    const key = String(headers[i] || '');
    row.push(Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : '');
  }
  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
}

/**
 * Парсинг videoId из URL YouTube (на будущее).
 */
function extractVideoId_(url) {
  if (!url) return null;
  const str = String(url).trim();
  // https://youtu.be/VIDEOID
  let m = str.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (m) return m[1];
  // https://www.youtube.com/watch?v=VIDEOID
  m = str.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (m) return m[1];
  return null;
}

