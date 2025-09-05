"use client";
import { useMutation } from "@tanstack/react-query";
import { UserResponse, type KycResponse } from "../services/api-email";

type Vars = { companyId: string; email: string };

export function useCreateKycRequest() {
  return useMutation<KycResponse, unknown, Vars>({
    mutationKey: ["kycRequest"],
    mutationFn: (vars) => UserResponse(vars), 
  });
}
