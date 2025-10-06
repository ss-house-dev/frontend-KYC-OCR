export async function cropFaceFromIdCard(
  dataUrl: string,
  cropBox?: { x: number; y: number; width: number; height: number }
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = dataUrl;
    
    img.onload = () => {
      // ตำแหน่งรูปหน้าในบัตรประชาชนไทยมาตรฐาน (เป็น % ของขนาดรูป)
      // ปรับค่าเหล่านี้ให้เหมาะกับ layout ของบัตรจริง
      const box = cropBox || {
        x: Math.floor(img.width * 0.70),      // 75% จากซ้าย
        y: Math.floor(img.height * 0.5),     // 40% จากบน
        width: Math.floor(img.width * 0.25),  // กว้าง 25%
        height: Math.floor(img.height * 0.5), // สูง 50%
      };

      console.log("🎯 Crop box:", box);
      console.log("📐 Image size:", { width: img.width, height: img.height });

      const canvas = document.createElement("canvas");
      canvas.width = box.width;
      canvas.height = box.height;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        return reject(new Error("Canvas not supported"));
      }

      // Crop รูป
      ctx.drawImage(
        img,
        box.x, box.y, box.width, box.height,  // source
        0, 0, box.width, box.height            // destination
      );

      // แปลงเป็น Blob แล้วสร้าง File
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error("Cannot create blob"));
          }
          const file = new File([blob], "face-cropped.jpg", {
            type: "image/jpeg",
          });
          console.log("✅ Cropped file created:", {
            size: file.size,
            type: file.type,
          });
          resolve(file);
        },
        "image/jpeg",
        0.95 
      );
    };

    img.onerror = () => reject(new Error("Image load failed"));
  });
}