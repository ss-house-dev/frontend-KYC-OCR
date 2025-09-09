import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

// ผู้ใช้ที่เราจะคืนจาก authorize() (ไม่มี any)
type AppUser = User & {
  id: string;
  email: string;
  kycRequestId?: string;
};

const CredentialsSchema = z.object({
  email: z.string().trim().email(),
  companyId: z.string().trim().min(1).optional(),
});

type KycCreateResponse = {
  id?: string; // kycRequestId
  // …ฟิลด์อื่นจาก backend ใส่เพิ่มได้
};

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Email only",
      credentials: {
        email: { label: "Email", type: "email" },
        companyId: { label: "Company ID", type: "text" },
      },
      async authorize(rawCredentials): Promise<AppUser | null> {
        const parsed = CredentialsSchema.safeParse(rawCredentials ?? {});
        if (!parsed.success) {
          console.warn("[authorize] invalid credentials", parsed.error.flatten());
          return null;
        }
        const { email, companyId } = parsed.data;

        const base = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
        if (!base) {
          console.error("[authorize] Missing BACKEND_URL env");
          throw new Error("BACKEND_URL is not configured");
        }
        const finalCompanyId = companyId ?? process.env.BACKEND_COMPANY_ID;
        if (!finalCompanyId) {
          console.error("[authorize] missing companyId (pass via signIn or BACKEND_COMPANY_ID env)");
          return null;
        }

        const url = `${base.replace(/\/+$/, "")}/kyc/requests`;

        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companyId: finalCompanyId, email }),
          });

          if (!res.ok) {
            const bodyText = await res.text().catch(() => "");
            console.warn("[authorize] backend status:", res.status, bodyText);
            return null;
          }

          const data: KycCreateResponse = await res.json().catch(
            () => ({} as KycCreateResponse)
          );
          const kycRequestId = typeof data.id === "string" ? data.id : undefined;

          // ถ้ายังไม่มี userId จริงจาก backend ใช้ email เป็น id ชั่วคราว
          const user: AppUser = { id: email, email, kycRequestId };
          return user;
        } catch (err) {
          console.error("[authorize] error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // user มีค่าเฉพาะครั้งแรกหลัง authorize()
      if (user) {
        const u = user as AppUser; // ✅ cast เป็นชนิดที่เราควบคุม
        token.userId = u.id;
        token.email = u.email ?? token.email;
        if (u.kycRequestId) token.kycRequestId = u.kycRequestId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId; // ✅ type-safe จาก module augmentation
      }
      if (typeof token.kycRequestId === "string") {
        session.kycRequestId = token.kycRequestId;
      }
      return session;
    },
  },
  pages: { signIn: "/user-login" },
};
