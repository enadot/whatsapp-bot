// lib/whatsapp-manager.ts
import makeWASocket, {
  useMultiFileAuthState,
  ConnectionState,
  DisconnectReason,
  GroupMetadata,
} from "baileys";
import * as qrcode from "qrcode";
import { EventEmitter } from "events";

export interface WhatsAppState {
  connected: boolean;
  qrCode: string | null;
  loading: boolean;
  error: string | null;
  groups: Array<{ id: string; name: string; participants: number }>;
}

class WhatsAppManager extends EventEmitter {
  private sock: ReturnType<typeof makeWASocket> | null = null;
  private state: WhatsAppState = {
    connected: false,
    qrCode: null,
    loading: false,
    error: null,
    groups: [],
  };
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    super();
  }

  getState(): WhatsAppState {
    return { ...this.state };
  }

  private setState(updates: Partial<WhatsAppState>) {
    this.state = { ...this.state, ...updates };
    this.emit("stateChange", this.state);
  }

  async connect(): Promise<void> {
    if (this.sock && this.state.connected) {
      return;
    }

    this.setState({ loading: true, error: null, qrCode: null });

    try {
      const { state, saveCreds } = await useMultiFileAuthState("auth");

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        getMessage: async () => ({ conversation: "היי" }),
      });

      this.sock.ev.on("creds.update", saveCreds);

      this.sock.ev.on("connection.update", async (update) => {
        await this.handleConnectionUpdate(update);
      });

      this.sock.ev.on("groups.update", (updates) => {
        this.loadGroups();
      });
    } catch (error) {
      console.error("שגיאה בחיבור לווטסאפ:", error);
      this.setState({
        loading: false,
        error: "שגיאה בחיבור לווטסאפ",
        connected: false,
      });
    }
  }

  private async handleConnectionUpdate(update: any) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        const qrCodeDataURL = await qrcode.toDataURL(qr);
        this.setState({ qrCode: qrCodeDataURL, loading: false });
      } catch (error) {
        console.error("שגיאה ביצירת QR:", error);
        this.setState({ error: "שגיאה ביצירת קוד QR" });
      }
    }

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as any)?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log(
        "🔌 חיבור נסגר:",
        lastDisconnect?.error,
        "מנסה להתחבר מחדש:",
        shouldReconnect
      );

      this.setState({
        connected: false,
        qrCode: null,
        loading: false,
      });

      if (
        shouldReconnect &&
        this.reconnectAttempts < this.maxReconnectAttempts
      ) {
        this.reconnectAttempts++;
        console.log(
          `מנסה התחברות מחדש (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        );
        setTimeout(() => this.connect(), 5000);
      } else {
        this.setState({
          error: shouldReconnect ? "נכשל בהתחברות מחדש" : "התנתקת מווטסאפ",
          loading: false,
        });
      }
    }

    if (connection === "open") {
      console.log("✅ מחובר לווטסאפ בהצלחה!");
      this.reconnectAttempts = 0;
      this.setState({
        connected: true,
        loading: false,
        qrCode: null,
        error: null,
      });

      // טען קבוצות לאחר חיבור מוצלח
      await this.loadGroups();
    }
  }

  async loadGroups(): Promise<void> {
    if (!this.sock || !this.state.connected) {
      return;
    }

    try {
      const groups = await this.sock.groupFetchAllParticipating();
      const groupList = Object.values(groups).map((group: GroupMetadata) => ({
        id: group.id,
        name: group.subject || "קבוצה ללא שם",
        participants: group.participants?.length || 0,
      }));

      this.setState({ groups: groupList });
      console.log(`נטענו ${groupList.length} קבוצות`);
    } catch (error) {
      console.error("שגיאה בטעינת קבוצות:", error);
      this.setState({ error: "שגיאה בטעינת קבוצות" });
    }
  }

  async sendMessage(
    groupId: string,
    text: string,
    imageBuffer?: Buffer
  ): Promise<boolean> {
    if (!this.sock || !this.state.connected) {
      throw new Error("לא מחובר לווטסאפ");
    }

    try {
      if (imageBuffer) {
        await this.sock.sendMessage(groupId, {
          image: imageBuffer,
          caption: text || "",
        });
      } else {
        await this.sock.sendMessage(groupId, { text });
      }

      console.log("📤 הודעה נשלחה בהצלחה");
      return true;
    } catch (error) {
      console.error("שגיאה בשליחת הודעה:", error);
      throw new Error("שגיאה בשליחת הודעה");
    }
  }

  disconnect() {
    if (this.sock) {
      this.sock.end(undefined);
      this.sock = null;
    }
    this.setState({
      connected: false,
      qrCode: null,
      loading: false,
      groups: [],
    });
  }

  // פונקציה לשליחת הודעת שיעור תורה
  async sendTorahLessonMessage(groupId: string): Promise<boolean> {
    const message = `📖 שיעור תורה של הרב אליהו נחמני שליט"א
🕗 מוצ"ש וראשון ב-20:30
📍 https://meet.google.com/xyz-xyz-xyz

מוזמנים להצטרף לשיעור המועשר והמחזק 🙏`;

    return await this.sendMessage(groupId, message);
  }
}

// יצירת instance יחיד
export const whatsappManager = new WhatsAppManager();
