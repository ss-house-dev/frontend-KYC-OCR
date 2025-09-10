export function base64StringToFile(base64String: string, filename: string): File {
  const [meta, data] = base64String.split(",");
  const mimeMatch = meta?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const bstr = atob(data ?? base64String);
  const u8 = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
  return new File([u8], filename, { type: mime });
}
