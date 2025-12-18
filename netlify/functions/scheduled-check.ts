// Netlify Scheduled Function for checking scheduled translations
// Runs every minute via Netlify Scheduled Functions
// 
// To enable this function in Netlify:
// 1. Go to Netlify Dashboard → Functions → Scheduled functions
// 2. Add a new scheduled function:
//    - Function: scheduled-check
//    - Schedule: * * * * * (every minute)
//    - Or use Netlify's UI to configure the schedule
import type { Handler } from "@netlify/functions";
import { checkScheduledTranslationsAndNotify } from "../../server/telegram";

export const handler: Handler = async (event, context) => {
  try {
    console.log("Running scheduled check for translations...");
    await checkScheduledTranslationsAndNotify();
    console.log("Scheduled check completed successfully");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Scheduled check completed" }),
    };
  } catch (error) {
    console.error("Error in scheduled check:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Scheduled check failed",
        message: error instanceof Error ? error.message : String(error)
      }),
    };
  }
};
