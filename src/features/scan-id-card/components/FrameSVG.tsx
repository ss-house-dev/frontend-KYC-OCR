import Image from "next/image";

export function FrameSVG({
  color,
  className = "",
  overscanPct = 0.05,
}: {
  color: "red" | "green" | "white";   
  className?: string;
  overscanPct?: number;
}) {

  const imageSrc =
    color === "green"
      ? "/scan-idcard/frame-id-card-green.svg"
      : color === "red"
      ? "/scan-idcard/frame-id-card-red.svg"
      : "/scan-idcard/frame-id-card.svg";

  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        position: "absolute",
        top: `-${overscanPct * 100}%`,
        right: `-${overscanPct * 100}%`,
        bottom: `-${overscanPct * 100}%`,
        left: `-${overscanPct * 100}%`,
      }}
    >
      <Image
        src={imageSrc}
        alt="Scanner Frame"
        fill
        style={{ objectFit: "contain" }}
        priority
      />
    </div>
  );
}
