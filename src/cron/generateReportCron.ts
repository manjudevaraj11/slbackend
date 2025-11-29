import cron from "node-cron";
import { sendContactSheet } from "../services/sendContactSheet.js";
import { sendQuoteRequestSheet } from "../services/sendQuoteRequestSheet.js";

cron.schedule("*/1 * * * *", async () => {
  console.log("[CRON] Running 15-minute exports...");
  console.log(
    "============= Started report export for contact sheet =============",
  );
  await sendContactSheet();
  console.log(
    "============= Ended report export for contact sheet =============",
  );
  console.log(
    "============= Started report export for get quote sheet =============",
  );
  await sendQuoteRequestSheet();
  console.log(
    "============= Ended report export for get quote sheet =============",
  );
  console.log("[CRON] Completed export cycle\n");
});
