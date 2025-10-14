import "dotenv/config";

export async function GET() {
  console.log("🔍 NEXT_PUBLIC_COMPANY_ID from server:", process.env.NEXT_PUBLIC_COMPANY_ID);

  return Response.json({
    companyId: process.env.NEXT_PUBLIC_COMPANY_ID ?? null,
  });
}
