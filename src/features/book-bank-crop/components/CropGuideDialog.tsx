"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

type GuideImages = {
  visible: string;
  sharp: string;
  info: string;
};

type Props = {
  onClose: () => void;
  images?: GuideImages;
};

function GuideRow({
  img,
  text,
  dark = false,
}: {
  img: string;
  text: string;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={[
          "relative shrink-0 w-20 h-20 rounded-lg overflow-hidden wr-3",
          dark ? "bg-gray-200" : "bg-[#EAF4FF]",
        ].join(" ")}
      >
        <Image
          src={img}
          alt=""
          fill
          sizes="80px"
          className="object-cover"
          priority={false}
        />
      </div>
      <p className="text-[13px] leading-snug text-gray-700">{text}</p>
    </div>
  );
}

export default function CropGuideDialog({ onClose, images }: Props) {
  const imgs: GuideImages = images ?? {
    visible: "/book-bank-crop/clearly.svg",
    sharp: "/book-bank-crop/do-not.svg",
    info: "/book-bank-crop/crop.svg",
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/45 backdrop-blur-sm">
      <div className="w-full max-w-[380px] rounded-2xl bg-white shadow-xl p-4">
        <h3 className="text-center text-[20px] font-bold text-[#0F2D73]">
          Crop Book Bank
        </h3>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please ensure the bankbook page is fully visible within the frame.
        </p>

        <div className="mt-4 space-y-4">
          <GuideRow
            img={imgs.visible}
            text="Make sure the full account page is clearly visible."
          />
          <GuideRow
            img={imgs.sharp}
            text="Keep the image sharp and readable under good lighting."
          />
          <GuideRow
            img={imgs.info}
            dark
            text="Use the page showing bank name, account holder and, account number."
          />
        </div>

        <Button
          onClick={onClose}
          className="mt-6 w-full h-11 rounded-full bg-gradient-to-b from-[#1C55D9] to-[#0F46C8] shadow-[0_10px_24px_rgba(28,85,217,0.35)]"
        >
          Got it
        </Button>
      </div>
    </div>
  );
}
