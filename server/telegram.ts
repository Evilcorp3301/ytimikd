import { storage } from "./storage";
import { log } from "./index";

export async function sendTelegramNotification(message: string): Promise<boolean> {
  try {
    const allSettings = await storage.getSettings();
    const botTokenSetting = allSettings.find((s) => s.key === "telegramBotToken");
    const chatIdSetting = allSettings.find((s) => s.key === "telegramChatId");
    const notifyScheduleWarningSetting = allSettings.find((s) => s.key === "notifyScheduleWarning");

    const botToken = botTokenSetting?.value as string;
    const chatId = chatIdSetting?.value as string;
    const notifyEnabled = notifyScheduleWarningSetting?.value !== false;

    if (!botToken || !chatId || !notifyEnabled) {
      log("Telegram notification skipped: missing credentials or disabled", "telegram");
      return false;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      log(`Telegram API error: ${JSON.stringify(errorData)}`, "telegram");
      return false;
    }

    log(`Telegram notification sent successfully`, "telegram");
    return true;
  } catch (error) {
    log(`Failed to send Telegram notification: ${error}`, "telegram");
    return false;
  }
}

async function getNotifiedTranslations(): Promise<Set<string>> {
  const setting = await storage.getSetting("notifiedTranslations");
  if (setting && Array.isArray(setting.value)) {
    return new Set(setting.value as string[]);
  }
  return new Set();
}

async function markTranslationNotified(translationId: string, scheduledDateStr: string): Promise<void> {
  const notified = await getNotifiedTranslations();
  const key = `${translationId}:${scheduledDateStr}`;
  notified.add(key);
  await storage.upsertSetting("notifiedTranslations", Array.from(notified));
}

async function isTranslationNotified(translationId: string, scheduledDateStr: string): Promise<boolean> {
  const notified = await getNotifiedTranslations();
  return notified.has(`${translationId}:${scheduledDateStr}`);
}

export async function checkScheduledTranslationsAndNotify(): Promise<void> {
  try {
    const translations = await storage.getTranslations({ scheduled: true });
    const now = new Date();

    for (const translation of translations) {
      if (!translation.scheduledDate) continue;

      const scheduledDate = new Date(translation.scheduledDate);
      const scheduledDateStr = scheduledDate.toISOString();
      const hoursUntil = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // If the scheduled time has arrived (or passed), consider it published automatically:
      // - Remove it from "План" by clearing scheduledDate
      // - Set publishedDate once (so it appears in "История")
      // This matches product logic: no "overdue" state; scheduled items auto-transition.
      if (hoursUntil <= 0) {
        // If there's no translatedUrl yet, we can't link to anything; keep it in the plan.
        if (!translation.translatedUrl) continue;

        await storage.updateTranslation(translation.id, {
          publishedDate: translation.publishedDate ? new Date(translation.publishedDate) : now,
          scheduledDate: null,
          status: "completed",
        } as any);

        // If all translations for the video are completed and none are scheduled anymore, auto-archive the video.
        const videoId = translation.videoId;
        const video = await storage.getVideo(videoId);
        if (video && !video.isArchived) {
          const hasAnySchedule = video.translations.some((t) => Boolean(t.scheduledDate));
          const allCompleted = video.translations.length > 0 && video.translations.every((t) => t.status === "completed");
          if (allCompleted && !hasAnySchedule) {
            await storage.archiveVideo(video.id, "auto");
          }
        }

        continue;
      }

      if (hoursUntil > 0 && hoursUntil < 2) {
        const alreadyNotified = await isTranslationNotified(translation.id, scheduledDateStr);
        
        if (!alreadyNotified) {
          const videoTitle = translation.video?.title || "Untitled video";
          const language = translation.language;
          const channelName = translation.channel?.name || "Unknown channel";
          const timeLeft = hoursUntil < 1 
            ? `${Math.round(hoursUntil * 60)} minutes` 
            : `${hoursUntil.toFixed(1)} hours`;

          const message = `⚠️ <b>Urgent: Publication deadline approaching!</b>\n\n` +
            `📹 <b>Video:</b> ${videoTitle}\n` +
            `🌐 <b>Language:</b> ${language}\n` +
            `📺 <b>Channel:</b> ${channelName}\n` +
            `⏰ <b>Time remaining:</b> ${timeLeft}\n\n` +
            `Please complete the translation and publish soon!`;

          const sent = await sendTelegramNotification(message);
          if (sent) {
            await markTranslationNotified(translation.id, scheduledDateStr);
            log(`Sent urgent notification for translation ${translation.id}`, "telegram");
          }
        }
      }
    }
  } catch (error) {
    log(`Error checking scheduled translations: ${error}`, "telegram");
  }
}
