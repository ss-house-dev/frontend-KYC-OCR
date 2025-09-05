import {
  SubmitHandler,
  UseFormRegister,
  UseFormHandleSubmit,
  FieldErrors,
} from "react-hook-form";
import BrandLogo from "./BrandLogo";
import { Label, Input, Button } from "@/components/ui";

type Inputs = { email: string };

type Props = {
  error: string | null;
  errors: FieldErrors<Inputs>;
  register: UseFormRegister<Inputs>;
  handleSubmit: UseFormHandleSubmit<Inputs>;
  onSubmit: SubmitHandler<Inputs>;
};

export default function UserLoginView({
  error,
  errors,
  handleSubmit,
  register,
  onSubmit,
}: Props) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <BrandLogo />

        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-2"
        >
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Enter your E-mail"
            className="bg-white"
            {...register("email", {
              required: "กรุณากรอกอีเมล",
              pattern: {
                value: /.+@.+\..+/,
                message: "กรุณากรอกอีเมลให้ถูกต้อง",
              },
            })}
          />

          {/* ข้อความจาก Zod/RHF */}
          {errors.email && (
            <p className="text-sm text-red-600">
              {String(errors.email.message)}
            </p>
          )}

          {/* ข้อความ error ฝั่งเซิร์ฟเวอร์ (ถ้ามี) */}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="mt-6">
            <Button variant="brand" size="brand" fullWidth type="submit">
              Login
            </Button>
          </div>
        </form>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
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
