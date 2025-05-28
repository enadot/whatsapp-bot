// app/api/send/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // קריאת נתוני הטופס
  const formData = await req.formData();
  const groupId = formData.get("groupId");
  const text = formData.get("text");
  const image = formData.get("image");

  if (!groupId || (!text && !image)) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  // בניית POST לשרת הוואטסאפ
  const fetchOptions: any = {
    method: "POST",
    body: formData,
  };

  // שולח לשרת Node בלוקלי
  const res = await fetch("http://localhost:3001/send", fetchOptions);
  const responseText = await res.text();
  if (res.ok) {
    return NextResponse.json({ message: responseText });
  } else {
    return NextResponse.json({ error: responseText }, { status: 500 });
  }
}
