import { z } from "zod";

const thaiNamePattern = /^(?!.*[\u0E50-\u0E59])[\u0E00-\u0E7F\s]+$/;
const engNamePattern = /^[A-Za-z\s]+$/;
const thaiDateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

export const idCardFormSchema = z.object({
  idNumber: z
    .string()
    .min(1, "Unable to extract data. Kindly rescan your document."),

  idNumberFormatted: z
    .string()
    .min(1, "Unable to extract data. Kindly rescan your document.")
    .refine((val) => {
      const digitsOnly = val.replace(/-/g, "");
      return digitsOnly.length === 13;
    }, "ID number must be exactly 13 digits")
    .refine((val) => {
      const digitsOnly = val.replace(/-/g, "");
      return /^[0-9]+$/.test(digitsOnly);
    }, "ID number must contain only digits"),

  titleThai: z.string().min(1, "This field is needed"),

  firstNameThai: z
    .string()
    .min(1, "This field is needed.")
    .max(50, "Cannot exceed 50 characters")
    .refine(
      (val) => thaiNamePattern.test(val),
      "Invalid format. Please enter the correct characters."
    ),

  lastNameThai: z
    .string()
    .min(1, "This field is needed.")
    .max(50, "Cannot exceed 50 characters")
    .refine(
      (val) => thaiNamePattern.test(val),
      "Invalid format. Please enter the correct characters."
    ),

  firstNameEng: z
    .string()
    .min(1, "This field is needed.")
    .max(50, "Cannot exceed 50 characters")
    .refine(
      (val) => engNamePattern.test(val),
      "Invalid format. Please enter the correct characters."
    ),

  lastNameEng: z
    .string()
    .min(1, "This field is needed.")
    .max(50, "Cannot exceed 50 characters")
    .refine(
      (val) => engNamePattern.test(val),
      "Invalid format. Please enter the correct characters."
    ),

  birthDateThai: z
    .string()
    .min(1, "This field is needed.")
    .regex(thaiDateRegex, "Date must be in DD/MM/YYYY format"),

  issueDateThai: z
    .string()
    .min(1, "This field is needed.")
    .regex(thaiDateRegex, "Date must be in DD/MM/YYYY format"),

  expiryDateThai: z
    .string()
    .min(1, "This field is needed.")
    .regex(thaiDateRegex, "Date must be in DD/MM/YYYY format"),

  address: z
    .string()
    .min(1, "This field is needed.")
    .max(200, "Cannot exceed 200 characters"),

  laserId: z.string().regex(/^[A-Za-z]{2}\d-\d{7}-\d{2}$/),

  errors: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      })
    )
    .optional(),
});

export type IdCardFormData = z.infer<typeof idCardFormSchema>;
