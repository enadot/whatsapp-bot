// app/api/groups/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // אפשרות 1: כתובת השרת המקומי
  const res = await fetch("http://localhost:3001/groups");
  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
  const data = await res.json();
  return NextResponse.json(data);
}
