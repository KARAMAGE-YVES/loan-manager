import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const adminId = await getAdminSession(); // <- await it
  return NextResponse.json({ loggedIn: !!adminId });
}
