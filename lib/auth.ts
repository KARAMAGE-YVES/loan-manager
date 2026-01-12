import { cookies } from "next/headers";

export async function getAdminSession(): Promise<string | null> {
  const cookieStore = await cookies(); // now we await it
  const cookie = cookieStore.get("admin_session"); // safe now
  return cookie?.value ?? null;
}
