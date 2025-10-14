import { Suspense } from "react";
import { NotFoundClient } from "./NotFoundClient";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
      <p className="text-gray-600 mb-4">
        The page you’re looking for doesn’t exist or has moved.
      </p>
      <Suspense fallback={null}>
        <NotFoundClient />
      </Suspense>
    </main>
  );
}
