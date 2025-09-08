"use client";

import { useMutation } from "@tanstack/react-query";
import { UserResponse, type KycResponse } from "../services/api-email";
import { kycStore } from "@/lib/client/kycStore";

type Vars = { companyId: string; email: string };

export function useCreateKycRequest() {
  return useMutation<KycResponse, Error, Vars>({
    mutationKey: ["kycRequest"],
    mutationFn: (vars) => UserResponse(vars), 

    onSuccess: (data) => {
      console.log("ส่งคำขอสำเร็จ:"); 
    },
    
    onError: (err) => {
      console.error("KYC request failed:", err);
    },
  });
}
