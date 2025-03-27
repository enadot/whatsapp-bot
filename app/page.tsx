"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/qr")
      .then((res) => res.json())
      .then((data) => setQr(data.qr));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">חיבור וואטסאפ</h1>
      {qr ? <img src={qr} alt="QR Code" /> : <p>טוען קוד...</p>}
    </main>
  );
}
