import cron from "node-cron";
import { initWhatsApp } from "@/lib/whatsapp";

const groupJid = "1203630xxxxxx@g.us"; // קוד הקבוצה שלך מוואטסאפ

export async function startScheduler() {
  const sock = await initWhatsApp();

  cron.schedule("30 20 * * 0,1", async () => {
    await sock?.sendMessage(groupJid, {
      text: '📖 שיעור תורה של הרב אליהו נחמני שליט"א\n🕗 מוצ"ש וראשון ב-20:30\n📍 https://meet.google.com/xyz-xyz-xyz',
    });
    console.log("הודעה נשלחה");
  });
}
