import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Email only",
      credentials: {
        email: { label: "Email", type: "email" },
        companyId: { label: "Company ID", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        const companyId =
          credentials?.companyId ?? process.env.BACKEND_COMPANY_ID;

        if (!email) {
          console.warn("[authorize] missing email");
          return null;
        }
        if (!companyId) {
          console.error("[authorize] missing companyId (pass via signIn or BACKEND_COMPANY_ID env)");
          return null;
        }

        const base =
          process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
        if (!base) {
          console.error("[authorize] Missing BACKEND_URL env");
          throw new Error("BACKEND_URL is not configured");
        }

        const url = `${base.replace(/\/+$/, "")}/kyc/requests`;

        try {
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ companyId, email }),
          });

          if (!res.ok) {
            const bodyText = await res.text().catch(() => "");
            console.warn("[authorize] backend status:", res.status, bodyText);
            return null; 
          }

          const data = await res.json().catch(() => ({}));

          // ✅ จุดสำคัญ:
          // /kyc/requests ของคุณน่าจะคืน "KYC request id" (ไม่ใช่ user id)
          // เราจะ:
          //  - ใช้ email เป็น user id ชั่วคราว (ให้ระบบวิ่งได้)
          //  - เก็บ kycRequestId ไว้ใน token/session เพื่อนำไปใช้ต่อ
          const kycRequestId = data?.id;
          const userId = email; // หรือถ้าคุณมี endpoint user จริง ให้เปลี่ยนเป็น user.id ที่ backend คืนมา

          return {
            id: userId,
            email,
            kycRequestId, // จะย้ายไปเก็บใน token/session ใน callbacks ด้านล่าง
          };
        } catch (err) {
          console.error("[authorize] error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).id;
        token.email = (user as any).email;
        token.kycRequestId = (user as any).kycRequestId; // เก็บต่อใน JWT
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId;
      }
      (session as any).kycRequestId = token.kycRequestId; // expose ไปที่ session
      return session;
    },
  },
  pages: { signIn: "/user-login" },
};
