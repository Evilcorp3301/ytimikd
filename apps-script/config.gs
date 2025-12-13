/***************************************
 * ГЛОБАЛЬНЫЕ КОНСТАНТЫ ПРОЕКТА
 ***************************************/

// Названия листов
const SHEETS = {
  REF: 'Языковые дефолты',
  MAIN_FORM: 'Основная_Форма',
  QUEUE_FORM: 'Очередь_Форма',
  QUEUE: 'Очередь',
  QUEUE_LANGS: 'QueueLanguages',
  DB: 'База данных',
  LOGS: 'Логи',
  DASH: 'Панель управления',
  SETTINGS: 'Настройки'
};

// Индекс столбца "Статус" в листе Очередь
const STATUS_COL = 9;


const BASE_SHEET_NAME = 'Лист1';

// Рабочие языки проекта (можно расширять)
const LANGS = ['EN', 'ES', 'RU', 'DE', 'FR', 'PT'];

// Стартовая строка для таблицы языков в "Языковые дефолты"
const REF_LANG_START_ROW = 10;

// Ключ для кэша темы веб-интерфейса
const WEB_THEME_PROP_KEY = 'WEB_THEME_CACHE';

/***************************************
 * СТАТУСЫ ЗАДАЧ И ЯЗЫКОВ (пока просто константы, можно не использовать)
 ***************************************/

const TASK_STATUS = {
  NEW: 'Новый',
  IN_PROGRESS: 'В работе',
  DONE: 'Выполнено',
  CANCELLED: 'Отменён'
};

const LANG_STATUS = {
  REQUIRED: 'Нужно',
  IN_PROGRESS: 'В работе',
  DONE: 'Готово',
  CANCELLED: 'Отменён'
};

/***************************************
 * ТИПЫ СОБЫТИЙ ЛОГОВ (пока просто константы, можно не использовать)
 ***************************************/
const LOG_EVENT_TYPE = {
  TASK_ADDED: 'TASK_ADDED',
  TASK_STARTED: 'TASK_STARTED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_CANCELLED: 'TASK_CANCELLED',
  LANGUAGE_ADDED: 'LANGUAGE_ADDED',
  LANGUAGE_DONE: 'LANGUAGE_DONE',
  TRANSLATION_ADDED: 'TRANSLATION_ADDED',
  DEFAULTS_UPDATED: 'DEFAULTS_UPDATED',
  ERROR: 'ERROR'
};

const LOG_EVENT_CATEGORY = {
  ACTION: 'ACTION',
  ERROR: 'ERROR',
  SYSTEM: 'SYSTEM'
};

/***************************************
 * НАСТРОЙКИ TELEGRAM (КАРКАС)
 ***************************************/
const TELEGRAM_SETTINGS_SHEET = 'TelegramSettings';

