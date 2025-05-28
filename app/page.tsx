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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
ע
export default function WhatsAppSender() {
  const [groups, setGroups] = useState<{ name: string; id: string }[]>([]);
  const [groupId, setGroupId] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/groups")
      .then((res) => res.json())
      .then(setGroups)
      .catch(() => toast.error("לא ניתן לטעון קבוצות"));
  }, []);

  const handleSend = async () => {
    if (!groupId) return toast.error("בחר קבוצה");
    if (!text && !image) return toast.error("הזן הודעה או בחר תמונה");
    setSending(true);

    const formData = new FormData();
    formData.append("groupId", groupId);
    if (text) formData.append("text", text);
    if (image) formData.append("image", image);

    const res = await fetch("/send", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      toast.success("נשלח בהצלחה");
      setText("");
      setImage(null);
    } else {
      toast.error((await res.text()) || "שגיאה בשליחה");
    }
    setSending(false);
  };

  return (
    <Card className="max-w-md mx-auto mt-12">
      <CardContent className="space-y-4 p-6">
        <Select onValueChange={setGroupId} value={groupId}>
          <SelectTrigger>
            <SelectValue placeholder="בחר קבוצה..." />
          </SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          placeholder="כתוב הודעה..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />
        <Button onClick={handleSend} disabled={sending} className="w-full">
          {sending ? "שולח..." : "שלח"}
        </Button>
      </CardContent>
    </Card>
  );
}
