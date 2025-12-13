/***************************************
 * ПАНЕЛЬ УПРАВЛЕНИЯ
 ***************************************/

function getDashboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const db = ss.getSheetByName(SHEETS.DB);
  const queue = ss.getSheetByName(SHEETS.QUEUE);
  if (!db || !queue) {
    throw new Error('Листы "База данных" или "Очередь" не найдены. Запустите setupProject().');
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

