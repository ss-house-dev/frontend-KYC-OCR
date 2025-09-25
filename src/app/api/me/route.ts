import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  console.log("🔍 Session from server:", session);

  return Response.json({
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    kycRequestId: session?.kycRequestId ?? null,
    authenticated: Boolean(session),
  });
}

