import { differenceInHours, differenceInMinutes } from "date-fns";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export type UrgencyLevel = "normal" | "warning" | "urgent";

/**
 * Определяет уровень срочности запланированной даты относительно текущего времени.
 *
 * @param scheduledDate - Запланированная дата
 * @param currentTime - Текущее время (по умолчанию new Date())
 * @returns Уровень срочности: "urgent" (≤2 часа), "warning" (≤12 часов), "normal" (>12 часов)
 */
export function getUrgencyLevel(
  scheduledDate: Date | null | undefined,
  currentTime: Date = new Date()
): UrgencyLevel {
  if (!scheduledDate) return "normal";

  const scheduled = new Date(scheduledDate);
  const now = new Date(currentTime);

  // Если дата уже прошла, считаем срочным
  if (scheduled.getTime() <= now.getTime()) {
    return "urgent";
  }

  const hoursUntil = differenceInHours(scheduled, now);

  if (hoursUntil <= 2) return "urgent";
  if (hoursUntil <= 12) return "warning";
  return "normal";
}

/**
 * Форматирует время до запланированной даты в читаемый формат.
 *
 * @param scheduledDate - Запланированная дата
 * @param currentTime - Текущее время (по умолчанию new Date())
 * @returns Строка вида "через X мин", "через X ч" или "dd.MM в HH:mm"
 */
export function getTimeUntilString(
  scheduledDate: Date | null | undefined,
  currentTime: Date = new Date()
): string {
  if (!scheduledDate) return "";

  const scheduled = new Date(scheduledDate);
  const now = new Date(currentTime);

  const minutesUntil = differenceInMinutes(scheduled, now);
  const hoursUntil = differenceInHours(scheduled, now);

  if (minutesUntil < 60) {
    return `через ${minutesUntil} мин`;
  }
  if (hoursUntil < 24) {
    return `через ${hoursUntil} ч`;
  }
  return format(scheduled, "dd.MM в HH:mm", { locale: ru });
}
