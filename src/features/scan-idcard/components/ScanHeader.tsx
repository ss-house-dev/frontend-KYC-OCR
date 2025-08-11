export function ScanHeader({ sharpnessMsg }: { sharpnessMsg: string }) {
  return (
    <div className="absolute -top-20 left-2 right-2 flex justify-center z-30">
      <div className="text-center p-2">
        <p className="font-bold text-base text-white">Scan ID Card</p>
        <p className="text-sm text-white mt-1">{sharpnessMsg}</p>
      </div>
    </div>
  );
}
