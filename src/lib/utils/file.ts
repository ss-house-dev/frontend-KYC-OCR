export function base64StringToFile(base64String: string, filename: string, fallbackMime = "image/jpeg"): File {
  let mime = fallbackMime;
  let b64 = base64String;

  if (base64String.startsWith("data:")) {
    const [meta, data] = base64String.split(",");
    const mimeMatch = meta.match(/:(.*?);/);
    if (mimeMatch) mime = mimeMatch[1];
    b64 = data;
  }

  const bstr = atob(b64);
  const u8 = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);

  return new File([u8], filename, { type: mime });
}

// src/lib/utils/file.ts
export async function dataURLtoFile(
  dataUrl: string,
  filename: string
): Promise<File | null> {
  try {
    // --- กรณี blob URL ---
    if (dataUrl.startsWith("blob:")) {
      // fetch blob จาก URL
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      return new File([blob], filename, { type: blob.type });
    }

    // --- กรณี data URL base64 ---
    const arr = dataUrl.split(",");
    if (arr.length !== 2) throw new Error("Invalid data URL format");

    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Invalid MIME type in data URL");
    const mime = mimeMatch[1];

    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }

    return new File([u8arr], filename, { type: mime });
  } catch (err) {
    console.warn("Invalid dataURL/blob:", dataUrl, err);
    return null;
  }
}
