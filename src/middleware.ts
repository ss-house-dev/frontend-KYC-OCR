export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/id-accept",
    "/scan-id-card",
    "/preview-id-card",
    "/face-accept",
    "/scan-face",
    "/book-bank-accept",
    "/preview-book-bank",
    "/face-verification",
  ],
};
