import Cookies from "js-cookie";

// ✅ เพิ่ม flag เพื่อป้องกันการ save พร้อมกัน
const savingFlags = new Map<string, boolean>();

export function saveFormToCookie<T>(key: string, data: T) {
  // ✅ ป้องกันการ save หลายครั้งพร้อมกัน
  if (savingFlags.get(key)) {
    console.log("[Cookie] Already saving, skipping duplicate save for:", key);
    return;
  }
  
  savingFlags.set(key, true);
  
  try {
    const jsonString = JSON.stringify(data);
    console.log("[Cookie] Saving to cookie:", { 
      key, 
      dataLength: jsonString.length, 
      dataPreview: JSON.stringify(data).substring(0, 200) + "...",
      hasIdNumber: !!(data as any)?.idNumber
    });
    
    Cookies.set(key, jsonString, { expires: 1, path: "/" }); // 1 วัน
    
    // ✅ ทดสอบอ่านกลับมาทันที
    setTimeout(() => {
      const testRead = Cookies.get(key);
      console.log("[Cookie] Test read after save:", { 
        key, 
        found: !!testRead, 
        length: testRead?.length,
        hasIdInCookie: testRead?.includes('"idNumber":') && !testRead?.includes('"idNumber":""')
      });
      
      if (!testRead) {
        console.error("[Cookie] Failed to save cookie!");
      }
      
      savingFlags.set(key, false); // ✅ release flag
    }, 50);
    
  } catch (error) {
    console.error("[Cookie] Save error:", error);
    savingFlags.set(key, false); // ✅ release flag on error
    throw error;
  }
}

export function loadFormFromCookie<T>(key: string): T | null {
  try {
    console.log("[Cookie] Attempting to load:", key);
    const raw = Cookies.get(key);
    console.log("[Cookie] Raw cookie value:", { 
      key, 
      found: !!raw, 
      length: raw?.length, 
      preview: raw?.substring(0, 100) + "...",
      hasIdInRaw: raw?.includes('"idNumber":') && !raw?.includes('"idNumber":""')
    });
    
    if (!raw) {
      console.log("[Cookie] No cookie found for key:", key);
      return null;
    }
    
    const parsed = JSON.parse(raw) as T;
    console.log("[Cookie] Parsed cookie data:", {
      keys: Object.keys(parsed || {}),
      hasIdNumber: !!(parsed as any)?.idNumber,
      idNumberValue: (parsed as any)?.idNumber,
      idNumberLength: (parsed as any)?.idNumber?.length
    });
    return parsed;
  } catch (error) {
    console.error("[Cookie] Parse error:", error);
    return null;
  }
}

export function clearFormCookie(key: string) {
  console.log("[Cookie] Clearing cookie:", key);
  Cookies.remove(key, { path: "/" });
  
  // ✅ ตรวจสอบว่าลบสำเร็จหรือไม่
  const testRead = Cookies.get(key);
  console.log("[Cookie] After clear:", { key, stillExists: !!testRead });
}