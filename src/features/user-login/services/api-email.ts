import axios from "axios";

export type KycResponse = { id?: string };

type UserResponseArgs = {
  companyId: string;
  email: string;
};

export async function UserResponse({
  companyId,
  email,
}: UserResponseArgs): Promise<KycResponse> {
  const { data } = await axios.post<KycResponse>(
    "/kyc/requests",
    { companyId, email }, 
  );
  return data;
}
