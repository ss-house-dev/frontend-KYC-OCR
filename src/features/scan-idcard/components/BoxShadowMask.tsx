export function BoxShadowMask({
  radius = 14,
  inset = { top: "-0.5%", right: "4%", bottom: "-0.5%", left: "4%" },
  opacity = 0.55,
  className = "",
}: {
  radius?: number;
  inset?: { top?: string; right?: string; bottom?: string; left?: string };
  opacity?: number; 
  className?: string;
}) {
  const { top = "0%", right = "0%", bottom = "0%", left = "0%" } = inset;
  return (
    <div
      className={`absolute rounded-[${radius}px] pointer-events-none ${className}`}
      style={{
        top,
        right,
        bottom,
        left,
        boxShadow: `0 0 0 2000px rgba(0,0,0,${opacity})`,
        borderRadius: `${radius}px`,
      }}
    />
  );
}
