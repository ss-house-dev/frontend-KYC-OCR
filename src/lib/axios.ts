import axios from "axios";
import React, { useEffect, useState } from "react";

const TestUploader = () => {
  const [ocrResult, setOcrResult] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);

  const handleTestUpload = async () => {
    setOcrResult(null); 
    setIsLoading(true);
    try {
      const response = await fetch("/idcard.jpg");
      const imageBlob = await response.blob();

      const imageFile = new File([imageBlob], "idcard.jpg", {
        type: imageBlob.type,
      });

      const formData = new FormData();
      formData.append("file", imageFile);

      alert("กำลังจะส่งไฟล์ทดสอบ...");
      const result = await axios.post("/ocr/idcard", formData);

      alert("อัปโหลดสำเร็จ!");
      console.log(result.data);

    console.log("API Response Data:", result.data); 
    setOcrResult(result.data); 

    } catch (error) {
      alert("อัปโหลดล้มเหลว! ดูที่ console");
      console.error("Test upload failed:", error);
    }
  };
};

export default TestUploader;

//get
axios
  .get("https://kyra-kyc.ddns.net/ocr/idcard")
  .then((res) => {
    console.log(res.data);
  })
  .catch((error) => {
    console.error(error);
  });
