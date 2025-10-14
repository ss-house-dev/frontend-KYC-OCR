// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// หน้า auth ของโปรเจกต์นี้
const AUTH_PAGE_REGEX = /^\/(user-login|sign-in|sign-up)?$/;

// เพจ/โฟลเดอร์ที่ต้องล็อกอิน (กันพิมพ์ URL ตรงด้วย)
const PROTECTED_PREFIXES = [
  "/id-accept",
  "/scan-id-card",
  "/preview-id-card",
  "/face-accept",
  "/scan-face",
  "/face-verification",
  "/book-bank-accept",
  "/book-bank-crop",
  "/preview-book-bank",
  "/verification-complete",
  // ถ้ามีแดชบอร์ดก็ใส่เพิ่มได้ เช่น "/admin-dashboard"
];

export default withAuth(
  (req: NextRequest & { nextauth: { token?: any } }) => {
    const { pathname, search } = req.nextUrl;
    const isAuth = !!req.nextauth.token;

    const isAuthPage = AUTH_PAGE_REGEX.test(pathname);
    const isProtected = PROTECTED_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );

    if (!isAuth && isProtected) {
      const url = req.nextUrl.clone();
      url.pathname = "/user-login";
      url.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.rewrite(url);
    }

    if (isAuth && isAuthPage) {
      const kycStepRaw = req.cookies.get("kycStep")?.value ?? "";
      const kycStep = decodeURIComponent(kycStepRaw);

      const url = req.nextUrl.clone();

      // (เดิม) ถ้าจบ preview-id-card → face-accept
      if (kycStep === "/preview-id-card") {
        url.pathname = "/face-accept";
        url.search = "";
        return NextResponse.redirect(url);
      }

      // (เดิม) ถ้าจบ face-verification → book-bank-accept
      if (kycStep === "/face-verification") {
        url.pathname = "/book-bank-accept";
        url.search = "";
        return NextResponse.redirect(url);
      }

      // ✅ ใหม่: ถ้าจบ book-bank-accept → verification-complete
      if (kycStep === "/book-bank-accept") {
        url.pathname = "/verification-complete";
        url.search = "";
        return NextResponse.redirect(url);
      }

      // fallback เดิม
      url.pathname = "/id-accept";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: { authorized: () => true },
  }
);

// กัน asset/_next/api ออก ไม่ให้โดน middleware เก็บทุกอย่าง
export const config = {
  matcher: ["/((?!_next|api|static|.*\\..*).*)"],
};
