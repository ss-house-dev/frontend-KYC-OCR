
import Image from "next/image";

export default function BrandLogo() {
  return (
    <div className="mb-9 flex justify-center select-none">
      <div className="relative h-16 w-[360px] sm:h-20 sm:w-[460px] flex items-center justify-center">
        <Image
          src="/user-login/logo-kyra-full.svg"
          alt="Kyra"
          width={242}
          height={95}
          className="object-contain "
          priority
        />
      </div>
    </div>
  );
}
