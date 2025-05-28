"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  QrCode,
  Send,
  Users,
  Wifi,
  WifiOff,
  RefreshCw,
  MessageCircle,
  Clock,
  BookOpen,
} from "lucide-react";

interface WhatsAppState {
  connected: boolean;
  qrCode: string | null;
  loading: boolean;
  error: string | null;
  groups: Array<{ id: string; name: string; participants: number }>;
}

export default function WhatsAppInterface() {
  const [whatsappState, setWhatsappState] = useState<WhatsAppState>({
    connected: false,
    qrCode: null,
    loading: false,
    error: null,
    groups: [],
  });

  const [selectedGroup, setSelectedGroup] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  // טעינת סטטוס וטסאפ
  const loadWhatsAppStatus = async () => {
    try {
      const response = await fetch("/api/whatsapp/status");
      const data = await response.json();
      setWhatsappState(data);
    } catch (error) {
      console.error("שגיאה בטעינת סטטוס:", error);
    }
  };

  // התחברות לוואטסאפ
  const connectWhatsApp = async () => {
    setWhatsappState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/api/whatsapp/connect", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "שגיאה בחיבור");
      }

      // התחל polling לסטטוס
      startStatusPolling();
    } catch (error) {
      setWhatsappState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "שגיאה לא ידועה",
      }));
    }
  };

  // נתק מווטסאפ
  const disconnectWhatsApp = async () => {
    try {
      await fetch("/api/whatsapp/disconnect", { method: "POST" });
      setWhatsappState({
        connected: false,
        qrCode: null,
        loading: false,
        error: null,
        groups: [],
      });
      toast.success("התנתקת מווטסאפ");
    } catch (error) {
      toast.error("שגיאה בהתנתקות");
    }
  };

  // polling לסטטוס
  const startStatusPolling = () => {
    const interval = setInterval(async () => {
      await loadWhatsAppStatus();

      // עצור polling אם מחובר או יש שגיאה
      if (whatsappState.connected || whatsappState.error) {
        clearInterval(interval);
      }
    }, 2000);

    // עצור אחרי 5 דקות
    setTimeout(() => clearInterval(interval), 300000);
  };

  // שליחת הודעה
  const sendMessage = async () => {
    if (!selectedGroup) {
      toast.error("בחר קבוצה");
      return;
    }

    if (!message.trim() && !image) {
      toast.error("הזן הודעה או בחר תמונה");
      return;
    }

    setSending(true);

    try {
      const formData = new FormData();
      formData.append("groupId", selectedGroup);
      formData.append("text", message);
      if (image) {
        formData.append("image", image);
      }

      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("שגיאה בשליחה");
      }

      toast.success("הודעה נשלחה בהצלחה!");
      setMessage("");
      setImage(null);
    } catch (error) {
      toast.error("שגיאה בשליחת הודעה");
    } finally {
      setSending(false);
    }
  };

  // שליחת הודעת שיעור תורה
  const sendTorahLessonMessage = async () => {
    if (!selectedGroup) {
      toast.error("בחר קבוצה");
      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/whatsapp/send-torah-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: selectedGroup }),
      });

      if (!response.ok) {
        throw new Error("שגיאה בשליחה");
      }

      toast.success("הודעת שיעור תורה נשלחה!");
    } catch (error) {
      toast.error("שגיאה בשליחת הודעה");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    loadWhatsAppStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* כותרת */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🕎 מערכת הודעות וואטסאפ לשיעורי תורה
          </h1>
          <p className="text-gray-600">
            שיעורי הרב אליהו נחמני שליט"א - מוצ"ש וראשון ב-20:30
          </p>
        </div>

        {/* סטטוס חיבור */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {whatsappState.connected ? (
                <Wifi className="text-green-600" />
              ) : (
                <WifiOff className="text-red-600" />
              )}
              סטטוס חיבור
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant={whatsappState.connected ? "default" : "destructive"}
                >
                  {whatsappState.connected ? "מחובר" : "לא מחובר"}
                </Badge>
                {whatsappState.groups.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Users size={14} />
                    {whatsappState.groups.length} קבוצות
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                {!whatsappState.connected ? (
                  <Button
                    onClick={connectWhatsApp}
                    disabled={whatsappState.loading}
                    className="flex items-center gap-2"
                  >
                    {whatsappState.loading && (
                      <RefreshCw size={16} className="animate-spin" />
                    )}
                    התחבר לווטסאפ
                  </Button>
                ) : (
                  <Button
                    onClick={disconnectWhatsApp}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    התנתק
                  </Button>
                )}

                <Button
                  onClick={loadWhatsAppStatus}
                  variant="outline"
                  size="icon"
                >
                  <RefreshCw size={16} />
                </Button>
              </div>
            </div>

            {/* שגיאה */}
            {whatsappState.error && (
              <Alert variant="destructive">
                <AlertDescription>{whatsappState.error}</AlertDescription>
              </Alert>
            )}

            {/* QR קוד */}
            {whatsappState.qrCode && (
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <QrCode size={16} />
                  סרוק את הקוד עם וואטסאפ שלך
                </div>
                <div className="flex justify-center">
                  <img
                    src={whatsappState.qrCode}
                    alt="QR Code"
                    className="max-w-64 border rounded-lg shadow-sm"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* שליחת הודעות */}
        {whatsappState.connected && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* הודעה כללית */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="text-blue-600" />
                  שליחת הודעה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קבוצה..." />
                  </SelectTrigger>
                  <SelectContent>
                    {whatsappState.groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{group.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {group.participants}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="כתוב הודעה..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />

                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                />

                <Button
                  onClick={sendMessage}
                  disabled={sending || !selectedGroup}
                  className="w-full flex items-center gap-2"
                >
                  {sending ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  שלח הודעה
                </Button>
              </CardContent>
            </Card>

            {/* הודעת שיעור תורה */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="text-purple-600" />
                  הודעת שיעור תורה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">תוכן ההודעה:</h3>
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    📖 שיעור תורה של הרב אליהו נחמני שליט"א{"\n"}
                    🕗 מוצ"ש וראשון ב-20:30{"\n"}
                    📍 https://meet.google.com/xyz-xyz-xyz{"\n\n"}
                    מוזמנים להצטרף לשיעור המועשר והמחזק 🙏
                  </div>
                </div>

                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קבוצה..." />
                  </SelectTrigger>
                  <SelectContent>
                    {whatsappState.groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{group.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {group.participants}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={sendTorahLessonMessage}
                  disabled={sending || !selectedGroup}
                  className="w-full flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  {sending ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <BookOpen size={16} />
                  )}
                  שלח הודעת שיעור תורה
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* תזמון אוטומטי */}
        {whatsappState.connected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="text-orange-600" />
                תזמון אוטומטי
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  המערכת תשלח אוטומטית הודעות שיעור תורה במוצ"ש וראשון ב-20:30
                  {selectedGroup &&
                    ` לקבוצה: ${
                      whatsappState.groups.find((g) => g.id === selectedGroup)
                        ?.name
                    }`}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
