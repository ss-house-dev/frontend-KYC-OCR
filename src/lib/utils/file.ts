/** แปลงสตริงอ้างอิงรูป (blob:, data:, หรือ base64 ล้วน) → File */
export async function base64StringToFile(
  input: string,
  filename: string,
  fallbackMime = "image/jpeg"
): Promise<File> {
  try {
    // --- 1) blob URL ---
    if (input.startsWith("blob:")) {
      console.log("[base64StringToFile] blob URL detected");
      const resp = await fetch(input);
      const blob = await resp.blob();
      const type = blob.type || fallbackMime;
      console.log("[base64StringToFile] blob size/type:", blob.size, type);
      return new File([blob], filename, { type });
    }

    // --- 2) data URL ---
    if (input.startsWith("data:")) {
      console.log("[base64StringToFile] data URL detected");
      const [meta, data] = input.split(",", 2);
      const mimeMatch = /data:(.*?);base64/i.exec(meta);
      const mime = mimeMatch?.[1] || fallbackMime;

      // decode base64 ส่วนข้อมูล
      const bin = atob(data);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      console.log("[base64StringToFile] data URL bytes:", u8.length, "mime:", mime);
      return new File([u8], filename, { type: mime });
    }

    // --- 3) base64 ล้วน (รองรับ URL-safe + เติม padding) ---
    console.log("[base64StringToFile] raw base64 detected (no scheme)");
    let b64 = input.replace(/[\r\n\s]/g, "");      // ตัดช่องว่าง/newline
    b64 = b64.replace(/-/g, "+").replace(/_/g, "/"); // URL-safe → standard
    const pad = b64.length % 4;
    if (pad) b64 = b64 + "=".repeat(4 - pad);

    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    console.log("[base64StringToFile] raw base64 bytes:", u8.length, "mime:", fallbackMime);
    return new File([u8], filename, { type: fallbackMime });
  } catch (err) {
    console.error("[base64StringToFile] failed:", err);
    throw new Error("Unsupported/invalid image string for base64StringToFile");
  }
}


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
