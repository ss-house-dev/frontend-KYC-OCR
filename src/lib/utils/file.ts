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
