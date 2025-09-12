import { z } from "zod";

const thaiPattern = /^[\u0E00-\u0E7F\s]+$/;
const engPattern = /^[A-Za-z\s]+$/;
const accountNumberPattern = /^[0-9-]+$/;

export const bookbankFormSchema = z.object({
  bank: z
    .string()
    .min(1),

  branchNameThai: z
    .string()
    .min(1, "Unable to extract data. Kindly rescan your document.")
    .refine(
      (val) => thaiPattern.test(val),
      "Invalid format. Please enter the correct characters."
    ),

  accountNameThai: z
    .string()
    .min(1, "This field is needed.")
    .refine(
      (val) => thaiPattern.test(val),
      "Invalid format. Please enter the correct characters."
    ),

  accountNameEng: z
    .string()
    .min(1, "This field is needed.")
    .refine(
      (val) => engPattern.test(val),
      "Invalid format. Please enter the correct characters."
    ),

  accountNumber: z
    .string()
    .min(1, "Unable to extract data. Kindly rescan your document.")
    .max(13)
    .refine(
      (val) => accountNumberPattern.test(val),
      ""
    )
});

export type BookBankFormData = z.infer<typeof bookbankFormSchema>;