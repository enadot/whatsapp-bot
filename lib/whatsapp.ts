import makeWASocket, { useMultiFileAuthState } from "baileys";

let sock: ReturnType<typeof makeWASocket> | null = null;
let isInitializing = false;

export async function initWhatsApp() {
  if (sock || isInitializing) return sock;
  isInitializing = true;

  const { state, saveCreds } = await useMultiFileAuthState("auth");

  sock = makeWASocket({ auth: state });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      console.log("🔌 חיבור נסגר, מנסה לחדש...");
      sock = null;
      await initWhatsApp(); // נסה להתחבר מחדש
    }

    if (connection === "open") {
      console.log("✅ וואטסאפ מחובר בהצלחה!");
    }
  });

  isInitializing = false;
  return sock;
}
