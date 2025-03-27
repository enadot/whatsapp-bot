import { NextResponse } from "next/server";
import { initWhatsApp } from "@/lib/whatsapp";
import makeWASocket, { useMultiFileAuthState } from "baileys";
import * as qrcode from "qrcode";
import { initApp } from "@/lib/init";

export async function GET() {
  await initApp();
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  let qrData = "";
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    getMessage: async () => ({ conversation: "היי" }),
  });

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", async (update) => {
    if (update.qr) {
      qrData = await qrcode.toDataURL(update.qr);
    }
  });

  // מחכים שנייה שיווצר QR
  await new Promise((res) => setTimeout(res, 1000));

  return NextResponse.json({ qr: qrData });
}
