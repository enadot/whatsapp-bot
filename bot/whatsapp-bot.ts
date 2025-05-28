// 📁 bot/whatsapp-bot.ts
import makeWASocket, { useMultiFileAuthState } from "baileys";
import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import cron from "node-cron";

const PORT = 3001;
const groupJid = "120363395625740712@g.us";

let isReady = false;
let serverStarted = false;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      console.log("🔌 חיבור נסגר, מנסה להתחבר מחדש...");
      startBot();
    }
    if (connection === "open") {
      isReady = true;
      console.log("✅ מחובר לוואטסאפ בהצלחה!");

      // שלוף ושמור את הקבוצות בזיכרון
      const groups = await sock.groupFetchAllParticipating();
      const formattedGroups = Object.values(groups).map((g) => ({
        name: g.subject,
        id: g.id,
      }));
      console.log("📦 קבוצות:", formattedGroups);
    }
  });

  // תזמון ההודעה הקבועה (מוצ"ש וראשון ב-20:30)
  cron.schedule("30 20 * * 0,1", async () => {
    if (!isReady)
      return console.log("⚠️ עדיין לא מחובר לוואטסאפ. לא נשלחה הודעה.");
    await sock.sendMessage(groupJid, {
      text: `📖 שיעור תורה של הרב אליהו נחמני שליט"א\n🕗 מוצ"ש וראשון ב-20:30\n📍 https://meet.google.com/xyz-xyz-xyz`,
    });
    console.log("📤 הודעה נשלחה לקבוצה בהצלחה.");
  });

  // HTTP שרת קטן לשליחה ידנית + סטטוס חיבור
  const server = http.createServer(async (req, res) => {
    if (req.method === "POST" && req.url === "/send") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        try {
          const { text, imagePath } = JSON.parse(body);
          if (!text && !imagePath) {
            res.writeHead(400);
            return res.end("Missing 'text' or 'imagePath' field");
          }

          if (!isReady) {
            res.writeHead(503);
            return res.end("⚠️ WhatsApp עדיין לא מחובר. נסה שוב בעוד רגע.");
          }

          // שליחה עם תמונה (אם יש)
          if (imagePath) {
            const buffer = fs.readFileSync(imagePath);
            await sock.sendMessage(groupJid, {
              image: buffer,
              caption: text || "",
            });
            res.writeHead(200, { "Content-Type": "text/plain" });
            return res.end("✅ תמונה נשלחה");
          }

          // שליחה רגילה (טקסט בלבד)
          await sock.sendMessage(groupJid, { text });
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("✅ הודעה נשלחה");
          console.log("📤 נשלחה הודעה ידנית:", text);
        } catch (err) {
          console.error("❌ שגיאה בשליחה:", err);
          res.writeHead(500);
          res.end("שגיאה פנימית");
        }
      });
    } else if (req.method === "GET" && req.url === "/status") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ connected: isReady }));
    } else if (req.method === "GET" && req.url === "/groups") {
      if (!isReady) {
        res.writeHead(503);
        return res.end("⚠️ WhatsApp עדיין לא מחובר.");
      }

      const groups = await sock.groupFetchAllParticipating();
      const groupList = Object.values(groups).map((g) => ({
        name: g.subject,
        id: g.id,
      }));

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(groupList, null, 2));
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  if (!serverStarted) {
    server.listen(PORT, () => {
      serverStarted = true;
      console.log(`🚀 WhatsApp Bot Ready on http://localhost:${PORT}`);
    });
  }
}

startBot();
