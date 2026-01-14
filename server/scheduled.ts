import { storage } from "./storage";
import { log } from "./index";
import type { InsertTranslation } from "@shared/schema";

/**
 * Checks scheduled translations and automatically transitions them from "План" to "История"
 * when their scheduled date arrives.
 *
 * This function runs every minute via cron job in server/index.ts.
 * It removes scheduledDate and sets publishedDate when the scheduled time arrives.
 */
export async function checkScheduledTranslations(): Promise<void> {
  try {
    const translations = await storage.getTranslations({ scheduled: true });
    const now = new Date();

    for (const translation of translations) {
      if (!translation.scheduledDate) continue;

      const scheduledDate = new Date(translation.scheduledDate);
      const hoursUntil = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // If the scheduled time has arrived (or passed), transition from "План" to "История":
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
        } as Partial<InsertTranslation>);

        log(
          `Auto-transitioned translation ${translation.id} from scheduled to published`,
          "scheduled"
        );
      }
    }
  } catch (error) {
    log(`Error checking scheduled translations: ${error}`, "scheduled");
  }
}
