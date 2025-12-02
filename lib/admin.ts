import { cookies } from "next/headers";

export async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");

  if (!token) return false;

  // Simple token validation (in production, use JWT)
  try {
    const decoded = Buffer.from(token.value, "base64").toString();
    return decoded.startsWith("admin:");
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}

