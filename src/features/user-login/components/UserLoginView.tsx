"use client";
import BrandLogo from "./BrandLogo";

type Props = {
  email: string;
  error: string | null;
  onEmailChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function UserLoginView({
  email,
  error,
  onEmailChange,
  onSubmit,
}: Props) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <BrandLogo />

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm text-black">Email</label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="Enter your E-mail"
            value={email}
            onChange={(e) => onEmailChange(e.target.value.trim())}
            className="w-full rounded-sm border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-sm bg-gradient-to-b from-[#2a5bf6] to-[#1a4bd6] py-3 text-white font-medium shadow-md"
          >
            Login
          </button>
        </form>

        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M12 2a6 6 0 00-6 6v2H5a1 1 0 00-1 1v10a1 1 0 001 1h14a1 1 0 001-1V11a1 1 0 00-1-1h-1V8a6 6 0 00-6-6zm-4 8V8a4 4 0 118 0v2H8z" />
          </svg>
          <span>Your information is secure and encrypted</span>
        </div>
      </div>
    </div>
  );
}
