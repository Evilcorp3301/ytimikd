/***************************************
 * ЛОГИ
 ***************************************/

function getLogsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.LOGS);
  if (!sh) throw new Error('Лист "Логи" не найден. Сначала запустите setupProject().');
  return sh;
}

function logAction_(action, link, language, info) {
  let normalizedInfo = info;
  if (action === LOG_EVENT_TYPE.TASK_STARTED && !normalizedInfo) {
    normalizedInfo = 'Статус обновлён на ' + TASK_STATUS.IN_PROGRESS;
  } else if (action === LOG_EVENT_TYPE.TASK_COMPLETED && !normalizedInfo) {
    normalizedInfo = 'Статус обновлён на ' + TASK_STATUS.DONE;
  }

  const sh = getLogsSheet_();
  const ts = new Date();
  sh.appendRow([ts, action, link || '', language || '', normalizedInfo || '']);
}

function getLogs(limit) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.LOGS);
  if (!sh) throw new Error('Лист "Логи" не найден.');

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

